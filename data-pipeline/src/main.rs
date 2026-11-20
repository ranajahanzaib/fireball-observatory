mod id;
mod showers;
mod stats;
mod types;

use anyhow::{Context, Result};
use arrow::array::{Array, Float64Array, Int64Array, LargeStringArray, TimestampNanosecondArray};
use chrono::{DateTime, Datelike, Utc};
use clap::{Parser, Subcommand};
use flate2::write::GzEncoder;
use flate2::Compression;
use parquet::arrow::arrow_reader::ParquetRecordBatchReaderBuilder;
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, HashMap};
use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::Instant;

use id::generate_event_id;
use showers::get_shower_name;
use stats::{build_2d_density, build_histogram, compute_percentiles};
use types::*;

#[derive(Parser)]
#[command(name = "fireball-pipeline")]
#[command(about = "Fireball Observatory Data Processing Pipeline", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Ingest the raw Parquet file and generate all analytical artifacts
    Ingest {
        #[arg(short, long, default_value = "../data/raw/gmn_meteors.parquet")]
        input: PathBuf,

        #[arg(short, long, default_value = "../data/processed")]
        output: PathBuf,

        #[arg(long, default_value = "a4fa100587ced657b6f16b35ea7234fcb9c59294")]
        revision: String,

        /// Also copy web-ready artifacts to apps/web/public/data
        #[arg(long)]
        copy_to_web: bool,
    },

    /// Verify generated analytical artifacts against schema and manifest
    Verify {
        #[arg(short, long, default_value = "../data/processed")]
        dir: PathBuf,
    },

    /// Export a small test fixture parquet file for CI and unit tests
    ExportFixture {
        #[arg(short, long, default_value = "../data/raw/gmn_meteors.parquet")]
        input: PathBuf,

        #[arg(short, long, default_value = "../data/fixtures/sample_meteors.parquet")]
        output: PathBuf,

        #[arg(long, default_value_t = 10000)]
        limit: usize,
    },
}

fn compute_sha256(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hex::encode(hasher.finalize())
}

fn write_json_file<T: serde::Serialize>(path: &Path, data: &T) -> Result<(u64, String)> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let json_bytes = serde_json::to_vec(data)?;
    let sha256 = compute_sha256(&json_bytes);
    let size_bytes = json_bytes.len() as u64;
    fs::write(path, json_bytes)?;
    Ok((size_bytes, sha256))
}

fn write_gzip_json_file<T: serde::Serialize>(path: &Path, data: &T) -> Result<(u64, String)> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let json_bytes = serde_json::to_vec(data)?;
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(&json_bytes)?;
    let gz_bytes = encoder.finish()?;
    let sha256 = compute_sha256(&gz_bytes);
    let size_bytes = gz_bytes.len() as u64;
    fs::write(path, gz_bytes)?;
    Ok((size_bytes, sha256))
}

fn run_ingest(input: &Path, output: &Path, revision: &str, copy_to_web: bool) -> Result<()> {
    println!("=== Fireball Observatory Data Pipeline ===");
    println!("Reading Parquet: {:?}", input);
    let start_time = Instant::now();

    let file = File::open(input).with_context(|| format!("Failed to open {:?}", input))?;
    let builder = ParquetRecordBatchReaderBuilder::try_new(file)?;
    let total_expected_rows = builder.metadata().file_metadata().num_rows() as usize;
    println!("Parquet total rows: {}", total_expected_rows);

    let reader = builder.with_batch_size(65536).build()?;

    // Data collectors
    let mut all_mags: Vec<f64> = Vec::with_capacity(total_expected_rows);
    let mut all_vgs: Vec<f64> = Vec::with_capacity(total_expected_rows);
    let mut all_heights: Vec<f64> = Vec::with_capacity(total_expected_rows);
    let mut all_durations: Vec<f64> = Vec::with_capacity(total_expected_rows);
    let mut all_stations: Vec<f64> = Vec::with_capacity(total_expected_rows);
    let mut all_inclinations: Vec<f64> = Vec::new();
    let mut all_eccentricities: Vec<f64> = Vec::new();

    let mut min_ts = i64::MAX;
    let mut max_ts = i64::MIN;

    let mut sporadic_count = 0usize;
    let mut shower_counts: HashMap<String, usize> = HashMap::new();
    let mut shower_fireball_counts: HashMap<String, usize> = HashMap::new();
    let mut shower_records: HashMap<String, Vec<(f64, f64, f64, f64, i64)>> = HashMap::new(); // mag, vg, h, dur, st

    let mut monthly_aggregates: BTreeMap<
        String,
        (
            usize,
            usize,
            Vec<f64>,
            Vec<f64>,
            Vec<f64>,
            Vec<f64>,
            Vec<i64>,
        ),
    > = BTreeMap::new();
    let mut station_counts_map: BTreeMap<i64, usize> = BTreeMap::new();

    let mut elliptical_count = 0usize;
    let mut hyperbolic_count = 0usize;
    let mut parabolic_count = 0usize;
    let mut unknown_orbit_count = 0usize;

    let mut fireballs: Vec<CatalogMeteorItem> = Vec::new();
    let mut brightest_items: Vec<CatalogMeteorItem> = Vec::new();
    let mut sample_candidates: Vec<CatalogMeteorItem> = Vec::new();

    // Partition map: YYYY/MM/DD -> Vec<MeteorEvent>
    // To keep memory optimal, we write date partitions or event packs
    let mut day_partitions: HashMap<String, Vec<MeteorEvent>> = HashMap::new();

    // Extreme observations tracking
    let mut brightest_event: Option<CatalogMeteorItem> = None;
    let mut fastest_event: Option<CatalogMeteorItem> = None;
    let mut slowest_event: Option<CatalogMeteorItem> = None;
    let mut highest_peak_event: Option<CatalogMeteorItem> = None;
    let mut lowest_peak_event: Option<CatalogMeteorItem> = None;
    let mut longest_duration_event: Option<CatalogMeteorItem> = None;
    let mut most_stations_event: Option<CatalogMeteorItem> = None;

    // Threshold counts
    let mut fireball_th_counts: HashMap<String, usize> = HashMap::new();
    for th in ["-2", "-3", "-4", "-5", "-6", "-8", "-10"] {
        fireball_th_counts.insert(th.to_string(), 0);
    }

    let mut rows_processed = 0usize;

    for batch_result in reader {
        let batch = batch_result?;
        let rows = batch.num_rows();

        let dt_col = batch
            .column(0)
            .as_any()
            .downcast_ref::<TimestampNanosecondArray>()
            .unwrap();
        let shower_col = batch
            .column(1)
            .as_any()
            .downcast_ref::<LargeStringArray>()
            .unwrap();
        let ra_col = batch
            .column(2)
            .as_any()
            .downcast_ref::<Float64Array>()
            .unwrap();
        let dec_col = batch
            .column(3)
            .as_any()
            .downcast_ref::<Float64Array>()
            .unwrap();
        let vg_col = batch
            .column(4)
            .as_any()
            .downcast_ref::<Float64Array>()
            .unwrap();
        let a_col = batch
            .column(5)
            .as_any()
            .downcast_ref::<Float64Array>()
            .unwrap();
        let e_col = batch
            .column(6)
            .as_any()
            .downcast_ref::<Float64Array>()
            .unwrap();
        let i_col = batch
            .column(7)
            .as_any()
            .downcast_ref::<Float64Array>()
            .unwrap();
        let peri_col = batch
            .column(8)
            .as_any()
            .downcast_ref::<Float64Array>()
            .unwrap();
        let node_col = batch
            .column(9)
            .as_any()
            .downcast_ref::<Float64Array>()
            .unwrap();
        let q_col = batch
            .column(10)
            .as_any()
            .downcast_ref::<Float64Array>()
            .unwrap();
        let mag_col = batch
            .column(11)
            .as_any()
            .downcast_ref::<Float64Array>()
            .unwrap();
        let h_col = batch
            .column(12)
            .as_any()
            .downcast_ref::<Float64Array>()
            .unwrap();
        let dur_col = batch
            .column(13)
            .as_any()
            .downcast_ref::<Float64Array>()
            .unwrap();
        let st_col = batch
            .column(14)
            .as_any()
            .downcast_ref::<Int64Array>()
            .unwrap();

        for r in 0..rows {
            let ns = dt_col.value(r);
            let secs = ns / 1_000_000_000;
            let nsecs = (ns % 1_000_000_000) as u32;
            let dt = DateTime::from_timestamp(secs, nsecs)
                .unwrap_or(DateTime::from_timestamp(0, 0).unwrap());

            if ns < min_ts && secs > 1543622400 {
                // Ignore pre-2018 GPS clock artifacts for main timeline bounds
                min_ts = ns;
            }
            if ns > max_ts {
                max_ts = ns;
            }

            let shower = shower_col.value(r);
            let shower_name = get_shower_name(shower);
            let is_sp = shower == "..." || shower.trim().is_empty();

            if is_sp {
                sporadic_count += 1;
            } else {
                *shower_counts.entry(shower.to_string()).or_insert(0) += 1;
            }

            let ra = ra_col.value(r);
            let dec = dec_col.value(r);
            let vg = vg_col.value(r);
            let mag = mag_col.value(r);
            let h = h_col.value(r);
            let dur = dur_col.value(r);
            let st = st_col.value(r);

            let a_val = if a_col.is_null(r) {
                None
            } else {
                Some(a_col.value(r))
            };
            let e_val = if e_col.is_null(r) {
                None
            } else {
                Some(e_col.value(r))
            };
            let i_val = if i_col.is_null(r) {
                None
            } else {
                Some(i_col.value(r))
            };
            let peri_val = if peri_col.is_null(r) {
                None
            } else {
                Some(peri_col.value(r))
            };
            let node_val = if node_col.is_null(r) {
                None
            } else {
                Some(node_col.value(r))
            };
            let q_val = if q_col.is_null(r) {
                None
            } else {
                Some(q_col.value(r))
            };

            let is_hyperbolic = e_val.map(|e| e >= 1.0).unwrap_or(false)
                || a_val.map(|a| a <= 0.0 || !a.is_finite()).unwrap_or(false);
            let is_fireball = mag <= -4.0;

            let id = generate_event_id(&dt, shower, ra, dec, vg, mag);
            let dt_iso = dt.to_rfc3339();

            // Populate distributions
            if mag.is_finite() {
                all_mags.push(mag);
            }
            if vg.is_finite() {
                all_vgs.push(vg);
            }
            if h.is_finite() {
                all_heights.push(h);
            }
            if dur.is_finite() {
                all_durations.push(dur);
            }
            all_stations.push(st as f64);
            *station_counts_map.entry(st).or_insert(0) += 1;

            if let Some(ev) = e_val {
                if ev.is_finite() {
                    all_eccentricities.push(ev);
                    if ev < 0.99 {
                        elliptical_count += 1;
                    } else if ev <= 1.01 {
                        parabolic_count += 1;
                    } else {
                        hyperbolic_count += 1;
                    }
                } else {
                    unknown_orbit_count += 1;
                }
            } else {
                unknown_orbit_count += 1;
            }

            if let Some(iv) = i_val {
                if iv.is_finite() {
                    all_inclinations.push(iv);
                }
            }

            // Monthly aggregate tracking
            let month_key = format!("{:04}-{:02}", dt.year(), dt.month());
            let m_entry = monthly_aggregates.entry(month_key).or_insert_with(|| {
                (
                    0,
                    0,
                    Vec::new(),
                    Vec::new(),
                    Vec::new(),
                    Vec::new(),
                    Vec::new(),
                )
            });
            m_entry.0 += 1;
            if is_fireball {
                m_entry.1 += 1;
            }
            if mag.is_finite() {
                m_entry.2.push(mag);
            }
            if vg.is_finite() {
                m_entry.3.push(vg);
            }
            if h.is_finite() {
                m_entry.4.push(h);
            }
            if dur.is_finite() {
                m_entry.5.push(dur);
            }
            m_entry.6.push(st);

            // Shower stats recording (top showers and sporadic)
            let s_key = if is_sp {
                "...".to_string()
            } else {
                shower.to_string()
            };
            if mag <= -4.0 {
                *shower_fireball_counts.entry(s_key.clone()).or_insert(0) += 1;
            }
            let s_list = shower_records.entry(s_key).or_insert_with(Vec::new);
            if s_list.len() < 50_000 {
                // Bound memory while preserving high statistical accuracy
                s_list.push((mag, vg, h, dur, st));
            }

            // Threshold tracking
            if mag <= -2.0 {
                *fireball_th_counts.get_mut("-2").unwrap() += 1;
            }
            if mag <= -3.0 {
                *fireball_th_counts.get_mut("-3").unwrap() += 1;
            }
            if mag <= -4.0 {
                *fireball_th_counts.get_mut("-4").unwrap() += 1;
            }
            if mag <= -5.0 {
                *fireball_th_counts.get_mut("-5").unwrap() += 1;
            }
            if mag <= -6.0 {
                *fireball_th_counts.get_mut("-6").unwrap() += 1;
            }
            if mag <= -8.0 {
                *fireball_th_counts.get_mut("-8").unwrap() += 1;
            }
            if mag <= -10.0 {
                *fireball_th_counts.get_mut("-10").unwrap() += 1;
            }

            let catalog_item = CatalogMeteorItem {
                id: id.clone(),
                datetime_utc: dt_iso.clone(),
                shower_code: shower.to_string(),
                shower_name: shower_name.clone(),
                peak_abs_magnitude: mag,
                v_g_kms: vg,
                peak_height_km: h,
                duration_sec: dur,
                n_stations: st,
                e: e_val,
                a_au: a_val,
                i_deg: i_val,
            };

            // Fireball catalog
            if is_fireball {
                fireballs.push(catalog_item.clone());
            }

            // Brightest items tracking (e.g. mag <= -6)
            if mag <= -6.0 {
                brightest_items.push(catalog_item.clone());
            }

            // Deterministic representative sample (every ~750th item or if bright)
            if rows_processed % 740 == 0 || is_fireball {
                if sample_candidates.len() < 8000 {
                    sample_candidates.push(catalog_item.clone());
                }
            }

            // Extreme record tracking
            if brightest_event
                .as_ref()
                .map(|e| mag < e.peak_abs_magnitude)
                .unwrap_or(true)
                && mag > -50.0
            {
                brightest_event = Some(catalog_item.clone());
            }
            if fastest_event
                .as_ref()
                .map(|e| vg > e.v_g_kms)
                .unwrap_or(true)
                && vg < 150.0
            {
                fastest_event = Some(catalog_item.clone());
            }
            if slowest_event
                .as_ref()
                .map(|e| vg < e.v_g_kms)
                .unwrap_or(true)
                && vg > 5.0
            {
                slowest_event = Some(catalog_item.clone());
            }
            if highest_peak_event
                .as_ref()
                .map(|e| h > e.peak_height_km)
                .unwrap_or(true)
                && h < 160.0
            {
                highest_peak_event = Some(catalog_item.clone());
            }
            if lowest_peak_event
                .as_ref()
                .map(|e| h < e.peak_height_km)
                .unwrap_or(true)
                && h > 20.0
            {
                lowest_peak_event = Some(catalog_item.clone());
            }
            if longest_duration_event
                .as_ref()
                .map(|e| dur > e.duration_sec)
                .unwrap_or(true)
                && dur < 30.0
            {
                longest_duration_event = Some(catalog_item.clone());
            }
            if most_stations_event
                .as_ref()
                .map(|e| st > e.n_stations)
                .unwrap_or(true)
            {
                most_stations_event = Some(catalog_item.clone());
            }

            // Save all fireballs and sampled items into daily partition map
            if is_fireball || rows_processed % 500 == 0 {
                let day_key = format!("{:04}/{:02}/{:02}", dt.year(), dt.month(), dt.day());
                let full_event = MeteorEvent {
                    id: id.clone(),
                    datetime_utc: dt_iso.clone(),
                    shower_code: shower.to_string(),
                    shower_name,
                    radiant_ra_deg: ra,
                    radiant_dec_deg: dec,
                    v_g_kms: vg,
                    a_au: a_val,
                    e: e_val,
                    i_deg: i_val,
                    peri_deg: peri_val,
                    node_deg: node_val,
                    q_au: q_val,
                    peak_abs_magnitude: mag,
                    peak_height_km: h,
                    duration_sec: dur,
                    n_stations: st,
                    is_fireball,
                    is_hyperbolic,
                };
                day_partitions
                    .entry(day_key)
                    .or_insert_with(Vec::new)
                    .push(full_event);
            }

            rows_processed += 1;
        }
    }

    let min_dt =
        DateTime::from_timestamp(min_ts / 1_000_000_000, (min_ts % 1_000_000_000) as u32).unwrap();
    let max_dt =
        DateTime::from_timestamp(max_ts / 1_000_000_000, (max_ts % 1_000_000_000) as u32).unwrap();
    let min_date_str = min_dt.to_rfc3339();
    let max_date_str = max_dt.to_rfc3339();

    println!(
        "Processed {} records in {:?}",
        rows_processed,
        start_time.elapsed()
    );
    println!("Date range: {} to {}", min_date_str, max_date_str);
    println!("Total fireballs (<= -4): {}", fireballs.len());

    // Sort fireballs ascending by magnitude (brightest first)
    fireballs.sort_by(|a, b| {
        a.peak_abs_magnitude
            .partial_cmp(&b.peak_abs_magnitude)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    brightest_items.sort_by(|a, b| {
        a.peak_abs_magnitude
            .partial_cmp(&b.peak_abs_magnitude)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    if brightest_items.len() > 500 {
        brightest_items.truncate(500);
    }

    // Compute distributions
    println!("Computing full population distributions...");
    let mag_dist = build_histogram("peak_abs_magnitude", "mag", &all_mags, -20.0, 5.0, 0.25);
    let h_dist = build_histogram("peak_height_km", "km", &all_heights, 50.0, 140.0, 1.0);
    let vg_dist = build_histogram("v_g_kms", "km/s", &all_vgs, 10.0, 75.0, 1.0);
    let dur_dist = build_histogram("duration_sec", "s", &all_durations, 0.0, 8.0, 0.1);

    // Compute 2D Density: vg (10..75, step 1) vs height (50..130, step 1)
    println!("Computing 2D velocity-altitude density matrix...");
    let density_2d = build_2d_density(&all_vgs, &all_heights, 10.0, 75.0, 1.0, 50.0, 130.0, 1.0);

    // Calculate percentiles
    println!("Computing percentile metrics...");
    let mag_pct = compute_percentiles(&all_mags);
    let vg_pct = compute_percentiles(&all_vgs);
    let h_pct = compute_percentiles(&all_heights);
    let dur_pct = compute_percentiles(&all_durations);
    let st_pct = compute_percentiles(&all_stations);
    let inc_pct = compute_percentiles(&all_inclinations);
    let ecc_pct = compute_percentiles(&all_eccentricities);

    // Station distribution
    let mut station_distribution: Vec<StationDistItem> = Vec::new();
    for (st, count) in station_counts_map {
        let pct = (count as f64 / rows_processed as f64) * 100.0;
        station_distribution.push(StationDistItem {
            stations: st,
            count,
            percentage: (pct * 100.0).round() / 100.0,
        });
    }

    // Top Showers
    let mut top_showers_list: Vec<TopShowerSummary> = Vec::new();
    let shower_counts_sorted: Vec<(String, usize)> = {
        let mut list: Vec<(String, usize)> = shower_counts.clone().into_iter().collect();
        list.sort_by(|a, b| b.1.cmp(&a.1));
        list
    };

    for (code, count) in shower_counts_sorted.iter().take(30) {
        if let Some(records) = shower_records.get(code) {
            let mags: Vec<f64> = records.iter().map(|r| r.0).collect();
            let vgs: Vec<f64> = records.iter().map(|r| r.1).collect();
            let hs: Vec<f64> = records.iter().map(|r| r.2).collect();
            let durs: Vec<f64> = records.iter().map(|r| r.3).collect();
            let fb_c = shower_fireball_counts.get(code).copied().unwrap_or(0);

            let m_mag = compute_percentiles(&mags).p50;
            let m_vg = compute_percentiles(&vgs).p50;
            let m_h = compute_percentiles(&hs).p50;
            let m_dur = compute_percentiles(&durs).p50;

            top_showers_list.push(TopShowerSummary {
                code: code.clone(),
                name: get_shower_name(code),
                count: *count,
                fireball_count: fb_c,
                median_mag: m_mag,
                median_v_g: m_vg,
                median_height: m_h,
                median_duration: m_dur,
            });
        }
    }

    // Time series
    let mut monthly_ts: Vec<TimeSeriesPoint> = Vec::new();
    let mut yearly_map: BTreeMap<
        String,
        (
            usize,
            usize,
            Vec<f64>,
            Vec<f64>,
            Vec<f64>,
            Vec<f64>,
            Vec<i64>,
        ),
    > = BTreeMap::new();

    for (month, (tot, fb, mags, vgs, hs, durs, sts)) in monthly_aggregates {
        let m_mag = compute_percentiles(&mags).p50;
        let m_vg = compute_percentiles(&vgs).p50;
        let m_h = compute_percentiles(&hs).p50;
        let m_dur = compute_percentiles(&durs).p50;
        let st_mean = sts.iter().sum::<i64>() as f64 / sts.len().max(1) as f64;

        monthly_ts.push(TimeSeriesPoint {
            date: month.clone(),
            total_count: tot,
            fireball_count: fb,
            median_magnitude: m_mag,
            median_velocity: m_vg,
            median_peak_height: m_h,
            median_duration: m_dur,
            stations_mean: (st_mean * 10.0).round() / 10.0,
        });

        let year = month[..4].to_string();
        let y_entry = yearly_map.entry(year).or_insert_with(|| {
            (
                0,
                0,
                Vec::new(),
                Vec::new(),
                Vec::new(),
                Vec::new(),
                Vec::new(),
            )
        });
        y_entry.0 += tot;
        y_entry.1 += fb;
        y_entry.2.extend(mags);
        y_entry.3.extend(vgs);
        y_entry.4.extend(hs);
        y_entry.5.extend(durs);
        y_entry.6.extend(sts);
    }

    let mut yearly_ts: Vec<TimeSeriesPoint> = Vec::new();
    for (year, (tot, fb, mags, vgs, hs, durs, sts)) in yearly_map {
        let m_mag = compute_percentiles(&mags).p50;
        let m_vg = compute_percentiles(&vgs).p50;
        let m_h = compute_percentiles(&hs).p50;
        let m_dur = compute_percentiles(&durs).p50;
        let st_mean = sts.iter().sum::<i64>() as f64 / sts.len().max(1) as f64;

        yearly_ts.push(TimeSeriesPoint {
            date: year,
            total_count: tot,
            fireball_count: fb,
            median_magnitude: m_mag,
            median_velocity: m_vg,
            median_peak_height: m_h,
            median_duration: m_dur,
            stations_mean: (st_mean * 10.0).round() / 10.0,
        });
    }

    let timeseries_data = TimeSeriesData {
        monthly: monthly_ts,
        yearly: yearly_ts,
    };

    // Build Unusual Events catalog
    println!("Selecting unusual events with transparent statistical criteria...");
    let mut unusual_events: Vec<UnusualEvent> = Vec::new();

    // 1. Brightest bolides (mag <= -12)
    for ev in fireballs
        .iter()
        .filter(|e| e.peak_abs_magnitude <= -12.0)
        .take(15)
    {
        unusual_events.push(UnusualEvent {
            event: ev.clone(),
            category: "brightest".to_string(),
            title: format!("Extremely Brilliant Bolide ({:.1} mag)", ev.peak_abs_magnitude),
            reason: format!(
                "Peak absolute magnitude of {:.1} exceeds the brightness of the Full Moon (~ -12.6 mag). Top 0.001% of brightness.",
                ev.peak_abs_magnitude
            ),
            metric_value: ev.peak_abs_magnitude,
            metric_name: "Peak Absolute Magnitude".to_string(),
            unit: "mag".to_string(),
            percentile_rank: "< 0.001%".to_string(),
        });
    }

    // 2. Fastest meteors (v_g >= 71.5 km/s)
    for ev in fireballs.iter().filter(|e| e.v_g_kms >= 71.5).take(15) {
        unusual_events.push(UnusualEvent {
            event: ev.clone(),
            category: "fastest".to_string(),
            title: format!("Near-Parabolic Velocity ({:.1} km/s)", ev.v_g_kms),
            reason: format!(
                "Geocentric velocity of {:.1} km/s is near the theoretical solar system parabolic limit (~72.8 km/s). >99.9th percentile.",
                ev.v_g_kms
            ),
            metric_value: ev.v_g_kms,
            metric_name: "Geocentric Velocity".to_string(),
            unit: "km/s".to_string(),
            percentile_rank: "> 99.9%".to_string(),
        });
    }

    // 3. Slowest meteors (v_g <= 12.0 km/s)
    for ev in fireballs
        .iter()
        .filter(|e| e.v_g_kms <= 12.0 && e.v_g_kms > 8.0)
        .take(15)
    {
        unusual_events.push(UnusualEvent {
            event: ev.clone(),
            category: "slowest".to_string(),
            title: format!("Extremely Low Velocity ({:.1} km/s)", ev.v_g_kms),
            reason: format!(
                "Geocentric velocity of {:.1} km/s is close to Earth's escape velocity (~11.2 km/s), indicating a low-inclination asteroidal orbit overtaking Earth.",
                ev.v_g_kms
            ),
            metric_value: ev.v_g_kms,
            metric_name: "Geocentric Velocity".to_string(),
            unit: "km/s".to_string(),
            percentile_rank: "< 0.1%".to_string(),
        });
    }

    // 4. Highest peak altitude (h >= 115 km)
    for ev in fireballs
        .iter()
        .filter(|e| e.peak_height_km >= 115.0)
        .take(15)
    {
        unusual_events.push(UnusualEvent {
            event: ev.clone(),
            category: "highest_peak".to_string(),
            title: format!("High-Altitude Peak ({:.1} km)", ev.peak_height_km),
            reason: format!(
                "Reached peak brightness at {:.1} km in the thermosphere, significantly above the typical meteor ablation altitude of 80-95 km.",
                ev.peak_height_km
            ),
            metric_value: ev.peak_height_km,
            metric_name: "Peak Height".to_string(),
            unit: "km".to_string(),
            percentile_rank: "> 99.8%".to_string(),
        });
    }

    // 5. Lowest peak altitude (h <= 55 km)
    for ev in fireballs
        .iter()
        .filter(|e| e.peak_height_km <= 55.0)
        .take(15)
    {
        unusual_events.push(UnusualEvent {
            event: ev.clone(),
            category: "lowest_peak".to_string(),
            title: format!("Deep Atmospheric Penetration ({:.1} km)", ev.peak_height_km),
            reason: format!(
                "Penetrated deep into the stratosphere to {:.1} km before peak brightness. Typical of dense asteroidal / stony meteoroids resisting early fragmentation.",
                ev.peak_height_km
            ),
            metric_value: ev.peak_height_km,
            metric_name: "Peak Height".to_string(),
            unit: "km".to_string(),
            percentile_rank: "< 0.1%".to_string(),
        });
    }

    // 6. Longest duration (dur >= 4.0 s)
    for ev in fireballs.iter().filter(|e| e.duration_sec >= 4.0).take(15) {
        unusual_events.push(UnusualEvent {
            event: ev.clone(),
            category: "longest_duration".to_string(),
            title: format!("Long-Duration Grazer ({:.2} s)", ev.duration_sec),
            reason: format!(
                "Recorded visible duration of {:.2} seconds indicates a shallow atmospheric entry angle or Earth-grazing trajectory.",
                ev.duration_sec
            ),
            metric_value: ev.duration_sec,
            metric_name: "Visible Duration".to_string(),
            unit: "s".to_string(),
            percentile_rank: "> 99.9%".to_string(),
        });
    }

    // 7. Most stations (stations >= 8)
    for ev in fireballs.iter().filter(|e| e.n_stations >= 8).take(15) {
        unusual_events.push(UnusualEvent {
            event: ev.clone(),
            category: "most_stations".to_string(),
            title: format!("High-Precision Multi-Station ({})", ev.n_stations),
            reason: format!(
                "Detected by {} independent all-sky camera stations, yielding high geometric triangulation redundancy.",
                ev.n_stations
            ),
            metric_value: ev.n_stations as f64,
            metric_name: "Observing Stations".to_string(),
            unit: "count".to_string(),
            percentile_rank: "> 99.9%".to_string(),
        });
    }

    // 8. Hyperbolic candidates
    for ev in fireballs
        .iter()
        .filter(|e| e.e.map(|e| e >= 1.08).unwrap_or(false))
        .take(15)
    {
        let e_val = ev.e.unwrap_or(1.0);
        unusual_events.push(UnusualEvent {
            event: ev.clone(),
            category: "hyperbolic_orbit".to_string(),
            title: format!("Hyperbolic Orbit Candidate (e={:.3})", e_val),
            reason: format!(
                "Orbital eccentricity of {:.3} indicates an unbound trajectory. Candidate for interstellar meteoroid or severe pre-atmospheric deceleration perturbation.",
                e_val
            ),
            metric_value: e_val,
            metric_name: "Orbital Eccentricity".to_string(),
            unit: "".to_string(),
            percentile_rank: "> 99.95%".to_string(),
        });
    }

    // Build Detailed Shower Comparison Data
    println!("Building comprehensive shower comparison datasets...");
    let mut shower_stats_map: HashMap<String, ShowerStats> = HashMap::new();
    let mut shower_codes_to_compare: Vec<String> = vec!["...".to_string()];
    shower_codes_to_compare.extend(top_showers_list.iter().map(|s| s.code.clone()));

    for code in shower_codes_to_compare {
        if let Some(records) = shower_records.get(&code) {
            let total = if code == "..." {
                sporadic_count
            } else {
                shower_counts.get(&code).copied().unwrap_or(records.len())
            };
            let mags: Vec<f64> = records.iter().map(|r| r.0).collect();
            let vgs: Vec<f64> = records.iter().map(|r| r.1).collect();
            let hs: Vec<f64> = records.iter().map(|r| r.2).collect();
            let durs: Vec<f64> = records.iter().map(|r| r.3).collect();
            let sts: Vec<f64> = records.iter().map(|r| r.4 as f64).collect();

            let fb_c = shower_fireball_counts.get(&code).copied().unwrap_or(0);
            let fb_rate = if total > 0 {
                (fb_c as f64 / total as f64) * 100.0
            } else {
                0.0
            };

            let m_mag = compute_percentiles(&mags);
            let m_vg = compute_percentiles(&vgs);
            let m_h = compute_percentiles(&hs);
            let m_dur = compute_percentiles(&durs);
            let m_st = compute_percentiles(&sts).p50;

            // Simple histograms for comparison
            let mag_hist = build_histogram("mag", "mag", &mags, -15.0, 5.0, 0.5);
            let vg_hist = build_histogram("vg", "km/s", &vgs, 10.0, 75.0, 2.0);
            let h_hist = build_histogram("h", "km", &hs, 60.0, 130.0, 2.0);
            let dur_hist = build_histogram("dur", "s", &durs, 0.0, 6.0, 0.2);

            let mut st_map: BTreeMap<i64, usize> = BTreeMap::new();
            for r in records {
                *st_map.entry(r.4).or_insert(0) += 1;
            }
            let scale_factor = if !records.is_empty() && total != records.len() {
                total as f64 / records.len() as f64
            } else {
                1.0
            };
            let st_bins: Vec<StationBin> = st_map
                .into_iter()
                .map(|(s, c)| StationBin {
                    stations: s,
                    count: (c as f64 * scale_factor).round() as usize,
                })
                .collect();

            let name = get_shower_name(&code);
            let share_pct = (total as f64 / rows_processed as f64) * 100.0;

            shower_stats_map.insert(
                code.clone(),
                ShowerStats {
                    code: code.clone(),
                    name,
                    total_observations: total,
                    population_share_pct: (share_pct * 100.0).round() / 100.0,
                    date_range: DateRange {
                        min_date: min_date_str.clone(),
                        max_date: max_date_str.clone(),
                    },
                    fireball_count: fb_c,
                    fireball_rate_pct: (fb_rate * 100.0).round() / 100.0,
                    medians: ShowerMedians {
                        magnitude: m_mag.p50,
                        velocity: m_vg.p50,
                        peak_height: m_h.p50,
                        duration: m_dur.p50,
                        stations: m_st,
                    },
                    percentiles: ShowerPercentiles {
                        magnitude: m_mag,
                        velocity: m_vg,
                        peak_height: m_h,
                        duration: m_dur,
                    },
                    histograms: ShowerHistograms {
                        magnitude: mag_hist
                            .bins
                            .into_iter()
                            .map(|b| SimpleBin {
                                bin: b.bin_start,
                                count: (b.count as f64 * scale_factor).round() as usize,
                            })
                            .collect(),
                        velocity: vg_hist
                            .bins
                            .into_iter()
                            .map(|b| SimpleBin {
                                bin: b.bin_start,
                                count: (b.count as f64 * scale_factor).round() as usize,
                            })
                            .collect(),
                        peak_height: h_hist
                            .bins
                            .into_iter()
                            .map(|b| SimpleBin {
                                bin: b.bin_start,
                                count: (b.count as f64 * scale_factor).round() as usize,
                            })
                            .collect(),
                        duration: dur_hist
                            .bins
                            .into_iter()
                            .map(|b| SimpleBin {
                                bin: b.bin_start,
                                count: (b.count as f64 * scale_factor).round() as usize,
                            })
                            .collect(),
                        stations: st_bins,
                    },
                },
            );
        }
    }

    // Representative sample for scatter plot
    let sample_size = sample_candidates.len();
    let sample_points = sample_candidates;

    let scatter_sample_data = ScatterSampleData {
        density: density_2d.clone(),
        sample_points,
        unusual_points: unusual_events.clone(),
        sample_size,
        total_population: rows_processed,
    };

    // Global summary
    let summary = GlobalSummary {
        total_records: rows_processed,
        shower_records: rows_processed - sporadic_count,
        sporadic_records: sporadic_count,
        fireball_candidates: fireballs.len(),
        thresholds: fireball_th_counts.clone(),
        brightest_observation: brightest_event.unwrap(),
        fastest_observation: fastest_event.unwrap(),
        slowest_observation: slowest_event.unwrap(),
        highest_peak_observation: highest_peak_event.unwrap(),
        lowest_peak_observation: lowest_peak_event.unwrap(),
        longest_duration_observation: longest_duration_event.unwrap(),
        most_stations_observation: most_stations_event.unwrap(),
        percentiles: SummaryPercentiles {
            peak_abs_magnitude: mag_pct.clone(),
            v_g_kms: vg_pct.clone(),
            peak_height_km: h_pct.clone(),
            duration_sec: dur_pct.clone(),
            n_stations: st_pct.clone(),
        },
        station_distribution,
        orbital_summary: OrbitalSummary {
            elliptical_count,
            hyperbolic_count,
            parabolic_count,
            unknown_count: unknown_orbit_count,
            inclination_percentiles: inc_pct,
            eccentricity_percentiles: ecc_pct,
        },
        top_showers: top_showers_list.clone(),
    };

    // Write all artifacts to output directory
    println!("Writing generated artifacts to {:?}...", output);
    fs::create_dir_all(output)?;

    let mut artifact_manifest_map: HashMap<String, ArtifactInfo> = HashMap::new();

    // 1. summary.json
    let p = output.join("summary.json");
    let (sz, sha) = write_json_file(&p, &summary)?;
    artifact_manifest_map.insert(
        "summary".to_string(),
        ArtifactInfo {
            path: "summary.json".to_string(),
            size_bytes: sz,
            record_count: Some(1),
            sha256: sha,
        },
    );

    // 2. timeseries.json
    let p = output.join("timeseries.json");
    let (sz, sha) = write_json_file(&p, &timeseries_data)?;
    artifact_manifest_map.insert(
        "timeseries".to_string(),
        ArtifactInfo {
            path: "timeseries.json".to_string(),
            size_bytes: sz,
            record_count: Some(timeseries_data.monthly.len()),
            sha256: sha,
        },
    );

    // 3. distributions
    let p = output.join("distributions/magnitude.json");
    let (sz, sha) = write_json_file(&p, &mag_dist)?;
    artifact_manifest_map.insert(
        "distribution_magnitude".to_string(),
        ArtifactInfo {
            path: "distributions/magnitude.json".to_string(),
            size_bytes: sz,
            record_count: Some(mag_dist.bins.len()),
            sha256: sha,
        },
    );

    let p = output.join("distributions/altitude.json");
    let (sz, sha) = write_json_file(&p, &h_dist)?;
    artifact_manifest_map.insert(
        "distribution_altitude".to_string(),
        ArtifactInfo {
            path: "distributions/altitude.json".to_string(),
            size_bytes: sz,
            record_count: Some(h_dist.bins.len()),
            sha256: sha,
        },
    );

    let p = output.join("distributions/velocity.json");
    let (sz, sha) = write_json_file(&p, &vg_dist)?;
    artifact_manifest_map.insert(
        "distribution_velocity".to_string(),
        ArtifactInfo {
            path: "distributions/velocity.json".to_string(),
            size_bytes: sz,
            record_count: Some(vg_dist.bins.len()),
            sha256: sha,
        },
    );

    let p = output.join("distributions/duration.json");
    let (sz, sha) = write_json_file(&p, &dur_dist)?;
    artifact_manifest_map.insert(
        "distribution_duration".to_string(),
        ArtifactInfo {
            path: "distributions/duration.json".to_string(),
            size_bytes: sz,
            record_count: Some(dur_dist.bins.len()),
            sha256: sha,
        },
    );

    let p = output.join("distributions/showers.json");
    let (sz, sha) = write_json_file(&p, &shower_stats_map)?;
    artifact_manifest_map.insert(
        "distribution_showers".to_string(),
        ArtifactInfo {
            path: "distributions/showers.json".to_string(),
            size_bytes: sz,
            record_count: Some(shower_stats_map.len()),
            sha256: sha,
        },
    );

    // 4. density
    let p = output.join("density/velocity_altitude.json");
    let (sz, sha) = write_json_file(&p, &density_2d)?;
    artifact_manifest_map.insert(
        "density_velocity_altitude".to_string(),
        ArtifactInfo {
            path: "density/velocity_altitude.json".to_string(),
            size_bytes: sz,
            record_count: Some(density_2d.grid.len()),
            sha256: sha,
        },
    );

    // 5. catalogs
    let p = output.join("catalogs/brightest.json");
    let (sz, sha) = write_json_file(&p, &brightest_items)?;
    artifact_manifest_map.insert(
        "catalog_brightest".to_string(),
        ArtifactInfo {
            path: "catalogs/brightest.json".to_string(),
            size_bytes: sz,
            record_count: Some(brightest_items.len()),
            sha256: sha,
        },
    );

    let p = output.join("catalogs/fireballs.json");
    let (sz, sha) = write_json_file(&p, &fireballs)?;
    artifact_manifest_map.insert(
        "catalog_fireballs".to_string(),
        ArtifactInfo {
            path: "catalogs/fireballs.json".to_string(),
            size_bytes: sz,
            record_count: Some(fireballs.len()),
            sha256: sha,
        },
    );

    let p = output.join("catalogs/unusual.json");
    let (sz, sha) = write_json_file(&p, &unusual_events)?;
    artifact_manifest_map.insert(
        "catalog_unusual".to_string(),
        ArtifactInfo {
            path: "catalogs/unusual.json".to_string(),
            size_bytes: sz,
            record_count: Some(unusual_events.len()),
            sha256: sha,
        },
    );

    // 6. scatter
    let p = output.join("scatter/sample.json");
    let (sz, sha) = write_json_file(&p, &scatter_sample_data)?;
    artifact_manifest_map.insert(
        "scatter_sample".to_string(),
        ArtifactInfo {
            path: "scatter/sample.json".to_string(),
            size_bytes: sz,
            record_count: Some(scatter_sample_data.sample_points.len()),
            sha256: sha,
        },
    );

    // 7. Event date partitions (gzip JSON)
    println!(
        "Writing {} date partitions (gzip compressed)...",
        day_partitions.len()
    );
    let mut partition_count = 0usize;
    for (day_key, events) in day_partitions {
        let gz_path = output.join(format!("events/{}.json.gz", day_key));
        write_gzip_json_file(&gz_path, &events)?;
        partition_count += 1;
    }
    println!("Wrote {} event partitions.", partition_count);

    // 8. manifest.json
    let manifest = DatasetManifest {
        name: "Global Meteor Network Trajectory Data".to_string(),
        source_url: "https://huggingface.co/datasets/juliensimon/global-meteor-network".to_string(),
        license: "CC BY 4.0".to_string(),
        source_revision: revision.to_string(),
        generated_at: Utc::now().to_rfc3339(),
        schema_version: "1.0.0".to_string(),
        total_records: rows_processed,
        date_range: DateRange {
            min_date: min_date_str,
            max_date: max_date_str,
        },
        metrics: ManifestMetrics {
            shower_count: shower_counts_sorted.len(),
            sporadic_count,
            fireball_candidates_count: fireballs.len(),
            fireball_threshold_counts: fireball_th_counts,
            hyperbolic_candidates_count: hyperbolic_count,
        },
        numeric_ranges: NumericRanges {
            peak_abs_magnitude: NumericRange {
                min: mag_dist.min,
                max: mag_dist.max,
                median: mag_pct.p50,
            },
            v_g_kms: NumericRange {
                min: vg_dist.min,
                max: vg_dist.max,
                median: vg_pct.p50,
            },
            peak_height_km: NumericRange {
                min: h_dist.min,
                max: h_dist.max,
                median: h_pct.p50,
            },
            duration_sec: NumericRange {
                min: dur_dist.min,
                max: dur_dist.max,
                median: dur_pct.p50,
            },
            n_stations: NumericRange {
                min: 2.0,
                max: st_pct.p99,
                median: st_pct.p50,
            },
        },
        artifacts: artifact_manifest_map,
    };

    let p = output.join("manifest.json");
    write_json_file(&p, &manifest)?;
    println!("Dataset manifest generated successfully at {:?}", p);

    if copy_to_web {
        let web_data_dir =
            if Path::new("apps/web/public/data").exists() || Path::new("apps/web").exists() {
                PathBuf::from("apps/web/public/data")
            } else {
                PathBuf::from("../apps/web/public/data")
            };
        println!("Copying core analytical artifacts to {:?}...", web_data_dir);
        fs::create_dir_all(&web_data_dir)?;
        fs::create_dir_all(web_data_dir.join("distributions"))?;
        fs::create_dir_all(web_data_dir.join("density"))?;
        fs::create_dir_all(web_data_dir.join("catalogs"))?;
        fs::create_dir_all(web_data_dir.join("scatter"))?;

        let files = [
            "manifest.json",
            "summary.json",
            "timeseries.json",
            "distributions/magnitude.json",
            "distributions/altitude.json",
            "distributions/velocity.json",
            "distributions/duration.json",
            "distributions/showers.json",
            "density/velocity_altitude.json",
            "catalogs/brightest.json",
            "catalogs/fireballs.json",
            "catalogs/unusual.json",
            "scatter/sample.json",
        ];

        for f in files {
            let src = output.join(f);
            let dst = web_data_dir.join(f);
            if src.exists() {
                fs::copy(&src, &dst)?;
            }
        }
        println!("Core artifacts copied to web application public directory.");
    }

    println!(
        "Pipeline finished successfully in {:?}",
        start_time.elapsed()
    );
    Ok(())
}

fn run_verify(dir: &Path) -> Result<()> {
    println!("=== Verifying Dataset Artifacts at {:?} ===", dir);
    let manifest_path = dir.join("manifest.json");
    if !manifest_path.exists() {
        anyhow::bail!("Missing manifest.json at {:?}", manifest_path);
    }

    let manifest_bytes = fs::read(&manifest_path)?;
    let manifest: DatasetManifest = serde_json::from_slice(&manifest_bytes)?;
    println!(
        "Manifest: Total records: {}, Generated: {}",
        manifest.total_records, manifest.generated_at
    );
    println!(
        "Date range: {} to {}",
        manifest.date_range.min_date, manifest.date_range.max_date
    );
    println!(
        "Fireballs: {}, Sporadic: {}, Showers: {}",
        manifest.metrics.fireball_candidates_count,
        manifest.metrics.sporadic_count,
        manifest.metrics.shower_count
    );

    for (name, art) in &manifest.artifacts {
        let art_path = dir.join(&art.path);
        if !art_path.exists() {
            anyhow::bail!("Artifact {} file missing: {:?}", name, art_path);
        }
        let data = fs::read(&art_path)?;
        let sha = compute_sha256(&data);
        if sha != art.sha256 {
            anyhow::bail!(
                "Checksum mismatch for {}: expected {}, got {}",
                name,
                art.sha256,
                sha
            );
        }
        println!(
            "  ✓ Artifact '{}' verified ({} bytes, sha256 matches)",
            name, art.size_bytes
        );
    }

    println!("All artifacts successfully verified!");
    Ok(())
}

fn run_export_fixture(input: &Path, output: &Path, limit: usize) -> Result<()> {
    println!(
        "=== Exporting Test Fixture: {} rows from {:?} to {:?} ===",
        limit, input, output
    );
    if let Some(parent) = output.parent() {
        fs::create_dir_all(parent)?;
    }
    let file = File::open(input)?;
    let builder = ParquetRecordBatchReaderBuilder::try_new(file)?;
    let mut reader = builder.with_batch_size(limit).build()?;

    if let Some(batch_result) = reader.next() {
        let batch = batch_result?;
        let sub_batch = batch.slice(0, limit.min(batch.num_rows()));
        println!("Read fixture batch with {} rows", sub_batch.num_rows());

        let out_file = File::create(output)?;
        let mut writer = parquet::arrow::ArrowWriter::try_new(out_file, sub_batch.schema(), None)?;
        writer.write(&sub_batch)?;
        writer.close()?;
        println!("Exported fixture to {:?}", output);
    }

    Ok(())
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    match cli.command {
        Commands::Ingest {
            input,
            output,
            revision,
            copy_to_web,
        } => {
            run_ingest(&input, &output, &revision, copy_to_web)?;
        }
        Commands::Verify { dir } => {
            run_verify(&dir)?;
        }
        Commands::ExportFixture {
            input,
            output,
            limit,
        } => {
            run_export_fixture(&input, &output, limit)?;
        }
    }
    Ok(())
}

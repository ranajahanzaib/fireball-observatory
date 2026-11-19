use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[allow(dead_code)]
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RawMeteorRecord {
    pub datetime_utc: String,
    pub shower_code: String,
    pub radiant_ra_deg: f64,
    pub radiant_dec_deg: f64,
    pub v_g_kms: f64,
    pub a_au: Option<f64>,
    pub e: Option<f64>,
    pub i_deg: Option<f64>,
    pub peri_deg: Option<f64>,
    pub node_deg: Option<f64>,
    pub q_au: Option<f64>,
    pub peak_abs_magnitude: f64,
    pub peak_height_km: f64,
    pub duration_sec: f64,
    pub n_stations: i64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MeteorEvent {
    pub id: String,
    pub datetime_utc: String,
    pub shower_code: String,
    pub shower_name: String,
    pub radiant_ra_deg: f64,
    pub radiant_dec_deg: f64,
    pub v_g_kms: f64,
    pub a_au: Option<f64>,
    pub e: Option<f64>,
    pub i_deg: Option<f64>,
    pub peri_deg: Option<f64>,
    pub node_deg: Option<f64>,
    pub q_au: Option<f64>,
    pub peak_abs_magnitude: f64,
    pub peak_height_km: f64,
    pub duration_sec: f64,
    pub n_stations: i64,
    pub is_fireball: bool,
    pub is_hyperbolic: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CatalogMeteorItem {
    pub id: String,
    pub datetime_utc: String,
    pub shower_code: String,
    pub shower_name: String,
    pub peak_abs_magnitude: f64,
    pub v_g_kms: f64,
    pub peak_height_km: f64,
    pub duration_sec: f64,
    pub n_stations: i64,
    pub e: Option<f64>,
    pub a_au: Option<f64>,
    pub i_deg: Option<f64>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct NumericRange {
    pub min: f64,
    pub max: f64,
    pub median: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ArtifactInfo {
    pub path: String,
    pub size_bytes: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub record_count: Option<usize>,
    pub sha256: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DatasetManifest {
    pub name: String,
    pub source_url: String,
    pub license: String,
    pub source_revision: String,
    pub generated_at: String,
    pub schema_version: String,
    pub total_records: usize,
    pub date_range: DateRange,
    pub metrics: ManifestMetrics,
    pub numeric_ranges: NumericRanges,
    pub artifacts: HashMap<String, ArtifactInfo>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DateRange {
    pub min_date: String,
    pub max_date: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ManifestMetrics {
    pub shower_count: usize,
    pub sporadic_count: usize,
    pub fireball_candidates_count: usize,
    pub fireball_threshold_counts: HashMap<String, usize>,
    pub hyperbolic_candidates_count: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct NumericRanges {
    pub peak_abs_magnitude: NumericRange,
    pub v_g_kms: NumericRange,
    pub peak_height_km: NumericRange,
    pub duration_sec: NumericRange,
    pub n_stations: NumericRange,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PercentileStats {
    pub p01: f64,
    pub p05: f64,
    pub p10: f64,
    pub p25: f64,
    pub p50: f64,
    pub p75: f64,
    pub p90: f64,
    pub p95: f64,
    pub p99: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct StationDistItem {
    pub stations: i64,
    pub count: usize,
    pub percentage: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct OrbitalSummary {
    pub elliptical_count: usize,
    pub hyperbolic_count: usize,
    pub parabolic_count: usize,
    pub unknown_count: usize,
    pub inclination_percentiles: PercentileStats,
    pub eccentricity_percentiles: PercentileStats,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TopShowerSummary {
    pub code: String,
    pub name: String,
    pub count: usize,
    pub fireball_count: usize,
    pub median_mag: f64,
    pub median_v_g: f64,
    pub median_height: f64,
    pub median_duration: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GlobalSummary {
    pub total_records: usize,
    pub shower_records: usize,
    pub sporadic_records: usize,
    pub fireball_candidates: usize,
    pub thresholds: HashMap<String, usize>,
    pub brightest_observation: CatalogMeteorItem,
    pub fastest_observation: CatalogMeteorItem,
    pub slowest_observation: CatalogMeteorItem,
    pub highest_peak_observation: CatalogMeteorItem,
    pub lowest_peak_observation: CatalogMeteorItem,
    pub longest_duration_observation: CatalogMeteorItem,
    pub most_stations_observation: CatalogMeteorItem,
    pub percentiles: SummaryPercentiles,
    pub station_distribution: Vec<StationDistItem>,
    pub orbital_summary: OrbitalSummary,
    pub top_showers: Vec<TopShowerSummary>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SummaryPercentiles {
    pub peak_abs_magnitude: PercentileStats,
    pub v_g_kms: PercentileStats,
    pub peak_height_km: PercentileStats,
    pub duration_sec: PercentileStats,
    pub n_stations: PercentileStats,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DistributionBin {
    pub bin_start: f64,
    pub bin_end: f64,
    pub count: usize,
    pub cumulative_pct: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct HistogramDistribution {
    pub field: String,
    pub unit: String,
    pub bin_width: f64,
    pub bins: Vec<DistributionBin>,
    pub min: f64,
    pub max: f64,
    pub median: f64,
    pub mean: f64,
    pub percentiles: PercentileStats,
    pub total_records: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AxisConfig {
    pub name: String,
    pub unit: String,
    pub field: String,
    pub min: f64,
    pub max: f64,
    pub step: f64,
    pub bins: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Density2DData {
    pub x_axis: AxisConfig,
    pub y_axis: AxisConfig,
    pub total_binned_points: usize,
    pub max_cell_count: usize,
    pub grid: Vec<(usize, usize, usize)>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ScatterSampleData {
    pub density: Density2DData,
    pub sample_points: Vec<CatalogMeteorItem>,
    pub unusual_points: Vec<UnusualEvent>,
    pub sample_size: usize,
    pub total_population: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct UnusualEvent {
    pub event: CatalogMeteorItem,
    pub category: String,
    pub title: String,
    pub reason: String,
    pub metric_value: f64,
    pub metric_name: String,
    pub unit: String,
    pub percentile_rank: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TimeSeriesPoint {
    pub date: String,
    pub total_count: usize,
    pub fireball_count: usize,
    pub median_magnitude: f64,
    pub median_velocity: f64,
    pub median_peak_height: f64,
    pub median_duration: f64,
    pub stations_mean: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TimeSeriesData {
    pub monthly: Vec<TimeSeriesPoint>,
    pub yearly: Vec<TimeSeriesPoint>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ShowerStats {
    pub code: String,
    pub name: String,
    pub total_observations: usize,
    pub population_share_pct: f64,
    pub date_range: DateRange,
    pub fireball_count: usize,
    pub fireball_rate_pct: f64,
    pub medians: ShowerMedians,
    pub percentiles: ShowerPercentiles,
    pub histograms: ShowerHistograms,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ShowerMedians {
    pub magnitude: f64,
    pub velocity: f64,
    pub peak_height: f64,
    pub duration: f64,
    pub stations: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ShowerPercentiles {
    pub magnitude: PercentileStats,
    pub velocity: PercentileStats,
    pub peak_height: PercentileStats,
    pub duration: PercentileStats,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ShowerHistograms {
    pub magnitude: Vec<SimpleBin>,
    pub velocity: Vec<SimpleBin>,
    pub peak_height: Vec<SimpleBin>,
    pub duration: Vec<SimpleBin>,
    pub stations: Vec<StationBin>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SimpleBin {
    pub bin: f64,
    pub count: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct StationBin {
    pub stations: i64,
    pub count: usize,
}

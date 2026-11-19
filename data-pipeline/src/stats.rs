use crate::types::{
    AxisConfig, Density2DData, DistributionBin, HistogramDistribution, PercentileStats,
};

pub fn compute_percentiles(values: &[f64]) -> PercentileStats {
    if values.is_empty() {
        return PercentileStats {
            p01: 0.0,
            p05: 0.0,
            p10: 0.0,
            p25: 0.0,
            p50: 0.0,
            p75: 0.0,
            p90: 0.0,
            p95: 0.0,
            p99: 0.0,
        };
    }

    let mut sorted: Vec<f64> = values.iter().copied().filter(|v| v.is_finite()).collect();
    if sorted.is_empty() {
        return PercentileStats {
            p01: 0.0,
            p05: 0.0,
            p10: 0.0,
            p25: 0.0,
            p50: 0.0,
            p75: 0.0,
            p90: 0.0,
            p95: 0.0,
            p99: 0.0,
        };
    }

    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let n = sorted.len();

    let get_pct = |p: f64| -> f64 {
        let idx = ((n - 1) as f64 * p).round() as usize;
        sorted[idx.min(n - 1)]
    };

    PercentileStats {
        p01: get_pct(0.01),
        p05: get_pct(0.05),
        p10: get_pct(0.10),
        p25: get_pct(0.25),
        p50: get_pct(0.50),
        p75: get_pct(0.75),
        p90: get_pct(0.90),
        p95: get_pct(0.95),
        p99: get_pct(0.99),
    }
}

pub fn build_histogram(
    field: &str,
    unit: &str,
    values: &[f64],
    min_bound: f64,
    max_bound: f64,
    bin_width: f64,
) -> HistogramDistribution {
    let mut valid_values: Vec<f64> = values
        .iter()
        .copied()
        .filter(|v| !v.is_nan() && v.is_finite())
        .collect();

    let total = valid_values.len();
    if total == 0 {
        return HistogramDistribution {
            field: field.to_string(),
            unit: unit.to_string(),
            bin_width,
            bins: vec![],
            min: 0.0,
            max: 0.0,
            median: 0.0,
            mean: 0.0,
            percentiles: PercentileStats {
                p01: 0.0,
                p05: 0.0,
                p10: 0.0,
                p25: 0.0,
                p50: 0.0,
                p75: 0.0,
                p90: 0.0,
                p95: 0.0,
                p99: 0.0,
            },
            total_records: 0,
        };
    }

    valid_values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let min_val = valid_values[0];
    let max_val = valid_values[total - 1];
    let sum: f64 = valid_values.iter().sum();
    let mean = sum / total as f64;
    let percentiles = compute_percentiles(&valid_values);

    let num_bins = ((max_bound - min_bound) / bin_width).ceil() as usize;
    let mut counts = vec![0usize; num_bins];

    for &v in &valid_values {
        if v >= min_bound && v < max_bound {
            let bin_idx = ((v - min_bound) / bin_width).floor() as usize;
            if bin_idx < num_bins {
                counts[bin_idx] += 1;
            }
        } else if v >= max_bound && num_bins > 0 {
            counts[num_bins - 1] += 1;
        } else if v < min_bound && num_bins > 0 {
            counts[0] += 1;
        }
    }

    let mut cumulative = 0usize;
    let mut bins = Vec::with_capacity(num_bins);
    for (i, &count) in counts.iter().enumerate() {
        cumulative += count;
        let bin_start = min_bound + i as f64 * bin_width;
        let bin_end = bin_start + bin_width;
        let cumulative_pct = if total > 0 {
            (cumulative as f64 / total as f64) * 100.0
        } else {
            0.0
        };
        bins.push(DistributionBin {
            bin_start: (bin_start * 100.0).round() / 100.0,
            bin_end: (bin_end * 100.0).round() / 100.0,
            count,
            cumulative_pct: (cumulative_pct * 100.0).round() / 100.0,
        });
    }

    HistogramDistribution {
        field: field.to_string(),
        unit: unit.to_string(),
        bin_width,
        bins,
        min: min_val,
        max: max_val,
        median: percentiles.p50,
        mean: (mean * 100.0).round() / 100.0,
        percentiles,
        total_records: total,
    }
}

pub fn build_2d_density(
    vg_values: &[f64],
    height_values: &[f64],
    vg_min: f64,
    vg_max: f64,
    vg_step: f64,
    h_min: f64,
    h_max: f64,
    h_step: f64,
) -> Density2DData {
    let x_bins = ((vg_max - vg_min) / vg_step).ceil() as usize;
    let y_bins = ((h_max - h_min) / h_step).ceil() as usize;

    let mut grid_map = std::collections::HashMap::new();
    let mut total_binned = 0usize;
    let mut max_cell = 0usize;

    for i in 0..vg_values.len() {
        let vg = vg_values[i];
        let h = height_values[i];

        if vg.is_finite()
            && h.is_finite()
            && vg >= vg_min
            && vg <= vg_max
            && h >= h_min
            && h <= h_max
        {
            let x_idx = (((vg - vg_min) / vg_step).floor() as usize).min(x_bins - 1);
            let y_idx = (((h - h_min) / h_step).floor() as usize).min(y_bins - 1);
            let count = grid_map.entry((x_idx, y_idx)).or_insert(0usize);
            *count += 1;
            total_binned += 1;
            if *count > max_cell {
                max_cell = *count;
            }
        }
    }

    let mut grid = Vec::with_capacity(grid_map.len());
    for ((x, y), count) in grid_map {
        grid.push((x, y, count));
    }
    grid.sort_by(|a, b| (a.0, a.1).cmp(&(b.0, b.1)));

    Density2DData {
        x_axis: AxisConfig {
            name: "Geocentric Velocity".to_string(),
            unit: "km/s".to_string(),
            field: "v_g_kms".to_string(),
            min: vg_min,
            max: vg_max,
            step: vg_step,
            bins: x_bins,
        },
        y_axis: AxisConfig {
            name: "Peak Brightness Altitude".to_string(),
            unit: "km".to_string(),
            field: "peak_height_km".to_string(),
            min: h_min,
            max: h_max,
            step: h_step,
            bins: y_bins,
        },
        total_binned_points: total_binned,
        max_cell_count: max_cell,
        grid,
    }
}

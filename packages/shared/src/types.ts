/**
 * Fireball Observatory - Shared Type Definitions
 */

export interface RawMeteorRecord {
  datetime_utc: string; // ISO 8601 UTC string
  shower_code: string; // IAU shower code or '...' for sporadic
  radiant_ra_deg: number;
  radiant_dec_deg: number;
  v_g_kms: number;
  a_au: number | null;
  e: number | null;
  i_deg: number | null;
  peri_deg: number | null;
  node_deg: number | null;
  q_au: number | null;
  peak_abs_magnitude: number;
  peak_height_km: number;
  duration_sec: number;
  n_stations: number;
}

export interface MeteorEvent {
  id: string; // Stable deterministic ID: gmn_YYYYMMDD_HHMMSS_ffffff_XXXX
  datetime_utc: string;
  shower_code: string;
  shower_name: string;
  radiant_ra_deg: number;
  radiant_dec_deg: number;
  v_g_kms: number;
  a_au: number | null;
  e: number | null;
  i_deg: number | null;
  peri_deg: number | null;
  node_deg: number | null;
  q_au: number | null;
  peak_abs_magnitude: number;
  peak_height_km: number;
  duration_sec: number;
  n_stations: number;
  is_fireball: boolean; // default threshold peak_abs_magnitude <= -4
  is_hyperbolic: boolean; // e >= 1.0 or non-finite a_au
}

export interface CatalogMeteorItem {
  id: string;
  datetime_utc: string;
  shower_code: string;
  shower_name: string;
  peak_abs_magnitude: number;
  v_g_kms: number;
  peak_height_km: number;
  duration_sec: number;
  n_stations: number;
  e?: number | null;
  a_au?: number | null;
  i_deg?: number | null;
}

export interface DatasetManifest {
  name: string;
  source_url: string;
  license: string;
  source_revision: string;
  generated_at: string;
  schema_version: string;
  total_records: number;
  date_range: {
    min_date: string;
    max_date: string;
  };
  metrics: {
    shower_count: number;
    sporadic_count: number;
    fireball_candidates_count: number; // <= -4
    fireball_threshold_counts: Record<string, number>; // "-2", "-3", "-4", "-5", "-6", "-8", "-10"
    hyperbolic_candidates_count: number;
  };
  numeric_ranges: {
    peak_abs_magnitude: { min: number; max: number; median: number };
    v_g_kms: { min: number; max: number; median: number };
    peak_height_km: { min: number; max: number; median: number };
    duration_sec: { min: number; max: number; median: number };
    n_stations: { min: number; max: number; median: number };
  };
  artifacts: Record<
    string,
    {
      path: string;
      size_bytes: number;
      record_count?: number;
      sha256: string;
    }
  >;
}

export interface PercentileStats {
  p01: number;
  p05: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface GlobalSummary {
  total_records: number;
  shower_records: number;
  sporadic_records: number;
  fireball_candidates: number;
  thresholds: Record<string, number>;
  brightest_observation: CatalogMeteorItem;
  fastest_observation: CatalogMeteorItem;
  slowest_observation: CatalogMeteorItem;
  highest_peak_observation: CatalogMeteorItem;
  lowest_peak_observation: CatalogMeteorItem;
  longest_duration_observation: CatalogMeteorItem;
  most_stations_observation: CatalogMeteorItem;
  percentiles: {
    peak_abs_magnitude: PercentileStats;
    v_g_kms: PercentileStats;
    peak_height_km: PercentileStats;
    duration_sec: PercentileStats;
    n_stations: PercentileStats;
  };
  station_distribution: Array<{
    stations: number;
    count: number;
    percentage: number;
  }>;
  orbital_summary: {
    elliptical_count: number;
    hyperbolic_count: number;
    parabolic_count: number;
    unknown_count: number;
    inclination_percentiles: PercentileStats;
    eccentricity_percentiles: PercentileStats;
  };
  top_showers: Array<{
    code: string;
    name: string;
    count: number;
    fireball_count: number;
    median_mag: number;
    median_v_g: number;
    median_height: number;
    median_duration: number;
  }>;
}

export interface DistributionBin {
  bin_start: number;
  bin_end: number;
  count: number;
  cumulative_pct?: number;
}

export interface HistogramDistribution {
  field: string;
  unit: string;
  bin_width: number;
  bins: DistributionBin[];
  min: number;
  max: number;
  median: number;
  mean: number;
  percentiles: PercentileStats;
  total_records: number;
}

export interface Density2DData {
  x_axis: {
    name: string;
    unit: string;
    field: string;
    min: number;
    max: number;
    step: number;
    bins: number;
  };
  y_axis: {
    name: string;
    unit: string;
    field: string;
    min: number;
    max: number;
    step: number;
    bins: number;
  };
  total_binned_points: number;
  max_cell_count: number;
  // Matrix of [x_bin_idx, y_bin_idx, count]
  grid: Array<[number, number, number]>;
}

export interface ScatterSampleData {
  density: Density2DData;
  // Deterministic representative sample points for point selection and hover interaction
  sample_points: CatalogMeteorItem[];
  // Notable unusual events highlighted
  unusual_points: UnusualEvent[];
  sample_size: number;
  total_population: number;
}

export type OutlierCategory =
  | "brightest"
  | "fastest"
  | "slowest"
  | "highest_peak"
  | "lowest_peak"
  | "longest_duration"
  | "most_stations"
  | "hyperbolic_orbit"
  | "unusual_eccentricity";

export interface UnusualEvent {
  event: CatalogMeteorItem;
  category: OutlierCategory;
  title: string;
  reason: string;
  metric_value: number;
  metric_name: string;
  unit: string;
  percentile_rank: string;
}

export interface TimeSeriesPoint {
  date: string; // YYYY-MM
  total_count: number;
  fireball_count: number;
  median_magnitude: number;
  median_velocity: number;
  median_peak_height: number;
  median_duration: number;
  stations_mean: number;
}

export interface TimeSeriesData {
  monthly: TimeSeriesPoint[];
  yearly: TimeSeriesPoint[];
}

export interface ShowerStats {
  code: string;
  name: string;
  total_observations: number;
  population_share_pct: number;
  date_range: { min_date: string; max_date: string };
  fireball_count: number;
  fireball_rate_pct: number;
  medians: {
    magnitude: number;
    velocity: number;
    peak_height: number;
    duration: number;
    stations: number;
  };
  percentiles: {
    magnitude: PercentileStats;
    velocity: PercentileStats;
    peak_height: PercentileStats;
    duration: PercentileStats;
  };
  histograms: {
    magnitude: Array<{ bin: number; count: number }>;
    velocity: Array<{ bin: number; count: number }>;
    peak_height: Array<{ bin: number; count: number }>;
    duration: Array<{ bin: number; count: number }>;
    stations: Array<{ stations: number; count: number }>;
  };
}

export interface CatalogFilterOptions {
  minMagnitude?: number;
  maxMagnitude?: number;
  minVelocity?: number;
  maxVelocity?: number;
  minHeight?: number;
  maxHeight?: number;
  minDuration?: number;
  maxDuration?: number;
  minStations?: number;
  maxStations?: number;
  showerCode?: string;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}

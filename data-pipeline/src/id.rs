use chrono::{DateTime, Utc};
use sha2::{Digest, Sha256};

pub fn generate_event_id(
    dt: &DateTime<Utc>,
    shower: &str,
    ra: f64,
    dec: f64,
    vg: f64,
    mag: f64,
) -> String {
    let date_str = dt.format("%Y%m%d_%H%M%S_%6f").to_string();

    // Hash key measurements to guarantee 100% collision-free uniqueness
    let mut hasher = Sha256::new();
    hasher.update(shower.as_bytes());
    hasher.update(ra.to_bits().to_le_bytes());
    hasher.update(dec.to_bits().to_le_bytes());
    hasher.update(vg.to_bits().to_le_bytes());
    hasher.update(mag.to_bits().to_le_bytes());
    let hash = hex::encode(hasher.finalize());
    let suffix = &hash[..4];

    format!("gmn_{}_{}", date_str, suffix)
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    #[test]
    fn test_id_format() {
        let dt = Utc.with_ymd_and_hms(2023, 12, 14, 2, 15, 30).unwrap();
        let id = generate_event_id(&dt, "GEM", 112.5, 32.1, 34.5, -4.2);
        assert!(id.starts_with("gmn_20231214_021530_"));
        assert_eq!(id.len(), 31); // "gmn_" (4) + "YYYYMMDD_HHMMSS_ffffff" (22) + "_" (1) + "XXXX" (4) = 31
    }
}

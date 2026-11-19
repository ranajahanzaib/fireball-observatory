#[cfg(test)]
mod tests {
    use flate2::read::GzDecoder;
    use std::io::Read;

    #[test]
    fn test_percentile_calculation() {
        let values = vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
        let n = values.len();
        let get_pct = |p: f64| -> f64 {
            let idx = ((n - 1) as f64 * p).round() as usize;
            values[idx.min(n - 1)]
        };

        assert_eq!(get_pct(0.5), 6.0); // 9 * 0.5 = 4.5 -> round to 5 -> value 6
        assert_eq!(get_pct(0.0), 1.0);
        assert_eq!(get_pct(1.0), 10.0);
    }

    #[test]
    fn test_gzip_roundtrip() {
        use flate2::write::GzEncoder;
        use flate2::Compression;
        use std::io::Write;

        let original = b"{\"event\": \"gmn_test_123\", \"mag\": -4.5}";
        let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
        encoder.write_all(original).unwrap();
        let compressed = encoder.finish().unwrap();

        let mut decoder = GzDecoder::new(&compressed[..]);
        let mut decompressed = Vec::new();
        decoder.read_to_end(&mut decompressed).unwrap();

        assert_eq!(original.to_vec(), decompressed);
    }
}

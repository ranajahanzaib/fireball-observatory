# Fireball Observatory Data Pipeline

A high-performance Rust analytical pipeline for ingesting, validating, partitioning, and aggregating 3.7+ million meteor trajectory solutions from the [Global Meteor Network (GMN)](https://globalmeteornetwork.org) Parquet dataset.

---

## Capabilities

- **High-Throughput Streaming Ingestion:** Utilizes Apache Arrow and Parquet to process millions of records in seconds.
- **Deterministic Identifier Generation:** Generates canonical, URL-safe identifiers (`gmn_YYYYMMDD_HHMMSS_ffffff_XXXX`) from peak UTC timestamps and trajectory hashes.
- **Outlier Detection:** Classifies extreme superbolides, deep atmospheric penetrations ($H_{peak} \le 50\text{ km}$), hypervelocity trajectories ($v_g \ge 72\text{ km/s}$), and long-duration Earth grazers ($\Delta t \ge 4\text{ s}$).
- **Multi-Dimensional Density Grids:** Precomputes 2D velocity-altitude density matrices ($60 \times 60$) and 1D population histograms for sub-millisecond chart initialization.
- **Daily Event Partitioning:** Serializes individual records into date-partitioned JSON files with Gzip compression (`events/YYYY/MM/DD.json.gz`), averaging 8–30 KB per day.
- **Cryptographic Verification:** Generates a signed `manifest.json` with SHA-256 hashes and numeric range profiles across all emitted artifacts.

---

## CLI Usage

### Build

```bash
cargo build --release
```

### Ingest & Build Artifacts

To run the pipeline on the full dataset or fixture:

```bash
# Ingest with automatic copy to apps/web/public/data
cargo run --release -- ingest \
  --input data/raw/gmn_meteors.parquet \
  --output data/processed \
  --copy-to-web
```

### Verify Artifact Integrity

Verifies that all generated artifacts match the SHA-256 hashes recorded in `manifest.json`:

```bash
cargo run --release -- verify --dir data/processed
```

### Export Fixture Dataset

Extracts a clean, stratified 10,000-row fixture for lightweight local development and CI testing:

```bash
cargo run --release -- export-fixture \
  --input data/raw/gmn_meteors.parquet \
  --output data/fixtures/sample_meteors.parquet \
  --count 10000
```

---

## Testing

Run unit and integration roundtrip tests:

```bash
cargo test
```

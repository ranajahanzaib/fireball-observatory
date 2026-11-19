# Contributing to Fireball Observatory

Thank you for your interest in contributing to **Fireball Observatory**! We welcome bug fixes, documentation improvements, visualization enhancements, and scientific feature contributions.

---

## Code of Conduct

Please review and adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md). We expect all participants to maintain a welcoming, respectful, and collaborative environment.

---

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or v22 LTS)
- [pnpm](https://pnpm.io/) (v10 or later)
- [Rust](https://rustup.rs/) (v1.80+ with `cargo`)

### 1. Fork & Clone

```bash
git clone https://github.com/ranajahanzaib/fireball-observatory.git
cd fireball-observatory
pnpm install
```

### 2. Verify Your Environment

Run the verification suites to confirm your setup:

```bash
# Typecheck TypeScript across shared, web, and worker packages
pnpm run typecheck

# Run Vitest test suites
pnpm run test

# Run Rust data pipeline tests
cargo test --manifest-path data-pipeline/Cargo.toml
```

### 3. Local Development

Start the Vite development server:

```bash
pnpm run dev
# Opens at http://localhost:5173
```

By default, the application serves precomputed dataset artifacts directly from `apps/web/public/data/`, allowing you to inspect visualizations, filters, and event profiles offline.

---

## Working with the Data Pipeline

The data pipeline is written in Rust ([data-pipeline/](file:///Users/rj/Code/ranajahanzaib/fireball-observatory/data-pipeline)) using Apache Arrow and Parquet.

### Running with the Fixture Dataset

For fast local testing without downloading the full 294 MB source file, a 10,000-record fixture is provided at `data/fixtures/sample_meteors.parquet`:

```bash
cargo run --manifest-path data-pipeline/Cargo.toml -- ingest \
  --input data/fixtures/sample_meteors.parquet \
  --output target/local_test
```

### Ingesting the Full Dataset

```bash
pnpm run data:download
pnpm run data:build
pnpm run data:verify
```

---

## Pull Request Guidelines

1. **Create a branch:** `git checkout -b feature/your-feature-name`
2. **Write tests:** Add tests in `apps/web/src/test/`, `packages/shared/src/`, or `data-pipeline/tests/` for new features or bug fixes.
3. **Verify checks:** Ensure `pnpm run typecheck`, `pnpm run test`, and `pnpm run build` all pass cleanly with zero warnings.
4. **Submit PR:** Open a pull request against `main` with a clear description of changes, motivation, and test steps.

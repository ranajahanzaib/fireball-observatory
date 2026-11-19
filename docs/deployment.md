# Deployment Guide

This guide describes how to deploy **Fireball Observatory** to Cloudflare's serverless infrastructure using Cloudflare Workers, Static Assets, and Cloudflare R2 object storage.

---

## Architecture Overview

```
                      ┌────────────────────────────┐
                      │    Cloudflare DNS / CDN    │
                      └─────────────┬──────────────┘
                                    │
                                    ▼
                      ┌────────────────────────────┐
                      │     Cloudflare Worker      │
                      │  (`worker/src/index.ts`)   │
                      └──────┬──────────────┬──────┘
                             │              │
       Static Web Requests   │              │  Data Requests (/data/*)
                             ▼              ▼
           ┌──────────────────────┐   ┌──────────────────────┐
           │ Cloudflare Workers   │   │    Cloudflare R2     │
           │ Static Assets (SPA)  │   │  (Dataset Artifacts) │
           │ `apps/web/dist`      │   │ `fireball-observatory│
           └──────────────────────┘   └──────────────────────┘
```

The system runs entirely within Cloudflare's Free-plan limits:

- **Cloudflare Workers:** Zero request-time table scans; delivers fast static files and streams R2 assets.
- **Cloudflare R2:** Zero egress fees; stores ~200 MB of precomputed partitions and JSON artifacts.
- **Cloudflare Static Assets:** Native static asset routing for the Vite React SPA with client-side SPA fallback.

---

## Prerequisites

1. [Node.js](https://nodejs.org/) (v20 or v22 LTS)
2. [pnpm](https://pnpm.io/) (v10 or later)
3. [Rust](https://rustup.rs/) (v1.80 or later)
4. A [Cloudflare Account](https://dash.cloudflare.com/)
5. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (installed automatically via devDependencies)

---

## 1. Cloudflare R2 Bucket Provisioning

Create the Cloudflare R2 storage bucket:

```bash
# Log in to Cloudflare CLI
pnpm wrangler login

# Create the R2 bucket for precomputed dataset artifacts
pnpm wrangler r2 bucket create fireball-observatory-data
```

Verify your bucket:

```bash
pnpm wrangler r2 bucket list
```

---

## 2. Ingestion & Preprocessing

Download the real Parquet file and run the Rust precomputation pipeline:

```bash
# 1. Download official GMN Parquet dataset (~294 MB)
pnpm run data:download

# 2. Run Rust precomputation pipeline (generates artifacts and partitions)
pnpm run data:build

# 3. Verify cryptographic SHA-256 integrity across all artifacts
pnpm run data:verify
```

The artifacts are written to `data/processed/` and automatically synchronized to `apps/web/public/data/` for local development.

---

## 3. Upload Artifacts to Cloudflare R2

Upload the processed artifacts and daily compressed partitions to your R2 bucket:

```bash
# Upload artifacts to Cloudflare R2
pnpm run data:upload
```

The upload script (`scripts/upload-to-r2.sh`) uses `wrangler r2 object put` with optimal Content-Type headers (`application/json`, `Content-Encoding: gzip` for `.json.gz` partitions).

---

## 4. Build the Web Application

Compile TypeScript packages and bundle the production Vite SPA:

```bash
pnpm run build
```

This compiles:

- `@fireball-observatory/shared` to `packages/shared/dist/`
- `web` React SPA to `apps/web/dist/`
- `worker` TypeScript checks in `worker/`

---

## 5. Configure Worker & Deploy

Review `worker/wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "fireball-observatory",
  "main": "src/index.ts",
  "compatibility_date": "2024-11-01",
  "assets": {
    "directory": "../apps/web/dist",
    "binding": "ASSETS",
    "html_handling": "single-page-application",
    "not_found_handling": "single-page-application",
  },
  "r2_buckets": [
    {
      "binding": "DATA_BUCKET",
      "bucket_name": "fireball-observatory-data",
    },
  ],
}
```

Deploy the unified Worker and Static Assets in one command:

```bash
pnpm run deploy
```

Wrangler uploads the static SPA bundle, binds the R2 bucket, and outputs your production deployment URL:

```text
Uploaded 14 files (3.42 MB)
Deployed fireball-observatory to https://fireball-observatory.<your-subdomain>.workers.dev
```

---

## Local Development & Testing

You do not need a live Cloudflare account to run or develop Fireball Observatory locally:

```bash
# Start Vite development server
pnpm run dev
# Opens at http://localhost:5173
```

During local development, the SPA directly fetches artifacts from `apps/web/public/data/`, allowing instant testing of all views, charts, and event permalinks offline.

To test the Worker locally with Miniflare:

```bash
cd worker
pnpm dev
# Runs local Worker with local static asset serving on http://localhost:8787
```

---

## Continuous Integration (CI)

The repository includes a complete GitHub Actions workflow (`.github/workflows/ci.yml`) that runs on every pull request and push to `main`:

1. Checks out repository with Git LFS/fixture support.
2. Installs Rust toolchain and caches dependencies.
3. Sets up Node.js 22 and pnpm 10.
4. Executes `cargo test` on the Rust data pipeline.
5. Ingests and verifies the 10,000-event fixture dataset (`data/fixtures/sample_meteors.parquet`).
6. Runs TypeScript `pnpm typecheck` across all packages.
7. Runs the complete test suite (`pnpm test`).
8. Verifies production bundle creation (`pnpm build`).

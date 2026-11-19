# Architecture & Infrastructure

## Overview

**Fireball Observatory** is an open-source, high-performance web platform designed to analyze, visualize, and explore **3,707,142 meteor trajectory solutions** from the [Global Meteor Network (GMN)](https://globalmeteornetwork.org) dataset curated by Julien Simon.

Rather than maintaining a heavy, expensive analytical database server, Fireball Observatory employs a **decoupled offline-analytical pipeline + edge CDN & object storage architecture** designed for Cloudflare's serverless ecosystem (Cloudflare Workers, Cloudflare Pages/Static Assets, and Cloudflare R2).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             OFFLINE PIPELINE                                │
│                                                                             │
│  Hugging Face GMN Dataset       Rust Pipeline Binary (`fireball-pipeline`)  │
│  [294 MB Parquet, 3.7M rows] ──▶ Ingestion, Precomputation, Partitioning   │
│                                           │                                 │
│                                           ▼                                 │
│                     ┌─────────────────────────────────────┐                 │
│                     │       Precomputed Artifacts         │                 │
│                     │  - Manifest with SHA-256 Checksums  │                 │
│                     │  - 1D Distributions (Histograms)    │                 │
│                     │  - 2D Velocity-Altitude Heatmap     │                 │
│                     │  - Fireball & Outlier Catalogs      │                 │
│                     │  - Daily Compressed Partitions (.gz)│                 │
│                     └─────────────────────────────────────┘                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼ Deploy / Sync
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EDGE DELIVERY TIER                                │
│                                                                             │
│   Cloudflare R2 Object Storage      Cloudflare Workers & Static Assets      │
│   (Persistent Analytical Bucket)    - Edge Caching (stale-while-revalidate) │
│                                     - Native Range & Content-Encoding Gzip  │
│                                     - Zero request-time table scans         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼ HTTP/2 + Streaming
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                 │
│                                                                             │
│   React 19 SPA (Vite + TypeScript + Tailwind CSS + Apache ECharts)          │
│   - Streams precomputed JSON & gzipped daily event partitions               │
│   - Client-side Web Streams API (`DecompressionStream('gzip')`)             │
│   - Instant client-side filtering, percentile gauging, and astronomical math │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Why Not Query 3.7 Million Rows in a Cloudflare Worker?

Traditional web applications often connect request handlers directly to an operational or analytical database. For this dataset and infrastructure target, doing so presents major bottlenecks:

1. **Worker Compute & Memory Limits:**
   Cloudflare Workers running on the Free tier have strict CPU execution time limits (50 ms on Bundled/Free) and memory caps (128 MB). Loading a 294 MB compressed Parquet file or parsing millions of records in memory per request will cause immediate worker termination (`Worker exceeded memory limit`).

2. **D1 Database Storage Constraints:**
   Cloudflare D1 on the Free plan imposes a 500 MB database size limit. A relational import of 3.7 million records with necessary indexes across `datetime_utc`, `peak_abs_magnitude`, `v_g_kms`, `peak_height_km`, and `shower_code` easily exceeds 1.2 GB, violating Free-plan constraints.

3. **Latency and Predictability:**
   Analytical aggregations (such as 2D binning across 3.7 million points or percentile calculations) require multi-second CPU-intensive scans if executed on demand.

### The Solution: Deterministic Offline Precomputation

Fireball Observatory completely decouples **heavy scientific computation** from **interactive user exploration**:

- The high-performance Rust pipeline processes all 3.7M records in **~6.4 seconds** on a modern multi-core machine.
- Precomputed matrices, histograms, percentile tables, and outlier catalogs are emitted as small, optimized JSON payloads (each between 5 KB and 150 KB).
- Daily event records are partitioned into date folders (`events/YYYY/MM/DD.json.gz`) and compressed with Gzip, averaging **8–30 KB per day**.
- Browsers decompress daily event partitions on demand using the native Web Streams API (`DecompressionStream('gzip')`), consuming negligible bandwidth.

---

## Artifact Specifications

All artifacts are cataloged in `manifest.json` with cryptographic SHA-256 checksums, byte sizes, and numeric bounds:

| Artifact               | Typical Path                           | Format    | Size    | Purpose                                                                            |
| ---------------------- | -------------------------------------- | --------- | ------- | ---------------------------------------------------------------------------------- |
| Manifest               | `/data/manifest.json`                  | JSON      | ~4 KB   | Dataset metadata, SHA-256 verification hashes, date ranges, total records          |
| Summary                | `/data/summary.json`                   | JSON      | ~8 KB   | Global aggregates, shower counts, record counts, overall parameter percentiles     |
| Time Series            | `/data/timeseries.json`                | JSON      | ~45 KB  | Monthly observation counts, fireball counts, and active observing station averages |
| Magnitude Distribution | `/data/distributions/magnitude.json`   | JSON      | ~7 KB   | 100-bin histogram of absolute magnitudes with cumulative distributions             |
| Altitude Distribution  | `/data/distributions/altitude.json`    | JSON      | ~6 KB   | 80-bin histogram of peak brightness heights (km)                                   |
| Velocity Distribution  | `/data/distributions/velocity.json`    | JSON      | ~5 KB   | 70-bin histogram of geocentric velocities ($v_g \in [11, 74]$ km/s)                |
| Duration Distribution  | `/data/distributions/duration.json`    | JSON      | ~5 KB   | 60-bin histogram of visible meteor durations (seconds)                             |
| Shower Distribution    | `/data/distributions/showers.json`     | JSON      | ~130 KB | Statistical summary for all 427 IAU showers + sporadic background                  |
| 2D Density Matrix      | `/data/density/velocity_altitude.json` | JSON      | ~15 KB  | $60 \times 60$ 2D binned density grid for velocity vs. altitude visualization      |
| Representative Sample  | `/data/scatter/sample.json`            | JSON      | ~190 KB | 5,000 stratified representative trajectory samples for interactive scatter plots   |
| Fireballs Catalog      | `/data/catalogs/fireballs.json`        | JSON      | ~2.2 MB | Complete catalog of 14,484 fireballs ($M \le -4.0$) with station counts            |
| Brightest Meteors      | `/data/catalogs/brightest.json`        | JSON      | ~25 KB  | Top 100 brightest recorded meteor events                                           |
| Unusual Outliers       | `/data/catalogs/unusual.json`          | JSON      | ~35 KB  | Extreme events: hypervelocity, deep atmospheric penetration, ultra-long durations  |
| Daily Event Partitions | `/data/events/YYYY/MM/DD.json.gz`      | Gzip JSON | 8–30 KB | Full trajectory measurements for all events on a specific UTC day                  |

---

## Edge Delivery & Worker Routing

The Cloudflare Worker in `worker/src/index.ts` serves requests through the following logic:

1. **CORS Headers:** Full CORS support (`Access-Control-Allow-Origin: *`, `GET, HEAD, OPTIONS`) is enabled for all data endpoints.
2. **Cache Headers:**
   - Precomputed summary artifacts: `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` (1 day edge cache, 7 days background revalidation).
   - Manifest: `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` (1 hour edge cache).
3. **Transparent Compression:**
   - When serving `.json.gz` partitions from Cloudflare R2, the worker inspects the client's `Accept-Encoding` header. If `gzip` is supported, the compressed payload is streamed directly with `Content-Encoding: gzip` and `Content-Type: application/json`, eliminating decompression overhead at the edge.
4. **Static Fallback:**
   - If an R2 bucket binding `DATA_BUCKET` is not configured (such as during local Vite development or static preview builds), the Worker falls back to `env.ASSETS.fetch(request)`, resolving assets directly from the `apps/web/public/data` directory.

---

## Client Application Architecture

The web application is built with modern web technologies:

- **React 19 & TypeScript:** Strict typing across astronomical schemas and UI states.
- **React Router 7:** Client-side routing with deep-linking support for filters, thresholds, and event identifiers.
- **Apache ECharts:** Accelerated canvas-based rendering for 2D density heatmaps, multi-series histograms, and orbital scatter plots.
- **Tailwind CSS:** Deep celestial color palette (slate, indigo, cyan, amber) with high contrast for night-sky reading.
- **Lucide Icons:** Clean astronomical and interface iconography.

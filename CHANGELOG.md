# Changelog

All notable changes to **Fireball Observatory** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-19

### Added

- **Data Pipeline:** High-performance Rust CLI (`fireball-pipeline`) ingesting 3,707,142 meteor records from the Global Meteor Network Parquet dataset.
- **Precomputed Artifacts:** Emits 1D distributions (magnitude, altitude, velocity, duration, shower counts), 2D velocity-altitude density matrix, and 2,391 daily event partitions (`.json.gz`).
- **Cryptographic Manifest:** Automated SHA-256 verification and range profiling across all generated artifacts (`manifest.json`).
- **Overview Dashboard (`/`):** Real-time key metrics, interactive histograms, temporal timeline trends, and brightest-observation preview.
- **Brightest Fireballs Catalog (`/fireballs`):** Filterable, searchable, and pageable catalog with configurable absolute magnitude threshold ($M_{abs} \le -4.0$ default), shower filters, and quick inspection drawer.
- **2D Trajectory Explorer (`/explore`):** Accelerated Canvas-based 2D density heatmap and representative scatter plot comparing geocentric velocity against peak altitude.
- **Shower Comparison (`/showers`):** Multi-shower comparative analysis across 427 IAU showers and sporadic meteors.
- **Individual Event Permalinks (`/events/:eventId`):** Deep inspection for each trajectory with 3D Keplerian orbital elements, percentile position gauges, and related event discovery.
- **Cloudflare Edge Infrastructure:** Lightweight Cloudflare Worker streaming daily `.json.gz` partitions from R2 with native HTTP compression and Static Assets SPA delivery.
- **Documentation & Testing:** Complete test suites across Rust, TypeScript, and React with comprehensive technical and scientific documentation.

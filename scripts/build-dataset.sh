#!/usr/bin/env bash
set -euo pipefail

INPUT="data/raw/gmn_meteors.parquet"
OUTPUT="data/processed"
REVISION="a4fa100587ced657b6f16b35ea7234fcb9c59294"

if [ ! -f "${INPUT}" ]; then
  echo "Raw dataset not found at ${INPUT}."
  echo "Run ./scripts/download-dataset.sh first."
  exit 1
fi

echo "Building dataset analytical artifacts with Rust pipeline..."
(
  cd data-pipeline
  cargo run --release -- ingest \
    --input "../${INPUT}" \
    --output "../${OUTPUT}" \
    --revision "${REVISION}" \
    --copy-to-web
)

echo "Copying event partitions to web application..."
mkdir -p apps/web/public/data
cp -r "${OUTPUT}/events" apps/web/public/data/

echo "✓ Dataset build completed successfully."

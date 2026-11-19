#!/usr/bin/env bash
set -euo pipefail

PROCESSED_DIR="data/processed"

if [ ! -f "${PROCESSED_DIR}/manifest.json" ]; then
  echo "Processed manifest not found at ${PROCESSED_DIR}/manifest.json."
  echo "Run ./scripts/build-dataset.sh first."
  exit 1
fi

echo "Verifying processed dataset artifacts..."
(
  cd data-pipeline
  cargo run --release -- verify --dir "../${PROCESSED_DIR}"
)

echo "✓ Dataset verification passed."

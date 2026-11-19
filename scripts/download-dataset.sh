#!/usr/bin/env bash
set -euo pipefail

DEST_DIR="data/raw"
DEST_FILE="${DEST_DIR}/gmn_meteors.parquet"
EXPECTED_SHA="43ff55a8b3f911ffe586e12059895d28c90f8a6cc81c657f7cfc070ba0692a76"
URL="https://huggingface.co/datasets/juliensimon/global-meteor-network/resolve/main/data/gmn_meteors.parquet"

mkdir -p "${DEST_DIR}"

if [ -f "${DEST_FILE}" ]; then
  echo "Checking existing file ${DEST_FILE}..."
  ACTUAL_SHA=$(shasum -a 256 "${DEST_FILE}" | awk '{print $1}')
  if [ "${ACTUAL_SHA}" = "${EXPECTED_SHA}" ]; then
    echo "✓ ${DEST_FILE} already exists and checksum matches: ${EXPECTED_SHA}"
    exit 0
  else
    echo "Checksum mismatch (expected ${EXPECTED_SHA}, got ${ACTUAL_SHA}). Re-downloading..."
  fi
fi

echo "Downloading Global Meteor Network Parquet dataset from Hugging Face..."
echo "URL: ${URL}"
curl -L --fail --progress-bar -o "${DEST_FILE}" "${URL}"

echo "Verifying SHA-256 checksum..."
ACTUAL_SHA=$(shasum -a 256 "${DEST_FILE}" | awk '{print $1}')
if [ "${ACTUAL_SHA}" != "${EXPECTED_SHA}" ]; then
  echo "Error: Checksum verification failed!"
  echo "Expected: ${EXPECTED_SHA}"
  echo "Actual:   ${ACTUAL_SHA}"
  exit 1
fi

echo "✓ Download complete and verified successfully: ${DEST_FILE}"

#!/usr/bin/env bash
set -euo pipefail

PROCESSED_DIR="${1:-data/processed}"
BUCKET_NAME="${R2_BUCKET_NAME:-fireball-observatory-data}"

if [ ! -f "${PROCESSED_DIR}/manifest.json" ]; then
  echo "Error: Manifest not found at ${PROCESSED_DIR}/manifest.json"
  echo "Run 'pnpm data:build' first."
  exit 1
fi

echo "=== Uploading Fireball Observatory Artifacts to Cloudflare R2 ==="
echo "Source: ${PROCESSED_DIR}"
echo "Bucket: ${BUCKET_NAME}"

# Verify wrangler is installed
if ! command -v wrangler &> /dev/null && ! command -v npx &> /dev/null; then
  echo "Error: wrangler or npx is required to upload to Cloudflare R2."
  exit 1
fi

UPLOAD_CMD="npx wrangler r2 object put"

echo "1. Uploading dataset manifest..."
${UPLOAD_CMD} "${BUCKET_NAME}/manifest.json" --file "${PROCESSED_DIR}/manifest.json" --content-type "application/json"

echo "2. Uploading statistical aggregates..."
${UPLOAD_CMD} "${BUCKET_NAME}/summary.json" --file "${PROCESSED_DIR}/summary.json" --content-type "application/json"
${UPLOAD_CMD} "${BUCKET_NAME}/timeseries.json" --file "${PROCESSED_DIR}/timeseries.json" --content-type "application/json"

echo "3. Uploading distributions..."
for f in "${PROCESSED_DIR}/distributions"/*.json; do
  fname=$(basename "$f")
  ${UPLOAD_CMD} "${BUCKET_NAME}/distributions/${fname}" --file "$f" --content-type "application/json"
done

echo "4. Uploading 2D density matrices..."
${UPLOAD_CMD} "${BUCKET_NAME}/density/velocity_altitude.json" --file "${PROCESSED_DIR}/density/velocity_altitude.json" --content-type "application/json"

echo "5. Uploading catalogs..."
for f in "${PROCESSED_DIR}/catalogs"/*.json; do
  fname=$(basename "$f")
  ${UPLOAD_CMD} "${BUCKET_NAME}/catalogs/${fname}" --file "$f" --content-type "application/json"
done

echo "6. Uploading scatter sample..."
${UPLOAD_CMD} "${BUCKET_NAME}/scatter/sample.json" --file "${PROCESSED_DIR}/scatter/sample.json" --content-type "application/json"

echo "7. Uploading event date partitions..."
if [ -d "${PROCESSED_DIR}/events" ]; then
  find "${PROCESSED_DIR}/events" -name "*.json.gz" | while read -r gz_file; do
    rel_path="${gz_file#${PROCESSED_DIR}/}"
    ${UPLOAD_CMD} "${BUCKET_NAME}/${rel_path}" --file "$gz_file" --content-type "application/json" --content-encoding "gzip"
  done
fi

echo "✓ All artifacts successfully uploaded to R2 bucket: ${BUCKET_NAME}"

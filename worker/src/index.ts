export interface Env {
  DATA_BUCKET?: R2Bucket;
  ASSETS?: Fetcher;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, If-None-Match",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle OPTIONS CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: CORS_HEADERS,
      });
    }

    // API or Data routes -> serve from R2 bucket
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/data/")) {
      let r2Key = url.pathname.replace(/^\/(api|data)\//, "");

      // Rewrite route aliases
      if (r2Key === "density/velocity-altitude") {
        r2Key = "density/velocity_altitude.json";
      } else if (
        !r2Key.endsWith(".json") &&
        !r2Key.endsWith(".json.gz") &&
        !r2Key.includes(".")
      ) {
        r2Key = `${r2Key}.json`;
      }

      // Check R2 bucket binding
      if (env.DATA_BUCKET) {
        try {
          const object = await env.DATA_BUCKET.get(r2Key);
          if (!object) {
            // Also try with .json or .json.gz extension
            const altObject = await env.DATA_BUCKET.get(`${r2Key}.gz`);
            if (altObject) {
              return createStreamResponse(altObject, true);
            }
            return new Response(
              JSON.stringify({ error: `Not found: ${r2Key}` }),
              {
                status: 404,
                headers: {
                  ...CORS_HEADERS,
                  "Content-Type": "application/json",
                },
              },
            );
          }

          const isGzip = r2Key.endsWith(".gz");
          return createStreamResponse(object, isGzip);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          return new Response(
            JSON.stringify({ error: "R2 retrieval failed", details: message }),
            {
              status: 500,
              headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            },
          );
        }
      }

      // If R2 not bound in local dev, fallback to static assets
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return new Response(
        JSON.stringify({ error: "Data bucket not configured" }),
        {
          status: 503,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    // Default: static frontend assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Fireball Observatory Worker online", {
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
    });
  },
};

function createStreamResponse(object: R2ObjectBody, isGzip: boolean): Response {
  const headers = new Headers(CORS_HEADERS);
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Content-Type", "application/json; charset=utf-8");

  if (isGzip) {
    headers.set("Content-Encoding", "gzip");
  }

  // Cache-Control: manifest short cache, immutable artifacts long cache
  if (object.key.includes("manifest.json")) {
    headers.set("Cache-Control", "public, max-age=300");
  } else {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  }

  return new Response(object.body, {
    headers,
  });
}

import { describe, expect, it, vi } from "vitest";
import worker from "./index";

describe("Fireball Observatory Worker", () => {
  it("handles CORS OPTIONS requests", async () => {
    const request = new Request("http://localhost/api/manifest", {
      method: "OPTIONS",
    });
    const response = await worker.fetch(request, {});
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("returns 404 when object not found in R2", async () => {
    const mockBucket: any = {
      get: vi.fn().mockResolvedValue(null),
    };
    const request = new Request("http://localhost/api/unknown-file.json");
    const response = await worker.fetch(request, { DATA_BUCKET: mockBucket });
    expect(response.status).toBe(404);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain("Not found");
  });

  it("streams object from R2 with proper cache headers", async () => {
    const mockObject: any = {
      key: "summary.json",
      httpEtag: '"12345"',
      writeHttpMetadata: vi.fn(),
      body: JSON.stringify({ total_records: 3707142 }),
    };
    const mockBucket: any = {
      get: vi.fn().mockResolvedValue(mockObject),
    };

    const request = new Request("http://localhost/api/summary.json");
    const response = await worker.fetch(request, { DATA_BUCKET: mockBucket });
    expect(response.status).toBe(200);
    expect(response.headers.get("ETag")).toBe('"12345"');
    expect(response.headers.get("Cache-Control")).toContain("max-age=31536000");
  });

  it("falls back to ASSETS fetcher when R2 is not bound", async () => {
    const mockAssets: any = {
      fetch: vi.fn().mockResolvedValue(new Response("index.html content")),
    };
    const request = new Request("http://localhost/");
    const response = await worker.fetch(request, { ASSETS: mockAssets });
    expect(response.status).toBe(200);
    expect(mockAssets.fetch).toHaveBeenCalled();
  });
});

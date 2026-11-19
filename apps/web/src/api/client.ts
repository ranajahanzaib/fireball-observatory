import type {
  CatalogMeteorItem,
  DatasetManifest,
  Density2DData,
  GlobalSummary,
  HistogramDistribution,
  MeteorEvent,
  ScatterSampleData,
  ShowerStats,
  TimeSeriesData,
  UnusualEvent,
} from "@fireball-observatory/shared";

const cache = new Map<string, Promise<unknown>>();

async function fetchJson<T>(url: string): Promise<T> {
  if (cache.has(url)) {
    return cache.get(url) as Promise<T>;
  }

  const promise = (async () => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `Failed to fetch ${url}: ${res.status} ${res.statusText}`,
      );
    }
    return res.json() as Promise<T>;
  })();

  cache.set(url, promise);
  return promise;
}

export const api = {
  getManifest(): Promise<DatasetManifest> {
    return fetchJson<DatasetManifest>("/data/manifest.json");
  },

  getSummary(): Promise<GlobalSummary> {
    return fetchJson<GlobalSummary>("/data/summary.json");
  },

  getTimeseries(): Promise<TimeSeriesData> {
    return fetchJson<TimeSeriesData>("/data/timeseries.json");
  },

  getMagnitudeDistribution(): Promise<HistogramDistribution> {
    return fetchJson<HistogramDistribution>(
      "/data/distributions/magnitude.json",
    );
  },

  getAltitudeDistribution(): Promise<HistogramDistribution> {
    return fetchJson<HistogramDistribution>(
      "/data/distributions/altitude.json",
    );
  },

  getVelocityDistribution(): Promise<HistogramDistribution> {
    return fetchJson<HistogramDistribution>(
      "/data/distributions/velocity.json",
    );
  },

  getDurationDistribution(): Promise<HistogramDistribution> {
    return fetchJson<HistogramDistribution>(
      "/data/distributions/duration.json",
    );
  },

  getShowerDistributions(): Promise<Record<string, ShowerStats>> {
    return fetchJson<Record<string, ShowerStats>>(
      "/data/distributions/showers.json",
    );
  },

  getDensity(): Promise<Density2DData> {
    return fetchJson<Density2DData>("/data/density/velocity_altitude.json");
  },

  getBrightest(): Promise<CatalogMeteorItem[]> {
    return fetchJson<CatalogMeteorItem[]>("/data/catalogs/brightest.json");
  },

  getFireballs(): Promise<CatalogMeteorItem[]> {
    return fetchJson<CatalogMeteorItem[]>("/data/catalogs/fireballs.json");
  },

  getUnusual(): Promise<UnusualEvent[]> {
    return fetchJson<UnusualEvent[]>("/data/catalogs/unusual.json");
  },

  getScatterSample(): Promise<ScatterSampleData> {
    return fetchJson<ScatterSampleData>("/data/scatter/sample.json");
  },

  /**
   * Resolves an individual event profile.
   * Checks fast catalog caches first, then loads the relevant date partition.
   */
  async getEvent(id: string): Promise<MeteorEvent | null> {
    // 1. Check if it exists in unusual events
    try {
      const unusual = await this.getUnusual();
      const match = unusual.find((u) => u.event.id === id);
      if (match) {
        return {
          id: match.event.id,
          datetime_utc: match.event.datetime_utc,
          shower_code: match.event.shower_code,
          shower_name: match.event.shower_name,
          radiant_ra_deg: 0,
          radiant_dec_deg: 0,
          v_g_kms: match.event.v_g_kms,
          a_au: match.event.a_au ?? null,
          e: match.event.e ?? null,
          i_deg: match.event.i_deg ?? null,
          peri_deg: null,
          node_deg: null,
          q_au: null,
          peak_abs_magnitude: match.event.peak_abs_magnitude,
          peak_height_km: match.event.peak_height_km,
          duration_sec: match.event.duration_sec,
          n_stations: match.event.n_stations,
          is_fireball: match.event.peak_abs_magnitude <= -4,
          is_hyperbolic: (match.event.e ?? 0) >= 1.0,
        };
      }
    } catch {
      // Continue to partition search
    }

    // 2. Extract date YYYY/MM/DD from ID format: gmn_YYYYMMDD_HHMMSS_...
    const dateMatch = id.match(/^gmn_(\d{4})(\d{2})(\d{2})_/);
    if (!dateMatch) {
      return null;
    }

    const [, year, month, day] = dateMatch;
    const partitionPath = `/data/events/${year}/${month}/${day}.json.gz`;

    try {
      const res = await fetch(partitionPath);
      if (!res.ok) {
        // Fallback to checking fireballs catalog
        const fireballs = await this.getFireballs();
        const fb = fireballs.find((f) => f.id === id);
        if (fb) {
          return {
            id: fb.id,
            datetime_utc: fb.datetime_utc,
            shower_code: fb.shower_code,
            shower_name: fb.shower_name,
            radiant_ra_deg: 0,
            radiant_dec_deg: 0,
            v_g_kms: fb.v_g_kms,
            a_au: fb.a_au ?? null,
            e: fb.e ?? null,
            i_deg: fb.i_deg ?? null,
            peri_deg: null,
            node_deg: null,
            q_au: null,
            peak_abs_magnitude: fb.peak_abs_magnitude,
            peak_height_km: fb.peak_height_km,
            duration_sec: fb.duration_sec,
            n_stations: fb.n_stations,
            is_fireball: fb.peak_abs_magnitude <= -4,
            is_hyperbolic: (fb.e ?? 0) >= 1.0,
          };
        }
        return null;
      }

      let events: MeteorEvent[] = [];
      const contentEncoding = res.headers.get("Content-Encoding");

      if (contentEncoding === "gzip") {
        events = await res.json();
      } else {
        // Decompress using Web Streams DecompressionStream
        const blob = await res.blob();
        if (typeof DecompressionStream !== "undefined") {
          const ds = new DecompressionStream("gzip");
          const decompressedStream = blob.stream().pipeThrough(ds);
          const decompressedRes = new Response(decompressedStream);
          events = await decompressedRes.json();
        } else {
          events = JSON.parse(await blob.text());
        }
      }

      return events.find((e) => e.id === id) || null;
    } catch (err) {
      console.error("Error fetching event partition:", err);
      // Fallback to searching fireballs
      try {
        const fireballs = await this.getFireballs();
        const fb = fireballs.find((f) => f.id === id);
        if (fb) {
          return {
            id: fb.id,
            datetime_utc: fb.datetime_utc,
            shower_code: fb.shower_code,
            shower_name: fb.shower_name,
            radiant_ra_deg: 0,
            radiant_dec_deg: 0,
            v_g_kms: fb.v_g_kms,
            a_au: fb.a_au ?? null,
            e: fb.e ?? null,
            i_deg: fb.i_deg ?? null,
            peri_deg: null,
            node_deg: null,
            q_au: null,
            peak_abs_magnitude: fb.peak_abs_magnitude,
            peak_height_km: fb.peak_height_km,
            duration_sec: fb.duration_sec,
            n_stations: fb.n_stations,
            is_fireball: fb.peak_abs_magnitude <= -4,
            is_hyperbolic: (fb.e ?? 0) >= 1.0,
          };
        }
      } catch {
        // ignore
      }
      return null;
    }
  },
};

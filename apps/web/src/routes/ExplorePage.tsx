import type { CatalogMeteorItem } from "@fireball-observatory/shared";
import {
  formatAltitude,
  formatDuration,
  formatMagnitude,
  formatStationCount,
  formatVelocity,
} from "@fireball-observatory/shared";
import {
  Compass,
  ExternalLink,
  Flame,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  useAltitudeDistribution,
  useDensity,
  useDurationDistribution,
  useMagnitudeDistribution,
  useScatterSample,
  useSummary,
  useUnusual,
  useVelocityDistribution,
} from "../api/hooks";
import { DensityScatterPlot } from "../components/charts/DensityScatterPlot";
import { HistogramPlot } from "../components/charts/HistogramPlot";
import { Badge } from "../components/common/Badge";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { QuickViewDrawer } from "../components/common/QuickViewDrawer";

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // API Data
  const {
    data: density,
    loading: densityLoading,
    error: densityError,
  } = useDensity();
  const { data: scatterSample, loading: sampleLoading } = useScatterSample();
  const { data: summary } = useSummary();
  const { data: magDist } = useMagnitudeDistribution();
  const { data: altDist } = useAltitudeDistribution();
  const { data: vgDist } = useVelocityDistribution();
  const { data: durDist } = useDurationDistribution();
  const { data: unusualEvents } = useUnusual();

  // Selection & Drawer
  const [selectedEvent, setSelectedEvent] = useState<CatalogMeteorItem | null>(
    null,
  );
  const [drawerEvent, setDrawerEvent] = useState<CatalogMeteorItem | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<
    | "velocity-altitude"
    | "magnitude"
    | "altitude"
    | "velocity"
    | "duration"
    | "stations"
    | "outliers"
  >("velocity-altitude");

  // Filters from query params
  const showerFilter = searchParams.get("shower") || "";
  const minStations = searchParams.get("minStations")
    ? Number(searchParams.get("minStations"))
    : 2;
  const maxMagThreshold = searchParams.get("maxMag")
    ? Number(searchParams.get("maxMag"))
    : null;

  const updateParam = (key: string, val: string | number | null) => {
    const next = new URLSearchParams(searchParams);
    if (val === null || val === "") {
      next.delete(key);
    } else {
      next.set(key, String(val));
    }
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearchParams({});
  };

  // Filtered samples based on active filters
  const filteredSamples = useMemo(() => {
    if (!scatterSample) return [];
    return scatterSample.sample_points.filter((p) => {
      if (showerFilter && p.shower_code !== showerFilter) return false;
      if (p.n_stations < minStations) return false;
      if (maxMagThreshold !== null && p.peak_abs_magnitude > maxMagThreshold)
        return false;
      return true;
    });
  }, [scatterSample, showerFilter, minStations, maxMagThreshold]);

  if (densityLoading || sampleLoading) {
    return (
      <LoadingState
        message="Assembling velocity-altitude density matrix..."
        subtext="Processing 3,707,142 observations"
      />
    );
  }

  if (densityError || !density || !scatterSample) {
    return (
      <ErrorState message="Could not load velocity-altitude density dataset." />
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-space-800 pb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-6 h-6 text-astro-cyan" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Observational Data Explorer
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Multi-dimensional analysis across velocity, altitude, brightness
              distributions, and statistical outliers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-space-900 border border-space-700 text-slate-300">
              Exact Population:{" "}
              <strong className="text-astro-cyan">3,707,142</strong>
            </span>
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-space-900 border border-space-700 text-slate-300">
              Interactive Marks:{" "}
              <strong className="text-fireball-400">
                {filteredSamples.length}
              </strong>
            </span>
          </div>
        </div>

        {/* Global Filter Toolbar */}
        <div className="mt-4 p-4 rounded-xl bg-space-900/60 border border-space-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Shower Filter */}
            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-400">Shower:</label>
              <select
                value={showerFilter}
                onChange={(e) => updateParam("shower", e.target.value)}
                className="bg-space-950 border border-space-700 text-slate-200 text-xs font-mono rounded px-2.5 py-1 focus:outline-none focus:border-astro-cyan"
              >
                <option value="">All Showers & Sporadic</option>
                <option value="...">Sporadic Background (...)</option>
                <option value="GEM">Geminids (GEM)</option>
                <option value="PER">Perseids (PER)</option>
                <option value="ORI">Orionids (ORI)</option>
                <option value="QUA">Quadrantids (QUA)</option>
                <option value="ETA">eta Aquariids (ETA)</option>
                <option value="LYR">Lyrids (LYR)</option>
                <option value="LEO">Leonids (LEO)</option>
                <option value="CAP">alpha Capricornids (CAP)</option>
              </select>
            </div>

            {/* Min Stations Filter */}
            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-400">Min Stations:</label>
              <select
                value={minStations}
                onChange={(e) =>
                  updateParam("minStations", Number(e.target.value))
                }
                className="bg-space-950 border border-space-700 text-slate-200 text-xs font-mono rounded px-2.5 py-1 focus:outline-none focus:border-astro-cyan"
              >
                <option value={2}>2+ Stations (Standard)</option>
                <option value={3}>3+ Stations</option>
                <option value={4}>4+ Stations</option>
                <option value={6}>6+ High-Precision</option>
              </select>
            </div>

            {/* Brightness Filter */}
            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-400">Brightness:</label>
              <select
                value={maxMagThreshold === null ? "" : String(maxMagThreshold)}
                onChange={(e) =>
                  updateParam(
                    "maxMag",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="bg-space-950 border border-space-700 text-slate-200 text-xs font-mono rounded px-2.5 py-1 focus:outline-none focus:border-astro-cyan"
              >
                <option value="">All Brightness Levels</option>
                <option value="-2">≤ -2.0 mag (Bright)</option>
                <option value="-4">≤ -4.0 mag (Fireballs)</option>
                <option value="-6">≤ -6.0 mag (Brilliant)</option>
                <option value="-8">≤ -8.0 mag (Superbolides)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {(showerFilter || minStations > 2 || maxMagThreshold !== null) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Explorer Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-space-800">
        <button
          onClick={() => setActiveTab("velocity-altitude")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
            activeTab === "velocity-altitude"
              ? "bg-space-800 text-astro-cyan border border-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-space-850"
          }`}
        >
          Velocity vs. Altitude (2D Matrix)
        </button>
        <button
          onClick={() => setActiveTab("magnitude")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
            activeTab === "magnitude"
              ? "bg-space-800 text-fireball-400 border border-amber-500/30"
              : "text-slate-400 hover:text-white hover:bg-space-850"
          }`}
        >
          Magnitude Distribution
        </button>
        <button
          onClick={() => setActiveTab("velocity")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
            activeTab === "velocity"
              ? "bg-space-800 text-astro-cyan border border-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-space-850"
          }`}
        >
          Velocity Spectrum
        </button>
        <button
          onClick={() => setActiveTab("altitude")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
            activeTab === "altitude"
              ? "bg-space-800 text-emerald-400 border border-emerald-500/30"
              : "text-slate-400 hover:text-white hover:bg-space-850"
          }`}
        >
          Peak Altitude Layering
        </button>
        <button
          onClick={() => setActiveTab("duration")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
            activeTab === "duration"
              ? "bg-space-800 text-white border border-space-700"
              : "text-slate-400 hover:text-white hover:bg-space-850"
          }`}
        >
          Visible Duration
        </button>
        <button
          onClick={() => setActiveTab("stations")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
            activeTab === "stations"
              ? "bg-space-800 text-astro-cyan border border-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-space-850"
          }`}
        >
          Observing Stations
        </button>
        <button
          onClick={() => setActiveTab("outliers")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
            activeTab === "outliers"
              ? "bg-space-800 text-rose-300 border border-rose-500/30"
              : "text-slate-400 hover:text-white hover:bg-space-850"
          }`}
        >
          Statistical Outliers ({unusualEvents?.length ?? 0})
        </button>
      </div>

      {/* Tab 1: Flagship Velocity vs Altitude */}
      {activeTab === "velocity-altitude" && (
        <div className="space-y-6">
          <DensityScatterPlot
            density={density}
            samplePoints={filteredSamples}
            unusualPoints={unusualEvents ?? []}
            selectedEvent={selectedEvent}
            onSelectEvent={(ev) => setSelectedEvent(ev)}
          />

          {/* Selected Observation Inspection Panel */}
          {selectedEvent && (
            <div className="observatory-card rounded-2xl p-5 border border-fireball-500/40 bg-space-900/90 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-space-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-fireball-500/20 text-fireball-400 flex items-center justify-center border border-fireball-500/30">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Selected Observation Profile
                    </h3>
                    <span className="font-mono text-xs text-fireball-400">
                      {selectedEvent.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDrawerEvent(selectedEvent)}
                    className="px-3 py-1.5 rounded-lg bg-space-800 hover:bg-space-700 text-xs font-medium text-slate-200 transition-colors"
                  >
                    Quick View
                  </button>
                  <Link
                    to={`/events/${selectedEvent.id}`}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-fireball-500 hover:bg-fireball-600 text-space-950 font-bold text-xs transition-colors"
                  >
                    <span>Full Event Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-space-950 border border-space-800">
                  <span className="text-[10px] text-slate-400 block font-sans">
                    Magnitude
                  </span>
                  <span className="text-base font-bold text-fireball-400">
                    {formatMagnitude(selectedEvent.peak_abs_magnitude)}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-space-950 border border-space-800">
                  <span className="text-[10px] text-slate-400 block font-sans">
                    Velocity (v_g)
                  </span>
                  <span className="text-base font-bold text-astro-cyan">
                    {formatVelocity(selectedEvent.v_g_kms)}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-space-950 border border-space-800">
                  <span className="text-[10px] text-slate-400 block font-sans">
                    Peak Altitude
                  </span>
                  <span className="text-base font-bold text-white">
                    {formatAltitude(selectedEvent.peak_height_km)}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-space-950 border border-space-800">
                  <span className="text-[10px] text-slate-400 block font-sans">
                    Visible Duration
                  </span>
                  <span className="text-base font-bold text-slate-200">
                    {formatDuration(selectedEvent.duration_sec)}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-space-950 border border-space-800">
                  <span className="text-[10px] text-slate-400 block font-sans">
                    Shower Code
                  </span>
                  <span className="text-base font-bold text-astro-violet">
                    {selectedEvent.shower_code}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-space-950 border border-space-800">
                  <span className="text-[10px] text-slate-400 block font-sans">
                    Stations
                  </span>
                  <span className="text-base font-bold text-emerald-400">
                    {formatStationCount(selectedEvent.n_stations)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Magnitude Analysis */}
      {activeTab === "magnitude" && magDist && (
        <div className="observatory-card rounded-2xl p-6 border border-space-800 space-y-4">
          <div className="border-b border-space-800 pb-3">
            <h3 className="font-bold text-base text-white">
              Full-Population Absolute Magnitude Distribution
            </h3>
            <p className="text-xs text-slate-400">
              Covers 3.7 million observations. Notice the steep exponential
              decay towards the bright negative tail.
            </p>
          </div>
          <HistogramPlot
            distribution={magDist}
            threshold={-4.0}
            thresholdLabel="Fireball Threshold"
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-space-850 text-xs font-mono">
            <div>
              Median:{" "}
              <strong className="text-white">{magDist.median} mag</strong>
            </div>
            <div>
              p10:{" "}
              <strong className="text-white">
                {magDist.percentiles.p10} mag
              </strong>
            </div>
            <div>
              p90:{" "}
              <strong className="text-white">
                {magDist.percentiles.p90} mag
              </strong>
            </div>
            <div>
              Brightest:{" "}
              <strong className="text-fireball-400">{magDist.min} mag</strong>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Velocity Distribution */}
      {activeTab === "velocity" && vgDist && (
        <div className="observatory-card rounded-2xl p-6 border border-space-800 space-y-4">
          <div className="border-b border-space-800 pb-3">
            <h3 className="font-bold text-base text-white">
              Geocentric Velocity Distribution (km/s)
            </h3>
            <p className="text-xs text-slate-400">
              Clear bimodal peaks corresponding to asteroidal slow encounters
              (~15-30 km/s) and cometary retrograde streams (~60-72 km/s).
            </p>
          </div>
          <HistogramPlot distribution={vgDist} accentColor="#0284c7" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-space-850 text-xs font-mono">
            <div>
              Median v_g:{" "}
              <strong className="text-astro-cyan">{vgDist.median} km/s</strong>
            </div>
            <div>
              p10:{" "}
              <strong className="text-white">
                {vgDist.percentiles.p10} km/s
              </strong>
            </div>
            <div>
              p90:{" "}
              <strong className="text-white">
                {vgDist.percentiles.p90} km/s
              </strong>
            </div>
            <div>
              Solar System Limit:{" "}
              <strong className="text-amber-400">~72.8 km/s</strong>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Altitude Distribution */}
      {activeTab === "altitude" && altDist && (
        <div className="observatory-card rounded-2xl p-6 border border-space-800 space-y-4">
          <div className="border-b border-space-800 pb-3">
            <h3 className="font-bold text-base text-white">
              Peak Brightness Altitude (km)
            </h3>
            <p className="text-xs text-slate-400">
              Altitude in kilometers at peak luminosity. The vast majority of
              meteors ablate and reach peak brightness in the mesosphere (80–95
              km).
            </p>
          </div>
          <HistogramPlot distribution={altDist} accentColor="#059669" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-space-850 text-xs font-mono">
            <div>
              Median Height:{" "}
              <strong className="text-emerald-400">{altDist.median} km</strong>
            </div>
            <div>
              p10:{" "}
              <strong className="text-white">
                {altDist.percentiles.p10} km
              </strong>
            </div>
            <div>
              p90:{" "}
              <strong className="text-white">
                {altDist.percentiles.p90} km
              </strong>
            </div>
            <div>
              Stratospheric Penetration:{" "}
              <strong className="text-rose-400">&lt; 60 km</strong>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Duration Distribution */}
      {activeTab === "duration" && durDist && (
        <div className="observatory-card rounded-2xl p-6 border border-space-800 space-y-4">
          <div className="border-b border-space-800 pb-3">
            <h3 className="font-bold text-base text-white">
              Visible Meteor Duration (seconds)
            </h3>
            <p className="text-xs text-slate-400">
              Recorded duration of the visible trajectory solution.
            </p>
          </div>
          <HistogramPlot distribution={durDist} accentColor="#8b5cf6" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-space-850 text-xs font-mono">
            <div>
              Median Duration:{" "}
              <strong className="text-white">{durDist.median} s</strong>
            </div>
            <div>
              p10:{" "}
              <strong className="text-white">
                {durDist.percentiles.p10} s
              </strong>
            </div>
            <div>
              p90:{" "}
              <strong className="text-white">
                {durDist.percentiles.p90} s
              </strong>
            </div>
            <div>
              Long Grazers:{" "}
              <strong className="text-amber-400">&gt; 3.0 s</strong>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Observing Stations Analysis */}
      {activeTab === "stations" && summary && (
        <div className="observatory-card rounded-2xl p-6 border border-space-800 space-y-6">
          <div className="border-b border-space-800 pb-3">
            <h3 className="font-bold text-base text-white">
              Observing-Station Count Distribution
            </h3>
            <p className="text-xs text-slate-400">
              How observations are distributed across camera station counts.
              More stations improve triangulation geometry.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {summary.station_distribution.slice(0, 8).map((st) => (
              <div
                key={st.stations}
                className="p-4 rounded-xl bg-space-950 border border-space-800 font-mono"
              >
                <span className="text-xs text-slate-400 block font-sans">
                  {st.stations} Camera{" "}
                  {st.stations === 1 ? "Station" : "Stations"}
                </span>
                <span className="text-xl font-bold text-white block my-1">
                  {st.count.toLocaleString()}
                </span>
                <span className="text-xs text-astro-cyan font-bold">
                  {st.percentage}%
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-space-950/60 border border-space-850 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Scientific Note on Multi-Station Triangulation</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Every trajectory solution in this dataset requires a minimum of 2
              synchronized camera stations to resolve 3D atmospheric flight and
              pre-atmospheric orbital elements. Observations detected by 5 to 10
              stations feature superior geometric intersection angles,
              mitigating single-camera timing jitter and atmospheric refraction
              errors.
            </p>
          </div>
        </div>
      )}

      {/* Tab 7: Statistical Outliers */}
      {activeTab === "outliers" && unusualEvents && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">
                Statistical Outliers & Anomalies
              </h3>
              <p className="text-xs text-slate-400">
                Transparently categorized extreme observations based on robust
                population percentiles.
              </p>
            </div>
            <Badge variant="amber">Transparent Criteria</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unusualEvents.map((item, idx) => (
              <div
                key={`${item.event.id}-${idx}`}
                className="observatory-card observatory-card-hover rounded-xl p-5 border border-space-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      item.category === "hyperbolic_orbit"
                        ? "amber"
                        : "fireball"
                    }
                  >
                    {item.category.replace("_", " ").toUpperCase()}
                  </Badge>
                  <span className="font-mono text-xs text-slate-400">
                    {item.percentile_rank}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-white">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {item.reason}
                  </p>
                </div>

                <div className="pt-2 border-t border-space-850 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 truncate max-w-[200px]">
                    {item.event.id}
                  </span>
                  <Link
                    to={`/events/${item.event.id}`}
                    className="inline-flex items-center gap-1 text-fireball-400 hover:underline font-semibold"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <QuickViewDrawer
        event={drawerEvent}
        onClose={() => setDrawerEvent(null)}
      />
    </div>
  );
};

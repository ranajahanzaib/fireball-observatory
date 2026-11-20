import {
  formatAltitude,
  formatDuration,
  formatVelocity,
} from "@fireball-observatory/shared";
import type { EChartsOption } from "echarts";
import { ArrowRight, GitCompare, X } from "lucide-react";
import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useShowerDistributions } from "../api/hooks";
import { EChartBase } from "../components/charts/EChartBase";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";

export const ShowerComparisonPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: showerDistMap, loading, error } = useShowerDistributions();

  // Selected showers from query params or defaults (e.g. GEM, PER, ORI, ...)
  const selectedShowerCodes = useMemo(() => {
    const fromUrl = searchParams.get("s");
    if (fromUrl) {
      return fromUrl.split(",").filter(Boolean);
    }
    return ["GEM", "PER", "ORI", "..."];
  }, [searchParams]);

  const updateSelectedShowers = (newCodes: string[]) => {
    const next = new URLSearchParams(searchParams);
    if (newCodes.length === 0) {
      next.delete("s");
    } else {
      next.set("s", newCodes.join(","));
    }
    setSearchParams(next);
  };

  const addShower = (code: string) => {
    if (!selectedShowerCodes.includes(code) && selectedShowerCodes.length < 4) {
      updateSelectedShowers([...selectedShowerCodes, code]);
    }
  };

  const removeShower = (code: string) => {
    if (selectedShowerCodes.length > 1) {
      updateSelectedShowers(selectedShowerCodes.filter((c) => c !== code));
    }
  };

  const activeStats = useMemo(() => {
    if (!showerDistMap) return [];
    return selectedShowerCodes
      .map((c) => showerDistMap[c])
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
  }, [showerDistMap, selectedShowerCodes]);

  const colors = ["#f59e0b", "#38bdf8", "#a855f7", "#34d399"];

  // Velocity Comparison Chart Option
  const velocityCompareOption: EChartsOption = useMemo(() => {
    const series = activeStats.map((st, idx) => ({
      name: `${st.name} (${st.code})`,
      type: "line" as const,
      smooth: true,
      data: st.histograms.velocity.map((b) => [
        b.bin,
        (b.count / st.total_observations) * 100,
      ]),
      itemStyle: { color: colors[idx % colors.length] },
      lineStyle: { width: 2.5 },
      symbol: "none",
    }));

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "#0d1322",
        borderColor: "#2b3f6c",
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (params: any) => {
          let html = `<div class="font-sans space-y-1 p-1">`;
          html += `<div class="font-bold text-xs text-white border-b border-space-700 pb-1">Velocity: ${params[0].value[0]} km/s</div>`;
          for (const item of params) {
            html += `<div class="flex items-center justify-between gap-4 text-xs">`;
            html += `<span style="color: ${item.color}">${item.seriesName}:</span>`;
            html += `<strong class="font-mono text-white">${Number(item.value[1]).toFixed(1)}% of population</strong>`;
            html += `</div>`;
          }
          html += `</div>`;
          return html;
        },
      },
      legend: {
        show: true,
        top: 0,
        right: "20px",
        textStyle: { color: "#94a3b8", fontSize: 11 },
      },
      grid: { left: "55px", right: "30px", top: "50px", bottom: "45px" },
      xAxis: {
        type: "value",
        name: "Velocity (km/s)",
        nameLocation: "middle",
        nameGap: 24,
        min: 10,
        max: 75,
        axisLabel: { color: "#94a3b8", fontFamily: "monospace" },
        splitLine: {
          lineStyle: { color: "rgba(43, 63, 108, 0.25)", type: "dashed" },
        },
      },
      yAxis: {
        type: "value",
        name: "Normalized %",
        axisLabel: {
          color: "#94a3b8",
          fontFamily: "monospace",
          formatter: "{value}%",
        },
        splitLine: {
          lineStyle: { color: "rgba(43, 63, 108, 0.25)", type: "dashed" },
        },
      },
      series,
    };
  }, [activeStats, colors]);

  // Peak Altitude Comparison Chart Option
  const altitudeCompareOption: EChartsOption = useMemo(() => {
    const series = activeStats.map((st, idx) => ({
      name: `${st.name} (${st.code})`,
      type: "line" as const,
      smooth: true,
      data: st.histograms.peak_height.map((b) => [
        b.bin,
        (b.count / st.total_observations) * 100,
      ]),
      itemStyle: { color: colors[idx % colors.length] },
      lineStyle: { width: 2.5 },
      symbol: "none",
    }));

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "#0d1322",
        borderColor: "#2b3f6c",
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (params: any) => {
          let html = `<div class="font-sans space-y-1 p-1">`;
          html += `<div class="font-bold text-xs text-white border-b border-space-700 pb-1">Altitude: ${params[0].value[0]} km</div>`;
          for (const item of params) {
            html += `<div class="flex items-center justify-between gap-4 text-xs">`;
            html += `<span style="color: ${item.color}">${item.seriesName}:</span>`;
            html += `<strong class="font-mono text-white">${Number(item.value[1]).toFixed(1)}% of population</strong>`;
            html += `</div>`;
          }
          html += `</div>`;
          return html;
        },
      },
      legend: {
        show: true,
        top: 0,
        right: "20px",
        textStyle: { color: "#94a3b8", fontSize: 11 },
      },
      grid: { left: "55px", right: "30px", top: "50px", bottom: "45px" },
      xAxis: {
        type: "value",
        name: "Peak Altitude (km)",
        nameLocation: "middle",
        nameGap: 24,
        min: 60,
        max: 130,
        axisLabel: { color: "#94a3b8", fontFamily: "monospace" },
        splitLine: {
          lineStyle: { color: "rgba(43, 63, 108, 0.25)", type: "dashed" },
        },
      },
      yAxis: {
        type: "value",
        name: "Normalized %",
        axisLabel: {
          color: "#94a3b8",
          fontFamily: "monospace",
          formatter: "{value}%",
        },
        splitLine: {
          lineStyle: { color: "rgba(43, 63, 108, 0.25)", type: "dashed" },
        },
      },
      series,
    };
  }, [activeStats, colors]);

  if (loading) {
    return (
      <LoadingState
        message="Loading meteor shower population data..."
        subtext="Querying cross-shower distributions"
      />
    );
  }

  if (error || !showerDistMap) {
    return (
      <ErrorState message="Could not load shower comparison distributions." />
    );
  }

  const availableShowers = Object.keys(showerDistMap).sort();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-space-800 pb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GitCompare className="w-6 h-6 text-astro-violet" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Meteor Shower Comparison
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select 2 to 4 meteor streams to analyze velocity dispersion, peak
              brightness altitudes, and fireball fractions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Comparing:</span>
            {activeStats.map((st, i) => (
              <span
                key={st.code}
                className="font-mono text-xs px-2 py-0.5 rounded font-bold border"
                style={{
                  color: colors[i % colors.length],
                  borderColor: `${colors[i % colors.length]}55`,
                  backgroundColor: `${colors[i % colors.length]}15`,
                }}
              >
                {st.code}
              </span>
            ))}
          </div>
        </div>

        {/* Shower Selection Bar */}
        <div className="mt-4 p-4 rounded-xl bg-space-900 border border-space-800 flex flex-wrap items-center justify-between gap-4">
          {/* Active chips */}
          <div className="flex flex-wrap items-center gap-2">
            {activeStats.map((st, i) => (
              <div
                key={st.code}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-space-950 border border-space-700 text-xs text-white"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
                <span className="font-bold">{st.name}</span>
                <span className="font-mono text-slate-400">({st.code})</span>
                {selectedShowerCodes.length > 2 && (
                  <button
                    onClick={() => removeShower(st.code)}
                    className="p-0.5 text-slate-400 hover:text-white"
                    title="Remove shower"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Shower Selector */}
          {selectedShowerCodes.length < 4 && (
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addShower(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="bg-space-950 border border-space-700 text-slate-200 text-xs font-mono rounded px-3 py-1.5 focus:outline-none focus:border-astro-violet"
                defaultValue=""
              >
                <option value="" disabled>
                  + Add another shower to compare...
                </option>
                {availableShowers
                  .filter((c) => !selectedShowerCodes.includes(c))
                  .map((code) => {
                    const s = showerDistMap[code];
                    return (
                      <option key={code} value={code}>
                        {s.name} ({code}) —{" "}
                        {s.total_observations.toLocaleString()} obs
                      </option>
                    );
                  })}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Metrics Table */}
      <div className="observatory-card rounded-2xl border border-space-800 overflow-hidden">
        <div className="p-4 border-b border-space-800 bg-space-950/70 flex items-center justify-between">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider">
            Population Summary & Median Comparison
          </h3>
          <span className="text-xs text-slate-400">
            Normalized population comparisons
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-space-800 bg-space-950/90 font-mono text-[11px] text-slate-400">
                <th className="py-3 px-4">Shower</th>
                <th className="py-3 px-4">Total Observations</th>
                <th className="py-3 px-4">Population Share</th>
                <th className="py-3 px-4">Fireball Count (≤ -4)</th>
                <th className="py-3 px-4">Fireball Rate</th>
                <th className="py-3 px-4">Median Velocity</th>
                <th className="py-3 px-4">Median Peak Altitude</th>
                <th className="py-3 px-4">Median Duration</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-850 font-mono">
              {activeStats.map((st, i) => (
                <tr
                  key={st.code}
                  className="hover:bg-space-800/60 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-white">
                    <div className="flex items-center gap-2 font-sans">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: colors[i % colors.length] }}
                      />
                      <span>{st.name}</span>
                      <span className="font-mono text-slate-400 text-xs">
                        ({st.code})
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-200">
                    {st.total_observations.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {st.population_share_pct}%
                  </td>
                  <td className="py-3.5 px-4 font-bold text-fireball-400">
                    {st.fireball_count.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-fireball-400 font-bold">
                    {st.fireball_rate_pct}%
                  </td>
                  <td className="py-3.5 px-4 text-astro-cyan font-bold">
                    {formatVelocity(st.medians.velocity)}
                  </td>
                  <td className="py-3.5 px-4 text-white">
                    {formatAltitude(st.medians.peak_height)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-200">
                    {formatDuration(st.medians.duration)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-sans">
                    <Link
                      to={`/fireballs?shower=${st.code}`}
                      className="inline-flex items-center gap-1 text-xs text-astro-cyan hover:underline font-semibold"
                    >
                      <span>Catalog</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side Visual Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Velocity Distribution Comparison */}
        <div className="observatory-card rounded-2xl p-6 border border-space-800 space-y-4">
          <div className="border-b border-space-800 pb-3">
            <h3 className="font-bold text-base text-white">
              Geocentric Velocity Distribution
            </h3>
            <p className="text-xs text-slate-400">
              Normalized population percentage per velocity bin. Illustrates
              orbital stream coherence.
            </p>
          </div>
          <EChartBase
            option={velocityCompareOption}
            style={{ height: "320px" }}
          />
        </div>

        {/* Peak Altitude Distribution Comparison */}
        <div className="observatory-card rounded-2xl p-6 border border-space-800 space-y-4">
          <div className="border-b border-space-800 pb-3">
            <h3 className="font-bold text-base text-white">
              Peak Altitude Ablation Profile
            </h3>
            <p className="text-xs text-slate-400">
              Normalized population distribution across peak altitude. Faster
              streams ablate higher up.
            </p>
          </div>
          <EChartBase
            option={altitudeCompareOption}
            style={{ height: "320px" }}
          />
        </div>
      </div>
    </div>
  );
};

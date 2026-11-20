import type {
  CatalogMeteorItem,
  Density2DData,
  UnusualEvent,
} from "@fireball-observatory/shared";
import {
  formatAltitude,
  formatDuration,
  formatMagnitude,
  formatStationCount,
  formatVelocity,
} from "@fireball-observatory/shared";
import type { EChartsOption } from "echarts";
import { AlertCircle } from "lucide-react";
import React, { useMemo, useState } from "react";
import { EChartBase } from "./EChartBase";

interface DensityScatterPlotProps {
  density: Density2DData;
  samplePoints: CatalogMeteorItem[];
  unusualPoints: UnusualEvent[];
  selectedEvent: CatalogMeteorItem | null;
  onSelectEvent: (event: CatalogMeteorItem) => void;
  height?: string;
  className?: string;
}

// Logarithmic color ramp for population density heatmap
function getDensityColor(count: number, maxCount: number): string {
  if (count <= 0) return "transparent";
  const norm = Math.min(
    1,
    Math.log10(count + 1) / Math.log10(Math.max(maxCount, 100) + 1),
  );
  if (norm < 0.15) return "rgba(12, 42, 92, 0.55)";
  if (norm < 0.35) return "#0369a1";
  if (norm < 0.55) return "#0284c7";
  if (norm < 0.7) return "#06b6d4";
  if (norm < 0.85) return "#fbbf24";
  if (norm < 0.95) return "#f59e0b";
  return "#ef4444";
}

export const DensityScatterPlot: React.FC<DensityScatterPlotProps> = ({
  density,
  samplePoints,
  unusualPoints,
  selectedEvent,
  onSelectEvent,
  height = "540px",
  className = "",
}) => {
  const [showDensity, setShowDensity] = useState(true);
  const [showSamples, setShowSamples] = useState(true);
  const [showUnusual, setShowUnusual] = useState(true);

  // ECharts Heatmap Data: [x_idx, y_idx, count]
  const heatmapData = useMemo(() => {
    return density.grid.map(([x, y, count]) => [
      density.x_axis.min + x * density.x_axis.step,
      density.y_axis.min + y * density.y_axis.step,
      count,
    ]);
  }, [density]);

  // Sample points: [vg, height, mag, id, shower, duration, stations, eventObj]
  const sampleSeriesData = useMemo(() => {
    return samplePoints.map((p) => ({
      value: [p.v_g_kms, p.peak_height_km, p.peak_abs_magnitude],
      raw: p,
      itemStyle: {
        color:
          p.peak_abs_magnitude <= -4 ? "#fbbf24" : "rgba(56, 189, 248, 0.75)",
        borderColor: "#ffffff",
        borderWidth: 0.5,
      },
    }));
  }, [samplePoints]);

  // Unusual points:
  const unusualSeriesData = useMemo(() => {
    return unusualPoints.map((u) => ({
      value: [
        u.event.v_g_kms,
        u.event.peak_height_km,
        u.event.peak_abs_magnitude,
      ],
      raw: u.event,
      title: u.title,
      category: u.category,
      reason: u.reason,
      itemStyle: {
        color: "#ef4444",
        borderColor: "#fde047",
        borderWidth: 1.5,
      },
    }));
  }, [unusualPoints]);

  const option: EChartsOption = useMemo(() => {
    const series: any[] = [];

    // 1. Full population density heatmap via custom rect series
    if (showDensity) {
      series.push({
        name: "Population Density",
        type: "custom",
        coordinateSystem: "cartesian2d",
        xAxisIndex: 0,
        yAxisIndex: 0,
        renderItem: (_params: any, api: any) => {
          const x = api.value(0);
          const y = api.value(1);
          const count = api.value(2);
          const p0 = api.coord([x, y]);
          const p1 = api.coord([
            x + density.x_axis.step,
            y + density.y_axis.step,
          ]);
          return {
            type: "rect",
            shape: {
              x: Math.min(p0[0], p1[0]),
              y: Math.min(p0[1], p1[1]),
              width: Math.max(2, Math.abs(p1[0] - p0[0])),
              height: Math.max(2, Math.abs(p1[1] - p0[1])),
            },
            style: {
              fill: getDensityColor(count, density.max_cell_count),
            },
          };
        },
        data: heatmapData,
        encode: {
          x: 0,
          y: 1,
          tooltip: 2,
        },
        z: 1,
      });
    }

    // 2. Selectable representative sample points
    if (showSamples) {
      series.push({
        name: "Representative Sample",
        type: "scatter",
        coordinateSystem: "cartesian2d",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: sampleSeriesData,
        z: 2,
        symbolSize: (val: any) => {
          const mag = Array.isArray(val)
            ? val[2]
            : typeof val === "object"
              ? val?.value?.[2]
              : 0;
          if (mag !== undefined && mag <= -6) return 9;
          if (mag !== undefined && mag <= -4) return 6;
          return 4;
        },
        emphasis: {
          scale: 1.8,
          itemStyle: {
            color: "#f59e0b",
            borderColor: "#ffffff",
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: "#f59e0b",
          },
        },
      });
    }

    // 3. Highlighted unusual observation markers
    if (showUnusual) {
      series.push({
        name: "Statistical Outliers",
        type: "scatter",
        coordinateSystem: "cartesian2d",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: unusualSeriesData,
        z: 3,
        symbol: "diamond",
        symbolSize: 12,
        emphasis: {
          scale: 2.0,
          itemStyle: {
            borderColor: "#ffffff",
            borderWidth: 2.5,
          },
        },
      });
    }

    // 4. Selected event highlight marker
    if (selectedEvent) {
      series.push({
        name: "Selected Observation",
        type: "scatter",
        coordinateSystem: "cartesian2d",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: [
          {
            value: [selectedEvent.v_g_kms, selectedEvent.peak_height_km],
            raw: selectedEvent,
          },
        ],
        symbol: "pin",
        symbolSize: 28,
        itemStyle: {
          color: "#f59e0b",
          borderColor: "#ffffff",
          borderWidth: 2,
          shadowBlur: 15,
          shadowColor: "#f59e0b",
        },
        z: 5,
      });
    }

    return {
      backgroundColor: "transparent",
      animation: false,
      tooltip: {
        trigger: "item",
        backgroundColor: "#0d1322",
        borderColor: "#2b3f6c",
        borderWidth: 1,
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (params: any) => {
          if (params.seriesName === "Population Density") {
            const [vg, h, count] = params.value;
            return `
              <div class="font-sans space-y-1 p-1">
                <div class="font-bold text-astro-cyan text-xs uppercase tracking-wider">Density Bin (3.7M Population)</div>
                <div class="text-xs">Velocity: <strong class="font-mono">${vg.toFixed(1)} km/s</strong></div>
                <div class="text-xs">Peak Altitude: <strong class="font-mono">${h.toFixed(1)} km</strong></div>
                <div class="text-xs border-t border-space-700 pt-1 mt-1">Observations in cell: <strong class="font-mono text-fireball-400">${Number(count).toLocaleString()}</strong></div>
              </div>
            `;
          }

          const raw = params.data?.raw as CatalogMeteorItem;
          if (!raw) return "";

          const isUnusual = params.seriesName === "Statistical Outliers";
          return `
            <div class="font-sans space-y-1.5 p-1 max-w-xs">
              <div class="flex items-center justify-between gap-2 border-b border-space-700 pb-1">
                <span class="font-bold text-xs text-white">${raw.shower_name} (${raw.shower_code})</span>
                <span class="font-mono text-[10px] text-fireball-400">${formatMagnitude(raw.peak_abs_magnitude)}</span>
              </div>
              <div class="text-[11px] font-mono text-slate-400">${raw.id}</div>
              <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <div>Velocity: <strong class="font-mono text-white">${formatVelocity(raw.v_g_kms)}</strong></div>
                <div>Peak Height: <strong class="font-mono text-white">${formatAltitude(raw.peak_height_km)}</strong></div>
                <div>Duration: <strong class="font-mono text-white">${formatDuration(raw.duration_sec)}</strong></div>
                <div>Stations: <strong class="font-mono text-white">${formatStationCount(raw.n_stations)}</strong></div>
              </div>
              ${
                isUnusual
                  ? `<div class="text-[11px] text-amber-300 font-semibold border-t border-space-700 pt-1 mt-1">${params.data.title}: ${params.data.reason}</div>`
                  : ""
              }
              <div class="text-[10px] text-astro-cyan mt-1 italic">Click point to inspect event details</div>
            </div>
          `;
        },
      },
      legend: {
        show: false,
      },
      grid: {
        left: "70px",
        right: "30px",
        top: "30px",
        bottom: "80px",
      },
      xAxis: {
        type: "value",
        name: "Geocentric Velocity v_g (km/s)",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: { color: "#94a3b8", fontSize: 12, fontWeight: "bold" },
        min: 10,
        max: 75,
        splitLine: {
          lineStyle: { color: "rgba(43, 63, 108, 0.25)", type: "dashed" },
        },
        axisLabel: { color: "#94a3b8", fontFamily: "monospace" },
        axisLine: { lineStyle: { color: "#1e2d4d" } },
      },
      yAxis: {
        type: "value",
        name: "Peak Brightness Altitude (km)",
        nameLocation: "middle",
        nameGap: 46,
        nameTextStyle: { color: "#94a3b8", fontSize: 12, fontWeight: "bold" },
        min: 50,
        max: 130,
        splitLine: {
          lineStyle: { color: "rgba(43, 63, 108, 0.25)", type: "dashed" },
        },
        axisLabel: { color: "#94a3b8", fontFamily: "monospace" },
        axisLine: { lineStyle: { color: "#1e2d4d" } },
      },
      dataZoom: [
        {
          type: "inside",
          xAxisIndex: 0,
          filterMode: "none",
        },
        {
          type: "slider",
          show: true,
          xAxisIndex: 0,
          filterMode: "none",
          bottom: "12px",
          height: "18px",
          borderColor: "#1e2d4d",
          backgroundColor: "#0d1322",
          fillerColor: "rgba(56, 189, 248, 0.2)",
          handleStyle: { color: "#38bdf8" },
          textStyle: { color: "#94a3b8", fontSize: 10 },
        },
      ],
      series,
    };
  }, [
    density,
    heatmapData,
    sampleSeriesData,
    unusualSeriesData,
    selectedEvent,
    showDensity,
    showSamples,
    showUnusual,
  ]);

  const onChartEvents = {
    click: (params: any) => {
      if (params.data?.raw) {
        onSelectEvent(params.data.raw);
      }
    },
  };

  return (
    <div
      className={`observatory-card rounded-2xl p-5 border border-space-800 ${className}`}
    >
      {/* Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-space-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-white">
              Velocity vs. Peak Brightness Altitude
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-space-800 text-astro-cyan border border-space-700">
              {density.total_binned_points.toLocaleString()} Observations
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Full-population 2D density heatmap overlaid with selectable
            representative samples and outliers
          </p>
        </div>

        {/* Layer Toggles & Legend */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDensity(!showDensity)}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              showDensity
                ? "bg-sky-950 text-astro-cyan border-sky-600/50"
                : "bg-space-900 text-slate-400 border-space-700"
            }`}
          >
            Density Heatmap
          </button>
          <button
            onClick={() => setShowSamples(!showSamples)}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              showSamples
                ? "bg-amber-950 text-fireball-400 border-amber-600/50"
                : "bg-space-900 text-slate-400 border-space-700"
            }`}
          >
            Sample Marks ({samplePoints.length})
          </button>
          <button
            onClick={() => setShowUnusual(!showUnusual)}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              showUnusual
                ? "bg-rose-950 text-rose-300 border-rose-600/50"
                : "bg-space-900 text-slate-400 border-space-700"
            }`}
          >
            Outliers ({unusualPoints.length})
          </button>
        </div>
      </div>

      {/* Main ECharts Canvas */}
      <EChartBase option={option} style={{ height }} onEvents={onChartEvents} />

      {/* Scientific Semantics Reminder */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-space-850 pt-3">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Note: Axes represent point-in-time peak brightness values, not
            atmospheric trajectory path vectors.
          </span>
        </div>
        <span className="font-mono text-slate-400">
          Scroll to zoom • Drag to pan
        </span>
      </div>
    </div>
  );
};

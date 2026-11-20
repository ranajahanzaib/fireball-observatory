import type { HistogramDistribution } from "@fireball-observatory/shared";
import type { EChartsOption } from "echarts";
import React, { useMemo } from "react";
import { EChartBase } from "./EChartBase";

interface HistogramPlotProps {
  distribution: HistogramDistribution;
  title?: string;
  threshold?: number;
  thresholdLabel?: string;
  height?: string;
  accentColor?: string;
}

export const HistogramPlot: React.FC<HistogramPlotProps> = ({
  distribution,
  title,
  threshold,
  thresholdLabel = "Threshold",
  height = "320px",
  accentColor = "#0284c7",
}) => {
  const option: EChartsOption = useMemo(() => {
    const xData = distribution.bins.map((b) => b.bin_start);
    const yData = distribution.bins.map((b) => b.count);

    const markLineData: any[] = [
      {
        type: "median",
        name: "Median",
        lineStyle: { color: "#38bdf8", type: "dashed", width: 2 },
        label: {
          formatter: `Median: ${distribution.median} ${distribution.unit}`,
          color: "#38bdf8",
          fontSize: 10,
          position: "insideEndTop",
        },
      },
    ];

    if (threshold !== undefined) {
      markLineData.push({
        xAxis: threshold,
        name: thresholdLabel,
        lineStyle: { color: "#f59e0b", width: 2, type: "solid" },
        label: {
          formatter: `${thresholdLabel} (${threshold} ${distribution.unit})`,
          color: "#fbbf24",
          position: "insideEndTop",
          fontSize: 11,
          fontWeight: "bold",
        },
      });
    }

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "#0d1322",
        borderColor: "#2b3f6c",
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (params: any) => {
          const item = params[0];
          const binIndex = item.dataIndex;
          const bin = distribution.bins[binIndex];
          if (!bin) return "";

          return `
            <div class="font-sans space-y-1 p-1">
              <div class="text-xs font-bold text-white">Interval: <span class="font-mono text-astro-cyan">${bin.bin_start} to ${bin.bin_end} ${distribution.unit}</span></div>
              <div class="text-xs">Observations: <strong class="font-mono text-fireball-400">${bin.count.toLocaleString()}</strong></div>
              <div class="text-[11px] text-slate-400 border-t border-space-700 pt-1 mt-1">Cumulative: <strong class="font-mono">${bin.cumulative_pct}%</strong></div>
            </div>
          `;
        },
      },
      grid: {
        left: "60px",
        right: "45px",
        top: "30px",
        bottom: "40px",
      },
      xAxis: {
        type: "category",
        data: xData,
        axisLabel: {
          color: "#94a3b8",
          fontFamily: "monospace",
          formatter: (val: string) => Number(val).toFixed(0),
        },
        axisLine: { lineStyle: { color: "#1e2d4d" } },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: "#94a3b8",
          fontFamily: "monospace",
          formatter: (val: number) =>
            val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`,
        },
        axisLine: { lineStyle: { color: "#1e2d4d" } },
        splitLine: {
          lineStyle: { color: "rgba(43, 63, 108, 0.25)", type: "dashed" },
        },
      },
      series: [
        {
          name: distribution.field,
          type: "bar",
          data: yData,
          barCategoryGap: "8%",
          itemStyle: {
            color: (params: any) => {
              const bin = distribution.bins[params.dataIndex];
              // If magnitude histogram and below threshold, highlight in warm amber!
              if (
                threshold !== undefined &&
                bin &&
                bin.bin_start <= threshold
              ) {
                return "#f59e0b";
              }
              return accentColor;
            },
            borderRadius: [2, 2, 0, 0],
          },
          markLine: {
            data: markLineData,
            symbol: "none",
          },
        },
      ],
    };
  }, [distribution, threshold, thresholdLabel, accentColor]);

  return (
    <div className="w-full">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {title}
          </h4>
          <span className="text-[10px] font-mono text-slate-400">
            Total: {distribution.total_records.toLocaleString()} records
          </span>
        </div>
      )}
      <EChartBase option={option} style={{ height }} />
    </div>
  );
};

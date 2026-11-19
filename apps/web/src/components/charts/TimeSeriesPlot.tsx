import type { TimeSeriesData } from "@fireball-observatory/shared";
import type { EChartsOption } from "echarts";
import React, { useMemo } from "react";
import { EChartBase } from "./EChartBase";

interface TimeSeriesPlotProps {
  data: TimeSeriesData;
  height?: string;
  showFireballs?: boolean;
}

export const TimeSeriesPlot: React.FC<TimeSeriesPlotProps> = ({
  data,
  height = "340px",
  showFireballs = true,
}) => {
  const option: EChartsOption = useMemo(() => {
    const dates = data.monthly.map((d) => d.date);
    const totalCounts = data.monthly.map((d) => d.total_count);
    const fireballCounts = data.monthly.map((d) => d.fireball_count);

    const series: any[] = [
      {
        name: "Total Trajectories",
        type: "line",
        data: totalCounts,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: "#38bdf8" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(56, 189, 248, 0.4)" },
              { offset: 1, color: "rgba(56, 189, 248, 0.02)" },
            ],
          },
        },
      },
    ];

    if (showFireballs) {
      series.push({
        name: "Fireballs (≤ -4 mag)",
        type: "line",
        yAxisIndex: 1,
        data: fireballCounts,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: "#f59e0b" },
        itemStyle: { color: "#fbbf24" },
      });
    }

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "#0d1322",
        borderColor: "#2b3f6c",
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (params: any) => {
          let html = `<div class="font-sans space-y-1 p-1">`;
          html += `<div class="font-bold text-xs text-white border-b border-space-700 pb-1">${params[0].axisValue}</div>`;
          for (const item of params) {
            html += `<div class="flex items-center justify-between gap-4 text-xs">`;
            html += `<span style="color: ${item.color}">${item.seriesName}:</span>`;
            html += `<strong class="font-mono text-white">${Number(item.value).toLocaleString()}</strong>`;
            html += `</div>`;
          }
          html += `</div>`;
          return html;
        },
      },
      legend: {
        show: true,
        top: "0px",
        right: "20px",
        textStyle: { color: "#94a3b8", fontSize: 11 },
      },
      grid: {
        left: "60px",
        right: showFireballs ? "60px" : "25px",
        top: "40px",
        bottom: "50px",
      },
      xAxis: {
        type: "category",
        data: dates,
        axisLabel: {
          color: "#94a3b8",
          fontFamily: "monospace",
          interval: 5,
        },
        axisLine: { lineStyle: { color: "#1e2d4d" } },
        splitLine: { show: false },
      },
      yAxis: [
        {
          type: "value",
          name: "Total Trajectories",
          nameTextStyle: { color: "#94a3b8", fontSize: 10 },
          axisLabel: {
            color: "#94a3b8",
            fontFamily: "monospace",
            formatter: (v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`,
          },
          splitLine: {
            lineStyle: { color: "rgba(43, 63, 108, 0.25)", type: "dashed" },
          },
        },
        {
          type: "value",
          name: "Fireballs (≤ -4)",
          show: showFireballs,
          nameTextStyle: { color: "#f59e0b", fontSize: 10 },
          axisLabel: {
            color: "#fbbf24",
            fontFamily: "monospace",
          },
          splitLine: { show: false },
        },
      ],
      series,
      dataZoom: [
        {
          type: "slider",
          show: true,
          bottom: "5px",
          height: "16px",
          borderColor: "#1e2d4d",
          backgroundColor: "#0d1322",
          fillerColor: "rgba(56, 189, 248, 0.2)",
          handleStyle: { color: "#38bdf8" },
          textStyle: { color: "#94a3b8", fontSize: 10 },
        },
      ],
    };
  }, [data, height, showFireballs]);

  return <EChartBase option={option} style={{ height }} />;
};

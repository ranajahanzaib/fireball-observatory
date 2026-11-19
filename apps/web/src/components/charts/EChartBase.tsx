import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import React, { useEffect, useRef } from "react";

interface EChartBaseProps {
  option: EChartsOption;
  style?: React.CSSProperties;
  className?: string;
  onEvents?: Record<string, (params: unknown) => void>;
  loading?: boolean;
}

export const EChartBase: React.FC<EChartBaseProps> = ({
  option,
  style = { height: "360px", width: "100%" },
  className = "",
  onEvents,
  loading = false,
}) => {
  const chartRef = useRef<ReactECharts>(null);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      const chartInstance = chartRef.current?.getEchartsInstance();
      chartInstance?.resize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={`relative w-full ${className}`}>
      <ReactECharts
        ref={chartRef}
        option={option}
        style={style}
        theme="dark"
        notMerge={true}
        lazyUpdate={true}
        onEvents={onEvents}
        opts={{ renderer: "canvas" }}
        showLoading={loading}
        loadingOption={{
          text: "Computing visualization...",
          color: "#f59e0b",
          textColor: "#fde68a",
          maskColor: "rgba(7, 10, 18, 0.8)",
          zlevel: 0,
        }}
      />
    </div>
  );
};

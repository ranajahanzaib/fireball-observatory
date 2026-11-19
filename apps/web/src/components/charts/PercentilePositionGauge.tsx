import React from "react";

interface PercentilePositionGaugeProps {
  label: string;
  valueString: string;
  percentile: number; // 0 to 100
  description: string;
  accent?: "fireball" | "cyan" | "violet" | "emerald";
}

export const PercentilePositionGauge: React.FC<
  PercentilePositionGaugeProps
> = ({ label, valueString, percentile, description, accent = "cyan" }) => {
  const barColor = {
    fireball: "bg-gradient-to-r from-amber-600 to-fireball-400",
    cyan: "bg-gradient-to-r from-sky-600 to-astro-cyan",
    violet: "bg-gradient-to-r from-purple-600 to-astro-violet",
    emerald: "bg-gradient-to-r from-teal-600 to-emerald-400",
  };

  const textColor = {
    fireball: "text-fireball-400",
    cyan: "text-astro-cyan",
    violet: "text-astro-violet",
    emerald: "text-emerald-400",
  };

  const clamped = Math.max(0, Math.min(100, percentile));

  return (
    <div className="p-4 rounded-xl bg-space-900 border border-space-800 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="font-mono font-bold text-white">{valueString}</span>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-space-950 h-2.5 rounded-full overflow-hidden border border-space-800 relative">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor[accent]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-400">{description}</span>
        <span className={`font-mono font-semibold ${textColor[accent]}`}>
          {clamped >= 99 ? "Top 1%" : `${clamped.toFixed(0)}th percentile`}
        </span>
      </div>
    </div>
  );
};

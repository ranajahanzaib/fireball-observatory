import { HelpCircle } from "lucide-react";
import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  description?: string;
  tooltip?: string;
  icon?: React.ReactNode;
  accent?: "fireball" | "cyan" | "violet" | "emerald";
  badge?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  description,
  tooltip,
  icon,
  accent = "cyan",
  badge,
}) => {
  const accentBorder = {
    fireball: "hover:border-fireball-500/50 group-hover:text-fireball-400",
    cyan: "hover:border-astro-cyan/50 group-hover:text-astro-cyan",
    violet: "hover:border-astro-violet/50 group-hover:text-astro-violet",
    emerald: "hover:border-emerald-500/50 group-hover:text-emerald-400",
  };

  const accentText = {
    fireball: "text-fireball-400",
    cyan: "text-astro-cyan",
    violet: "text-astro-violet",
    emerald: "text-emerald-400",
  };

  return (
    <div
      className={`observatory-card observatory-card-hover rounded-xl p-5 border border-space-800 transition-all group ${accentBorder[accent]}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <span>{title}</span>
          {tooltip && (
            <span
              title={tooltip}
              className="cursor-help text-slate-400 hover:text-slate-300"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
        {icon && (
          <div
            className={`${accentText[accent]} opacity-80 group-hover:opacity-100 transition-opacity`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className="text-xs font-mono text-slate-400">{unit}</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mt-2">
        {description && (
          <p className="text-xs text-slate-400 leading-tight">{description}</p>
        )}
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
    </div>
  );
};

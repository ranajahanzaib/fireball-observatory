import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "fireball" | "cyan" | "violet" | "slate" | "emerald" | "amber";
  size?: "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "slate",
  size = "md",
  className = "",
}) => {
  const variantStyles = {
    fireball:
      "bg-amber-950/60 text-fireball-400 border-amber-600/40 shadow-sm shadow-amber-950/40",
    cyan: "bg-sky-950/60 text-astro-cyan border-sky-600/40",
    violet: "bg-purple-950/60 text-astro-violet border-purple-600/40",
    emerald: "bg-emerald-950/60 text-emerald-400 border-emerald-600/40",
    amber: "bg-amber-900/40 text-amber-300 border-amber-500/30",
    slate: "bg-space-800 text-slate-300 border-space-700",
  };

  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-medium rounded border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

import { Loader2 } from "lucide-react";
import React from "react";

interface LoadingStateProps {
  message?: string;
  subtext?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading astronomical data...",
  subtext = "Retrieving precomputed analytical artifacts",
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-space-800 bg-space-900/40 my-6">
      <Loader2 className="w-8 h-8 text-fireball-400 animate-spin mb-3" />
      <span className="text-sm font-medium text-slate-200">{message}</span>
      {subtext && (
        <span className="text-xs text-slate-400 mt-1">{subtext}</span>
      )}
    </div>
  );
};

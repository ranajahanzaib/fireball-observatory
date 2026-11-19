import { AlertCircle, RefreshCw } from "lucide-react";
import React from "react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Observation Data Retrieval Error",
  message = "Failed to load astronomical catalog artifact. Please verify network connectivity or check if artifacts have been published.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-rose-900/40 bg-rose-950/20 my-6">
      <AlertCircle className="w-8 h-8 text-rose-400 mb-3" />
      <span className="text-sm font-semibold text-rose-200">{title}</span>
      <p className="text-xs text-slate-300 max-w-md mt-1 mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-space-800 hover:bg-space-700 border border-space-600 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry request</span>
        </button>
      )}
    </div>
  );
};

import { AlertTriangle, ExternalLink, ShieldCheck } from "lucide-react";
import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-space-800 bg-space-950 mt-16 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Scientific Limitations Banner */}
        <div className="mb-8 p-4 rounded-xl border border-amber-900/30 bg-amber-950/20 text-slate-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-fireball-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-fireball-400 block text-xs uppercase tracking-wider">
              Scientific Limitations & Observational Scope
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              This application explores recorded meteor observations and derived
              statistical summaries from volunteer-operated optical cameras. The
              displayed measurements do not provide a complete atmospheric
              trajectory, an impact location, or a measured impact-energy
              estimate. Peak absolute magnitudes and atmospheric heights
              represent single triangulation peak points, not full physical
              ablation models.
            </p>
          </div>
        </div>

        {/* Attribution & Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-space-850">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-sm text-white">
                Fireball Observatory
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-space-800 text-slate-300 font-mono">
                v1.0.0
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Open-source astronomical platform for analyzing Global Meteor
              Network trajectory solutions, fireball populations, and orbital
              anomalies.
            </p>
          </div>

          <div>
            <span className="font-semibold text-slate-200 block mb-2 text-xs uppercase tracking-wider">
              Data Source & Attribution
            </span>
            <p className="text-slate-400 text-xs mb-3">
              Data:{" "}
              <strong className="text-slate-200">
                Global Meteor Network Trajectory Data
              </strong>
              , compiled and published by{" "}
              <strong className="text-slate-200">Julien Simon</strong> under the{" "}
              <strong className="text-slate-200">
                Creative Commons Attribution 4.0 International (CC BY 4.0)
              </strong>{" "}
              license.
            </p>
            <div className="flex flex-col gap-1.5">
              <a
                href="https://huggingface.co/datasets/juliensimon/global-meteor-network"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-fireball-400 hover:text-fireball-300 transition-colors"
              >
                <span>Hugging Face Dataset Repository</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://globalmeteornetwork.org/data/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-astro-cyan hover:text-cyan-300 transition-colors"
              >
                <span>Global Meteor Network (GMN) Project</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
              >
                <span>Creative Commons CC BY 4.0 License</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div>
            <span className="font-semibold text-slate-200 block mb-2 text-xs uppercase tracking-wider">
              Architecture & Transparency
            </span>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Built with Rust offline analytical preprocessing, Cloudflare
              Workers & R2 for zero-request-time table scans, and Apache ECharts
              for high-performance canvas scatter rendering across 3.7 million
              solutions.
            </p>
            <div className="flex items-center gap-2 text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>100% Real Observations • No Synthetic Fillers</span>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>
            © {new Date().getFullYear()} Fireball Observatory. Released under
            MIT License.
          </p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-slate-400">
              Parquet: 3,707,142 Rows
            </span>
            <span>•</span>
            <span className="font-mono text-slate-400">Commit: a4fa100</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

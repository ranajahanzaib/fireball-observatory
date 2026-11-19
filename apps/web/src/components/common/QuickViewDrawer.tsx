import type { CatalogMeteorItem } from "@fireball-observatory/shared";
import {
  formatAltitude,
  formatDateTimeUTC,
  formatDuration,
  formatMagnitude,
  formatStationCount,
  formatVelocity,
  getMagnitudeComparison,
  getOrbitClassification,
} from "@fireball-observatory/shared";
import {
  Check,
  Copy,
  ExternalLink,
  Flame,
  Gauge,
  ShieldCheck,
  X,
} from "lucide-react";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "./Badge";

interface QuickViewDrawerProps {
  event: CatalogMeteorItem | null;
  onClose: () => void;
}

export const QuickViewDrawer: React.FC<QuickViewDrawerProps> = ({
  event,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!event) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(event.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const orbit = getOrbitClassification(event.e, event.a_au);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-space-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-space-900 border-l border-space-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-space-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-fireball-500/20 text-fireball-400 flex items-center justify-center border border-fireball-500/30">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Meteor Event Quick View
                </h3>
                <span className="text-[11px] text-slate-400">
                  GMN Trajectory Solution
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-space-800 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Event ID banner */}
            <div className="p-3 rounded-lg bg-space-950 border border-space-800 flex items-center justify-between">
              <div className="truncate mr-2">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">
                  Event Identifier
                </span>
                <span className="font-mono text-xs text-fireball-400 truncate block">
                  {event.id}
                </span>
              </div>
              <button
                onClick={handleCopyId}
                className="shrink-0 p-1.5 rounded bg-space-800 hover:bg-space-700 text-slate-300 transition-colors"
                title="Copy Event ID"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Shower & Status */}
            <div className="flex items-center gap-2">
              <Badge variant={event.shower_code === "..." ? "slate" : "violet"}>
                {event.shower_name} ({event.shower_code})
              </Badge>
              {event.peak_abs_magnitude <= -4 && (
                <Badge variant="fireball">Fireball Candidate</Badge>
              )}
              {orbit.type === "hyperbolic" && (
                <Badge variant="amber">Hyperbolic</Badge>
              )}
            </div>

            {/* Primary Measurements Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-space-950/60 border border-space-800">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Peak Absolute Magnitude
                </span>
                <span className="text-xl font-bold font-mono text-fireball-400">
                  {formatMagnitude(event.peak_abs_magnitude)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1 leading-tight">
                  {getMagnitudeComparison(event.peak_abs_magnitude)}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-space-950/60 border border-space-800">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Geocentric Velocity
                </span>
                <span className="text-xl font-bold font-mono text-astro-cyan">
                  {formatVelocity(event.v_g_kms)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1 leading-tight">
                  At atmospheric entry
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-space-950/60 border border-space-800">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Peak Altitude
                </span>
                <span className="text-xl font-bold font-mono text-white">
                  {formatAltitude(event.peak_height_km)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1 leading-tight">
                  Maximum luminosity height
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-space-950/60 border border-space-800">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Visible Duration
                </span>
                <span className="text-xl font-bold font-mono text-white">
                  {formatDuration(event.duration_sec)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1 leading-tight">
                  Recorded optical flight
                </span>
              </div>
            </div>

            {/* Date & Triangulation Stations */}
            <div className="p-4 rounded-lg bg-space-950/40 border border-space-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Observation Time:</span>
                <span className="font-mono text-slate-200">
                  {formatDateTimeUTC(event.datetime_utc)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Observing Cameras:</span>
                <div className="flex items-center gap-1.5 font-mono text-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{formatStationCount(event.n_stations)}</span>
                </div>
              </div>
              {event.e !== undefined && event.e !== null && (
                <div className="flex items-center justify-between text-xs border-t border-space-850 pt-2">
                  <span className="text-slate-400">Orbital Orbit Type:</span>
                  <span className="font-mono text-amber-300 font-semibold">
                    {orbit.label}
                  </span>
                </div>
              )}
            </div>

            {/* Orbit Summary Note */}
            <div className="p-3 rounded-lg bg-space-850 border border-space-750 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-1">
                <Gauge className="w-3.5 h-3.5 text-astro-cyan" />
                <span>Orbital Geometry Solution</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {orbit.description}
              </p>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-6 border-t border-space-800 bg-space-950/80">
            <Link
              to={`/events/${event.id}`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-fireball-500 hover:bg-fireball-600 text-space-950 font-bold text-sm transition-colors shadow-lg shadow-fireball-500/20"
            >
              <span>Inspect Full Event Profile</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

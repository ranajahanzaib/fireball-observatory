import {
  formatAltitude,
  formatDateTimeUTC,
  formatMagnitude,
  formatStationCount,
  formatVelocity,
} from "@fireball-observatory/shared";
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Compass,
  Flame,
  Layers,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useBrightest,
  useMagnitudeDistribution,
  useSummary,
  useTimeseries,
} from "../api/hooks";
import { HistogramPlot } from "../components/charts/HistogramPlot";
import { TimeSeriesPlot } from "../components/charts/TimeSeriesPlot";
import { Badge } from "../components/common/Badge";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { StatCard } from "../components/common/StatCard";

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
  } = useSummary();
  const { data: magDist } = useMagnitudeDistribution();
  const { data: timeseries } = useTimeseries();
  const { data: brightest } = useBrightest();

  const [fireballThreshold, setFireballThreshold] = useState(-4.0);

  if (summaryLoading) {
    return (
      <LoadingState message="Loading observatory metrics and population aggregates..." />
    );
  }

  if (summaryError || !summary) {
    return (
      <ErrorState message="Could not load summary statistics from the Global Meteor Network dataset." />
    );
  }

  const activeFireballCount =
    summary.thresholds[fireballThreshold.toFixed(0)] ??
    summary.fireball_candidates;

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl observatory-card p-8 sm:p-12 border border-space-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fireball-500/10 border border-fireball-500/30 text-fireball-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Global Meteor Network Trajectory Analysis</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Millions of meteors.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fireball-400 via-amber-300 to-amber-500">
              A closer look at the brightest.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Explore individual meteor observations, compare fireball
            populations, and investigate unusual velocity, altitude, and
            brightness measurements from the Global Meteor Network.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/explore"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-fireball-500 to-amber-600 hover:from-fireball-600 hover:to-amber-700 text-space-950 font-bold text-sm shadow-lg shadow-fireball-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Compass className="w-4 h-4" />
              <span>Launch Velocity-Altitude Explorer</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              to="/fireballs"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-space-850 hover:bg-space-800 border border-space-700 text-slate-200 font-semibold text-sm transition-colors"
            >
              <Flame className="w-4 h-4 text-fireball-400" />
              <span>Browse 14,484 Fireball Candidates</span>
            </Link>
          </div>
        </div>

        {/* Subtle background astronomical radial gradient */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-fireball-500/10 via-sky-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Key Population Statistics */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400">
            Observatory Dataset Scope
          </h2>
          <span className="text-xs text-slate-400">
            Source:{" "}
            <strong className="text-slate-300">Julien Simon / GMN</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total Meteor Trajectories"
            value={summary.total_records}
            description="Multi-station triangulation solutions"
            tooltip="Each record is a verified meteor trajectory solution solved from 2+ synchronized camera stations."
            accent="cyan"
            icon={<Layers className="w-5 h-5" />}
          />

          <StatCard
            title="Fireball Candidates (≤ -4 mag)"
            value={summary.fireball_candidates}
            unit="events"
            description="Observations meeting operational brightness threshold"
            tooltip="Operational threshold: absolute magnitude ≤ -4. Brighter than Venus at peak."
            accent="fireball"
            badge={<Badge variant="fireball">≤ -4 mag</Badge>}
            icon={<Flame className="w-5 h-5" />}
          />

          <StatCard
            title="Shower-Associated Meteors"
            value={summary.shower_records}
            description={`${((summary.shower_records / summary.total_records) * 100).toFixed(1)}% of total population`}
            tooltip="Meteors matched to known IAU meteor shower radiants and velocities."
            accent="violet"
            badge={<Badge variant="violet">427 Showers</Badge>}
            icon={<Sparkles className="w-5 h-5" />}
          />

          <StatCard
            title="Sporadic Background Meteors"
            value={summary.sporadic_records}
            description={`${((summary.sporadic_records / summary.total_records) * 100).toFixed(1)}% of total population`}
            tooltip="Meteors designated with code '...', representing sporadic background Solar System dust."
            accent="cyan"
          />

          <StatCard
            title="Median Geocentric Velocity"
            value={summary.percentiles.v_g_kms.p50}
            unit="km/s"
            description="Typical entry velocity at atmospheric top"
            tooltip="Geocentric velocity v_g corrected for Earth rotation and gravitational acceleration."
            accent="cyan"
          />

          <StatCard
            title="Median Peak Altitude"
            value={summary.percentiles.peak_height_km.p50}
            unit="km"
            description="Typical altitude at maximum luminosity"
            tooltip="Altitude above sea level where the meteor reaches its peak visible brightness."
            accent="emerald"
            icon={<ShieldCheck className="w-5 h-5" />}
          />
        </div>
      </section>

      {/* Visualizations Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Magnitude Distribution with Configurable Threshold */}
        <div className="observatory-card rounded-2xl p-6 border border-space-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-space-800 pb-3">
            <div>
              <h3 className="font-bold text-base text-white">
                Absolute Magnitude Distribution
              </h3>
              <p className="text-xs text-slate-400">
                Full-population histogram. Lower values mean brighter meteors.
              </p>
            </div>

            {/* Threshold Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                Fireball Threshold:
              </span>
              <select
                value={fireballThreshold}
                onChange={(e) => setFireballThreshold(Number(e.target.value))}
                className="bg-space-900 border border-space-700 text-fireball-400 text-xs font-mono rounded px-2.5 py-1 focus:outline-none focus:border-fireball-500"
              >
                <option value={-2}>≤ -2 mag (Bright Meteor)</option>
                <option value={-3}>≤ -3 mag</option>
                <option value={-4}>≤ -4 mag (Fireball Default)</option>
                <option value={-6}>≤ -6 mag (Very Bright)</option>
                <option value={-8}>≤ -8 mag (Super Fireball)</option>
              </select>
            </div>
          </div>

          {magDist ? (
            <HistogramPlot
              distribution={magDist}
              threshold={fireballThreshold}
              thresholdLabel="Fireball Threshold"
              accentColor="#0284c7"
            />
          ) : (
            <LoadingState />
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-space-850 pt-3">
            <span>
              Observations at ≤ {fireballThreshold} mag:{" "}
              <strong className="text-fireball-400 font-mono">
                {activeFireballCount.toLocaleString()}
              </strong>
            </span>
            <Link
              to={`/fireballs?maxMag=${fireballThreshold}`}
              className="text-astro-cyan hover:underline inline-flex items-center gap-1 font-semibold"
            >
              <span>Explore in Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Observation Volume Over Time */}
        <div className="observatory-card rounded-2xl p-6 border border-space-800 space-y-4">
          <div className="flex items-center justify-between border-b border-space-800 pb-3">
            <div>
              <h3 className="font-bold text-base text-white">
                Observation Volume Over Time
              </h3>
              <p className="text-xs text-slate-400">
                Monthly trajectories and bright-fireball detections
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-astro-cyan" />
              <span>2018 – 2026</span>
            </div>
          </div>

          {timeseries ? <TimeSeriesPlot data={timeseries} /> : <LoadingState />}

          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-space-850 pt-3">
            <span>
              Shows worldwide network expansion of GMN camera stations
            </span>
            <Link
              to="/explore"
              className="text-astro-cyan hover:underline inline-flex items-center gap-1 font-semibold"
            >
              <span>Explore by Date</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Top Showers Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              Prominent Meteor Shower Populations
            </h3>
            <p className="text-xs text-slate-400">
              Largest recorded populations alongside sporadic meteors
            </p>
          </div>
          <Link
            to="/showers"
            className="flex items-center gap-1.5 text-xs font-semibold text-astro-violet hover:text-purple-300 transition-colors"
          >
            <span>Compare Showers Tool</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {summary.top_showers.slice(0, 4).map((shower) => (
            <div
              key={shower.code}
              onClick={() => navigate(`/showers?s=${shower.code}`)}
              className="observatory-card observatory-card-hover rounded-xl p-4 border border-space-800 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-astro-violet group-hover:text-purple-300">
                  {shower.code}
                </span>
                <Badge variant="violet" size="sm">
                  {shower.fireball_count} Fireballs
                </Badge>
              </div>

              <h4 className="font-bold text-sm text-white group-hover:text-astro-cyan transition-colors truncate">
                {shower.name}
              </h4>

              <div className="mt-3 pt-3 border-t border-space-850 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block">Total Count</span>
                  <span className="text-slate-200 font-bold">
                    {shower.count.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Median v_g</span>
                  <span className="text-astro-cyan font-bold">
                    {formatVelocity(shower.median_v_g)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brightest Recorded Meteors Leaderboard */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-fireball-400" />
            <div>
              <h3 className="text-lg font-bold text-white">
                Brightest Recorded Meteors
              </h3>
              <p className="text-xs text-slate-400">
                Top superbolides sorted by peak absolute magnitude
              </p>
            </div>
          </div>
          <Link
            to="/fireballs"
            className="flex items-center gap-1.5 text-xs font-semibold text-fireball-400 hover:text-amber-300 transition-colors"
          >
            <span>View Full Leaderboard</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="observatory-card rounded-2xl border border-space-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-space-800 bg-space-950/80 font-mono text-[11px] text-slate-400">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Date/Time (UTC)</th>
                  <th className="py-3 px-4">Peak Absolute Magnitude</th>
                  <th className="py-3 px-4">Velocity (v_g)</th>
                  <th className="py-3 px-4">Peak Altitude</th>
                  <th className="py-3 px-4">Shower</th>
                  <th className="py-3 px-4">Stations</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-space-850">
                {brightest?.slice(0, 8).map((event, index) => (
                  <tr
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="hover:bg-space-800/60 cursor-pointer transition-colors group font-mono"
                  >
                    <td className="py-3 px-4 text-fireball-400 font-bold">
                      #{index + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-white group-hover:text-fireball-400 transition-colors whitespace-nowrap">
                      {event.id}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {formatDateTimeUTC(event.datetime_utc)}
                    </td>
                    <td className="py-3 px-4 font-bold text-fireball-400">
                      {formatMagnitude(event.peak_abs_magnitude)}
                    </td>
                    <td className="py-3 px-4 text-astro-cyan">
                      {formatVelocity(event.v_g_kms)}
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {formatAltitude(event.peak_height_km)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-astro-violet font-semibold">
                        {event.shower_code}
                      </span>
                      <span className="text-slate-400 text-[10px] ml-1">
                        ({event.shower_name})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {formatStationCount(event.n_stations)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center text-fireball-400 text-[11px] group-hover:translate-x-0.5 transition-transform">
                        Inspect →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

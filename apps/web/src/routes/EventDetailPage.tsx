import {
  formatAltitude,
  formatAU,
  formatDateTimeUTC,
  formatDegrees,
  formatDuration,
  formatEccentricity,
  formatMagnitude,
  formatVelocity,
  getMagnitudeComparison,
  getOrbitClassification,
} from "@fireball-observatory/shared";
import {
  ArrowLeft,
  Check,
  Copy,
  Flame,
  Gauge,
  Info,
  Share2,
  ShieldCheck,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useEventDetail, useFireballs, useSummary } from "../api/hooks";
import { PercentilePositionGauge } from "../components/charts/PercentilePositionGauge";
import { Badge } from "../components/common/Badge";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, loading, error } = useEventDetail(eventId);
  const { data: summary } = useSummary();
  const { data: fireballs } = useFireballs();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    if (event) {
      navigator.clipboard.writeText(event.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (loading) {
    return (
      <LoadingState
        message="Retrieving event trajectory profile..."
        subtext={`Querying date partition for ${eventId}`}
      />
    );
  }

  if (error || !event) {
    return (
      <div className="space-y-4">
        <Link
          to="/fireballs"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to catalog</span>
        </Link>
        <ErrorState
          title="Observation Event Not Found"
          message={`Unable to locate trajectory record with identifier '${eventId}'. The event might not exist in the dataset partitions or may belong to an unindexed partition.`}
        />
      </div>
    );
  }

  const orbit = getOrbitClassification(event.e, event.a_au);

  // Compute percentile ranks relative to global summary
  const magPct = summary
    ? Math.max(
        1,
        Math.min(
          99,
          100 -
            ((event.peak_abs_magnitude -
              summary.percentiles.peak_abs_magnitude.p01) /
              (summary.percentiles.peak_abs_magnitude.p99 -
                summary.percentiles.peak_abs_magnitude.p01)) *
              100,
        ),
      )
    : 50;

  const vgPct = summary
    ? Math.max(
        1,
        Math.min(
          99,
          ((event.v_g_kms - summary.percentiles.v_g_kms.p01) /
            (summary.percentiles.v_g_kms.p99 -
              summary.percentiles.v_g_kms.p01)) *
            100,
        ),
      )
    : 50;

  const hPct = summary
    ? Math.max(
        1,
        Math.min(
          99,
          ((event.peak_height_km - summary.percentiles.peak_height_km.p01) /
            (summary.percentiles.peak_height_km.p99 -
              summary.percentiles.peak_height_km.p01)) *
            100,
        ),
      )
    : 50;

  const durPct = summary
    ? Math.max(
        1,
        Math.min(
          99,
          ((event.duration_sec - summary.percentiles.duration_sec.p01) /
            (summary.percentiles.duration_sec.p99 -
              summary.percentiles.duration_sec.p01)) *
            100,
        ),
      )
    : 50;

  // Related observations (same shower or similar brightness)
  const relatedShowerEvents = fireballs
    ? fireballs
        .filter((f) => f.shower_code === event.shower_code && f.id !== event.id)
        .slice(0, 4)
    : [];

  const similarMagnitudeEvents = fireballs
    ? fireballs
        .filter(
          (f) =>
            f.id !== event.id &&
            Math.abs(f.peak_abs_magnitude - event.peak_abs_magnitude) <= 0.5,
        )
        .slice(0, 4)
    : [];

  return (
    <div className="space-y-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/fireballs"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Brightest Events Catalog</span>
        </Link>

        {/* Share buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-900 border border-space-700 hover:bg-space-850 text-xs text-slate-300 transition-colors font-mono"
            title="Copy Event Identifier"
          >
            {copiedId ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>Copy ID</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-900 border border-space-700 hover:bg-space-850 text-xs text-slate-300 transition-colors"
            title="Copy URL Link"
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Event Header Card */}
      <div className="observatory-card rounded-2xl p-6 sm:p-8 border border-space-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-fireball-500/20 text-fireball-400 flex items-center justify-center border border-fireball-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
                  {event.id}
                </h1>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Observation Time: {formatDateTimeUTC(event.datetime_utc)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={event.shower_code === "..." ? "slate" : "violet"}>
              {event.shower_name} ({event.shower_code})
            </Badge>

            {event.is_fireball && (
              <Badge variant="fireball">Fireball Candidate (≤ -4 mag)</Badge>
            )}

            {event.is_hyperbolic && (
              <Badge variant="amber">Hyperbolic Orbit</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Measurement Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <div className="observatory-card rounded-xl p-5 border border-space-800 space-y-1">
          <span className="text-xs text-slate-400 block">
            Peak Absolute Magnitude
          </span>
          <span className="text-2xl font-bold font-mono text-fireball-400 block">
            {formatMagnitude(event.peak_abs_magnitude)}
          </span>
          <p className="text-[11px] text-slate-400 pt-1 leading-tight">
            {getMagnitudeComparison(event.peak_abs_magnitude)}
          </p>
        </div>

        <div className="observatory-card rounded-xl p-5 border border-space-800 space-y-1">
          <span className="text-xs text-slate-400 block">
            Geocentric Velocity (v_g)
          </span>
          <span className="text-2xl font-bold font-mono text-astro-cyan block">
            {formatVelocity(event.v_g_kms)}
          </span>
          <p className="text-[11px] text-slate-400 pt-1 leading-tight">
            Corrected atmospheric entry velocity
          </p>
        </div>

        <div className="observatory-card rounded-xl p-5 border border-space-800 space-y-1">
          <span className="text-xs text-slate-400 block">Peak Altitude</span>
          <span className="text-2xl font-bold font-mono text-white block">
            {formatAltitude(event.peak_height_km)}
          </span>
          <p className="text-[11px] text-slate-400 pt-1 leading-tight">
            Altitude of maximum optical brightness
          </p>
        </div>

        <div className="observatory-card rounded-xl p-5 border border-space-800 space-y-1">
          <span className="text-xs text-slate-400 block">Visible Duration</span>
          <span className="text-2xl font-bold font-mono text-white block">
            {formatDuration(event.duration_sec)}
          </span>
          <p className="text-[11px] text-slate-400 pt-1 leading-tight">
            Recorded optical flight time
          </p>
        </div>

        <div className="observatory-card rounded-xl p-5 border border-space-800 space-y-1">
          <span className="text-xs text-slate-400 block">
            Observing Stations
          </span>
          <div className="flex items-center gap-1.5 text-2xl font-bold font-mono text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
            <span>{event.n_stations}</span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1 leading-tight">
            Independent all-sky cameras
          </p>
        </div>
      </div>

      {/* Population Percentile Gauges */}
      <div className="observatory-card rounded-2xl p-6 border border-space-800 space-y-4">
        <div className="border-b border-space-800 pb-3">
          <h3 className="font-bold text-base text-white">
            Relative Position Within Broader Meteor Population
          </h3>
          <p className="text-xs text-slate-400">
            Locates this individual observation compared to all 3,707,142
            trajectory solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <PercentilePositionGauge
            label="Brightness Rank"
            valueString={formatMagnitude(event.peak_abs_magnitude)}
            percentile={magPct}
            description="Relative brightness percentile"
            accent="fireball"
          />

          <PercentilePositionGauge
            label="Velocity Rank"
            valueString={formatVelocity(event.v_g_kms)}
            percentile={vgPct}
            description="Speed percentile rank"
            accent="cyan"
          />

          <PercentilePositionGauge
            label="Peak Altitude"
            valueString={formatAltitude(event.peak_height_km)}
            percentile={hPct}
            description="Atmospheric height percentile"
            accent="emerald"
          />

          <PercentilePositionGauge
            label="Duration"
            valueString={formatDuration(event.duration_sec)}
            percentile={durPct}
            description="Optical duration percentile"
            accent="violet"
          />
        </div>
      </div>

      {/* Orbital Elements & Dynamics */}
      <div className="observatory-card rounded-2xl p-6 border border-space-800 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-space-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-astro-cyan" />
              <h3 className="font-bold text-base text-white">
                Pre-Atmospheric Orbital Elements
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Heliocentric orbital parameters resolved by backwards integration
              through Earth's gravitational field.
            </p>
          </div>

          <Badge variant={orbit.type === "hyperbolic" ? "amber" : "cyan"}>
            {orbit.label}
          </Badge>
        </div>

        {/* Orbital Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-space-950 border border-space-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-sans">
              Semi-Major Axis (a_au)
            </span>
            <span className="text-base font-bold text-white block">
              {formatAU(event.a_au)}
            </span>
            <p className="text-[10px] text-slate-400 font-sans leading-tight">
              Average distance to the Sun. Non-finite or negative values
              indicate open parabolic/hyperbolic trajectories.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-space-950 border border-space-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-sans">
              Orbital Eccentricity (e)
            </span>
            <span className="text-base font-bold text-astro-cyan block">
              {formatEccentricity(event.e)}
            </span>
            <p className="text-[10px] text-slate-400 font-sans leading-tight">
              0 is circular, &lt; 1 is elliptical (bound), &gt; 1 indicates a
              hyperbolic trajectory.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-space-950 border border-space-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-sans">
              Orbital Inclination (i_deg)
            </span>
            <span className="text-base font-bold text-white block">
              {formatDegrees(event.i_deg)}
            </span>
            <p className="text-[10px] text-slate-400 font-sans leading-tight">
              Tilt relative to ecliptic plane. &gt; 90° indicates a retrograde
              orbit moving opposite to Earth.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-space-950 border border-space-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-sans">
              Argument of Perihelion (peri_deg)
            </span>
            <span className="text-base font-bold text-slate-300 block">
              {formatDegrees(event.peri_deg)}
            </span>
            <p className="text-[10px] text-slate-400 font-sans leading-tight">
              Angle from ascending node to perihelion point in the orbital
              plane.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-space-950 border border-space-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-sans">
              Longitude of Ascending Node (node_deg)
            </span>
            <span className="text-base font-bold text-slate-300 block">
              {formatDegrees(event.node_deg)}
            </span>
            <p className="text-[10px] text-slate-400 font-sans leading-tight">
              Angle where the orbit crosses the ecliptic going northward.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-space-950 border border-space-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-sans">
              Perihelion Distance (q_au)
            </span>
            <span className="text-base font-bold text-slate-300 block">
              {formatAU(event.q_au)}
            </span>
            <p className="text-[10px] text-slate-400 font-sans leading-tight">
              Point of closest approach to the Sun. Earth is ~1.0 AU.
            </p>
          </div>
        </div>

        {/* Orbit Explanation Box */}
        <div className="p-4 rounded-xl bg-space-950/70 border border-space-800 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <Info className="w-4 h-4 text-astro-cyan" />
            <span>Astronomical Semantics of This Orbital Solution</span>
          </div>
          <p className="text-slate-400 leading-relaxed">{orbit.description}</p>
        </div>
      </div>

      {/* Related Observations Section */}
      <div className="space-y-4">
        <h3 className="font-bold text-base text-white">
          Related Observations in Catalog
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Same Shower */}
          <div className="observatory-card rounded-xl p-5 border border-space-800 space-y-3">
            <div className="flex items-center justify-between border-b border-space-800 pb-2">
              <span className="text-xs font-bold text-astro-violet uppercase tracking-wider">
                Same Stream: {event.shower_name} ({event.shower_code})
              </span>
              <Link
                to={`/fireballs?shower=${event.shower_code}`}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                View all →
              </Link>
            </div>

            <div className="space-y-2">
              {relatedShowerEvents.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/events/${rel.id}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-space-950 hover:bg-space-800/80 transition-colors font-mono text-xs group"
                >
                  <span className="text-slate-300 group-hover:text-fireball-400 truncate max-w-[200px]">
                    {rel.id}
                  </span>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-fireball-400 font-bold">
                      {formatMagnitude(rel.peak_abs_magnitude)}
                    </span>
                    <span className="text-astro-cyan">
                      {formatVelocity(rel.v_g_kms)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Similar Brightness */}
          <div className="observatory-card rounded-xl p-5 border border-space-800 space-y-3">
            <div className="flex items-center justify-between border-b border-space-800 pb-2">
              <span className="text-xs font-bold text-fireball-400 uppercase tracking-wider">
                Comparable Brightness (±0.5 mag)
              </span>
              <Link
                to={`/fireballs?maxMag=${event.peak_abs_magnitude.toFixed(0)}`}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                View catalog →
              </Link>
            </div>

            <div className="space-y-2">
              {similarMagnitudeEvents.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/events/${rel.id}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-space-950 hover:bg-space-800/80 transition-colors font-mono text-xs group"
                >
                  <div className="truncate max-w-[200px]">
                    <span className="text-slate-300 group-hover:text-fireball-400 block truncate">
                      {rel.id}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {rel.shower_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-fireball-400 font-bold">
                      {formatMagnitude(rel.peak_abs_magnitude)}
                    </span>
                    <span className="text-white">
                      {formatAltitude(rel.peak_height_km)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

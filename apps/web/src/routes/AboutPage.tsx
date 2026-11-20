import {
  AlertTriangle,
  BookOpen,
  Cpu,
  Database,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import React from "react";
import { useManifest } from "../api/hooks";

export const AboutPage: React.FC = () => {
  const { data: manifest } = useManifest();

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Title & Introduction */}
      <div className="border-b border-space-800 pb-6 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-fireball-400" />
          <h1 className="text-3xl font-extrabold text-white">
            About the Data & Scientific Notes
          </h1>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Comprehensive documentation of the Global Meteor Network trajectory
          dataset, physical measurement semantics, operational fireball
          classifications, and analytical architecture.
        </p>
      </div>

      {/* Mandatory Scientific Limitations Banner */}
      <div className="p-5 rounded-2xl border border-amber-900/40 bg-amber-950/20 text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-fireball-400 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Scientific Observational Scope & Limitations Notice</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          This application explores recorded meteor observations and derived
          statistical summaries. The displayed measurements do not provide a
          complete atmospheric trajectory, an impact location, or a measured
          impact-energy estimate. The dataset provides peak brightness altitude,
          not complete atmospheric flight vectors.
        </p>
      </div>

      {/* Dataset Attribution */}
      <section className="observatory-card rounded-2xl p-6 border border-space-800 space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-white border-b border-space-800 pb-3">
          <Database className="w-5 h-5 text-astro-cyan" />
          <h2>Data Source & CC BY 4.0 Attribution</h2>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            <strong>Data Source:</strong> Global Meteor Network Trajectory Data,
            compiled and published by{" "}
            <strong className="text-white">Julien Simon</strong> under the{" "}
            <strong className="text-white">
              Creative Commons Attribution 4.0 International (CC BY 4.0)
            </strong>{" "}
            license.
          </p>

          <p>
            The underlying observations come from the{" "}
            <strong className="text-white">Global Meteor Network (GMN)</strong>,
            which operates over 500 volunteer-maintained optical all-sky video
            cameras worldwide. Each row represents a multi-station triangulation
            solution calculating trajectory and pre-atmospheric orbit from
            simultaneous video captures.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href="https://huggingface.co/datasets/juliensimon/global-meteor-network"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-900 border border-space-700 text-fireball-400 hover:text-amber-300 transition-colors"
            >
              <span>Hugging Face Dataset</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href="https://globalmeteornetwork.org/data/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-900 border border-space-700 text-astro-cyan hover:text-cyan-300 transition-colors"
            >
              <span>Global Meteor Network Data Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-900 border border-space-700 text-slate-300 hover:text-white transition-colors"
            >
              <span>CC BY 4.0 License Terms</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {manifest && (
            <div className="mt-4 p-3 rounded-lg bg-space-950 font-mono text-[11px] grid grid-cols-1 sm:grid-cols-3 gap-2 border border-space-850">
              <div>
                Total Records:{" "}
                <strong className="text-white">
                  {manifest.total_records.toLocaleString()}
                </strong>
              </div>
              <div>
                Source Revision:{" "}
                <strong className="text-white">
                  {manifest.source_revision.slice(0, 10)}
                </strong>
              </div>
              <div>
                Date Range: <strong className="text-white">2018–2026</strong>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Scientific Measurement Semantics */}
      <section className="observatory-card rounded-2xl p-6 border border-space-800 space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-white border-b border-space-800 pb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2>Physical Semantics & Data Dictionary</h2>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div>
            <h3 className="font-bold text-sm text-fireball-400">
              1. Absolute Magnitude (peak_abs_magnitude)
            </h3>
            <p className="mt-1">
              Astronomical magnitude is an inverted logarithmic scale where{" "}
              <strong>more negative numbers represent brighter events</strong>.
              By astronomical convention, an absolute magnitude is defined as
              the brightness the meteor would have at a standard distance of 100
              km at zenith.
            </p>
            <p className="mt-1 text-slate-400">
              Operational Threshold: We adopt{" "}
              <code>peak_abs_magnitude ≤ -4.0</code> as the operational
              threshold for bright-fireball candidate classification (comparable
              to or brighter than planet Venus). The underlying GMN dataset does
              not contain an explicit categorical fireball column.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-sm text-astro-cyan">
              2. Geocentric Velocity (v_g_kms)
            </h3>
            <p className="mt-1">
              Expressed in km/s. Represents the meteoroid's velocity relative to
              Earth before atmospheric deceleration, corrected for Earth's
              gravitational acceleration (zenith attraction) and diurnal
              rotation. Earth's escape velocity is ~11.2 km/s. The maximum
              velocity for a bound solar system meteoroid colliding head-on with
              Earth is ~72.8 km/s.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-sm text-white">
              3. Peak Brightness Altitude (peak_height_km)
            </h3>
            <p className="mt-1">
              Expressed in kilometers above mean sea level. The exact altitude
              where optical luminosity reached its maximum value. Typical
              cometary dust ablates high in the mesosphere (85-100 km), while
              larger, denser asteroidal stones penetrate deeper into the
              stratosphere (&lt; 60 km).
            </p>
          </div>

          <div>
            <h3 className="font-bold text-sm text-astro-violet">
              4. Meteor Showers (shower_code)
            </h3>
            <p className="mt-1">
              Uses International Astronomical Union (IAU) Meteor Data Center
              3-letter codes (e.g. GEM for Geminids, PER for Perseids).{" "}
              <strong>
                The code <code>...</code> designates sporadic background meteors
              </strong>{" "}
              not associated with any established shower radiant stream.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-sm text-emerald-400">
              5. Observing Station Count (n_stations)
            </h3>
            <p className="mt-1">
              Integer count of synchronized camera stations that detected the
              event and contributed rays to the multi-station triangulation
              solution. It is a count, not a list of station identities.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-sm text-amber-300">
              6. Orbital Elements & Non-Finite Values
            </h3>
            <p className="mt-1">
              Includes semi-major axis (<code>a_au</code>), eccentricity (
              <code>e</code>), inclination (<code>i_deg</code>), argument of
              perihelion (<code>peri_deg</code>), longitude of ascending node (
              <code>node_deg</code>), and perihelion distance (<code>q_au</code>
              ).
            </p>
            <p className="mt-1 text-slate-400">
              Non-finite orbital semi-major axes are scientifically meaningful
              in the context of parabolic and hyperbolic trajectories (e ≥ 1.0).
              The pipeline preserves these without discarding records.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture & Offline Ingestion */}
      <section className="observatory-card rounded-2xl p-6 border border-space-800 space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-white border-b border-space-800 pb-3">
          <Cpu className="w-5 h-5 text-astro-cyan" />
          <h2>Why Cloudflare R2 and Precomputed Analytical Artifacts?</h2>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            A common architectural pitfall with large datasets (3.7+ million
            rows) in serverless environments is attempting to query raw tabular
            datasets during HTTP request execution. Scanning 294 MB of Parquet
            files inside a Cloudflare Worker on every user request exceeds
            memory, CPU, and execution timeout quotas.
          </p>
          <p>
            Instead, Fireball Observatory employs a{" "}
            <strong>
              deterministic Rust analytical preprocessing pipeline
            </strong>
            :
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>
              Precomputes exact 1D and 2D density matrices offline in ~6 seconds
              across all 3.7 million rows.
            </li>
            <li>
              Generates stable SHA-256 verified manifests for immutable caching.
            </li>
            <li>
              Partitions detail records into compressed daily packs (
              <code>events/YYYY/MM/DD.json.gz</code>), enabling instant
              on-demand streaming from Cloudflare R2.
            </li>
            <li>
              Maintains 100% Free-plan compatibility on Cloudflare Workers and
              R2 without expensive analytical database subscriptions.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

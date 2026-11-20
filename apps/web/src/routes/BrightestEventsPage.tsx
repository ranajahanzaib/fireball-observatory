import type { CatalogMeteorItem } from "@fireball-observatory/shared";
import {
  formatAltitude,
  formatDateTimeUTC,
  formatDuration,
  formatMagnitude,
  formatStationCount,
  formatVelocity,
} from "@fireball-observatory/shared";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Flame,
  RotateCcw,
  Search,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useFireballs } from "../api/hooks";
import { Badge } from "../components/common/Badge";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { QuickViewDrawer } from "../components/common/QuickViewDrawer";

const PAGE_SIZE = 50;

export const BrightestEventsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: fireballs, loading, error } = useFireballs();

  const [quickViewEvent, setQuickViewEvent] =
    useState<CatalogMeteorItem | null>(null);

  // URL Query Parameters
  const querySearch = searchParams.get("q") || "";
  const queryMaxMag =
    searchParams.get("maxMag") !== null
      ? Number(searchParams.get("maxMag"))
      : -4.0;
  const queryShower = searchParams.get("shower") || "";
  const queryMinStations = searchParams.get("minStations")
    ? Number(searchParams.get("minStations"))
    : 2;
  const queryMinVelocity = searchParams.get("minV")
    ? Number(searchParams.get("minV"))
    : 0;
  const queryMaxVelocity = searchParams.get("maxV")
    ? Number(searchParams.get("maxV"))
    : 100;
  const sortBy = searchParams.get("sort") || "magnitude";
  const sortDir = searchParams.get("dir") || "asc";
  const currentPage = searchParams.get("page")
    ? Number(searchParams.get("page"))
    : 1;

  // Update query params helper
  const updateParam = (key: string, value: string | number | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === "" || (key === "page" && value === 1)) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
    // Reset page to 1 on filter changes
    if (key !== "page") {
      next.delete("page");
    }
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearchParams({});
  };

  // Filter & Sort
  const filteredAndSorted = useMemo(() => {
    if (!fireballs) return [];

    let list = fireballs.filter((f) => {
      // Configurable threshold: lower (more negative) is brighter
      if (f.peak_abs_magnitude > queryMaxMag) return false;

      // Text search
      if (querySearch) {
        const q = querySearch.toLowerCase();
        const matchesId = f.id.toLowerCase().includes(q);
        const matchesShower =
          f.shower_code.toLowerCase().includes(q) ||
          f.shower_name.toLowerCase().includes(q);
        const matchesDate = f.datetime_utc.includes(q);
        if (!matchesId && !matchesShower && !matchesDate) return false;
      }

      // Shower filter
      if (queryShower && f.shower_code !== queryShower) {
        return false;
      }

      // Min stations
      if (f.n_stations < queryMinStations) {
        return false;
      }

      // Velocity range
      if (f.v_g_kms < queryMinVelocity || f.v_g_kms > queryMaxVelocity) {
        return false;
      }

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case "magnitude":
          diff = a.peak_abs_magnitude - b.peak_abs_magnitude; // ascending = brightest first
          break;
        case "velocity":
          diff = a.v_g_kms - b.v_g_kms;
          break;
        case "altitude":
          diff = a.peak_height_km - b.peak_height_km;
          break;
        case "duration":
          diff = a.duration_sec - b.duration_sec;
          break;
        case "stations":
          diff = a.n_stations - b.n_stations;
          break;
        case "date":
          diff =
            new Date(a.datetime_utc).getTime() -
            new Date(b.datetime_utc).getTime();
          break;
        default:
          diff = a.peak_abs_magnitude - b.peak_abs_magnitude;
      }
      return sortDir === "asc" ? diff : -diff;
    });

    return list;
  }, [
    fireballs,
    querySearch,
    queryMaxMag,
    queryShower,
    queryMinStations,
    queryMinVelocity,
    queryMaxVelocity,
    sortBy,
    sortDir,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / PAGE_SIZE) || 1;
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSorted.slice(start, start + PAGE_SIZE);
  }, [filteredAndSorted, currentPage]);

  if (loading) {
    return (
      <LoadingState
        message="Loading fireball observation catalog..."
        subtext="Accessing 14,484 candidate events"
      />
    );
  }

  if (error || !fireballs) {
    return <ErrorState message="Failed to load catalog of brightest events." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-space-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Brightest Meteor Catalog
            </h1>
            <Badge variant="fireball">≤ {queryMaxMag} mag</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, and investigate candidate fireballs from
            multi-station all-sky camera triangulation.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
          <span>
            Active matching:{" "}
            <strong className="text-fireball-400 font-bold">
              {filteredAndSorted.length.toLocaleString()}
            </strong>{" "}
            events
          </span>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="observatory-card rounded-2xl p-5 border border-space-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-space-800">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Filter className="w-4 h-4 text-fireball-400" />
            <span>Catalog Filters</span>
          </div>

          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Search ID / Date / Shower
            </label>
            <div className="relative">
              <input
                type="text"
                value={querySearch}
                onChange={(e) => updateParam("q", e.target.value)}
                placeholder="gmn_2022..., GEM, etc."
                className="w-full bg-space-950 border border-space-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-fireball-500 font-mono"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* Brightness Threshold */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 whitespace-nowrap">
              Brightness Threshold (≤ Mag)
            </label>
            <select
              value={queryMaxMag}
              onChange={(e) => updateParam("maxMag", Number(e.target.value))}
              className="w-full bg-space-950 border border-space-700 rounded-lg px-3 py-2 text-xs text-fireball-400 font-mono focus:outline-none focus:border-fireball-500"
            >
              <option value={-2}>≤ -2.0 mag (Bright Meteors)</option>
              <option value={-3}>≤ -3.0 mag</option>
              <option value={-4}>
                ≤ -4.0 mag (Fireball Operational Default)
              </option>
              <option value={-6}>≤ -6.0 mag (Brilliant Fireballs)</option>
              <option value={-8}>≤ -8.0 mag (Superbolides)</option>
              <option value={-12}>≤ -12.0 mag (Full Moon Class)</option>
            </select>
          </div>

          {/* Minimum Observing Stations */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Min Observing Stations
            </label>
            <select
              value={queryMinStations}
              onChange={(e) =>
                updateParam("minStations", Number(e.target.value))
              }
              className="w-full bg-space-950 border border-space-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-fireball-500"
            >
              <option value={2}>2+ Stations (Standard)</option>
              <option value={3}>3+ Stations (Higher Redundancy)</option>
              <option value={4}>4+ Stations</option>
              <option value={5}>5+ Stations</option>
              <option value={8}>8+ Stations (High-Precision Network)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Sort Catalog By
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => updateParam("sort", e.target.value)}
                className="w-full bg-space-950 border border-space-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-fireball-500"
              >
                <option value="magnitude">Absolute Magnitude</option>
                <option value="velocity">Geocentric Velocity</option>
                <option value="altitude">Peak Altitude</option>
                <option value="duration">Visible Duration</option>
                <option value="stations">Station Count</option>
                <option value="date">Observation Date</option>
              </select>

              <button
                onClick={() =>
                  updateParam("dir", sortDir === "asc" ? "desc" : "asc")
                }
                className="p-2 rounded-lg bg-space-950 border border-space-700 text-slate-300 hover:text-white transition-colors"
                title={`Sort ${sortDir === "asc" ? "Descending" : "Ascending"}`}
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="observatory-card rounded-2xl border border-space-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-space-800 bg-space-950/80 font-mono text-[11px] text-slate-400">
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Observation UTC</th>
                <th className="py-3 px-4">Peak Abs Mag</th>
                <th className="py-3 px-4">Geocentric Velocity</th>
                <th className="py-3 px-4">Peak Altitude</th>
                <th className="py-3 px-4">Visible Duration</th>
                <th className="py-3 px-4">Shower</th>
                <th className="py-3 px-4">Stations</th>
                <th className="py-3 px-4 text-right">Quick View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-850">
              {paginatedResults.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-slate-400 font-sans"
                  >
                    No fireball candidates matched your current filter
                    parameters.
                    <div className="mt-2">
                      <button
                        onClick={handleResetFilters}
                        className="text-fireball-400 hover:underline text-xs"
                      >
                        Reset filters to view all events
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedResults.map((event) => (
                  <tr
                    key={event.id}
                    onClick={() => setQuickViewEvent(event)}
                    className="hover:bg-space-800/60 cursor-pointer transition-colors group font-mono"
                  >
                    <td className="py-3 px-4 font-bold text-white group-hover:text-fireball-400 transition-colors">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        {event.peak_abs_magnitude <= -8 && (
                          <Flame className="w-3.5 h-3.5 text-fireball-500 shrink-0" />
                        )}
                        <span>{event.id}</span>
                      </div>
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
                    <td className="py-3 px-4 text-slate-200">
                      {formatDuration(event.duration_sec)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          event.shower_code === "..." ? "slate" : "violet"
                        }
                        size="sm"
                      >
                        {event.shower_code}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {formatStationCount(event.n_stations)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickViewEvent(event);
                        }}
                        className="p-1 rounded bg-space-800 hover:bg-space-700 text-slate-400 hover:text-white transition-colors"
                        title="Open Quick View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-space-800 bg-space-950/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-mono">
              Showing {(currentPage - 1) * PAGE_SIZE + 1} –{" "}
              {Math.min(currentPage * PAGE_SIZE, filteredAndSorted.length)} of{" "}
              {filteredAndSorted.length.toLocaleString()} events
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => updateParam("page", currentPage - 1)}
                className="p-1.5 rounded-lg bg-space-850 border border-space-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-space-800 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-mono text-slate-300 px-2">
                Page {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => updateParam("page", currentPage + 1)}
                className="p-1.5 rounded-lg bg-space-850 border border-space-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-space-800 transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick View Drawer */}
      <QuickViewDrawer
        event={quickViewEvent}
        onClose={() => setQuickViewEvent(null)}
      />
    </div>
  );
};

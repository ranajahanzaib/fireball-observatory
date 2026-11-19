import {
  formatDateTimeUTC,
  formatMagnitude,
  formatVelocity,
} from "@fireball-observatory/shared";
import { ExternalLink, Flame, Search, Sparkles, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFireballs, useUnusual } from "../../api/hooks";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: fireballs } = useFireballs();
  const { data: unusual } = useUnusual();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  // Search results
  const matchingFireballs =
    trimmed.length >= 2 && fireballs
      ? fireballs
          .filter(
            (f) =>
              f.id.toLowerCase().includes(trimmed) ||
              f.shower_code.toLowerCase().includes(trimmed) ||
              f.shower_name.toLowerCase().includes(trimmed) ||
              f.datetime_utc.toLowerCase().includes(trimmed),
          )
          .slice(0, 8)
      : [];

  const matchingUnusual =
    trimmed.length >= 2 && unusual
      ? unusual
          .filter(
            (u) =>
              u.event.id.toLowerCase().includes(trimmed) ||
              u.event.shower_code.toLowerCase().includes(trimmed) ||
              u.event.shower_name.toLowerCase().includes(trimmed) ||
              u.title.toLowerCase().includes(trimmed) ||
              u.category.toLowerCase().includes(trimmed),
          )
          .slice(0, 4)
      : [];

  const handleSelectEvent = (id: string) => {
    onClose();
    navigate(`/events/${id}`);
  };

  const handleSelectShower = (code: string) => {
    onClose();
    navigate(`/showers?s=${code}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex items-start justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-space-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-space-900 border border-space-700 rounded-2xl shadow-2xl overflow-hidden mt-12 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-space-800 bg-space-950/60">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by event ID (gmn_...), shower (GEM, Perseids), or date (2023-12-14)..."
            className="w-full py-4 text-sm bg-transparent text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded text-slate-400 hover:text-white"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-space-800 rounded border border-space-700">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {trimmed.length < 2 && (
            <div className="py-8 text-center text-xs text-slate-400">
              <Sparkles className="w-6 h-6 text-fireball-400/60 mx-auto mb-2" />
              <p>
                Type at least 2 characters to search across 14,484 fireballs and
                427 meteor showers.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <button
                  onClick={() => handleSelectShower("GEM")}
                  className="px-2.5 py-1 rounded bg-space-800 hover:bg-space-700 text-slate-300 text-xs font-mono"
                >
                  Geminids (GEM)
                </button>
                <button
                  onClick={() => handleSelectShower("PER")}
                  className="px-2.5 py-1 rounded bg-space-800 hover:bg-space-700 text-slate-300 text-xs font-mono"
                >
                  Perseids (PER)
                </button>
                <button
                  onClick={() => handleSelectShower("...")}
                  className="px-2.5 py-1 rounded bg-space-800 hover:bg-space-700 text-slate-300 text-xs font-mono"
                >
                  Sporadic (...)
                </button>
              </div>
            </div>
          )}

          {trimmed.length >= 2 && matchingUnusual.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-fireball-400 px-2 block mb-1">
                Notable Unusual Observations
              </span>
              <div className="space-y-1">
                {matchingUnusual.map((u) => (
                  <button
                    key={u.event.id}
                    onClick={() => handleSelectEvent(u.event.id)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-space-800/80 border border-transparent hover:border-space-700 flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Flame className="w-4 h-4 text-fireball-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-xs font-bold text-white block truncate">
                          {u.title}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {u.event.id}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-fireball-400 shrink-0 ml-2">
                      {formatMagnitude(u.event.peak_abs_magnitude)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {trimmed.length >= 2 && matchingFireballs.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-2 block mb-1">
                Catalog Fireball Candidates
              </span>
              <div className="space-y-1">
                {matchingFireballs.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleSelectEvent(f.id)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-space-800/80 border border-transparent hover:border-space-700 flex items-center justify-between group transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-white group-hover:text-fireball-400 font-bold truncate">
                          {f.id}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-space-800 text-astro-violet">
                          {f.shower_code}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {formatDateTimeUTC(f.datetime_utc)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-right font-mono text-xs shrink-0 ml-3">
                      <div>
                        <span className="text-fireball-400 font-bold block">
                          {formatMagnitude(f.peak_abs_magnitude)}
                        </span>
                        <span className="text-slate-400 text-[10px] block">
                          {formatVelocity(f.v_g_kms)}
                        </span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {trimmed.length >= 2 &&
            matchingFireballs.length === 0 &&
            matchingUnusual.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                No matching fireball events found for "{query}".
                <p className="mt-1 text-slate-400">
                  Try a different shower code, date, or event ID.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

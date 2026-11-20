import {
  Compass,
  Flame,
  GitCompare,
  Info,
  Search,
  Sparkles,
} from "lucide-react";
import React from "react";
import { Link, NavLink } from "react-router-dom";

interface HeaderProps {
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-all whitespace-nowrap ${
      isActive
        ? "bg-space-800 text-fireball-400 border border-fireball-500/30 shadow-sm"
        : "text-slate-300 hover:text-white hover:bg-space-850"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-space-800 bg-space-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-16 py-2 gap-3">
          {/* Logo & Product Name */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-fireball-500 to-amber-700 flex items-center justify-center shadow-lg shadow-fireball-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white group-hover:text-fireball-400 transition-colors whitespace-nowrap">
                  Fireball Observatory
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-space-800 text-fireball-400 border border-space-700 shrink-0">
                  GMN 3.7M
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xl:block">
                Exploring the brightest and most unusual meteor observations
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav
            className="hidden lg:flex items-center gap-1 shrink-0"
            aria-label="Main Navigation"
          >
            <NavLink to="/" end className={navLinkClass}>
              <Sparkles className="w-4 h-4 text-fireball-400" />
              <span>Overview</span>
            </NavLink>
            <NavLink to="/fireballs" className={navLinkClass}>
              <Flame className="w-4 h-4 text-fireball-500" />
              <span>Brightest Events</span>
            </NavLink>
            <NavLink to="/explore" className={navLinkClass}>
              <Compass className="w-4 h-4 text-astro-cyan" />
              <span>Explore Data</span>
            </NavLink>
            <NavLink to="/showers" className={navLinkClass}>
              <GitCompare className="w-4 h-4 text-astro-violet" />
              <span>Shower Comparison</span>
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              <Info className="w-4 h-4 text-slate-400" />
              <span>About the Data</span>
            </NavLink>
          </nav>

          {/* Quick Search Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-space-900 border border-space-700 hover:border-space-600 rounded-lg transition-colors group"
              aria-label="Search events"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-fireball-400 transition-colors" />
              <span className="hidden sm:inline">Search events / showers</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono bg-space-800 text-slate-400 rounded border border-space-700">
                ⌘K
              </kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="lg:hidden flex items-center justify-around py-2 px-2 border-t border-space-850 bg-space-950/95 overflow-x-auto">
        <NavLink to="/" end className={navLinkClass}>
          <span>Overview</span>
        </NavLink>
        <NavLink to="/fireballs" className={navLinkClass}>
          <span>Fireballs</span>
        </NavLink>
        <NavLink to="/explore" className={navLinkClass}>
          <span>Explore</span>
        </NavLink>
        <NavLink to="/showers" className={navLinkClass}>
          <span>Showers</span>
        </NavLink>
        <NavLink to="/about" className={navLinkClass}>
          <span>About</span>
        </NavLink>
      </div>
    </header>
  );
};

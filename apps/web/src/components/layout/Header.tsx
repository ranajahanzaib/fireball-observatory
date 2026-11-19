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
    `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
      isActive
        ? "bg-space-800 text-fireball-400 border border-fireball-500/30 shadow-sm"
        : "text-slate-300 hover:text-white hover:bg-space-850"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-space-800 bg-space-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-fireball-500 to-amber-700 flex items-center justify-center shadow-lg shadow-fireball-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-fireball-400 transition-colors">
                  Fireball Observatory
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-space-800 text-fireball-400 border border-space-700">
                  GMN 3.7M
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Exploring the brightest and most unusual meteor observations
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-1.5"
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
      <div className="md:hidden flex items-center justify-around py-2 border-t border-space-850 bg-space-950/95 overflow-x-auto">
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

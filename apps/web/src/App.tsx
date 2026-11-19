import { AlertCircle, ArrowLeft } from "lucide-react";
import React from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { AboutPage } from "./routes/AboutPage";
import { BrightestEventsPage } from "./routes/BrightestEventsPage";
import { EventDetailPage } from "./routes/EventDetailPage";
import { ExplorePage } from "./routes/ExplorePage";
import { OverviewPage } from "./routes/OverviewPage";
import { ShowerComparisonPage } from "./routes/ShowerComparisonPage";

const NotFoundPage: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-12 text-center my-12">
    <AlertCircle className="w-12 h-12 text-fireball-400 mb-4" />
    <h1 className="text-2xl font-bold text-white mb-2">
      404 — Celestial Coordinate Not Found
    </h1>
    <p className="text-xs text-slate-400 max-w-sm mb-6">
      The requested route does not correspond to an established observation page
      or analytical catalog view.
    </p>
    <Link
      to="/"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-space-800 hover:bg-space-700 text-slate-200 text-xs font-semibold border border-space-600 transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Return to Observatory Overview</span>
    </Link>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<OverviewPage />} />
          <Route path="fireballs" element={<BrightestEventsPage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="showers" element={<ShowerComparisonPage />} />
          <Route path="events/:eventId" element={<EventDetailPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

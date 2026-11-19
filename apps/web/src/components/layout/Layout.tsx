import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { SearchModal } from "../common/SearchModal";
import { Footer } from "./Footer";
import { Header } from "./Header";

export const Layout: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-space-950 text-slate-100">
      <Header onOpenSearch={() => setSearchOpen(true)} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <Footer />

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

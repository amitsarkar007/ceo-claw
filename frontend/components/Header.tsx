"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sun, Moon, BarChart3 } from "lucide-react";

export function Header() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <header className="relative h-[64px] flex items-center justify-between px-4 sm:px-6 bg-[#fafafa] dark:bg-[#111111] border-b border-[#eeeeee] dark:border-[#222222] flex-shrink-0">
      {/* Logo — left */}
      <Link
        href="/"
        className="flex items-center gap-3 min-w-0 flex-shrink-0"
      >
        <img
          src="/favicon.png"
          alt="Highstreet AI"
          className="h-11 w-11 rounded-xl flex-shrink-0"
        />
        <div className="hidden sm:block min-w-0">
          <h1 className="text-[17px] font-bold text-[#1a1a1a] dark:text-[#f0f0f0] leading-tight truncate">
            Highstreet AI
          </h1>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#666666] dark:text-[#888888]">
            Autonomous AI Workforce
          </p>
        </div>
      </Link>

      {/* Model name — center */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
        <span className="flex items-center gap-1.5 rounded-full bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#333333] px-3 py-1.5 text-[11px] font-medium text-[#555555] dark:text-[#999999]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Z.AI GLM-4-Plus
        </span>
      </div>

      {/* Dashboard + theme toggle — right */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#666666] dark:text-[#aaaaaa] hover:bg-[#e8e8e8] dark:hover:bg-[#222222] transition-colors"
          aria-label="Dashboard"
          title="Dashboard"
        >
          <BarChart3 className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#666666] dark:text-[#aaaaaa] hover:bg-[#e8e8e8] dark:hover:bg-[#222222] transition-colors"
          aria-label={dark ? "Light mode" : "Dark mode"}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}

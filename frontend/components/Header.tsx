"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, History, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onToggleHistory: () => void;
  historyCount: number;
}

export function Header({ onToggleHistory, historyCount }: HeaderProps) {
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
    <header className="sticky top-0 z-50 glass-card border-b border-[#e0e0e0] dark:border-[#2a2a2a]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ff6b35] shadow-md shadow-brand-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold tracking-tight text-[#111111] dark:text-[#f0f0f0]">
                Highstreet AI
              </h1>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#555555] dark:text-[#aaaaaa] hidden sm:block">
                Autonomous AI Workforce
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-white dark:bg-[#1a2a1a] border border-[#cccccc] dark:border-[#22aa55] px-3 py-1.5 text-[12px] font-semibold text-[#111111] dark:text-[#88dd88]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22aa55] animate-pulse" />
              GLM-4-Plus · Z.AI
            </span>

            <button
              onClick={onToggleHistory}
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              )}
              aria-label="Query history"
            >
              <History className="h-4 w-4" />
              {historyCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                  {historyCount > 99 ? "99+" : historyCount}
                </span>
              )}
            </button>

            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

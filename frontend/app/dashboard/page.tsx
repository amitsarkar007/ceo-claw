"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Clock,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HistoryEntry } from "@/lib/types";

export default function DashboardPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("highstreet-ai-history");
      if (stored) setHistory(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const totalQueries = history.length;
  const avgConfidence =
    history.length > 0
      ? Math.round(
          (history
            .filter((h) => h.result.confidence != null)
            .reduce((sum, h) => sum + (h.result.confidence ?? 0), 0) /
            Math.max(
              1,
              history.filter((h) => h.result.confidence != null).length
            )) *
            100
        )
      : 0;

  const agentUsage = history.reduce<Record<string, number>>((acc, h) => {
    const agent = h.result.selected_agent ?? "unknown";
    acc[agent] = (acc[agent] ?? 0) + 1;
    return acc;
  }, {});

  const intentBreakdown = history.reduce<Record<string, number>>((acc, h) => {
    const intent = h.result.intent ?? "general";
    acc[intent] = (acc[intent] ?? 0) + 1;
    return acc;
  }, {});

  const stats = [
    {
      label: "Total Queries",
      value: totalQueries,
      icon: BarChart3,
      color: "text-brand-500",
      bg: "bg-brand-50 dark:bg-brand-950/30",
    },
    {
      label: "Avg Confidence",
      value: `${avgConfidence}%`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      label: "Agents Used",
      value: Object.keys(agentUsage).length,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Last Query",
      value: history[0]
        ? new Date(history[0].timestamp).toLocaleDateString()
        : "—",
      icon: Clock,
      color: "text-violet-500",
      bg: "bg-violet-50 dark:bg-violet-950/30",
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-white dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to workspace
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-md shadow-brand-500/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Dashboard
            </h1>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Your AI workforce analytics
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
              >
                <div
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-lg mb-3",
                    stat.bg
                  )}
                >
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Agent usage breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
              Agent Usage
            </h2>
            {Object.keys(agentUsage).length === 0 ? (
              <p className="text-sm text-slate-300 dark:text-slate-600">
                No data yet. Run some queries first.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(agentUsage)
                  .sort((a, b) => b[1] - a[1])
                  .map(([agent, count]) => (
                    <div key={agent}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                          {agent.replace(/_/g, " ")}
                        </span>
                        <span className="text-slate-400 tabular-nums">
                          {count}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-500"
                          style={{
                            width: `${(count / totalQueries) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
              Query Intents
            </h2>
            {Object.keys(intentBreakdown).length === 0 ? (
              <p className="text-sm text-slate-300 dark:text-slate-600">
                No data yet. Run some queries first.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(intentBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([intent, count]) => (
                    <div key={intent}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                          {intent.replace(/_/g, " ")}
                        </span>
                        <span className="text-slate-400 tabular-nums">
                          {count}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500"
                          style={{
                            width: `${(count / totalQueries) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent queries */}
        <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
            Recent Queries
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-slate-300 dark:text-slate-600">
              No queries yet. Go to the{" "}
              <Link href="/" className="text-brand-500 hover:underline">
                workspace
              </Link>{" "}
              to get started.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.slice(0, 10).map((entry) => (
                <div key={entry.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-1">
                    {entry.query}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <span>
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                    {entry.result.selected_agent && (
                      <>
                        <span>·</span>
                        <span className="capitalize">
                          {entry.result.selected_agent.replace(/_/g, " ")}
                        </span>
                      </>
                    )}
                    {entry.result.confidence != null && (
                      <>
                        <span>·</span>
                        <span>
                          {Math.round(entry.result.confidence * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

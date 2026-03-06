"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { QueryPanel } from "@/components/QueryPanel";
import { PipelineIndicator } from "@/components/PipelineIndicator";
import { ResultsPanel } from "@/components/ResultsPanel";
import { QueryHistory } from "@/components/QueryHistory";
import { ToastContainer } from "@/components/Toast";
import { Footer } from "@/components/Footer";
import { queryAgents } from "@/lib/api";
import { useQueryHistory, useToast } from "@/lib/hooks";
import type { AgentResult, HistoryEntry } from "@/lib/types";

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const { history, addEntry, removeEntry, clearHistory } = useQueryHistory();
  const { toasts, toast, dismiss } = useToast();

  const handleSubmit = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await queryAgents(trimmed);
      setResult(data);
      addEntry(trimmed, data);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setError(message);
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [query, loading, addEntry, toast]);

  const handleHistorySelect = useCallback(
    (entry: HistoryEntry) => {
      setQuery(entry.query);
      setResult(entry.result);
      setError("");
      setHistoryOpen(false);
    },
    []
  );

  return (
    <>
      <Header
        onToggleHistory={() => setHistoryOpen((v) => !v)}
        historyCount={history.length}
      />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-[#e8e8e8] text-balance">
            Your autonomous AI workforce
          </h2>
          <p className="mt-2 text-[15px] text-[#1a1a1a] dark:text-[#e8e8e8] max-w-lg mx-auto">
            Ask anything about operations, HR, AI adoption, or market intelligence.
            Our multi-agent pipeline handles the rest.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {["Bakeries", "Coffee Shops", "Clinics", "Trades", "Professional Services"].map(
              (biz) => (
                <span
                  key={biz}
                  className="rounded-[20px] border-[1.5px] border-[#cc4400] dark:border-[#ff7744] px-[14px] py-[6px] text-[13px] font-semibold text-[#cc4400] dark:text-[#ff7744] hover:bg-[#cc4400] dark:hover:bg-[#ff6b35] hover:text-white dark:hover:text-black transition-colors cursor-default"
                >
                  {biz}
                </span>
              )
            )}
          </div>
        </div>

        {/* Query input */}
        <QueryPanel
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleSubmit}
          loading={loading}
        />

        {/* Pipeline indicator */}
        <PipelineIndicator loading={loading} completed={!!result} />

        {/* Output section */}
        <section className="mt-6" aria-label="Agent output">
          {!loading && !error && !result && (
            <div className="rounded-2xl border border-dashed border-[#e0e0e0] dark:border-[#333333] bg-white dark:bg-[#161616] py-16 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <svg
                  className="h-12 w-12 text-[#cc4400] dark:text-[#ff6b35]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                  />
                </svg>
              </div>
              <p className="text-[18px] font-semibold text-[#333333] dark:text-[#e8e8e8]">
                Results will appear here
              </p>
              <p className="text-[14px] text-[#555555] dark:text-[#aaaaaa] mt-1">
                Ask a business question to see your AI workforce in action
              </p>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4 animate-fade-in" role="status" aria-live="polite">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[#e0e0e0] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-5"
                >
                  <div className="animate-pulse space-y-3">
                    <div className="h-3 w-24 rounded-full bg-slate-100 dark:bg-slate-800" />
                    <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
                    <div className="h-4 w-3/4 rounded-full bg-slate-100 dark:bg-slate-800" />
                    {i === 1 && (
                      <div className="h-4 w-1/2 rounded-full bg-slate-100 dark:bg-slate-800" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div
              className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-5 animate-fade-in"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                  <svg
                    className="h-4 w-4 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-red-700 dark:text-red-400">
                    Something went wrong
                  </p>
                  <p className="text-[15px] text-red-600 dark:text-red-400/90 mt-1">
                    {error}
                  </p>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="mt-3 rounded-lg bg-red-100 dark:bg-red-900/50 px-3 py-1.5 text-[13px] font-semibold text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/80 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <ResultsPanel result={result} onToast={(msg) => toast(msg)} />
          )}
        </section>
      </main>

      <Footer />

      <QueryHistory
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onSelect={handleHistorySelect}
        onRemove={removeEntry}
        onClear={clearHistory}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}

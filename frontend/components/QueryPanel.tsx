"use client";

import { useState } from "react";
import {
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Network,
  ClipboardList,
  Users,
  BarChart3,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EXAMPLE_QUERIES = [
  "How can I reduce pastry waste and manage the morning rush in my coffee shop?",
  "I need to schedule staff for next week at my dental clinic, we have 3 dentists",
  "How do I know if AI is actually saving my accounting firm any time?",
];

const AGENTS = [
  {
    name: "Orchestrator",
    desc: "Routes queries to the right specialist agent",
    tag: "Classification",
    icon: Network,
    color: "text-blue-500",
  },
  {
    name: "Operations",
    desc: "Workflows, scheduling, logistics & efficiency",
    tag: "Reasoning",
    icon: ClipboardList,
    color: "text-brand-500",
  },
  {
    name: "HR & Wellbeing",
    desc: "Staff support, onboarding & team health",
    tag: "Generation",
    icon: Users,
    color: "text-violet-500",
  },
  {
    name: "Adoption Optimizer",
    desc: "Measures AI ROI, usage & adoption readiness",
    tag: "Analysis",
    icon: BarChart3,
    color: "text-emerald-500",
  },
  {
    name: "Market Intelligence",
    desc: "Demand signals, trends & competitive insights",
    tag: "Synthesis",
    icon: TrendingUp,
    color: "text-amber-500",
  },
  {
    name: "Reviewer",
    desc: "Validates every output before delivery",
    tag: "Validation",
    icon: ShieldCheck,
    color: "text-rose-500",
  },
];

interface QueryPanelProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function QueryPanel({
  query,
  onQueryChange,
  onSubmit,
  loading,
}: QueryPanelProps) {
  const [agentsExpanded, setAgentsExpanded] = useState(false);

  return (
    <section
      className="rounded-2xl border border-[#e0e0e0] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-none overflow-hidden"
      aria-label="Query input"
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-[#cc4400] dark:bg-[#ff7744]" />
          <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#222222] dark:text-[#aaaaaa]">
            Ask your AI workforce
          </span>
        </div>

        <label htmlFor="query-input" className="sr-only">
          Ask your AI workforce a business question
        </label>
        <textarea
          id="query-input"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Describe your business question — operations, HR, AI adoption, or market intelligence..."
          aria-label="Ask your AI workforce a business question"
          className={cn(
            "w-full min-h-[120px] rounded-xl border-[1.5px] border-[#cccccc] dark:border-[#333333]",
            "bg-slate-50 dark:bg-[#222222] px-4 py-3",
            "text-[16px] text-[#111111] dark:text-[#f0f0f0] placeholder:text-[#666666] dark:placeholder:text-[#888888]",
            "resize-y outline-none transition-all duration-200",
            "focus:border-[#cc4400] dark:focus:border-[#ff7744] focus:ring-2 focus:ring-[#cc4400]/20 dark:focus:ring-[#ff7744]/30",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
          }}
          disabled={loading}
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((eq, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onQueryChange(eq)}
              disabled={loading}
              className={cn(
                "rounded-lg min-h-[40px] px-4 py-2 text-[14px] font-medium transition-all duration-150 text-left",
                "border border-[#cccccc] dark:border-[#333333] bg-white dark:bg-[#222222]",
                "text-[#222222] dark:text-[#dddddd]",
                "hover:border-[#cc4400] dark:hover:border-[#ff7744] hover:bg-brand-50 dark:hover:bg-slate-800/50",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {eq}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setAgentsExpanded((v) => !v)}
          className="mt-4 flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium text-[#444444] dark:text-[#aaaaaa] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          aria-expanded={agentsExpanded}
        >
          <span>6 AI agents · Powered by Z.AI GLM-4-Plus · Built for 5.5M UK small businesses</span>
          {agentsExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
          )}
        </button>

        {agentsExpanded && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-fade-in">
            {AGENTS.map((agent) => {
              const Icon = agent.icon;
              return (
                <div
                  key={agent.name}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-3 transition-colors hover:border-slate-300 dark:hover:border-slate-600"
                >
                  <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", agent.color)} />
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8]">
                      {agent.name}
                    </p>
                    <p className="text-[14px] text-[#444444] dark:text-[#aaaaaa] mt-0.5">
                      {agent.desc}
                    </p>
                    <span className="mt-1.5 inline-block rounded-full bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 text-[12px] font-semibold text-[#444444] dark:text-[#aaaaaa]">
                      {agent.tag}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[13px] text-[#666666] dark:text-[#888888] hidden sm:block">
            Press <kbd className="rounded bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[12px] font-mono">⌘ Enter</kbd> to submit
          </p>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !query.trim()}
            aria-label="Run AI agents to answer your question"
            className={cn(
              "flex items-center justify-center gap-2 h-12 px-8 rounded-[10px] text-[15px] font-bold transition-all duration-200",
              "bg-[#cc4400] dark:bg-[#ff6b35] text-white dark:text-black",
              "hover:brightness-90 hover:shadow-md active:scale-[0.98]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#cc4400] dark:focus-visible:outline-[#ff7744] focus-visible:outline-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running pipeline…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Run agents
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

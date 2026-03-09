"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Sun,
  Moon,
  Menu,
  X,
  Send,
  Loader2,
  Check,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  MessageSquare,
  Users,
  Wrench,
  Shield,
  BookOpen,
  TrendingUp,
  Rocket,
  Gauge,
  Calendar,
  Target,
  BarChart3,
  Lightbulb,
  Globe,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { ToastContainer } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ResultsPanel } from "@/components/ResultsPanel";
import { queryAgentsStream, clearConversation } from "@/lib/api";
import { useQueryHistory, useToast } from "@/lib/hooks";
import { cn, formatConfidence, formatAgent } from "@/lib/utils";
import type {
  AgentResult,
  HistoryEntry,
  PipelineEvent,
  ClarifyingQuestion,
  ConversationStatus,
  ChatMessage,
} from "@/lib/types";

/* ─── constants ─────────────────────────────────────────────────────── */

const SECTORS = [
  { name: "Bakeries", append: "bakery" },
  { name: "Coffee Shops", append: "coffee shop" },
  { name: "Clinics", append: "clinic" },
  { name: "Trades", append: "trades business" },
  { name: "Professional Services", append: "professional services firm" },
];

const EXAMPLE_QUERIES = [
  {
    text: "How can I reduce waste and manage the morning rush?",
    icon: "🥐",
    category: "Operations",
  },
  {
    text: "I need to schedule staff for next week at my clinic",
    icon: "📋",
    category: "HR & Scheduling",
  },
  {
    text: "Is AI actually saving my firm any time?",
    icon: "📊",
    category: "AI Adoption",
  },
];

/* ─── helpers ───────────────────────────────────────────────────────── */

function safeText(item: unknown): string {
  if (typeof item === "string") return item;
  if (typeof item !== "object" || item === null) return String(item);
  const obj = item as Record<string, unknown>;
  const parts = [
    obj.action,
    obj.who && `Who: ${obj.who}`,
    obj.when && `When: ${obj.when}`,
    obj.time_required && `Time: ${obj.time_required}`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" — ") : JSON.stringify(item);
}

function linkifyPhoneNumbers(text: string) {
  return text.replace(
    /(\d{4}\s?\d{3}\s?\d{4}|\d{3}\s?\d{4})/g,
    (match) => {
      const digits = match.replace(/\s/g, "");
      return `<a href="tel:${digits}" class="underline hover:text-[#cc4400] dark:hover:text-[#ff6b35]">${match}</a>`;
    }
  );
}

function renderMarkdown(text: string) {
  let html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br />");
  return linkifyPhoneNumbers(html);
}

/* ─── pipeline ticker ──────────────────────────────────────────────── */

const STAGE_LABELS: Record<string, string> = {
  guardrails: "Safety Check",
  orchestrator_assess: "Context Analysis",
  orchestrator: "Orchestrator",
  operations_agent: "Operations Agent",
  hr_agent: "HR & Wellbeing Agent",
  adoption_agent: "AI Adoption Optimizer",
  market_intelligence_agent: "Market Intelligence Agent",
  reviewer: "Quality Review",
};

const SPECIALIST_SET = new Set([
  "operations_agent",
  "hr_agent",
  "adoption_agent",
  "market_intelligence_agent",
]);

const PIPELINE_COLLAPSED_KEY = "highstreet-ai-pipeline-collapsed";

function PipelineTicker({ events }: { events: PipelineEvent[] }) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(PIPELINE_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(PIPELINE_COLLAPSED_KEY, String(next));
    } catch {
      /* ignore */
    }
  };
  const observed = new Map<
    string,
    { started?: number; completed?: number; startMsg?: string; endMsg?: string }
  >();
  let specialistKey: string | null = null;

  for (const e of events) {
    if (e.type !== "step" || !e.agent) continue;
    if (!observed.has(e.agent)) observed.set(e.agent, {});
    const d = observed.get(e.agent)!;
    if (e.status === "started") {
      d.started = e.timestamp;
      d.startMsg = e.message;
    }
    if (e.status === "complete") {
      d.completed = e.timestamp;
      d.endMsg = e.message;
    }
    if (SPECIALIST_SET.has(e.agent)) specialistKey = e.agent;
  }

  const stages = [
    "guardrails",
    "orchestrator_assess",
    "orchestrator",
    specialistKey || "specialist",
    "reviewer",
  ];

  return (
    <div className="max-w-md w-full animate-fade-in">
      <div className="rounded-xl border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="w-full px-5 py-3 bg-[#fafafa] dark:bg-[#111111] border-b border-[#e8e8e8] dark:border-[#2a2a2a] flex items-center justify-between gap-2 hover:bg-[#f0f0f0] dark:hover:bg-[#1a1a1a] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#cc4400] dark:bg-[#ff6b35] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#cc4400] dark:bg-[#ff6b35]" />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35]">
              Pipeline Activity
            </p>
          </div>
          <span className="text-[#666666] dark:text-[#888888] text-[12px]">
            {collapsed ? "▼" : "▲"}
          </span>
        </button>
        {!collapsed && (
        <div className="px-5 py-4 space-y-3">
          {stages.map((key) => {
            const data = observed.get(key);
            const label =
              STAGE_LABELS[key] || key.replace(/_/g, " ") || "Specialist Agent";
            const isComplete = !!data?.completed;
            const isActive = !!data?.started && !data?.completed;
            const isPending = !data;
            const message = data?.endMsg || data?.startMsg;
            const elapsed =
              data?.started && data?.completed
                ? ((data.completed - data.started) / 1000).toFixed(1)
                : null;

            return (
              <div
                key={key}
                className={cn(
                  "flex items-start gap-3 transition-all duration-300",
                  isPending && "opacity-30"
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isComplete ? (
                    <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : isActive ? (
                    <div className="h-5 w-5 rounded-full bg-[#cc4400] dark:bg-[#ff6b35] flex items-center justify-center pipeline-pulse">
                      <Loader2 className="h-3 w-3 text-white dark:text-black animate-spin" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-[#e0e0e0] dark:border-[#333333]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-[13px] font-semibold",
                        isComplete &&
                          "text-emerald-600 dark:text-emerald-400",
                        isActive && "text-[#cc4400] dark:text-[#ff6b35]",
                        isPending && "text-[#cccccc] dark:text-[#444444]"
                      )}
                    >
                      {label}
                    </p>
                    {elapsed && (
                      <span className="text-[11px] tabular-nums text-[#bbbbbb] dark:text-[#555555] flex-shrink-0">
                        {elapsed}s
                      </span>
                    )}
                  </div>
                  {message ? (
                    <p
                      className={cn(
                        "text-[12px] mt-0.5",
                        isComplete
                          ? "text-[#999999]"
                          : "text-[#666666] dark:text-[#888888]"
                      )}
                    >
                      {message}
                    </p>
                  ) : isPending ? (
                    <p className="text-[12px] mt-0.5 text-[#cccccc] dark:text-[#444444]">
                      Waiting
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}

/* ─── main component ────────────────────────────────────────────────── */

export default function Home() {
  /* state */
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState("");

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationStatus, setConversationStatus] =
    useState<ConversationStatus>("idle");
  const [clarifyingQuestions, setClarifyingQuestions] = useState<
    ClarifyingQuestion[]
  >([]);
  const [clarifyingAnswers, setClarifyingAnswers] = useState<
    Record<string, string>
  >({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [guardrailMessage, setGuardrailMessage] = useState<string | null>(null);
  const [guardrailType, setGuardrailType] = useState<string | null>(null);
  const [isClarificationTurn, setIsClarificationTurn] = useState(false);

  const [dark, setDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [actionWeek, setActionWeek] = useState(1);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [nextActionsCopied, setNextActionsCopied] = useState(false);
  const [fullResultCopied, setFullResultCopied] = useState(false);
  const [animateResults, setAnimateResults] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeHistoryIdRef = useRef<string | null>(null);
  const threadScrollRef = useRef<HTMLDivElement>(null);
  const { history, addEntry, updateEntry, appendTurn, updateLastTurnResult, appendPipelineEvent, removeEntry, clearHistory } = useQueryHistory();
  const { toasts, toast, dismiss } = useToast();

  /* effects */
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    activeHistoryIdRef.current = activeHistoryId;
  }, [activeHistoryId]);

  useEffect(() => {
    if (!activeHistoryId) return;
    const entry = history.find((e) => e.id === activeHistoryId);
    if (entry && entry.status === "complete" && entry.result?.summary && !result) {
      setResult(entry.result);
      setConversationStatus("complete");
    }
  }, [history, activeHistoryId, result]);

  /* handlers */
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const resetConversation = useCallback(() => {
    if (conversationId) clearConversation(conversationId).catch(() => {});
    setConversationId(null);
    setConversationStatus("idle");
    setClarifyingQuestions([]);
    setClarifyingAnswers({});
    setMessages([]);
    setGuardrailMessage(null);
    setGuardrailType(null);
    setResult(null);
    setError("");
    setQuery("");
    setIsClarificationTurn(false);
    setActiveHistoryId(null);
    activeHistoryIdRef.current = null;
    setSummaryExpanded(false);
    setActionWeek(1);
    setAnimateResults(false);
  }, [conversationId]);

  const runStream = useCallback(
    (entryId: string, message: string, convId: string | null) => {
      queryAgentsStream(message, convId, {}, (event) => {
        const now = Date.now();

        if (event.type === "step") {
          appendPipelineEvent(entryId, {
            type: event.type as string,
            agent: event.agent as string,
            status: event.status as "started" | "complete",
            message: event.message as string,
            timestamp: now,
          });
        } else if (event.type === "conversation") {
          const cid = event.conversation_id as string;
          updateEntry(entryId, { conversationId: cid });
          if (activeHistoryIdRef.current === entryId) {
            setConversationId(cid);
          }
        } else if (event.type === "clarifying") {
          updateEntry(entryId, { status: "complete" });
          if (activeHistoryIdRef.current === entryId) {
            setConversationId((event.conversation_id as string) || null);
            setConversationStatus("clarifying");
            setClarifyingQuestions(
              (event.questions as ClarifyingQuestion[]) ?? []
            );
            setIsClarificationTurn(true);
          }
        } else if (event.type === "guardrail") {
          updateEntry(entryId, { status: "complete" });
          if (activeHistoryIdRef.current === entryId) {
            setConversationStatus("guardrail");
            setGuardrailMessage(
              (event.guardrail_message as string) ?? null
            );
            setGuardrailType((event.guardrail_type as string) ?? null);
          }
        } else if (event.type === "result") {
          const resultData = (event.data ?? {}) as AgentResult;
          updateLastTurnResult(entryId, resultData);
          if (activeHistoryIdRef.current === entryId) {
            setConversationStatus("complete");
            setResult(resultData);
            setAnimateResults(true);
          }
        } else if (event.type === "error") {
          updateEntry(entryId, { status: "complete" });
          if (activeHistoryIdRef.current === entryId) {
            const msg =
              (event.message as string) || "Something went wrong";
            setError(msg);
            toast(msg, "error");
          }
        }
      }).catch((err) => {
        updateEntry(entryId, { status: "complete" });
        if (activeHistoryIdRef.current === entryId) {
          const msg =
            err instanceof Error
              ? err.message
              : "Something went wrong";
          setError(msg);
          toast(msg, "error");
        }
      });
    },
    [appendPipelineEvent, updateEntry, updateLastTurnResult, toast]
  );

  const handleSubmit = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const isFollowUp = !!(conversationId && activeHistoryId);
    const entryId = isFollowUp
      ? activeHistoryId!
      : addEntry(trimmed, {} as AgentResult, "pending");

    if (isFollowUp) {
      appendTurn(entryId, trimmed);
    }

    setQuery("");
    setError("");
    if (!isFollowUp) setResult(null);
    setGuardrailMessage(null);
    setGuardrailType(null);
    setClarifyingQuestions([]);
    setClarifyingAnswers({});
    setIsClarificationTurn(false);
    setSummaryExpanded(false);
    setActionWeek(1);
    setActiveHistoryId(entryId);
    activeHistoryIdRef.current = entryId;
    setConversationStatus("processing");
    setAnimateResults(false);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed, type: "query" },
    ]);

    runStream(entryId, trimmed, conversationId);
  }, [query, conversationId, activeHistoryId, addEntry, appendTurn, runStream]);

  const handleClarifySubmit = useCallback(() => {
    const answerParts: string[] = [];
    for (const q of clarifyingQuestions) {
      const answer = clarifyingAnswers[q.id];
      if (answer) answerParts.push(`${q.question}: ${answer}`);
    }
    if (answerParts.length === 0) return;
    const clarifyMessage = answerParts.join(". ");
    const entryId = activeHistoryId;

    setError("");
    setResult(null);
    setClarifyingQuestions([]);
    setClarifyingAnswers({});
    setIsClarificationTurn(false);
    setConversationStatus("processing");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: clarifyMessage, type: "clarification" },
    ]);

    if (entryId) {
      updateEntry(entryId, { status: "pending", pipelineEvents: [] });
      runStream(entryId, clarifyMessage, conversationId);
    }
  }, [
    clarifyingQuestions,
    clarifyingAnswers,
    conversationId,
    activeHistoryId,
    updateEntry,
    runStream,
  ]);

  const handleHistorySelect = useCallback((entry: HistoryEntry) => {
    setActiveHistoryId(entry.id);
    activeHistoryIdRef.current = entry.id;
    setMobileMenuOpen(false);
    setSummaryExpanded(false);
    setActionWeek(1);
    setClarifyingQuestions([]);
    setClarifyingAnswers({});
    setIsClarificationTurn(false);
    setGuardrailMessage(null);
    setGuardrailType(null);
    setError("");
    setQuery("");
    setConversationId(entry.conversationId ?? null);

    const lastResult = entry.turns?.at(-1)?.result ?? entry.result;
    if (entry.status === "pending") {
      setConversationStatus("processing");
      setResult(entry.turns?.at(-2)?.result ?? null);
      setAnimateResults(false);
    } else {
      setConversationStatus(lastResult?.summary ? "complete" : "idle");
      setResult(lastResult ?? null);
      setAnimateResults(false);
    }

    const restoredMessages: ChatMessage[] = [];
    const turns = entry.turns ?? [{ query: entry.query, result: entry.result }];
    for (const t of turns) {
      restoredMessages.push({ role: "user", content: t.query, type: "query" });
      if (t.result?.summary || t.result?.answer) {
        restoredMessages.push({
          role: "assistant",
          content: t.result.summary || t.result.answer || "",
          type: "answer",
        });
      }
    }
    setMessages(restoredMessages);
  }, []);

  const handleSectorClick = (sectorAppend: string) => {
    if (!query.trim()) {
      setQuery(`for my ${sectorAppend}`);
    } else {
      setQuery((prev) => `${prev} — I run a ${sectorAppend}`);
    }
    inputRef.current?.focus();
  };

  const handleCopyFullResult = async () => {
    if (!result) return;
    const parts: string[] = [];
    const t = result.summary || result.answer || "";
    if (t) parts.push(`AI Recommendation:\n${t}`);
    if (result.key_metrics?.length) {
      parts.push("\nKey Metrics:");
      result.key_metrics.forEach((m) => {
        parts.push(`- ${m.metric_name}: ${m.current_estimate} vs ${m.uk_benchmark}`);
      });
    }
    if (result.quick_wins?.length) {
      parts.push("\nQuick Wins:");
      result.quick_wins.forEach((w) => parts.push(`- ${w.action}: ${w.impact}`));
    }
    if (result.next_actions?.length) {
      parts.push("\nNext Actions:");
      result.next_actions.forEach((a, i) => parts.push(`${i + 1}. ${safeText(a)}`));
    }
    await navigator.clipboard.writeText(parts.join("\n"));
    setFullResultCopied(true);
    toast("Copied to clipboard");
    setTimeout(() => setFullResultCopied(false), 2000);
  };

  const handleCopyNextActions = async () => {
    if (!result?.next_actions) return;
    const text = result.next_actions
      .map((a, i) => `${i + 1}. ${safeText(a)}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
    setNextActionsCopied(true);
    toast("Copied to clipboard");
    setTimeout(() => setNextActionsCopied(false), 2000);
  };

  /* derived */
  const activeEntry = activeHistoryId
    ? history.find((e) => e.id === activeHistoryId)
    : undefined;
  const isProcessing = activeEntry?.status === "pending";
  const turns =
    activeEntry?.turns ??
    (activeEntry
      ? [{ query: activeEntry.query, result: activeEntry.result }]
      : []);
  const showThread = activeEntry && turns.length >= 1;
  const displayText = result?.summary || result?.answer || "";
  const fi =
    result?.financial_impact_monthly_gbp || result?.financial_value_monthly_gbp;
  const hasResults = !!result && !isProcessing;
  const showClarifying =
    conversationStatus === "clarifying" &&
    clarifyingQuestions.length > 0 &&
    !isProcessing;
  const showGuardrail =
    conversationStatus === "guardrail" && !!guardrailMessage && !isProcessing;
  const showLoading = isProcessing && !showClarifying && !showGuardrail;
  const showEmpty =
    !error &&
    !result &&
    !isProcessing &&
    conversationStatus === "idle" &&
    !showClarifying &&
    !showGuardrail;

  const rowClass = (delayMs: number) =>
    animateResults
      ? "result-row"
      : "opacity-100";
  const rowStyle = (delayMs: number) =>
    animateResults ? { animationDelay: `${delayMs}ms` } : undefined;

  useEffect(() => {
    if (showThread && threadScrollRef.current) {
      threadScrollRef.current.scrollTop = threadScrollRef.current.scrollHeight;
    }
  }, [showThread, turns.length, isProcessing, activeEntry?.pipelineEvents?.length]);

  /* ─── input section (ChatGPT-style) ──────────────────────────────── */

  const inputSection = (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <textarea
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask your AI workforce anything…"
          className={cn(
            "w-full min-h-[56px] max-h-[120px] rounded-2xl border-[1.5px] border-[#e0e0e0] dark:border-[#333333]",
            "bg-white dark:bg-[#1a1a1a] pl-4 pr-14 py-3.5 text-[15px] text-[#1a1a1a] dark:text-[#e8e8e8]",
            "placeholder:text-[#999999] dark:placeholder:text-[#666666]",
            "resize-none outline-none transition-all",
            "focus:border-[#cc4400] dark:focus:border-[#ff6b35]",
            "shadow-sm focus:shadow-md"
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
          rows={1}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!query.trim()}
          className="absolute right-2.5 bottom-2.5 h-9 w-9 rounded-xl bg-[#cc4400] dark:bg-[#ff6b35] text-white dark:text-black flex items-center justify-center disabled:opacity-30 hover:brightness-90 active:scale-95 transition-all"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-2 px-1">
        {SECTORS.map((s) => (
          <button
            key={s.name}
            type="button"
            onClick={() => handleSectorClick(s.append)}
            className="rounded-full border border-[#e0e0e0] dark:border-[#333333] px-[10px] py-[3px] text-[11px] font-medium text-[#666666] dark:text-[#999999] hover:border-[#cc4400] hover:text-[#cc4400] dark:hover:border-[#ff6b35] dark:hover:text-[#ff6b35] transition-colors"
          >
            {s.name}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-[#bbbbbb] dark:text-[#555555]">
          ⌘↵ to send
        </span>
      </div>
    </div>
  );

  /* ─── right-panel content (shared between desktop + mobile) ──────── */

  const rightPanel = (
    <>
      {/* STATE 2: Clarifying questions */}
      {showClarifying && (
        <div className="animate-fade-in max-w-2xl">
          <div
            className="rounded-xl border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] overflow-hidden"
            style={{ borderLeft: "3px solid #cc4400" }}
          >
            <div className="p-6">
              <h3 className="text-[16px] font-bold text-[#1a1a1a] dark:text-[#e8e8e8] mb-5">
                Just a couple of quick questions:
              </h3>
              <div className="space-y-5">
                {clarifyingQuestions.map((q) => (
                  <div key={q.id}>
                    <label className="block text-[14px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8] mb-2">
                      {q.question}
                    </label>
                    {q.answer_type === "choice" && q.choices ? (
                      <div className="flex flex-wrap gap-2">
                        {q.choices.map((choice) => {
                          const isSelected =
                            clarifyingAnswers[q.id] === choice;
                          return (
                            <button
                              key={choice}
                              type="button"
                              onClick={() =>
                                setClarifyingAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: isSelected ? "" : choice,
                                }))
                              }
                              className={cn(
                                "rounded-full border-[1.5px] px-4 py-2 text-[14px] font-medium transition-all",
                                isSelected
                                  ? "border-[#cc4400] bg-[#cc4400] text-white dark:border-[#ff6b35] dark:bg-[#ff6b35] dark:text-black"
                                  : "border-[#cc4400] dark:border-[#ff6b35] text-[#cc4400] dark:text-[#ff6b35] hover:bg-[#cc4400]/10 dark:hover:bg-[#ff6b35]/10"
                              )}
                            >
                              {choice}
                            </button>
                          );
                        })}
                      </div>
                    ) : q.answer_type === "number" ? (
                      <input
                        type="number"
                        value={clarifyingAnswers[q.id] ?? ""}
                        onChange={(e) =>
                          setClarifyingAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        className="w-full max-w-[200px] rounded-lg border-[1.5px] border-[#e0e0e0] dark:border-[#333333] bg-white dark:bg-[#222222] px-4 py-2.5 text-[14px] text-[#1a1a1a] dark:text-[#e8e8e8] outline-none focus:border-[#cc4400] dark:focus:border-[#ff6b35] transition-colors"
                        placeholder="Enter a number"
                      />
                    ) : (
                      <input
                        type="text"
                        value={clarifyingAnswers[q.id] ?? ""}
                        onChange={(e) =>
                          setClarifyingAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border-[1.5px] border-[#e0e0e0] dark:border-[#333333] bg-white dark:bg-[#222222] px-4 py-2.5 text-[14px] text-[#1a1a1a] dark:text-[#e8e8e8] outline-none focus:border-[#cc4400] dark:focus:border-[#ff6b35] transition-colors"
                        placeholder="Type your answer…"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleClarifySubmit();
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleClarifySubmit}
                  disabled={
                    Object.values(clarifyingAnswers).every((v) => !v)
                  }
                  className="h-11 px-8 rounded-lg text-[15px] font-bold bg-[#cc4400] dark:bg-[#ff6b35] text-white dark:text-black hover:brightness-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* THREAD VIEW — scrollable conversation with all turns */}
      {showThread && !showClarifying && !showGuardrail && (
        <div className="flex flex-col h-full min-h-0">
          <div
            ref={threadScrollRef}
            className="flex-1 overflow-y-auto space-y-6 pb-6"
          >
            {turns.map((turn, i) => (
              <div key={i} className="space-y-3 animate-fade-in">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#cc4400] dark:bg-[#ff6b35] text-white dark:text-black px-4 py-2.5 text-[14px] leading-relaxed">
                    {turn.query}
                  </div>
                </div>
                {/* Assistant response */}
                {turn.result ? (
                  <div className="flex justify-start">
                    <div className="w-full max-w-2xl">
                      <ResultsPanel
                        result={turn.result}
                        onToast={(msg) => toast(msg)}
                      />
                    </div>
                  </div>
                ) : i === turns.length - 1 && isProcessing ? (
                  <div className="flex justify-start">
                    <div className="w-full max-w-2xl">
                      {(activeEntry?.pipelineEvents?.length ?? 0) === 0 ? (
                        <div className="rounded-xl border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] overflow-hidden shadow-sm">
                          <div className="px-5 py-3 bg-[#fafafa] dark:bg-[#111111] border-b border-[#e8e8e8] dark:border-[#2a2a2a]">
                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                          </div>
                          <div className="px-5 py-4 space-y-3">
                            {[1, 2, 3, 4, 5].map((j) => (
                              <div key={j} className="flex items-start gap-3">
                                <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
                                <div className="flex-1 space-y-1">
                                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <PipelineTicker events={activeEntry?.pipelineEvents ?? []} />
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STATE 3: Loading / pipeline ticker (when no thread yet) */}
      {showLoading && !showThread && (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
          {(activeEntry?.pipelineEvents?.length ?? 0) === 0 ? (
            <div className="max-w-md w-full animate-fade-in space-y-3">
              <div className="rounded-xl border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] overflow-hidden shadow-sm">
                <div className="px-5 py-3 bg-[#fafafa] dark:bg-[#111111] border-b border-[#e8e8e8] dark:border-[#2a2a2a]">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
                <div className="px-5 py-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <PipelineTicker events={activeEntry?.pipelineEvents ?? []} />
          )}
        </div>
      )}

      {/* GUARDRAIL STATE */}
      {showGuardrail && (
        <div className="flex items-center justify-center h-full min-h-[300px] animate-fade-in">
          <div className="max-w-[500px] w-full text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-5">
              <span className="text-[48px] leading-none">⚠</span>
            </div>
            <h3 className="text-[20px] font-bold text-[#1a1a1a] dark:text-[#e8e8e8] mb-4">
              We want to make sure you get the right help
            </h3>
            <div
              className="text-[15px] text-[#333333] dark:text-[#cccccc] leading-relaxed text-left [&_strong]:font-bold [&_a]:underline [&_a]:hover:text-[#cc4400] dark:[&_a]:hover:text-[#ff6b35]"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(guardrailMessage!),
              }}
            />
            <button
              type="button"
              onClick={resetConversation}
              className="mt-6 h-11 px-6 rounded-lg text-[14px] font-bold bg-[#cc4400] dark:bg-[#ff6b35] text-white dark:text-black hover:brightness-90 active:scale-[0.98] transition-all"
            >
              Ask a different question
            </button>
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && !isProcessing && (
        <div
          className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-5 animate-fade-in"
          role="alert"
        >
          <p className="text-[15px] font-semibold text-red-700 dark:text-red-400">
            Something went wrong
          </p>
          <p className="text-[14px] text-red-600 dark:text-red-400/90 mt-1">
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
      )}

      {/* STATE 4: Results dashboard (single-turn, no thread) */}
      {hasResults && !showThread && (
        <div className="space-y-4">
          {/* ROW 0 — Copy full result */}
          <div className={rowClass(0)} style={rowStyle(0)}>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCopyFullResult}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#666666] dark:text-[#888888] hover:text-[#1a1a1a] dark:hover:text-[#e8e8e8] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {fullResultCopied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {fullResultCopied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* ROW 1 — Pipeline trace bar */}
          {(result.selected_agent || result.confidence != null) && (
            <div
              className={rowClass(200)}
              style={rowStyle(200)}
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-[#f8f8f8] dark:bg-[#1a1a1a] px-4 py-2">
                {[
                  {
                    label: "Business",
                    value:
                      result.detected_business_type?.replace(/_/g, " ") ||
                      result.sector,
                  },
                  { label: "Role", value: result.detected_role },
                  {
                    label: "Agent",
                    value: result.selected_agent
                      ? formatAgent(result.selected_agent)
                      : undefined,
                  },
                  {
                    label: "Confidence",
                    value:
                      result.confidence != null
                        ? formatConfidence(result.confidence)
                        : undefined,
                  },
                  { label: "Model", value: "GLM-4-Plus · Z.AI" },
                ]
                  .filter((item) => item.value)
                  .map((item) => (
                    <span key={item.label} className="text-[12px]">
                      <span className="text-[#999999]">
                        {item.label}:{" "}
                      </span>
                      <span className="font-bold text-[#1a1a1a] dark:text-[#e8e8e8] capitalize">
                        {item.value}
                      </span>
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* ROW 2 — Summary card */}
          {displayText && (
            <div
              className={rowClass(200)}
              style={rowStyle(200)}
            >
              <div className="bg-[#fff9f5] dark:bg-[#1a1a1a] border-l-4 border-l-[#cc4400] dark:border-l-[#ff6b35] rounded-r-lg p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-2">
                  AI Recommendation
                </p>
                <p
                  className={cn(
                    "text-[16px] text-[#1a1a1a] dark:text-[#e8e8e8] leading-[1.6] whitespace-pre-wrap",
                    !summaryExpanded &&
                      displayText.length > 200 &&
                      "line-clamp-3"
                  )}
                >
                  {displayText}
                </p>
                {displayText.length > 200 && (
                  <button
                    type="button"
                    onClick={() => setSummaryExpanded((v) => !v)}
                    className="text-[13px] font-medium text-[#cc4400] dark:text-[#ff6b35] mt-1 hover:underline"
                  >
                    {summaryExpanded ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ROW 3 — Three column grid: Key Metrics | Quick Wins | Financial Impact */}
          {(!!result.key_metrics?.length ||
            !!result.quick_wins?.length ||
            !!fi) && (
            <div
              className={rowClass(400)}
              style={rowStyle(400)}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Key Metrics */}
                {result.key_metrics && result.key_metrics.length > 0 && (
                  <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-3">
                      Key Metrics
                    </p>
                    <div className="space-y-3">
                      {result.key_metrics.slice(0, 3).map((m, i) => {
                        const isWorse =
                          m.gap?.toLowerCase().includes("above") ||
                          m.gap?.toLowerCase().includes("worse") ||
                          m.gap?.toLowerCase().includes("higher");
                        return (
                          <div key={i}>
                            <p className="text-[11px] font-semibold text-[#666666] dark:text-[#888888] uppercase">
                              {m.metric_name}
                            </p>
                            <p className="text-[20px] font-bold text-[#1a1a1a] dark:text-white">
                              {m.current_estimate}
                            </p>
                            <p
                              className={cn(
                                "text-[12px] font-medium",
                                isWorse
                                  ? "text-red-500"
                                  : "text-emerald-500 dark:text-[#44dd88]"
                              )}
                            >
                              vs {m.uk_benchmark}
                            </p>
                          </div>
                        );
                      })}
                      {result.key_metrics.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setSummaryExpanded(true)}
                          className="text-[12px] font-medium text-[#cc4400] dark:text-[#ff6b35] hover:underline"
                        >
                          See all {result.key_metrics.length} metrics
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Wins */}
                {result.quick_wins && result.quick_wins.length > 0 && (
                  <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-3">
                      ⚡ Do This Week
                    </p>
                    <div className="space-y-3">
                      {result.quick_wins.slice(0, 3).map((w, i) => (
                        <div key={i}>
                          <p className="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8]">
                            {w.action}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-[#44dd88]">
                              {w.impact}
                            </span>
                            <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600 dark:text-[#ffaa44]">
                              {w.effort}
                            </span>
                          </div>
                        </div>
                      ))}
                      {result.quick_wins.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setSummaryExpanded(true)}
                          className="text-[12px] font-medium text-[#cc4400] dark:text-[#ff6b35] hover:underline"
                        >
                          See all {result.quick_wins.length}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Financial Impact */}
                {fi && (
                  <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-3">
                      Estimated Impact
                    </p>
                    <p className="text-[28px] font-bold text-[#1a1a1a] dark:text-white leading-tight">
                      £{fi.low?.toLocaleString()} – £
                      {fi.high?.toLocaleString()}
                    </p>
                    <p className="text-[14px] text-[#666666] dark:text-[#888888]">
                      /month
                    </p>
                    {result.time_saved_weekly_hours != null &&
                      result.time_saved_weekly_hours > 0 && (
                        <p className="mt-2 text-[18px] font-bold text-[#22aa55] dark:text-[#44dd88]">
                          {result.time_saved_weekly_hours}h saved/week
                        </p>
                      )}
                    {result.uk_benchmark_comparison && (
                      <p className="mt-1 text-[12px] text-[#666666] dark:text-[#888888] italic">
                        {result.uk_benchmark_comparison}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ROW 4 — Two column: Action Plan (60%) | Tools (40%) */}
          {(!!result.action_plan?.length ||
            !!result.tools_to_use?.length) && (
            <div
              className={rowClass(600)}
              style={rowStyle(600)}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
                {/* Action Plan */}
                {result.action_plan && result.action_plan.length > 0 && (
                  <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-3">
                      Action Plan
                    </p>
                    <div className="flex gap-1.5 mb-4 overflow-x-auto">
                      {result.action_plan.map((ap) => (
                        <button
                          key={ap.week}
                          type="button"
                          onClick={() => setActionWeek(ap.week)}
                          className={cn(
                            "flex-shrink-0 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors",
                            actionWeek === ap.week
                              ? "bg-[#cc4400] dark:bg-[#ff6b35] text-white dark:text-black"
                              : "border border-[#e0e0e0] dark:border-[#333333] text-[#666666] dark:text-[#888888] hover:bg-[#f0f0f0] dark:hover:bg-[#222222]"
                          )}
                        >
                          Week {ap.week}
                        </button>
                      ))}
                    </div>
                    {result.action_plan
                      .filter((ap) => ap.week === actionWeek)
                      .map((ap) => (
                        <div key={ap.week}>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="flex items-center gap-1 rounded-full bg-violet-50 dark:bg-violet-950/30 px-2.5 py-0.5 text-[12px] font-medium text-violet-600 dark:text-violet-400">
                              <Users className="h-3 w-3" /> {ap.owner}
                            </span>
                            <span className="rounded-full bg-[#f0f0f0] dark:bg-[#222222] px-2.5 py-0.5 text-[12px] font-medium text-[#666666] dark:text-[#888888]">
                              {ap.time_required}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {ap.actions.map((action, j) => (
                              <div
                                key={j}
                                className="flex gap-2.5 rounded-md bg-[#fafafa] dark:bg-[#111111] px-3 py-2 text-[13px] text-[#1a1a1a] dark:text-[#e8e8e8]"
                              >
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#cc4400] dark:text-[#ff6b35] mt-0.5 opacity-40" />
                                {safeText(action)}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Recommended Tools */}
                {result.tools_to_use && result.tools_to_use.length > 0 && (
                  <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-3">
                      Tools
                    </p>
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-[#e8e8e8] dark:border-[#2a2a2a]">
                          <th className="text-left py-1.5 pr-3 font-semibold text-[#666666] dark:text-[#888888]">
                            Tool
                          </th>
                          <th className="text-left py-1.5 pr-3 font-semibold text-[#666666] dark:text-[#888888]">
                            Purpose
                          </th>
                          <th className="text-left py-1.5 pr-3 font-semibold text-[#666666] dark:text-[#888888]">
                            Cost
                          </th>
                          <th className="text-center py-1.5 font-semibold text-[#666666] dark:text-[#888888]">
                            UK
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.tools_to_use.map((tool, i) => (
                          <tr
                            key={i}
                            className={
                              i % 2 === 1
                                ? "bg-[#fafafa] dark:bg-[#111111]"
                                : ""
                            }
                          >
                            <td className="py-2 pr-3 font-bold text-[#1a1a1a] dark:text-[#e8e8e8]">
                              {tool.tool}
                            </td>
                            <td className="py-2 pr-3 text-[#666666] dark:text-[#888888]">
                              {tool.purpose}
                            </td>
                            <td className="py-2 pr-3 text-[#1a1a1a] dark:text-[#e8e8e8]">
                              {tool.cost}
                            </td>
                            <td className="py-2 text-center">
                              {tool.uk_available ? (
                                <span className="text-emerald-500">
                                  UK ✓
                                </span>
                              ) : (
                                <span className="text-red-400">✗</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ROW 5 — Three column: Next Actions | Risks | Assumptions */}
          {(!!result.next_actions?.length ||
            !!result.risks?.length ||
            !!result.assumptions?.length) && (
            <div
              className={rowClass(800)}
              style={rowStyle(800)}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Next Actions */}
                {result.next_actions && result.next_actions.length > 0 && (
                  <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35]">
                        Next Actions
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyNextActions}
                        className="flex items-center gap-1 text-[11px] font-medium text-[#999999] hover:text-[#1a1a1a] dark:hover:text-[#e8e8e8] transition-colors"
                      >
                        {nextActionsCopied ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {nextActionsCopied ? "Copied" : "Copy all"}
                      </button>
                    </div>
                    <ol className="space-y-2">
                      {result.next_actions.map((action, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-[14px] text-[#1a1a1a] dark:text-[#e8e8e8]"
                        >
                          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#cc4400]/10 dark:bg-[#ff6b35]/10 text-[11px] font-bold text-[#cc4400] dark:text-[#ff6b35]">
                            {i + 1}
                          </span>
                          <span>{safeText(action)}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Risks */}
                {result.risks && result.risks.length > 0 && (
                  <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-3">
                      Risks
                    </p>
                    <div className="space-y-2">
                      {result.risks.map((risk, i) => (
                        <div
                          key={i}
                          className="flex gap-2 text-[13px] text-[#b85000] dark:text-[#ffaa44] border-l-2 border-l-amber-400 dark:border-l-[#ffaa44] pl-2.5"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                          <span>{safeText(risk)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assumptions */}
                {result.assumptions && result.assumptions.length > 0 && (
                  <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999] mb-3">
                      Assumptions
                    </p>
                    <div className="space-y-2">
                      {result.assumptions.map((a, i) => (
                        <div
                          key={i}
                          className="flex gap-2 text-[13px] text-[#666666] dark:text-[#888888]"
                        >
                          <span className="text-[#999999] flex-shrink-0">
                            ~
                          </span>
                          <span>{safeText(a)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ROW 6 — Reviewer notes */}
          {result.reviewer_flags && result.reviewer_flags.length > 0 && (
            <div
              className={rowClass(800)}
              style={rowStyle(800)}
            >
              <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3">
                <Shield className="h-4 w-4 text-amber-600 dark:text-[#ffaa44] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] font-bold text-amber-700 dark:text-amber-300 mb-1">
                    Reviewer notes
                  </p>
                  {result.reviewer_flags.map((flag, i) => (
                    <p
                      key={i}
                      className="text-[12px] text-amber-800 dark:text-amber-200 leading-relaxed"
                    >
                      {safeText(flag)}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Additional agent-specific sections (below fold) ──── */}

          {/* HR: UK Legal Context */}
          {result.uk_legal_context && (
            <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-2 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" /> UK Legal Context
              </p>
              <p className="text-[14px] text-[#1a1a1a] dark:text-[#e8e8e8] leading-relaxed">
                {result.uk_legal_context}
              </p>
            </div>
          )}

          {/* HR: Recommended Approach */}
          {result.recommended_approach && (
            <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Recommended
                Approach
              </p>
              <div className="space-y-4">
                {(
                  [
                    {
                      key: "immediate" as const,
                      label: "Do Today",
                      color: "text-red-500",
                    },
                    {
                      key: "short_term" as const,
                      label: "This Week / Month",
                      color: "text-amber-500",
                    },
                    {
                      key: "ongoing" as const,
                      label: "Ongoing",
                      color: "text-blue-500",
                    },
                  ] as const
                ).map(({ key, label, color }) => {
                  const items = result.recommended_approach?.[key];
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={key}>
                      <p
                        className={cn(
                          "text-[12px] font-semibold uppercase tracking-[0.06em] mb-1.5",
                          color
                        )}
                      >
                        {label}
                      </p>
                      <ul className="space-y-1">
                        {items.map((item, i) => (
                          <li
                            key={i}
                            className="flex gap-2 text-[14px] text-[#1a1a1a] dark:text-[#e8e8e8]"
                          >
                            <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#cc4400] dark:text-[#ff6b35] mt-0.5" />
                            {safeText(item)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* HR: Staff Communication Template */}
          {result.staff_communication_template && (
            <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-2 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Staff
                Communication Template
              </p>
              <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-[#1a1a1a] dark:text-[#e8e8e8] bg-[#fafafa] dark:bg-[#111111] rounded-md p-3">
                {result.staff_communication_template}
              </pre>
            </div>
          )}

          {/* HR: AI Adoption Tips */}
          {result.ai_adoption_tips && result.ai_adoption_tips.length > 0 && (
            <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-3 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" /> AI Adoption Tips
              </p>
              <div className="space-y-3">
                {result.ai_adoption_tips.map((tip, i) => (
                  <div
                    key={i}
                    className="rounded-md bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/30 dark:border-amber-900/20 p-3"
                  >
                    <p className="text-[12px] font-semibold text-red-500">
                      Barrier: {tip.barrier}
                    </p>
                    <p className="mt-1 text-[13px] text-[#1a1a1a] dark:text-[#e8e8e8]">
                      {tip.response}
                    </p>
                    <p className="mt-1 text-[12px] italic text-[#666666] dark:text-[#888888] border-l-2 border-[#cc4400] dark:border-[#ff6b35] pl-2">
                      &ldquo;{tip.example_phrase}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adoption: Score */}
          {result.adoption_score != null && (
            <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-2 flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5" /> Adoption Score
              </p>
              <div className="flex items-end gap-2">
                <span
                  className={cn(
                    "text-[36px] font-extrabold tabular-nums",
                    result.adoption_score > 60 && "text-emerald-500",
                    result.adoption_score > 30 &&
                      result.adoption_score <= 60 &&
                      "text-amber-500",
                    result.adoption_score <= 30 && "text-red-500"
                  )}
                >
                  {result.adoption_score}
                </span>
                <span className="text-[16px] font-medium text-[#666666] dark:text-[#888888] mb-1">
                  /100
                </span>
              </div>
              {result.score_label && (
                <p className="text-[14px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8] mt-1">
                  {result.score_label}
                </p>
              )}
              <div className="mt-2 h-2 w-full rounded-full bg-[#f0f0f0] dark:bg-[#222222] overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-out",
                    result.adoption_score > 60 &&
                      "bg-gradient-to-r from-emerald-400 to-emerald-500",
                    result.adoption_score > 30 &&
                      result.adoption_score <= 60 &&
                      "bg-gradient-to-r from-amber-400 to-amber-500",
                    result.adoption_score <= 30 &&
                      "bg-gradient-to-r from-red-400 to-red-500"
                  )}
                  style={{ width: `${result.adoption_score}%` }}
                />
              </div>
              {result.score_breakdown && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(
                    [
                      { key: "usage_breadth" as const, label: "Usage Breadth" },
                      {
                        key: "use_case_quality" as const,
                        label: "Use Case Quality",
                      },
                      {
                        key: "workflow_integration" as const,
                        label: "Workflow Integration",
                      },
                      {
                        key: "team_capability" as const,
                        label: "Team Capability",
                      },
                    ] as const
                  ).map(({ key, label }) => {
                    const component = result.score_breakdown?.[key];
                    if (!component) return null;
                    return (
                      <div
                        key={key}
                        className="rounded-md bg-[#fafafa] dark:bg-[#111111] p-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold text-[#666666] dark:text-[#888888]">
                            {label}
                          </p>
                          <p className="text-[14px] font-bold text-[#1a1a1a] dark:text-[#e8e8e8]">
                            {component.score}/25
                          </p>
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-[#e0e0e0] dark:bg-[#333333] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#cc4400] dark:bg-[#ff6b35] transition-all duration-700"
                            style={{
                              width: `${(component.score / 25) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Adoption: Automation Roadmap */}
          {result.automation_roadmap &&
            result.automation_roadmap.length > 0 && (
              <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-3 flex items-center gap-1.5">
                  <Rocket className="h-3.5 w-3.5" /> Automation Roadmap
                </p>
                <div className="space-y-2">
                  {result.automation_roadmap.map((item, i) => (
                    <div
                      key={i}
                      className="flex gap-3 rounded-md bg-[#fafafa] dark:bg-[#111111] p-3"
                    >
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50 text-[12px] font-bold text-violet-600 dark:text-violet-400">
                        {item.priority}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8]">
                          {item.workflow}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                              item.effort === "low"
                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                            )}
                          >
                            {item.effort}
                          </span>
                          <span className="text-[11px] text-[#666666] dark:text-[#888888]">
                            {item.tool_recommendation} ·{" "}
                            {item.implementation_time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Learning Path */}
          {result.learning_path && result.learning_path.length > 0 && (
            <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-3 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Learning Path
              </p>
              <div className="space-y-2">
                {result.learning_path.map((step, i) => (
                  <div
                    key={i}
                    className="flex gap-3 rounded-md bg-[#fafafa] dark:bg-[#111111] p-3"
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-[12px] font-bold text-blue-600 dark:text-blue-400">
                      {step.step}
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8]">
                        {step.title}
                      </p>
                      <p className="text-[12px] text-blue-600 dark:text-blue-400">
                        {step.resource}
                      </p>
                      <p className="text-[11px] text-[#666666] dark:text-[#888888]">
                        {step.time_to_complete}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Market Intelligence: Signals */}
          {result.local_market_signals &&
            result.local_market_signals.length > 0 && (
              <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-3 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /> Market Signals
                </p>
                <div className="space-y-3">
                  {result.local_market_signals.map((signal, i) => (
                    <div key={i} className="rounded-md bg-[#fafafa] dark:bg-[#111111] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8]">
                          {signal.signal}
                        </p>
                        <span className="flex-shrink-0 rounded-full bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-600 dark:text-violet-400">
                          {signal.source_type?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] text-[#666666] dark:text-[#888888]">
                        {signal.business_implication}
                      </p>
                      <p className="mt-1 text-[12px] font-medium text-[#cc4400] dark:text-[#ff6b35]">
                        → {signal.recommended_action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Market Intelligence: Seasonal Calendar */}
          {result.seasonal_calendar &&
            result.seasonal_calendar.length > 0 && (
              <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-3 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Seasonal Calendar
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {result.seasonal_calendar.map((entry, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-[#e8e8e8] dark:border-[#2a2a2a] p-2.5"
                    >
                      <p className="text-[13px] font-bold text-[#1a1a1a] dark:text-[#e8e8e8]">
                        {entry.period}
                      </p>
                      <p className="mt-0.5 text-[12px] font-semibold text-emerald-500">
                        {entry.expected_impact}
                      </p>
                      <p className="mt-1 text-[11px] text-[#666666] dark:text-[#888888]">
                        {entry.preparation_action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Market Intelligence: Opportunities */}
          {result.opportunities && result.opportunities.length > 0 && (
            <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-3 flex items-center gap-1.5">
                <Rocket className="h-3.5 w-3.5" /> Opportunities
              </p>
              <div className="space-y-2">
                {result.opportunities.map((opp, i) => (
                  <div
                    key={i}
                    className="rounded-md bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/30 p-3"
                  >
                    <p className="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8]">
                      {opp.opportunity}
                    </p>
                    <p className="mt-0.5 text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {opp.potential_revenue_impact}
                    </p>
                    <p className="mt-1 text-[12px] text-[#666666] dark:text-[#888888]">
                      {opp.how_to_capture}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Market Intelligence: Competitor Landscape */}
          {result.competitor_landscape?.pricing_context && (
            <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-2 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" /> Competitor Landscape
              </p>
              <p className="text-[13px] text-[#1a1a1a] dark:text-[#e8e8e8] mb-2">
                {result.competitor_landscape.pricing_context}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.competitor_landscape.typical_uk_competitors
                  ?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-[#666666] dark:text-[#888888] mb-1">
                      Typical Competitors
                    </p>
                    <ul className="space-y-0.5">
                      {result.competitor_landscape.typical_uk_competitors.map(
                        (c, i) => (
                          <li
                            key={i}
                            className="text-[12px] text-[#1a1a1a] dark:text-[#e8e8e8]"
                          >
                            • {c}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
                {result.competitor_landscape
                  .differentiation_opportunities?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-emerald-600 dark:text-emerald-400 mb-1">
                      Differentiation
                    </p>
                    <ul className="space-y-0.5">
                      {result.competitor_landscape.differentiation_opportunities.map(
                        (d, i) => (
                          <li
                            key={i}
                            className="text-[12px] text-emerald-600 dark:text-emerald-400"
                          >
                            • {d}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Demand Forecast */}
          {result.demand_forecast?.next_30_days && (
            <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-2 flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" /> Demand Forecast
              </p>
              <p className="text-[14px] text-[#1a1a1a] dark:text-[#e8e8e8]">
                {result.demand_forecast.next_30_days}
              </p>
              {result.demand_forecast.key_dates_to_watch?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {result.demand_forecast.key_dates_to_watch.map(
                    (d, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-blue-50 dark:bg-blue-950/30 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400"
                      >
                        {d}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* HR: Escalation warning */}
          {result.escalate_to_human && result.escalation_reason && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-red-500 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Professional
                Advice Recommended
              </p>
              <p className="text-[14px] text-red-600 dark:text-red-400">
                {result.escalation_reason}
              </p>
            </div>
          )}

          {/* Deploy links */}
          {(result.deployed_url || result.stripe_product_url) && (
            <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-2 flex items-center gap-1.5">
                <Rocket className="h-3.5 w-3.5" /> Deployed
              </p>
              <div className="space-y-2">
                {result.deployed_url && (
                  <a
                    href={result.deployed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-md border border-[#e8e8e8] dark:border-[#2a2a2a] px-3 py-2 text-[13px] font-medium text-[#cc4400] dark:text-[#ff6b35] hover:border-[#cc4400] dark:hover:border-[#ff6b35] transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="truncate flex-1">
                      {result.deployed_url}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                  </a>
                )}
                {result.stripe_product_url && (
                  <a
                    href={result.stripe_product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-md border border-[#e8e8e8] dark:border-[#2a2a2a] px-3 py-2 text-[13px] font-medium text-violet-600 dark:text-violet-400 hover:border-violet-400 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="truncate flex-1">
                      Stripe Payment Link
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Training Recommendations */}
          {result.training_recommendations &&
            result.training_recommendations.length > 0 && (
              <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-3 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> Training
                  Recommendations
                </p>
                <div className="space-y-2">
                  {result.training_recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex gap-3 rounded-md bg-[#fafafa] dark:bg-[#111111] p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8]">
                          {rec.topic}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1 text-[11px]">
                          <span className="rounded-full bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 font-medium text-blue-600 dark:text-blue-400 capitalize">
                            {rec.audience?.replace(/_/g, " ")}
                          </span>
                          <span className="rounded-full bg-[#f0f0f0] dark:bg-[#222222] px-2 py-0.5 font-medium text-[#666666] dark:text-[#888888]">
                            {rec.format}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] text-emerald-600 dark:text-emerald-400">
                          {rec.free_resource}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Identified Use Cases */}
          {result.identified_use_cases &&
            result.identified_use_cases.length > 0 && (
              <div className="rounded-lg border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#cc4400] dark:text-[#ff6b35] mb-3 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5" /> Identified Use
                  Cases
                </p>
                <div className="space-y-2">
                  {result.identified_use_cases.map((uc, i) => (
                    <div
                      key={i}
                      className="rounded-md bg-[#fafafa] dark:bg-[#111111] p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8]">
                            {uc.name}
                          </p>
                          <p className="text-[11px] text-[#666666] dark:text-[#888888] capitalize">
                            {uc.department}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                            uc.ai_readiness === "high"
                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {uc.ai_readiness}
                        </span>
                      </div>
                      {uc.potential_hours_saved_weekly > 0 && (
                        <p className="mt-1 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {uc.potential_hours_saved_weekly}h/week potential
                        </p>
                      )}
                      {uc.recommended_tool && (
                        <p className="mt-0.5 text-[12px] text-[#cc4400] dark:text-[#ff6b35]">
                          {uc.recommended_tool}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
    </>
  );

  /* ─── left panel (shared content) ────────────────────────────────── */

  const leftPanelContent = (
    <>
      {/* SIDEBAR HEADER */}
      <div className="h-[52px] flex items-center justify-between px-4 flex-shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]">
          History
        </span>
        <button
          type="button"
          onClick={resetConversation}
          className="text-[11px] font-medium text-[#cc4400] dark:text-[#ff6b35] hover:underline"
        >
          + New
        </button>
      </div>

      {/* DIVIDER */}
      <div className="h-px bg-[#f0f0f0] dark:bg-[#222222] flex-shrink-0" />

      {/* CONVERSATION HISTORY */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-8 w-8 text-[#e0e0e0] dark:text-[#333333] mb-2" />
            <p className="text-[12px] text-[#cccccc] dark:text-[#444444]">
              Your conversations will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {history.map((entry) => {
              const isActive = activeHistoryId === entry.id;
              const isPending = entry.status === "pending";
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "group relative rounded-lg transition-all",
                    isActive
                      ? "border-l-[3px] border-l-[#cc4400] dark:border-l-[#ff6b35] bg-[#fff8f5] dark:bg-[#1a1210]"
                      : "hover:bg-[#f0f0f0] dark:hover:bg-[#1a1a1a]"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleHistorySelect(entry)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 pr-8",
                      isActive && "pl-[9px]"
                    )}
                  >
                    <p className="text-[13px] font-bold text-[#1a1a1a] dark:text-[#e8e8e8] truncate">
                      {(() => {
                        const label =
                          (entry.turns?.[0]?.query ?? entry.query) || "New conversation";
                        return label.length > 50 ? label.substring(0, 50) + "…" : label;
                      })()}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {isPending ? (
                        <span className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          Processing
                        </span>
                      ) : (entry.turns?.at(-1)?.result ?? entry.result)?.selected_agent ? (
                        <span className="rounded-full bg-[#cc4400]/10 dark:bg-[#ff6b35]/10 px-2 py-0.5 text-[10px] font-semibold text-[#cc4400] dark:text-[#ff6b35] capitalize">
                          {((entry.turns?.at(-1)?.result ?? entry.result)!.selected_agent ?? "").replace(/_/g, " ")}
                        </span>
                      ) : null}
                      <span className="text-[11px] text-[#999999]">
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEntry(entry.id);
                      if (isActive) {
                        setResult(null);
                        setActiveHistoryId(null);
                        setConversationStatus("idle");
                      }
                      toast("Chat deleted");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-md text-[#cccccc] dark:text-[#444444] opacity-0 group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="h-[40px] flex items-center justify-center px-4 flex-shrink-0 border-t border-[#f0f0f0] dark:border-[#222222]">
        <p className="text-[10px] text-[#cccccc] dark:text-[#444444]">
          Highstreet AI · Powered by Z.AI GLM-4-Plus
        </p>
      </div>
    </>
  );

  /* ─── render ──────────────────────────────────────────────────────── */

  return (
    <ErrorBoundary>
    <div className="h-screen overflow-hidden flex flex-col">
      {/* TOP HEADER BAR */}
      <header className="h-[56px] flex items-center justify-center px-4 bg-[#fafafa] dark:bg-[#111111] border-b border-[#eeeeee] dark:border-[#222222] flex-shrink-0 relative">
        <div className="flex items-center gap-3">
          <img
            src="/favicon.png"
            alt="Highstreet AI"
            className="h-8 w-8 rounded-lg"
          />
          <div>
            <h1 className="text-[16px] font-bold text-[#1a1a1a] dark:text-[#f0f0f0] leading-tight">
              Highstreet AI
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#666666] dark:text-[#888888]">
              Autonomous AI Workforce
            </p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-white dark:bg-[#1a2a1a] border border-[#cccccc] dark:border-[#22aa55] px-2 py-1 text-[10px] font-semibold text-[#111111] dark:text-[#88dd88]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22aa55] animate-pulse" />
            GLM-4-Plus
          </span>
        </div>
        <div className="absolute right-4 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#666666] dark:text-[#aaaaaa] hover:bg-[#e8e8e8] dark:hover:bg-[#222222] transition-colors"
            aria-label={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg text-[#666666] hover:bg-[#e8e8e8] dark:hover:bg-[#222222] transition-colors"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT ROW */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR — desktop only */}
        <aside className="hidden md:flex w-[260px] flex-col flex-shrink-0 bg-[#fafafa] dark:bg-[#111111] border-r border-[#eeeeee] dark:border-[#222222]">
          {leftPanelContent}
        </aside>

        {/* RIGHT PANEL */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0f0f0f]">
          {showEmpty ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in">
              <h2 className="text-[28px] font-bold text-[#1a1a1a] dark:text-[#e8e8e8] leading-[1.2]">
                Your autonomous AI workforce
              </h2>
              <p className="mt-3 text-[16px] text-[#666666] dark:text-[#999999] max-w-md text-center">
                Ask anything about operations, HR, AI adoption, or market
                intelligence.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                {EXAMPLE_QUERIES.map((eq) => (
                  <button
                    key={eq.text}
                    type="button"
                    onClick={() => {
                      setQuery(eq.text);
                      inputRef.current?.focus();
                    }}
                    className="text-left rounded-xl border border-[#e8e8e8] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-5 hover:border-[#cc4400] dark:hover:border-[#ff6b35] transition-colors cursor-pointer group"
                  >
                    <span className="text-[24px]">{eq.icon}</span>
                    <p className="mt-2 text-[14px] font-bold text-[#1a1a1a] dark:text-[#e8e8e8] leading-snug">
                      {eq.text}
                    </p>
                    <p className="mt-1.5 text-[12px] font-semibold text-[#cc4400] dark:text-[#ff6b35]">
                      {eq.category}
                    </p>
                  </button>
                ))}
              </div>
              <div className="mt-8 w-full">
                {inputSection}
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 md:p-8">
                {rightPanel}
              </div>
              <div className="flex-shrink-0 border-t border-[#f0f0f0] dark:border-[#1a1a1a] bg-white dark:bg-[#0f0f0f] px-4 py-3">
                {inputSection}
              </div>
            </>
          )}
        </main>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/30 dark:bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute top-[56px] left-0 right-0 bottom-0 bg-[#fafafa] dark:bg-[#111111] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {leftPanelContent}
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
    </ErrorBoundary>
  );
}

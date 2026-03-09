"use client";

import {
  Copy,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Gauge,
  Route,
  Building2,
  ArrowRight,
  Clock,
  Rocket,
  Globe,
  Zap,
  Wrench,
  Calendar,
  Users,
  TrendingUp,
  BookOpen,
  Shield,
  MessageSquare,
  ChevronRight,
  Target,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import { cn, formatConfidence, formatAgent } from "@/lib/utils";
import type { AgentResult } from "@/lib/types";

interface ResultsPanelProps {
  result: AgentResult;
  onToast: (message: string) => void;
}

function Card({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#e0e0e0] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-5 shadow-sm animate-fade-in-up",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionLabel({
  icon: Icon,
  children,
  color,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <h3 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#444444] dark:text-[#aaaaaa] mb-3">
      <Icon className={cn("h-3.5 w-3.5", color)} />
      {children}
    </h3>
  );
}

function CopyButton({ text, onToast, label = "Copy" }: { text: string; onToast: (msg: string) => void; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    onToast("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium text-[#444444] dark:text-[#aaaaaa] hover:text-[#1a1a1a] dark:hover:text-[#e8e8e8] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      {copied ? (
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}

function getFullPlainText(result: AgentResult): string {
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
    result.next_actions.forEach((a, i) => {
      const text = typeof a === "string" ? a : JSON.stringify(a);
      parts.push(`${i + 1}. ${text}`);
    });
  }
  return parts.join("\n");
}

export function ResultsPanel({ result, onToast }: ResultsPanelProps) {
  const [actionWeek, setActionWeek] = useState(1);

  const displayText = result.summary || result.answer || "";

  return (
    <div className="space-y-4">
      {/* Copy full result */}
      <div className="flex justify-end">
        <CopyButton
          text={getFullPlainText(result)}
          onToast={onToast}
          label="Copy"
        />
      </div>

      {/* Main summary */}
      {displayText && (
        <Card>
          <SectionLabel icon={Lightbulb} color="text-brand-500">
            AI Recommendation
          </SectionLabel>
          <p className="text-[15px] leading-relaxed text-[#1a1a1a] dark:text-[#e8e8e8] whitespace-pre-wrap">
            {displayText}
          </p>
        </Card>
      )}

      {/* Pipeline trace */}
      {(result.selected_agent || result.intent || result.confidence != null) && (
        <Card delay={50}>
          <SectionLabel icon={Route} color="text-blue-500">
            Pipeline Trace
          </SectionLabel>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Intent", value: result.intent },
              {
                label: "Agent",
                value: result.selected_agent
                  ? formatAgent(result.selected_agent)
                  : undefined,
              },
              { label: "Role", value: result.detected_role },
              { label: "Sector", value: result.detected_sector_context || result.sector },
              { label: "Urgency", value: result.urgency },
              {
                label: "Confidence",
                value:
                  result.confidence != null
                    ? formatConfidence(result.confidence)
                    : undefined,
              },
              { label: "Model", value: "GLM-4-Plus" },
              { label: "Provider", value: "Z.AI" },
            ]
              .filter((item) => item.value)
              .map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5"
                >
                  <span className="text-[12px] font-semibold text-[#444444] dark:text-[#aaaaaa]">
                    {item.label}
                  </span>
                  <span className="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8] capitalize">
                    {String(item.value).replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            {result.fallback_used && (
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5">
                <span className="text-[12px] font-semibold text-amber-600 dark:text-amber-400">
                  Fallback
                </span>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  FLock
                </span>
              </div>
            )}
          </div>
          {result.pipeline_trace && result.pipeline_trace.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-[12px] text-[#444444] dark:text-[#aaaaaa]">
              {result.pipeline_trace.map((step, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ArrowRight className="h-3 w-3" />}
                  <span className="font-mono">{step}</span>
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Business profile */}
      {result.detected_business_type && (
        <Card delay={100}>
          <SectionLabel icon={Building2} color="text-violet-500">
            Business Profile
          </SectionLabel>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-brand-50 dark:bg-brand-950/50 px-3 py-1.5 text-[15px] font-semibold text-[#cc4400] dark:text-[#ff7744] capitalize">
              {result.detected_business_type.replace(/_/g, " ")}
            </span>
            {result.detected_role && (
              <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-[15px] font-medium text-[#1a1a1a] dark:text-[#e8e8e8] capitalize">
                {result.detected_role}
              </span>
            )}
            {result.detected_sector_context &&
              result.detected_sector_context !== result.detected_business_type && (
                <span className="rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 text-[13px] font-medium text-blue-600 dark:text-blue-400 capitalize">
                  {result.detected_sector_context.replace(/_/g, " ")}
                </span>
              )}
          </div>
        </Card>
      )}

      {/* Key metrics grid (Operations Agent) */}
      {result.key_metrics && result.key_metrics.length > 0 && (
        <Card delay={120}>
          <SectionLabel icon={BarChart3} color="text-blue-500">
            Key Metrics
          </SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {result.key_metrics.map((metric, i) => {
              const isAbove =
                metric.gap?.toLowerCase().includes("above") ||
                metric.gap?.toLowerCase().includes("worse") ||
                metric.gap?.toLowerCase().includes("higher");
              return (
                <div
                  key={i}
                  className="rounded-xl border border-[#e0e0e0] dark:border-[#2a2a2a] p-4"
                >
                  <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#444444] dark:text-[#aaaaaa]">
                    {metric.metric_name}
                  </p>
                  <p className="mt-1 text-xl font-bold text-[#1a1a1a] dark:text-[#e8e8e8]">
                    {metric.current_estimate}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-[13px] font-medium",
                      isAbove
                        ? "text-red-500 dark:text-red-400"
                        : "text-emerald-500 dark:text-emerald-400"
                    )}
                  >
                    vs {metric.uk_benchmark}
                  </p>
                  {metric.gap && (
                    <p className="mt-0.5 text-[12px] text-[#444444] dark:text-[#aaaaaa]">
                      {metric.gap}
                    </p>
                  )}
                  {metric.financial_impact && (
                    <p className="mt-1 text-[13px] font-semibold text-[#cc4400] dark:text-[#ff7744]">
                      {metric.financial_impact}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Quick wins card (Operations Agent) */}
      {result.quick_wins && result.quick_wins.length > 0 && (
        <Card delay={150} className="border-l-4 border-l-[#cc4400] dark:border-l-[#ff6b35]">
          <SectionLabel icon={Zap} color="text-[#cc4400] dark:text-[#ff6b35]">
            Do This Week
          </SectionLabel>
          <div className="space-y-3">
            {result.quick_wins.map((win, i) => (
              <div
                key={i}
                className="rounded-xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-200/50 dark:border-orange-900/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8]">
                    {win.action}
                  </p>
                  <span
                    className={cn(
                      "flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase",
                      win.effort === "low"
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {win.effort} effort
                  </span>
                </div>
                <p className="mt-1 text-[14px] font-semibold text-[#cc4400] dark:text-[#ff7744]">
                  {win.impact}
                </p>
                <p className="mt-2 text-[13px] text-[#444444] dark:text-[#aaaaaa] leading-relaxed">
                  {win.how_to}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action plan timeline (Operations Agent) */}
      {result.action_plan && result.action_plan.length > 0 && (
        <Card delay={175}>
          <SectionLabel icon={Target} color="text-violet-500">
            Action Plan
          </SectionLabel>
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
            {result.action_plan.map((ap) => (
              <button
                key={ap.week}
                type="button"
                onClick={() => setActionWeek(ap.week)}
                className={cn(
                  "flex-shrink-0 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors",
                  actionWeek === ap.week
                    ? "bg-[#cc4400] dark:bg-[#ff6b35] text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-[#444444] dark:text-[#aaaaaa] hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                Week {ap.week}
              </button>
            ))}
          </div>
          {result.action_plan
            .filter((ap) => ap.week === actionWeek)
            .map((ap) => (
              <div key={ap.week} className="space-y-3">
                <div className="flex flex-wrap gap-3 text-[13px]">
                  <span className="flex items-center gap-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/30 px-3 py-1.5 font-medium text-violet-600 dark:text-violet-400">
                    <Users className="h-3 w-3" /> {ap.owner}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 font-medium text-[#444444] dark:text-[#aaaaaa]">
                    <Clock className="h-3 w-3" /> {ap.time_required}
                  </span>
                </div>
                <ul className="space-y-2">
                  {ap.actions.map((action, j) => (
                    <li
                      key={j}
                      className="flex gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 px-4 py-3 text-[14px] text-[#1a1a1a] dark:text-[#e8e8e8]"
                    >
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#cc4400] dark:text-[#ff7744] mt-0.5" />
                      {action}
                    </li>
                  ))}
                </ul>
                {ap.expected_outcome && (
                  <p className="text-[13px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Expected: {ap.expected_outcome}
                  </p>
                )}
              </div>
            ))}
        </Card>
      )}

      {/* Tools table (Operations Agent) */}
      {result.tools_to_use && result.tools_to_use.length > 0 && (
        <Card delay={200}>
          <SectionLabel icon={Wrench} color="text-slate-500">
            Recommended Tools
          </SectionLabel>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#e0e0e0] dark:border-[#2a2a2a]">
                  <th className="text-left py-2 pr-4 font-semibold text-[#444444] dark:text-[#aaaaaa]">
                    Tool
                  </th>
                  <th className="text-left py-2 pr-4 font-semibold text-[#444444] dark:text-[#aaaaaa]">
                    Purpose
                  </th>
                  <th className="text-left py-2 pr-4 font-semibold text-[#444444] dark:text-[#aaaaaa]">
                    Cost
                  </th>
                  <th className="text-center py-2 font-semibold text-[#444444] dark:text-[#aaaaaa]">
                    UK
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.tools_to_use.map((tool, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#e0e0e0]/50 dark:border-[#2a2a2a]/50 last:border-0"
                  >
                    <td className="py-2.5 pr-4 font-semibold text-[#1a1a1a] dark:text-[#e8e8e8]">
                      {tool.tool}
                    </td>
                    <td className="py-2.5 pr-4 text-[#444444] dark:text-[#aaaaaa]">
                      {tool.purpose}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-[#1a1a1a] dark:text-[#e8e8e8]">
                      {tool.cost}
                    </td>
                    <td className="py-2.5 text-center">
                      {tool.uk_available ? (
                        <span className="text-emerald-500">&#10003;</span>
                      ) : (
                        <span className="text-red-400">&#10007;</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Financial impact summary (Operations / Adoption) */}
      {(result.financial_impact_monthly_gbp || result.financial_value_monthly_gbp) && (
        <Card delay={210}>
          <SectionLabel icon={TrendingUp} color="text-emerald-500">
            Estimated Monthly Impact
          </SectionLabel>
          <div className="flex flex-wrap items-end gap-6">
            {(() => {
              const fi =
                result.financial_impact_monthly_gbp ||
                result.financial_value_monthly_gbp;
              if (!fi) return null;
              return (
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#444444] dark:text-[#aaaaaa]">
                    Financial Value
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    £{fi.low?.toLocaleString()} – £{fi.high?.toLocaleString()}
                  </p>
                  <p className="text-[12px] text-[#444444] dark:text-[#aaaaaa]">
                    per month
                  </p>
                </div>
              );
            })()}
            {result.time_saved_weekly_hours != null &&
              result.time_saved_weekly_hours > 0 && (
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#444444] dark:text-[#aaaaaa]">
                    Time Saved
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {result.time_saved_weekly_hours}h
                  </p>
                  <p className="text-[12px] text-[#444444] dark:text-[#aaaaaa]">
                    per week
                  </p>
                </div>
              )}
          </div>
        </Card>
      )}

      {/* Seasonal calendar strip (Market Intelligence) */}
      {result.seasonal_calendar && result.seasonal_calendar.length > 0 && (
        <Card delay={220}>
          <SectionLabel icon={Calendar} color="text-blue-500">
            Seasonal Calendar
          </SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {result.seasonal_calendar.map((entry, i) => {
              const isPositive =
                entry.expected_impact?.includes("+") ||
                entry.expected_impact?.toLowerCase().includes("increase") ||
                entry.expected_impact?.toLowerCase().includes("boost");
              return (
                <div
                  key={i}
                  className="rounded-xl border border-[#e0e0e0] dark:border-[#2a2a2a] p-3"
                >
                  <p className="text-[13px] font-bold text-[#1a1a1a] dark:text-[#e8e8e8]">
                    {entry.period}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-[13px] font-semibold",
                      isPositive
                        ? "text-emerald-500 dark:text-emerald-400"
                        : "text-red-500 dark:text-red-400"
                    )}
                  >
                    {entry.expected_impact}
                  </p>
                  <p className="mt-2 text-[12px] text-[#444444] dark:text-[#aaaaaa]">
                    {entry.preparation_action}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-blue-500 dark:text-blue-400">
                    Prepare by: {entry.prepare_by}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Market signals (Market Intelligence) */}
      {result.local_market_signals && result.local_market_signals.length > 0 && (
        <Card delay={230}>
          <SectionLabel icon={TrendingUp} color="text-violet-500">
            Market Signals
          </SectionLabel>
          <div className="space-y-3">
            {result.local_market_signals.map((signal, i) => (
              <div
                key={i}
                className="rounded-xl bg-slate-50 dark:bg-slate-800/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8]">
                    {signal.signal}
                  </p>
                  <span className="flex-shrink-0 rounded-full bg-violet-100 dark:bg-violet-900/30 px-2.5 py-0.5 text-[11px] font-bold uppercase text-violet-600 dark:text-violet-400">
                    {signal.source_type?.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-blue-600 dark:text-blue-400">
                  {signal.uk_context}
                </p>
                <p className="mt-1 text-[13px] text-[#444444] dark:text-[#aaaaaa]">
                  {signal.business_implication}
                </p>
                <p className="mt-2 text-[13px] font-medium text-[#cc4400] dark:text-[#ff7744] flex items-center gap-1">
                  <ChevronRight className="h-3 w-3" />
                  {signal.recommended_action}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Competitor landscape (Market Intelligence) */}
      {result.competitor_landscape && result.competitor_landscape.pricing_context && (
        <Card delay={240}>
          <SectionLabel icon={Target} color="text-slate-500">
            Competitor Landscape
          </SectionLabel>
          {result.competitor_landscape.pricing_context && (
            <p className="text-[14px] text-[#1a1a1a] dark:text-[#e8e8e8] mb-3">
              {result.competitor_landscape.pricing_context}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.competitor_landscape.typical_uk_competitors?.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#444444] dark:text-[#aaaaaa] mb-2">
                  Typical Competitors
                </p>
                <ul className="space-y-1">
                  {result.competitor_landscape.typical_uk_competitors.map((c, i) => (
                    <li
                      key={i}
                      className="text-[13px] text-[#1a1a1a] dark:text-[#e8e8e8] flex items-center gap-1.5"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.competitor_landscape.differentiation_opportunities?.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-emerald-600 dark:text-emerald-400 mb-2">
                  Differentiation Opportunities
                </p>
                <ul className="space-y-1">
                  {result.competitor_landscape.differentiation_opportunities.map(
                    (d, i) => (
                      <li
                        key={i}
                        className="text-[13px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {d}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Demand forecast (Market Intelligence) */}
      {result.demand_forecast && result.demand_forecast.next_30_days && (
        <Card delay={245}>
          <SectionLabel icon={BarChart3} color="text-blue-500">
            Demand Forecast
          </SectionLabel>
          <p className="text-[15px] text-[#1a1a1a] dark:text-[#e8e8e8] mb-3">
            {result.demand_forecast.next_30_days}
          </p>
          {result.demand_forecast.key_dates_to_watch?.length > 0 && (
            <div className="mb-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#444444] dark:text-[#aaaaaa] mb-1.5">
                Key Dates
              </p>
              <div className="flex flex-wrap gap-2">
                {result.demand_forecast.key_dates_to_watch.map((d, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-blue-50 dark:bg-blue-950/30 px-3 py-1 text-[12px] font-medium text-blue-600 dark:text-blue-400"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
          {result.demand_forecast.demand_drivers?.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#444444] dark:text-[#aaaaaa] mb-1.5">
                Demand Drivers
              </p>
              <ul className="space-y-1">
                {result.demand_forecast.demand_drivers.map((d, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-1.5 text-[13px] text-[#1a1a1a] dark:text-[#e8e8e8]"
                  >
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Opportunities (Market Intelligence) */}
      {result.opportunities && result.opportunities.length > 0 && (
        <Card delay={250}>
          <SectionLabel icon={Rocket} color="text-emerald-500">
            Opportunities
          </SectionLabel>
          <div className="space-y-3">
            {result.opportunities.map((opp, i) => (
              <div
                key={i}
                className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8]">
                    {opp.opportunity}
                  </p>
                  <span
                    className={cn(
                      "flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase",
                      opp.effort === "low"
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                        : opp.effort === "medium"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    )}
                  >
                    {opp.effort} effort
                  </span>
                </div>
                <p className="mt-1 text-[14px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {opp.potential_revenue_impact}
                </p>
                <p className="mt-2 text-[13px] text-[#444444] dark:text-[#aaaaaa] leading-relaxed">
                  {opp.how_to_capture}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* UK Legal Context (HR Agent) */}
      {result.uk_legal_context && (
        <Card delay={150}>
          <SectionLabel icon={Shield} color="text-blue-500">
            UK Legal Context
          </SectionLabel>
          <p className="text-[14px] leading-relaxed text-[#1a1a1a] dark:text-[#e8e8e8]">
            {result.uk_legal_context}
          </p>
        </Card>
      )}

      {/* Recommended approach (HR Agent) */}
      {result.recommended_approach && (
        <Card delay={170}>
          <SectionLabel icon={CheckCircle2} color="text-emerald-500">
            Recommended Approach
          </SectionLabel>
          <div className="space-y-4">
            {(
              [
                { key: "immediate", label: "Do Today", color: "text-red-500" },
                {
                  key: "short_term",
                  label: "This Week / Month",
                  color: "text-amber-500",
                },
                { key: "ongoing", label: "Ongoing", color: "text-blue-500" },
              ] as const
            ).map(({ key, label, color }) => {
              const items =
                result.recommended_approach?.[key];
              if (!items || items.length === 0) return null;
              return (
                <div key={key}>
                  <p
                    className={cn(
                      "text-[12px] font-semibold uppercase tracking-[0.06em] mb-2",
                      color
                    )}
                  >
                    {label}
                  </p>
                  <ul className="space-y-1.5">
                    {items.map((item, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-[14px] text-[#1a1a1a] dark:text-[#e8e8e8]"
                      >
                        <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#cc4400] dark:text-[#ff7744] mt-0.5" />
                        {typeof item === "string" ? item : JSON.stringify(item)}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Staff communication template (HR Agent) */}
      {result.staff_communication_template && (
        <Card delay={190}>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel icon={MessageSquare} color="text-violet-500">
              Staff Communication Template
            </SectionLabel>
            <CopyButton
              text={result.staff_communication_template}
              onToast={onToast}
              label="Copy Template"
            />
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-[#e0e0e0] dark:border-[#2a2a2a] p-4">
            <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-[#1a1a1a] dark:text-[#e8e8e8]">
              {result.staff_communication_template}
            </pre>
          </div>
        </Card>
      )}

      {/* AI Adoption Tips (HR Agent) */}
      {result.ai_adoption_tips && result.ai_adoption_tips.length > 0 && (
        <Card delay={200}>
          <SectionLabel icon={Lightbulb} color="text-amber-500">
            AI Adoption Tips for Staff
          </SectionLabel>
          <div className="space-y-3">
            {result.ai_adoption_tips.map((tip, i) => (
              <div
                key={i}
                className="rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/30 dark:border-amber-900/20 p-4"
              >
                <p className="text-[13px] font-semibold text-red-500 dark:text-red-400">
                  Barrier: {tip.barrier}
                </p>
                <p className="mt-1 text-[14px] text-[#1a1a1a] dark:text-[#e8e8e8]">
                  {tip.response}
                </p>
                <p className="mt-2 text-[13px] italic text-[#444444] dark:text-[#aaaaaa] border-l-2 border-[#cc4400] dark:border-[#ff6b35] pl-3">
                  &ldquo;{tip.example_phrase}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Learning path (HR Agent / Adoption Agent) */}
      {result.learning_path && result.learning_path.length > 0 && (
        <Card delay={210}>
          <SectionLabel icon={BookOpen} color="text-blue-500">
            Learning Path
          </SectionLabel>
          <div className="space-y-2">
            {result.learning_path.map((step, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 px-4 py-3"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-[12px] font-bold text-blue-600 dark:text-blue-400">
                  {step.step}
                </span>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8]">
                    {step.title}
                  </p>
                  <p className="text-[13px] text-blue-600 dark:text-blue-400">
                    {step.resource}
                  </p>
                  <p className="text-[12px] text-[#444444] dark:text-[#aaaaaa]">
                    {step.time_to_complete}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Startup idea (legacy) */}
      {result.startup_idea && (
        <Card delay={150}>
          <SectionLabel icon={Rocket} color="text-brand-500">
            Startup Idea
          </SectionLabel>
          <h4 className="text-lg font-bold text-[#1a1a1a] dark:text-[#e8e8e8] mb-3">
            {result.startup_idea.name}
          </h4>
          <dl className="space-y-2">
            {[
              { label: "Problem", value: result.startup_idea.problem },
              { label: "Solution", value: result.startup_idea.solution },
              { label: "Customer", value: result.startup_idea.target_customer },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#444444] dark:text-[#aaaaaa]">
                  {label}
                </dt>
                <dd className="text-[15px] text-[#1a1a1a] dark:text-[#e8e8e8] mt-0.5">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {/* Landing page (legacy) */}
      {result.landing_page && (
        <Card delay={150}>
          <SectionLabel icon={Globe} color="text-blue-500">
            Landing Page
          </SectionLabel>
          <h4 className="text-lg font-bold text-[#1a1a1a] dark:text-[#e8e8e8]">
            {result.landing_page.headline}
          </h4>
          <p className="text-[15px] text-[#444444] dark:text-[#aaaaaa] mt-1">
            {result.landing_page.subheadline}
          </p>
          {result.landing_page.features?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {result.landing_page.features.map((f, i) => (
                <span
                  key={i}
                  className="rounded-full bg-blue-50 dark:bg-blue-950/30 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Adoption score */}
      {result.adoption_score != null && (
        <Card delay={200}>
          <SectionLabel icon={Gauge} color="text-emerald-500">
            Adoption Score
          </SectionLabel>
          <div className="flex items-end gap-2">
            <span
              className={cn(
                "text-4xl font-extrabold tabular-nums",
                result.adoption_score > 60 && "text-emerald-500",
                result.adoption_score > 30 &&
                  result.adoption_score <= 60 &&
                  "text-amber-500",
                result.adoption_score <= 30 && "text-red-500"
              )}
            >
              {result.adoption_score}
            </span>
            <span className="text-lg font-medium text-[#444444] dark:text-[#aaaaaa] mb-1">
              /100
            </span>
          </div>
          {result.score_label && (
            <p className="mt-1 text-[15px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8]">
              {result.score_label}
            </p>
          )}
          {result.uk_benchmark_comparison && (
            <p className="mt-1 text-[13px] text-[#444444] dark:text-[#aaaaaa]">
              {result.uk_benchmark_comparison}
            </p>
          )}
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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
          {/* Score breakdown */}
          {result.score_breakdown && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(
                [
                  { key: "usage_breadth", label: "Usage Breadth" },
                  { key: "use_case_quality", label: "Use Case Quality" },
                  { key: "workflow_integration", label: "Workflow Integration" },
                  { key: "team_capability", label: "Team Capability" },
                ] as const
              ).map(({ key, label }) => {
                const component = result.score_breakdown?.[key];
                if (!component) return null;
                return (
                  <div
                    key={key}
                    className="rounded-lg bg-slate-50 dark:bg-slate-800/30 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-semibold text-[#444444] dark:text-[#aaaaaa]">
                        {label}
                      </p>
                      <p className="text-[15px] font-bold text-[#1a1a1a] dark:text-[#e8e8e8]">
                        {component.score}/25
                      </p>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#cc4400] dark:bg-[#ff6b35] transition-all duration-700"
                        style={{ width: `${(component.score / 25) * 100}%` }}
                      />
                    </div>
                    {component.notes && (
                      <p className="mt-1 text-[11px] text-[#444444] dark:text-[#aaaaaa]">
                        {component.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {result.time_saved_weekly_hours != null &&
            result.time_saved_weekly_hours > 0 && (
              <p className="mt-3 flex items-center gap-1.5 text-[15px] text-[#444444] dark:text-[#aaaaaa]">
                <Clock className="h-3.5 w-3.5" />
                Estimated time saved:{" "}
                <strong className="text-[#1a1a1a] dark:text-[#e8e8e8]">
                  {result.time_saved_weekly_hours}h/week
                </strong>
              </p>
            )}
        </Card>
      )}

      {/* Automation roadmap (Adoption Agent) */}
      {result.automation_roadmap && result.automation_roadmap.length > 0 && (
        <Card delay={220}>
          <SectionLabel icon={Rocket} color="text-violet-500">
            Automation Roadmap
          </SectionLabel>
          <div className="space-y-3">
            {result.automation_roadmap.map((item, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 p-4"
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50 text-[14px] font-bold text-violet-600 dark:text-violet-400">
                  {item.priority}
                </span>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8]">
                    {item.workflow}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-bold uppercase",
                        item.effort === "low"
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                          : item.effort === "medium"
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      )}
                    >
                      {item.effort} effort
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-bold uppercase",
                        item.impact === "high"
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                          : item.impact === "medium"
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      )}
                    >
                      {item.impact} impact
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-[#444444] dark:text-[#aaaaaa]">
                    {item.tool_recommendation} · {item.implementation_time}
                  </p>
                  {item.roi_payback_weeks > 0 && (
                    <p className="mt-0.5 text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
                      ROI payback: {item.roi_payback_weeks} weeks
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Training recommendations (Adoption Agent) */}
      {result.training_recommendations &&
        result.training_recommendations.length > 0 && (
          <Card delay={230}>
            <SectionLabel icon={BookOpen} color="text-blue-500">
              Training Recommendations
            </SectionLabel>
            <div className="space-y-2">
              {result.training_recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 px-4 py-3"
                >
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8]">
                      {rec.topic}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-[12px]">
                      <span className="rounded-full bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 font-medium text-blue-600 dark:text-blue-400 capitalize">
                        {rec.audience?.replace(/_/g, " ")}
                      </span>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-medium text-[#444444] dark:text-[#aaaaaa]">
                        {rec.format}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-emerald-600 dark:text-emerald-400">
                      {rec.free_resource}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

      {/* Identified use cases (Adoption Agent) */}
      {result.identified_use_cases && result.identified_use_cases.length > 0 && (
        <Card delay={215}>
          <SectionLabel icon={Lightbulb} color="text-amber-500">
            Identified Use Cases
          </SectionLabel>
          <div className="space-y-3">
            {result.identified_use_cases.map((uc, i) => (
              <div
                key={i}
                className="rounded-xl bg-slate-50 dark:bg-slate-800/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8]">
                      {uc.name}
                    </p>
                    <p className="text-[12px] text-[#444444] dark:text-[#aaaaaa] capitalize">
                      {uc.department}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase",
                      uc.ai_readiness === "high"
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                        : uc.ai_readiness === "medium"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    )}
                  >
                    {uc.ai_readiness} readiness
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-[12px]">
                  <span className="text-[#444444] dark:text-[#aaaaaa]">
                    Status:{" "}
                    <span className="font-semibold text-[#1a1a1a] dark:text-[#e8e8e8] capitalize">
                      {uc.current_state?.replace(/_/g, " ")}
                    </span>
                  </span>
                  {uc.potential_hours_saved_weekly > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {uc.potential_hours_saved_weekly}h/week potential
                    </span>
                  )}
                </div>
                {uc.recommended_tool && (
                  <p className="mt-1 text-[13px] text-[#cc4400] dark:text-[#ff7744] font-medium">
                    {uc.recommended_tool}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Next actions */}
      {result.next_actions && result.next_actions.length > 0 && (
        <Card delay={260}>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel icon={CheckCircle2} color="text-emerald-500">
              Next Actions
            </SectionLabel>
            <CopyButton
              text={result.next_actions.map((a, i) => `${i + 1}. ${typeof a === "string" ? a : (a as Record<string, unknown>).action ?? JSON.stringify(a)}`).join("\n")}
              onToast={onToast}
              label="Copy all"
            />
          </div>
          <ol className="space-y-2">
            {result.next_actions.map((action, i) => {
              const text =
                typeof action === "string"
                  ? action
                  : typeof action === "object" && action !== null
                  ? [
                      (action as Record<string, unknown>).action,
                      (action as Record<string, unknown>).who &&
                        `Who: ${(action as Record<string, unknown>).who}`,
                      (action as Record<string, unknown>).when &&
                        `When: ${(action as Record<string, unknown>).when}`,
                      (action as Record<string, unknown>).time_required &&
                        `Time: ${(action as Record<string, unknown>).time_required}`,
                    ]
                      .filter(Boolean)
                      .join(" — ")
                  : String(action);
              return (
                <li
                  key={i}
                  className="flex gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 px-4 py-3 text-[15px] text-[#1a1a1a] dark:text-[#e8e8e8]"
                >
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/50 text-[12px] font-bold text-[#cc4400] dark:text-[#ff7744]">
                    {i + 1}
                  </span>
                  {text}
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      {/* Risks & Assumptions */}
      {(result.risks?.length || result.assumptions?.length) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {result.risks && result.risks.length > 0 && (
            <Card delay={300} className="border-red-200/50 dark:border-red-900/30">
              <SectionLabel icon={AlertTriangle} color="text-red-500">
                Risks
              </SectionLabel>
              <ul className="space-y-2">
                {result.risks.map((risk, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-sm text-red-600 dark:text-red-400"
                  >
                    <span className="text-red-400 dark:text-red-600 mt-0.5">
                      &bull;
                    </span>
                    {typeof risk === "string" ? risk : JSON.stringify(risk)}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {result.assumptions && result.assumptions.length > 0 && (
            <Card
              delay={350}
              className="border-amber-200/50 dark:border-amber-900/30"
            >
              <SectionLabel icon={Lightbulb} color="text-amber-500">
                Assumptions
              </SectionLabel>
              <ul className="space-y-2">
                {result.assumptions.map((assumption, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-sm text-amber-600 dark:text-amber-400"
                  >
                    <span className="text-amber-400 dark:text-amber-600 mt-0.5">
                      &bull;
                    </span>
                    {typeof assumption === "string" ? assumption : JSON.stringify(assumption)}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      ) : null}

      {/* Escalation warning (HR Agent) */}
      {result.escalate_to_human && result.escalation_reason && (
        <Card delay={350} className="border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
          <SectionLabel icon={AlertTriangle} color="text-red-500">
            Professional Advice Recommended
          </SectionLabel>
          <p className="text-[14px] text-red-600 dark:text-red-400">
            {result.escalation_reason}
          </p>
        </Card>
      )}

      {/* Deploy links */}
      {(result.deployed_url || result.stripe_product_url) && (
        <Card
          delay={400}
          className="border-brand-200/50 dark:border-brand-900/30 bg-gradient-to-br from-brand-50/50 to-white dark:from-brand-950/20 dark:to-slate-900"
        >
          <SectionLabel icon={Rocket} color="text-brand-500">
            Deployed
          </SectionLabel>
          <div className="space-y-3">
            {result.deployed_url && (
              <a
                href={result.deployed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-brand-600 dark:text-brand-400 hover:border-brand-300 dark:hover:border-brand-700 transition-colors group"
              >
                <Globe className="h-4 w-4" />
                <span className="flex-1 truncate">
                  {result.deployed_url.startsWith("https://lovable.dev")
                    ? "Open Lovable to build this app"
                    : result.deployed_url}
                </span>
                <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )}
            {result.stripe_product_url && (
              <a
                href={result.stripe_product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-violet-600 dark:text-violet-400 hover:border-violet-300 dark:hover:border-violet-700 transition-colors group"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="flex-1 truncate">Stripe Payment Link</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Reviewer flags — small footer */}
      {result.reviewer_flags && result.reviewer_flags.length > 0 && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-[12px] font-semibold text-amber-700 dark:text-amber-300">
              {result.reviewer_flags.length} reviewer note{result.reviewer_flags.length !== 1 ? "s" : ""}
            </p>
          </div>
          <ul className="mt-1.5 space-y-0.5">
            {result.reviewer_flags.map((flag, i) => (
              <li
                key={i}
                className="text-[12px] text-amber-800 dark:text-amber-200 leading-relaxed"
              >
                {typeof flag === "string" ? flag : JSON.stringify(flag)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

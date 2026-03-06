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

function SectionLabel({ icon: Icon, children, color }: {
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

export function ResultsPanel({ result, onToast }: ResultsPanelProps) {
  const [copied, setCopied] = useState(false);

  const copyNextActions = async () => {
    if (!result.next_actions) return;
    const text = result.next_actions.map((a, i) => `${i + 1}. ${a}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    onToast("Actions copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Main answer */}
      {result.answer && (
        <Card>
          <SectionLabel icon={Lightbulb} color="text-brand-500">
            AI Recommendation
          </SectionLabel>
          <p className="text-[15px] leading-relaxed text-[#1a1a1a] dark:text-[#e8e8e8] whitespace-pre-wrap">
            {result.answer}
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
              { label: "Agent", value: result.selected_agent ? formatAgent(result.selected_agent) : undefined },
              { label: "Role", value: result.detected_role },
              { label: "Confidence", value: result.confidence != null ? formatConfidence(result.confidence) : undefined },
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
                  <span className="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#e8e8e8]">
                    {item.value}
                  </span>
                </div>
              ))}
            {result.fallback_used && (
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5">
                <span className="text-[12px] font-semibold text-amber-600 dark:text-amber-400">Fallback</span>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">FLock</span>
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
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-brand-50 dark:bg-brand-950/50 px-3 py-1.5 text-[15px] font-semibold text-[#cc4400] dark:text-[#ff7744] capitalize">
              {result.detected_business_type.replace(/_/g, " ")}
            </span>
            {result.detected_role && (
              <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-[15px] font-medium text-[#1a1a1a] dark:text-[#e8e8e8] capitalize">
                {result.detected_role}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Startup idea */}
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

      {/* Landing page */}
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
                result.adoption_score > 30 && result.adoption_score <= 60 && "text-amber-500",
                result.adoption_score <= 30 && "text-red-500"
              )}
            >
              {result.adoption_score}
            </span>
            <span className="text-lg font-medium text-[#444444] dark:text-[#aaaaaa] mb-1">
              /100
            </span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-out",
                result.adoption_score > 60 && "bg-gradient-to-r from-emerald-400 to-emerald-500",
                result.adoption_score > 30 && result.adoption_score <= 60 && "bg-gradient-to-r from-amber-400 to-amber-500",
                result.adoption_score <= 30 && "bg-gradient-to-r from-red-400 to-red-500"
              )}
              style={{ width: `${result.adoption_score}%` }}
            />
          </div>
          {result.time_saved_weekly_hours != null && (
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

      {/* Next actions */}
      {result.next_actions && result.next_actions.length > 0 && (
        <Card delay={250}>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel icon={CheckCircle2} color="text-emerald-500">
              Next Actions
            </SectionLabel>
            <button
              type="button"
              onClick={copyNextActions}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium text-[#444444] dark:text-[#aaaaaa] hover:text-[#1a1a1a] dark:hover:text-[#e8e8e8] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {copied ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy all"}
            </button>
          </div>
          <ol className="space-y-2">
            {result.next_actions.map((action, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 px-4 py-3 text-[15px] text-[#1a1a1a] dark:text-[#e8e8e8]"
              >
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/50 text-[12px] font-bold text-[#cc4400] dark:text-[#ff7744]">
                  {i + 1}
                </span>
                {action}
              </li>
            ))}
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
                    <span className="text-red-400 dark:text-red-600 mt-0.5">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {result.assumptions && result.assumptions.length > 0 && (
            <Card delay={350} className="border-amber-200/50 dark:border-amber-900/30">
              <SectionLabel icon={Lightbulb} color="text-amber-500">
                Assumptions
              </SectionLabel>
              <ul className="space-y-2">
                {result.assumptions.map((assumption, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-sm text-amber-600 dark:text-amber-400"
                  >
                    <span className="text-amber-400 dark:text-amber-600 mt-0.5">•</span>
                    {assumption}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      ) : null}

      {/* Deploy links */}
      {(result.deployed_url || result.stripe_product_url) && (
        <Card delay={400} className="border-brand-200/50 dark:border-brand-900/30 bg-gradient-to-br from-brand-50/50 to-white dark:from-brand-950/20 dark:to-slate-900">
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
    </div>
  );
}

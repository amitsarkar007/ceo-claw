"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineStage } from "@/lib/types";

const STAGES = [
  { id: "orchestrator" as const, label: "Orchestrator" },
  { id: "specialist" as const, label: "Specialist" },
  { id: "reviewer" as const, label: "Reviewer" },
] as const;

interface PipelineIndicatorProps {
  loading: boolean;
  completed: boolean;
}

export function PipelineIndicator({ loading, completed }: PipelineIndicatorProps) {
  const [stage, setStage] = useState<PipelineStage>("idle");

  useEffect(() => {
    if (!loading && !completed) {
      setStage("idle");
      return;
    }
    if (completed) {
      setStage("complete");
      return;
    }
    setStage("orchestrator");
    const t1 = setTimeout(() => setStage("specialist"), 800);
    const t2 = setTimeout(() => setStage("reviewer"), 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading, completed]);

  if (stage === "idle") return null;

  const stageOrder: PipelineStage[] = ["orchestrator", "specialist", "reviewer", "complete"];

  function getStatus(stageId: PipelineStage) {
    const currentIdx = stageOrder.indexOf(stage);
    const thisIdx = stageOrder.indexOf(stageId);
    if (thisIdx < currentIdx) return "completed";
    if (thisIdx === currentIdx && stage !== "complete") return "active";
    if (stage === "complete") return "completed";
    return "pending";
  }

  return (
    <div className="flex items-center justify-center gap-1 py-4 animate-fade-in">
      {STAGES.map((s, i) => {
        const status = getStatus(s.id);
        return (
          <div key={s.id} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-6 sm:w-10 transition-colors duration-500",
                  status !== "pending" ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"
                )}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full transition-all duration-500",
                  status === "completed" && "bg-emerald-500 text-white",
                  status === "active" && "bg-[#cc4400] dark:bg-[#ff6b35] text-white dark:text-black",
                  status === "pending" && "bg-slate-200 dark:bg-slate-700 text-[#444444] dark:text-[#aaaaaa]"
                )}
              >
                {status === "completed" ? (
                  <Check className="h-3 w-3" />
                ) : status === "active" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="text-[12px] font-bold">{i + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-[12px] font-medium transition-colors duration-300 hidden sm:block",
                  status === "completed" && "text-emerald-600 dark:text-emerald-400",
                  status === "active" && "text-[#cc4400] dark:text-[#ff7744]",
                  status === "pending" && "text-[#444444] dark:text-[#aaaaaa]"
                )}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

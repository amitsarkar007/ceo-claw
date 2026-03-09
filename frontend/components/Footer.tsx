import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#e8e8e8] dark:border-[#222222] flex-shrink-0 bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-[#666666] dark:text-[#888888]">
            <Zap className="h-4 w-4 text-[#cc4400] dark:text-[#ff7744]" />
            <span className="text-[13px] font-medium text-[#1a1a1a] dark:text-[#f0f0f0]">Highstreet AI</span>
            <span className="hidden sm:inline text-[#999999] dark:text-[#555555]">·</span>
            <span className="hidden sm:inline text-[12px] text-[#888888] dark:text-[#666666]">
              Unlocking the power of AI for every business
            </span>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-[#888888] dark:text-[#666666]">
            <span>UK AI Agent Hack EP4</span>
            <span>© 2026 Highstreet AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

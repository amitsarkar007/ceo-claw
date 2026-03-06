import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#e0e0e0] dark:border-slate-800/60 mt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[15px]">
            <Zap className="h-4 w-4 text-[#cc4400] dark:text-[#ff7744]" />
            <span className="font-semibold text-[#cc4400] dark:text-[#ff7744]">
              Highstreet AI
            </span>
            <span className="hidden sm:inline text-[#555555] dark:text-[#666666]">·</span>
            <span className="hidden sm:inline text-[#555555] dark:text-[#666666]">
              Unlocking the power of AI for every business
            </span>
          </div>
          <div className="flex items-center gap-4 text-[13px] font-medium text-[#555555] dark:text-[#666666]">
            <span>Powered by Z.AI GLM-4-Plus</span>
            <span>·</span>
            <span>UK AI Agent Hack EP4</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

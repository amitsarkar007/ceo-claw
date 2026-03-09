import Link from "next/link";
import { ArrowLeft, ExternalLink, Zap } from "lucide-react";

export default function ProductPage({ params }: { params: { id: string } }) {
  return (
    <main className="flex-1 overflow-y-auto bg-white dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
              Product
            </h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-mono">
              {params.id}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
            <span className="text-3xl">🚧</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
            Coming Soon
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 max-w-md mx-auto">
            Product details, Lovable build preview, and Stripe integration for{" "}
            <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-xs font-mono">
              {params.id}
            </code>{" "}
            will appear here once deployed.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Go to workspace
          </Link>
        </div>
      </div>
    </main>
  );
}

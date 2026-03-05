// frontend/app/page.tsx
// Modern, accessible, light theme. Responsive and WCAG-friendly.

"use client";
import { useState, useEffect } from "react";

const EXAMPLE_QUERIES = [
  "I want to build a SaaS for HR teams struggling with AI adoption",
  "Our company uses ChatGPT and Copilot but nobody tracks ROI",
  "I need to onboard 50 new employees to our AI tools this quarter"
];

interface AgentResult {
  answer?: string;
  startup_idea?: { name: string; problem: string; solution: string; target_customer: string };
  landing_page?: { headline: string; subheadline: string; features: string[]; cta: string };
  adoption_score?: number;
  time_saved_weekly_hours?: number;
  detected_role?: string;
  selected_agent?: string;
  intent?: string;
  pipeline_trace?: string[];
  confidence?: number;
  deployed_url?: string;
  stripe_product_url?: string;
  next_actions?: string[];
  risks?: string[];
  assumptions?: string[];
}

const LOADING_STEPS = ["ORCHESTRATOR", "SPECIALIST", "REVIEWER"] as const;
const STEP_INTERVAL_MS = 2200;

export default function Home() {
  const [query, setQuery] = useState("");
  const [deploy, setDeploy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    const id = setInterval(() => {
      setLoadingStep((s) => (s < 2 ? s + 1 : s));
    }, STEP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loading]);

  const handleSubmit = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, context: {}, deploy })
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="page-main"
      role="main"
      aria-label="CEOClaw - AI founder agent"
    >
      <div className="page-container">
        {/* Header */}
        <header className="page-header">
          <h1 className="page-title">CEOClaw</h1>
          <p className="page-subtitle">
            Autonomous AI founder agent · Powered by Z.AI GLM
          </p>
        </header>

        {/* Pipeline indicator */}
        <section aria-live="polite" aria-label="Pipeline status">
          {loading ? (
            <div className="pipeline-steps pipeline-loading">
              {LOADING_STEPS.map((step, i) => {
                if (loadingStep < i) return null;
                return (
                  <span key={step} className="pipeline-step">
                    {i > 0 && <span className="pipeline-arrow" aria-hidden>→</span>}
                    <span className="pipeline-step-name">{step}</span>
                    {loadingStep === i && (
                      <span
                        className="pipeline-cursor"
                        aria-hidden
                      />
                    )}
                  </span>
                );
              })}
              <span className="pipeline-arrow pipeline-arrow-muted" aria-hidden>→</span>
              <span className="pipeline-step-muted">OUTPUT</span>
            </div>
          ) : (
            <div className="pipeline-steps pipeline-idle">
              {["ORCHESTRATOR", "→", "SPECIALIST", "→", "REVIEWER", "→", "OUTPUT"].map((step, i) => {
                const trace = result?.pipeline_trace ?? [];
                const hasOrchestrator = trace.includes("orchestrator");
                const hasSpecialist = trace.some((t) => ["ceo_agent", "adoption_agent", "hr_agent"].includes(t));
                const hasReviewer = trace.includes("reviewer");
                const hasOutput = hasReviewer && result != null;
                const stepHighlights: Record<string, boolean> = {
                  ORCHESTRATOR: hasOrchestrator,
                  SPECIALIST: hasSpecialist,
                  REVIEWER: hasReviewer,
                  OUTPUT: hasOutput,
                };
                const isActive = step !== "→" && stepHighlights[step];
                return (
                  <span
                    key={i}
                    className={`pipeline-step-name ${isActive ? "pipeline-step-active" : "pipeline-step-inactive"}`}
                  >
                    {step}
                  </span>
                );
              })}
            </div>
          )}
        </section>

        {/* Input section */}
        <section className="input-section" aria-label="Your input">
          <h2 className="section-label section-label-input">Input</h2>
          <label htmlFor="query-input" className="sr-only">
            Describe your startup idea, AI adoption challenge, or HR question
          </label>
          <textarea
            id="query-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe your startup idea, AI adoption challenge, or HR question..."
            className="query-textarea"
            onKeyDown={(e) => e.key === "Enter" && e.metaKey && handleSubmit()}
            aria-describedby="example-queries"
            disabled={loading}
          />
          <div id="example-queries" className="example-queries" role="group" aria-label="Example queries">
            {EXAMPLE_QUERIES.map((eq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQuery(eq)}
                className="example-query-btn"
                disabled={loading}
              >
                {eq.substring(0, 40)}…
              </button>
            ))}
          </div>
          <div className="controls">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !query.trim()}
            className="submit-btn"
            aria-busy={loading}
          >
            {loading ? "Running pipeline…" : "Run agents ⌘↵"}
          </button>
          <label className="deploy-label">
            <input
              type="checkbox"
              checked={deploy}
              onChange={(e) => setDeploy(e.target.checked)}
              className="deploy-checkbox"
              disabled={loading}
              aria-describedby="deploy-desc"
            />
            <span id="deploy-desc">Deploy + create Stripe link</span>
          </label>
          </div>
        </section>

        {/* Output section */}
        <section className="output-section" aria-label="Agent output">
          <h2 className="section-label section-label-output">Output</h2>

        {!loading && !error && !result && (
          <p className="output-placeholder">Results will appear here after you run the agents.</p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="card card-loading" role="status" aria-live="polite">
            <div className="loading-indicator">
              <span className="loading-dot" aria-hidden />
              Agents are thinking…
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="card card-error"
            role="alert"
            aria-live="assertive"
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="results" role="region" aria-label="Results">
            {/* Trace */}
            <div className="card">
              <h2 className="card-heading">Pipeline trace</h2>
              <div className="trace-grid">
                {[
                  { label: "Role", value: result.detected_role },
                  { label: "Intent", value: result.intent },
                  { label: "Agent", value: result.selected_agent },
                  { label: "Confidence", value: result.confidence ? `${Math.round(result.confidence * 100)}%` : null }
                ].map(({ label, value }) =>
                  value ? (
                    <div key={label} className="trace-item">
                      <span className="trace-label">{label}:</span>
                      <span className="trace-value">{value}</span>
                    </div>
                  ) : null
                )}
              </div>
            </div>

            {/* Startup idea */}
            {result.startup_idea && (
              <div className="card">
                <h2 className="card-heading">Startup idea</h2>
                <h3 className="idea-name">{result.startup_idea.name}</h3>
                <dl className="idea-details">
                  <div>
                    <dt>Problem</dt>
                    <dd>{result.startup_idea.problem}</dd>
                  </div>
                  <div>
                    <dt>Solution</dt>
                    <dd>{result.startup_idea.solution}</dd>
                  </div>
                  <div>
                    <dt>Customer</dt>
                    <dd>{result.startup_idea.target_customer}</dd>
                  </div>
                </dl>
              </div>
            )}

            {/* Landing page */}
            {result.landing_page && (
              <div className="card">
                <h2 className="card-heading">Landing page</h2>
                <h3 className="landing-headline">{result.landing_page.headline}</h3>
                <p className="landing-subheadline">{result.landing_page.subheadline}</p>
                <ul className="feature-list" role="list">
                  {result.landing_page.features?.map((f, i) => (
                    <li key={i} className="feature-tag">{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Adoption score */}
            {result.adoption_score !== undefined && result.adoption_score !== null && (
              <div className="card">
                <h2 className="card-heading">Adoption score</h2>
                <div className="score-display">
                  <span
                    className={`score-value score-${result.adoption_score > 60 ? "high" : result.adoption_score > 30 ? "medium" : "low"}`}
                  >
                    {result.adoption_score}
                  </span>
                  <span className="score-max">/100</span>
                </div>
                {result.time_saved_weekly_hours && (
                  <p className="score-detail">
                    Estimated time saved: <strong>{result.time_saved_weekly_hours}h/week</strong>
                  </p>
                )}
              </div>
            )}

            {/* Deploy links */}
            {(result.deployed_url || result.stripe_product_url) && (
              <div className="card card-deploy">
                <h2 className="card-heading">Deployed</h2>
                {result.deployed_url && (
                  <div className="deploy-link-row">
                    <span className="deploy-label-text">Build on Lovable:</span>
                    <a
                      href={result.deployed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="deploy-link"
                    >
                      {result.deployed_url.startsWith("https://lovable.dev")
                        ? "Open Lovable to build this app →"
                        : result.deployed_url}
                    </a>
                  </div>
                )}
                {result.stripe_product_url && (
                  <div className="deploy-link-row">
                    <span className="deploy-label-text">Buy now:</span>
                    <a
                      href={result.stripe_product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="deploy-link"
                    >
                      {result.stripe_product_url}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Next actions */}
            {result.next_actions && result.next_actions.length > 0 && (
              <div className="card">
                <h2 className="card-heading">Next actions</h2>
                <ul className="next-actions-list" role="list">
                  {result.next_actions.map((a, i) => (
                    <li key={i} className="next-action-item">{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risks & assumptions */}
            {(result.risks?.length || result.assumptions?.length) ? (
              <div className="risks-grid">
                {result.risks && result.risks.length > 0 && (
                  <div className="card card-risks">
                    <h2 className="card-heading">Risks</h2>
                    <ul className="risks-list" role="list">
                      {result.risks.map((r, i) => (
                        <li key={i}>⚠ {r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.assumptions && result.assumptions.length > 0 && (
                  <div className="card card-assumptions">
                    <h2 className="card-heading">Assumptions</h2>
                    <ul className="assumptions-list" role="list">
                      {result.assumptions.map((a, i) => (
                        <li key={i}>~ {a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
        </section>
      </div>

      <style jsx>{`
        .page-main {
          min-height: 100vh;
          padding: clamp(24px, 5vw, 48px) clamp(16px, 4vw, 32px);
        }
        .page-container {
          max-width: 720px;
          margin: 0 auto;
        }
        .page-header {
          margin-bottom: 2rem;
        }
        .page-title {
          font-size: clamp(2rem, 5vw, 2.75rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--color-accent);
          margin: 0;
          line-height: 1.2;
        }
        .page-subtitle {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          margin-top: 0.5rem;
          letter-spacing: 0.02em;
        }
        .pipeline-steps {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          font-size: 0.75rem;
          letter-spacing: 0.06em;
          font-family: var(--font-mono);
          flex-wrap: wrap;
          align-items: center;
        }
        .pipeline-loading .pipeline-step-name { color: var(--color-accent); }
        .pipeline-arrow { color: var(--color-text-muted); margin-right: 0.25rem; }
        .pipeline-arrow-muted { margin-left: 0.25rem; }
        .pipeline-step-muted { color: var(--color-text-muted); opacity: 0.7; }
        .pipeline-step { display: flex; gap: 0.25rem; align-items: center; }
        .pipeline-cursor {
          display: inline-block;
          width: 6px;
          height: 12px;
          background: var(--color-accent);
          margin-left: 2px;
          animation: cursor-blink 0.8s step-end infinite;
        }
        .pipeline-idle .pipeline-step-name { color: var(--color-text-muted); }
        .pipeline-step-active { color: var(--color-accent) !important; }
        .input-section {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-left: 4px solid var(--color-info);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          box-shadow: var(--shadow-sm);
        }
        .output-section {
          border-left: 4px solid var(--color-accent);
          padding-left: 1rem;
          margin-left: 0.25rem;
        }
        .output-placeholder {
          color: var(--color-text-muted);
          font-size: 0.9375rem;
          font-style: italic;
          margin: 0 0 1rem;
        }
        .section-label {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin: 0 0 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .section-label::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .section-label-input { color: var(--color-info); }
        .section-label-input::before { background: var(--color-info); }
        .section-label-output { color: var(--color-accent); }
        .section-label-output::before { background: var(--color-accent); }
        .query-textarea {
          width: 100%;
          min-height: 120px;
          padding: 1rem;
          font-size: 1rem;
          line-height: 1.5;
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text);
          resize: vertical;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .query-textarea::placeholder { color: var(--color-text-muted); }
        .query-textarea:disabled { opacity: 0.7; cursor: not-allowed; }
        .example-queries {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.25rem;
        }
        .example-query-btn {
          background: var(--color-bg-muted);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 0.5rem 0.75rem;
          color: var(--color-text-secondary);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .example-query-btn:hover:not(:disabled) {
          background: var(--color-border);
          color: var(--color-text);
        }
        .example-query-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .controls {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .submit-btn {
          background: var(--color-accent);
          color: white;
          border: none;
          border-radius: var(--radius-sm);
          padding: 0.75rem 1.5rem;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
        .submit-btn:hover:not(:disabled) {
          background: var(--color-accent-hover);
        }
        .submit-btn:active:not(:disabled) { transform: scale(0.98); }
        .submit-btn:disabled {
          background: var(--color-text-muted);
          cursor: not-allowed;
          opacity: 0.8;
        }
        .deploy-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          cursor: pointer;
        }
        .deploy-checkbox {
          width: 1rem;
          height: 1rem;
          accent-color: var(--color-accent);
        }
        .deploy-checkbox:disabled { cursor: not-allowed; opacity: 0.6; }
        .card {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          margin-bottom: 1rem;
          box-shadow: var(--shadow-sm);
        }
        .card-loading {
          min-height: 100px;
          display: flex;
          align-items: center;
        }
        .loading-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-text-muted);
          font-size: 0.8125rem;
        }
        .loading-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-accent);
          animation: cursor-blink 0.8s step-end infinite;
        }
        .card-error {
          border-color: var(--color-error);
          background: var(--color-error-bg);
          color: var(--color-error);
        }
        .card-heading {
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0 0 0.75rem;
        }
        .trace-grid {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .trace-item { font-size: 0.875rem; }
        .trace-label { color: var(--color-text-muted); }
        .trace-value { color: var(--color-accent); font-weight: 500; }
        .idea-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-accent);
          margin: 0 0 0.5rem;
        }
        .idea-details {
          margin: 0;
          font-size: 0.9375rem;
        }
        .idea-details dt {
          font-weight: 600;
          color: var(--color-text-muted);
          font-size: 0.8125rem;
          margin-top: 0.5rem;
        }
        .idea-details dd { margin: 0.25rem 0 0; color: var(--color-text-secondary); }
        .landing-headline {
          font-size: 1.125rem;
          font-weight: 700;
          margin: 0 0 0.375rem;
        }
        .landing-subheadline {
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
          margin: 0 0 0.75rem;
        }
        .feature-list {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .feature-tag {
          background: var(--color-accent-muted);
          color: var(--color-accent-text);
          border-radius: var(--radius-sm);
          padding: 0.25rem 0.625rem;
          font-size: 0.8125rem;
          font-weight: 500;
        }
        .score-display {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .score-value { margin-right: 0.25rem; }
        .score-high { color: var(--color-success); }
        .score-medium { color: var(--color-warning); }
        .score-low { color: var(--color-error); }
        .score-max { font-size: 1.25rem; color: var(--color-text-muted); }
        .score-detail { font-size: 0.9375rem; color: var(--color-text-secondary); margin: 0.5rem 0 0; }
        .card-deploy {
          border-color: var(--color-accent);
          background: var(--color-accent-muted);
        }
        .card-deploy .card-heading { color: var(--color-accent-text); }
        .deploy-link-row { margin-bottom: 0.5rem; }
        .deploy-link-row:last-child { margin-bottom: 0; }
        .deploy-label-text {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          display: block;
          margin-bottom: 0.25rem;
        }
        .deploy-link {
          color: var(--color-link);
          font-size: 0.9375rem;
          word-break: break-all;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .deploy-link:hover { color: var(--color-link-hover); }
        .next-actions-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .next-action-item {
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
          margin-bottom: 0.5rem;
          padding-left: 1rem;
          border-left: 3px solid var(--color-accent);
        }
        .next-action-item:last-child { margin-bottom: 0; }
        .risks-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 600px) {
          .risks-grid { grid-template-columns: 1fr; }
        }
        .card-risks .card-heading { color: var(--color-error); }
        .card-risks li { color: var(--color-error); font-size: 0.875rem; margin-bottom: 0.25rem; }
        .card-assumptions .card-heading { color: var(--color-warning); }
        .card-assumptions li { color: var(--color-warning); font-size: 0.875rem; margin-bottom: 0.25rem; }
        .risks-list, .assumptions-list { list-style: none; margin: 0; padding: 0; }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </main>
  );
}

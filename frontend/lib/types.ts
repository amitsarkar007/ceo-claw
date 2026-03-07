export interface KeyMetric {
  metric_name: string;
  current_estimate: string;
  uk_benchmark: string;
  gap: string;
  financial_impact: string;
}

export interface ActionPlanWeek {
  week: number;
  actions: string[];
  owner: string;
  time_required: string;
  expected_outcome: string;
}

export interface QuickWin {
  action: string;
  effort: string;
  impact: string;
  how_to: string;
}

export interface ToolRecommendation {
  tool: string;
  purpose: string;
  cost: string;
  uk_available: boolean;
}

export interface MarketSignal {
  signal: string;
  source_type: string;
  uk_context: string;
  business_implication: string;
  recommended_action: string;
}

export interface SeasonalEntry {
  period: string;
  expected_impact: string;
  preparation_action: string;
  prepare_by: string;
}

export interface Opportunity {
  opportunity: string;
  effort: string;
  potential_revenue_impact: string;
  how_to_capture: string;
}

export interface AIAdoptionTip {
  barrier: string;
  response: string;
  example_phrase: string;
}

export interface LearningStep {
  step: number;
  title: string;
  resource: string;
  time_to_complete: string;
}

export interface IdentifiedUseCase {
  name: string;
  department: string;
  current_state: string;
  ai_readiness: string;
  potential_hours_saved_weekly: number;
  recommended_tool: string;
}

export interface AutomationRoadmapItem {
  priority: number;
  workflow: string;
  effort: string;
  impact: string;
  tool_recommendation: string;
  implementation_time: string;
  roi_payback_weeks: number;
}

export interface TrainingRecommendation {
  topic: string;
  audience: string;
  format: string;
  free_resource: string;
}

export interface AgentResult {
  // Core
  summary?: string;
  answer?: string;
  query_id?: string;
  assumptions?: string[];
  risks?: string[];
  next_actions?: string[];
  confidence?: number;
  confidence_reason?: string;

  // Orchestrator / trace
  detected_business_type?: string;
  detected_sector_context?: string;
  urgency?: string;
  detected_role?: string;
  selected_agent?: string;
  intent?: string;
  pipeline_trace?: string[];
  fallback_used?: boolean;

  // Reviewer
  reviewer_flags?: string[];

  // Operations Agent
  sector?: string;
  key_metrics?: KeyMetric[];
  action_plan?: ActionPlanWeek[];
  quick_wins?: QuickWin[];
  tools_to_use?: ToolRecommendation[];
  time_saved_weekly_hours?: number;
  financial_impact_monthly_gbp?: { low: number; high: number };

  // HR Agent
  category?: string;
  uk_legal_context?: string;
  recommended_approach?: {
    immediate: string[];
    short_term: string[];
    ongoing: string[];
  };
  staff_communication_template?: string;
  ai_adoption_tips?: AIAdoptionTip[];
  learning_path?: LearningStep[];
  escalate_to_human?: boolean;
  escalation_reason?: string;

  // Adoption Agent
  adoption_score?: number;
  score_label?: string;
  score_breakdown?: {
    usage_breadth: { score: number; notes: string };
    use_case_quality: { score: number; notes: string };
    workflow_integration: { score: number; notes: string };
    team_capability: { score: number; notes: string };
  };
  uk_benchmark_comparison?: string;
  identified_use_cases?: IdentifiedUseCase[];
  financial_value_monthly_gbp?: { low: number; high: number };
  automation_roadmap?: AutomationRoadmapItem[];
  training_recommendations?: TrainingRecommendation[];

  // Market Intelligence
  local_market_signals?: MarketSignal[];
  seasonal_calendar?: SeasonalEntry[];
  competitor_landscape?: {
    typical_uk_competitors: string[];
    differentiation_opportunities: string[];
    pricing_context: string;
  };
  demand_forecast?: {
    next_30_days: string;
    key_dates_to_watch: string[];
    demand_drivers: string[];
  };
  opportunities?: Opportunity[];

  // Legacy
  startup_idea?: {
    name: string;
    problem: string;
    solution: string;
    target_customer: string;
  };
  landing_page?: {
    headline: string;
    subheadline: string;
    features: string[];
    cta: string;
  };
  deployed_url?: string;
  stripe_product_url?: string;
}

export interface PipelineEvent {
  type: string;
  agent?: string;
  status?: "started" | "complete";
  message?: string;
  timestamp: number;
}

export interface HistoryEntry {
  id: string;
  query: string;
  result: AgentResult;
  timestamp: number;
  status?: "pending" | "complete";
  pipelineEvents?: PipelineEvent[];
  conversationId?: string | null;
}

export type PipelineStage = "idle" | "orchestrator" | "specialist" | "reviewer" | "complete";

export interface AgentInfo {
  name: string;
  description: string;
  tag: string;
  icon: string;
}

// ── Conversation / multi-turn types ─────────────────────────────────────

export interface ClarifyingQuestion {
  id: string;
  question: string;
  why_needed: string;
  answer_type: "text" | "number" | "choice";
  choices?: string[];
}

export interface ConversationResponse {
  conversation_id: string;
  status: "clarifying" | "complete" | "guardrail_triggered";
  clarifying_questions?: ClarifyingQuestion[] | null;
  result?: AgentResult | null;
  guardrail_message?: string | null;
  guardrail_type?: string | null;
}

export type ConversationStatus =
  | "idle"
  | "clarifying"
  | "processing"
  | "complete"
  | "guardrail";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  type?: "query" | "clarification" | "answer" | "guardrail";
}

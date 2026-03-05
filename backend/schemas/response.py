from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AgentResponse(BaseModel):
    # Core output
    answer: str
    assumptions: List[str]
    risks: List[str]
    next_actions: List[str]
    confidence: float  # 0.0 - 1.0

    # Trace metadata
    query_id: str
    detected_role: str        # "founder" | "hr_manager" | "ops_lead" | "ceo"
    intent: str               # "generate_idea" | "check_adoption" | "deploy_product" etc.
    selected_agent: str
    pipeline_trace: List[str] # ["orchestrator", "ceo_agent", "reviewer"]
    timestamp: str

    # Optional enrichments
    deployed_url: Optional[str] = None       # If Lovable deployed something
    stripe_product_url: Optional[str] = None # If product was created
    adoption_score: Optional[float] = None   # 0-100 if adoption agent ran

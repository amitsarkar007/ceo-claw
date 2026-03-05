AGENT_REGISTRY = {
    "orchestrator": {
        "name": "Orchestrator",
        "description": "Detects user role and intent, routes to specialist agent",
        "routing_tags": ["all"],
        "model": "glm-4-plus"
    },
    "ceo_agent": {
        "name": "CEO Agent",
        "description": "Generates startup ideas, builds landing pages, creates marketing plans",
        "routing_tags": ["idea", "startup", "landing_page", "marketing", "growth", "deploy"],
        "model": "glm-4-plus",
        "capabilities": [
            "generate_startup_idea",
            "create_landing_page_outline",
            "suggest_marketing_steps",
            "propose_growth_plan",
            "deploy_via_lovable",
            "create_stripe_product"
        ]
    },
    "adoption_agent": {
        "name": "Adoption Optimizer",
        "description": "Classifies AI use cases, scores adoption, estimates time saved",
        "routing_tags": ["adoption", "productivity", "ai_usage", "automation", "training"],
        "model": "glm-4-plus",
        "capabilities": [
            "classify_ai_use_case",
            "estimate_time_saved",
            "score_adoption",
            "suggest_automation_workflows",
            "generate_training_tips"
        ]
    },
    "hr_agent": {
        "name": "HR & Wellbeing Agent",
        "description": "Handles onboarding, HR queries, wellbeing check-ins, learning suggestions",
        "routing_tags": ["hr", "onboarding", "wellbeing", "training", "people"],
        "model": "glm-4-plus",
        "capabilities": [
            "onboarding_guidance",
            "hr_knowledge_support",
            "wellbeing_checkin",
            "learning_suggestions"
        ]
    },
    "reviewer": {
        "name": "Reviewer Agent",
        "description": "Reviews specialist output, improves clarity, adds next steps, flags risks",
        "routing_tags": ["all"],
        "model": "glm-4-plus"
    }
}

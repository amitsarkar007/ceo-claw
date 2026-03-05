import json
import os
from datetime import datetime
from pathlib import Path

LOG_DIR = Path(os.getenv("LOG_DIR", "./logs"))
LOG_DIR.mkdir(exist_ok=True)

def log_run(query: str, result: dict):
    """
    Append each pipeline run to a daily JSON log file.
    """
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "query": query,
        "query_id": result.get("query_id"),
        "detected_role": result.get("detected_role"),
        "selected_agent": result.get("selected_agent"),
        "intent": result.get("intent"),
        "pipeline_trace": result.get("pipeline_trace"),
        "confidence": result.get("confidence"),
        "adoption_score": result.get("adoption_score"),
        "deployed_url": result.get("deployed_url"),
        "stripe_product_url": result.get("stripe_product_url")
    }
    
    log_file = LOG_DIR / f"{datetime.utcnow().strftime('%Y-%m-%d')}.json"
    
    existing = []
    if log_file.exists():
        with open(log_file) as f:
            try:
                existing = json.load(f)
            except:
                existing = []
    
    existing.append(log_entry)
    
    with open(log_file, "w") as f:
        json.dump(existing, f, indent=2)

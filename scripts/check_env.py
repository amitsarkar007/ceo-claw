#!/usr/bin/env python3
"""
Check that the running environment has all required env vars from .env.example.
Prints warnings for missing optional keys, errors for missing required ones.
"""

import os
import sys
from pathlib import Path

# Required keys (app will fail without these)
REQUIRED = {"ZAI_API_KEY"}

# Optional keys (documented in .env.example)
OPTIONAL = {
    "ZAI_BASE_URL",
    "ZAI_MODEL",
    "FLOCK_API_KEY",
    "FLOCK_BASE_URL",
    "FLOCK_MODEL",
    "ANYWAY_API_KEY",
    "ANYWAY_PROJECT_ID",
    "ANYWAY_BASE_URL",
    "ANYWAY_ENABLED",
    "STRIPE_SECRET_KEY",
    "STRIPE_CONNECT_ACCOUNT_ID",
    "PORT",
    "FRONTEND_URL",
    "LOG_DIR",
    "CORS_ORIGINS",
    "CONVERSATIONS_DB_PATH",
    "RATE_LIMIT_REQUESTS",
    "RATE_LIMIT_WINDOW_MINUTES",
    "NEXT_PUBLIC_API_URL",
}


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    try:
        from dotenv import load_dotenv
        load_dotenv(root / ".env")
    except ImportError:
        pass
    env_example = root / ".env.example"
    if not env_example.exists():
        print("No .env.example found", file=sys.stderr)
        return 1

    missing_required = [k for k in REQUIRED if not os.getenv(k)]
    missing_optional = [k for k in OPTIONAL if not os.getenv(k)]

    if missing_required:
        print("ERROR: Missing required environment variables:", file=sys.stderr)
        for k in missing_required:
            print(f"  - {k}", file=sys.stderr)
        return 1

    if missing_optional:
        print("WARNING: Missing optional environment variables (using defaults):")
        for k in missing_optional:
            print(f"  - {k}")

    print("OK: All required environment variables are set.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

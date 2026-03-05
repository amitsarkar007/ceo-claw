"""
Lovable integration using Build with URL API.
https://docs.lovable.dev/integrations/lovable-api
https://docs.lovable.dev/integrations/build-with-url

Build with URL creates shareable links that open Lovable and auto-build apps from a prompt.
No API key required — the URL itself carries the prompt.
"""

import urllib.parse
from datetime import datetime

LOVABLE_BUILD_BASE = "https://lovable.dev/?autosubmit=true#"
MOCK_DEPLOY_BASE = "https://demo.ceoclaw.dev"


def _build_prompt(landing_page: dict, startup_idea: dict) -> str:
    """Build a clear prompt for Lovable from landing page and startup idea."""
    name = startup_idea.get("name", "AI Product")
    headline = landing_page.get("headline", "")
    subheadline = landing_page.get("subheadline", "")
    features = landing_page.get("features", [])
    cta = landing_page.get("cta", "Get Started")
    pricing = landing_page.get("pricing_tier", "Free trial available")

    features_text = ", ".join(features) if features else "modern features"
    prompt = (
        f"Create a clean, modern SaaS landing page for {name}. "
        f"Headline: {headline}. "
        f"Subheadline: {subheadline}. "
        f"Features: {features_text}. "
        f"Call-to-action button: {cta}. "
        f"Pricing: {pricing}. "
        "Make it professional, conversion-focused, with a clear hero section."
    )
    return prompt.strip()


def _mock_deployed_url(landing_page: dict, startup_idea: dict) -> str:
    """Return a mock deployed URL for demo when Build with URL is not used."""
    slug = (startup_idea.get("name") or "product").lower().replace(" ", "-")[:30]
    ts = datetime.utcnow().strftime("%Y%m%d%H%M")
    return f"{MOCK_DEPLOY_BASE}/{slug}-{ts}"


async def deploy_to_lovable(landing_page: dict, startup_idea: dict) -> str:
    """
    Generate a Lovable Build with URL link.

    Per https://docs.lovable.dev/integrations/build-with-url:
    - Base: https://lovable.dev/?autosubmit=true#
    - Param: prompt=URL_ENCODED_PROMPT (required)
    - Param: images=URL (optional, max 10)

    When the user clicks the returned URL, they are taken to Lovable and
    the app is built automatically from the prompt. No API key needed.
    """
    if not landing_page:
        return _mock_deployed_url(landing_page or {}, startup_idea or {})

    prompt = _build_prompt(landing_page, startup_idea or {})
    if len(prompt) > 50000:
        prompt = prompt[:49997] + "..."

    encoded_prompt = urllib.parse.quote(prompt, safe="")
    build_url = f"{LOVABLE_BUILD_BASE}prompt={encoded_prompt}"

    return build_url

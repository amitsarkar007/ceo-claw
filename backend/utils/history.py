"""Shared helper for formatting conversation history for agent prompts."""

from __future__ import annotations
from typing import List, Dict


def format_history_block(conversation_history: List[Dict[str, str]]) -> str:
    """
    Format conversation messages into a block that agents can prepend to queries.
    Only includes the last 6 exchanges to stay within context limits.
    """
    if not conversation_history:
        return ""

    recent = conversation_history[-12:]  # last 6 exchanges (user+assistant pairs)
    lines = []
    for m in recent:
        role = m.get("role", "user").capitalize()
        content = m.get("content", "")
        # Truncate very long assistant responses to a summary
        if role == "Assistant" and len(content) > 500:
            content = content[:500] + "…"
        lines.append(f"{role}: {content}")

    return (
        "\n--- Conversation History ---\n"
        + "\n".join(lines)
        + "\n---\n"
    )


def build_history_aware_query(
    query: str,
    conversation_history: List[Dict[str, str]],
    context: dict | None = None,
) -> str:
    """
    Build a query string that includes conversation history and context
    so that agents can respond in continuity.
    """
    parts = []

    history_block = format_history_block(conversation_history)
    if history_block:
        parts.append(history_block)

    parts.append(f"Current query: {query}")

    if context:
        import json
        parts.append(f"\nBusiness context: {json.dumps(context)}")

    return "\n".join(parts)

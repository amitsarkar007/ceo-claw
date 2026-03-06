"""Robust JSON extraction from LLM responses that may include markdown, prose, or malformed JSON."""

import json
import re
from typing import Optional


def extract_json(raw: str) -> Optional[dict]:
    """
    Extract and parse JSON from LLM output. Handles:
    - Markdown code blocks (```json ... ```)
    - Prose before/after the JSON
    - Trailing commas
    - Common formatting issues
    """
    if not raw or not isinstance(raw, str):
        return None

    text = raw.strip()
    # Strip markdown code blocks
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```\s*$", "", text)
    text = text.strip()

    # Try to extract the first complete JSON object
    start = text.find("{")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escape = False
    quote_char = None
    end = -1

    for i, c in enumerate(text[start:], start):
        if escape:
            escape = False
            continue
        if c == "\\" and in_string:
            escape = True
            continue
        if in_string:
            if c == quote_char:
                in_string = False
            continue
        if c in '"\'':
            in_string = True
            quote_char = c
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                end = i
                break

    if end == -1:
        return None

    json_str = text[start : end + 1]

    # Fix trailing commas (invalid in strict JSON) - repeat for nested structures
    while True:
        new_str = re.sub(r",\s*}", "}", json_str)
        new_str = re.sub(r",\s*]", "]", new_str)
        if new_str == json_str:
            break
        json_str = new_str

    # Fix single-quoted keys/strings (replace ' with " for JSON keys)
    # Be careful: only do this if it looks like single-quoted JSON
    if "'" in json_str and '"' not in json_str:
        # Likely single-quoted - simple replace is risky for values with apostrophes
        pass  # Skip - too error prone

    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        pass

    # Last resort: try parsing after more aggressive cleanup
    json_str = re.sub(r"[\x00-\x1f]", " ", json_str)  # Remove control chars
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        return None

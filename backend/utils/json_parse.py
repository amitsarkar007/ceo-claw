"""
Robust JSON extraction from LLM responses.

LLMs frequently return malformed JSON wrapped in markdown code fences (```json ... ```),
with trailing commas, truncated output, or prose before/after. This module handles
those cases and provides a last-resort ast.literal_eval fallback for Python-syntax
dicts when json.loads fails.
"""

import ast
import json
import logging
import re
from typing import Optional


def _find_json_boundary(text: str, start: int) -> int:
    """Find the position of the closing brace that matches the opening brace at `start`."""
    depth = 0
    in_string = False
    escape = False

    for i, c in enumerate(text[start:], start):
        if escape:
            escape = False
            continue
        if c == "\\" and in_string:
            escape = True
            continue
        if in_string:
            if c == '"':
                in_string = False
            continue
        if c == '"':
            in_string = True
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return i

    return -1


def _try_parse(json_str: str) -> Optional[dict]:
    """Attempt to parse a JSON string with progressive cleanup."""
    # Fix trailing commas
    cleaned = json_str
    while True:
        new_str = re.sub(r",\s*}", "}", cleaned)
        new_str = re.sub(r",\s*]", "]", new_str)
        if new_str == cleaned:
            break
        cleaned = new_str

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Remove control characters (except \n \r \t which we'll handle)
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", " ", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    return None


def _try_repair_truncated(text: str) -> Optional[dict]:
    """Attempt to repair truncated JSON by closing open structures."""
    start = text.find("{")
    if start == -1:
        return None

    candidate = text[start:]

    in_string = False
    escape = False
    open_braces = 0
    open_brackets = 0
    last_good_pos = -1

    for i, c in enumerate(candidate):
        if escape:
            escape = False
            continue
        if c == "\\" and in_string:
            escape = True
            continue
        if in_string:
            if c == '"':
                in_string = False
            continue
        if c == '"':
            in_string = True
            continue
        if c == "{":
            open_braces += 1
        elif c == "}":
            open_braces -= 1
            if open_braces == 0 and open_brackets == 0:
                last_good_pos = i
                break
        elif c == "[":
            open_brackets += 1
        elif c == "]":
            open_brackets -= 1

    if last_good_pos > 0:
        return _try_parse(candidate[: last_good_pos + 1])

    # JSON is truncated — try to close it
    if in_string:
        candidate += '"'
        in_string = False

    # Close any open arrays then braces
    candidate += "]" * open_brackets
    candidate += "}" * open_braces

    # Try to trim back to last complete key-value pair
    trimmed = candidate
    for _ in range(5):
        result = _try_parse(trimmed)
        if result is not None:
            return result
        # Remove the last incomplete value/key and try again
        last_comma = trimmed.rfind(",")
        if last_comma == -1:
            break
        trimmed = trimmed[:last_comma]
        # Re-close structures
        ob = trimmed.count("{") - trimmed.count("}")
        oq = trimmed.count("[") - trimmed.count("]")
        if ob > 0 or oq > 0:
            trimmed += "]" * max(0, oq) + "}" * max(0, ob)

    return _try_parse(candidate)


_log = logging.getLogger(__name__)


def extract_json(raw: str) -> Optional[dict]:
    """
    Extract and parse JSON from LLM output. Handles:
    - Markdown code blocks (```json ... ```)
    - Prose before/after the JSON
    - Trailing commas
    - Truncated JSON (best-effort repair)
    - ast.literal_eval fallback for Python-syntax dicts when JSON fails
    """
    if not raw or not isinstance(raw, str):
        return None

    text = raw.strip()

    # Strip markdown code blocks (may appear anywhere, not just start/end)
    text = re.sub(r"```(?:json)?\s*\n?", "", text)
    text = text.strip()

    # Quick check: try parsing the whole thing directly
    if text.startswith("{"):
        result = _try_parse(text)
        if result is not None:
            return result

    # Find the first { and try brace-matching
    start = text.find("{")
    if start == -1:
        return None

    end = _find_json_boundary(text, start)
    json_str = text[start : end + 1] if end != -1 else text[start:]

    if end != -1:
        result = _try_parse(json_str)
        if result is not None:
            return result

    # Brace matching failed or parse failed — try truncation repair
    result = _try_repair_truncated(text)
    if result is not None:
        return result

    # Last resort: ast.literal_eval for Python-syntax dicts (e.g. single quotes, True/False)
    for candidate in (json_str, text):
        try:
            parsed = ast.literal_eval(candidate)
            if isinstance(parsed, dict):
                _log.warning(
                    "JSON parse failed; used ast.literal_eval fallback. "
                    "Consider fixing LLM output format."
                )
                return parsed
        except (ValueError, SyntaxError):
            pass

    return None

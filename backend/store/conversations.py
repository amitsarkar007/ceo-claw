"""SQLite-backed conversation store. Persists conversations across restarts."""

from __future__ import annotations

import json
import sqlite3
import uuid
from pathlib import Path
from typing import Dict, List, Optional

from schemas.conversation import ConversationState, Message


def _get_db_path() -> str:
    from config import settings
    path = Path(settings.CONVERSATIONS_DB_PATH)
    path.parent.mkdir(parents=True, exist_ok=True)
    return str(path)


def _init_db(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS conversations (
            conversation_id TEXT PRIMARY KEY,
            messages TEXT NOT NULL DEFAULT '[]',
            context TEXT NOT NULL DEFAULT '{}',
            status TEXT NOT NULL DEFAULT 'awaiting_input',
            turn_count INTEGER NOT NULL DEFAULT 0,
            detected_sector TEXT,
            detected_role TEXT,
            pipeline_events TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
    """)


def _row_to_conv(row: tuple) -> ConversationState:
    conv_id, messages_json, context_json, status, turn_count, sector, role, events_json = row[:8]
    messages = [Message(**m) for m in json.loads(messages_json)]
    context = json.loads(context_json)
    pipeline_events = json.loads(events_json) if events_json else []
    return ConversationState(
        conversation_id=conv_id,
        messages=messages,
        context=context,
        status=status,
        turn_count=turn_count,
        detected_sector=sector,
        detected_role=role,
        pipeline_events=pipeline_events,
    )


def _conv_to_row(conv: ConversationState, created_at: str, updated_at: str) -> tuple:
    messages_json = json.dumps([m.model_dump() for m in conv.messages])
    context_json = json.dumps(conv.context)
    events_json = json.dumps(conv.pipeline_events or [])
    return (
        conv.conversation_id,
        messages_json,
        context_json,
        conv.status,
        conv.turn_count,
        conv.detected_sector,
        conv.detected_role,
        events_json,
        created_at,
        updated_at,
    )


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(_get_db_path())
    conn.row_factory = sqlite3.Row
    _init_db(conn)
    return conn


def _load_all() -> Dict[str, ConversationState]:
    """Load all conversations from DB into memory for fast reads."""
    result: Dict[str, ConversationState] = {}
    conn = _get_conn()
    try:
        cur = conn.execute(
            "SELECT conversation_id, messages, context, status, turn_count, "
            "detected_sector, detected_role, pipeline_events "
            "FROM conversations"
        )
        for row in cur.fetchall():
            r = tuple(row)
            conv = _row_to_conv(r)
            result[conv.conversation_id] = conv
    finally:
        conn.close()
    return result


# In-memory cache; persisted to SQLite on every write
_store: Dict[str, ConversationState] = {}
_loaded = False


def _ensure_loaded() -> None:
    global _store, _loaded
    if not _loaded:
        _store = _load_all()
        _loaded = True


def create_conversation() -> ConversationState:
    _ensure_loaded()
    conv = ConversationState(conversation_id=str(uuid.uuid4()))
    _store[conv.conversation_id] = conv
    from datetime import datetime
    now = datetime.utcnow().isoformat()
    conn = _get_conn()
    try:
        conn.execute(
            """INSERT INTO conversations
               (conversation_id, messages, context, status, turn_count,
                detected_sector, detected_role, pipeline_events, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            _conv_to_row(conv, now, now),
        )
        conn.commit()
    finally:
        conn.close()
    return conv


def get_conversation(conversation_id: str) -> Optional[ConversationState]:
    _ensure_loaded()
    return _store.get(conversation_id)


def update_conversation(conv: ConversationState) -> ConversationState:
    _ensure_loaded()
    _store[conv.conversation_id] = conv
    from datetime import datetime
    now = datetime.utcnow().isoformat()
    conn = _get_conn()
    try:
        conn.execute(
            """UPDATE conversations SET
               messages = ?, context = ?, status = ?, turn_count = ?,
               detected_sector = ?, detected_role = ?, pipeline_events = ?,
               updated_at = ?
               WHERE conversation_id = ?""",
            (
                json.dumps([m.model_dump() for m in conv.messages]),
                json.dumps(conv.context),
                conv.status,
                conv.turn_count,
                conv.detected_sector,
                conv.detected_role,
                json.dumps(conv.pipeline_events or []),
                now,
                conv.conversation_id,
            ),
        )
        conn.commit()
    finally:
        conn.close()
    return conv


def clear_conversation(conversation_id: str) -> None:
    _ensure_loaded()
    _store.pop(conversation_id, None)
    conn = _get_conn()
    try:
        conn.execute("DELETE FROM conversations WHERE conversation_id = ?", (conversation_id,))
        conn.commit()
    finally:
        conn.close()


def count_conversations() -> int:
    _ensure_loaded()
    return len(_store)

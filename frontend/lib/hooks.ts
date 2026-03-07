"use client";

import { useState, useEffect, useCallback } from "react";
import type { HistoryEntry, AgentResult, PipelineEvent } from "./types";

const HISTORY_KEY = "highstreet-ai-history";
const MAX_HISTORY = 50;

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored));
    } catch {
      // ignore parse errors
    }
    setLoaded(true);
  }, [key]);

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof newValue === "function"
            ? (newValue as (prev: T) => T)(prev)
            : newValue;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // quota exceeded
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, setStoredValue, loaded] as const;
}

export function useQueryHistory() {
  const [history, setHistory, loaded] = useLocalStorage<HistoryEntry[]>(
    HISTORY_KEY,
    []
  );

  const addEntry = useCallback(
    (query: string, result: AgentResult, status: "pending" | "complete" = "complete"): string => {
      const id = crypto.randomUUID?.() ?? Date.now().toString(36);
      const entry: HistoryEntry = { id, query, result, timestamp: Date.now(), status };
      setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
      return id;
    },
    [setHistory]
  );

  const updateEntry = useCallback(
    (id: string, updates: Partial<Pick<HistoryEntry, "result" | "status" | "pipelineEvents" | "conversationId">>) => {
      setHistory((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      );
    },
    [setHistory]
  );

  const appendPipelineEvent = useCallback(
    (id: string, event: PipelineEvent) => {
      setHistory((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, pipelineEvents: [...(e.pipelineEvents || []), event] }
            : e
        )
      );
    },
    [setHistory]
  );

  const removeEntry = useCallback(
    (id: string) => {
      setHistory((prev) => prev.filter((e) => e.id !== id));
    },
    [setHistory]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  return { history, addEntry, updateEntry, appendPipelineEvent, removeEntry, clearHistory, loaded };
}

export function useToast() {
  const [toasts, setToasts] = useState<
    { id: string; message: string; type: "success" | "error" }[]
  >([]);

  const toast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      const id = Date.now().toString(36);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}

import type { AgentResult, ConversationResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status >= 500 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      const body = await res.text().catch(() => "");
      throw new ApiError(
        body || `Request failed with status ${res.status}`,
        res.status
      );
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw new ApiError(
        err instanceof Error ? err.message : "Network error",
        0
      );
    }
  }
  throw new ApiError("Max retries exceeded", 0);
}

export async function queryAgents(
  message: string,
  conversationId?: string | null,
  context: Record<string, unknown> = {},
): Promise<ConversationResponse> {
  const res = await fetchWithRetry(`${API_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      conversation_id: conversationId ?? null,
      context,
    }),
  });
  return res.json();
}

export async function getConversation(conversationId: string) {
  const res = await fetch(`${API_URL}/api/conversation/${conversationId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new ApiError(await res.text().catch(() => ""), res.status);
  return res.json();
}

export async function clearConversation(conversationId: string): Promise<void> {
  await fetchWithRetry(`${API_URL}/api/conversation/${conversationId}`, {
    method: "DELETE",
  });
}

export async function getAgents() {
  const res = await fetchWithRetry(`${API_URL}/api/agents`, {});
  return res.json();
}

export async function healthCheck(): Promise<{ status: string; agents: string[] }> {
  const res = await fetchWithRetry(`${API_URL}/api/health`, {}, 1);
  return res.json();
}

/** Timeout for streaming pipeline (2 min — pipeline can take ~60s for full run). */
const STREAM_TIMEOUT_MS = 120_000;

export async function queryAgentsStream(
  message: string,
  conversationId?: string | null,
  context: Record<string, unknown> = {},
  onEvent?: (event: Record<string, unknown>) => void,
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

  const res = await fetch(`${API_URL}/api/query/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      conversation_id: conversationId ?? null,
      context,
    }),
    signal: controller.signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(body || `Stream error ${res.status}`, res.status);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop()!;
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const ev = JSON.parse(line.slice(6));
            onEvent?.(ev);
            if (ev?.type === "result") clearTimeout(timeoutId);
          } catch { /* ignore malformed SSE */ }
        }
      }
    }
    clearTimeout(timeoutId);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(
        "Request timed out. The pipeline can take up to a minute — please try again.",
        0
      );
    }
    throw err;
  }
}

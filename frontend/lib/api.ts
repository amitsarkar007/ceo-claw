// Backend API client
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function queryApi(query: string, context: object = {}, deploy = false) {
  const res = await fetch(`${API_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, context, deploy }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getAgents() {
  const res = await fetch(`${API_URL}/api/agents`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

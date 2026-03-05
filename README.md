# CEOClaw

> Autonomous AI founder agent. Idea → Landing Page → Revenue. Powered by Z.AI GLM.

Built for UK AI Agent Hack EP4 x OpenClaw.

## Prizes Targeting

- CEO Claw Challenge (£1,000)
- Z.AI Bounty ($4,000 pool)
- Anyway Track (Mac Mini)
- FLock Track ($5,000 pool)

## Stack

- **LLM**: Z.AI GLM-5 (with FLock fallback)
- **Orchestration**: LangGraph multi-agent pipeline
- **Deploy**: Lovable Build with URL
- **Payments**: Stripe Connect
- **Tracing**: Anyway SDK (optional)
- **Backend**: FastAPI
- **Frontend**: Next.js 14

## Pipeline

```
User Query → Orchestrator → [CEO | Adoption | HR] Agent → Reviewer → Final Output
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- API keys for Z.AI (required) and optionally FLock, Stripe

### 1. Clone and setup environment

```bash
git clone https://github.com/amitsarkar007/ceo-claw.git
cd ceo-claw
cp .env.example .env
```

Edit `.env` and add your API keys (see [API Keys](#api-keys) below).

### 2. Start the backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at **http://localhost:8000**

### 3. Start the frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

### 4. Verify

- Health: http://localhost:8000/api/health
- API docs: http://localhost:8000/docs

---

## API Keys

| Key | Required | Where to get |
|-----|----------|--------------|
| `ZAI_API_KEY` | **Yes** | [z.ai/manage-apikey](https://z.ai/manage-apikey/apikey-list) |
| `ZAI_BASE_URL` | No | Default: `https://api.z.ai/api/paas/v4` |
| `ZAI_MODEL` | No | Default: `glm-5` |
| `FLOCK_API_KEY` | No | [platform.flock.io](https://platform.flock.io) — fallback when Z.AI fails |
| `FLOCK_BASE_URL` | No | Default: `https://platform.flock.io/api/v1` |
| `STRIPE_SECRET_KEY` | No | [dashboard.stripe.com](https://dashboard.stripe.com) — for payment links |
| `ANYWAY_API_KEY` | No | Hackathon sponsor — set `ANYWAY_ENABLED=false` to disable |
| `ANYWAY_PROJECT_ID` | No | For Anyway tracing |

**Lovable** does not require an API key — it uses [Build with URL](https://docs.lovable.dev/integrations/build-with-url).

---

## Running with Docker

```bash
docker-compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000

Create `.env` in the project root before running (copy from `.env.example`).

---

## Project Structure

```
ceo-claw/
├── backend/                 # FastAPI
│   ├── main.py              # Entry point, routes
│   ├── agents/              # Orchestrator, CEO, Adoption, HR, Reviewer
│   ├── pipeline/graph.py    # LangGraph workflow
│   ├── integrations/       # Z.AI, Lovable, Stripe, Anyway
│   ├── schemas/
│   ├── registry.py
│   └── logger.py
├── frontend/                # Next.js 14
│   ├── app/page.tsx         # Main UI
│   └── ...
├── logs/                    # JSON run logs (gitignored)
├── .env.example             # Template — copy to .env
└── docker-compose.yml
```

---

## Agent Registry

| Agent | Purpose |
|-------|---------|
| **Orchestrator** | Routes by role + intent |
| **CEO Agent** | Startup ideas, landing pages, Lovable deploy, Stripe links |
| **Adoption Optimizer** | AI usage scoring, time saved, automation gaps |
| **HR Agent** | Onboarding, policy, wellbeing, training |
| **Reviewer** | Output QA, clarity, risk flagging |

---

## Demo Script (5 min)

1. **Startup idea**: Enter *"I want to build a SaaS for HR teams struggling with AI adoption"*
2. Check **"DEPLOY + CREATE STRIPE LINK"**
3. Click **RUN AGENTS**
4. Show: startup idea → landing page → **Build on Lovable** link → Stripe link
5. **Adoption**: Enter *"Our company uses ChatGPT and Copilot but nobody tracks ROI"* → show adoption score
6. **HR**: Enter *"I need to onboard 50 new employees to our AI tools"* → show guidance

**Note**: Lovable and Stripe links only appear when the **CEO agent** runs (idea/startup queries). HR and Adoption queries return guidance, not deployable products.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `404 Not Found` for Z.AI | Ensure `ZAI_BASE_URL=https://api.z.ai/api/paas/v4` |
| `uvicorn` not found | Use `python -m uvicorn main:app --reload` |
| Anyway SSL errors | Add `ANYWAY_ENABLED=false` to `.env` |
| No Lovable URL | Use a startup/idea query (CEO agent), not HR/training |
| Hydration error | Ensure `globals.css` is imported in `layout.tsx` |

---

## Key Files

- `backend/pipeline/graph.py` — LangGraph workflow
- `backend/agents/` — All specialist agents
- `backend/integrations/zai.py` — Z.AI client
- `backend/integrations/lovable.py` — Lovable Build with URL
- `frontend/app/page.tsx` — Main UI

---

## License

MIT

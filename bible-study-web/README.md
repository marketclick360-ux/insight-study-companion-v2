# 💎 Bible Study Companion — Web App

A mobile-friendly chat UI for your existing **Managed Agents** Bible study agent.
Type a passage or question, and the agent's study notes stream back as formatted
Markdown (headers, bold, bullets, emoji).

Your Anthropic API key stays on the **server** and is never exposed to the
browser.

## Architecture

```
  Browser (public/index.html)
      │  POST /api/session   → start a session against the existing agent
      │  POST /api/chat (SSE) → send a message, stream the reply
      ▼
  Flask backend (api/index.py)   ← ANTHROPIC_API_KEY lives here
      │  client.beta.sessions.create / events.stream / events.send
      ▼
  Anthropic Managed Agents  →  agent_019X8z44NWaA3kPfZyXW1gA2
```

The agent already exists. The app only creates **sessions** against it — the
model, tools, and system prompt live on the agent, not the session. Each study
reuses one stateful session for follow-up questions; **New Study** starts a fresh
one.

## Run locally

```bash
cd bible-study-web
python3 -m venv .venv && source .venv/bin/activate   # recommended
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...        # your key
python api/index.py
```

Open <http://localhost:5001> and send "Study Jeremiah 8".

Locally, Flask serves both the UI and the API on one process, and you get true
progressive (token-by-token) streaming.

> **Why 5001?** On macOS, port 5000 is taken by the AirPlay Receiver service,
> which returns "access denied" before your app ever sees the request. The app
> defaults to **5001** to avoid it. Override with `PORT=8080 python api/index.py`
> if you want a different port.

## Deploy to Vercel

1. Push this repo to GitHub (the app lives in the `bible-study-web/` subfolder).
2. In Vercel, **Import** the repo and set **Root Directory** to `bible-study-web`.
3. Under **Settings → Environment Variables**, add `ANTHROPIC_API_KEY` (and,
   optionally, `AGENT_ID` / `ENVIRONMENT_ID` to override the defaults).
4. Deploy. Vercel serves `public/index.html` statically and runs `api/index.py`
   as a Python serverless function (routes under `/api/*`).

### ⚠️ Streaming caveat on Vercel

Vercel serverless functions can stream, but there are two real limits to know:

- **Duration cap.** `maxDuration` is set to **60s** in `vercel.json` (the Hobby
  ceiling). A study that takes longer than 60s to generate will be cut off.
  Vercel **Pro** allows up to 300s — raise `maxDuration` if you hit the limit.
- **Possible buffering.** The Python/WSGI runtime may buffer the response, so
  the reply can arrive in a few large chunks (or all at once when the turn
  finishes) rather than token-by-token. The UI handles this correctly either
  way — it accumulates whatever arrives and re-renders the Markdown.

For guaranteed token-by-token streaming with no duration cap, run it as a
long-lived process (locally, or any always-on host).

## Security note

`ANTHROPIC_API_KEY` is read from the server environment only. The browser talks
exclusively to `/api/*` on your own backend and never sees the key. Don't commit
your real `.env` (it's gitignored); use Vercel Environment Variables in
production.

## Files

| File | Purpose |
|------|---------|
| `api/index.py` | Flask backend — session + SSE chat endpoints |
| `public/index.html` | Single-page mobile UI (Markdown via `marked` + `DOMPurify`) |
| `requirements.txt` | Python deps (`flask`, `anthropic`) |
| `vercel.json` | Routing + function `maxDuration` |
| `.env.example` | Environment variable template |

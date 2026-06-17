"""Flask backend for the Bible study chat UI.

Talks to an existing Managed Agents agent. The agent already exists — we only
create *sessions* against it (model/tools/system live on the agent, never the
session). The Anthropic API key stays server-side and is never sent to the
browser.

Endpoints:
  GET  /              -> serves the single-page UI (local dev; Vercel serves
                        public/index.html statically in production)
  POST /api/session  -> creates a session, returns {"session_id": ...}
  POST /api/chat     -> Server-Sent Events stream of the agent's reply
"""

import json
import os

from anthropic import Anthropic
from flask import Flask, Response, jsonify, request, send_from_directory

# --- Configuration ---------------------------------------------------------
# Agent + environment are fixed (the agent already exists). They can be
# overridden via env vars, but default to the known IDs.
AGENT_ID = os.environ.get("AGENT_ID", "agent_019X8z44NWaA3kPfZyXW1gA2")
ENVIRONMENT_ID = os.environ.get("ENVIRONMENT_ID", "env_01TdQSn1EZctcYRjtVQag88b")

# public/ sits next to this file's parent (../public).
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")

# Reused across warm invocations. Reads ANTHROPIC_API_KEY from the environment.
client = Anthropic()

app = Flask(__name__)


def sse(obj):
    """Serialize a dict as one Server-Sent Events message."""
    return "data: " + json.dumps(obj) + "\n\n"


# --- Static (local dev convenience) ---------------------------------------
@app.route("/")
def index():
    return send_from_directory(PUBLIC_DIR, "index.html")


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(PUBLIC_DIR, path)


# --- API -------------------------------------------------------------------
@app.route("/api/session", methods=["POST"])
def create_session():
    """Start a fresh session against the existing agent."""
    try:
        session = client.beta.sessions.create(
            agent=AGENT_ID,
            environment_id=ENVIRONMENT_ID,
        )
        return jsonify({"session_id": session.id})
    except Exception as e:  # noqa: BLE001 - surface any SDK/auth error to the client
        return jsonify({"error": str(e)}), 500


@app.route("/api/chat", methods=["POST"])
def chat():
    """Send one user message and stream the agent's reply as SSE."""
    body = request.get_json(silent=True) or {}
    session_id = body.get("session_id")
    message = (body.get("message") or "").strip()

    if not session_id:
        return jsonify({"error": "session_id is required"}), 400
    if not message:
        return jsonify({"error": "message is required"}), 400

    def generate():
        try:
            # 1) STREAM FIRST — the stream only delivers events emitted after it
            #    opens, so it must be opened before we send the message.
            stream = client.beta.sessions.events.stream(session_id=session_id)

            # 2) THEN SEND the user message.
            client.beta.sessions.events.send(
                session_id=session_id,
                events=[
                    {
                        "type": "user.message",
                        "content": [{"type": "text", "text": message}],
                    }
                ],
            )

            # 3) CONSUME with the correct terminal gate. agent.message.content is
            #    a list of blocks — pull .text from the text blocks. Only break on
            #    a terminal stop_reason, not on every idle.
            for event in stream:
                if event.type == "agent.message":
                    for block in event.content:
                        if block.type == "text":
                            yield sse({"type": "delta", "text": block.text})
                elif event.type == "session.status_terminated":
                    break
                elif event.type == "session.status_idle":
                    if event.stop_reason.type == "requires_action":
                        # This chat-only UI doesn't implement tool confirmation,
                        # so we end the turn instead of looping forever. The
                        # Bible-study agent uses the auto-allow toolset, so this
                        # path is not expected in practice.
                        yield sse(
                            {
                                "type": "notice",
                                "text": "The agent is waiting on a tool action this app can't handle yet.",
                            }
                        )
                        break
                    break  # end_turn / retries_exhausted — terminal

            yield sse({"type": "done"})
        except Exception as e:  # noqa: BLE001
            yield sse({"type": "error", "message": str(e)})

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # discourage proxy buffering of the stream
            "Connection": "keep-alive",
        },
    )


if __name__ == "__main__":
    # Local dev: serves the UI and the API on one process. Threaded so the SSE
    # stream doesn't block other requests. Defaults to 5001 because macOS
    # AirPlay Receiver occupies 5000 and returns "access denied".
    port = int(os.environ.get("PORT", "5001"))
    app.run(host="0.0.0.0", port=port, threaded=True, debug=True)

import type { Env } from "../env";

/**
 * Durable Object that keeps a playback queue / position in sync across
 * a user's devices via WebSockets. Optional — the app works without it.
 *
 * Protocol (JSON over WS):
 *   client  → { type: "join" }
 *   client  → { type: "state", state: { queue, index, position, playing } }
 *   server  → { type: "state", state }
 */
interface PlaybackState {
  queue: { id: string; name: string }[];
  index: number;
  position: number;
  playing: boolean;
  updatedAt: number;
}

export class PlaybackSession {
  private state: PlaybackState = {
    queue: [], index: 0, position: 0, playing: false, updatedAt: 0,
  };
  private clients = new Set<WebSocket>();

  constructor(private readonly do_state: DurableObjectState, private readonly _env: Env) {
    void this.do_state.blockConcurrencyWhile(async () => {
      const stored = await this.do_state.storage.get<PlaybackState>("state");
      if (stored) this.state = stored;
    });
  }

  async fetch(req: Request): Promise<Response> {
    const upgrade = req.headers.get("upgrade");
    if (upgrade !== "websocket") {
      return new Response(JSON.stringify(this.state), {
        headers: { "content-type": "application/json" },
      });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.accept(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  private accept(ws: WebSocket) {
    ws.accept();
    this.clients.add(ws);
    ws.send(JSON.stringify({ type: "state", state: this.state }));
    ws.addEventListener("message", (evt) => {
      try {
        const msg = JSON.parse(evt.data as string) as { type: string; state?: Partial<PlaybackState> };
        if (msg.type === "state" && msg.state) {
          this.state = { ...this.state, ...msg.state, updatedAt: Date.now() } as PlaybackState;
          void this.do_state.storage.put("state", this.state);
          this.broadcast({ type: "state", state: this.state }, ws);
        }
      } catch { /* ignore malformed */ }
    });
    ws.addEventListener("close", () => this.clients.delete(ws));
    ws.addEventListener("error", () => this.clients.delete(ws));
  }

  private broadcast(payload: unknown, except?: WebSocket) {
    const data = JSON.stringify(payload);
    for (const c of this.clients) {
      if (c === except) continue;
      try { c.send(data); } catch { this.clients.delete(c); }
    }
  }
}

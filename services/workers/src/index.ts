import { Hono } from "hono";
import type { Env } from "./env";

import { cors } from "./middleware/cors";
import { logError } from "./analytics/d1";

import searchRoutes from "./routes/search";
import entityRoutes from "./routes/entities";
import homeRoutes   from "./routes/home";
import aiRoutes     from "./routes/ai";
import adminRoutes  from "./routes/admin";
import playbackRoutes from "./routes/playback";

export { PlaybackSession } from "./durable-objects/PlaybackSession";

const app = new Hono<{ Bindings: Env }>();
app.use("*", cors());

app.get("/", (c) =>
  c.json({
    name: "flexy-api",
    version: "1.0.0",
    docs: "https://github.com/your-org/flexy#api",
    endpoints: [
      "/health",
      "/home", "/trending",
      "/search?q=&type=&limit=",
      "/search/suggest?q=",
      "/song/:id", "/song/:id/related",
      "/album/:id", "/artist/:id", "/playlist/:id",
      "/lyrics/:id",
      "/ai/nl", "/ai/next-song", "/ai/smart-queue", "/ai/playlist",
      "/admin/*",
      "/session/:id  (WebSocket)",
    ],
  }),
);

app.get("/health", (c) => c.json({ ok: true, ts: Date.now() }));

app.route("/search",  searchRoutes);
app.route("/",        entityRoutes);   // /song /album /artist /playlist /lyrics
app.route("/",        homeRoutes);     // /home /trending
app.route("/ai",      aiRoutes);
app.route("/admin",   adminRoutes);
app.route("/session", playbackRoutes);

app.notFound((c) =>
  c.json({ error: true, code: "not_found", message: "Route not found", status: 404 }, 404),
);

app.onError((err, c) => {
  c.executionCtx.waitUntil(logError(c.env, c.req.path, err));
  return c.json(
    { error: true, code: "internal", message: err.message ?? "Unexpected error", status: 500 },
    500,
  );
});

export default app;

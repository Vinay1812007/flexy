import { Hono } from "hono";
import type { Env } from "../env";

/** Forwards /session/:id to the PlaybackSession Durable Object. */
const r = new Hono<{ Bindings: Env }>();

r.all("/:id", async (c) => {
  const id = c.req.param("id");
  const stub = c.env.PLAYBACK.get(c.env.PLAYBACK.idFromName(id));
  return stub.fetch(c.req.raw);
});

export default r;

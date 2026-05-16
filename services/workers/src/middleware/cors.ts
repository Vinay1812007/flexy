import type { MiddlewareHandler } from "hono";
import type { Env } from "../env";

/** CORS middleware with allowlist from env. */
export const cors = (): MiddlewareHandler<{ Bindings: Env }> => async (c, next) => {
  const allowed = (c.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const origin = c.req.header("origin") ?? "";
  const ok = allowed.includes("*") || allowed.includes(origin);

  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": ok ? origin : allowed[0] ?? "*",
        "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
        "access-control-allow-headers": "content-type,authorization",
        "access-control-max-age": "86400",
      },
    });
  }

  await next();
  if (ok) {
    c.res.headers.set("access-control-allow-origin", origin);
    c.res.headers.set("vary", "Origin");
  }
};

import type { MiddlewareHandler } from "hono";
import type { Env } from "../env";

/** Requires Bearer token equal to ADMIN_TOKEN. */
export const adminAuth = (): MiddlewareHandler<{ Bindings: Env }> => async (c, next) => {
  const expected = c.env.ADMIN_TOKEN;
  const header = c.req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!expected || !token || token !== expected) {
    return c.json({ error: true, code: "unauthorized", message: "Admin token required", status: 401 }, 401);
  }
  await next();
};

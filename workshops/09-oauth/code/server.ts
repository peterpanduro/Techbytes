// The app: "/" sends you to GitHub, "/callback" is where GitHub sends you back.
import { timingSafeEqual } from "node:crypto";
import * as oauth from "./oauth.ts";

// state (and from step 6 the PKCE verifier) waits in one cookie for ten minutes.
// HttpOnly: page scripts cannot read it. SameSite=Lax: it still arrives on the
// top-level redirect back from GitHub, where Strict would drop it. No Secure flag,
// because this is plain HTTP on 127.0.0.1; a real deployment on HTTPS adds it.
function cookie(value: string, maxAge = 600): string {
  return `oauth=${value}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; Path=/callback`;
}

function readCookie(req: Request): string[] {
  const m = req.headers.get("cookie")?.match(/(?:^|;\s*)oauth=([^;]+)/);
  return m ? m[1].split(".") : [];
}

// Constant time out of habit (workshop 3). state is not a password: what matters is the exact match.
function same(a: string | undefined, b: string | null): boolean {
  const x = new TextEncoder().encode(a ?? ""), y = new TextEncoder().encode(b ?? "");
  return x.length > 0 && x.length === y.length && timingSafeEqual(x, y);
}

function page(status: number, text: string): Response {
  const safe = text.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  return new Response(`<!doctype html><meta charset="utf-8"><title>OAuth lab</title><p>${safe}</p>\n`, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function start(): Promise<Response> {
  const state = oauth.newState();
  const verifier = oauth.newState();
  const location = oauth.authorizeUrl(state, await oauth.challengeFor(verifier));
  return new Response(null, { status: 302, headers: { location, "set-cookie": cookie(`${state}.${verifier}`) } });
}

async function callback(req: Request, url: URL): Promise<Response> {
  const [saved, verifier] = readCookie(req);
  if (!same(saved, url.searchParams.get("state"))) return page(400, "state does not match: login refused");
  const code = url.searchParams.get("code") ?? "";
  const token = await oauth.exchangeCode(code, verifier);
  const user = await oauth.fetchUser(token.access_token);
  return page(200, `Signed in as ${user.login}`);
}

/** "/" starts a login, "/callback" finishes it; every callback clears the cookie. */
export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  if (url.pathname === "/") return await start();
  if (url.pathname !== "/callback") return page(404, "not found");
  const res = await callback(req, url).catch((e: Error) => page(502, `login failed: ${e.message}`));
  res.headers.append("set-cookie", cookie("", 0)); // whatever happened, the browser drops this state
  return res;
}

if (import.meta.main) Deno.serve({ hostname: "127.0.0.1", port: 8000 }, handler);

// fakehub: a stand-in for github.com's two OAuth endpoints and api.github.com/user.
// One registered app, one user, and no login screen: it approves every request at once.
// Run it in its own terminal:  deno run --allow-net=127.0.0.1 fakehub.ts
const APP = {
  id: "fakehub-client",
  secret: "fakehub-secret-not-a-real-secret",
  callback: "http://127.0.0.1:8000/callback",
};
const USER = { login: "octocat", id: 1, name: "The Octocat" };

type Grant = { redirect: string; scope: string; challenge: string; expires: number };
const codes = new Map<string, Grant>();
const tokens = new Set<string>();
const random = () => crypto.getRandomValues(new Uint8Array(20)).toHex();
const json = (body: unknown, status = 200) => Response.json(body, { status });
const b64url = (bytes: Uint8Array) => bytes.toBase64({ alphabet: "base64url", omitPadding: true });

// GitHub's rule: the redirect_uri must match the registered callback exactly,
// except that a loopback address (127.0.0.1 or [::1]) may use any port.
function registered(uri: string): boolean {
  const want = new URL(APP.callback);
  const got = URL.parse(uri);
  if (!got) return false;
  if (got.hostname === "127.0.0.1" || got.hostname === "[::1]") got.port = want.port;
  return got.href === want.href;
}

function authorize(q: URLSearchParams): Response {
  if (q.get("client_id") !== APP.id) return json({ message: "Not Found" }, 404);
  const redirect = q.get("redirect_uri") ?? APP.callback;
  const challenge = q.get("code_challenge") ?? "";
  // A mismatch goes back to the registered callback, never to the URI that was asked for.
  const back = new URL(registered(redirect) ? redirect : APP.callback);
  if (!registered(redirect)) back.searchParams.set("error", "redirect_uri_mismatch");
  else if (challenge && q.get("code_challenge_method") !== "S256") back.searchParams.set("error", "invalid_request");
  else {
    const code = random();
    codes.set(code, { redirect, scope: q.get("scope") ?? "", challenge, expires: Date.now() + 600_000 });
    back.searchParams.set("code", code);
  }
  if (q.has("state")) back.searchParams.set("state", q.get("state")!);
  return new Response(null, { status: 302, headers: { location: back.href } });
}

async function verifierMatches(challenge: string, verifier: string | null): Promise<boolean> {
  if (!challenge) return true; // no PKCE at authorize time, nothing to check
  if (!verifier) return false;
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return b64url(new Uint8Array(hash)) === challenge;
}

async function accessToken(form: URLSearchParams): Promise<Response> {
  if (form.get("client_id") !== APP.id || form.get("client_secret") !== APP.secret) {
    return json({
      error: "incorrect_client_credentials",
      error_description: "The client_id and/or client_secret passed are incorrect.",
    });
  }
  const code = form.get("code") ?? "";
  const grant = codes.get(code);
  codes.delete(code); // a code works once, right or wrong
  if (!grant || grant.expires < Date.now() || !(await verifierMatches(grant.challenge, form.get("code_verifier")))) {
    return json({ error: "bad_verification_code", error_description: "The code passed is incorrect or expired." });
  }
  if ((form.get("redirect_uri") ?? grant.redirect) !== grant.redirect) {
    return json({
      error: "redirect_uri_mismatch",
      error_description: "The redirect_uri MUST match the registered callback URL for this application.",
    });
  }
  const token = "gho_fake_" + random();
  tokens.add(token);
  return json({
    access_token: token,
    token_type: "bearer",
    scope: grant.scope,
    expires_in: 28800,
    refresh_token: "ghr_fake_" + random(),
    refresh_token_expires_in: 15811200,
  });
}

function user(authorization: string | null): Response {
  const token = authorization?.replace(/^(Bearer|token) /, "") ?? "";
  return tokens.has(token) ? json(USER) : json({ message: "Bad credentials" }, 401);
}

/** Routes one request the way github.com and api.github.com would. */
export async function fakehub(req: Request): Promise<Response> {
  const { pathname, searchParams } = new URL(req.url);
  const route = `${req.method} ${pathname}`;
  if (route === "GET /login/oauth/authorize") return authorize(searchParams);
  if (route === "POST /login/oauth/access_token") return await accessToken(new URLSearchParams(await req.text()));
  if (route === "GET /user") return user(req.headers.get("authorization"));
  return json({ message: "Not Found" }, 404);
}

if (import.meta.main) {
  Deno.serve({ hostname: "127.0.0.1", port: 9000 }, (req) => {
    console.log("fakehub:", req.method, new URL(req.url).pathname);
    return fakehub(req);
  });
}

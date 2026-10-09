import { fakehub } from "./fakehub.ts";

function assertEquals(got: unknown, want: unknown, msg = "") {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) throw new Error(`${msg} got ${g}, want ${w}`);
}

async function assertRejects(fn: () => Promise<unknown>, want: string) {
  const msg = await fn().then(() => "no error", (e: Error) => e.message);
  if (!msg.startsWith(want)) throw new Error(`want an error starting "${want}", got "${msg}"`);
}

// A private fakehub on a free port, and the settings .env.example gives the app.
const hub = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen() {} }, fakehub);
hub.unref();
const HUB = `http://127.0.0.1:${hub.addr.port}`;
Deno.env.set("OAUTH_BASE", HUB);
Deno.env.set("API_BASE", HUB);
Deno.env.set("CLIENT_ID", "fakehub-client");
Deno.env.set("CLIENT_SECRET", "fakehub-secret-not-a-real-secret");
Deno.env.set("REDIRECT_URI", "http://127.0.0.1:8000/callback");

import { authorizeUrl, newState } from "./oauth.ts";

Deno.test("step 1: the authorize URL carries the app, the scope and a fresh state", () => {
  const state = newState();
  const url = new URL(authorizeUrl(state));
  assertEquals(url.origin + url.pathname, `${HUB}/login/oauth/authorize`);
  assertEquals(url.searchParams.get("client_id"), "fakehub-client");
  assertEquals(url.searchParams.get("redirect_uri"), "http://127.0.0.1:8000/callback");
  assertEquals(url.searchParams.get("scope"), "read:user");
  assertEquals(url.searchParams.get("state"), state);
  assertEquals(state.length, 43, "32 random bytes in base64url:");
  assertEquals(newState() === state, false, "a new state every time:");
});

import { handler } from "./server.ts";

const app = (path: string, cookie = "") =>
  handler(new Request(`http://127.0.0.1:8000${path}`, { headers: { cookie } }));

Deno.test("step 2: / redirects to GitHub and keeps state in a cookie", async () => {
  const res = await app("/");
  const to = new URL(res.headers.get("location")!);
  const cookie = res.headers.get("set-cookie")!;
  assertEquals(res.status, 302);
  assertEquals(to.origin, HUB);
  assertEquals(cookie.startsWith(`oauth=${to.searchParams.get("state")}`), true);
  assertEquals(cookie.endsWith("; HttpOnly; SameSite=Lax; Max-Age=600; Path=/callback"), true);
});

Deno.test("step 2: /callback refuses a missing or different state", async () => {
  assertEquals((await app("/callback?code=x&state=abc")).status, 400);
  assertEquals((await app("/callback?code=x&state=abc", "oauth=xyz")).status, 400);
});

import { exchangeCode } from "./oauth.ts";

// Plays the browser at GitHub: follow one redirect by hand and read where it points.
async function visit(url: string): Promise<URL> {
  const res = await fetch(url, { redirect: "manual" });
  await res.body?.cancel();
  return new URL(res.headers.get("location")!);
}
const codeFor = async (url: string) => (await visit(url)).searchParams.get("code")!;

Deno.test("step 3: a code buys a bearer token, once", async () => {
  const code = await codeFor(authorizeUrl(newState()));
  const token = await exchangeCode(code);
  assertEquals(token.token_type, "bearer");
  assertEquals(token.scope, "read:user");
  assertEquals(token.access_token.startsWith("gho_"), true);
  await assertRejects(() => exchangeCode(code), "bad_verification_code");
});

Deno.test("step 3: the wrong client secret is refused", async () => {
  const code = await codeFor(authorizeUrl(newState()));
  Deno.env.set("CLIENT_SECRET", "wrong");
  try {
    await assertRejects(() => exchangeCode(code), "incorrect_client_credentials");
  } finally {
    Deno.env.set("CLIENT_SECRET", "fakehub-secret-not-a-real-secret");
  }
});

import { fetchUser } from "./oauth.ts";

// The whole dance: the app's /, fakehub's authorize, the app's /callback with the cookie.
async function login() {
  const start = await app("/");
  const cookie = start.headers.get("set-cookie")!.split(";")[0];
  const back = await visit(start.headers.get("location")!);
  const path = back.pathname + back.search;
  return { cookie, path, res: await app(path, cookie) };
}

Deno.test("step 4: /user names the owner of the token", async () => {
  const token = await exchangeCode(await codeFor(authorizeUrl(newState())));
  assertEquals((await fetchUser(token.access_token)).login, "octocat");
  await assertRejects(() => fetchUser("gho_made_up"), "GET /user: 401 Bad credentials");
});

Deno.test("step 4: the round trip ends signed in", async () => {
  const { res } = await login();
  assertEquals(res.status, 200);
  assertEquals((await res.text()).includes("Signed in as octocat"), true);
});

import { challengeFor } from "./oauth.ts";

Deno.test("step 6: S256 of the RFC 7636 verifier is the RFC's challenge", async () => {
  const challenge = await challengeFor("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk");
  assertEquals(challenge, "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
});

Deno.test("step 6: a code issued for a challenge needs its verifier", async () => {
  const verifier = newState();
  const url = authorizeUrl(newState(), await challengeFor(verifier));
  assertEquals(new URL(url).searchParams.get("code_challenge_method"), "S256");
  await assertRejects(async () => exchangeCode(await codeFor(url)), "bad_verification_code");
  await assertRejects(async () => exchangeCode(await codeFor(url), newState()), "bad_verification_code");
  assertEquals((await exchangeCode(await codeFor(url), verifier)).token_type, "bearer");
});

Deno.test("step 7, state: a callback from another login is refused", async () => {
  const mine = (await app("/")).headers.get("set-cookie")!.split(";")[0];
  const other = await visit(authorizeUrl(newState()));
  assertEquals((await app(other.pathname + other.search, mine)).status, 400);
});

Deno.test("step 7, state: a callback works once", async () => {
  const { cookie, path, res } = await login();
  assertEquals(res.headers.get("set-cookie")!.includes("oauth=; HttpOnly; SameSite=Lax; Max-Age=0"), true);
  assertEquals((await app(path)).status, 400);
  const again = await app(path, cookie);
  assertEquals((await again.text()).includes("bad_verification_code"), true, "the code is spent:");
});

Deno.test("step 7, exact redirect: a different callback gets no code", async () => {
  const url = new URL(authorizeUrl(newState()));
  url.searchParams.set("redirect_uri", "http://127.0.0.1:8000/callback/other");
  const back = await visit(url.href);
  assertEquals(back.pathname, "/callback");
  assertEquals(back.searchParams.get("error"), "redirect_uri_mismatch");
  assertEquals(back.searchParams.has("code"), false);
  const code = await codeFor(authorizeUrl(newState()));
  Deno.env.set("REDIRECT_URI", "http://127.0.0.1:8000/callback/other");
  try {
    await assertRejects(() => exchangeCode(code), "redirect_uri_mismatch");
  } finally {
    Deno.env.set("REDIRECT_URI", "http://127.0.0.1:8000/callback");
  }
});

Deno.test("step 7, PKCE: the app's own code is useless without the cookie", async () => {
  const start = await app("/");
  const code = await codeFor(start.headers.get("location")!);
  await assertRejects(() => exchangeCode(code), "bad_verification_code");
});

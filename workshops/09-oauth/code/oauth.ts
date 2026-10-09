// Log in with GitHub: the OAuth 2 client. Deno, no dependencies.
const env = (name: string) => Deno.env.get(name) ?? ""; // read on every call, so tests can change it
const b64url = (bytes: Uint8Array) => bytes.toBase64({ alphabet: "base64url", omitPadding: true });
const app = () => ({ client_id: env("CLIENT_ID"), redirect_uri: env("REDIRECT_URI") }); // who we are

export type Token = { access_token: string; token_type: string; scope: string; expires_in?: number };
export type User = { login: string; name: string | null };

export function newState(): string {
  return b64url(crypto.getRandomValues(new Uint8Array(32)));
}

export function authorizeUrl(state: string, challenge?: string): string {
  const q = new URLSearchParams({ ...app(), scope: "read:user", state });
  if (challenge) q.set("code_challenge", challenge);
  if (challenge) q.set("code_challenge_method", "S256");
  return `${env("OAUTH_BASE")}/login/oauth/authorize?${q}`;
}

export async function exchangeCode(code: string, verifier?: string): Promise<Token> {
  const body = new URLSearchParams({ ...app(), client_secret: env("CLIENT_SECRET"), code });
  if (verifier) body.set("code_verifier", verifier);
  const res = await fetch(`${env("OAUTH_BASE")}/login/oauth/access_token`, {
    method: "POST", headers: { Accept: "application/json" }, body,
  });
  const json = await res.json();
  if (json.error) throw new Error(`${json.error}: ${json.error_description}`);
  return json;
}

export async function fetchUser(token: string): Promise<User> {
  const res = await fetch(`${env("API_BASE")}/user`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`GET /user: ${res.status} ${(await res.json()).message}`);
  return res.json();
}

export async function challengeFor(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return b64url(new Uint8Array(hash));
}

// Readiness check for the OAuth lab. Run:  deno run ready.ts
const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // RFC 7636, Appendix B
const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
const challenge = new Uint8Array(hash).toBase64({ alphabet: "base64url", omitPadding: true });
console.log(`Deno ${Deno.version.deno}, challenge ${challenge}`);

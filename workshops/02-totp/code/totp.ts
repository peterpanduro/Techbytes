// TOTP from scratch — complete lab file. Deno, no dependencies.
import { timingSafeEqual } from "node:crypto";

type Bytes = Uint8Array<ArrayBuffer>; // a Uint8Array that WebCrypto accepts

// ---------- Step 1: a shared secret ----------
export function newSecret(nbytes = 20): Bytes {
  return crypto.getRandomValues(new Uint8Array(nbytes));
}

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function toBase32(bytes: Bytes): string {
  let bits = 0, acc = 0, out = "";
  for (const b of bytes) {
    acc = (acc << 8) | b; // push 8 bits in
    bits += 8;
    while (bits >= 5) { // pull 5 bits out at a time
      out += B32[(acc >>> (bits - 5)) & 31];
      bits -= 5;
      acc &= (1 << bits) - 1;
    }
  }
  if (bits > 0) out += B32[(acc << (5 - bits)) & 31]; // pad the last group
  return out;
}

// ---------- Step 2: HMAC over a counter ----------
export async function hmacCounter(secret: Bytes, counter: number, hash = "SHA-1") {
  const key = await crypto.subtle.importKey(
    "raw", secret, { name: "HMAC", hash }, false, ["sign"],
  );
  const msg = new Uint8Array(8);
  new DataView(msg.buffer).setBigUint64(0, BigInt(counter)); // 8 bytes, big-endian
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
}

// ---------- Step 3: dynamic truncation ----------
export function truncate(mac: Bytes, digits = 6): string {
  const offset = mac[mac.length - 1] & 0x0f; // low 4 bits of the last byte
  const num = new DataView(mac.buffer).getUint32(offset) & 0x7fffffff;
  return String(num % 10 ** digits).padStart(digits, "0");
}

export async function hotp(secret: Bytes, counter: number, digits = 6, hash = "SHA-1") {
  return truncate(await hmacCounter(secret, counter, hash), digits);
}

// ---------- Step 4: the clock is the counter ----------
export function totp(secret: Bytes, at = Date.now() / 1000, step = 30, digits = 6, hash = "SHA-1") {
  return hotp(secret, Math.floor(at / step), digits, hash);
}

// ---------- Step 5: the URI a phone can scan ----------
export function otpauthUri(secret: Bytes, account: string, issuer: string) {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  return `otpauth://totp/${label}?secret=${toBase32(secret)}` +
    `&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// ---------- Step 6: a verifier a server could use ----------
export class Verifier {
  lastCounter = -1; // highest counter already used

  constructor(private secret: Bytes, private window = 1, private step = 30) {}

  async verify(code: string, at = Date.now() / 1000): Promise<boolean> {
    const now = Math.floor(at / this.step);
    const enc = new TextEncoder();
    for (let c = now - this.window; c <= now + this.window; c++) {
      if (c <= this.lastCounter) continue; // used already, or older than one used
      const expected = await hotp(this.secret, c);
      if (code.length === expected.length &&
          timingSafeEqual(enc.encode(expected), enc.encode(code))) {
        this.lastCounter = c;
        return true;
      }
    }
    return false;
  }
}

if (import.meta.main) {
  const k = new TextEncoder().encode("12345678901234567890"); // the RFC test secret
  console.log("code right now:", await totp(k));
}

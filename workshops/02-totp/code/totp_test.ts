function assertEquals(got: unknown, want: unknown, msg = "") {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) throw new Error(`${msg} got ${g}, want ${w}`);
}

const k = new TextEncoder().encode("12345678901234567890"); // RFC test secret

import { newSecret, toBase32 } from "./totp.ts";

Deno.test("step 1: secrets are 20 bytes, base32 matches the RFC key", () => {
  assertEquals(newSecret().length, 20);
  assertEquals(toBase32(k), "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
});

import { hmacCounter } from "./totp.ts";

Deno.test("step 2: HMAC-SHA1 of counter 0 (RFC 4226 Appendix D)", async () => {
  const mac = await hmacCounter(k, 0);
  const hex = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  assertEquals(mac.length, 20);
  assertEquals(hex, "cc93cf18508d94934c64b65d8ba7667fb7cde4b0");
});

import { hotp } from "./totp.ts";

Deno.test("step 3: HOTP vectors (RFC 4226 Appendix D)", async () => {
  const expected = ["755224", "287082", "359152", "969429", "338314",
                    "254676", "287922", "162583", "399871", "520489"];
  for (let c = 0; c < expected.length; c++) {
    assertEquals(await hotp(k, c), expected[c], `counter ${c}:`);
  }
});

import { totp } from "./totp.ts";

Deno.test("step 4: TOTP vectors (RFC 6238 Appendix B, 8 digits)", async () => {
  const vectors: [number, string][] = [[59, "94287082"], [1111111109, "07081804"],
    [1234567890, "89005924"], [2000000000, "69279037"]];
  for (const [t, e] of vectors) assertEquals(await totp(k, t, 30, 8), e, `t=${t}:`);
});

import { Verifier } from "./totp.ts";

Deno.test("step 6: verifier accepts each step once, rejects replay", async () => {
  const s = newSecret();
  const v = new Verifier(s);
  const t0 = 1_700_000_000;
  assertEquals(await v.verify(await totp(s, t0 - 30), t0), true);  // previous step
  assertEquals(await v.verify(await totp(s, t0 - 30), t0), false); // same code again
  assertEquals(await v.verify(await totp(s, t0), t0), true);       // current step
  assertEquals(await v.verify(await totp(s, t0 + 30), t0), true);  // next step
  assertEquals(await v.verify(await totp(s, t0 + 90), t0), false); // too far ahead
  assertEquals(await v.verify("12345", t0 + 300), false);          // wrong length
});

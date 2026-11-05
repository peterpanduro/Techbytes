import QRCode from "npm:qrcode@1.5.4";
import { newSecret, otpauthUri, toBase32, Verifier } from "./totp.ts";

const s = newSecret();
const uri = otpauthUri(s, "you@example.edu", "TOTP Workshop");
console.log(await QRCode.toString(uri, { type: "terminal", small: true }));
console.log("or type it in:", toBase32(s));
const v = new Verifier(s);

Deno.serve({ port: 8000 }, async (req) => {
  if (req.method !== "POST" || new URL(req.url).pathname !== "/login") {
    return new Response("not found\n", { status: 404 });
  }
  const code = (await req.text()).replace(/\s/g, "");
  return await v.verify(code)
    ? new Response("accepted\n")
    : new Response("rejected\n", { status: 401 });
});

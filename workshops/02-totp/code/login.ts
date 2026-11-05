import QRCode from "npm:qrcode@1.5.4";
import { newSecret, otpauthUri, toBase32, Verifier } from "./totp.ts";

const s = newSecret();
const uri = otpauthUri(s, "you@example.edu", "TOTP Workshop");
console.log(await QRCode.toString(uri, { type: "terminal", small: true }));
console.log("or type it in:", toBase32(s));
const v = new Verifier(s);
while (true) {
  const code = prompt("code from your phone (empty to quit):");
  if (!code) break;
  console.log(await v.verify(code.replace(/\s/g, "")) ? "accepted" : "rejected");
}

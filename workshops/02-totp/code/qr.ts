import QRCode from "npm:qrcode@1.5.4";
import { newSecret, otpauthUri, toBase32, totp } from "./totp.ts";

const s = newSecret();
const uri = otpauthUri(s, "you@example.edu", "TOTP Workshop");
console.log(uri);
console.log(await QRCode.toString(uri, { type: "terminal", small: true }));
await QRCode.toFile("qr.png", uri); // in case the terminal version will not scan
console.log("secret, if you would rather type it in:", toBase32(s));

while (true) {
  console.log(await totp(s), "  valid for", 30 - Math.floor(Date.now() / 1000) % 30, "s");
  await new Promise((r) => setTimeout(r, 5000));
}

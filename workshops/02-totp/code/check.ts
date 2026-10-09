const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("workshop"), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("ready")));
console.log([...mac].map((b) => b.toString(16).padStart(2, "0")).join(""));

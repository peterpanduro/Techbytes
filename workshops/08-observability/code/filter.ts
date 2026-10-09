// Reads JSON log lines on stdin. Prints the ones with status >= 500,
// or, given an argument, the ones containing that text (a request id).
import { createInterface } from "node:readline";
import process from "node:process";
const want = Deno.args[0];
for await (const line of createInterface({ input: process.stdin })) {
  try {
    const rec = JSON.parse(line);
    if (want ? line.includes(want) : rec.status >= 500) console.log(line);
  } catch {
    // not JSON (a startup line, a panic): ignore
  }
}

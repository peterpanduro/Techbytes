// Stretch goal: the reliable-queue pattern from the Redis LMOVE docs.
// A job is MOVED to a "working" list instead of popped, and removed from
// there only when finished. A job a dead worker was holding is still in
// "working", so a restarted worker puts it back on the queue first.
import { createClient } from "npm:redis@4";

const redis = createClient({ url: Deno.env.get("REDIS_URL") });
await redis.connect();
const me = Deno.hostname();

while (await redis.lMove("working", "jobs", "RIGHT", "RIGHT")) {
  console.log(me, "re-queued a job somebody was holding when they died");
}
console.log(me, "waiting for jobs");

while (true) {
  const job = await redis.blMove("jobs", "working", "RIGHT", "LEFT", 0);
  const [id, ...words] = job!.split(" ");
  const text = words.join(" ");
  console.log(me, "got", id, text);
  await new Promise((r) => setTimeout(r, 1000));
  const result = [...text].reverse().join("");
  await redis.set(`result:${id}`, result);
  await redis.lRem("working", 1, job!);
  console.log(me, "done", id, result);
}

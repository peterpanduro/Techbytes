import { createClient } from "npm:redis@4";

const redis = createClient({ url: Deno.env.get("REDIS_URL") });
await redis.connect();
const me = Deno.hostname();
console.log(me, "waiting for jobs");

while (true) {
  const job = await redis.brPop("jobs", 0);
  const [id, ...words] = job!.element.split(" ");
  const text = words.join(" ");
  console.log(me, "got", id, text);
  await new Promise((r) => setTimeout(r, 1000));
  const result = [...text].reverse().join("");
  await redis.set(`result:${id}`, result);
  console.log(me, "done", id, result);
}

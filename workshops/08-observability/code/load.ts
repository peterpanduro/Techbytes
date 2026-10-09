// Load generator: three loops hitting the API at random, forever. Ctrl-C stops it.
const base = "http://localhost:8080";
const paths = ["/", "/products", "/products", "/checkout"];
async function loop(n: number) {
  while (true) {
    const path = paths[Math.floor(Math.random() * paths.length)];
    const t = performance.now();
    const res = await fetch(base + path);
    await res.text();
    console.log(`loop ${n}  ${res.status}  ${path}  ${Math.round(performance.now() - t)} ms`);
    await new Promise((r) => setTimeout(r, 100));
  }
}
await Promise.all([1, 2, 3].map(loop));

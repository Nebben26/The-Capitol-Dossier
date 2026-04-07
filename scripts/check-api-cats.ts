async function main() {
  const res = await fetch("https://gamma-api.polymarket.com/events?active=true&closed=false&limit=10&order=volume&ascending=false");
  const events = await res.json();
  for (const e of events) {
    console.log(`${(e.title || "?").slice(0, 50).padEnd(50)} | cat: ${(e.category || "NONE").padEnd(15)} | tags: ${(e.tags || []).map((t: any) => t.label).join(", ")}`);
  }
  process.exit(0);
}
main();

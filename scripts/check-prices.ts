import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  // Fetch a few events and inspect outcomePrices
  const res = await fetch("https://gamma-api.polymarket.com/events?active=true&closed=false&limit=5&order=volume&ascending=false");
  const events = await res.json();
  for (const ev of events) {
    const m = ev.markets?.[0];
    if (!m) continue;
    console.log(`\n--- ${ev.title} ---`);
    console.log(`  outcomePrices raw: ${JSON.stringify(m.outcomePrices)} (type: ${typeof m.outcomePrices})`);
    console.log(`  outcomes raw: ${JSON.stringify(m.outcomes)} (type: ${typeof m.outcomes})`);
    try {
      const parsed = JSON.parse(m.outcomePrices || "[]");
      console.log(`  parsed: ${JSON.stringify(parsed)}`);
      console.log(`  price[0]: ${parsed[0]} → ${Math.round(parseFloat(String(parsed[0])) * 100)}¢`);
    } catch (e) {
      console.log(`  PARSE ERROR: ${e}`);
    }
  }
  process.exit(0);
}
main();

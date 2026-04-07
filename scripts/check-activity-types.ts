async function main() {
  const res = await fetch("https://data-api.polymarket.com/v1/activity?user=0xa5ea13a81d2b7e8e424b182bdc1db08e756bd96a&limit=10");
  const data = await res.json();
  for (const a of data) {
    console.log(`type=${(a.type||"?").padEnd(10)} side=${(a.side||"?").padEnd(5)} size=${a.size} usdcSize=${a.usdcSize} txHash=${(a.transactionHash||"none").slice(0,15)}`);
  }
  process.exit(0);
}
main();

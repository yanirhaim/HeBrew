import assert from "node:assert/strict";

async function main() {
  if (process.env.RUN_E2E !== "1") {
    console.log("Skipping news summary e2e (set RUN_E2E=1 to run).");
    process.exit(0);
  }

  const baseUrl = process.env.NEWS_E2E_BASE_URL || "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/news/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Test headline",
      description: "Short description about a test event.",
      link: "https://example.com/test",
      pubDate: "Sun, 01 Feb 2026 10:00:00 GMT",
    }),
  });

  assert(response.ok, `Expected 200, got ${response.status}`);
  const payload = await response.json();

  assert(typeof payload.headline === "string" && payload.headline.length > 0);
  assert(typeof payload.summary === "string" && payload.summary.length > 0);
  assert(Array.isArray(payload.vocabularyWords));

  console.log("news-summary.e2e.ts passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

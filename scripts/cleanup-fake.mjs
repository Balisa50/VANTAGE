#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

function loadEnv() {
  try {
    const dir = dirname(fileURLToPath(import.meta.url));
    const envFile = readFileSync(resolve(dir, "../.env.local"), "utf-8");
    for (const line of envFile.split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.+)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
    }
  } catch {}
}
loadEnv();

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const FAKE_SLUGS = [
  "apple-announces-vision-pro-2-with-m5-chip-at-wwdc-2026",
  "flutterwave-secures-central-bank-of-nigeria-payment-license-after-two-year-regul",
  "nubank-reaches-100-million-customers-across-latin-america-eyes-profitability-mil",
  "tsmc-reports-record-q1-revenue-as-ai-chip-demand-surges-40-year-over-year",
  "google-deepmind-unveils-gemini-2-5-pro-with-1m-token-context-window",
  "uae-s-g42-and-microsoft-expand-1-5b-ai-partnership-to-healthcare",
  "saudi-arabia-s-neom-tech-city-signs-1b-ai-infrastructure-deal-with-oracle",
  "eu-ai-act-enforcement-begins-as-first-compliance-deadlines-hit-companies",
  "india-s-upi-processes-16-billion-transactions-in-march-phonepe-leads-at-48-share",
  "meta-launches-llama-4-with-1-trillion-parameters",
];

async function main() {
  let deleted = 0;
  for (const slug of FAKE_SLUGS) {
    const { data } = await db.from("articles").select("id, headline").like("slug", `${slug}%`).single();
    if (data) {
      await db.from("articles").delete().eq("id", data.id);
      deleted++;
      console.log(`Deleted: ${data.headline?.slice(0, 60)}`);
    }
  }
  console.log(`\nRemoved ${deleted} fabricated articles`);
}

main().catch(console.error);

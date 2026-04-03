#!/usr/bin/env node
// Fix em-dashes in all articles
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
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim();
      }
    }
  } catch { /* .env.local not found */ }
}
loadEnv();

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function cleanDashes(text) {
  if (!text) return text;
  // Replace em-dash and en-dash with comma or colon depending on context
  return text
    .replace(/\s*—\s*/g, ", ")   // em-dash
    .replace(/\s*–\s*/g, ", ")   // en-dash
    .replace(/,\s*,/g, ",")      // double commas
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const { data: articles, error } = await db.from("articles").select("*");
  if (error) { console.error(error); return; }

  let fixed = 0;
  for (const a of articles) {
    const fields = ["headline", "subheadline", "what_happened", "why_it_matters", "who_wins_loses", "what_to_watch", "full_body", "social_context"];
    const updates = {};
    let changed = false;

    for (const f of fields) {
      if (a[f] && (a[f].includes("—") || a[f].includes("–"))) {
        updates[f] = cleanDashes(a[f]);
        changed = true;
      }
    }

    if (changed) {
      const { error: err } = await db.from("articles").update(updates).eq("id", a.id);
      if (err) console.log(`Error: ${a.headline?.slice(0, 40)} - ${err.message}`);
      else { fixed++; console.log(`Fixed: ${a.headline?.slice(0, 60)}`); }
    }
  }
  console.log(`\nFixed ${fixed} articles`);
}

main().catch(console.error);

#!/usr/bin/env node
// Set GitHub Actions secrets using the GitHub REST API
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Need tweetsodium or libsodium for secret encryption
// Simpler approach: use the GitHub CLI-compatible format

const dir = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const envFile = readFileSync(resolve(dir, "../.env.local"), "utf-8");
    const vars = {};
    for (const line of envFile.split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.+)$/);
      if (match) vars[match[1]] = match[2].trim();
    }
    return vars;
  } catch { return {}; }
}

const env = loadEnv();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = "Balisa50/VANTAGE";

if (!GITHUB_TOKEN) {
  console.log("GITHUB_TOKEN not set. Please set these secrets manually at:");
  console.log(`https://github.com/${REPO}/settings/secrets/actions`);
  console.log("\nSecrets to set:");
  console.log("  NEXT_PUBLIC_SUPABASE_URL =", env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("  SUPABASE_SERVICE_ROLE_KEY =", env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) + "...");
  console.log("  ANTHROPIC_API_KEY =", env.ANTHROPIC_API_KEY?.slice(0, 20) + "...");
  console.log("  NEWS_API_KEY =", env.NEWS_API_KEY);
  console.log("  SITE_URL = https://vantage-three-chi.vercel.app");
  console.log("  CRON_SECRET = w+zpvpb4QgnMm3EMGmOcYz/ZQ+rlW3mOukoYv5HLbE4=");
  process.exit(0);
}

async function getPublicKey() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/actions/secrets/public-key`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" }
  });
  return res.json();
}

async function setSecret(name, value, keyId, key) {
  // Need sodium for encryption - fallback to manual instructions
  console.log(`Would set: ${name}`);
}

async function main() {
  const { key, key_id } = await getPublicKey();
  console.log("Got public key:", key_id);
  console.log("\nGitHub API requires libsodium for secret encryption.");
  console.log("Please set secrets manually at:");
  console.log(`https://github.com/${REPO}/settings/secrets/actions`);
}

main().catch(console.error);

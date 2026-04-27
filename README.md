# VANTAGE

Tech intelligence platform. Tracks what is happening across global tech, synthesises it, and scores each story so you can skim what matters.

## What it does

Six regions (Africa, Asia, Europe, Americas, MENA, Oceania), six categories (startups, policy, big tech, markets, infrastructure, AI). Every article gets pulled, compressed, and scored by signal strength. High signal means it is worth your time. Low signal means it is noise.

The feed auto-refreshes. You do not need to go looking for things.

## Stack

- Next.js — frontend
- Claude API — article synthesis and signal scoring
- Vercel — hosting and cron pipeline

## Running locally

```bash
npm install
cp .env.example .env.local   # add your Anthropic API key
npm run dev
```

The pipeline runs on a cron schedule in production. For local testing, hit `/api/trigger` to fire it manually.

## Env vars

```
ANTHROPIC_API_KEY=
```

## Live

[vantage-ab.vercel.app](https://vantage-ab.vercel.app)


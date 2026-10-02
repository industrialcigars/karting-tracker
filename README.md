# Witten's Kart Guide

A one-page site for Witten's Kid Kart Honda: pack list, before/after checklists, race-day order,
setup baselines, a maintenance tracker, NTK rules made simple, and an "Ask the rulebook" helper.

## Files
- `images/witten-kart.jpg` — hero photo
- `index.html` — the whole site (checklists and maintenance save in the browser on each device)
- `netlify/functions/ask.mjs` — the helper's backend (keeps the API key off the page)
- `netlify/functions/knowledge.mjs` — condensed 2026 NTK rules + kart notes the helper answers from
- `netlify.toml` — routes `/api/ask` to the function

## Deploy
Netlify's drag-and-drop deploy only publishes static files, so the helper won't work that way.
Use either:

**GitHub (easiest to update later):** push this folder to a repo, then in Netlify choose
"Add new site > Import an existing project" and pick the repo. No build command needed.

**Netlify CLI:**
```
npm i -g netlify-cli
netlify login
netlify deploy --prod      # run inside this folder
```

## Turn on the helper
Netlify > Site configuration > Environment variables > add:
- `ANTHROPIC_API_KEY` = your key from console.anthropic.com
- `MODEL` (optional) = defaults to `claude-sonnet-5-5`; use `claude-haiku-4-5-20251001` for cheaper answers

Redeploy after adding the variable. Without a key, everything else still works and the
helper shows a message pointing to the rulebook link.

## Updating rules each season
When NTK posts a new rulebook, update the RULES text in `knowledge.mjs` and the rulebook links
in `index.html` (search for `docs.google.com`).

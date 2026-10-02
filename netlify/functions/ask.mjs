// Netlify Function: POST /api/ask  { messages: [{role, content}, ...] }
// Requires the ANTHROPIC_API_KEY environment variable (Netlify > Site configuration > Environment variables).
// Optional: MODEL env var to override the default model.

import { RULES, KART_NOTES, RULEBOOK_URL } from "./knowledge.mjs";

const MODEL = process.env.MODEL || "claude-sonnet-5-5";

const SYSTEM = `You are the pit-side helper for Whitton, a brand-new Kid Kart Honda driver at North Texas Karters (NTK) in the Dallas–Fort Worth area, and for his parents, who are new to karting.

How to answer:
- Use plain, friendly language a brand-new karting parent understands. Explain any jargon in a few words.
- Keep answers short: lead with the direct answer in 1–2 sentences, then only the details they need. Use a short list only for step-by-step tasks.
- When the answer comes from the rulebook, cite the rule number in parentheses, e.g. (Rule 302) or (Rule 103.1).
- Only state rules that are in the RULES text below. If the rulebook text doesn't cover the question, say so plainly and tell them who to ask: the Race Director, Tech Inspector, or an NTK class mentor (ntkarters.com > Club Info > Class Mentors). For IKF engine-tech details, point to the IKF Honda GXH50 rules PDF.
- For anything safety-critical (brakes, steering, fuel leaks, helmets, chest protectors), be clear and conservative. If something on the kart seems broken or unsafe, tell them not to drive until it's fixed or checked by someone experienced.
- Never invent part numbers, torque specs or dates. If you don't know, say so.
- The full rulebook is here: ${RULEBOOK_URL}
- If Whitton himself seems to be asking (a young child), answer in very simple, encouraging words.

${RULES}

${KART_NOTES}`;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Use POST." });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json(500, { error: "The site is missing its ANTHROPIC_API_KEY setting." });

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Request body must be JSON." });
  }

  // Keep the last 10 turns, trim each to 2,000 characters.
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return json(400, { error: "Send a question." });
  }
  // The API expects the first message to be from the user.
  while (messages.length && messages[0].role !== "user") messages.shift();

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 700, system: SYSTEM, messages }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error("Anthropic API error", r.status, data);
      return json(502, { error: "The helper couldn't answer right now. Try again in a minute." });
    }
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return json(200, { answer: text || "No answer came back. Try asking another way." });
  } catch (err) {
    console.error(err);
    return json(502, { error: "The helper couldn't be reached. Check your connection and try again." });
  }
};

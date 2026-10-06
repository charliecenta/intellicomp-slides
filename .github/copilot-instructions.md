# Copilot instructions: Intellicomp slides

This repo makes branded slide decks for **Intellicomp Technologies** (managed IT, Baltimore). Full instructions are in **`AGENTS.md`**; brand rules are in **`BRAND.md`**.

## Slides

For any slides, deck or presentation request, follow **`.github/skills/make-deck/SKILL.md`** step by step (the user may be presenting live). Decks are plain text in `slides/<name>.html`; check them with `node .github/skills/make-deck/scripts/deck.mjs slides/<name>.html`.

## The webinars

The series is about practical, safe AI for business, presented by Michael LaBonte, Kevin Kahn and Ophelia Clarke, and it's **industry-neutral**. Details are in `AGENTS.md`.

## Always

- Copy: American English, sentence case, plain and calm, no exclamation marks, no hype. **Never invent statistics, clients, quotes or promises.** Only use facts from the user's input or `BRAND.md`.
- Company name: "Intellicomp" (never "IntelliComp"). Products: IntelliCare, IntelliSecure, IntelliCloud, IntelliVoIP. Call-to-action phone: (443) 484-1009.

## Never

- Write slide HTML, CSS, colors or scripts. Only the text inside a deck's `<script type="text/plain" id="deck">` block.
- Edit anything outside `slides/`: the skill, `BRAND.md`, `css/`, `tokens/`, `fonts/` and `assets/` come from the Intellicomp design system and are overwritten at each update.
- Stage the whole tree (`git add .` / `-A`). Stage the decks you changed.

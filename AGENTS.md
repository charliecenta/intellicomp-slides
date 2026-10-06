# AGENTS.md

Instructions for any AI agent working in this repo (GitHub Copilot, Claude Code, others). `CLAUDE.md` and `.github/copilot-instructions.md` point back here.

## What this repo is

The slide kit for **Intellicomp Technologies**, a managed IT company in Baltimore. It does one thing: **slide decks made live during webinars.** The presenter types `/make-deck` and an outline into Copilot chat, often in front of an audience, and expects a finished, on-brand deck in a minute or two.

## Making slides: use the make-deck skill

**Any request for slides, a deck or a presentation → follow `.github/skills/make-deck/SKILL.md` exactly.** It covers the steps, the ten layouts, the word limits and worked examples. Decks go in `slides/` and are plain text inside a copy of the skill's `template.html`. Never hand-write slide HTML or CSS.

Read **`BRAND.md`** too: colors, type, voice and names. It's short.

## The webinar series

- **Topic:** practical AI for business, with safety and risk at the center: everyday productivity, cloud modernization, Microsoft's pre-built agents, and built-in protections such as compliance controls and automatic data separation.
- **Industry-neutral.** Don't write for a sector unless the outline names one.
- **Presenters:** Michael LaBonte (technical), Kevin Kahn (CEO) and Ophelia Clarke (client perspective).
- **Audience:** existing Intellicomp clients and prospects. Registration runs through Microsoft Teams.

## Repo map

| Path | What | Edit? |
|---|---|---|
| `slides/` | Decks made with the skill; images for them in `slides/images/` | Only the deck block, as the skill says |
| `.github/skills/make-deck/` | The skill: `SKILL.md`, `template.html`, `runtime/` (slide CSS and the checker), `scripts/deck.mjs` (check, open, export), `examples/` | **Never** |
| `BRAND.md` | The brand brief | **Never** |
| `css/tokens.css`, `tokens/tokens.flat.json` | The design tokens (colors, sizes) | **Never** |
| `fonts/aileron/`, `assets/logo/` | The typeface and the logos | **Never** |

Everything except `slides/` is generated from the Intellicomp design system and is overwritten at each update. To change a rule, a layout or the brand, the change has to be made there.

## Commands

- `node .github/skills/make-deck/scripts/deck.mjs slides/<deck>.html` checks a deck and opens it. Add `--no-open` to only check, `--export` for a self-contained copy, `--pptx` for PowerPoint (run `npm install` once first).
- Node.js 18+ is needed for the check. On Windows: `winget install OpenJS.NodeJS.LTS`. Without Node, decks still open, and the browser lists any rule a deck breaks.

## Rules for copy

Follow the voice section of `BRAND.md`. Above all: American English, sentence case, no exclamation marks, and **never invent facts, figures, clients or quotes.** The call-to-action phone number is Sales (443) 484-1009.

## Git

Stage the decks you changed (`git add slides/<file>.html`); never `git add -A` or `git add .`.

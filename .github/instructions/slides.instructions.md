---
applyTo: "slides/**"
---

# Editing decks in slides/

These files are Intellicomp slide decks made with the make-deck skill (`.github/skills/make-deck/SKILL.md`). Follow that skill's rules for any change.

1. Edit **only** the text inside `<script type="text/plain" id="deck"> … </script>`. Never add HTML, CSS, styles, colors or scripts to a deck file.
2. Use only the ten layouts and the fields listed in `.github/skills/make-deck/SKILL.md`, within its word limits.
3. After every change, run `node .github/skills/make-deck/scripts/deck.mjs slides/<file>.html` and fix everything it lists until it prints `✓`.
4. Never invent numbers, quotes, clients or promises. Keep only facts the user gave you.
5. Images the user supplies go in `slides/images/` and are referenced as `image: images/<file>`.

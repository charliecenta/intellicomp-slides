# Intellicomp slides

Branded slide decks for **Intellicomp Technologies**, made live in VS Code with GitHub Copilot. Type an outline, get a finished, on-brand deck in a minute or two.

## Make a deck

1. Open **this folder** in VS Code (File → Open Folder), not a folder above it.
2. Open Copilot chat and switch the mode picker to **Agent**.
3. Type `/make-deck` and your outline, notes or topic:

   ```
   /make-deck Webinar on practical AI for business. Sections: … Close: book a consultation.
   ```

Copilot writes the deck to `slides/<name>.html`, checks it against the brand rules, fixes what the check finds and opens it in your browser.

**Present:** **F** full screen · **→ / ←** next and previous · **N** speaker notes · **Esc** exit.

**Change a deck:** ask in the same chat, for example "make the survey numbers a bar chart" or "shorten the title".

## Set up (once per computer)

- **VS Code** with **GitHub Copilot** and **GitHub Copilot Chat**, signed in.
- **Node.js**, so Copilot can check each deck before it opens. On Windows, run this in a terminal, then restart VS Code:
  ```
  winget install OpenJS.NodeJS.LTS
  ```
  Without Node, decks still open, and any rule a deck breaks is listed on screen.
- **For PowerPoint copies:** run `npm install` once in this folder, and install the fonts in `fonts/aileron/` (right-click each `.otf`, then Install).

[PRESENTER-GUIDE.md](PRESENTER-GUIDE.md) has the full checklist: Copilot settings, a two-minute test, and what to do on the day.

## Handouts

Print a deck to PDF from the browser (one slide per page). Or run:

```
node .github/skills/make-deck/scripts/deck.mjs slides/<name>.html --export --pptx
```

This writes a single shareable HTML file and a PowerPoint copy to `slides/export/`.

## What's in here

| Path | What | Edit? |
|---|---|---|
| `slides/` | Your decks, plus images for them in `slides/images/` | Yes, through Copilot |
| `.github/skills/make-deck/` | The slide skill Copilot follows: rules, layouts, checker, an example deck | No |
| `BRAND.md` | The brand in plain language: colors, type, voice, names | No |
| `css/`, `fonts/`, `assets/`, `tokens/` | The design: colors, Aileron, logos | No |

Everything except `slides/` is maintained in the Intellicomp design system and updated from there. If something about the slides needs to change (a rule, a layout, a word limit), ask Charlie Centa rather than editing these files, so the fix isn't lost at the next update. Which version you have is recorded in `.design-system-export.json`.

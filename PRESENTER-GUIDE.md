# Presenter guide: /make-deck in VS Code with Copilot

Everything you need to present with this repo: setting up a computer once, a two-minute test, and the day itself. [README.md](README.md) has the short version.

**If a deck comes out wrong** (a number that isn't yours, a slide that breaks the brand), fix that deck by asking Copilot in the same chat, and tell Charlie Centa what happened. The rules live in the Intellicomp design system, so a fix there helps every deck after it.

## 1. Set up a computer (once per machine)

- [ ] **VS Code** is up to date, with **GitHub Copilot** and **GitHub Copilot Chat** installed and signed in.
- [ ] **Open the repo folder itself** (File → Open Folder → `intellicomp-slides`), not a parent folder. Copilot only reads the instruction files at the root of the open folder.
- [ ] **Node.js:** in a terminal, run `winget install OpenJS.NodeJS.LTS`, then restart VS Code. `node --version` should print v18 or later. *(Without Node, decks still render, but Copilot can't check its own work. See §3.)*
- [ ] **Optional, for PowerPoint handouts:** run `npm install` once in the repo folder. Also install the fonts in `fonts/aileron/` (right-click each `.otf` → Install) so the `.pptx` shows the right typeface.
- [ ] **Chat mode:** open Copilot chat and switch the mode picker to **Agent**. Ask and Edit modes can't create files or run the check.
- [ ] **Skills are on:** type `/` in the chat box. **`make-deck` must appear in the list.** If it doesn't, open Settings, search **"skills"** and enable agent skills. Also search **"AGENTS.md"** and make sure it's used. Reload the window.
- [ ] **No approval pop-ups mid-webinar:** Copilot asks before running terminal commands. In Settings, search **"auto approve"** and allow the command `node .github/skills/make-deck/scripts/deck.mjs`, so the check runs without a click. Leave everything else on ask.
- [ ] **Default browser** is Chrome or Edge. Both are tested for presenting and print-to-PDF.

## 2. Smoke test (2 minutes)

- [ ] Open `.github/skills/make-deck/examples/intelliprocess-onboarding.html` in the browser. You should see 10 branded slides. Try **F** (full screen), **→ / ←**, **N** (notes) and **Esc**.
- [ ] In the VS Code terminal, run:
  ```
  node .github/skills/make-deck/scripts/deck.mjs .github/skills/make-deck/examples/intelliprocess-onboarding.html
  ```
  It should print `✓ … 10 slides, no problems` and open the deck.

## 3. The no-Node path (once)

Simulate a machine without Node. In VS Code's terminal settings, or on a machine without it, make `node` unavailable, then make any deck.

- [ ] Copilot notices `node` isn't recognized, checks the deck against the rules itself, and opens it with `start slides\<name>.html`.
- [ ] If the deck breaks a rule, the browser shows a red list, and Esc hides it.

## 4. On the day

- [ ] Open VS Code on the repo 10 minutes early and do one warm-up `/make-deck` run, so the model and extension are loaded.
- [ ] Close other browser tabs. Share **the browser window**, not the whole screen, so notes (N) and the problems panel stay under your control.
- [ ] After presenting, `node .github/skills/make-deck/scripts/deck.mjs slides/<name>.html --export --pptx` makes the handout copies in `slides/export/`. Print the HTML to PDF for a one-slide-per-page handout.

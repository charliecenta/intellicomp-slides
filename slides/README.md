# slides/

Decks made with `/make-deck` in Copilot chat land here, one `.html` file per deck. Open one in a browser to present:

- **F** full screen · **→ / Space** next · **←** previous · **N** speaker notes · **Home / End** first / last slide
- **Print to PDF** (Ctrl+P, "Save as PDF") gives one slide per page, for handouts.

Put images for decks in `images/` and ask Copilot to use them by file name.

To share a deck as one file (fonts and images included), or to get a PowerPoint copy (after running `npm install` once):

```bash
node .github/skills/make-deck/scripts/deck.mjs slides/<deck>.html --export --pptx
```

The copies are written to `slides/export/`.

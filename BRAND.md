# Intellicomp brand

Read this whole file before making anything for Intellicomp. It's short on purpose.

## Who Intellicomp is

Intellicomp Technologies is a managed IT services company in Baltimore, Maryland. It has been in business for 30 years and supports clients nationwide. Its services are **IntelliCare** (managed IT and help desk), **IntelliSecure** (cybersecurity), **IntelliCloud** (cloud) and **IntelliVoIP** (business phones). Most clients are small and mid-size organizations in healthcare, legal, education, nonprofits and professional services.

Webinar audiences are **existing clients** plus **prospects coming in from LinkedIn**. The same slides have to reassure people who already trust Intellicomp and persuade people meeting it for the first time.

**The webinar series** is about **practical, safe AI for business**: the Microsoft AI tools Intellicomp offers, what they do for a team day to day, and how to use them without putting data at risk. **Keep it industry-neutral**: no sector-specific framing unless the outline asks for it. Presenters: **Michael LaBonte** (the technical side) and **Ophelia Clarke** (the client's point of view). Registration runs through **Microsoft Teams**.

## The impression

**Calm, competent, on your side.** Intellicomp is the IT team that picks up the phone and fixes the cause. It should feel like a knowledgeable colleague explaining something clearly: never a vendor shouting, never a hacker movie. Clear beats clever, and specific beats impressive.

## Color

Every color comes from the logo. Use the CSS variables, never hex values.

| Color | Variable | Use it for | Never |
|---|---|---|---|
| **Intellicomp Blue** `#117EC2` | `--blue-500` | The brand field: title, section and closing slides; hero bands | Small text; dark text on it |
| **Deep Blue** `#022A45` | `--blue-900` | Depth: footer, header bands, stat and quote slides | — |
| **Heading Blue** `#003C60` | `--blue-800` | Headings on white | Backgrounds |
| **Orange** `#F79522` | `--orange-500` | **Action and emphasis**: the primary button, the one number to remember, bullet markers | White text on it |
| **Sky** `#4BC3EE` | `--blue-300` | Accents and links on dark backgrounds | Text on white |
| **Green** `#5AB847` | `--green-500` | Success messages only | Charts, decoration |
| **Yellow** `#E7E218` | — | **The logo only** | Anything else |

- Most surfaces are **white**. Intellicomp Blue and Deep Blue are for moments, not every section.
- Body text is `--color-text` (a blue-black), not pure black. Muted text is `--color-text-muted`.
- On Intellicomp Blue, text is white and large (at least 24px on the web, and everything on slides). White on that blue only passes contrast at large sizes.
- Charts use `--chart-*` only: blue, orange, heading blue, sky, in that order, four series at most. Label every series directly.

## Typography

- **Aileron** for everything: Regular for body, SemiBold for labels and buttons, Bold for headings, Black only for a big stat number.
- **Sentence case** everywhere: headings, buttons, navigation. The only uppercase is small labels (`.eyebrow`, `.pill`).
- Web body text is 18px. One style per heading level (`h1` to `h4`); never pick a heading level for its size.
- Slides use the slide scale (`--slide-*`). Nothing on a slide is smaller than 28px.

## Spacing and shape

- Spacing uses the 4px scale only: `--space-4, 8, 12, 16, 24, 32, 48, 64, 96, 128`.
- Corners: 4px inputs, 8px buttons and cards, pills for labels. Shadows: `--shadow-sm` at rest, `--shadow-lg` raised.
- Generous white space. When in doubt, take something out.

## The logo

- Use the files in `assets/logo/` (masters in `brand/`). Never redraw, recolor, stretch, crop, outline or add effects.
- `intellicomp-color.png` goes on white. `intellicomp-light-color.png` goes on Intellicomp Blue or Deep Blue. `intellicomp-white.png` goes on photos.
- Keep clear space around it equal to the height of the mark's orange dot times two. Minimum width is 120px on screen.

## Names and numbers

- The company is **Intellicomp**, capital I only, never "IntelliComp". The full name is **Intellicomp Technologies**.
- Products: **IntelliCare, IntelliSecure, IntelliCloud, IntelliVoIP**. Use "IntelliSecure", never "IntelliSecurity".
- Sales: **(443) 484-1009**, the number for every call to action. Support: **(443) 898-HELP**. Email: **info@intellicomp.net**. Web: **intellicomp.net**.
- Office: 1700 Reisterstown Road, Suite 203, Baltimore, MD 21208.

## Voice

Write the way a trusted IT lead talks to a busy office manager.

- **Plain words.** Write "backups run every night," not "leverage robust data-protection solutions." (These are style examples, not facts about Intellicomp.)
- **Specific, and true.** Numbers, times and names beat adjectives. **Only use facts and figures that are in the outline you were given or in this file. Never invent a statistic, a client, a quote or a promise.** If a slide needs a number you don't have, write the point without one.
- **Calm about risk.** State the risk and the fix. No scare tactics, no "catastrophic," no hacker-in-a-hoodie imagery.
- **"We" and "you."** Short sentences. Active voice. American English.
- **No exclamation marks.** No hashtags in headlines. No "click here."
- Spell it right: HIPAA (not HIPPA), Microsoft 365, cybersecurity (one word), email (no hyphen).

## Do and don't

| Do | Don't |
|---|---|
| White background with blue headings for content | Navy `#01195B` (the old website color; not in the logo) |
| One orange button per screen or slide, with dark text | White text on orange or green |
| Blue fields for title, section and closing moments | Two blue sections or slides in a row |
| One idea per slide, and a number when there is one | Walls of bullets; paragraphs on slides |
| The chart palette with direct labels | Rainbow charts, 3D charts, green as a series color |
| The logo file that matches the background | Yellow anywhere outside the logo |
| Sentence case | ALL-CAPS buttons and headings |
| Aileron | Roboto, Poppins, Montserrat, script fonts |

---
name: make-deck
description: Turns a rough outline, notes or a topic into a finished, on-brand Intellicomp slide deck (16:9 HTML) and opens it for presenting. Use when the user types /make-deck, or asks for slides, a deck or a presentation, or asks to change a deck in the slides/ folder.
argument-hint: Paste your outline, notes or topic (numbers and names welcome)
---

# make-deck

You turn the user's outline into an Intellicomp slide deck. **The user may be presenting live, in front of an audience, right now.** Be fast, don't ask questions, and follow these steps exactly.

You never write HTML, CSS or colors. You write **plain text in a fixed format** inside a copy of [template.html](template.html). The design is already done.

## Steps (follow in order, every time)

1. **Read the outline.** Don't ask the user anything, even if it's vague or messy. Decide and go (see "When the outline is vague").
2. **Plan the slides.** Choose one layout per slide with the "Choosing layouts" list below. Usually 6–10 slides. If the user asks for a number of slides, give that many (3–20), **unless the outline doesn't have enough content. Then make fewer slides and say so in your reply** ("8 slides: the outline had enough for 8 without inventing"). Never invent content to reach a count.
3. **Name the file** `slides/<slug>.html`. The slug is 2–5 lowercase words from the topic joined by hyphens, e.g. `slides/cybersecurity-basics.html`. If that file already exists, add `-2`, `-3`, and so on.
4. **Create the file** with the full contents of [template.html](template.html). Then replace **only** the text between `<script type="text/plain" id="deck">` and `</script>` with your deck. Change nothing else in the file.
5. **Write the deck** in the format under "Deck format", within the limits under "Hard limits". Follow "Writing rules". The `outline:` line holds the user's whole message, pasted exactly as they typed it (every line, typos included), without the `/make-deck` command word. Delete the template's `date:` line unless the user gave a date. The check compares every number, time word (minutes, quarterly…) and trend word (rising, doubled…) on your slides with it.
6. **Run the check**, which also opens the deck:
   ```
   node .github/skills/make-deck/scripts/deck.mjs slides/<slug>.html
   ```
7. **If it prints `✗` and a numbered list:** fix every listed problem in the deck block, then run the same command again. Repeat until it prints `✓`. If a problem is still there after three runs, delete that slide.
8. **If the terminal says `node` is not recognized:** Node isn't installed. Check the deck yourself against "Hard limits" and "Writing rules", then open it:
   - Windows: `start slides/<slug>.html`
   - Mac: `open slides/<slug>.html`

   If the deck breaks a rule, the browser shows a red list of the problems. The presenter can press Esc to hide it.
9. **Reply to the user in one or two lines:** the file name, the slide count, and "Present: F = full screen, → / ← = next / previous, N = speaker notes."

**To change a deck later** ("make slide 3 a chart", "shorter titles"): edit the deck block in the same file, then repeat steps 6–9. **Change only what the user asked.** Every other slide stays exactly as it is, unless the check forces a change. If what they asked for is already true ("make it a line chart" when it is one), say so instead of changing something else.

## Choosing layouts

Go down this list for each point in the outline. Use the first layout that fits.

1. Slide 1 is always `title`. The last slide is always `closing`.
2. **One number** that matters (a percentage, a cost, a count) → `stat`. **Intellicomp's own results** (attacks blocked, ransoms paid, clients helped) are the most persuasive numbers in any outline: always give the best one its own `stat` slide.
3. **Two to eight numbers** to compare → `chart`:
   - different things (causes, services, departments) → `type: bar`
   - the same thing over time (months, years, quarters) → `type: column`, or `type: line` if there are 5+ time points or 2–4 series over time.
4. **Two sides** (before/after, problem/fix, do/don't, us/them) → `two-column`.
5. **One strong sentence** (the core claim, a question to the audience, the takeaway) → `statement`.
6. **A real person's words**, with their name in the outline → `quote`. Never write a quote yourself.
7. **An image file the user gave you** → `image`. If the user didn't give you an image, never use this layout.
8. **A new part of the talk** → `section`. Only in decks of 8+ slides that have 2+ parts.
   - **An outline that lists several parts or topics** gets one `bullets` slide listing them all (the agenda), then a slide for each part that has details. **A part the outline only names stays on the agenda slide.** It doesn't get a slide of its own.
9. **Everything else** → `bullets`.

Then check the order:
- **No slide repeats the title**, not slide 2 and not a closing statement. Slide 2 says something new: the problem, the agenda or the first point.
- **No two blue slides in a row.** Only `title`, `section` and `closing` are blue (Intellicomp Blue), so never put a `section` straight after the `title`. `statement`, `stat` and `quote` are dark blue and can go anywhere.
- **No three `bullets` slides in a row.** Turn one into a `statement`, `two-column`, `stat` or `chart`.
- **No two `stat`, `statement`, `quote` or `section` slides in a row.**

## Deck format

```
title: <deck title>
date: <date, only if the user gave one>
presenter: <name, only if the user gave one>
outline: <the user's whole message, pasted exactly; it can run over several lines>

--- <layout>
field: text
- bullet
- bullet

--- <layout>
field: text
```

- The deck starts with `title:`, then `date:` and `presenter:` if known, then `outline:` (required), then one block per slide. The outline is never shown on a slide.
- Each slide starts with a line of three dashes and the layout name: `--- bullets`.
- Every other line is `field: text` or `- bullet`. Nothing else.
- Any slide can have `notes: <text>`: speaker notes the audience doesn't see. **When you have more to say than fits, put it in notes.** Notes are for the presenter and hold only what the outline says: never a remark about the outline or these rules, and never who does what unless the outline says so.

### Fields for each layout (* = required)

| Layout | Fields | Looks like |
|---|---|---|
| `title` | heading*, subheading, eyebrow, footer | Blue. The logo, a big title, one line below |
| `section` | heading*, eyebrow (e.g. `Part 2`) | Blue. A divider between parts |
| `statement` | heading* (wrap one phrase in `*asterisks*` to highlight it in orange), eyebrow | Deep blue. One big sentence |
| `bullets` | heading*, eyebrow, 2–5 `- bullets` | White. A title and a list |
| `two-column` | heading*, left*, right*, eyebrow; bullets go under `left:` and under `right:` | White. Two lists side by side |
| `stat` | number*, label*, source, eyebrow | Deep blue. A huge orange number and what it means |
| `quote` | quote*, name*, role | Deep blue. A testimonial |
| `image` | image* (a path relative to the deck file, e.g. `images/team.jpg`), alt*, heading, caption, eyebrow | White. A picture with a short caption |
| `chart` | heading*, type* (`bar`, `column` or `line`), `data:` then one `Label: number` row per line, unit, highlight, series, colors, source, eyebrow | White. A simple chart |
| `closing` | heading*, cta (button text) | Blue. The call to action. **Phone, email and website are added automatically. Never type them.** |

### Chart details

```
--- chart
heading: Phishing is still the top way in
type: bar
unit: %
highlight: Phishing
data:
Phishing: 36
Stolen passwords: 22
Malware: 18
Other: 24
source: <only if the outline names one>
```

- `data:` goes on its own line, followed by 2–8 rows of `Label: number`. Labels are 1–3 words and can be anything (`Q1`, `2024`, `Stolen passwords`). Write numbers the way the user did: `1,140` is fine.
- `unit:` is `%`, `$`, or a word like `hours`. It's added to every value.
- The chart heading states what the data shows, trend included ("Windows 10 devices fell every quarter"). Trend words are allowed on chart slides because the data backs them.
- `highlight:` names the one label that matters. That bar is blue and the rest turn gray. **Use it when the heading names one item, and only then:** the highlighted label must appear in the heading. A heading about a trend gets no highlight.
- For 2–4 series, add `series: 2024, 2025` and give every row that many values, separated by a comma and a space: `Phishing: 30, 36`. Series that are different things get the default colors. Series that are steps in an order (years, low/medium/high) also get `colors: sequential`.
- More than 8 rows: keep the 8 biggest and list the rest in `notes:`. Don't add numbers up yourself, since a total the user didn't give fails the check. **Never put a table on a slide.**

## Hard limits (the check enforces these)

| Where | Limit |
|---|---|
| Whole deck | 3–20 slides. First is `title`, last is `closing` |
| Every `heading` | title 10 words · section 6 · statement 15 · bullets, two-column, image and closing 8 · chart 10 |
| `subheading` | 15 words |
| `eyebrow` | 4 words (stat: 6) |
| `bullets` | 2–5 bullets, 10 words each |
| `two-column` | `left:` and `right:` 4 words each; 1–4 bullets per side, 8 words each |
| `stat` | number is 8 characters max and contains a digit (`60%`, `$8,600`, `3x`); label 12 words |
| `quote` | 30 words; name 6 words |
| `image` | caption 15 words; alt 20 words |
| `chart` | 2–8 data rows; labels 3 words; 1–4 series |
| `closing` | cta 5 words |
| **Every number on a slide** | must appear in `outline:`. Exceptions: single digits (1–9) and product names like Windows 11 or Microsoft 365 |

## Writing rules

1. **Never invent facts.** Only use numbers, dates, prices, names, clients, quotes and Intellicomp promises (response times, guarantees) that appear in the user's outline. General, widely accepted IT advice ("turn on multi-factor authentication") is fine. No number? Write the point without one. Don't reuse facts from the examples below.
   - **Keep what a number measures.** "HIPAA fines up to $1.5M per violation category per year" is not "one attack can cost $1.5M". Restate the user's own words; don't reinterpret them.
   - **If the outline only names a thing, the slide only names it.** "New client portal next quarter" means a slide can say there's a new client portal next quarter. It can't list features, benefits or promises the user didn't give.
     - Outline: *"Next step: a free AI readiness check."* **Wrong:** a bullets slide listing what the check includes (assess your tools, find gaps, build a roadmap). **Right:** a `statement`: "Next step: a free AI readiness check."
   - **A slide the user asks for but doesn't fill** ("maybe a before/after slide for file permissions") gets only what the outline says, even if that's one bullet a side. **Wrong:** "No audit trail" vs. "Who accessed what is tracked". **Right:** left "Open to more people than they should be", right "Open only to the people who need them".
   - **No cause-and-effect claims** the outline doesn't make. **Wrong:** "Adoption accelerates when concerns are addressed." "AI cuts costs." **Right:** only what the outline says happened.
   - **Keep each number with its own source.** Pilot figures and survey figures never share a list, a column or a chart.
   - **A `source:` uses the outline's own words.** "our pilot" can be "Intellicomp pilot"; it is never "Intellicomp assessment". If the outline names no source, leave the line out.
   - **No claims about the world** (who gets targeted, how often, how bad, what's "the top" or "the most") unless the outline makes them. Advice telling the audience what to do is fine.
   - **Keep qualifiers word for word.** "Up to 40%" stays "up to". On a `stat`, the qualifier goes in the eyebrow and the label carries the rest of the user's words, without the number: `eyebrow: Up to` · `number: 40%` · `label: of shared files in a typical tenant are open to more people than they should be`. Same for "about", "at least", "more than", "nearly".
   - **Don't add time frames, frequencies or deadlines** the user didn't give: no "in hours, not weeks", "quarterly", "by the end of the month".
   - **Use every number the user gave you,** in a stat, a chart, a bullet or at least `notes:`. Don't drop one because it doesn't fit your plan. Change the plan.
2. **Headings say the point**, not the topic: "Phishing is still the top way in," not "Breach causes."
3. **Sentence case.** Capitalize only the first word and names: "How to spot a phishing email." Capitals only for acronyms (HIPAA, MFA, IT).
4. **Short and plain.** Bullets start with a verb or a noun, have no period at the end, and follow the same pattern as each other.
5. **Calm voice.** No exclamation marks, no emoji, no hype ("game-changing," "revolutionary"), no scare words ("catastrophic"). American English.
6. **Names:** Intellicomp (never "IntelliComp"), IntelliCare, IntelliSecure, IntelliCloud, IntelliVoIP. HIPAA, Microsoft 365.
7. **One idea per slide.** If a slide needs two headings, it's two slides.
8. **A number beats a bullet.** If a point has one striking number, make it a `stat` slide instead of burying it in a list. Two numbers that compare the same thing? One chart, not two stat slides. Two numbers that measure different things (52 offices, 2 weeks)? Each can be a `stat`, with another slide between them.
9. **No filler.** Every slide carries a point from the outline. Never add generic slides ("What this means for you", "Let's make the most of…"). If the user asks for more slides than the outline can fill, give each outline point its own slide, then stop.
10. **No hype or empty praise.** Not "significantly", "seamless", "cutting-edge", "game-changing", "catastrophic", "great", "strong results", "ready for what's next". Say what happened, with the user's numbers. A slide that only says things went well is filler: delete it.
11. **A client remark with no name** isn't a `quote` slide. Use a `statement` with eyebrow `What a client told us` and the remark in quotation marks, highlighting one short phrase.
12. **Industry-neutral.** The webinar series is for any business. Don't frame slides around a sector (healthcare, law firms…) unless the outline does.

## When the outline is vague

The user typed a topic, a few words or a messy paragraph. **Don't ask questions.** Build this 7-slide deck and fill it with general, true advice about the topic:

1. `title`: the topic as a clear promise ("Backups that actually work")
2. `statement`: the problem in one sentence
3. `bullets`: why it matters (3 points)
4. `two-column`: what goes wrong vs. what good looks like
5. `bullets`: the steps to take (3–5, starting with verbs)
6. `statement`: the one thing to remember
7. `closing`: "Let's talk about your <topic>", cta "Book a consultation"

## Examples

These show the pattern. **Their facts are made up for illustration. Never copy them into a real deck.**

### Example 1: a clean outline

> /make-deck Webinar: get more from Microsoft 365. Points: Teams channels instead of email threads, SharePoint for shared files, Bookings for scheduling, turn on MFA. Close: book a free Microsoft 365 review.

```
title: Get more from Microsoft 365
outline: Webinar: get more from Microsoft 365. Points: Teams channels instead of email threads, SharePoint for shared files, Bookings for scheduling, turn on MFA. Close: book a free Microsoft 365 review.

--- title
eyebrow: Webinar
heading: Get more from the Microsoft 365 you already pay for
subheading: Four tools you already pay for

--- statement
heading: You already pay for these tools. *Switch them on.*

--- two-column
heading: Swap the habit for the tool
left: Instead of
- Long email threads
- Files on personal laptops
- Back-and-forth to book meetings
right: Try
- Teams channels
- SharePoint document libraries
- Microsoft Bookings

--- bullets
heading: Four things to turn on
- Create one Teams channel per project
- Move shared files to SharePoint
- Publish a Bookings page for client calls
- Require multi-factor authentication for everyone

--- statement
heading: Security comes first: *turn on MFA* before anything else.

--- closing
heading: Let's review your Microsoft 365
cta: Book a free review
```

### Example 2: messy notes with a table of numbers

> /make-deck law firm cyber webinar, audience = managing partners. breach causes from our 2025 client incidents: phishing 36, stolen creds 22, malware 18, lost devices 9, other 15 (percent). avg recovery 21 days. want them to do training + MFA. Rafi presenting

```
title: Cybersecurity for law firms
presenter: Rafi
outline: law firm cyber webinar, audience = managing partners. breach causes from our 2025 client incidents: phishing 36, stolen creds 22, malware 18, lost devices 9, other 15 (percent). avg recovery 21 days. want them to do training + MFA. Rafi presenting

--- title
eyebrow: Webinar for managing partners
heading: Where law firm breaches really start
footer: Presented by Rafi

--- chart
heading: Phishing causes more breaches than anything else
type: bar
unit: %
highlight: Phishing
data:
Phishing: 36
Stolen passwords: 22
Malware: 18
Other: 15
Lost devices: 9
source: Intellicomp client incidents, 2025

--- stat
number: 21 days
label: average time to recover from a breach
source: Intellicomp client incidents, 2025

--- two-column
heading: Two fixes to start with
left: Staff training
- Spot phishing emails
- Report, don't click
right: Multi-factor authentication
- Stops stolen passwords working
- Quick to turn on

--- statement
heading: Phishing caused 36% of breaches. *Training* is the first fix.

--- closing
heading: Let's protect your firm
cta: Book a security review
```

Note what happened: the table became one `bar` chart, sorted big to small, with the key row highlighted. The single striking number became a `stat`. The "percent" in the notes became `unit: %`. The source is used because the notes named it.

### Example 3: a vague one-liner

> /make-deck backups

```
title: Backups that actually work
outline: backups

--- title
eyebrow: Webinar
heading: Backups that actually work
subheading: How to know your data will come back

--- statement
heading: A backup you've never restored is *a guess*, not a plan.

--- bullets
heading: Why backups fail when you need them
- Nobody checks that they finished
- Copies sit on the same network as the originals
- Nobody has practiced a restore

--- two-column
heading: What good looks like
left: Risky
- One copy in the office
- Never tested
right: Reliable
- Copies in two places, one offsite
- Regular restore tests

--- bullets
heading: Four steps to take now
- List the data you can't lose
- Keep one copy offsite or in the cloud
- Restore a file to prove it works
- Put the next test on the calendar

--- statement
heading: Test a restore *before* you need one.

--- closing
heading: Let's talk about your backups
cta: Book a consultation
```

No numbers, no clients, no promises: the outline didn't have any.

## Files

- [template.html](template.html): copy this for every new deck.
- [examples/intelliprocess-onboarding.html](examples/intelliprocess-onboarding.html): a complete 10-slide deck using every layout. Read its deck block when you're unsure of the format.
- [scripts/deck.mjs](scripts/deck.mjs): the check-and-open command. `--export` writes one self-contained file to share, `--pptx` writes a PowerPoint copy for handouts, and `--no-open` only checks.
- [runtime/deck.js](runtime/deck.js) and [runtime/slides.css](runtime/slides.css): the design and the rules. **Never edit these while making a deck.**

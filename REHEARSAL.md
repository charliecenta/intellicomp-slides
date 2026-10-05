# Rehearsal checklist: /make-deck in VS Code with Copilot

Run this on the presenter's computer before the first webinar, and again whenever Copilot's model or VS Code changes. Budget about 45 minutes. Set the computer up first with §1 and §2 of [PRESENTER-GUIDE.md](PRESENTER-GUIDE.md).

**The rule when something goes wrong:** fix the kit, never the deck. The kit lives in the Intellicomp design system, so the fix is made there and this repo is updated from it. A fix to one deck helps once; a fix to the kit helps every deck after it. Then rerun the outline that failed.

---

## 1. The runs

Paste each outline into Copilot chat exactly as written, start a stopwatch, and score it with the checklist in §2. Start a **new chat** for each one: a real presenter won't have your earlier conversation.

The outlines are on the real webinar topic, practical and safe AI for business. **Every number in them is test data**, invented for this rehearsal. That's deliberate: the point is to see whether Copilot uses each figure exactly as given and adds none of its own. Delete the test decks from `slides/` afterwards, so a test number can never end up in front of an audience.

**Run 1: a clean outline**
```
/make-deck Webinar: Put AI to work in your business, safely. Presenters: Michael LaBonte and Ophelia Clarke. Sections: everyday productivity (build a spreadsheet in Excel from a plain-English request, summarize a long email thread), cloud modernization, Microsoft's pre-built agents (find the right expert in your organization, check how your data is protected), safety built in (compliance controls, automatic data separation). Close: book a consultation.
```

**Run 2: messy notes with numbers, qualifiers and a quote**
```
/make-deck ok ai webinar, michael presenting the demos, ophelia does the client side. TEST NUMBERS: in our pilot 12 staff saved about 3 hrs a week each with email summaries. up to 40% of shared files in a typical tenant are open to more people than they should be. what to do before turning on copilot: check who can see what, label sensitive files, turn on MFA, start with one team. maybe a before/after slide for file permissions?? quote from Dr. Zipora Schorr, Beth Tfiloh Synagogue: "Their responsiveness, their skill, their tech knowledge is extraordinary." end with book a consultation. ~8 slides
```

**Run 3: a table of numbers**
```
/make-deck AI adoption update for clients. TEST DATA. Share of pilot users using Copilot weekly: Jun 8% / Jul 15% / Aug 23% / Sep 31%. Survey of 50 clients: 64% said data security was their main worry about AI, 22% said cost, 14% said training time. Next step: a free AI readiness check. Close: book a consultation.
```

**Run 4: vague, with a constraint**
```
/make-deck AI and data security, 5 slides, quick
```

**Run 5: a change to an existing deck** (in the same chat as Run 3)
```
Make the weekly-use numbers a line chart, and shorten the title.
```

## 2. Score each run

| Check | Pass if |
|---|---|
| **Time** | Deck is open in the browser within **2 minutes** of pressing Enter |
| **No questions** | Copilot didn't stop to ask anything |
| **File** | One new file in `slides/`, with a short lowercase name. `git status` shows **nothing else changed** |
| **Check** | Copilot ran the check and kept fixing until it printed `✓` |
| **Structure** | Slide 1 is the blue title slide, the last is the blue closing slide with (443) 484-1009, and no two blue slides touch |
| **No invented facts** | **Every number, name, quote and promise on the slides is in the outline.** Read each slide against the outline. This is the most important check |
| **Qualifiers kept** | "up to", "about", "more than" survive (Run 2: "about 3 hrs" and "up to 40%" keep their qualifiers and what they measure: per person per week, shared files in a typical tenant) |
| **Numbers used well** | Run 2: the pilot result (about 3 hours a week) is a stat slide. Run 3: the monthly figures are one chart, the survey split is one chart (not three stat slides), and every number appears somewhere |
| **Right count** | Run 4 has exactly 5 slides; Run 2 has about 8. Fewer than asked is a pass **if** Copilot says it didn't have enough content. Padding is a fail |
| **Industry-neutral** | No slide frames the topic around a sector (healthcare, law firms…), since no outline names one |
| **Nothing embellished** | Things the outline only names are only named. Run 1: "cloud modernization" gets no invented details. Run 3: the "free AI readiness check" gets no invented features or promises. No numbers beyond the outline's (especially in Run 4, which has none) |
| **Voice** | Sentence case, no exclamation marks, no emoji, no "IntelliComp", calm tone |
| **Looks right** | Nothing overflows, no red problems panel, text readable from the back of the room |
| **Presents** | F, arrows and N work; the slide number shows on content slides |

## 3. Record results

| Date | Copilot model | Run | Time | Passed | What went wrong | Kit fix made |
|---|---|---|---|---|---|---|
| | | 1 | | | | |
| | | 2 | | | | |
| | | 3 | | | | |
| | | 4 | | | | |
| | | 5 | | | | |

Test at least the model the client will use on the day, plus the smallest model in Copilot's picker. If the small one passes, the big ones will.


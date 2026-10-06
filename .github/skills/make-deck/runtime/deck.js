/* Intellicomp deck runtime. One file, two jobs:
   - In a browser: reads <script type="text/plain" id="deck">, checks it, renders the slides, handles keys.
   - In Node (scripts/deck.mjs): the same parse() and check() run before the deck is opened.
   The rules here are the rules in SKILL.md. If you change one, change the other. */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------- layouts and limits
  // words = max words, chars = max characters, req = required, oneOf = allowed values.
  const COMMON = { eyebrow: { words: 4 }, notes: {} };
  const LAYOUTS = {
    title: { surface: 'brand', fields: { heading: { req: 1, words: 10 }, subheading: { words: 15 }, footer: { words: 12 }, ...COMMON } },
    section: { surface: 'brand', fields: { heading: { req: 1, words: 6 }, ...COMMON } },
    statement: { surface: 'deep', fields: { heading: { req: 1, words: 15 }, ...COMMON } },
    bullets: { surface: 'light', fields: { heading: { req: 1, words: 8 }, ...COMMON }, bullets: { min: 2, max: 5, words: 10 } },
    'two-column': { surface: 'light', fields: { heading: { req: 1, words: 8 }, left: { req: 1, words: 4 }, right: { req: 1, words: 4 }, ...COMMON }, columnBullets: { min: 1, max: 4, words: 8 } },
    stat: { surface: 'deep', fields: { number: { req: 1, chars: 8 }, label: { req: 1, words: 12 }, source: { words: 12 }, ...COMMON, eyebrow: { words: 6 } } },
    quote: { surface: 'deep', fields: { quote: { req: 1, words: 30 }, name: { req: 1, words: 6 }, role: { words: 8 }, notes: {} } },
    image: { surface: 'light', fields: { image: { req: 1 }, alt: { req: 1, words: 20 }, heading: { words: 8 }, caption: { words: 15 }, ...COMMON } },
    chart: { surface: 'light', fields: { heading: { req: 1, words: 10 }, type: { req: 1, oneOf: ['bar', 'column', 'line'] }, unit: { chars: 12 }, highlight: {}, series: {}, colors: { oneOf: ['categorical', 'sequential'] }, source: { words: 12 }, data: {}, ...COMMON }, data: { min: 2, max: 8, labelWords: 3 } },
    closing: { surface: 'brand', fields: { heading: { req: 1, words: 8 }, cta: { words: 5 }, notes: {} } },
  };
  const HEADER = { title: { req: 1, words: 12 }, date: { words: 6 }, presenter: { words: 8 }, outline: { req: 1 } };
  const CONTACT = [['Call', '(443) 484-1009', 'tel:+14434841009'], ['Email', 'info@intellicomp.net', 'mailto:info@intellicomp.net'], ['Web', 'intellicomp.net', 'https://intellicomp.net']];
  const ACRONYMS = new Set('HIPAA HITECH HITRUST CMMC NIST GDPR PCI SOC MFA VPN VOIP IT AI GPT LLM PDF CEO CFO CTO CISO COO CIO HR ABA EDR MDR XDR SIEM ISP LAN WAN SSO DNS API USB IOT SASE ZTNA FAQ ROI KPI SLA USA EST PST CST'.split(' '));
  const PROPER = new Set('Intellicomp IntelliCare IntelliSecure IntelliCloud IntelliVoIP Microsoft Teams SharePoint OneDrive Outlook Exchange Excel Word PowerPoint OneNote Planner Loop Purview Fabric Dynamics Google Workspace Windows Azure Baltimore Maryland America American Zoom Copilot Defender Intune Entra LinkedIn January February March April May June July August September October November December Monday Tuesday Wednesday Thursday Friday'.split(' '));

  const words = (s) => (s || '').trim().split(/\s+/).filter(Boolean).length;
  // Series values are separated by ", " or ";" so thousands separators (1,140) survive.
  const splitValues = (raw) => String(raw).split(/\s*;\s*|,\s+/).map((x) => x.trim()).filter(Boolean);

  // ---------------------------------------------------------------- parse
  // Format: header lines (key: value), then one block per slide starting with "--- <layout>".
  function parse(text) {
    const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
    const deck = { header: {}, slides: [], problems: [] };
    const problem = (line, slide, msg) => deck.problems.push({ line, slide, msg });
    let cur = null, inData = false, col = null, inOutline = false;

    lines.forEach((raw, i) => {
      const n = i + 1, line = raw.trim();
      const start = line.match(/^-{3,}\s*([A-Za-z-]*)\s*$/);
      if (inOutline && !start) { deck.header.outline += '\n' + raw; return; }
      if (!line) return;
      if (start) {
        const layout = start[1].toLowerCase();
        cur = { layout, fields: {}, bullets: [], columns: { left: [], right: [] }, data: [], line: n, number: deck.slides.length + 1 };
        deck.slides.push(cur); inData = false; col = null; inOutline = false;
        if (!layout) problem(n, cur, `A slide starts with "---" but has no layout. Write e.g. "--- bullets". Layouts: ${Object.keys(LAYOUTS).join(', ')}.`);
        else if (!LAYOUTS[layout]) problem(n, cur, `"${layout}" is not a layout. Use one of: ${Object.keys(LAYOUTS).join(', ')}.`);
        return;
      }
      const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
      const kv = line.match(/^([A-Za-z][A-Za-z -]*?)\s*:\s*(.*)$/);
      if (!cur) {
        if (kv && kv[1].toLowerCase() === 'outline') { deck.header.outline = kv[2]; inOutline = true; }
        else if (kv && HEADER[kv[1].toLowerCase()]) deck.header[kv[1].toLowerCase()] = kv[2].trim();
        else if (kv) problem(n, null, `"${kv[1]}" is not allowed before the first slide. Only: title, date, presenter.`);
        else problem(n, null, `Line not understood before the first slide: "${line.slice(0, 50)}". Start slides with "--- <layout>".`);
        return;
      }
      const spec = LAYOUTS[cur.layout];
      if (!spec) return;
      if (bullet) {
        if (cur.layout === 'two-column') {
          if (!col) problem(n, cur, 'In two-column, write "left: <heading>" before its bullets.');
          else cur.columns[col].push({ text: bullet[1].trim(), line: n });
        } else if (spec.bullets) cur.bullets.push({ text: bullet[1].trim(), line: n });
        else problem(n, cur, `The ${cur.layout} layout has no bullets. Use a bullets slide, or put the extra detail in "notes:".`);
        return;
      }
      if (inData && !(kv && spec.fields[kv[1].toLowerCase().trim()])) {
        // Chart rows: "Label: value". The label can hold anything (Q1, 2024, 9:00 am); the value follows the last colon.
        const at = line.lastIndexOf(':');
        if (at > 0) { cur.data.push({ label: line.slice(0, at).trim(), raw: line.slice(at + 1).trim(), line: n }); return; }
      }
      if (kv) {
        const key = kv[1].toLowerCase().trim(), val = kv[2].trim();
        if (!spec.fields[key]) { problem(n, cur, `"${key}" is not a field of ${cur.layout}. Allowed: ${Object.keys(spec.fields).join(', ')}.`); return; }
        inData = key === 'data';
        if (key === 'data') return;
        if (key === 'left' || key === 'right') col = key;
        if (key === 'notes' && cur.fields.notes) cur.fields.notes += ' ' + val;
        else cur.fields[key] = val;
        cur.fields['_line_' + key] = n;
        return;
      }
      if (cur.fields.notes !== undefined && !inData) { cur.fields.notes += ' ' + line; return; }
      problem(n, cur, `Line not understood: "${line.slice(0, 60)}". Every line is "field: text" or "- bullet".`);
    });
    return deck;
  }

  // ---------------------------------------------------------------- check
  function numberOf(raw) { const m = String(raw).replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : NaN; }

  function lintText(text, where, add) {
    if (/!/.test(text)) add(`${where}: remove the exclamation mark. The brand voice is calm.`);
    if (/IntelliComp/.test(text)) add(`${where}: write "Intellicomp" (capital I only), not "IntelliComp".`);
    if (/IntelliSecurity/.test(text)) add(`${where}: the product is "IntelliSecure".`);
    if (/HIPPA/i.test(text)) add(`${where}: the spelling is "HIPAA".`);
    if (/click here/i.test(text)) add(`${where}: don't write "click here". Say what happens.`);
    if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text)) add(`${where}: remove the emoji.`);
    if (/<\/?script/i.test(text)) add(`${where}: slides can't contain "<script".`);
    const caps = (text.match(/\b[A-Z]{4,}\b/g) || []).filter((w) => !ACRONYMS.has(w));
    if (caps.length) add(`${where}: "${caps[0]}" is in capitals. Use sentence case; capitals only for acronyms like HIPAA or MFA.`);
  }
  function titleCase(text) {
    const ws = text.replace(/[^\p{L}\s'-]/gu, ' ').split(/\s+/).filter(Boolean).slice(1).filter((w) => w.length >= 4 && !PROPER.has(w) && !ACRONYMS.has(w) && !/[A-Z].*[A-Z]/.test(w));
    const upper = ws.filter((w) => /^\p{Lu}/u.test(w));
    return ws.length >= 2 && upper.length >= 2 && upper.length / ws.length >= 0.6;
  }

  function check(deck) {
    const out = deck.problems.map((p) => ({ ...p }));
    const add = (slide, line, msg) => out.push({ slide, line, msg });
    const label = (s) => (s ? `Slide ${s.number} (${s.layout})` : 'Deck header');

    const S = deck.slides;
    // Template text left in by mistake.
    const PLACEHOLDER = /\bReplace with\b|^(?:First|Second|Third) point$/i;
    for (const [k, v] of Object.entries(deck.header)) if (k !== 'outline' && PLACEHOLDER.test(String(v))) add(null, 1, `The "${k}:" line still has the template's text. Fill it in, or delete the line.`);
    for (const s of S) {
      for (const [k, v] of Object.entries(s.fields)) if (!k.startsWith('_line_') && PLACEHOLDER.test(String(v))) add(s, s.fields['_line_' + k] || s.line, `${label(s)}: "${k}:" still has the template's text. Fill it in, or delete the line.`);
      for (const b of s.bullets.concat(s.columns.left, s.columns.right)) if (PLACEHOLDER.test(b.text)) add(s, b.line, `${label(s)}: "${b.text}" is the template's text. Replace it.`);
    }
    if (!deck.header.title) add(null, 1, 'The deck needs a "title:" line at the very top.');
    if (!deck.header.outline || !deck.header.outline.trim()) add(null, 1, 'The deck needs an "outline:" line at the top with the user\'s message pasted exactly as they typed it.');
    else {
      // Every number on a slide must come from the user's outline. Exempt: product names (Windows 10,
      // Microsoft 365), single digits (counts like "Part 2"), and the contact details the closing slide adds.
      const PRODUCT = /\b(?:Microsoft|Office) 365\b|\bWindows(?: Server)? \d+\b|\bWi-?Fi \d\b|\bSOC ?\d\b|\bGPT-?\d[\w.]*/gi;
      const nums = (t) => (String(t).replace(PRODUCT, ' ').match(/\d[\d,.]*/g) || []).map((x) => x.replace(/[.,]+$/, '').replace(/,/g, '')).filter((x) => x && !/^\d$/.test(x));
      const allowed = new Set(nums(deck.header.outline));
      // The other direction: every number the user gave must appear somewhere in the deck (a slide or its notes).
      // Single digits count here ("0 ransoms paid"); slide counts ("12 slides") don't.
      const allNums = (t) => (String(t).replace(PRODUCT, ' ').replace(/~?\d+\s*slides?\b/gi, ' ').match(/\d[\d,.]*/g) || []).map((x) => x.replace(/[.,]+$/, '').replace(/,/g, ''));
      const deckText = S.map((s) => [Object.entries(s.fields).filter(([k]) => !k.startsWith('_line_')).map(([, v]) => v).join(' '), s.bullets.concat(s.columns.left, s.columns.right).map((b) => b.text).join(' '), s.data.map((d) => d.label + ' ' + d.raw).join(' ')].join(' ')).join(' ');
      // Spelled-out small numbers count: "Three tips" covers the user's "3 tips".
      const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
      const spelled = deckText.toLowerCase().replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/g, (w) => ' ' + WORDS.indexOf(w) + ' ');
      const inDeck = new Set(allNums(deckText).concat(allNums(spelled)));
      // List markers the user typed ("1.", "2)") aren't numbers they gave.
      const outlineNoMarkers = deck.header.outline.replace(/^\s*(?:[-*•]\s*)?\d+[.)]\s+/gm, '');
      [...new Set(allNums(outlineNoMarkers))].filter((n) => !inDeck.has(n)).forEach((n) => add(null, 1, `The user's number "${n}" isn't anywhere in the deck. Use every number the user gave: on a slide, or at least in "notes:".`));
      if (deck.header.date && nums(deck.header.date).some((n) => !allowed.has(n))) add(null, 1, 'The "date:" line isn\'t in the user\'s outline. Delete it unless the user gave a date.');
      S.forEach((s) => {
        const texts = Object.entries(s.fields).filter(([k]) => !k.startsWith('_line_') && k !== 'image').map(([k, v]) => [v, s.fields['_line_' + k] || s.line])
          .concat(s.bullets.map((b) => [b.text, b.line]), s.columns.left.map((b) => [b.text, b.line]), s.columns.right.map((b) => [b.text, b.line]), s.data.map((d) => [d.label + ' ' + d.raw, d.line]));
        const seen = new Set();
        texts.forEach(([t, ln]) => nums(t).forEach((n) => {
          if (allowed.has(n) || seen.has(n)) return;
          seen.add(n);
          add(s, ln, `Slide ${s.number} (${s.layout}): the number "${n}" isn't in the user's outline. Only use numbers the user gave you, exactly as given. Remove it, or make the point without a number.`);
        }));
      });
      // Qualifiers stay with their numbers: "about 3 hrs" and "up to 40%" can't lose "about" or "up to".
      const QUAL = { about: 'about|around|roughly|approximately|approx|~', 'up to': 'up to|as many as|as much as', 'more than': 'more than|over', 'at least': 'at least|a minimum of', nearly: 'nearly|almost', 'less than': 'less than|under|fewer than' };
      const unitOf = (u) => { u = (u || '').toLowerCase(); if (u === '%') return '%'; if (/^hr|^hour/.test(u)) return 'hour'; if (/^min/.test(u)) return 'minute'; if (/^day/.test(u)) return 'day'; if (/^w(ee)?k/.test(u)) return 'week'; if (/^mo/.test(u)) return 'month'; if (/^y(ea)?r/.test(u)) return 'year'; return ''; };
      const NUMU = /\$?(\d[\d,.]*)\s*(%|hrs?\b|hours?\b|mins?\b|minutes?\b|days?\b|wks?\b|weeks?\b|mos?\b|months?\b|yrs?\b|years?\b)?/gi;
      const quals = [];
      for (const [name, alts] of Object.entries(QUAL)) {
        const re = new RegExp(`(?:^|[^a-z])(?:${alts})\\s*\\$?(\\d[\\d,.]*)\\s*(%|hrs?\\b|hours?\\b|mins?\\b|minutes?\\b|days?\\b|wks?\\b|weeks?\\b|mos?\\b|months?\\b|yrs?\\b|years?\\b)?`, 'gi');
        for (const m of deck.header.outline.matchAll(re)) quals.push({ name, alts: new RegExp(`(?:^|[^a-z])(?:${alts})(?![a-z])`, 'i'), n: m[1].replace(/[.,]+$/, '').replace(/,/g, ''), unit: unitOf(m[2]) });
      }
      if (quals.length) S.forEach((s) => {
        const units = s.layout === 'stat' ? [[[s.fields.number, s.fields.label, s.fields.eyebrow].filter(Boolean).join(' '), s.fields._line_number || s.line]]
          : Object.entries(s.fields).filter(([k]) => !k.startsWith('_line_') && !['image', 'alt', 'notes'].includes(k)).map(([k, v]) => [v, s.fields['_line_' + k] || s.line])
            .concat(s.bullets.concat(s.columns.left, s.columns.right).map((b) => [b.text, b.line]));
        units.forEach(([t, ln]) => quals.forEach((q) => {
          const hit = [...String(t).matchAll(NUMU)].some((m) => m[1].replace(/[.,]+$/, '').replace(/,/g, '') === q.n && (!q.unit || unitOf(m[2]) === q.unit));
          if (hit && !q.alts.test(t)) add(s, ln, `Slide ${s.number} (${s.layout}): the outline says "${q.name} ${q.n}${q.unit === '%' ? '%' : q.unit ? ' ' + q.unit + 's' : ''}". Keep "${q.name}" with this number, here: "${String(t).slice(0, 60)}".`);
        }));
      });
      // Claims without digits: time frames and trends must come from the outline; hype never passes.
      const norm = (t) => String(t).toLowerCase().replace(/\bmins?\b/g, 'minute').replace(/\bhrs?\b/g, 'hour').replace(/\byrs?\b/g, 'year').replace(/\bmos?\b/g, 'month').replace(/\bwks?\b/g, 'week').replace(/\bq[1-4]\b/g, 'quarter').replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)(uary|ruary|ch|il|e|y|ust|tember|ober|ember)?\b/g, '$& month');
      const stem = (w) => w.replace(/(ly|s)$/, '').replace(/^annual$/, 'year').replace(/^dai$/, 'day').replace(/^week$/, 'week');
      const TIME = /\b(minutes?|hours?|days?|weeks?|months?|quarters?|years?|daily|weekly|monthly|quarterly|yearly|annual|annually|overnight|instant|instantly|anytime|real[- ]time|24\/7|around the clock)\b/gi;
      const TREND = /\b(rising|rises?|growing|grows?|increasing|increases?|surging|surges?|soaring|skyrocket\w*|doubl\w*|tripl\w*|exploding|plummet\w*|declin\w*|falling|dropping|guarantee\w*|frequently|often|commonly|increasingly|constantly|usually|always|regularly|routinely|transform\w*|revolutioni[sz]\w*|supercharg\w*|unlock\w*|empower\w*|accelerat\w*|booming|momentum|taking off|takes off)\b/gi;
      const RANK = /\b(top|most|biggest|largest|leading|number one|#1|fastest|slowest|cheapest|worst|best)\b/gi;
      const HYPE = /\b(significantly|dramatically|game[- ]chang\w*|revolutionary|cutting[- ]edge|world[- ]class|best[- ]in[- ]class|state[- ]of[- ]the[- ]art|catastrophic|devastating|nightmare|unbeatable|destroy\w*|crippl\w*|ruin\w*|terrifying|great|excellent|outstanding|amazing|impressive|incredible|exceptional|fantastic)\b/gi;
      const outlineText = norm(deck.header.outline);
      const timeInOutline = new Set((outlineText.match(TIME) || []).map((w) => stem(w.toLowerCase())));
      S.forEach((s) => {
        const texts = Object.entries(s.fields).filter(([k]) => !k.startsWith('_line_') && !['image', 'alt', 'notes'].includes(k)).map(([k, v]) => [v, s.fields['_line_' + k] || s.line])
          .concat(s.bullets.map((b) => [b.text, b.line]), s.columns.left.map((b) => [b.text, b.line]), s.columns.right.map((b) => [b.text, b.line]));
        const seen = new Set();
        texts.forEach(([t, ln]) => {
          const low = norm(t);
          (low.match(TIME) || []).forEach((w) => { const k = stem(w.toLowerCase()); if (timeInOutline.has(k) || seen.has(k)) return; seen.add(k);
            add(s, ln, `Slide ${s.number} (${s.layout}): "${w}" is a time frame the outline doesn't give. Don't add time frames, frequencies or deadlines. Remove it.`); });
          if (s.layout !== 'chart') (low.match(TREND) || []).forEach((w) => { if (outlineText.includes(w.toLowerCase()) || seen.has(w)) return; seen.add(w);
            add(s, ln, `Slide ${s.number} (${s.layout}): "${w}" claims a trend, a frequency or a promise the outline doesn't make. Remove it, or say only what the outline says.`); });
          if (s.layout !== 'chart') (low.match(RANK) || []).forEach((w) => { if (outlineText.includes(w.toLowerCase()) || seen.has(w)) return; seen.add(w);
            add(s, ln, `Slide ${s.number} (${s.layout}): "${w}" ranks something the outline doesn't rank. Remove it, or show the ranking with the user's numbers in a chart.`); });
          (t.match(HYPE) || []).forEach((w) => { if (seen.has(w)) return; seen.add(w);
            add(s, ln, `Slide ${s.number} (${s.layout}): "${w}" is hype or a scare word. Say what actually happened, calmly, with the user's numbers if there are any.`); });
        });
      });
    }
    for (const [k, rule] of Object.entries(HEADER)) if (deck.header[k] && rule.words && words(deck.header[k]) > rule.words) add(null, 1, `Deck ${k} has ${words(deck.header[k])} words; max ${rule.words}.`);
    if (S.length < 3) add(null, 1, `The deck has ${S.length} slide(s). Make at least 3: title, content, closing.`);
    if (S.length > 20) add(null, 1, `The deck has ${S.length} slides; max 20. Merge or cut.`);
    if (S.length && S[0].layout !== 'title') add(S[0], S[0].line, 'The first slide must be "--- title".');
    if (S.length && S[S.length - 1].layout !== 'closing') add(S[S.length - 1], S[S.length - 1].line, 'The last slide must be "--- closing".');

    S.forEach((s, i) => {
      const spec = LAYOUTS[s.layout];
      if (!spec) return;
      const L = label(s);
      for (const [k, rule] of Object.entries(spec.fields)) {
        const v = s.fields[k], ln = s.fields['_line_' + k] || s.line;
        if (rule.req && !v && k !== 'data') add(s, s.line, `${L}: "${k}:" is required.`);
        if (!v) continue;
        if (rule.words && words(v) > rule.words) add(s, ln, `${L}: ${k} has ${words(v)} words; max ${rule.words}. Shorten it${k === 'notes' ? '' : ', or move detail to "notes:"'}.`);
        if (rule.chars && v.length > rule.chars) add(s, ln, `${L}: ${k} is ${v.length} characters; max ${rule.chars}.`);
        if (rule.oneOf && !rule.oneOf.includes(v.toLowerCase())) add(s, ln, `${L}: ${k} must be one of: ${rule.oneOf.join(', ')}.`);
        if (k !== 'notes' && k !== 'image') lintText(v, `${L}, ${k}`, (m) => add(s, ln, m));
        if (k === 'heading' && s.layout !== 'statement' && titleCase(v)) add(s, ln, `${L}: the heading looks like Title Case. Use sentence case: capitalize only the first word and names.`);
      }
      if (s.layout === 'statement' && ((s.fields.heading || '').match(/\*/g) || []).length > 2) add(s, s.line, `${L}: highlight at most one phrase with *asterisks*.`);
      if (s.layout === 'statement') { const em = (s.fields.heading || '').match(/\*([^*]+)\*/); if (em && words(em[1]) * 2 > words(s.fields.heading.replace(/\*/g, ''))) add(s, s.fields._line_heading || s.line, `${L}: the *highlight* covers most of the sentence. Highlight one short phrase, the words that matter most.`); }
      if (s.layout === 'stat' && s.fields.number && !/\d/.test(s.fields.number)) add(s, s.line, `${L}: number must contain a digit, e.g. "60%" or "$8,600". No number? Use a statement slide.`);
      if (spec.bullets) {
        const b = s.bullets, r = spec.bullets;
        if (b.length < r.min) add(s, s.line, `${L}: ${b.length} bullet(s); needs at least ${r.min}. One point? Use a statement slide.`);
        if (b.length > r.max) add(s, b[r.max].line, `${L}: ${b.length} bullets; max ${r.max}. Split into two slides, or cut the weakest.`);
        b.forEach((x, j) => { if (words(x.text) > r.words) add(s, x.line, `${L}: bullet ${j + 1} has ${words(x.text)} words; max ${r.words}.`); lintText(x.text, `${L}, bullet ${j + 1}`, (m) => add(s, x.line, m)); });
      }
      if (s.layout === 'two-column') {
        const r = spec.columnBullets;
        for (const side of ['left', 'right']) {
          const b = s.columns[side];
          if (b.length < r.min) add(s, s.line, `${L}: the ${side} column needs at least ${r.min} bullet.`);
          if (b.length > r.max) add(s, b[r.max].line, `${L}: the ${side} column has ${b.length} bullets; max ${r.max}.`);
          b.forEach((x, j) => { if (words(x.text) > r.words) add(s, x.line, `${L}: ${side} bullet ${j + 1} has ${words(x.text)} words; max ${r.words}.`); lintText(x.text, `${L}, ${side} bullet ${j + 1}`, (m) => add(s, x.line, m)); });
        }
      }
      if (s.layout === 'chart') {
        const r = spec.data, d = s.data;
        if (d.length < r.min) add(s, s.line, `${L}: needs a "data:" line followed by at least ${r.min} rows like "Phishing: 36".`);
        if (d.length > r.max) add(s, d[r.max].line, `${L}: ${d.length} data rows; max ${r.max}. Keep the ${r.max} biggest and list the rest in "notes:".`);
        const series = (s.fields.series || '').split(',').map((x) => x.trim()).filter(Boolean);
        if (series.length > 4) add(s, s.line, `${L}: ${series.length} series; max 4.`);
        const per = Math.max(1, series.length);
        d.forEach((row) => {
          const vals = splitValues(row.raw).map((x) => numberOf(x));
          if (vals.some(isNaN)) add(s, row.line, `${L}: "${row.label}: ${row.raw}" has no number. Rows are "Label: 36" (or "Label: 12, 18" with series). Thousands separators like 1,140 are fine.`);
          else if (vals.length !== per) add(s, row.line, `${L}: "${row.label}" has ${vals.length} value(s) but the chart has ${per} series. ${per > 1 ? '' : 'Add "series: A, B" for multiple values.'}`);
          if (words(row.label) > r.labelWords) add(s, row.line, `${L}: data label "${row.label}" is ${words(row.label)} words; max ${r.labelWords}.`);
        });
        if (s.fields.highlight && !d.some((row) => row.label.toLowerCase() === s.fields.highlight.toLowerCase())) add(s, s.fields._line_highlight, `${L}: highlight "${s.fields.highlight}" doesn't match any data label.`);
        if (s.fields.highlight && series.length > 1) add(s, s.fields._line_highlight, `${L}: highlight works only with one series.`);
        if (s.fields.highlight && s.fields.heading && !s.fields.heading.toLowerCase().includes(s.fields.highlight.toLowerCase().replace(/s$/, ''))) add(s, s.fields._line_highlight, `${L}: highlight "${s.fields.highlight}" isn't named in the heading. Highlight only the item the heading is about (heading "Phishing is the top cause" → highlight: Phishing). If the heading is about a trend, delete the highlight line.`);
        if (s.fields.type === 'line' && d.length < 3) add(s, s.line, `${L}: a line chart needs at least 3 points. Use a column chart.`);
      }
      const prev = S[i - 1];
      if (prev && LAYOUTS[prev.layout] && LAYOUTS[prev.layout].surface === 'brand' && spec.surface === 'brand') add(s, s.line, `${L} follows a ${prev.layout} slide. Two blue slides can't touch: put a content slide between them, or drop the ${s.layout === 'section' ? 'section' : prev.layout} slide.`);
      // A stat's label says what the number means; it doesn't say the number again.
      if (s.layout === 'stat' && s.fields.number && s.fields.label) {
        const n = (s.fields.number.match(/\d[\d,.]*/) || [''])[0].replace(/[.,]+$/, '');
        if (n && new RegExp('(^|[^\\d.,])' + n.replace(/[.,]/g, '\\$&') + '(?![\\d])').test(s.fields.label)) add(s, s.fields._line_label || s.line, `${L}: the label repeats the number. Say what ${s.fields.number} means, without the number. A qualifier like "about" or "up to" goes in the eyebrow.`);
      }
      // A list of numbers is a table in disguise.
      const listed = s.bullets.concat(s.columns.left, s.columns.right).filter((b) => /\d/.test(b.text));
      if (listed.length >= 3) add(s, listed[0].line, `${L}: ${listed.length} bullets are numbers, which is a table. Use a chart (or a stat for one number).`);
      // Don't repeat the title.
      const norm2 = (t) => String(t || '').toLowerCase().replace(/[*.,:;!?'’"“”]/g, '').replace(/\s+/g, ' ').trim();
      const titleH = S[0] && S[0].layout === 'title' ? norm2(S[0].fields.heading) : '';
      if (i > 0 && titleH && norm2(s.fields.heading) === titleH) add(s, s.fields._line_heading || s.line, `${L}: the heading repeats the title slide. Say something new, or delete this slide.`);
      // Sources and attributions come from the outline, word for word: "our pilot" may be "Intellicomp pilot", never "Intellicomp assessment".
      if (deck.header.outline) {
        const stem = (w) => w.toLowerCase().replace(/[’']s$/, '').replace(/s$/, '');
        const have = new Set((deck.header.outline.match(/[\p{L}\d][\p{L}\d’'-]*/gu) || []).map(stem));
        const SKIP = new Set(['the', 'a', 'an', 'of', 'in', 'on', 'for', 'and', 'by', 'from', 'our', 'to', 'at', 'with', 'per', 'source', 'intellicomp', 'dr', 'mr', 'm']);
        for (const k of ['source', 'name', 'role']) {
          if (!s.fields[k] || (k !== 'source' && s.layout !== 'quote')) continue;
          const extra = (s.fields[k].replace(/^source:\s*/i, '').match(/[\p{L}\d][\p{L}\d’'-]*/gu) || []).filter((w) => !SKIP.has(stem(w)) && !have.has(stem(w)) && !/\d/.test(w));
          if (extra.length) add(s, s.fields['_line_' + k] || s.line, `${L}: ${k} "${s.fields[k]}" has words the outline doesn't: ${extra.map((w) => `"${w}"`).join(', ')}. Use only the outline's own words for ${k === 'source' ? 'a source' : 'who said it'}, or leave the line out.`);
        }
      }
      if (s.layout === 'section' && S.length < 8) add(s, s.line, `${L}: section slides are for decks of 8+ slides. Use an eyebrow like "Part 2" on the next slide instead.`);
      if (prev && prev.layout === s.layout && ['stat', 'statement', 'quote', 'section'].includes(s.layout)) add(s, s.line, `${L}: a second ${s.layout} slide in a row. ${s.layout === 'stat' ? 'Show the two numbers in one bar or column chart instead. ' : ''}Put a different layout between them, or merge them.`);
      if (s.layout === 'bullets' && prev && prev.layout === 'bullets' && S[i - 2] && S[i - 2].layout === 'bullets') add(s, s.line, `${L}: three bullet slides in a row. Turn one into a statement, stat, two-column or chart.`);
    });
    out.sort((a, b) => (a.line || 0) - (b.line || 0));
    return out;
  }

  // ---------------------------------------------------------------- render (browser only)
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const trimDot = (s) => String(s || '').trim().replace(/\.$/, '');

  function fmt(v, unit) {
    const n = Number.isInteger(v) ? v.toLocaleString('en-US') : v.toLocaleString('en-US', { maximumFractionDigits: 1 });
    if (!unit) return n;
    if (/^[$€£]$/.test(unit)) return unit + n;
    if (unit === '%') return n + '%';
    return n + ' ' + unit;
  }
  function wrap(label, max) {
    const out = []; let line = '';
    for (const w of label.split(/\s+/)) { if ((line + ' ' + w).trim().length > max && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); }
    if (line) out.push(line);
    return out;
  }

  function chartSvg(s) {
    const type = (s.fields.type || 'bar').toLowerCase();
    const series = (s.fields.series || '').split(',').map((x) => x.trim()).filter(Boolean);
    const rows = s.data.map((r) => ({ label: r.label, vals: splitValues(r.raw).map(numberOf) }));
    let unit = s.fields.unit || '';
    if (!unit) { const r0 = s.data[0] ? s.data[0].raw : ''; if (/%/.test(r0)) unit = '%'; else if (/\$/.test(r0)) unit = '$'; }
    const nS = Math.max(1, series.length);
    const seqPick = { 1: [3], 2: [3, 5], 3: [2, 3, 5], 4: [2, 3, 4, 5] }[nS];
    const colorFor = (si, label) => {
      if (nS === 1) {
        if (s.fields.highlight) return label.toLowerCase() === s.fields.highlight.toLowerCase() ? 'var(--chart-highlight)' : 'var(--chart-context)';
        return 'var(--chart-categorical-1)';
      }
      return (s.fields.colors || '').toLowerCase() === 'sequential' ? `var(--chart-sequential-${seqPick[si]})` : `var(--chart-categorical-${si + 1})`;
    };
    const max = Math.max(...rows.flatMap((r) => r.vals), 0) || 1;
    const W = 1680, H = 620, parts = [];

    if (type === 'bar') {
      const labelW = 480, gap = 24, valueW = 200, plotW = W - labelW - gap - valueW;
      const rowH = Math.min(H / rows.length, 170), groupH = rowH * 0.66, barH = groupH / nS, top = (H - rowH * rows.length) / 2;
      rows.forEach((r, i) => {
        const y0 = top + i * rowH + (rowH - groupH) / 2;
        wrap(r.label, 24).forEach((ln, k, all) => parts.push(`<text class="t-label" x="${labelW}" y="${y0 + groupH / 2 + (k - (all.length - 1) / 2) * 36}" text-anchor="end" dominant-baseline="middle">${esc(ln)}</text>`));
        r.vals.forEach((v, si) => {
          const w = Math.max(4, (v / max) * plotW), y = y0 + si * barH;
          parts.push(`<rect x="${labelW + gap}" y="${y}" width="${w}" height="${barH - 6}" rx="6" fill="${colorFor(si, r.label)}"/>`);
          parts.push(`<text class="t-value" x="${labelW + gap + w + 16}" y="${y + (barH - 6) / 2}" dominant-baseline="middle">${esc(fmt(v, unit))}</text>`);
        });
      });
      parts.push(`<line class="baseline" x1="${labelW + gap}" x2="${labelW + gap}" y1="${top}" y2="${top + rows.length * rowH}"/>`);
    } else if (type === 'column') {
      const top = 56, bottom = 96, plotH = H - top - bottom, colW = W / rows.length, groupW = Math.min(colW * 0.64, 260 * nS), barW = groupW / nS;
      rows.forEach((r, i) => {
        const x0 = i * colW + (colW - groupW) / 2;
        r.vals.forEach((v, si) => {
          const h = Math.max(4, (v / max) * plotH), x = x0 + si * barW;
          parts.push(`<rect x="${x}" y="${top + plotH - h}" width="${barW - 8}" height="${h}" rx="6" fill="${colorFor(si, r.label)}"/>`);
          parts.push(`<text class="t-value" x="${x + (barW - 8) / 2}" y="${top + plotH - h - 16}" text-anchor="middle">${esc(fmt(v, unit))}</text>`);
        });
        wrap(r.label, 14).forEach((ln, k) => parts.push(`<text class="t-label" x="${i * colW + colW / 2}" y="${top + plotH + 44 + k * 36}" text-anchor="middle">${esc(ln)}</text>`));
      });
      parts.push(`<line class="baseline" x1="0" x2="${W}" y1="${top + plotH}" y2="${top + plotH}"/>`);
    } else {
      const left = 40, right = 360, top = 56, bottom = 80, plotW = W - left - right, plotH = H - top - bottom;
      const xAt = (i) => left + (rows.length === 1 ? plotW / 2 : (i / (rows.length - 1)) * plotW), yAt = (v) => top + plotH - (v / (max * 1.08)) * plotH;
      for (let si = 0; si < nS; si++) {
        const pts = rows.map((r, i) => [xAt(i), yAt(r.vals[si])]);
        parts.push(`<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${colorFor(si, '')}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>`);
        pts.forEach(([x, y], i) => {
          parts.push(`<circle cx="${x}" cy="${y}" r="10" fill="${colorFor(si, '')}"/>`);
          if (nS === 1) parts.push(`<text class="t-value" x="${x}" y="${y - 28}" text-anchor="middle">${esc(fmt(rows[i].vals[0], unit))}</text>`);
        });
        const [lx, ly] = pts[pts.length - 1], last = rows[rows.length - 1].vals[si];
        if (nS > 1) parts.push(`<text class="t-value" x="${lx + 28}" y="${ly}" dominant-baseline="middle">${esc(series[si])} ${esc(fmt(last, unit))}</text>`);
      }
      rows.forEach((r, i) => parts.push(`<text class="t-axis" x="${xAt(i)}" y="${top + plotH + 52}" text-anchor="middle">${esc(r.label)}</text>`));
      parts.push(`<line class="baseline" x1="${left}" x2="${left + plotW}" y1="${top + plotH}" y2="${top + plotH}"/>`);
    }
    const legend = nS > 1 && type !== 'line' ? `<div class="chart-legend">${series.map((n, si) => `<span><i style="background:${colorFor(si, '')}"></i>${esc(n)}</span>`).join('')}</div>` : '';
    const summary = rows.map((r) => `${r.label}: ${r.vals.map((v) => fmt(v, unit)).join(', ')}`).join('; ');
    return `${legend}<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMinYMin meet" role="img" aria-label="${esc(s.fields.heading)}. ${esc(summary)}">${parts.join('')}</svg>`;
  }

  function slideHtml(s, total, header, imageBase) {
    const f = s.fields, spec = LAYOUTS[s.layout] || { surface: 'light' };
    const eyebrow = f.eyebrow ? `<p class="eyebrow">${esc(f.eyebrow)}</p>` : '';
    let body = '';
    switch (s.layout) {
      case 'title':
        body = `<div class="logo logo-reverse" role="img" aria-label="Intellicomp Technologies"></div><div class="title-body">${eyebrow}<h1>${esc(trimDot(f.heading))}</h1>${f.subheading ? `<p class="sub">${esc(f.subheading)}</p>` : ''}<p class="meta">${esc(f.footer || [header.date, header.presenter].filter(Boolean).join(' · '))}</p></div>`;
        break;
      case 'section':
        body = `<div class="rule" aria-hidden="true"></div>${eyebrow}<h2>${esc(trimDot(f.heading))}</h2>`;
        break;
      case 'statement': {
        const h = esc(f.heading).replace(/\*([^*]+)\*/, '<em>$1</em>').replace(/\*/g, '');
        body = `${eyebrow}<h2>${h}</h2>`;
        break;
      }
      case 'bullets':
        body = `${eyebrow}<h2 class="slide-title">${esc(trimDot(f.heading))}</h2><ul class="bullets" data-count="${s.bullets.length}">${s.bullets.map((b) => `<li>${esc(trimDot(b.text))}</li>`).join('')}</ul>`;
        break;
      case 'two-column':
        body = `${eyebrow}<h2 class="slide-title">${esc(trimDot(f.heading))}</h2><div class="columns">${['left', 'right'].map((c) => `<div><h3>${esc(trimDot(f[c]))}</h3><ul class="bullets">${s.columns[c].map((b) => `<li>${esc(trimDot(b.text))}</li>`).join('')}</ul></div>`).join('')}</div>`;
        break;
      case 'stat':
        body = `${eyebrow}<p class="number">${esc(f.number)}</p><p class="label">${esc(trimDot(f.label))}</p>${f.source ? `<p class="source">Source: ${esc(f.source.replace(/^source:\s*/i, ''))}</p>` : ''}`;
        break;
      case 'quote':
        body = `<figure><div class="mark" aria-hidden="true">“</div><blockquote><p>${esc(String(f.quote || '').replace(/^["“]|["”]$/g, ''))}</p></blockquote><figcaption>${esc(f.name)}${f.role ? `<span>${esc(f.role)}</span>` : ''}</figcaption></figure>`;
        break;
      case 'image': {
        const src = f.image && !/^(none|placeholder|-)$/i.test(f.image) ? (/^(https?:|data:|\/)/.test(f.image) ? f.image : imageBase + f.image) : '';
        const media = src ? `<div class="media"><img src="${esc(src)}" alt="${esc(f.alt)}"></div>` : `<div class="media is-missing">Image needed: ${esc(f.alt)}</div>`;
        body = `${media}<div class="side">${eyebrow}${f.heading ? `<h2 class="slide-title">${esc(trimDot(f.heading))}</h2>` : ''}${f.caption ? `<p class="caption">${esc(f.caption)}</p>` : ''}</div>`;
        break;
      }
      case 'chart':
        body = `${eyebrow}<h2 class="slide-title">${esc(trimDot(f.heading))}</h2><div class="chart">${chartSvg(s)}</div>${f.source ? `<p class="chart-source">Source: ${esc(f.source.replace(/^source:\s*/i, ''))}</p>` : ''}`;
        break;
      case 'closing':
        body = `<div class="logo logo-reverse" role="img" aria-label="Intellicomp Technologies"></div><div class="closing-body"><h2>${esc(trimDot(f.heading))}</h2>${f.cta ? `<p class="cta">${esc(trimDot(f.cta))}</p>` : ''}<p class="contact">${CONTACT.map(([k, v]) => `<span><span>${k}</span>${v}</span>`).join('')}</p></div>`;
        break;
      default:
        body = `<h2 class="slide-title">Unknown layout "${esc(s.layout)}"</h2>`;
    }
    const surface = spec.surface;
    const showFooter = !['title', 'closing'].includes(s.layout);
    const footer = showFooter ? `<div class="slide-footer">${surface === 'light' ? '<div class="logo logo-color" role="img" aria-label="Intellicomp Technologies"></div>' : '<span></span>'}<span>${s.number} / ${total}</span></div>` : '';
    const notes = f.notes ? `<aside class="notes">${esc(f.notes)}</aside>` : '';
    return `<section class="slide layout-${esc(s.layout)} surface-${surface}" aria-roledescription="slide" aria-label="Slide ${s.number} of ${total}"><div class="slide-content">${body}</div>${footer}${notes}</section>`;
  }

  function mount() {
    const src = document.getElementById('deck');
    if (!src) return;
    const deck = parse(src.textContent);
    const problems = check(deck);
    document.title = deck.header.title ? `${deck.header.title} · Intellicomp` : 'Intellicomp deck';
    document.documentElement.lang = 'en';
    const base = (src.dataset.imageBase || '');
    const main = document.createElement('main');
    main.className = 'deck';
    main.innerHTML = deck.slides.map((s) => slideHtml(s, deck.slides.length, deck.header, base)).join('');
    document.body.appendChild(main);
    const slides = [...main.querySelectorAll('.slide')];
    let i = Math.min(Math.max(parseInt(location.hash.slice(1), 10) - 1 || 0, 0), slides.length - 1);

    const fit = () => {
      const scale = Math.min(innerWidth / 1920, innerHeight / 1080);
      slides.forEach((el) => el.style.setProperty('--scale', scale));
    };
    const show = (n) => {
      i = Math.min(Math.max(n, 0), slides.length - 1);
      slides.forEach((el, k) => el.classList.toggle('is-current', k === i));
      history.replaceState(null, '', '#' + (i + 1));
    };
    addEventListener('resize', fit);
    addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const k = e.key;
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); show(i + 1); }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); show(i - 1); }
      else if (k === 'Home') show(0);
      else if (k === 'End') show(slides.length - 1);
      else if (k === 'f' || k === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}); }
      else if (k === 'n' || k === 'N') document.body.classList.toggle('show-notes');
      else if (k === 'Escape') { const p = document.querySelector('.deck-problems'); if (p) p.remove(); }
    });
    main.addEventListener('click', (e) => { if (e.target.closest('a')) return; e.clientX < innerWidth / 3 ? show(i - 1) : show(i + 1); });
    fit(); show(i);

    // Auto-fit: shrink a slide one or two steps if its content overflows the safe area.
    const overflow = [];
    const settle = () => {
      slides.forEach((el, k) => {
        const box = el.querySelector('.slide-content');
        const wasCurrent = el.classList.contains('is-current');
        el.classList.add('is-current');
        for (const step of ['1', '2']) { if (box.scrollHeight <= box.clientHeight + 2 && box.scrollWidth <= box.clientWidth + 2) break; el.dataset.fit = step; }
        if (box.scrollHeight > box.clientHeight + 2 || box.scrollWidth > box.clientWidth + 2) overflow.push({ slide: { number: k + 1, layout: deck.slides[k].layout }, msg: `Slide ${k + 1} (${deck.slides[k].layout}): text doesn't fit. Shorten it.` });
        if (!wasCurrent) el.classList.remove('is-current');
      });
      document.body.dataset.ready = 'true';
      const all = problems.concat(overflow);
      root.__deck = { slides: deck.slides.length, problems: all };
      if (all.length) {
        const panel = document.createElement('div');
        panel.className = 'deck-problems';
        panel.setAttribute('role', 'alert');
        panel.innerHTML = `<strong>This deck breaks ${all.length} rule${all.length > 1 ? 's' : ''}.</strong> Press Esc to hide this and present anyway, or ask Copilot to fix these:<ol>${all.map((p) => `<li>${esc(p.msg)}${p.line ? ` <em>(deck line ${p.line})</em>` : ''}</li>`).join('')}</ol>`;
        document.body.appendChild(panel);
      }
    };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(settle));
  }

  const api = { parse, check, LAYOUTS, HEADER, CONTACT };
  root.IntellicompDeck = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);

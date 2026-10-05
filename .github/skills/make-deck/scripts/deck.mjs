#!/usr/bin/env node
// Check a deck, then open it for presenting.
//
//   node .github/skills/make-deck/scripts/deck.mjs slides/<file>.html            check, then open
//   node .github/skills/make-deck/scripts/deck.mjs slides/<file>.html --no-open  check only
//   node .github/skills/make-deck/scripts/deck.mjs slides/<file>.html --export   also write slides/export/<file>.html (one self-contained file to share)
//   node .github/skills/make-deck/scripts/deck.mjs slides/<file>.html --pptx     also write slides/export/<file>.pptx (needs `npm install` once)
//
// Exit code 0 = no problems. 1 = problems (listed, with line numbers). The deck opens only when it passes.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(SKILL, '../../..');
const RUNTIME = path.join(SKILL, 'runtime');
const { parse, check, CONTACT } = createRequire(import.meta.url)(path.join(RUNTIME, 'deck.js'));

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const flag = (f) => args.includes(f);
if (!file) { console.log('Usage: node .github/skills/make-deck/scripts/deck.mjs slides/<file>.html [--no-open] [--export] [--pptx]'); process.exit(1); }
const deckPath = path.resolve(file);
if (!fs.existsSync(deckPath)) { console.log(`✗ ${file} doesn't exist. Copy .github/skills/make-deck/template.html to that path first.`); process.exit(1); }

let html = fs.readFileSync(deckPath, 'utf8');
const block = html.match(/<script type="text\/plain" id="deck">([\s\S]*?)<\/script>/);
if (!block) { console.log(`✗ ${file} has no deck block. It must contain <script type="text/plain" id="deck"> … </script>. Start again from .github/skills/make-deck/template.html.`); process.exit(1); }

// Make sure the deck links the runtime with the right relative path, wherever the file lives.
const rel = (p) => path.relative(path.dirname(deckPath), p).split(path.sep).join('/');
const cssTag = `<link rel="stylesheet" href="${rel(path.join(RUNTIME, 'slides.css'))}">`;
const jsTag = `<script src="${rel(path.join(RUNTIME, 'deck.js'))}"></script>`;
const hasRight = html.includes(cssTag) && html.includes(jsTag);
if (!hasRight) {
  html = html
    .replace(/<link[^>]*slides\.css[^>]*>\n?/g, '')
    .replace(/<script[^>]*deck\.js[^>]*><\/script>\n?/g, '')
    .replace(/<\/head>/i, `${cssTag}\n${jsTag}\n</head>`);
  fs.writeFileSync(deckPath, html);
  console.log('• Fixed the links to the slide runtime.');
}

const source = block[1];
const deck = parse(source);
const problems = check(deck);
const lineOffset = html.slice(0, html.indexOf(block[0])).split('\n').length; // file line where the block starts

if (problems.length) {
  console.log(`✗ ${file}: ${problems.length} problem${problems.length > 1 ? 's' : ''}. Fix each one in the deck block, then run this command again.\n`);
  problems.forEach((p, i) => console.log(`${String(i + 1).padStart(2)}. ${p.line ? `line ${p.line + lineOffset - 1}: ` : ''}${p.msg}`));
  process.exit(1);
}
console.log(`✓ ${file}: ${deck.slides.length} slides, no problems.`);

// ---------------------------------------------------------------- export (self-contained HTML)
const mime = (p) => ({ '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif', '.otf': 'font/otf', '.woff2': 'font/woff2' })[path.extname(p).toLowerCase()] || 'application/octet-stream';
const dataUri = (p) => `data:${mime(p)};base64,${fs.readFileSync(p).toString('base64')}`;
const outDir = path.join(path.dirname(deckPath), 'export');
const base = path.basename(deckPath, '.html');

if (flag('--export')) {
  let css = fs.readFileSync(path.join(RUNTIME, 'slides.css'), 'utf8');
  css = css.replace(/@import url\("([^"]+)"\);/g, (_, p) => fs.readFileSync(path.resolve(RUNTIME, p), 'utf8'));
  css = css.replace(/url\("(\.\.\/[^"]+)"\)/g, (_, p) => `url("${dataUri(path.resolve(RUNTIME, p))}")`);
  const js = fs.readFileSync(path.join(RUNTIME, 'deck.js'), 'utf8');
  // The shared copy drops the outline (the presenter's raw notes) and inlines images.
  const src = source.replace(/^outline:[\s\S]*?(?=^-{3,})/m, '').replace(/^(\s*image\s*:\s*)(\S.*)$/gim, (m, k, v) => {
    const p = path.resolve(path.dirname(deckPath), v.trim());
    return /^(https?:|data:)/.test(v.trim()) || !fs.existsSync(p) ? m : k + dataUri(p);
  });
  const out = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${deck.header.title}</title>\n<style>\n${css}\n</style>\n<script>\n${js}\n</script>\n</head>\n<body>\n<script type="text/plain" id="deck">${src}</script>\n</body>\n</html>\n`;
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, base + '.html'), out);
  console.log(`✓ Self-contained copy: ${path.relative(process.cwd(), path.join(outDir, base + '.html'))} (${(out.length / 1024).toFixed(0)} KB). For a PDF, open it and print to PDF.`);
}

// ---------------------------------------------------------------- pptx (handouts)
if (flag('--pptx')) {
  let PptxGenJS;
  try { PptxGenJS = (await import('pptxgenjs')).default; }
  catch { console.log('✗ PowerPoint export needs one-time setup: run `npm install` in the repo folder, then try again.'); process.exit(1); }
  const T = JSON.parse(fs.readFileSync(path.join(ROOT, 'tokens/tokens.flat.json'), 'utf8'));
  const hex = (name) => { let v = T[name]; while (v && v.startsWith('var(')) v = T[v.slice(6, -1)]; return v.replace('#', '').slice(0, 6); };
  const C = { white: 'FFFFFF', ink: hex('blue-950'), head: hex('blue-800'), brand: hex('blue-500'), deep: hex('blue-900'), orange: hex('orange-500'), sky: hex('blue-300'), muted: hex('neutral-600'), mutedDark: hex('blue-200'), link: hex('blue-600') };
  const pt = (px) => px / 2, inch = (px) => px / 144, FONT = 'Aileron';
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = deck.header.title;
  const logo = (s, kind, x, y, w) => s.addImage({ path: path.join(ROOT, `assets/logo/intellicomp-${kind}.png`), x: inch(x), y: inch(y), w: inch(w), h: inch(w * 183 / 720) });
  const text = (s, t, o) => s.addText(t, { fontFace: FONT, margin: 0, valign: 'top', ...o, x: inch(o.x), y: inch(o.y), w: inch(o.w), h: inch(o.h), fontSize: pt(o.fontSize) });
  const bulletsOf = (list, color) => list.map((b) => ({ text: b.text.replace(/\.$/, ''), options: { bullet: { code: '25CF', indent: 28 }, color, paraSpaceAfter: 14 } }));
  const X = 120, Wd = 1680;
  deck.slides.forEach((sl, idx) => {
    const f = sl.fields, s = pres.addSlide();
    const surface = { title: 'brand', section: 'brand', closing: 'brand', statement: 'deep', stat: 'deep', quote: 'deep' }[sl.layout] || 'light';
    s.background = { color: surface === 'brand' ? C.brand : surface === 'deep' ? C.deep : C.white };
    if (f.notes) s.addNotes(f.notes);
    const eyebrow = (y) => f.eyebrow && text(s, f.eyebrow.toUpperCase(), { x: X, y, w: Wd, h: 40, fontSize: 28, bold: true, color: surface === 'deep' ? C.sky : surface === 'brand' ? C.white : C.link, charSpacing: 2 });
    if (sl.layout === 'title') { logo(s, 'light-color', X, 96, 400); eyebrow(520); text(s, f.heading, { x: X, y: 580, w: 1560, h: 260, fontSize: 112, bold: true, color: C.white, valign: 'bottom' }); if (f.subheading) text(s, f.subheading, { x: X, y: 860, w: 1400, h: 70, fontSize: 48, color: C.white }); }
    else if (sl.layout === 'section') { eyebrow(380); s.addShape(pres.ShapeType.roundRect, { x: inch(X), y: inch(440), w: inch(120), h: inch(8), fill: { color: C.orange }, rectRadius: 0.03 }); text(s, f.heading, { x: X, y: 480, w: 1500, h: 240, fontSize: 88, bold: true, color: C.white }); }
    else if (sl.layout === 'statement') { eyebrow(300); const runs = f.heading.split(/(\*[^*]+\*)/).filter(Boolean).map((t) => ({ text: t.replace(/\*/g, ''), options: { color: /^\*/.test(t) ? C.orange : C.white } })); text(s, runs, { x: X, y: 360, w: 1560, h: 400, fontSize: 88, bold: true, valign: 'middle' }); }
    else if (sl.layout === 'bullets') { eyebrow(96); text(s, f.heading, { x: X, y: 150, w: 1500, h: 90, fontSize: 64, bold: true, color: C.head }); text(s, bulletsOf(sl.bullets, C.ink), { x: X, y: 320, w: 1400, h: 600, fontSize: 40 }); }
    else if (sl.layout === 'two-column') {
      eyebrow(96); text(s, f.heading, { x: X, y: 150, w: 1500, h: 90, fontSize: 64, bold: true, color: C.head });
      ['left', 'right'].forEach((c, k) => { const x = X + k * 904; text(s, f[c], { x, y: 320, w: 776, h: 70, fontSize: 48, bold: true, color: C.head }); s.addShape(pres.ShapeType.rect, { x: inch(x), y: inch(400), w: inch(776), h: inch(6), fill: { color: C.orange } }); text(s, bulletsOf(sl.columns[c], C.ink), { x, y: 440, w: 776, h: 500, fontSize: 40 }); });
    }
    else if (sl.layout === 'stat') { eyebrow(200); text(s, f.number, { x: X, y: 260, w: 1680, h: 260, fontSize: 220, bold: true, color: C.orange }); text(s, f.label, { x: X, y: 560, w: 1300, h: 140, fontSize: 48, color: C.white }); if (f.source) text(s, 'Source: ' + f.source, { x: X, y: 760, w: 1300, h: 40, fontSize: 28, color: C.mutedDark }); }
    else if (sl.layout === 'quote') { text(s, '“', { x: X, y: 160, w: 200, h: 160, fontSize: 240, bold: true, color: C.orange }); text(s, f.quote.replace(/^["“]|["”]$/g, ''), { x: X, y: 330, w: 1500, h: 380, fontSize: 64, color: C.white }); text(s, [{ text: f.name, options: { bold: true, breakLine: true } }, { text: f.role || '', options: { fontSize: 16, color: C.mutedDark } }], { x: X, y: 760, w: 1500, h: 120, fontSize: 48, color: C.white }); }
    else if (sl.layout === 'image') { const p = path.resolve(path.dirname(deckPath), f.image || ''); if (f.image && fs.existsSync(p)) s.addImage({ path: p, x: inch(X), y: inch(96), w: inch(1000), h: inch(888), sizing: { type: 'contain', w: inch(1000), h: inch(888) } }); if (f.heading) text(s, f.heading, { x: 1216, y: 300, w: 584, h: 200, fontSize: 64, bold: true, color: C.head }); if (f.caption) text(s, f.caption, { x: 1216, y: 520, w: 584, h: 300, fontSize: 40, color: C.ink }); }
    else if (sl.layout === 'chart') {
      // Drawn with native shapes (not a PowerPoint chart object): renders the same in PowerPoint, Keynote and Google Slides.
      eyebrow(96); text(s, f.heading, { x: X, y: 150, w: 1500, h: 90, fontSize: 64, bold: true, color: C.head });
      const series = (f.series || '').split(',').map((x) => x.trim()).filter(Boolean), nS = Math.max(1, series.length);
      const num = (r) => parseFloat(String(r).replace(/,/g, '').match(/-?\d+(\.\d+)?/)[0]);
      const rows = sl.data.map((r) => ({ label: r.label, vals: r.raw.split(/\s*;\s*|,\s+/).map(num) }));
      let unit = f.unit || ''; if (!unit) { const r0 = sl.data[0].raw; unit = /%/.test(r0) ? '%' : /\$/.test(r0) ? '$' : ''; }
      const fmtv = (v) => { const n = Number.isInteger(v) ? v.toLocaleString('en-US') : v.toLocaleString('en-US', { maximumFractionDigits: 1 }); return !unit ? n : /^[$€£]$/.test(unit) ? unit + n : unit === '%' ? n + '%' : n + ' ' + unit; };
      const seq = { 1: [3], 2: [3, 5], 3: [2, 3, 5], 4: [2, 3, 4, 5] }[nS];
      const col = (si, label) => nS === 1 ? (f.highlight ? hex(label.toLowerCase() === f.highlight.toLowerCase() ? 'chart-highlight' : 'chart-context') : hex('chart-categorical-1')) : hex((f.colors || '').toLowerCase() === 'sequential' ? `chart-sequential-${seq[si]}` : `chart-categorical-${si + 1}`);
      const max = Math.max(...rows.flatMap((r) => r.vals), 0) || 1, OX = X, OY = 300, W = 1680, H = 600, type = (f.type || 'bar').toLowerCase();
      const rect = (x, y, w, h, c) => s.addShape(pres.ShapeType.rect, { x: inch(OX + x), y: inch(OY + y), w: inch(w), h: inch(h), fill: { color: c }, line: { color: c, width: 0 } });
      const line = (x1, y1, x2, y2, c, wpx) => s.addShape(pres.ShapeType.line, { x: inch(OX + Math.min(x1, x2)), y: inch(OY + Math.min(y1, y2)), w: inch(Math.max(Math.abs(x2 - x1), 0.5)), h: inch(Math.max(Math.abs(y2 - y1), 0.5)), flipV: (y2 < y1) !== (x2 < x1), line: { color: c, width: wpx / 2 } });
      const label = (t, x, y, w, o = {}) => text(s, t, { x: OX + x, y: OY + y, w, h: 44, fontSize: 32, color: C.ink, ...o });
      if (nS > 1 && type !== 'line') text(s, series.map((n, si) => ({ text: '■ ', options: { color: col(si, '') } })).flatMap((sq, si) => [sq, { text: series[si] + '      ', options: { color: C.ink } }]), { x: OX, y: OY - 52, w: W, h: 40, fontSize: 28, bold: true });
      if (type === 'bar') {
        const labelW = 480, gap = 24, plotW = W - labelW - gap - 200, rowH = Math.min(H / rows.length, 130), groupH = rowH * 0.7, barH = groupH / nS;
        rows.forEach((r, i) => { const y0 = i * rowH + (rowH - groupH) / 2; label(r.label, 0, y0 + groupH / 2 - 22, labelW - 16, { align: 'right' });
          r.vals.forEach((v, si) => { const w = Math.max(4, (v / max) * plotW), y = y0 + si * barH; rect(labelW + gap, y, w, barH - 6, col(si, r.label)); label(fmtv(v), labelW + gap + w + 16, y + (barH - 6) / 2 - 22, 220, { bold: true }); }); });
        line(labelW + gap, 0, labelW + gap, rows.length * rowH, hex('neutral-400'), 2);
      } else if (type === 'column') {
        const top = 56, plotH = H - top - 96, colW = W / rows.length, groupW = Math.min(colW * 0.64, 260 * nS), barW = groupW / nS;
        rows.forEach((r, i) => { const x0 = i * colW + (colW - groupW) / 2;
          r.vals.forEach((v, si) => { const h = Math.max(4, (v / max) * plotH), x = x0 + si * barW; rect(x, top + plotH - h, barW - 8, h, col(si, r.label)); label(fmtv(v), x - 40, top + plotH - h - 52, barW + 72, { align: 'center', bold: true }); });
          label(r.label, i * colW, top + plotH + 16, colW, { align: 'center', h: 80 }); });
        line(0, top + plotH, W, top + plotH, hex('neutral-400'), 2);
      } else {
        const left = 40, top = 56, plotW = W - left - 360, plotH = H - top - 80;
        const xAt = (i) => left + (rows.length === 1 ? plotW / 2 : (i / (rows.length - 1)) * plotW), yAt = (v) => top + plotH - (v / (max * 1.08)) * plotH;
        for (let si = 0; si < nS; si++) {
          const pts = rows.map((r, i) => [xAt(i), yAt(r.vals[si])]);
          pts.slice(1).forEach(([x, y], k) => line(pts[k][0], pts[k][1], x, y, col(si, ''), 6));
          pts.forEach(([x, y], i) => { s.addShape(pres.ShapeType.ellipse, { x: inch(OX + x - 10), y: inch(OY + y - 10), w: inch(20), h: inch(20), fill: { color: col(si, '') }, line: { color: col(si, ''), width: 0 } }); if (nS === 1) label(fmtv(rows[i].vals[0]), x - 110, y - 64, 220, { align: 'center', bold: true }); });
          if (nS > 1) { const [lx, ly] = pts[pts.length - 1]; label(`${series[si]} ${fmtv(rows[rows.length - 1].vals[si])}`, lx + 28, ly - 22, 330, { bold: true }); }
        }
        rows.forEach((r, i) => label(r.label, xAt(i) - 110, top + plotH + 24, 220, { align: 'center', fontSize: 28, color: C.muted }));
        line(left, top + plotH, left + plotW, top + plotH, hex('neutral-400'), 2);
      }
      if (f.source) text(s, 'Source: ' + f.source, { x: X, y: 940, w: Wd, h: 40, fontSize: 28, color: C.muted });
    }
    else if (sl.layout === 'closing') { logo(s, 'light-color', X, 96, 400); text(s, f.heading, { x: X, y: 480, w: 1500, h: 200, fontSize: 88, bold: true, color: C.white, valign: 'bottom' }); if (f.cta) text(s, f.cta, { x: X, y: 720, w: 700, h: 100, fontSize: 48, bold: true, color: C.ink, fill: { color: C.orange }, align: 'center', valign: 'middle' }); text(s, CONTACT.map(([k, v]) => `${k}: ${v}`).join('     '), { x: X, y: 880, w: Wd, h: 60, fontSize: 36, color: C.white }); }
    if (!['title', 'closing'].includes(sl.layout)) { if (surface === 'light') logo(s, 'color', X, 1000, 160); text(s, `${idx + 1} / ${deck.slides.length}`, { x: 1500, y: 1000, w: 300, h: 40, fontSize: 28, color: surface === 'light' ? C.muted : C.mutedDark, align: 'right' }); }
  });
  fs.mkdirSync(outDir, { recursive: true });
  await pres.writeFile({ fileName: path.join(outDir, base + '.pptx') });
  console.log(`✓ PowerPoint copy: ${path.relative(process.cwd(), path.join(outDir, base + '.pptx'))}. It uses Aileron: install fonts/aileron/*.otf on the computer that opens it, or it falls back to a default font.`);
}

// ---------------------------------------------------------------- open
if (!flag('--no-open')) {
  const target = deckPath;
  const [cmd, cmdArgs] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', `"${target}"`]] : process.platform === 'darwin' ? ['open', [target]] : ['xdg-open', [target]];
  spawn(cmd, cmdArgs, { detached: true, stdio: 'ignore', windowsVerbatimArguments: process.platform === 'win32' }).unref();
  console.log('✓ Opened in the browser. Present: F = full screen, → / ← = next / previous, N = speaker notes.');
}

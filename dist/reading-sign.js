// The "Prefer reading instead of playing?" sign is painted exactly like the
// cabin billboards (World.paintSign): the same walnut planks and notched
// outline, moonlit bevel, iron nails, moss along the top, two gooseneck
// lamps and the billboards' own 5×7 letters with a hard shadow, on the
// village's art-pixel grid (one canvas pixel per art pixel). The link and
// its words stay in the page for keyboards, screen readers and readers
// without scripts; only their paint is replaced. CSS keeps the sign's size,
// so painting never moves anything.
import { GLYPHS } from "./world.js";

const LAMP = 7; // art pixels the lamps rise above the board
const HEADLINE = ["#fffbea", "#fffbea", "#ffe7b4", "#ffe7b4", "#ffe7b4", "#f4c886", "#f4c886"],
  DETAIL = ["#f4c886", "#f4c886", "#f4c886", "#e0a868", "#e0a868", "#c98f52", "#c98f52"];

function seeded(seed) {
  let value = seed >>> 0;
  return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const glyphWidth = (ch) => (ch === " " ? 2 : (GLYPHS[ch]?.[0].length ?? 5));
const lineWidth = (line) => [...line].reduce((w, ch) => w + glyphWidth(ch) + 1, -1);

// Greedy word wrap into lines no wider than `room` art pixels.
function wrap(text, room) {
  const lines = [];
  for (const word of text.split(" ")) {
    const last = lines.at(-1);
    if (last && lineWidth(`${last} ${word}`) <= room) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

// The fewest lines that fit: the question first, the invitation below it
// in a dimmer tone, both centred on the board. The lettering keeps four art
// pixels clear of the face on every side; `cols` and `rows` report the
// board the words need when the given one is too small.
const MARGIN = 6;
export function layoutSign(headline, detail, cols, rows) {
  const room = cols - MARGIN * 2,
    head = wrap(headline, room),
    sub = wrap(detail, room),
    height = (head.length + sub.length) * 9 - 2 + 3,
    widest = Math.max(...[...head, ...sub].map(lineWidth));
  return {
    head,
    sub,
    height,
    cols: Math.max(cols, widest + MARGIN * 2),
    rows: Math.max(rows, height + MARGIN * 2 - 2),
  };
}

export function paintReadingSign(canvas, { cols, rows, headline, detail, seed = 7 }) {
  canvas.width = cols;
  canvas.height = rows + LAMP;
  const c = canvas.getContext("2d");
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, canvas.width, canvas.height);
  const px = (x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y) + LAMP, Math.round(w), Math.round(h));
  };
  const rand = seeded(seed);
  // Dark outline with notched corners.
  px(1, 0, cols - 2, 1, "#241b12");
  px(1, rows - 1, cols - 2, 1, "#241b12");
  px(0, 1, 1, rows - 2, "#241b12");
  px(cols - 1, 1, 1, rows - 2, "#241b12");
  // Bevelled frame: moonlit top edge, darker underside.
  px(1, 1, cols - 2, 1, "#b0703e");
  px(1, 2, 1, rows - 3, "#8a4c2a");
  px(cols - 2, 2, 1, rows - 3, "#3c201e");
  px(2, rows - 2, cols - 3, 1, "#3c201e");
  // Plank face, brightest under the two lamps and dimming away from them in
  // the billboards' stepped bands.
  const lamps = [Math.round(cols * 0.22), Math.round(cols * 0.78)],
    reachX = Math.max(10, cols * 0.34),
    reachY = Math.max(9, rows * 0.95);
  for (let y = 2; y < rows - 2; y++)
    for (let x = 2; x < cols - 2; x++) {
      const light = Math.min(...lamps.map((lx) => Math.hypot((x - lx) / reachX, (y - 1) / reachY)));
      px(x, y, 1, 1, light < 0.3 ? "#a0582e" : light < 0.62 ? "#86442a" : light < 0.92 ? "#6e3622" : "#5c2d1f");
    }
  // Plank seams with staggered joints, and a little grain.
  for (let seam = 5; seam < rows - 3; seam += 4) {
    px(2, seam, cols - 4, 1, "#4b241e");
    const joint = 4 + Math.floor(rand() * (cols - 10));
    px(joint, seam - 3, 1, 3, "#4b241e");
  }
  for (let i = 0; i < (cols * rows) / 45; i++)
    px(3 + Math.floor(rand() * (cols - 7)), 3 + Math.floor(rand() * (rows - 6)), 2, 1, "#6e3622");
  // Iron nails at the corners.
  for (const [x, y] of [
    [2, 2],
    [cols - 3, 2],
    [2, rows - 3],
    [cols - 3, rows - 3],
  ])
    px(x, y, 1, 1, "#c9ad7a");
  // Painted letters with a dark drop shadow, centred line by line.
  const { head, sub, height } = layoutSign(headline, detail, cols, rows),
    lines = [...head.map((text) => [text, HEADLINE]), ...sub.map((text) => [text, DETAIL])];
  for (const pass of [0, 1]) {
    let top = Math.round((rows - height) / 2);
    lines.forEach(([text, tones], index) => {
      let cursor = Math.round((cols - lineWidth(text)) / 2);
      for (const ch of text) {
        GLYPHS[ch]?.forEach((row, gy) => {
          for (let gx = 0; gx < row.length; gx++)
            if (row[gx] === "#")
              pass ? px(cursor + gx, top + gy, 1, 1, tones[gy]) : px(cursor + gx + 1, top + gy + 1, 1, 1, "#2b1f14");
        });
        cursor += glyphWidth(ch) + 1;
      }
      top += index === head.length - 1 ? 12 : 9;
    });
  }
  // Moss creeping over the top edge.
  for (let i = 0; i < cols / 5; i++) {
    const x = 1 + Math.floor(rand() * (cols - 4)),
      span = 1 + Math.floor(rand() * 3);
    px(x, 0, span, 1, "#3f5a2e");
    if (rand() < 0.6) px(x + (span > 1 ? 1 : 0), -1, 1, 1, "#5d7d3c");
  }
  // Two gooseneck lamps lean over the top edge and light the lettering.
  for (const [lx, dir] of [
    [lamps[0] - 3, 1],
    [lamps[1] + 3, -1],
  ]) {
    px(lx, -5, 1, 5, "#1b1418");
    px(dir > 0 ? lx : lx - 3, -6, 4, 1, "#1b1418");
    px(dir > 0 ? lx + 2 : lx - 5, -6, 4, 2, "#24151a");
    px(dir > 0 ? lx + 2 : lx - 4, -4, 3, 1, "#fff1b8");
  }
}

// Paints the sign behind its link and repaints whenever the board resizes.
export function mountReadingSign(link, journey) {
  const canvas = document.createElement("canvas");
  canvas.className = "sign-paint";
  canvas.setAttribute("aria-hidden", "true");
  link.prepend(canvas);
  const headline = link.querySelector("strong").textContent.trim().toUpperCase(),
    detail = link.querySelector(".billboard-detail").textContent.trim().toUpperCase();
  let signature = "";
  function paint() {
    // Start from the size CSS gives the board, then grow it only as far as
    // its words need. Where the board is placed in the village, it grows
    // about its own middle so it keeps its spot under the fountain.
    link.style.minWidth = link.style.minHeight = link.style.marginTop = "";
    let width = link.offsetWidth,
      height = link.offsetHeight;
    if (!width || !height) return;
    const cp = Math.max(2, journey.getBoundingClientRect().width / 480),
      style = getComputedStyle(link),
      need = layoutSign(headline, detail, Math.round(width / cp), Math.round(height / cp));
    if (need.cols * cp > width + 0.5) link.style.minWidth = `${Math.ceil(need.cols * cp)}px`;
    if (need.rows * cp > height + 0.5) {
      const grown = Math.ceil(need.rows * cp);
      link.style.minHeight = `${grown}px`;
      if (style.position === "absolute") link.style.marginTop = `${-Math.round((grown - height) / 2)}px`;
    }
    width = link.offsetWidth;
    height = link.offsetHeight;
    const cols = Math.round(width / cp),
      rows = Math.round(height / cp),
      next = `${cols}|${rows}|${width}|${height}`;
    if (next === signature) return;
    signature = next;
    paintReadingSign(canvas, { cols, rows, headline, detail });
    // The canvas covers the board's border box, plus the lamps above it.
    Object.assign(canvas.style, {
      left: `${-parseFloat(style.borderLeftWidth)}px`,
      top: `${-parseFloat(style.borderTopWidth) - (LAMP * height) / rows}px`,
      width: `${width}px`,
      height: `${height + (LAMP * height) / rows}px`,
    });
    link.parentElement.classList.add("is-painted");
  }
  paint();
  new ResizeObserver(paint).observe(link);
  return paint;
}

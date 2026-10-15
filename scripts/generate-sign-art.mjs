// Paints the "Prefer reading instead of playing?" sign once, the way the
// world paints its cabin billboards (World.paintSign): walnut planks under a
// notched outline, a moonlit bevel, iron nails, moss, two gooseneck lamps,
// timber posts and the billboards' own 5×7 letters with a hard shadow, plus
// a 3×5 face for the smaller line. Each art pixel is one SVG unit, so CSS
// shows the sign at a fixed art-pixel scale with crisp edges and nothing is
// measured or repainted at runtime. Run after changing the sign's words.
import fs from "node:fs/promises";
import { GLYPHS } from "../dist/world.js";

const SMALL = {
  A: [".#.", "#.#", "###", "#.#", "#.#"],
  B: ["##.", "#.#", "##.", "#.#", "##."],
  D: ["##.", "#.#", "#.#", "#.#", "##."],
  E: ["###", "#..", "##.", "#..", "###"],
  F: ["###", "#..", "##.", "#..", "#.."],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  L: ["#..", "#..", "#..", "#..", "###"],
  M: ["#...#", "##.##", "#.#.#", "#...#", "#...#"],
  O: [".#.", "#.#", "#.#", "#.#", ".#."],
  P: ["##.", "#.#", "##.", "#..", "#.."],
  R: ["##.", "#.#", "##.", "#.#", "#.#"],
  T: ["###", ".#.", ".#.", ".#.", ".#."],
  W: ["#...#", "#...#", "#.#.#", "##.##", "#...#"],
  Y: ["#.#", "#.#", ".#.", ".#.", ".#."],
  ".": [".", ".", ".", ".", "#"],
};
const HEAD = ["#fffbea", "#fffbea", "#ffe7b4", "#ffe7b4", "#ffe7b4", "#f4c886", "#f4c886"],
  SUB = ["#f4c886", "#f4c886", "#e0a868", "#e0a868", "#c98f52"];
const LAMP = 7,
  POST = 8,
  MARGIN = 6;

const width = (font, text) => [...text].reduce((w, ch) => w + (ch === " " ? 2 : font[ch][0].length) + 1, -1);

function seeded(seed) {
  let value = seed >>> 0;
  return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function paint({ head, sub }) {
  const cols = Math.max(...head.map((t) => width(GLYPHS, t)), ...sub.map((t) => width(SMALL, t))) + MARGIN * 2;
  const textTop = 5,
    subTop = textTop + head.length * 9 + 2,
    rows = subTop + sub.length * 7 - 2 + 1 + 3 + 2;
  const height = LAMP + rows + POST,
    grid = Array.from({ length: height }, () => new Array(cols).fill(null));
  const px = (x, y, w, h, color) => {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++)
        if (xx >= 0 && xx < cols && yy + LAMP >= 0 && yy + LAMP < height) grid[yy + LAMP][xx] = color;
  };
  const rand = seeded(7);
  // Timber posts first, so the board overlaps their tops.
  for (const x of [8, cols - 10]) {
    px(x + 1, rows, 2, POST - 1, "#2a2016");
    px(x, rows, 2, POST - 1, "#4a3824");
    px(x, rows, 1, POST - 1, "#6b5234");
    px(x - 1, rows + POST - 1, 5, 1, "#2c2722");
  }
  px(1, rows, cols - 2, 1, "#1d1710");
  // Dark outline with notched corners and a bevelled frame.
  px(1, 0, cols - 2, 1, "#241b12");
  px(1, rows - 1, cols - 2, 1, "#241b12");
  px(0, 1, 1, rows - 2, "#241b12");
  px(cols - 1, 1, 1, rows - 2, "#241b12");
  px(1, 1, cols - 2, 1, "#b0703e");
  px(1, 2, 1, rows - 3, "#8a4c2a");
  px(cols - 2, 2, 1, rows - 3, "#3c201e");
  px(2, rows - 2, cols - 3, 1, "#3c201e");
  // Plank face, brightest under the two lamps in the billboards' bands.
  const lamps = [Math.round(cols * 0.22), Math.round(cols * 0.78)],
    reachX = cols * 0.34,
    reachY = rows * 0.95;
  for (let y = 2; y < rows - 2; y++)
    for (let x = 2; x < cols - 2; x++) {
      const light = Math.min(...lamps.map((lx) => Math.hypot((x - lx) / reachX, (y - 1) / reachY)));
      px(x, y, 1, 1, light < 0.3 ? "#a0582e" : light < 0.62 ? "#86442a" : light < 0.92 ? "#6e3622" : "#5c2d1f");
    }
  for (let seam = 5; seam < rows - 3; seam += 4) {
    px(2, seam, cols - 4, 1, "#4b241e");
    px(4 + Math.floor(rand() * (cols - 10)), seam - 3, 1, 3, "#4b241e");
  }
  for (let i = 0; i < (cols * rows) / 45; i++)
    px(3 + Math.floor(rand() * (cols - 7)), 3 + Math.floor(rand() * (rows - 6)), 2, 1, "#6e3622");
  for (const [x, y] of [
    [2, 2],
    [cols - 3, 2],
    [2, rows - 3],
    [cols - 3, rows - 3],
  ])
    px(x, y, 1, 1, "#c9ad7a");
  // Lettering: shadows first, then the lit faces, each line centred.
  const lines = [
    ...head.map((text, i) => [text, GLYPHS, HEAD, textTop + i * 9]),
    ...sub.map((text, i) => [text, SMALL, SUB, subTop + i * 7]),
  ];
  for (const pass of [0, 1])
    for (const [text, font, tones, top] of lines) {
      let cursor = Math.round((cols - width(font, text)) / 2);
      for (const ch of text) {
        if (ch !== " ")
          font[ch].forEach((row, gy) => {
            for (let gx = 0; gx < row.length; gx++)
              if (row[gx] === "#")
                pass ? px(cursor + gx, top + gy, 1, 1, tones[gy]) : px(cursor + gx + 1, top + gy + 1, 1, 1, "#2b1f14");
          });
        cursor += (ch === " " ? 2 : font[ch][0].length) + 1;
      }
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
  return { cols, height, grid };
}

// One path per colour, one horizontal run per command.
function svg({ cols, height, grid }) {
  const runs = new Map();
  grid.forEach((row, y) => {
    for (let x = 0; x < cols; ) {
      const color = row[x];
      let end = x + 1;
      while (end < cols && row[end] === color) end++;
      if (color) runs.set(color, `${runs.get(color) || ""}M${x} ${y}h${end - x}v1h-${end - x}z`);
      x = end;
    }
  });
  const paths = [...runs].map(([color, d]) => `<path fill="${color}" d="${d}"/>`).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cols}" height="${height}" viewBox="0 0 ${cols} ${height}" shape-rendering="crispEdges">\n${paths}\n</svg>\n`;
}

const signs = {
  "reading-sign.svg": { head: ["PREFER READING", "INSTEAD OF PLAYING?"], sub: ["READ MY PORTFOLIO BELOW."] },
  "reading-sign-compact.svg": { head: ["PREFER READING", "INSTEAD OF", "PLAYING?"], sub: ["READ MY PORTFOLIO", "BELOW."] },
};
for (const [file, words] of Object.entries(signs)) {
  const art = paint(words);
  await fs.writeFile(new URL(`../dist/art/${file}`, import.meta.url), svg(art));
  console.log(`${file}: ${art.cols} × ${art.height} art pixels`);
}

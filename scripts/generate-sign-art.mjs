// Paints the board of the "Prefer reading instead of playing?" sign once,
// the way the world paints its cabin billboards (World.paintSign): walnut
// planks under a notched outline, a moonlit bevel, iron nails, moss, two
// gooseneck lamps and timber posts, one step dimmer than the cabins' boards
// so the sign reads as a quiet second choice. Its words are real text laid
// over it in the page, in the site's mixed-case pixel face. Each art pixel
// is one SVG unit, so CSS shows the board at a fixed art-pixel scale with
// crisp edges and nothing is measured or repainted at runtime.
import fs from "node:fs/promises";

const LAMP = 7,
  POST = 6;
export const BOARD = { cols: 92, rows: 27 };

function seeded(seed) {
  let value = seed >>> 0;
  return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function paint({ cols, rows }) {
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
  // Plank face, warmest under the two lamps in the billboards' bands, one
  // step dimmer than the cabins' boards.
  const lamps = [Math.round(cols * 0.22), Math.round(cols * 0.78)],
    reachX = cols * 0.34,
    reachY = rows * 0.95;
  for (let y = 2; y < rows - 2; y++)
    for (let x = 2; x < cols - 2; x++) {
      const light = Math.min(...lamps.map((lx) => Math.hypot((x - lx) / reachX, (y - 1) / reachY)));
      px(x, y, 1, 1, light < 0.4 ? "#86442a" : light < 0.8 ? "#6e3622" : "#5c2d1f");
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
    px(dir > 0 ? lx + 2 : lx - 4, -4, 3, 1, "#e8d49a");
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

const art = paint(BOARD);
await fs.writeFile(new URL("../dist/art/reading-sign.svg", import.meta.url), svg(art));
console.log(`reading-sign.svg: ${art.cols} × ${art.height} art pixels`);

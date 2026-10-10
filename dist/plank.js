// Broken wooden boards in the cabin billboards' palette, painted on a pixel
// grid to whatever size their element takes: staggered planks, a splintered
// end, a snapped corner, a crack, iron nails and a little moss.
const WOOD = {
  outline: "#241b12",
  top: "#a07a48",
  left: "#8a6a3e",
  right: "#5a4128",
  bottom: "#4c3722",
  face: "#6b4f31",
  seam: "#5a4129",
  grain: "#7a5b39",
  knot: "#4a3622",
  nail: "#c9ad7a",
  shadow: "#2b1f14",
  crack: "#1d1710",
};
const MOSS = ["#2f4524", "#3f5a2e", "#5d7d3c"];

function seeded(seed) {
  let value = seed >>> 0;
  return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Returns a grid of colours (null = clear), `cols` × `rows` art pixels.
export function plankPixels(cols, rows, seed) {
  const rand = seeded(seed),
    grid = Array.from({ length: rows }, () => Array(cols).fill(null)),
    inside = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows;
  const boards = Math.max(2, Math.round((rows - 2) / 9)),
    edges = Array.from({ length: boards + 1 }, (_, i) => 1 + Math.round((i * (rows - 2)) / boards));
  const mask = Array.from({ length: rows }, () => Array(cols).fill(-1));
  const broken = Math.floor(rand() * boards),
    snapped = (broken + 1 + Math.floor(rand() * (boards - 1))) % boards;
  for (let b = 0; b < boards; b++) {
    const top = edges[b],
      bottom = edges[b + 1],
      left = 1 + Math.floor(rand() * 3),
      right = cols - 2 - Math.floor(rand() * 3);
    for (let y = top; y < bottom; y++) {
      // The broken board ends in a splintered, stepped edge.
      const jag = b === broken ? Math.floor(rand() * 4) + ((y - top) % 3 === 1 ? 3 : 0) : 0;
      for (let x = left; x <= right - jag; x++) {
        // A snapped-off corner on another board.
        const corner = b === snapped && x - left + (bottom - 1 - y) < 5;
        if (!corner) mask[y][x] = b;
      }
    }
  }
  const board = (x, y) => (inside(x, y) ? mask[y][x] : -1);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const b = mask[y][x];
      if (b < 0) {
        if ([board(x - 1, y), board(x + 1, y), board(x, y - 1), board(x, y + 1)].some((n) => n >= 0))
          grid[y][x] = WOOD.outline;
        continue;
      }
      let color = WOOD.face;
      if (board(x, y - 1) !== b) color = b === 0 ? WOOD.top : WOOD.grain;
      else if (board(x, y + 1) !== b) color = board(x, y + 1) < 0 ? WOOD.bottom : WOOD.seam;
      else if (board(x - 1, y) !== b) color = WOOD.left;
      else if (board(x + 1, y) !== b) color = WOOD.right;
      grid[y][x] = color;
    }
  const paint = (x, y, color) => {
    if (inside(x, y) && mask[y][x] >= 0) grid[y][x] = color;
  };
  // Grain streaks and knots.
  for (let i = 0; i < (cols * rows) / 28; i++) {
    const x = Math.floor(rand() * cols),
      y = Math.floor(rand() * rows),
      length = 2 + Math.floor(rand() * 6);
    for (let k = 0; k < length; k++) if (grid[y]?.[x + k] === WOOD.face) paint(x + k, y, WOOD.grain);
  }
  for (let i = 0; i < Math.max(1, cols / 30); i++) {
    const x = 4 + Math.floor(rand() * (cols - 8)),
      y = 3 + Math.floor(rand() * (rows - 6));
    if (grid[y][x] !== WOOD.face) continue;
    paint(x, y, WOOD.knot);
    paint(x + 1, y, WOOD.knot);
    paint(x - 1, y, WOOD.seam);
    paint(x + 2, y, WOOD.seam);
  }
  // One long crack wanders along a board, lit along its upper lip.
  {
    const b = Math.floor(rand() * boards),
      startX = 4 + Math.floor(rand() * cols * 0.3);
    let y = edges[b] + 2 + Math.floor(rand() * Math.max(1, edges[b + 1] - edges[b] - 4));
    for (let x = startX; x < startX + cols * (0.25 + rand() * 0.3); x++) {
      if (mask[y]?.[x] !== b) break;
      paint(x, y, WOOD.crack);
      if (mask[y - 1]?.[x] === b) paint(x, y - 1, WOOD.left);
      if (rand() < 0.25) {
        const next = y + (rand() < 0.5 ? -1 : 1);
        if (mask[next]?.[x] === b && next > edges[b] && next < edges[b + 1] - 1) y = next;
      }
    }
  }
  // Iron nails near each board's ends.
  for (let b = 0; b < boards; b++) {
    const y = Math.round((edges[b] + edges[b + 1] - 1) / 2);
    const row = mask[y],
      first = row.indexOf(b),
      last = row.lastIndexOf(b);
    for (const x of [first + 2, last - 2]) {
      if (x <= first || x >= last) continue;
      paint(x, y, WOOD.nail);
      paint(x + 1, y + 1, WOOD.shadow);
    }
  }
  // Moss gathers on the top edge and hangs from a corner.
  for (let x = 0; x < cols; x++) {
    if (rand() > 0.22) continue;
    const span = 1 + Math.floor(rand() * 4);
    for (let k = 0; k < span; k++) {
      const top = mask.findIndex((r) => r[x + k] >= 0);
      if (top < 0) continue;
      grid[top][x + k] = MOSS[1 + (k % 2)];
      if (top > 0 && rand() < 0.5) grid[top - 1][x + k] = MOSS[2];
      if (rand() < 0.3) paint(x + k, top + 1, MOSS[0]);
    }
  }
  return grid;
}

function render(cols, rows, seed) {
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d");
  plankPixels(cols, rows, seed).forEach((row, y) =>
    row.forEach((color, x) => {
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  return canvas.toDataURL();
}

// Keeps an element's background a plank of its exact size, at a whole
// number of screen pixels per art pixel.
export function mountPlank(element, seed) {
  let last = "";
  const paint = () => {
    const width = element.offsetWidth,
      height = element.offsetHeight;
    if (!width || !height) return;
    const scale = innerWidth >= 900 ? 3 : 2,
      cols = Math.max(12, Math.round(width / scale)),
      rows = Math.max(8, Math.round(height / scale)),
      key = `${cols}x${rows}`;
    if (key === last) return;
    last = key;
    element.style.setProperty("--plank", `url(${render(cols, rows, seed)})`);
    element.style.setProperty("--plank-px", `${scale}px`);
  };
  new ResizeObserver(paint).observe(element);
  paint();
}

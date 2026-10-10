// Carved stone pillars standing in the empty margins of wide screens.
// Static Mesoamerican-inspired art (no animation), painted once per layout
// on the same pixel grid as the village and mirrored so the moonlit side
// always faces the page.

// Stone ramp from outline to moonlit rim.
const RAMP = [
  "#101210",
  "#242621",
  "#34362f",
  "#47473e",
  "#5d5b4d",
  "#77725f",
  "#959078",
];
const JADE = ["#24453a", "#336353", "#4a8069"];
const MOSS = ["#22351f", "#324d29", "#47663a", "#64843f"];
const LEAF = ["#253d22", "#38562c", "#557a39", "#78984c"];
const SOIL = ["#141711", "#1d2219", "#262d20"];
const BLOOM = ["#9c6c8c", "#c9a0bc", "#d8d0c0"];

function seeded(seed) {
  let value = seed >>> 0;
  return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const packed = new Map();
function rgba(hex) {
  let value = packed.get(hex);
  if (value === undefined) {
    const n = parseInt(hex.slice(1), 16);
    // ImageData is little-endian RGBA, so pack as ABGR.
    value = ((255 << 24) | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0;
    packed.set(hex, value);
  }
  return value;
}
// Lit from the right: deep shade on the far edge, a bright rim near the page.
function shade(t) {
  if (t < 0.08) return 1;
  if (t < 0.24) return 2;
  if (t < 0.58) return 3;
  if (t < 0.84) return 4;
  if (t < 0.95) return 5;
  return 6;
}

// One carved column with its forest floor, as packed RGBA pixels (0 = clear).
export function pillarPixels(W, H, seed) {
  const rand = seeded(seed);
  const stone = new Int8Array(W * H).fill(-1),
    special = new Map(),
    inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const block = (x, y, w, h, base = null) => {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++)
        if (inside(xx, yy))
          stone[yy * W + xx] = base ?? shade((xx - x + 0.5) / w);
  };
  const nudge = (x, y, delta) => {
    if (!inside(x, y)) return;
    const i = y * W + x;
    if (stone[i] >= 0) stone[i] = Math.max(0, Math.min(6, stone[i] + delta));
  };
  const tint = (x, y, hex) => {
    if (inside(x, y) && stone[y * W + x] >= 0) special.set(y * W + x, hex);
  };
  // Carving: recessed pixels sink two shades, their lower-right lips catch light.
  const carve = (mask) => {
    for (const key of mask) {
      const [x, y] = key.split(",").map(Number);
      nudge(x, y, -2);
    }
    for (const key of mask) {
      const [x, y] = key.split(",").map(Number);
      if (!mask.has(`${x + 1},${y + 1}`)) nudge(x + 1, y + 1, 1);
    }
  };

  const PW = Math.max(14, Math.min(66, Math.round(W * 0.48))) & ~1,
    x0 = Math.floor(W / 2) - PW / 2,
    groundH = Math.max(7, Math.round(H * 0.04)),
    groundY = H - groundH;

  // A frieze of interlocking stepped pyramids, the oldest motif on the column.
  const frieze = (x, y, w) => {
    const mask = new Set();
    for (let xx = x + 1; xx < x + w - 1; xx++) {
      const u = (xx - x) % 8,
        flipped = (u + 4) % 8;
      for (let v = 1; v <= 3; v++)
        if (u >= 4 - v && u <= 3 + v) mask.add(`${xx},${y + v}`);
      for (let v = 4; v <= 6; v++)
        if (flipped >= v - 3 && flipped <= 10 - v) mask.add(`${xx},${y + v}`);
    }
    carve(mask);
  };
  const slab = (x, y, w, h) => {
    block(x, y, w, h);
    for (let xx = x; xx < x + w; xx++) {
      nudge(xx, y, 1);
      nudge(xx, y + h - 1, -1);
    }
    // Chipped corners from centuries of weather.
    if (rand() < 0.7) stone[y * W + x] = -1;
    if (rand() < 0.7) stone[y * W + x + w - 1] = -1;
  };

  // Capital: abacus, step frieze and a narrow collar.
  let y = 3;
  slab(x0 - 7, y, PW + 14, 4);
  const capitalTop = y;
  y += 4;
  block(x0 - 5, y, PW + 10, 8);
  frieze(x0 - 5, y, PW + 10);
  y += 8;
  slab(x0 - 2, y, PW + 4, 3);
  y += 3;
  const shaftTop = y;

  // Base: collar, frieze plinth and a wide footing slab.
  let by = groundY;
  slab(x0 - 9, by - 5, PW + 18, 5);
  by -= 5;
  block(x0 - 6, by - 8, PW + 12, 8);
  frieze(x0 - 6, by - 8, PW + 12);
  by -= 8;
  slab(x0 - 2, by - 3, PW + 4, 3);
  by -= 3;
  const shaftBottom = by;

  // The shaft itself, shaded like a rounded drum.
  block(x0, shaftTop, PW, shaftBottom - shaftTop);

  // Panels separated by bands of round chalchihuitl studs.
  const band = 5,
    span = shaftBottom - shaftTop,
    target = Math.round(PW * 1.2) + band,
    count = Math.max(1, Math.round((span - band) / target)),
    panelH = (span - band) / count - band;
  const motifs = ["sun", "scales", "mask", "diamonds"];
  for (let i = 0; i <= count; i++) {
    const top = Math.round(shaftTop + i * (panelH + band));
    for (let xx = x0; xx < x0 + PW; xx++) {
      nudge(xx, top, -2);
      nudge(xx, top + band - 1, -1);
    }
    for (let xx = x0 + 3; xx < x0 + PW - 3; xx += 6) {
      tint(xx, top + 2, JADE[1]);
      tint(xx + 1, top + 2, JADE[2]);
      tint(xx, top + 3, JADE[0]);
      tint(xx + 1, top + 3, JADE[1]);
    }
    if (i === count) break;
    const py = top + band,
      ph = Math.round(panelH),
      inset = 3;
    const mask = new Set(),
      px = x0 + inset,
      pw = PW - inset * 2;
    // Recessed panel frame.
    for (let xx = px; xx < px + pw; xx++) {
      mask.add(`${xx},${py + 1}`);
      mask.add(`${xx},${py + ph - 2}`);
    }
    for (let yy = py + 1; yy < py + ph - 1; yy++) {
      mask.add(`${px},${yy}`);
      mask.add(`${px + pw - 1},${yy}`);
    }
    const cx = px + pw / 2 - 0.5,
      cy = py + ph / 2 - 0.5,
      inner = Math.min(pw, ph) / 2 - 3,
      motif = motifs[(i + seed) % motifs.length];
    const jade = [];
    if (motif === "sun") {
      // A sun disc: two rings, eight rays and a jade heart.
      const R = Math.max(3, Math.floor(inner) - 2);
      for (let yy = py + 2; yy < py + ph - 2; yy++)
        for (let xx = px + 2; xx < px + pw - 2; xx++) {
          const d = Math.hypot(xx - cx, yy - cy),
            a = Math.atan2(yy - cy, xx - cx);
          if (Math.abs(d - R) < 0.6 || (R > 6 && Math.abs(d - R + 3) < 0.6))
            mask.add(`${xx},${yy}`);
          const ray = Math.abs(((a / (Math.PI / 4)) % 1 + 1) % 1 - 0.5) > 0.38;
          if (ray && d > R + 1 && d < R + 3.4) mask.add(`${xx},${yy}`);
          if (d < Math.max(1.2, R - 5)) jade.push([xx, yy, d < R - 6.5 ? 2 : 1]);
        }
    } else if (motif === "scales") {
      // Feathered-serpent scales: stacked chevrons down the drum.
      for (let yy = py + 3; yy < py + ph - 3; yy++)
        for (let xx = px + 2; xx < px + pw - 2; xx++)
          if ((yy - py + Math.abs(xx - cx) * 0.75) % 5 < 1)
            mask.add(`${xx},${yy}`);
    } else if (motif === "mask") {
      // A goggle-eyed rain mask: ringed eyes, curled lip and fangs.
      const eye = Math.max(2, Math.floor(pw / 7)),
        eyeY = py + Math.round(ph * 0.34),
        eyes = [cx - pw * 0.22, cx + pw * 0.22];
      for (const ex of eyes)
        for (let yy = eyeY - eye - 1; yy <= eyeY + eye + 1; yy++)
          for (let xx = Math.floor(ex - eye - 1); xx <= ex + eye + 1; xx++) {
            const d = Math.hypot(xx - ex, yy - eyeY);
            if (Math.abs(d - eye) < 0.7) mask.add(`${xx},${yy}`);
            if (d < eye - 1) jade.push([xx, yy, 1]);
          }
      for (let xx = Math.round(eyes[0] - eye); xx <= eyes[1] + eye; xx++)
        mask.add(`${xx},${eyeY - eye - 3}`);
      for (let yy = eyeY - 1; yy < eyeY + eye + 3; yy++)
        mask.add(`${Math.round(cx)},${yy}`);
      const lipY = py + Math.round(ph * 0.66),
        lipL = Math.round(cx - pw * 0.32),
        lipR = Math.round(cx + pw * 0.32);
      for (let xx = lipL; xx <= lipR; xx++) mask.add(`${xx},${lipY}`);
      for (const [xx, dir] of [
        [lipL, 1],
        [lipR, -1],
      ]) {
        mask.add(`${xx},${lipY - 1}`);
        mask.add(`${xx},${lipY - 2}`);
        mask.add(`${xx + dir},${lipY - 2}`);
      }
      const fangs = Math.max(2, Math.floor(pw / 8));
      for (let f = 0; f < fangs; f++) {
        const fx = Math.round(lipL + ((f + 1) * (lipR - lipL)) / (fangs + 1));
        for (let yy = lipY + 1; yy < lipY + 4; yy++) {
          nudge(fx, yy, 2);
          if (yy < lipY + 3) nudge(fx + 1, yy, 1);
        }
      }
    } else {
      // Stepped diamonds nested around a jade bead.
      for (let yy = py + 3; yy < py + ph - 3; yy++)
        for (let xx = px + 3; xx < px + pw - 3; xx++) {
          const d = Math.abs(Math.round(xx - cx)) + Math.abs(Math.round(yy - cy));
          if (d > 1 && d % 4 === 0 && d < inner * 1.6) mask.add(`${xx},${yy}`);
          if (d <= 1) jade.push([xx, yy, 2]);
        }
    }
    carve(mask);
    for (const [xx, yy, k] of jade) tint(xx, yy, JADE[k]);
  }

  // Weathering: stains, hairline cracks and moss in the joints.
  for (let i = 0; i < (PW * (H / 40)) / 3; i++) {
    const sx = x0 + Math.floor(rand() * PW),
      sy = shaftTop + Math.floor(rand() * (shaftBottom - shaftTop));
    nudge(sx, sy, -1);
    nudge(sx + 1, sy, -1);
  }
  for (let i = 0; i < Math.max(2, Math.round(H / 90)); i++) {
    let cx = x0 + 2 + Math.floor(rand() * (PW - 4)),
      cy = shaftTop + Math.floor(rand() * (shaftBottom - shaftTop));
    for (let step = 0; step < 6 + rand() * 12; step++) {
      if (inside(cx, cy) && stone[cy * W + cx] >= 0) stone[cy * W + cx] = 1;
      cy++;
      cx += rand() < 0.3 ? -1 : rand() < 0.45 ? 1 : 0;
    }
  }
  for (let i = 0; i < W * H; i++) {
    if (stone[i] < 0) continue;
    const x = i % W,
      yy = (i / W) | 0;
    // Moss settles on ledges and in shaded recesses.
    const ledge = yy > 0 && stone[i - W] < 0,
      recess = stone[i] <= 1 && rand() < 0.18;
    if ((ledge && rand() < 0.65) || recess)
      special.set(i, MOSS[ledge ? (rand() < 0.5 ? 2 : 3) : rand() < 0.5 ? 0 : 1]);
    if (ledge && rand() < 0.4 && yy > 1) special.set(i - W, MOSS[2]);
  }

  // Compose stone, then a dark outline around the silhouette.
  const pixels = new Uint32Array(W * H);
  const put = (x, y, hex) => {
    x = Math.round(x);
    y = Math.round(y);
    if (!inside(x, y)) return;
    pixels[y * W + x] = rgba(hex);
  };
  for (let i = 0; i < W * H; i++) {
    const x = i % W,
      yy = (i / W) | 0;
    if (stone[i] >= 0) put(x, yy, special.get(i) ?? RAMP[stone[i]]);
    else if (
      (x > 0 && stone[i - 1] >= 0) ||
      (x < W - 1 && stone[i + 1] >= 0) ||
      (yy > 0 && stone[i - W] >= 0) ||
      (yy < H - 1 && stone[i + W] >= 0)
    )
      put(x, yy, special.has(i) ? special.get(i) : RAMP[0]);
  }

  // A vine trails from the capital down the shaded side of the column.
  const vineLength = (shaftBottom - shaftTop) * (0.45 + rand() * 0.25),
    amp = PW * 0.22,
    vineX = x0 + PW * 0.18;
  let last = null;
  for (let vy = capitalTop + 2; vy < shaftTop + vineLength; vy++) {
    const vx = Math.round(vineX + Math.sin(vy * 0.11 + seed) * amp);
    put(vx, vy, LEAF[0]);
    if (last !== null && Math.abs(vx - last) > 1)
      put((vx + last) / 2, vy, LEAF[0]);
    last = vx;
    if (vy % 4 === 0) {
      const dir = vy % 8 ? 1 : -1,
        lit = Math.min(3, 1 + Math.round((vx - x0) / PW + rand()));
      put(vx + dir, vy, LEAF[lit]);
      put(vx + dir * 2, vy, LEAF[lit]);
      put(vx + dir, vy - 1, LEAF[Math.max(1, lit - 1)]);
      if (rand() < 0.5) put(vx + dir * 2, vy + 1, LEAF[1]);
    }
  }
  // Leaves spill over the capital's top edge.
  for (let lx = x0 - 6; lx < x0 + PW + 6; lx++)
    if (rand() < 0.45) {
      put(lx, capitalTop - 1, LEAF[rand() < 0.5 ? 2 : 3]);
      if (rand() < 0.4) put(lx, capitalTop - 2, LEAF[2]);
    }

  // Forest floor: soil, a shadow pool, rocks, ferns, grass and a few blooms.
  for (let yy = groundY; yy < H; yy++)
    for (let x = 0; x < W; x++)
      put(x, yy, SOIL[yy === groundY ? 2 : (x * 7 + yy * 3) % 5 === 0 ? 2 : 1]);
  for (let x = x0 - 14; x < x0 + PW + 14; x++) put(x, groundY, SOIL[0]);
  const rock = (rx, ry, rw) => {
    for (let k = 0; k < rw; k++) {
      put(rx + k, ry, RAMP[k === rw - 1 ? 4 : 3]);
      if (k > 0 && k < rw - 1) put(rx + k, ry - 1, RAMP[k > rw / 2 ? 5 : 4]);
      put(rx + k, ry + 1, RAMP[1]);
    }
  };
  rock(x0 - 13, groundY - 1, 5);
  rock(x0 + PW + 9, groundY, 4);
  // A fallen chunk of the frieze rests against the footing.
  if (W > 40) rock(x0 + PW + 2, groundY - 2, 6);
  const fern = (fx, height) => {
    for (let k = 0; k < height; k++) {
      put(fx, groundY - k, LEAF[1]);
      if (k % 2 && k > 0) {
        put(fx - 1 - (k > height / 2 ? 0 : 1), groundY - k, LEAF[2]);
        put(fx + 1 + (k > height / 2 ? 0 : 1), groundY - k, LEAF[3]);
      }
    }
  };
  fern(x0 - 4, 6 + Math.round(rand() * 3));
  fern(x0 + PW + 5, 5 + Math.round(rand() * 3));
  for (let x = 0; x < W; x++) {
    if (rand() < 0.55) {
      const tall = 1 + Math.floor(rand() * 3);
      for (let k = 1; k <= tall; k++)
        put(x, groundY - k + 1, k === tall ? LEAF[3] : LEAF[2]);
    }
    if (rand() < 0.05) put(x, groundY - 3, BLOOM[Math.floor(rand() * 3)]);
  }
  return pixels;
}

// Copies packed pixels onto a canvas, mirrored so the lit side faces the page.
function blit(canvas, pixels, mirror) {
  const W = canvas.width,
    H = canvas.height,
    ctx = canvas.getContext("2d"),
    image = ctx.createImageData(W, H),
    out = new Uint32Array(image.data.buffer);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      out[y * W + (mirror ? W - 1 - x : x)] = pixels[y * W + x];
  ctx.putImageData(image, 0, 0);
}

export function paintPillar(canvas, mirror, seed) {
  blit(canvas, pillarPixels(canvas.width, canvas.height, seed), mirror);
}


// The temple wall behind the columns: darker than the pillars so they stand
// forward, with faded red pigment in the carvings and firelit braziers.
const WALL = [
  "#0b0d0b",
  "#141612",
  "#1b1d18",
  "#22241e",
  "#2b2c25",
  "#35352d",
  "#424037",
  "#535045",
];
const OCHRE = ["#2e1915", "#45231b", "#5e2f23", "#7a3d2b"];
const TURQUOISE = ["#1a3532", "#25504a", "#367064"];
const FIRE = ["#6b2210", "#b4451a", "#e7802a", "#ffc65c", "#fff1b8"];
// A hooked step-fret (xicalcoliuhqui): raised stone "#", carved and painted ".".
const FRET = [
  "#######",
  "#.....#",
  "#.###.#",
  "#.#.#.#",
  "#.#...#",
  "#.#####",
  "#......",
  "######.",
  ".......",
  "#####.#",
  "#...#.#",
  "#.#.#.#",
  "#.#...#",
  "#.#####",
];
// Glyph stones set into the wall: sun, stepped pyramid, spiral and serpent eye.
const GLYPHS = [
  [
    "....####....",
    "..##....##..",
    ".#..####..#.",
    ".#.#....#.#.",
    "#.#..##..#.#",
    "#.#.#..#.#.#",
    "#.#.#..#.#.#",
    "#.#..##..#.#",
    ".#.#....#.#.",
    ".#..####..#.",
    "..##....##..",
    "....####....",
  ],
  [
    "............",
    ".....##.....",
    ".....##.....",
    "....####....",
    "....#..#....",
    "...######...",
    "...#.##.#...",
    "..########..",
    "..#..##..#..",
    ".##########.",
    ".#...##...#.",
    "############",
  ],
  [
    "############",
    "#..........#",
    "#.########.#",
    "#.#......#.#",
    "#.#.####.#.#",
    "#.#.#..#.#.#",
    "#.#.#.##.#.#",
    "#.#.#....#.#",
    "#.#.######.#",
    "#.#........#",
    "#.##########",
    "#...........",
  ],
  [
    "..########..",
    ".#........#.",
    "#..######..#",
    "#.#......#.#",
    "#.#.####.#.#",
    "#.#.#..#.#.#",
    "#.#.#..#.#.#",
    "#.#.####.#.#",
    "#.#......#.#",
    "#..######..#",
    ".#..#..#..#.",
    "..##.##.##..",
  ],
];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// Paints a whole margin: a carved lintel, coursed masonry, a step-fret band
// along the page, a stepped platform and as many columns as fit. Authored
// with the page on the right; `mirror` flips it for the right-hand margin.
// Returns the brazier flames in canvas pixels for the animated overlay.
export function paintTemple(canvas, mirror, seed) {
  const W = canvas.width,
    H = canvas.height,
    rand = seeded(seed * 7919 + 1);
  const shade = new Int8Array(W * H).fill(2),
    paint = new Map(),
    inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const setShade = (x, y, v) => {
    if (inside(x, y)) shade[y * W + x] = Math.max(0, Math.min(7, v));
  };
  const nudge = (x, y, d) => {
    if (inside(x, y)) setShade(x, y, shade[y * W + x] + d);
  };
  const tint = (x, y, hex) => {
    if (inside(x, y)) paint.set(y * W + x, hex);
  };

  const border = W >= 22 ? 9 : 0,
    wallW = W - border,
    lintel = Math.min(13, Math.max(8, Math.round(H * 0.025))),
    groundH = Math.max(7, Math.round((H - lintel) * 0.04)),
    groundY = H - groundH;

  // Coursed masonry: staggered blocks, lit from the page, mortar in shadow.
  const course = 10;
  for (let cy = lintel; cy < groundY; cy += course) {
    let x = -Math.floor(rand() * 16);
    const depth = cy < lintel + course ? -1 : 0;
    while (x < wallW) {
      const bw = 12 + Math.floor(rand() * 14),
        base = 3 + (rand() < 0.3 ? 1 : 0) - (rand() < 0.15 ? 1 : 0) + depth,
        h = Math.min(course, groundY - cy);
      for (let yy = 0; yy < h; yy++)
        for (let xx = 0; xx < bw; xx++) {
          const px = x + xx,
            py = cy + yy;
          if (!inside(px, py) || px >= wallW) continue;
          let v = base;
          if (xx === bw - 1 || yy === course - 1) v = 0;
          else if (xx === 0 || yy === course - 2) v = base - 1;
          else if (yy === 0 || xx === bw - 2) v = base + 1;
          if (rand() < 0.07) v += rand() < 0.5 ? 1 : -1;
          shade[py * W + px] = Math.max(0, v);
        }
      // Chipped corners.
      if (rand() < 0.4) setShade(x, cy, 0);
      if (rand() < 0.4) setShade(x + bw - 2, cy + course - 2, 1);
      x += bw;
    }
  }
  // Hairline cracks wander down a few blocks.
  for (let i = 0; i < Math.round((wallW * H) / 2600); i++) {
    let cx = Math.floor(rand() * wallW),
      cy = lintel + Math.floor(rand() * (groundY - lintel));
    for (let step = 0; step < 4 + rand() * 10; step++) {
      setShade(cx, cy, 1);
      cy++;
      cx += rand() < 0.3 ? -1 : rand() < 0.45 ? 1 : 0;
    }
  }

  // Where the columns stand, and the open bays of wall between them.
  const count = wallW >= 26 ? Math.max(1, Math.round(wallW / 120)) : 0,
    slots = [],
    bays = [];
  for (let i = 0; i < count; i++) {
    const left = Math.round((i * wallW) / count),
      width = Math.round(((i + 1) * wallW) / count) - left,
      PW = Math.max(14, Math.min(66, Math.round(width * 0.48))) & ~1,
      x0 = left + Math.floor(width / 2) - PW / 2;
    slots.push({ left, width, from: x0 - 9, to: x0 + PW + 9 });
  }
  let edge = 0;
  for (const slot of slots) {
    bays.push([edge, slot.from]);
    edge = slot.to;
  }
  bays.push([edge, wallW]);

  // Carved glyph stones and a brazier in every bay wide enough for them.
  const flames = [],
    braziers = [];
  const carveMask = (ox, oy, rows, painted) => {
    rows.forEach((row, yy) =>
      [...row].forEach((ch, xx) => {
        const x = ox + xx,
          y = oy + yy;
        if (ch === ".") {
          nudge(x, y, -2);
          if (painted) tint(x, y, painted[(x + y) % 3 ? 1 : 0]);
        } else if (!rows[yy + 1] || rows[yy + 1][xx] === ".") nudge(x, y, 1);
      }),
    );
  };
  const glyphStone = (cx, top, kind) => {
    const size = 16,
      left = cx - size / 2;
    for (let yy = 0; yy < size; yy++)
      for (let xx = 0; xx < size; xx++) {
        let v = 4;
        if (xx === 0 || yy === 0) v = 6;
        if (xx === size - 1 || yy === size - 1) v = 1;
        else if (xx === 1 || yy === 1) v = 5;
        setShade(left + xx, top + yy, v);
      }
    setShade(left - 1, top + size, 0);
    for (let xx = 0; xx <= size; xx++) setShade(left + xx, top + size, 0);
    for (let yy = 0; yy <= size; yy++) setShade(left + size, top + yy, 0);
    const pigment = kind % 2 ? TURQUOISE : OCHRE;
    carveMask(left + 2, top + 2, GLYPHS[kind % GLYPHS.length], pigment);
  };
  bays.forEach(([from, to], b) => {
    const width = to - from,
      cx = Math.round((from + to) / 2);
    if (width < 18) return;
    const flameY = Math.round(lintel + (groundY - lintel) * (0.44 + (b % 2) * 0.08));
    braziers.push({ x: cx, y: flameY });
    const spacing = 46;
    let kind = Math.floor(rand() * GLYPHS.length);
    for (let top = lintel + 14; top + 16 < groundY - 24; top += spacing) {
      if (top + 16 > flameY - 30 && top < flameY + 22) continue;
      glyphStone(cx, top, kind++);
    }
  });

  // The lintel: mouldings around a band of step-frets, moss along the top.
  for (let y = 0; y < lintel; y++)
    for (let x = 0; x < wallW; x++) {
      let v = 4;
      if (y === 0) v = 6;
      else if (y === 1) v = 5;
      else if (y === lintel - 2) v = 3;
      else if (y === lintel - 1) v = 0;
      setShade(x, y, v);
    }
  {
    const band = lintel - 5;
    for (let x = 0; x < wallW; x++)
      for (let k = 0; k < band; k++) {
        const motif = FRET[(x + seed) % FRET.length],
          ch = motif[Math.round((k * 6) / Math.max(1, band - 1))];
        if (ch === ".") {
          nudge(x, 2 + k, -2);
          tint(x, 2 + k, OCHRE[2]);
        }
      }
  }
  // Step-fret band along the page edge, framed by two raised fillets.
  if (border)
    for (let y = 0; y < H; y++) {
      const row = FRET[(y + seed) % FRET.length];
      for (let k = 0; k < border; k++) {
        const x = wallW + k;
        if (k === 0) {
          setShade(x, y, 0);
          continue;
        }
        if (k === 1) {
          setShade(x, y, 3);
          continue;
        }
        if (k === border - 1) {
          setShade(x, y, 6);
          continue;
        }
        const ch = row[k - 2];
        if (ch === ".") {
          setShade(x, y, 2);
          tint(x, y, OCHRE[y % 7 ? 2 : 3]);
        } else setShade(x, y, k === border - 2 ? 6 : 5);
      }
    }

  // A low stepped platform the columns stand on.
  for (let y = groundY - 6; y < groundY; y++)
    for (let x = 0; x < wallW; x++) {
      const step = y < groundY - 3 ? 0 : 1;
      let v = step ? 4 : 3;
      if (y === groundY - 6 || y === groundY - 3) v = 6;
      if (y === groundY - 4 || y === groundY - 1) v = 1;
      if ((x + step * 7) % 23 === 0) v = 0;
      setShade(x, y, v);
    }

  // Compose the stone, pigments and moss into colour.
  const pixels = new Uint32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const y = (i / W) | 0,
      x = i % W;
    let hex = paint.get(i) ?? WALL[shade[i]];
    // Moss creeps up from the ground and gathers in the mortar.
    const damp = Math.pow(y / H, 2.2);
    if (x < wallW && shade[i] <= 1 && rand() < 0.04 + damp * 0.45)
      hex = MOSS[rand() < 0.6 ? 0 : 1];
    else if (y === 0 && rand() < 0.7) hex = MOSS[rand() < 0.5 ? 2 : 3];
    pixels[i] = rgba(hex);
  }
  const put = (x, y, hex) => {
    x = Math.round(x);
    y = Math.round(y);
    if (inside(x, y)) pixels[y * W + x] = rgba(hex);
  };

  // Vines and roots hang from the lintel into the open bays.
  bays.forEach(([from, to]) => {
    for (let v = 0; v < Math.max(1, Math.round((to - from) / 28)); v++) {
      const vx = from + 3 + Math.floor(rand() * Math.max(1, to - from - 6)),
        length = 20 + Math.floor(rand() * (H * 0.22));
      let x = vx;
      for (let y = lintel - 1; y < lintel + length; y++) {
        x += rand() < 0.15 ? (rand() < 0.5 ? -1 : 1) : 0;
        put(x, y, LEAF[0]);
        if (y % 5 === 0) {
          const dir = (y / 5) % 2 ? 1 : -1;
          put(x + dir, y, LEAF[2]);
          put(x + dir * 2, y - 1, LEAF[3]);
          put(x + dir, y - 1, LEAF[1]);
        }
      }
      put(x, lintel + length, LEAF[2]);
    }
  });

  // Braziers: a stepped stone stand, a bowl and a bed of embers. The flame
  // itself is an animated overlay so the stone never has to repaint.
  for (const { x, y } of braziers) {
    const bowl = y + 4;
    for (let k = -6; k <= 6; k++) {
      put(x + k, bowl, WALL[Math.abs(k) === 6 ? 2 : k > 2 ? 7 : 5]);
      if (Math.abs(k) <= 5) put(x + k, bowl + 1, WALL[k > 1 ? 6 : 4]);
      if (Math.abs(k) <= 4) put(x + k, bowl + 2, WALL[k > 1 ? 5 : 3]);
      if (Math.abs(k) <= 2) put(x + k, bowl + 3, WALL[2]);
    }
    for (let k = -5; k <= 5; k++) put(x + k, bowl - 1, k % 2 ? FIRE[1] : FIRE[2]);
    for (let yy = bowl + 4; yy < bowl + 14; yy++)
      for (let k = -2; k <= 1; k++) put(x + k, yy, WALL[k === 1 ? 6 : k === -2 ? 2 : 4]);
    for (let k = -4; k <= 3; k++) {
      put(x + k, bowl + 14, WALL[k > 1 ? 6 : 4]);
      put(x + k, bowl + 15, WALL[1]);
    }
    // Soot darkens the stone above the flame.
    for (let yy = y - 22; yy < y - 6; yy++)
      for (let k = -3; k <= 3; k++)
        if (inside(x + k, yy) && (rand() < 0.5 || Math.abs(k) < 2))
          pixels[yy * W + x + k] = rgba(WALL[1]);
    flames.push({ x, y });
  }

  // The columns, each painted over its slot of wall.
  slots.forEach((slot, i) => {
    const column = pillarPixels(slot.width, H - lintel, seed + i * 13);
    for (let y = 0; y < H - lintel; y++)
      for (let x = 0; x < slot.width; x++) {
        const value = column[y * slot.width + x];
        if (value) pixels[(y + lintel) * W + slot.left + x] = value;
      }
  });

  // Warm firelight falls on everything near a brazier, dithered in steps.
  for (const { x: fx, y: fy } of flames) {
    const R = 54;
    for (let y = Math.max(0, fy - R); y < Math.min(H, fy + R); y++)
      for (let x = Math.max(0, fx - R); x < Math.min(W, fx + R); x++) {
        const d = Math.hypot(x - fx, (y - fy) * 1.15) / R;
        if (d >= 1) continue;
        const level =
          Math.floor((1 - d) * (1 - d) * 4 + BAYER[(y % 4) * 4 + (x % 4)] / 16) / 4;
        if (level <= 0) continue;
        const i = y * W + x,
          v = pixels[i],
          k = level * 0.4;
        const r = v & 255,
          g = (v >> 8) & 255,
          b = (v >> 16) & 255;
        pixels[i] =
          ((255 << 24) |
            (Math.round(b + (40 - b) * k) << 16) |
            (Math.round(g + (150 - g) * k) << 8) |
            Math.round(r + (255 - r) * k)) >>>
          0;
      }
  }

  blit(canvas, pixels, mirror);
  return flames.map(({ x, y }) => ({ x: mirror ? W - 1 - x : x, y }));
}

// Three frames of brazier fire, side by side, on the village's pixel grid.
function flameSheet() {
  const w = 11,
    h = 14,
    sheet = document.createElement("canvas");
  sheet.width = w * 3;
  sheet.height = h;
  const ctx = sheet.getContext("2d");
  for (let f = 0; f < 3; f++) {
    const sway = [0, 1, -1][f],
      tall = [12, 13, 11][f];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const t = (h - 1 - y) / tall;
        if (t > 1) continue;
        const half = Math.max(0, (1 - t) * 4.6 * Math.sqrt(Math.min(1, t * 3 + 0.25))),
          dx = Math.abs(x - 5 - sway * t * 1.6);
        if (dx > half + 0.25) continue;
        const heat = (1 - dx / (half + 0.8)) * (1 - t * 0.55);
        ctx.fillStyle = FIRE[Math.min(4, Math.floor(heat * 5.2))];
        ctx.fillRect(f * w + x, y, 1, 1);
      }
    // A spark lifts off each frame at a different height.
    ctx.fillStyle = FIRE[3];
    ctx.fillRect(f * w + [3, 7, 5][f], [1, 0, 2][f], 1, 1);
  }
  return sheet.toDataURL();
}

export function mountPillars(shell) {
  const temple = document.createElement("div");
  temple.className = "temple";
  temple.setAttribute("aria-hidden", "true");
  document.body.prepend(temple);
  const sides = ["left", "right"].map((side) => {
    const element = document.createElement("div"),
      canvas = document.createElement("canvas");
    element.className = `temple-side temple-${side}`;
    canvas.className = "pillar";
    element.append(canvas);
    temple.append(element);
    return { element, canvas };
  });
  const sheet = flameSheet();
  let signature = "",
    pending = false;
  function layout() {
    pending = false;
    const box = shell.getBoundingClientRect(),
      gutter = Math.min(box.left, document.documentElement.clientWidth - box.right),
      pixel = Math.max(2, box.width / 480),
      // Round up so the stone always reaches the screen edge.
      cols = gutter > 0.5 ? Math.ceil(gutter / pixel) : 0,
      rows = Math.ceil(innerHeight / pixel);
    const next = `${cols}|${rows}|${pixel.toFixed(3)}|${box.left.toFixed(1)}`;
    if (next === signature) return;
    signature = next;
    temple.hidden = cols < 1;
    if (temple.hidden) return;
    sides.forEach(({ element, canvas }, i) => {
      canvas.width = cols;
      canvas.height = rows;
      Object.assign(element.style, {
        width: `${cols * pixel}px`,
        height: `${rows * pixel}px`,
        left: `${i ? box.right : box.left - cols * pixel}px`,
      });
      element.style.setProperty("--px", `${pixel}px`);
      const flames = paintTemple(canvas, i === 1, i ? 41 : 17);
      element.querySelectorAll(".temple-flame").forEach((flame) => flame.remove());
      flames.forEach(({ x, y }, k) => {
        const flame = document.createElement("span");
        flame.className = "temple-flame";
        flame.style.left = `${(x - 5) * pixel}px`;
        flame.style.top = `${(y + 3 - 14) * pixel}px`;
        flame.style.backgroundImage = `url(${sheet})`;
        flame.style.animationDelay = `${-((k * 0.37 + i * 0.21) % 1).toFixed(2)}s`;
        element.append(flame);
      });
    });
  }
  const schedule = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(layout);
  };
  new ResizeObserver(schedule).observe(shell);
  addEventListener("resize", schedule);
  layout();
}

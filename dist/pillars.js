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
// As a `shaft`, the column fills the whole width and simply runs on past
// the top and bottom: no capital, no base and no ground, only stone and moss.
export function pillarPixels(W, H, seed, shaft = false) {
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

  const PW = shaft ? W : Math.max(14, Math.min(66, Math.round(W * 0.48))) & ~1,
    x0 = shaft ? 0 : Math.floor(W / 2) - PW / 2,
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

  // Panels repeat down the shaft at a height that suits its width.
  const panelTarget = Math.round(Math.min(PW, 88) * 1.25) + 5,
    overrun = Math.round(panelTarget * 0.4);
  let capitalTop = -overrun,
    shaftTop = -overrun,
    shaftBottom = H + overrun;
  if (!shaft) {
  // Capital: abacus, step frieze and a narrow collar.
  let y = 3;
  slab(x0 - 7, y, PW + 14, 4);
  capitalTop = y;
  y += 4;
  block(x0 - 5, y, PW + 10, 8);
  frieze(x0 - 5, y, PW + 10);
  y += 8;
  slab(x0 - 2, y, PW + 4, 3);
  y += 3;
  shaftTop = y;

  // Base: collar, frieze plinth and a wide footing slab.
  let by = groundY;
  slab(x0 - 9, by - 5, PW + 18, 5);
  by -= 5;
  block(x0 - 6, by - 8, PW + 12, 8);
  frieze(x0 - 6, by - 8, PW + 12);
  by -= 8;
  slab(x0 - 2, by - 3, PW + 4, 3);
  by -= 3;
  shaftBottom = by;
  }

  // The shaft itself, shaded like a rounded drum.
  block(x0, shaftTop, PW, shaftBottom - shaftTop);
  if (shaft) {
    // A broad shaft sits deeper in shadow, and vertical flutes run down the
    // stone on either side of the carved panels.
    for (let i = 0; i < W * H; i++) if (stone[i] > 1) stone[i]--;
    const side = (PW - Math.min(PW - 6, 88)) / 2;
    for (let xx = x0 + 3; xx < x0 + PW - 3; xx += 6)
      if (xx < x0 + side - 2 || xx > x0 + PW - side + 1)
        for (let yy = 0; yy < H; yy++) {
          nudge(xx, yy, -2);
          nudge(xx + 1, yy, 1);
        }
  }

  // Panels separated by bands of round chalchihuitl studs.
  const band = 5,
    span = shaftBottom - shaftTop,
    target = shaft ? panelTarget : Math.round(PW * 1.2) + band,
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
      inset = shaft ? Math.max(3, Math.round((PW - Math.min(PW - 6, 88)) / 2)) : 3;
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
          if (d < Math.max(1.2, Math.min(R - 5, 5))) jade.push([xx, yy, d < 2.5 ? 2 : 1]);
        }
    } else if (motif === "scales") {
      // Feathered-serpent scales: stacked chevrons down the drum.
      for (let yy = py + 3; yy < py + ph - 3; yy++)
        for (let xx = px + 2; xx < px + pw - 2; xx++)
          if ((yy - py + Math.abs(xx - cx) * 0.75) % 5 < 1)
            mask.add(`${xx},${yy}`);
    } else if (motif === "mask") {
      // A goggle-eyed rain mask: ringed eyes, curled lip and fangs.
      const eye = Math.max(2, Math.min(7, Math.floor(pw / 7))),
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
      recess = stone[i] <= 1 && rand() < (shaft ? 0.42 : 0.18);
    if ((ledge && rand() < 0.65) || recess)
      special.set(i, MOSS[ledge ? (rand() < 0.5 ? 2 : 3) : rand() < 0.5 ? 0 : 1]);
    if (ledge && rand() < 0.4 && yy > 1) special.set(i - W, MOSS[2]);
  }

  if (shaft) {
    // Thick moss: cushions on the shaded side and along every stud band,
    // with strands hanging from the bands below.
    const cushion = (cx, cy, r) => {
      for (let yy = Math.floor(cy - r); yy <= cy + r; yy++)
        for (let xx = Math.floor(cx - r * 1.4); xx <= cx + r * 1.4; xx++) {
          if (!inside(xx, yy)) continue;
          const d = Math.hypot((xx - cx) / 1.4, yy - cy) / r;
          if (d > 1 || rand() < d * 0.6) continue;
          const lit = Math.min(3, Math.floor(((xx - x0) / PW) * 2.2 + (cy - yy > r * 0.3 ? 1 : 0)));
          special.set(yy * W + xx, MOSS[Math.max(0, lit)]);
        }
    };
    for (let i = 0; i < Math.round((W * H) / 260); i++)
      cushion(
        x0 + PW * Math.pow(rand(), 1.8),
        Math.floor(rand() * H),
        1.5 + rand() * 4.5,
      );
    for (let i = 0; i <= count; i++) {
      const top = Math.round(shaftTop + i * (panelH + band));
      for (let xx = x0; xx < x0 + PW; xx++) {
        if (rand() < 0.5) cushion(xx, top + 1, 1 + rand() * 2.2);
        if (rand() < 0.12) {
          const length = 2 + Math.floor(rand() * 9);
          for (let k = 0; k < length; k++)
            if (inside(xx, top + band + k))
              special.set((top + band + k) * W + xx, k < length - 1 ? MOSS[1] : MOSS[2]);
        }
      }
    }
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

  // A vine trails from the capital down the shaded side of the column;
  // a shaft carries several, wandering its whole height.
  for (const [vineX, amp, vineLength] of shaft
    ? [0.12, 0.47, 0.83].map((f, k) => [
        x0 + PW * f,
        Math.min(PW * 0.12, 14),
        (shaftBottom - shaftTop) * (k === 1 ? 0.55 + rand() * 0.3 : 1),
      ])
    : [[x0 + PW * 0.18, PW * 0.22, (shaftBottom - shaftTop) * (0.45 + rand() * 0.25)]]) {
  let last = null;
  for (let vy = capitalTop + 2; vy < shaftTop + vineLength; vy++) {
    const vx = Math.round(vineX + Math.sin(vy * 0.11 + seed + vineX) * amp);
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
  }
  if (shaft) {
    // Timber surrounds the original carved stone, with its motifs and moss
    // still exposed. Everything is baked into the existing static surface.
    const rect = (x, y, w, h, hex) => {
      for (let yy = Math.round(y); yy < y + h; yy++)
        for (let xx = Math.round(x); xx < x + w; xx++) put(xx, yy, hex);
    };
    if (W >= 28) {
      const rail = Math.max(4, Math.min(9, Math.round(W * 0.065)));
      for (const rx of [2, W - rail - 2]) {
        rect(rx, 0, rail, H, "#33201c");
        rect(rx + 1, 0, rail - 2, H, "#754629");
        rect(rx + rail - 3, 0, 2, H, "#ad7040");
        for (let yy = 0; yy < H; yy += 7) {
          rect(rx + 2, yy, 1, 4, "#583321");
          rect(rx + rail - 2, yy + 3, 1, 3, "#c18547");
        }
      }
      // Short corner braces leave the central reliefs readable.
      for (let yy = 20; yy < H; yy += 94) {
        for (const rx of [0, W - rail * 2 - 5]) {
          rect(rx, yy, rail * 2 + 5, 5, "#301c1b");
          rect(rx, yy, rail * 2 + 5, 1, "#d49a52");
          rect(rx, yy + 1, rail * 2 + 5, 2, "#966036");
          rect(rx + 4, yy + 2, 2, 2, "#edba67");
        }
      }
      const lx = W - rail - 12;
      for (let ly = 35; ly < H - 17; ly += 126) {
        // Pixel light pools tint the existing carving rather than erase it.
        for (let yy = ly - 25; yy < ly + 29; yy++)
          for (let xx = lx - 25; xx < lx + 26; xx++) {
            if (!inside(xx, yy)) continue;
            const distance = Math.hypot(xx - lx, (yy - ly) * 0.88);
            const a = Math.max(0, 1 - distance / 26) ** 2 * 0.64;
            const index = yy * W + xx, old = pixels[index];
            if (!old || !a) continue;
            const r = Math.round((old & 255) * (1 - a) + 255 * a),
              g = Math.round(((old >>> 8) & 255) * (1 - a) + 160 * a),
              b = Math.round(((old >>> 16) & 255) * (1 - a) + 48 * a);
            pixels[index] = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
          }
        rect(lx, ly - 20, 2, 13, "#2a1b22");
        rect(lx - 3, ly - 9, 8, 2, "#c78d43");
        rect(lx - 5, ly - 7, 12, 17, "#231928");
        rect(lx - 3, ly - 5, 8, 13, "#e98726");
        rect(lx - 2, ly - 4, 6, 10, "#ffd65a");
        rect(lx, ly - 3, 2, 9, "#fff3af");
        rect(lx - 4, ly + 8, 10, 2, "#a75928");
        rect(lx - 5, ly - 6, 2, 16, "#38212a");
        rect(lx + 5, ly - 6, 2, 16, "#38212a");
      }
      // Ivy climbs the new timber; the old trailing vines stay beneath it.
      for (let yy = 0; yy < H; yy += 3) {
        const vx = W - rail - 2 + Math.round(Math.sin(yy * 0.08 + seed) * 4);
        rect(vx, yy, 1, 4, "#1a3c39");
        if (yy % 9 === 0) {
          const side = yy % 18 ? 1 : -1;
          rect(vx + side, yy, 3, 3, "#295747");
          rect(vx + side, yy - 1, 2, 2, "#568b63");
          rect(vx + side * 2, yy + 1, 2, 1, "#85a369");
        }
      }
    }
    return pixels;
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


// The margin is the timber frame of a lodge we look out from: a deep, dark
// board wall, one heavy post on the page side and crossbeams at uneven
// heights. Ivy is sparse and lanterns are few; each lantern only warms the
// wood within reach. Positions are seeded along the height, never tiled.
const BEAM = ["#120a0c", "#1c0f12", "#2a171a", "#3a1f1c", "#4a2a20", "#5e3624", "#77462c"];
function timberPixels(W, H, seed) {
  const pixels = new Uint32Array(W * H),
    rand = seeded(seed);
  const put = (x, y, color) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < W && y < H) pixels[y * W + x] = rgba(color);
  };
  const rect = (x, y, w, h, color) => {
    for (let yy = Math.round(y); yy < y + h; yy++)
      for (let xx = Math.round(x); xx < x + w; xx++) put(xx, yy, color);
  };
  // The back wall: wide, nearly black boards that recede behind the frame.
  const board = Math.max(10, Math.min(26, Math.round(W / 4)));
  for (let x = 0; x < W; x++) {
    const u = x % board;
    const tone = u === 0 ? BEAM[0] : u === 1 ? BEAM[2] : BEAM[1];
    for (let y = 0; y < H; y++) put(x, y, tone);
  }
  for (let i = 0; i < (W * H) / 260; i++)
    rect(Math.floor(rand() * W), Math.floor(rand() * H), 1, 4 + Math.floor(rand() * 14), BEAM[0]);
  // The heavy post facing the page, lit along its inner edge.
  const P = Math.max(8, Math.min(44, Math.round(W * 0.42))),
    px = W - P;
  const post = (x0, w, light) => {
    for (let x = x0; x < x0 + w; x++) {
      const u = (x - x0) / w;
      const tone = u < 0.1 ? 2 : u > 0.86 ? (light ? 6 : 4) : u > 0.7 ? 4 : 3;
      for (let y = 0; y < H; y++) put(x, y, BEAM[tone]);
    }
    for (let i = 0; i < (w * H) / 90; i++) {
      const gx = x0 + 1 + Math.floor(rand() * (w - 2)),
        gy = Math.floor(rand() * H);
      rect(gx, gy, 1, 6 + Math.floor(rand() * 20), rand() < 0.5 ? BEAM[2] : BEAM[4]);
    }
    // A few deep seasoning checks run down the grain.
    for (let i = 0; i < Math.max(1, H / 300); i++) {
      let cx = x0 + 2 + Math.floor(rand() * Math.max(1, w - 4)),
        cy = Math.floor(rand() * H);
      for (let k = 0; k < 20 + rand() * 50; k++, cy++) {
        put(cx, cy, BEAM[0]);
        if (rand() < 0.15) cx += rand() < 0.5 ? -1 : 1;
      }
    }
  };
  post(px, P, true);
  const outer = W > 80 ? Math.round(P * 0.6) : 0;
  if (outer) post(2, outer, false);
  // Crossbeams at uneven heights, pinned with iron straps, some braced.
  const beams = [];
  for (let y = Math.round(40 + rand() * 80); y < H + 20; y += Math.round(170 + rand() * 170)) beams.push(y);
  const lanternBeams = new Set();
  for (let i = 0; i < beams.length; i++) if (i % 2 === (seed % 2) && rand() < 0.85) lanternBeams.add(i);
  beams.forEach((y, i) => {
    const h = Math.max(6, Math.min(14, Math.round(W * 0.09)));
    rect(0, y, px, h, BEAM[3]);
    rect(0, y, px, 1, BEAM[5]);
    rect(0, y + h - 2, px, 2, BEAM[1]);
    for (let k = 0; k < px / 6; k++) rect(Math.floor(rand() * px), y + 2 + Math.floor(rand() * (h - 4)), 3 + Math.floor(rand() * 8), 1, BEAM[2]);
    // Iron strap where the beam meets the post.
    const sx = px - Math.min(10, Math.round(P * 0.3));
    rect(sx, y - 2, Math.min(10, Math.round(P * 0.3)) + Math.round(P * 0.4), h + 4, "#26232b");
    rect(sx + 1, y - 1, 2, 2, "#8a8494");
    rect(sx + 1, y + h - 1, 2, 2, "#8a8494");
    rect(px + Math.round(P * 0.4) - 3, y + h / 2 - 1, 2, 2, "#8a8494");
    if (rand() < 0.5 && px > 24) {
      // A knee brace under the beam, stepped on the pixel grid.
      const len = Math.min(px - 6, 18 + Math.floor(rand() * 16));
      for (let k = 0; k < len; k++) rect(px - 1 - k - 4, y + h + k, 5, 2, k % 4 ? BEAM[3] : BEAM[2]);
    }
    // Sparse ivy: an occasional sprig hangs from a beam.
    if (rand() < 0.45) {
      const vx = Math.floor(rand() * Math.max(1, px - 8)) + 3,
        length = 12 + Math.floor(rand() * 46);
      for (let k = 0; k < length; k++) {
        const x = vx + Math.round(Math.sin(k * 0.25 + i) * 2);
        put(x, y + h + k, "#1d3324");
        if (k % 6 === 3) {
          const side = k % 12 === 3 ? -1 : 1;
          rect(x + (side < 0 ? -4 : 1), y + h + k - 1, 4, 3, "#2f4a2c");
          put(x + side * 2, y + h + k - 1, "#5e7a40");
        }
      }
    }
    if (lanternBeams.has(i) && W >= 16) {
      // An iron arm holds a lantern out over the page edge.
      const lx = W - Math.max(5, Math.round(P * 0.35)),
        ly = y + h + 14;
      for (let yy = ly - 24; yy <= ly + 26; yy++)
        for (let xx = lx - 26; xx <= lx + 26; xx++) {
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const reach = Math.hypot(xx - lx, (yy - ly) * 1.1) / 26;
          if (reach >= 1) continue;
          // Dithered falloff: nearby wood steps one or two shades warmer.
          const threshold = ((xx & 1) * 2 + (yy & 1) * 3 + ((xx >> 1) & 1)) / 6;
          if ((1 - reach) ** 1.5 < threshold * 0.9) continue;
          const i2 = yy * W + xx,
            old = pixels[i2],
            r = old & 255,
            g = (old >>> 8) & 255,
            b = (old >>> 16) & 255;
          const k = reach < 0.4 ? 0.34 : 0.18;
          pixels[i2] = ((255 << 24) | (Math.round(b + (90 - b) * k) << 16) | (Math.round(g + (150 - g) * k) << 8) | Math.round(r + (230 - r) * k)) >>> 0;
        }
      rect(lx - 1, y + h, 2, 6, "#1b1418");
      rect(lx - 4, ly - 8, 8, 2, "#2a1a14");
      rect(lx - 5, ly - 6, 10, 12, "#1b1418");
      rect(lx - 4, ly - 5, 8, 10, "#f08a28");
      rect(lx - 3, ly - 4, 6, 8, "#ffd25a");
      rect(lx - 1, ly - 3, 2, 5, "#fff4b8");
      rect(lx - 5, ly + 6, 10, 2, "#2a1a14");
    }
  });
  // Bolts down the post, spaced irregularly.
  for (let y = Math.round(rand() * 60); y < H; y += Math.round(60 + rand() * 120)) {
    rect(px + Math.round(P * 0.5), y, 2, 2, "#1b1418");
    put(px + Math.round(P * 0.5), y, "#6a6474");
  }
  // A single ivy strand climbs part of the post on its shaded side.
  const start = Math.floor(rand() * H * 0.5),
    length = Math.min(H - start, Math.round(H * (0.15 + rand() * 0.2)));
  for (let k = 0; k < length; k++) {
    const x = px + 2 + Math.round(Math.sin(k * 0.08 + seed) * 2);
    put(x, start + k, "#1d3324");
    if (k % 9 === 0) {
      rect(x + 1, start + k - 1, 4, 3, "#2f4a2c");
      put(x + 3, start + k - 1, "#5e7a40");
    }
  }
  return pixels;
}

export function paintTemple(canvas, mirror, seed) {
  blit(canvas, timberPixels(canvas.width, canvas.height, seed), mirror);
}

// Fireflies drifting over the moss; deterministic positions, CSS motion.
const FIREFLIES = [
  [0.22, 0.18, 0],
  [0.68, 0.34, 1.7],
  [0.35, 0.57, 3.1],
  [0.8, 0.71, 0.9],
  [0.15, 0.86, 2.4],
];

export function mountPillars(shell) {
  const temple = document.createElement("div");
  temple.className = "temple";
  temple.setAttribute("aria-hidden", "true");
  document.body.prepend(temple);
  const sides = ["left", "right"].map((side, i) => {
    const element = document.createElement("div"),
      canvas = document.createElement("canvas");
    element.className = `temple-side temple-${side}`;
    canvas.className = "pillar";
    element.append(canvas);
    FIREFLIES.forEach(([x, y, delay]) => {
      const fly = document.createElement("span");
      fly.className = "temple-firefly";
      fly.style.left = `${(i ? 1 - x : x) * 100}%`;
      fly.style.top = `${y * 100}%`;
      fly.style.animationDelay = `${-delay - i * 1.3}s`;
      element.append(fly);
    });
    temple.append(element);
    return { element, canvas };
  });
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
    // The opening scenes frame themselves with the same margins.
    document.documentElement.style.setProperty("--gutter", `${Math.max(0, gutter)}px`);
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
      paintTemple(canvas, i === 1, i ? 41 : 17);
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

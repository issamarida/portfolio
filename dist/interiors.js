// Cabin interiors: each building opens onto its own cozy room, drawn as a
// lamplit diorama over the dimmed village. A lectern with an open book stands
// in the middle of every room; reading it opens that cabin's portfolio panel.
// Coordinates share the 960×540 logical village band and the two-unit grid.

export const ROOM = { left: 170, top: 96, right: 790, bottom: 506 };
const WALL_FOOT = 222,
  FLOOR_END = 494,
  DOOR = { left: 452, right: 508, x: 480 };
export const LECTERN = { x: 480, y: 346 };
export const INTERIOR_SPAWN = { x: 480, y: 470 };
export const EXIT_Y = 494;

const WOOD = "#3a2a1c",
  WOOD_DARK = "#22180f",
  SHADOW = "#2a1c12";

function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// --- Shared furniture -------------------------------------------------------

function shadow(p, x, y, w) {
  p.ellipse(x, y, w, 8, SHADOW);
}

function windowPane(p, x, y, w, h, curtain, curtainDark) {
  p.rect(x - 4, y - 4, w + 8, h + 8, WOOD_DARK);
  p.rect(x, y, w, h, "#16252d");
  p.rect(x, y + h - 14, w, 14, "#1d3335");
  const r = seeded(x * 7 + y);
  for (let i = 0; i < 9; i++)
    p.rect(x + 4 + r() * (w - 8), y + 4 + r() * (h - 24), 2, 2, "#c9d3b8");
  p.ellipse(x + w - 16, y + 14, 12, 12, "#e5e4c7");
  p.ellipse(x + w - 13, y + 12, 10, 10, "#16252d");
  // Treetops against the night sky.
  for (let xx = x; xx < x + w; xx += 12)
    p.path(
      [
        [xx, y + h - 10],
        [xx + 6, y + h - 26 - ((xx * 3) % 7)],
        [xx + 12, y + h - 10],
      ],
      "#20372f",
    );
  p.rect(x + w / 2 - 1, y, 2, h, "#5d4430");
  p.rect(x, y + h / 2 - 1, w, 2, "#5d4430");
  p.rect(x - 8, y + h + 2, w + 16, 6, "#8a6844");
  p.rect(x - 8, y + h + 8, w + 16, 2, WOOD_DARK);
  // Gathered curtains on a rod.
  p.rect(x - 12, y - 10, w + 24, 4, "#b48a4c");
  for (const side of [0, 1]) {
    const cx = side ? x + w - 6 : x - 10;
    p.rect(cx, y - 6, 16, h + 4, curtain);
    p.rect(cx + 4, y - 6, 2, h + 4, curtainDark);
    p.rect(cx + 10, y - 6, 2, h + 4, curtainDark);
    p.rect(cx - 2, y + h / 2, 20, 4, "#d8b064");
  }
}

function shelf(p, x, y, w) {
  p.rect(x, y, w, 6, "#8a6844");
  p.rect(x, y + 6, w, 2, WOOD_DARK);
  p.rect(x + 6, y + 8, 4, 8, "#5d4430");
  p.rect(x + w - 10, y + 8, 4, 8, "#5d4430");
}

const BOOK_COLORS = [
  "#8c2a2f",
  "#2f6a45",
  "#2d4f8c",
  "#c49a4a",
  "#693c7e",
  "#a8673a",
  "#4f6b6b",
];
function books(p, x, base, w, seed) {
  const r = seeded(seed);
  for (let xx = x; xx < x + w - 6;) {
    const bw = 6 + Math.floor(r() * 3) * 2,
      bh = 18 + Math.floor(r() * 5) * 2;
    if (r() < 0.12) {
      // A book lying flat breaks up the row.
      p.rect(xx, base - 6, 20, 6, BOOK_COLORS[Math.floor(r() * 7)]);
      p.rect(xx + 2, base - 4, 16, 2, "#e8d7ad");
      xx += 22;
      continue;
    }
    const color = BOOK_COLORS[Math.floor(r() * 7)];
    p.rect(xx, base - bh, bw, bh, color);
    p.rect(xx, base - bh + 4, bw, 2, "#e7c46e");
    p.rect(xx + 2, base - bh, 2, bh, "#ffffff22");
    xx += bw + 2;
  }
}

function plant(p, x, base, big = false) {
  const s = big ? 1.3 : 1;
  shadow(p, x, base, 28 * s);
  p.rect(x - 10 * s, base - 18 * s, 20 * s, 18 * s, "#9a5a3a");
  p.rect(x - 12 * s, base - 20 * s, 24 * s, 5 * s, "#b56d45");
  for (const [dx, dy, w, h] of [
    [-12, -42, 10, 24],
    [2, -48, 10, 30],
    [-4, -36, 8, 18],
    [8, -32, 10, 14],
    [-18, -30, 10, 12],
  ])
    p.ellipse(x + dx * s, base + dy * s, w * s, h * s, "#4a7a4a");
  p.rect(x - 2, base - 40 * s, 2, 22 * s, "#6c9a5a");
  p.rect(x + 6 * s, base - 44 * s, 2, 10, "#8ab06a");
  p.rect(x - 8 * s, base - 15 * s, 2, 10 * s, "#d28c54");
  p.rect(x - 8 * s, base - 3, 17 * s, 2, "#69402a");
  for (const [dx, dy] of [
    [-12, -40],
    [4, -47],
    [12, -29],
    [-5, -31],
  ]) {
    p.rect(x + dx * s, base + dy * s, 6 * s, 2, "#96af62");
    p.rect(x + dx * s + 2, base + dy * s + 2, 2, 6 * s, "#6c9456");
  }
}

function candleStick(p, x, base, h = 14) {
  p.rect(x - 5, base - 3, 10, 3, "#b48a4c");
  p.rect(x - 3, base - 3 - h, 6, h, "#efe2c0");
  p.rect(x - 3, base - 3 - h, 2, h, "#ffffff");
  p.rect(x + 1, base - 3 - h + 2, 2, 4, "#d8c79c");
}

function armchair(p, x, base, color, dark, blanket) {
  shadow(p, x, base + 2, 64);
  p.rect(x - 28, base - 52, 56, 34, dark);
  p.rect(x - 24, base - 50, 48, 30, color);
  for (let xx = x - 18; xx < x + 20; xx += 12)
    p.rect(xx, base - 48, 2, 26, dark);
  p.rect(x - 32, base - 30, 12, 26, dark);
  p.rect(x + 20, base - 30, 12, 26, dark);
  p.rect(x - 30, base - 34, 10, 6, color);
  p.rect(x + 20, base - 34, 10, 6, color);
  p.rect(x - 22, base - 22, 44, 14, color);
  p.rect(x - 22, base - 10, 44, 4, dark);
  p.rect(x - 26, base - 4, 4, 6, WOOD_DARK);
  p.rect(x + 22, base - 4, 4, 6, WOOD_DARK);
  p.rect(x - 22, base - 49, 43, 2, "#f3cc8933");
  p.rect(x - 21, base - 21, 40, 2, "#f3cc8933");
  for (const xx of [x - 14, x + 12]) {
    p.rect(xx, base - 38, 3, 3, dark);
    p.rect(xx, base - 40, 3, 2, "#f3cc8933");
  }
  if (blanket) {
    // A knitted throw over the arm.
    p.rect(x + 4, base - 50, 22, 30, blanket[0]);
    for (let yy = base - 48; yy < base - 20; yy += 6)
      p.rect(x + 4, yy, 22, 2, blanket[1]);
    for (let xx = x + 6; xx < x + 26; xx += 4)
      p.rect(xx, base - 20, 2, 4, blanket[1]);
  }
}

function rug(p, cx, cy, w, h, base, edge, accent) {
  p.ellipse(cx, cy + 3, w + 6, h + 6, SHADOW);
  p.ellipse(cx, cy, w, h, edge);
  p.ellipse(cx, cy, w - 10, h - 8, base);
  p.ellipse(cx, cy, w - 34, h - 26, edge);
  p.ellipse(cx, cy, w - 42, h - 32, base);
  for (let i = -3; i <= 3; i++) {
    p.rect(cx + i * (w / 9) - 3, cy - 2, 6, 4, accent);
  }
  // Tasselled fringe at both ends.
  for (const side of [-1, 1])
    for (let dy = -8; dy <= 8; dy += 4)
      p.rect(cx + side * (w / 2 + 2) - 2, cy + dy, 6, 2, edge);
}

function wovenRug(p, cx, cy, w, h, base, edge, accent) {
  p.rect(cx - w / 2 - 2, cy - h / 2 + 4, w + 4, h + 4, "#271c20");
  p.rect(cx - w / 2, cy - h / 2, w, h, edge);
  p.rect(cx - w / 2 + 4, cy - h / 2 + 4, w - 8, h - 8, "#3e2621");
  p.rect(cx - w / 2 + 7, cy - h / 2 + 7, w - 14, h - 14, base);
  for (let x = cx - w / 2 + 10; x < cx + w / 2 - 6; x += 12) {
    for (const side of [-1, 1]) {
      const y = cy + side * (h / 2 - 11);
      p.rect(x, y, 4, 4, edge);
      p.rect(x + 2, y - 2, 2, 8, edge);
      p.rect(x + 4, y + side * 2, 4, 2, accent);
    }
  }
  for (let y = cy - h / 2 + 18; y < cy + h / 2 - 10; y += 12)
    for (const side of [-1, 1]) {
      p.rect(cx + side * (w / 2 - 12), y, 4, 4, edge);
      p.rect(cx + side * (w / 2 - 14), y + 2, 8, 2, edge);
    }
  for (const side of [-1, 1])
    for (let y = cy - h / 2 + 4; y < cy + h / 2; y += 6)
      p.rect(cx + side * (w / 2 + 1), y, 4, 2, "#cbb783");
  const diamonds = [
    [cx, cy, 34, 20],
    [cx - 58, cy, 16, 10],
    [cx + 58, cy, 16, 10],
  ];
  for (const [x, y, dw, dh] of diamonds) {
    p.path(
      [
        [x, y - dh],
        [x + dw, y],
        [x, y + dh],
        [x - dw, y],
      ],
      edge,
    );
    p.path(
      [
        [x, y - dh + 4],
        [x + dw - 8, y],
        [x, y + dh - 4],
        [x - dw + 8, y],
      ],
      base,
    );
    p.rect(x - 3, y - 3, 6, 6, accent);
  }
}

function crate(p, x, base, w = 34, h = 26) {
  p.rect(x, base - h, w, h, "#8a6844");
  p.rect(x, base - h, w, 3, "#b08a58");
  p.rect(x, base - 3, w, 3, "#5d4430");
  p.rect(x, base - h, 3, h, "#5d4430");
  p.rect(x + w - 3, base - h, 3, h, "#5d4430");
  p.path(
    [
      [x + 3, base - 6],
      [x + 7, base - 6],
      [x + w - 3, base - h + 6],
      [x + w - 7, base - h + 6],
    ],
    "#6e5236",
  );
}

// --- The lectern and its quest marker --------------------------------------

function lectern(p, glowing) {
  const { x, y } = LECTERN;
  shadow(p, x, y + 2, 60);
  p.rect(x - 22, y - 8, 44, 8, "#4a3220");
  p.rect(x - 18, y - 10, 36, 4, "#6b4a2e");
  p.rect(x - 10, y - 50, 20, 42, "#6b4a2e");
  p.rect(x - 6, y - 48, 4, 38, "#8a6440");
  p.rect(x + 6, y - 48, 2, 38, "#4a3220");
  p.rect(x - 4, y - 34, 8, 2, "#e7c46e");
  p.rect(x - 14, y - 56, 28, 6, "#4a3220");
  // Slanted reading top carrying an open book with a red ribbon.
  p.path(
    [
      [x - 30, y - 54],
      [x + 30, y - 54],
      [x + 24, y - 72],
      [x - 24, y - 72],
    ],
    "#7d5735",
  );
  p.rect(x - 30, y - 56, 60, 4, "#5a3d24");
  if (glowing) p.glow(x, y - 66, 40, "#f6dc8e");
  p.path(
    [
      [x - 26, y - 60],
      [x, y - 57],
      [x, y - 74],
      [x - 22, y - 78],
    ],
    "#eadcb6",
  );
  p.path(
    [
      [x, y - 57],
      [x + 26, y - 60],
      [x + 22, y - 78],
      [x, y - 74],
    ],
    "#f6ecd2",
  );
  for (let i = 0; i < 4; i++) {
    p.rect(x - 20, y - 72 + i * 4, 14, 2, "#b9a582");
    p.rect(x + 6, y - 72 + i * 4, 14, 2, "#c9b892");
  }
  p.rect(x - 1, y - 74, 2, 17, "#a89270");
  p.rect(x + 10, y - 58, 4, 10, "#a8323a");
  p.rect(x + 10, y - 50, 2, 2, "#a8323a");
}

function exclamation(p, time) {
  const bob = p.reduced ? 0 : Math.round(Math.sin(time * 3.2) * 2) * 2;
  const x = LECTERN.x,
    y = LECTERN.y - 122 + bob;
  p.glow(x, y + 12, 26, "#f6cf5a");
  p.rect(x - 6, y - 2, 12, 20, "#2a1a0c");
  p.rect(x - 6, y + 20, 12, 10, "#2a1a0c");
  p.rect(x - 4, y, 8, 16, "#f6cf5a");
  p.rect(x - 4, y, 2, 14, "#fff0b0");
  p.rect(x + 2, y + 10, 2, 6, "#c98f2e");
  p.rect(x - 4, y + 22, 8, 6, "#f6cf5a");
  p.rect(x - 4, y + 22, 2, 2, "#fff0b0");
  if (!p.reduced) {
    // Two motes orbit the marker.
    for (let i = 0; i < 2; i++) {
      const a = time * 2.4 + i * Math.PI;
      p.rect(x + Math.cos(a) * 18, y + 12 + Math.sin(a) * 6, 2, 2, "#fff0b0");
    }
  }
}

function flame(p, x, y, time, i, size = 1) {
  const f = p.reduced ? 1 : Math.floor(time * 8 + i * 1.7) % 3;
  p.glow(x, y, 30 * size, "#f2c36a");
  p.rect(x - 2 * size, y - (6 + f) * size, 4 * size, (8 + f) * size, "#e98a3a");
  p.rect(x - 1, y - (4 + f) * size, 2, (5 + f) * size, "#ffe19a");
}

function hearthFire(p, x, y, w, time) {
  const f = p.reduced ? 1 : Math.floor(time * 7) % 4;
  p.glow(x, y - 10, 90, "#f2a24a");
  p.rect(x - w / 2, y - 4, w, 6, "#4a2c1a");
  p.rect(x - w / 2 + 4, y - 8, w - 8, 4, "#6c4d35");
  p.rect(
    x - w / 2 + 6,
    y - 16 - (f % 2) * 4,
    w - 12,
    12 + (f % 2) * 4,
    "#c4552e",
  );
  p.rect(x - w / 3, y - 24 + (f % 3) * 2, (w * 2) / 3, 18, "#e98a3a");
  p.rect(x - w / 6, y - 30 + (f % 2) * 3, w / 3, 22, "#f6c35a");
  p.rect(x - 2, y - 18 + f, 4, 12, "#ffe7a8");
  if (!p.reduced)
    for (let i = 0; i < 3; i++) {
      const rise = (time * 20 + i * 13) % 30;
      p.ctx.globalAlpha = 1 - rise / 30;
      p.rect(
        x - 8 + i * 8 + Math.sin(time * 3 + i) * 3,
        y - 30 - rise,
        2,
        2,
        "#ffcf7a",
      );
      p.ctx.globalAlpha = 1;
    }
}

// Detail passes are painted into the existing room cache. Furniture footprints,
// the open floor, and every live actor remain independent of these decorations.
function pixelLine(p, ax, ay, bx, by, ink, weight = 2) {
  const steps = Math.max(
    1,
    Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay)) / 2),
  );
  for (let i = 0; i <= steps; i++)
    p.rect(
      ax + ((bx - ax) * i) / steps,
      ay + ((by - ay) * i) / steps,
      weight,
      weight,
      ink,
    );
}

function lamp(p, x, y) {
  p.rect(x - 1, y - 12, 2, 12, "#291c18");
  p.rect(x - 8, y, 16, 4, "#81532c");
  p.rect(x - 6, y + 4, 12, 16, "#f8b746");
  p.rect(x - 3, y + 6, 6, 12, "#ffedaf");
  p.rect(x - 8, y + 20, 16, 4, "#81532c");
  p.rect(x - 6, y + 2, 2, 20, "#a7763e");
  p.rect(x + 4, y + 2, 2, 20, "#a7763e");
  p.glow(x, y + 12, 66, "#ffa94c");
}

function bottle(p, x, y, ink, height = 20) {
  p.rect(x - 6, y - height + 6, 12, height - 6, "#a8c7b570");
  p.rect(x - 5, y - height + 10, 10, height - 11, ink);
  p.rect(x - 3, y - height, 6, 8, "#c7d1ae");
  p.rect(x - 4, y - height - 2, 8, 3, "#a67a44");
  p.rect(x - 4, y - height + 6, 2, height - 9, "#fff2c34a");
  p.rect(x - 3, y - 9, 6, 5, "#e6cd95");
  p.rect(x - 1, y - 8, 2, 2, "#815a35");
}

function vine(p, x, y, length, seed) {
  const random = seeded(seed);
  for (let yy = y; yy < y + length; yy += 8) {
    const xx = x + Math.round(Math.sin(yy * 0.1 + seed) * 2) * 2;
    p.rect(xx, yy, 2, 9, "#3d5033");
    const side = random() > 0.5 ? -1 : 1;
    p.rect(xx + side * 3 - 3, yy + 1, 6, 4, "#3f764d");
    p.rect(xx + side * 5 - 2, yy + 5, 4, 3, "#819b50");
    if (random() > 0.74) p.rect(xx + side * 4, yy + 2, 2, 2, "#bdaf63");
  }
}

function guitar(p, x, y, wood = "#b77b41") {
  p.rect(x - 2, y, 4, 24, "#9b673b");
  p.rect(x - 3, y - 4, 6, 8, "#d09b56");
  p.rect(x - 5, y - 2, 10, 2, "#a5aab1");
  p.ellipse(x, y + 28, 20, 22, "#342018");
  p.ellipse(x, y + 40, 26, 24, "#342018");
  p.ellipse(x, y + 28, 16, 18, wood);
  p.ellipse(x, y + 40, 22, 20, wood);
  p.ellipse(x, y + 31, 8, 8, "#342018");
  p.rect(x - 5, y + 43, 10, 3, "#694126");
  p.rect(x - 1, y + 3, 2, 42, "#edcea047");
  for (let yy = y + 7; yy < y + 22; yy += 5) p.rect(x - 2, yy, 4, 1, "#e4ba7b");
}

function keyboard(p, x, y, width) {
  p.rect(x - 2, y - 2, width + 4, 18, "#201b20");
  p.rect(x, y, width, 12, "#f2dfb5");
  const keys = Math.floor(width / 4);
  for (let i = 1; i < keys; i++) {
    p.rect(x + i * 4, y, 1, 12, "#a89377");
    if (i % 7 !== 0 && i % 7 !== 3) p.rect(x + i * 4 - 1, y, 2, 7, "#261e24");
  }
  p.rect(x - 2, y + 14, width + 4, 2, "#98673e");
}

function roomDetails(p, id) {
  // Brass fasteners and carved timber catches the same amber light everywhere.
  for (const x of [184, 778]) {
    p.rect(x, 106, 2, 378, "#aa78423b");
    for (const y of [116, 210, 360, 476]) {
      p.rect(x - 2, y - 2, 6, 6, "#352419");
      p.rect(x, y, 2, 2, "#c49353");
    }
  }
  lamp(p, 186, 278);
  lamp(p, 776, 278);
  // The door path remains open; flowers grow beyond its walkable side walls.
  for (const x of [190, 772]) {
    plant(p, x, 470);
    for (const [dx, dy] of [
      [-5, -35],
      [5, -42],
      [0, -28],
    ]) {
      p.rect(x + dx - 2, 470 + dy, 6, 2, "#e3c07a");
      p.rect(x + dx, 468 + dy, 2, 6, id === "about" ? "#d38cb1" : "#efe2b4");
      p.rect(x + dx, 470 + dy, 2, 2, "#e9b249");
    }
  }
  if (id === "career") observatoryDetails(p);
  if (id === "gamedev") arcadeDetails(p);
  if (id === "projects") workshopDetails(p);
  if (id === "about") botanicalDetails(p);
}

function observatoryDetails(p) {
  // Twelve brass zodiac marks on the existing circular window; the live
  // shooting star keeps its original window clip and path.
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6,
      x = 640 + Math.cos(a) * 40,
      y = 160 + Math.sin(a) * 40;
    p.rect(x - 2, y - 2, 4, 4, "#d8ab65");
    p.rect(x, y - 4, 2, 8, "#d8ab65");
    p.rect(x - 4, y, 8, 2, "#d8ab65");
    pixelLine(
      p,
      640 + Math.cos(a) * 33,
      160 + Math.sin(a) * 33,
      640 + Math.cos(a) * 29,
      160 + Math.sin(a) * 29,
      "#866843",
    );
  }
  p.ellipse(640, 160, 48, 48, "#bc9757");
  p.ellipse(640, 160, 44, 44, "#122541");
  p.rect(638, 114, 4, 92, "#795130");
  p.rect(594, 158, 92, 4, "#795130");
  p.rect(640, 116, 2, 88, "#bd9251");
  p.rect(596, 158, 88, 2, "#bd9251");
  for (const [x, y] of [
    [620, 134],
    [658, 178],
    [632, 184],
  ]) {
    p.rect(x - 2, y, 6, 2, "#edcd82");
    p.rect(x, y - 2, 2, 6, "#edcd82");
  }
  // Deep-blue constellation pennants frame the star instrument.
  for (const x of [560, 706]) {
    p.path(
      [
        [x, 116],
        [x + 24, 116],
        [x + 24, 182],
        [x + 12, 174],
        [x, 182],
      ],
      "#203c62",
    );
    p.rect(x, 116, 24, 3, "#c49353");
    p.ellipse(x + 12, 139, 12, 12, "#edc263");
    p.ellipse(x + 16, 136, 10, 10, "#203c62");
    p.rect(x + 6, 158, 3, 3, "#edc263");
    p.rect(x + 17, 164, 2, 2, "#edc263");
  }
  // A small tiled hearth sits in the existing lower bookshelf footprint.
  p.rect(194, 202, 114, 62, "#544136");
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 6; col++)
      p.rect(
        196 + col * 18,
        204 + row * 12,
        16,
        10,
        (row + col) % 2 ? "#86705a" : "#736252",
      );
  p.rect(214, 214, 74, 42, "#281b17");
  p.rect(190, 198, 122, 6, "#bf8e50");
  p.rect(206, 260, 94, 6, "#bd9251");
  p.rect(226, 252, 42, 5, "#805330");
  p.glow(250, 238, 72, "#ffae52");
  // Copper collars and a dark lens make the existing telescope substantial.
  pixelLine(p, 612, 242, 676, 194, "#f1c979", 3);
  pixelLine(p, 618, 241, 682, 193, "#865a2d", 3);
  p.ellipse(677, 193, 14, 14, "#bc9252");
  p.ellipse(677, 193, 8, 8, "#143353");
  p.rect(677, 189, 3, 2, "#9ed8ec");
  p.ellipse(640, 222, 8, 8, "#dcac5d");
  pixelLine(p, 640, 238, 623, 261, "#b4854a");
  pixelLine(p, 641, 239, 660, 263, "#b4854a");
  // Charts and an armillary sphere on the existing writing desk.
  p.ellipse(748, 250, 26, 26, "#d0a462");
  p.ellipse(748, 250, 22, 22, "#352d2b");
  p.ellipse(748, 250, 14, 22, "#be9454");
  p.ellipse(748, 250, 10, 18, "#352d2b");
  p.rect(734, 248, 28, 2, "#e4bc70");
  p.rect(746, 262, 4, 14, "#d0a462");
  p.rect(740, 276, 16, 4, "#9f753f");
  p.rect(700, 332, 48, 22, "#d5bb84");
  for (const [x, y] of [
    [708, 340],
    [726, 336],
    [738, 346],
  ])
    p.rect(x, y, 2, 2, "#76573b");
  pixelLine(p, 708, 340, 726, 336, "#94764c");
  pixelLine(p, 726, 336, 738, 346, "#94764c");
  vine(p, 318, 112, 62, 42);
  // A brass celestial ring is woven into the existing midnight-blue rug.
  for (let i = 0; i < 30; i++) {
    const a = (i * Math.PI * 2) / 30;
    p.rect(480 + Math.cos(a) * 87, 350 + Math.sin(a) * 31, 2, 2, "#d9bf77");
  }
  for (const [x, y] of [
    [410, 352],
    [532, 358],
    [515, 334],
    [440, 372],
  ]) {
    p.rect(x - 3, y, 8, 2, "#edcf82");
    p.rect(x, y - 3, 2, 8, "#edcf82");
  }
  pixelLine(p, 408, 338, 440, 324, "#8e9bae");
  pixelLine(p, 440, 324, 476, 330, "#8e9bae");
  pixelLine(p, 476, 330, 520, 336, "#8e9bae");
}

function arcadeDetails(p) {
  // Marquee glass, neon side rails and coin-door hardware on existing cabinets.
  for (const [x, ink] of [
    [204, "#ed69c3"],
    [268, "#69d9f3"],
  ]) {
    p.rect(x - 2, 134, 56, 2, ink);
    p.rect(x + 2, 154, 2, 110, ink);
    p.rect(x + 48, 154, 2, 110, ink);
    p.rect(x + 6, 138, 40, 8, "#19152c");
    for (let i = 0; i < 7; i++) p.rect(x + 10 + i * 4, 140, 2, 4, ink);
    p.rect(x + 18, 239, 16, 14, "#151725");
    p.rect(x + 22, 243, 8, 2, "#bea775");
    p.rect(x + 22, 248, 2, 2, ink);
    p.rect(x + 30, 248, 2, 2, "#5d646d");
    p.glow(x + 26, 186, 58, ink);
  }
  // Outline neon controller on the wall, kept above the book marker.
  p.rect(426, 120, 108, 38, "#231b31");
  const outline = [
    [448, 144],
    [452, 128],
    [466, 128],
    [470, 132],
    [490, 132],
    [494, 128],
    [508, 128],
    [514, 146],
    [506, 148],
    [496, 140],
    [466, 140],
    [456, 148],
    [448, 144],
  ];
  for (let i = 0; i < outline.length - 1; i++)
    pixelLine(p, ...outline[i], ...outline[i + 1], "#6edfff");
  p.rect(459, 132, 2, 9, "#6edfff");
  p.rect(455, 136, 10, 2, "#6edfff");
  p.rect(496, 133, 3, 3, "#ff83cf");
  p.rect(502, 138, 3, 3, "#ff83cf");
  p.glow(480, 138, 52, "#3faef1");
  // The existing mushroom poster gains a glowing etched border and cap.
  p.rect(354, 124, 50, 2, "#ff7ed0");
  p.rect(354, 184, 50, 2, "#a550a2");
  p.rect(356, 128, 2, 56, "#ff7ed0");
  p.rect(400, 128, 2, 56, "#a550a2");
  p.ellipse(379, 150, 32, 22, "#d6589d");
  for (const [x, y] of [
    [370, 146],
    [384, 146],
    [378, 154],
  ])
    p.rect(x, y, 4, 4, "#ffd3ed");
  p.glow(379, 153, 40, "#dd53b2");
  // Reflected scanlines, vent slots and tiny buttons around the television.
  for (let y = 178; y < 219; y += 6) p.rect(726, y, 10, 2, "#29283b");
  p.rect(663, 174, 2, 46, "#ac99be");
  p.rect(665, 170, 73, 2, "#ac99be");
  for (const [x, ink] of [
    [643, "#e68fbd"],
    [754, "#77cbea"],
  ]) {
    p.rect(x, 223, 8, 2, ink);
    p.rect(x + 3, 221, 2, 6, ink);
  }
  vine(p, 766, 112, 68, 72);
  vine(p, 188, 118, 68, 22);
  plant(p, 578, 212);
}

function workshopDetails(p) {
  // The original tool wall stays visible; instruments hang on its empty flanks.
  p.rect(298, 108, 132, 4, "#6a432b");
  guitar(p, 300, 126, "#c18945");
  guitar(p, 440, 126, "#ceaa67");
  guitar(p, 472, 126, "#8e5739");
  // Workbench synth and sheets share space with the vise, lamp and screw jar.
  keyboard(p, 332, 220, 80);
  p.rect(332, 202, 54, 16, "#222432");
  p.rect(336, 205, 18, 9, "#547381");
  for (let x = 361; x < 383; x += 6) {
    p.ellipse(x, 206, 4, 4, "#b39b6f");
    p.rect(x - 1, 212, 2, 3, "#cc7c49");
  }
  p.rect(408, 196, 20, 21, "#ead6a7");
  for (let y = 199; y < 214; y += 4) p.rect(410, y, 16, 1, "#9d875f");
  p.rect(414, 202, 2, 6, "#59412c");
  p.rect(420, 206, 2, 6, "#59412c");
  // Music notation supplements the original chalkboard sketches.
  for (let y = 128; y < 149; y += 4) p.rect(504, y, 58, 1, "#9aa888");
  for (const [x, y] of [
    [514, 135],
    [534, 131],
    [550, 139],
  ]) {
    p.ellipse(x, y, 5, 3, "#efe2bd");
    p.rect(x + 2, y - 9, 2, 10, "#efe2bd");
  }
  // Brass cymbals and deep red drums occupy the existing stove-side solid.
  p.ellipse(648, 242, 26, 30, "#2a1b20");
  p.ellipse(648, 242, 22, 26, "#d2b784");
  p.ellipse(648, 242, 16, 20, "#ede0b4");
  p.ellipse(648, 242, 4, 4, "#34252a");
  p.rect(632, 222, 32, 4, "#cfac6e");
  p.rect(634, 226, 4, 21, "#934a39");
  p.rect(660, 226, 4, 21, "#934a39");
  for (const x of [630, 668]) {
    p.rect(x, 202, 2, 58, "#a89a7a");
    p.ellipse(x, 208, 29, 6, "#d6ac5c");
    p.rect(x - 4, 206, 9, 2, "#ffe1a2");
    pixelLine(p, x, 250, x - 8, 266, "#9e9279");
    pixelLine(p, x, 250, x + 8, 266, "#9e9279");
  }
  // Records in the wall shelf and warm ivy along the far wall.
  for (const [x, y] of [
    [600, 116],
    [642, 114],
  ]) {
    p.rect(x, y, 32, 28, "#684632");
    p.ellipse(x + 16, y + 14, 22, 22, "#26212b");
    p.ellipse(x + 16, y + 14, 6, 6, "#d5a459");
    p.rect(x + 7, y + 7, 2, 8, "#707078");
  }
  vine(p, 758, 114, 72, 26);
}

function botanicalDetails(p) {
  // Botanical collecting remains a visual setting, with no added biography.
  for (const [x, length] of [
    [196, 72],
    [300, 70],
    [568, 84],
    [724, 76],
  ])
    vine(p, x, 114, length, x);
  for (const x of [350, 376, 588, 748]) {
    p.rect(x, 110, 2, 24, "#987348");
    for (let i = 0; i < 4; i++) {
      p.rect(
        x - 6 + i * 3,
        132 + (i % 2) * 3,
        3,
        20 - (i % 2) * 4,
        i % 2 ? "#6f8c4e" : "#446c43",
      );
      p.rect(x - 7 + i * 3, 150 + (i % 2) * 3, 5, 4, "#9d9253");
    }
  }
  // Apothecary bottles sit on the original shelves and drawer cabinet.
  for (const [x, ink, h] of [
    [606, "#a5823d", 22],
    [624, "#73a06a", 28],
    [646, "#658e9c", 24],
    [676, "#b28153", 22],
  ])
    bottle(p, x, 214, ink, h);
  shelf(p, 580, 132, 164);
  for (const [x, ink] of [
    [590, "#9a7544"],
    [612, "#56835a"],
    [637, "#83729c"],
    [665, "#bea054"],
    [691, "#81916b"],
    [718, "#b57645"],
  ])
    bottle(p, x, 130, ink, 16);
  // A dark copper cauldron rests on the existing hearth, above its live fire.
  p.ellipse(480, 207, 72, 38, "#282b29");
  p.ellipse(480, 205, 62, 32, "#485042");
  p.ellipse(480, 194, 72, 18, "#bb934f");
  p.ellipse(480, 194, 64, 12, "#202b25");
  p.ellipse(480, 194, 52, 8, "#91a55a");
  p.rect(457, 204, 4, 12, "#6c7661");
  p.rect(454, 220, 5, 8, "#242a27");
  p.rect(502, 220, 5, 8, "#242a27");
  p.ellipse(443, 202, 12, 16, "#a88347");
  p.ellipse(443, 202, 6, 10, "#242a27");
  p.ellipse(517, 202, 12, 16, "#a88347");
  p.ellipse(517, 202, 6, 10, "#242a27");
  // Pressed botanical specimens and candles brighten the quilt-side wall.
  for (const x of [310, 354]) {
    p.rect(x, 164, 32, 40, "#a37843");
    p.rect(x + 3, 167, 26, 34, "#d9c18d");
    p.rect(x + 15, 173, 2, 23, "#5d7750");
    for (let i = 0; i < 3; i++) {
      p.ellipse(x + 11, 180 + i * 5, 10, 4, "#6a8755");
      p.ellipse(x + 21, 177 + i * 5, 10, 4, "#7d9259");
    }
    p.rect(x + 7, 198, 16, 1, "#a88a58");
  }
  lamp(p, 576, 184);
  plant(p, 740, 230, true);
  p.rect(316, 228, 26, 3, "#ad8046");
  bottle(p, 322, 228, "#789460", 15);
  bottle(p, 338, 228, "#9e7358", 18);
}

// --- The four rooms ---------------------------------------------------------

const ROOMS = {
  // The Workshop: a workbench under a pegboard of tools, a chalkboard of
  // sketches, a crackling wood stove and an armchair to think in.
  projects: {
    label: "The Workshop",
    wall: ["#68432e", "#97613b", "#382719"],
    floor: ["#71482f", "#a27243", "#473020"],
    rug: ["#722e32", "#b88b4d", "#d9aa6a"],
    solids: [
      [292, 222, 432, 266],
      [626, 222, 778, 276],
      [198, 400, 278, 450],
      [674, 420, 760, 470],
      [394, 462, 426, 488],
    ],
    flames: [[358, 200]],
    backdrop(p) {
      windowPane(p, 204, 126, 72, 64, "#2f6a45", "#1f4a30");
      // Pegboard of tools above the bench.
      p.rect(306, 116, 120, 84, "#a88456");
      for (let y = 122; y < 196; y += 10)
        for (let x = 312; x < 422; x += 10) p.rect(x, y, 2, 2, "#7a5c38");
      p.rect(316, 126, 4, 34, "#5d4430");
      p.rect(310, 122, 16, 8, "#9aa5a8");
      p.rect(334, 126, 24, 6, "#9aa5a8");
      for (let x = 336; x < 358; x += 4) p.rect(x, 132, 2, 3, "#9aa5a8");
      p.rect(356, 124, 6, 10, "#8a5a33");
      p.rect(372, 124, 4, 30, "#9aa5a8");
      p.ellipse(374, 122, 12, 8, "#9aa5a8");
      p.rect(390, 124, 16, 4, "#c4552e");
      p.rect(396, 128, 4, 24, "#c4552e");
      p.ellipse(320, 178, 16, 16, "#b48a4c");
      p.ellipse(320, 178, 6, 6, "#a88456");
      p.rect(340, 168, 30, 16, "#3a5a6a");
      p.rect(342, 170, 26, 2, "#e8d7ad");
      p.rect(342, 176, 18, 2, "#e8d7ad");
      // The workbench: vise, a plank, a lamp and a jar of screws.
      shadow(p, 362, 262, 140);
      p.rect(294, 216, 136, 10, "#a87c4a");
      p.rect(294, 214, 136, 4, "#c49a62");
      p.rect(294, 226, 136, 4, "#5d4430");
      p.rect(300, 230, 8, 32, "#5d4430");
      p.rect(416, 230, 8, 32, "#5d4430");
      p.rect(300, 246, 124, 4, "#6e5236");
      p.rect(304, 204, 18, 12, "#59646a");
      p.rect(308, 198, 10, 6, "#7b8a8e");
      p.rect(326, 208, 50, 6, "#d6b27a");
      p.rect(380, 202, 12, 12, "#9fc0c2");
      p.rect(382, 206, 8, 6, "#c0a060");
      candleStick(p, 358, 214, 10);
      p.rect(400, 196, 4, 18, "#5d4430");
      p.rect(396, 192, 20, 6, "#2f6a45");
      p.rect(250, 248, 6, 4, "#d6b27a");
      // Chalkboard of sketches: a rising line and a molecule.
      p.rect(492, 118, 112, 72, "#5d4430");
      p.rect(498, 124, 100, 60, "#2a3a34");
      const line = [
        [504, 172],
        [520, 164],
        [532, 168],
        [548, 152],
        [560, 156],
        [574, 136],
      ];
      for (let i = 0; i < line.length - 1; i++) {
        const [ax, ay] = line[i],
          [bx, by] = line[i + 1];
        for (let t = 0; t <= 1; t += 0.12)
          p.rect(ax + (bx - ax) * t, ay + (by - ay) * t, 2, 2, "#e8e4d0");
      }
      for (const [x, y] of [
        [582, 140],
        [590, 156],
        [578, 168],
      ])
        p.ellipse(x, y, 8, 8, "#d9e6c8");
      p.rect(582, 144, 2, 10, "#d9e6c8");
      p.rect(580, 158, 6, 2, "#d9e6c8");
      p.rect(506, 184, 20, 4, "#efe2c0");
      p.rect(530, 184, 8, 4, "#d8b064");
      // Shelf of jars and a candle.
      shelf(p, 604, 150, 52);
      p.rect(608, 132, 12, 18, "#7fa6a0");
      p.rect(610, 130, 8, 4, "#b48a4c");
      p.rect(624, 136, 10, 14, "#c49a4a");
      // Wood stove in the corner with a pipe through the roof.
      p.rect(714, 96, 12, 120, "#2e3236");
      p.rect(716, 96, 4, 120, "#4a5056");
      shadow(p, 720, 272, 96);
      p.rect(680, 214, 80, 54, "#2e3236");
      p.rect(684, 218, 72, 4, "#4a5056");
      p.rect(694, 232, 52, 28, "#1a1c1e");
      p.rect(676, 210, 88, 6, "#4a5056");
      p.rect(684, 268, 8, 6, "#2e3236");
      p.rect(748, 268, 8, 6, "#2e3236");
      p.rect(724, 202, 14, 8, "#7b8a8e");
      p.rect(738, 204, 6, 2, "#7b8a8e");
      // Firewood stacked beside it.
      for (let row = 0; row < 3; row++)
        for (let i = 0; i < 3 - row; i++) {
          const lx = 636 + i * 14 + row * 7,
            ly = 262 - row * 12;
          p.ellipse(lx, ly, 14, 12, "#8a6440");
          p.ellipse(lx, ly, 8, 6, "#c49a62");
        }
    },
    props: [
      {
        y: 444,
        paint(p) {
          armchair(p, 238, 444, "#4c8a58", "#2f6a45", ["#c9b073", "#a8823e"]);
        },
      },
      {
        y: 462,
        paint(p) {
          crate(p, 680, 462);
          crate(p, 716, 462);
          crate(p, 696, 436, 30, 22);
          p.rect(704, 420, 12, 6, "#9aa5a8");
        },
      },
      { y: 480, paint: (p) => plant(p, 410, 480) },
    ],
    animate(p, time) {
      // Firelight through the stove's grate.
      const f = p.reduced ? 1 : Math.floor(time * 7) % 3;
      p.rect(698, 244 - f * 2, 44, 14 + f * 2, "#c4552e");
      p.rect(706, 248 - f, 28, 10, "#f6c35a");
      p.rect(694, 232, 52, 4, "#1a1c1e");
      for (let x = 700; x < 744; x += 10) p.rect(x, 236, 2, 24, "#1a1c1e");
      p.glow(720, 250, 70, "#f2a24a");
    },
  },

  // The Observatory: a brass telescope at a round window full of stars,
  // a wall of books, charts, a globe and a writing desk by candlelight.
  career: {
    label: "The Observatory",
    wall: ["#594332", "#83603e", "#342a27"],
    floor: ["#67442e", "#99693d", "#39281e"],
    rug: ["#2d4f8c", "#d7bd78", "#b9cdf2"],
    solids: [
      [182, 222, 318, 268],
      [596, 222, 690, 276],
      [656, 222, 778, 376],
      [206, 386, 276, 430],
      [690, 440, 764, 476],
      [544, 464, 576, 490],
    ],
    flames: [
      [690, 277],
      [748, 281],
      [496, 145],
    ],
    backdrop(p) {
      // Floor-to-beam bookshelf.
      p.rect(190, 106, 120, 160, "#4a3220");
      p.rect(196, 112, 108, 148, "#2a1c12");
      for (const y of [146, 186, 226, 258]) {
        p.rect(196, y, 108, 4, "#6b4a2e");
        books(p, 198, y, 104, y * 13);
      }
      p.rect(190, 106, 120, 6, "#6b4a2e");
      // A star chart and a map with a dotted route.
      p.rect(330, 122, 74, 60, "#e8d7ad");
      p.rect(334, 126, 66, 52, "#24395f");
      const r = seeded(31);
      for (let i = 0; i < 12; i++)
        p.rect(338 + r() * 58, 130 + r() * 44, 2, 2, "#f6ecd2");
      for (const [ax, ay, bx, by] of [
        [346, 140, 362, 150],
        [362, 150, 380, 144],
        [380, 144, 388, 164],
      ])
        for (let t = 0; t <= 1; t += 0.2)
          p.rect(ax + (bx - ax) * t, ay + (by - ay) * t, 2, 2, "#d7bd78");
      p.rect(364, 118, 6, 6, "#a8323a");
      p.rect(414, 132, 50, 40, "#d9c08c");
      p.rect(420, 138, 18, 14, "#8ea676");
      p.rect(440, 150, 18, 14, "#8ea676");
      for (let t = 0; t < 1; t += 0.2)
        p.rect(424 + t * 30, 146 + t * 12, 2, 2, "#8c2a2f");
      // Shelf with a trophy, a medal and a candle.
      shelf(p, 478, 160, 70);
      p.rect(512, 136, 14, 12, "#e7c46e");
      p.rect(508, 134, 22, 4, "#f2d48a");
      p.rect(516, 148, 6, 6, "#c49a4a");
      p.rect(512, 154, 14, 6, "#8a6844");
      p.rect(534, 140, 2, 10, "#2d4f8c");
      p.ellipse(535, 152, 10, 10, "#e7c46e");
      candleStick(p, 496, 160, 12);
      // The great round window and its telescope.
      p.ellipse(640, 160, 112, 112, WOOD_DARK);
      p.ellipse(640, 160, 100, 100, "#8a6844");
      p.ellipse(640, 160, 92, 92, "#101c2a");
      const s = seeded(77);
      for (let i = 0; i < 22; i++) {
        const a = s() * Math.PI * 2,
          d = s() * 40;
        p.rect(
          640 + Math.cos(a) * d,
          160 + Math.sin(a) * d,
          2,
          2,
          i % 4 ? "#c9d3e0" : "#f6dc8e",
        );
      }
      p.ellipse(660, 140, 18, 18, "#e5e4c7");
      p.ellipse(654, 136, 6, 4, "#c6ceb4");
      p.rect(638, 114, 4, 92, "#8a6844");
      p.rect(594, 158, 92, 4, "#8a6844");
      shadow(p, 640, 272, 80);
      p.rect(636, 220, 6, 50, "#5d4430");
      p.path(
        [
          [638, 222],
          [612, 270],
          [618, 270],
        ],
        "#5d4430",
      );
      p.path(
        [
          [640, 222],
          [666, 270],
          [660, 270],
        ],
        "#5d4430",
      );
      p.path(
        [
          [604, 236],
          [614, 244],
          [678, 196],
          [670, 188],
        ],
        "#c49a4a",
      );
      p.path(
        [
          [606, 234],
          [610, 238],
          [672, 192],
          [670, 190],
        ],
        "#f2d48a",
      );
      p.rect(668, 184, 12, 12, "#8a6440");
      p.rect(600, 236, 8, 8, "#5d4430");
      p.ellipse(640, 222, 10, 10, "#7b5a2a");
      // Writing desk against the right wall: letters, quill and two candles.
      shadow(p, 720, 372, 118);
      p.rect(664, 294, 112, 10, "#8a6440");
      p.rect(664, 292, 112, 4, "#a87c4a");
      p.rect(670, 304, 8, 66, "#5d4430");
      p.rect(762, 304, 8, 66, "#5d4430");
      p.rect(680, 304, 76, 20, "#6b4a2e");
      p.rect(712, 312, 12, 2, "#e7c46e");
      p.rect(706, 286, 26, 8, "#efe2c0");
      p.rect(710, 284, 22, 2, "#f6ecd2");
      p.rect(734, 270, 2, 18, "#f6ecd2");
      p.rect(736, 270, 4, 6, "#e8e4d0");
      p.rect(724, 286, 8, 6, "#24395f");
      candleStick(p, 690, 292, 12);
      candleStick(p, 748, 292, 8);
    },
    props: [
      {
        y: 428,
        paint(p) {
          // Globe on a brass stand.
          shadow(p, 242, 428, 50);
          p.rect(230, 422, 24, 6, "#5d4430");
          p.rect(240, 394, 4, 30, "#c49a4a");
          p.ellipse(242, 380, 40, 40, "#c49a4a");
          p.ellipse(242, 380, 34, 34, "#3a6a8c");
          p.ellipse(234, 372, 14, 10, "#6f9a5a");
          p.ellipse(250, 386, 12, 12, "#6f9a5a");
          p.rect(236, 388, 6, 4, "#6f9a5a");
          p.rect(232, 366, 4, 2, "#b9cdf2");
        },
      },
      {
        y: 472,
        paint(p) {
          // A cushion with a sleeping cat.
          shadow(p, 726, 472, 70);
          p.ellipse(726, 462, 64, 22, "#2d4f8c");
          p.ellipse(726, 458, 56, 16, "#4a6fae");
          p.ellipse(724, 450, 36, 16, "#5a5a5a");
          p.ellipse(708, 446, 14, 12, "#5a5a5a");
          p.rect(702, 438, 4, 6, "#5a5a5a");
          p.rect(710, 438, 4, 6, "#5a5a5a");
          p.rect(704, 446, 4, 2, "#2a2a2a");
          p.ellipse(728, 448, 22, 6, "#6e6e6e");
        },
      },
      { y: 482, paint: (p) => plant(p, 560, 482) },
    ],
    animate(p, time) {
      hearthFire(p, 250, 256, 52, time);
      const flick = p.reduced ? 0 : Math.round(Math.sin(time * 0.9)) * 2;
      p.rect(742, 454 + flick, 10, 4, "#5a5a5a");
      // A shooting star crosses the window now and then.
      if (!p.reduced) {
        const k = (time % 9) / 1.2;
        if (k < 1) {
          p.ctx.save();
          p.ctx.beginPath();
          p.ctx.arc(640, 160, 44, 0, Math.PI * 2);
          p.ctx.clip();
          for (let i = 0; i < 4; i++) {
            p.ctx.globalAlpha = 1 - i * 0.22;
            p.rect(604 + k * 70 - i * 6, 132 + k * 30 - i * 3, 4, 2, "#fff6d0");
          }
          p.ctx.restore();
        }
      }
    },
  },

  // The Arcade: glowing cabinets, a CRT with a console, fairy lights,
  // posters, a sofa and a beanbag for long sessions.
  gamedev: {
    label: "The Arcade",
    wall: ["#583c39", "#7e5146", "#34232a"],
    floor: ["#68432e", "#99673e", "#3d2922"],
    rug: ["#783236", "#b2874b", "#d0a168"],
    solids: [
      [182, 222, 330, 272],
      [626, 222, 778, 268],
      [610, 398, 780, 460],
      [206, 420, 294, 468],
    ],
    flames: [],
    backdrop(p) {
      // Two arcade cabinets.
      for (const [x, body, trim] of [
        [204, "#3c1f4c", "#8b5a9c"],
        [268, "#24395f", "#4a6fae"],
      ]) {
        shadow(p, x + 26, 272, 64);
        p.rect(x, 136, 52, 132, body);
        p.rect(x - 2, 132, 56, 22, trim);
        p.rect(x + 6, 136, 40, 12, "#f6cf5a");
        p.rect(x + 10, 140, 32, 4, "#a8323a");
        p.rect(x + 4, 160, 44, 38, "#120c18");
        p.path(
          [
            [x, 204],
            [x + 52, 204],
            [x + 56, 222],
            [x - 4, 222],
          ],
          trim,
        );
        p.rect(x + 10, 208, 4, 8, "#2a2a2a");
        p.ellipse(x + 12, 206, 8, 6, "#a8323a");
        p.ellipse(x + 30, 214, 6, 6, "#f6cf5a");
        p.ellipse(x + 40, 212, 6, 6, "#7fc0a0");
        p.rect(x + 18, 240, 16, 10, "#120c18");
        p.rect(x + 22, 244, 8, 2, "#f6cf5a");
        p.rect(x + 2, 222, 4, 46, trim);
        p.rect(x + 46, 222, 4, 46, trim);
      }
      // Posters: a mushroom and a sword.
      p.rect(352, 122, 54, 66, "#e8d7ad");
      p.rect(356, 126, 46, 58, "#2a3a34");
      p.ellipse(379, 150, 32, 22, "#c4552e");
      p.rect(371, 144, 6, 6, "#f6ecd2");
      p.rect(385, 148, 6, 6, "#f6ecd2");
      p.rect(372, 158, 14, 16, "#efe2c0");
      p.rect(376, 162, 2, 4, "#2a1a0c");
      p.rect(382, 162, 2, 4, "#2a1a0c");
      p.rect(552, 122, 54, 66, "#e8d7ad");
      p.rect(556, 126, 46, 58, "#3c1f4c");
      p.rect(578, 132, 4, 34, "#c9d1c4");
      p.rect(578, 132, 2, 34, "#ffffff");
      p.rect(570, 164, 20, 4, "#e7c46e");
      p.rect(578, 168, 4, 10, "#8a5a33");
      p.rect(574, 176, 12, 4, "#e7c46e");
      // Shelf of game cartridges above the lectern.
      shelf(p, 430, 162, 100);
      for (let i = 0; i < 9; i++) {
        const c = ["#8c2a2f", "#2f6a45", "#2d4f8c", "#c49a4a", "#693c7e"][
          i % 5
        ];
        p.rect(436 + i * 10, 146, 8, 16, "#59646a");
        p.rect(437 + i * 10, 148, 6, 8, c);
      }
      // CRT on a low cabinet with a console and two controllers.
      shadow(p, 702, 270, 150);
      p.rect(630, 230, 144, 38, "#6b4a2e");
      p.rect(630, 228, 144, 4, "#8a6440");
      p.rect(640, 240, 56, 22, "#4a3220");
      p.rect(706, 240, 56, 22, "#4a3220");
      p.rect(666, 248, 4, 4, "#c49a4a");
      p.rect(732, 248, 4, 4, "#c49a4a");
      p.rect(664, 168, 76, 60, "#59646a");
      p.rect(660, 172, 84, 54, "#4a5056");
      p.rect(668, 176, 56, 44, "#0e141a");
      p.rect(728, 182, 10, 4, "#2a2a2a");
      p.rect(728, 190, 10, 4, "#2a2a2a");
      p.ellipse(733, 206, 6, 6, "#a8323a");
      p.rect(690, 160, 2, 10, "#2a2a2a");
      p.rect(708, 156, 2, 14, "#2a2a2a");
      p.rect(636, 220, 26, 8, "#d9d3c4");
      p.rect(640, 222, 8, 2, "#a8323a");
      p.rect(746, 222, 18, 6, "#2a2a2a");
      p.rect(750, 220, 4, 2, "#f6cf5a");
    },
    props: [
      {
        y: 456,
        paint(p) {
          // A sofa facing the television, back to the visitor.
          shadow(p, 696, 458, 150);
          p.rect(624, 404, 144, 52, "#3c1f4c");
          p.rect(628, 400, 136, 32, "#693c7e");
          p.rect(628, 400, 136, 4, "#8b5a9c");
          p.rect(694, 404, 2, 28, "#3c1f4c");
          p.rect(616, 410, 16, 46, "#4b2a5c");
          p.rect(760, 410, 16, 46, "#4b2a5c");
          p.rect(616, 406, 16, 6, "#8b5a9c");
          p.rect(760, 406, 16, 6, "#8b5a9c");
          p.rect(644, 392, 22, 14, "#d6b36f");
          p.rect(646, 394, 18, 2, "#f2d48a");
        },
      },
      {
        y: 466,
        paint(p) {
          // A beanbag with a controller tossed on it.
          shadow(p, 250, 466, 84);
          p.ellipse(250, 446, 82, 40, "#a8673a");
          p.ellipse(244, 438, 60, 24, "#c48450");
          p.ellipse(252, 428, 36, 14, "#d69a62");
          p.rect(256, 430, 18, 8, "#2a2a2a");
          p.rect(258, 428, 4, 2, "#f6cf5a");
          p.rect(268, 432, 2, 2, "#a8323a");
        },
      },
      {
        y: 404,
        paint(p) {
          // Snacks on the rug.
          p.ellipse(560, 400, 26, 10, "#8c2a2f");
          p.ellipse(560, 396, 20, 6, "#e7c46e");
          p.rect(554, 392, 4, 2, "#f6dc8e");
          p.rect(564, 392, 4, 2, "#f6dc8e");
        },
      },
    ],
    animate(p, time) {
      const t = p.reduced ? 0 : time;
      // Fairy lights twinkle along the ceiling beam.
      const lights = ["#f6cf5a", "#e48f7a", "#7fc0a0", "#b9cdf2", "#e2bff0"];
      for (let i = 0; i < 26; i++) {
        const x = 190 + i * 23.5,
          sag = Math.round(Math.sin(((i % 6) / 5) * Math.PI) * 5) * 2;
        p.rect(x, 108 + sag, 22, 2, "#2a1c12");
        const on = p.reduced || Math.floor(t * 2.5 + i * 0.7) % 4 !== 0;
        if (on) p.glow(x + 2, 114 + sag, 12, lights[i % 5]);
        p.rect(x, 110 + sag, 4, 6, on ? lights[i % 5] : "#4a3a40");
      }
      // Attract-mode screens preview the two playable cabinets: a muncher
      // clearing a corridor with a wisp on its tail, and an owl flapping
      // between mossy pillars.
      {
        const x = 208,
          run = (t * 10) % 44,
          mx = x + 2 + Math.floor(run / 2) * 2,
          inside = (left) => left >= x + 4 && left <= x + 34;
        p.rect(x + 4, 164, 36, 30, "#0b0614");
        p.rect(x + 4, 164, 36, 2, "#8b5a9c");
        p.rect(x + 4, 192, 36, 2, "#8b5a9c");
        p.rect(x + 12, 170, 20, 4, "#5a3a68");
        p.rect(x + 12, 184, 20, 4, "#5a3a68");
        for (let dx = 6; dx < 34; dx += 6)
          if (x + 4 + dx > mx + 4) p.rect(x + 4 + dx, 178, 2, 2, "#f6e08a");
        if (inside(mx)) {
          p.rect(mx, 176, 6, 6, "#f6cf5a");
          if (Math.floor(t * 8) % 2) p.rect(mx + 4, 178, 2, 2, "#0b0614");
        }
        if (inside(mx - 12)) {
          p.rect(mx - 12, 176, 6, 6, "#e4573d");
          p.rect(mx - 10, 178, 2, 2, "#fff3d6");
        }
        p.glow(x + 22, 178, 34, "#8b5a9c");
      }
      {
        const x = 272,
          scroll = Math.floor(((t * 12) % 18) / 2) * 2,
          bob = Math.round(Math.sin(t * 5)) * 2;
        p.rect(x + 4, 164, 36, 30, "#101a3e");
        p.rect(x + 32, 168, 4, 4, "#f3c46e");
        for (let k = 0; k < 3; k++) {
          const px = x + 40 - scroll - k * 18,
            gap = 172 + (k % 2) * 4;
          if (px < x + 4 || px > x + 36) continue;
          p.rect(px, 164, 4, gap - 164, "#5d6a66");
          p.rect(px, gap + 12, 4, 194 - gap - 12, "#5d6a66");
          p.rect(px, gap + 12, 4, 2, "#3d704f");
        }
        p.rect(x + 12, 176 + bob, 6, 6, "#a8673a");
        p.rect(x + 12, 176 + bob, 2, 2, "#f6e08a");
        p.rect(x + 16, 176 + bob, 2, 2, "#f6e08a");
        p.rect(x + 4, 192, 36, 2, "#3d704f");
        p.glow(x + 22, 178, 34, "#4a6fae");
      }
      // The CRT plays a little side-scroller.
      const run = Math.floor(t * 6) % 24;
      p.rect(668, 176, 56, 44, "#5a8ab0");
      p.rect(668, 208, 56, 12, "#4a7a3a");
      for (let i = 0; i < 4; i++) {
        const bx = 668 + ((i * 16 - run * 2 + 96) % 64);
        if (bx < 718) p.rect(bx, 200, 6, 8, "#8a5a33");
      }
      p.ellipse(680 + ((run * 3) % 20), 188, 14, 6, "#e8e4d0");
      const jump = [0, 2, 4, 4, 2, 0][Math.floor(t * 6) % 6] * 2;
      p.rect(690, 198 - jump, 6, 10, "#c4552e");
      p.rect(690, 196 - jump, 6, 4, "#e8c08a");
      p.glow(696, 198, 50, "#9fc0e0");
    },
  },

  // The Cabin: home. A stone hearth, a quilted bed, a reading chair with
  // a steaming mug, and the things from beyond the code: a rugby ball,
  // a camera on its tripod and a little chemistry set.
  about: {
    label: "The Cabin",
    wall: ["#65432e", "#986338", "#392c20"],
    floor: ["#72502e", "#a27341", "#46301f"],
    rug: ["#2c4e3c", "#b49a57", "#8ca562"],
    solids: [
      [182, 222, 350, 336],
      [402, 222, 558, 274],
      [596, 222, 704, 264],
      [664, 300, 778, 390],
      [600, 424, 656, 464],
      [390, 464, 430, 490],
    ],
    flames: [
      [436, 131],
      [524, 135],
      [330, 229],
    ],
    backdrop(p) {
      windowPane(p, 214, 122, 70, 60, "#8c2a2f", "#5a1c20");
      // Stone fireplace with a timber mantel.
      shadow(p, 480, 274, 168);
      p.rect(406, 96, 148, 176, "#5a5a54");
      const r = seeded(204);
      for (let y = 98; y < 270; y += 12)
        for (let x = 406 + ((y / 12) % 2) * 10; x < 552; x += 20)
          p.rect(
            x,
            y,
            18,
            10,
            ["#7a7a70", "#6c6c64", "#85837a"][Math.floor(r() * 3)],
          );
      p.rect(398, 150, 164, 10, "#8a6440");
      p.rect(398, 148, 164, 4, "#a87c4a");
      p.rect(398, 160, 164, 2, WOOD_DARK);
      p.rect(434, 190, 92, 82, "#2a2420");
      p.path(
        [
          [434, 190],
          [526, 190],
          [520, 200],
          [440, 200],
        ],
        "#1a1614",
      );
      p.rect(430, 186, 100, 6, "#6c6c64");
      // Mantel: a framed photo, a rugby ball and two candles.
      p.rect(466, 120, 30, 28, "#c49a4a");
      p.rect(470, 124, 22, 20, "#3a5a6a");
      p.ellipse(481, 134, 10, 12, "#dcbb85");
      p.rect(474, 126, 14, 6, "#2a1c12");
      p.rect(470, 140, 22, 4, "#5d7865");
      p.ellipse(506, 140, 20, 12, "#a8673a");
      p.rect(500, 140, 12, 2, "#efe2c0");
      for (let x = 502; x < 512; x += 4) p.rect(x, 138, 2, 4, "#efe2c0");
      candleStick(p, 436, 148, 14);
      candleStick(p, 524, 148, 10);
      // Bed with a patchwork quilt in the corner, a nightstand beside it.
      p.rect(188, 196, 128, 40, "#5d4430");
      p.rect(192, 200, 120, 32, "#8a6440");
      p.rect(192, 200, 120, 4, "#a87c4a");
      shadow(p, 252, 336, 140);
      p.rect(190, 228, 124, 104, "#5d4430");
      p.rect(196, 232, 112, 22, "#efe2c0");
      p.ellipse(226, 242, 40, 18, "#f6ecd2");
      p.ellipse(278, 242, 40, 18, "#f6ecd2");
      const quilt = ["#8c2a2f", "#d8b064", "#b4473f", "#efe2c0", "#5d7865"];
      for (let y = 254, row = 0; y < 324; y += 14, row++)
        for (let x = 196, col = 0; x < 308; x += 14, col++)
          p.rect(x, y, 14, 14, quilt[(row * 2 + col) % 5]);
      p.rect(196, 322, 112, 8, "#5a1c20");
      p.rect(190, 328, 6, 10, "#4a3220");
      p.rect(308, 328, 6, 10, "#4a3220");
      p.rect(316, 240, 28, 28, "#6b4a2e");
      p.rect(316, 238, 28, 4, "#8a6440");
      p.rect(326, 252, 8, 2, "#e7c46e");
      candleStick(p, 330, 240, 8);
      // Wall shelf: books, a camera and a chemistry set.
      shelf(p, 598, 178, 106);
      books(p, 604, 178, 40, 91);
      p.rect(650, 162, 22, 16, "#2a2a2a");
      p.rect(656, 158, 8, 4, "#2a2a2a");
      p.ellipse(661, 170, 10, 10, "#59646a");
      p.ellipse(661, 170, 4, 4, "#9fc0c2");
      p.rect(678, 164, 6, 14, "#cfe0dc");
      p.rect(678, 172, 6, 6, "#7fc0a0");
      p.path(
        [
          [690, 178],
          [702, 178],
          [698, 166],
          [698, 158],
          [694, 158],
          [694, 166],
        ],
        "#cfe0dc",
      );
      p.rect(692, 172, 8, 6, "#e48f7a");
      // Chest of drawers under the shelf with a kettle on top.
      shadow(p, 650, 264, 110);
      p.rect(600, 214, 100, 48, "#6b4a2e");
      p.rect(600, 212, 100, 4, "#8a6440");
      for (const y of [222, 240]) {
        p.rect(606, y, 88, 14, "#7d5735");
        p.rect(646, y + 6, 8, 2, "#e7c46e");
      }
      p.ellipse(624, 204, 22, 16, "#59646a");
      p.rect(614, 196, 20, 4, "#4a5056");
      p.rect(634, 202, 8, 4, "#59646a");
    },
    props: [
      {
        y: 390,
        paint(p) {
          armchair(p, 722, 380, "#b4473f", "#8c2a2f", ["#efe2c0", "#d8b064"]);
          // Side table with a mug of tea.
          p.rect(670, 330, 30, 6, "#8a6440");
          p.rect(682, 336, 6, 30, "#5d4430");
          p.rect(676, 320, 10, 10, "#efe2c0");
          p.rect(686, 322, 4, 6, "#efe2c0");
        },
      },
      {
        y: 462,
        paint(p) {
          // A camera on a tripod, ready for the next shoot.
          shadow(p, 628, 462, 50);
          p.path(
            [
              [626, 424],
              [608, 462],
              [612, 462],
            ],
            "#2a2a2a",
          );
          p.path(
            [
              [630, 424],
              [648, 462],
              [644, 462],
            ],
            "#2a2a2a",
          );
          p.rect(626, 424, 4, 38, "#3a3a3a");
          p.rect(614, 404, 30, 20, "#2a2a2a");
          p.rect(618, 400, 10, 4, "#3a3a3a");
          p.ellipse(612, 414, 12, 14, "#4a5056");
          p.ellipse(612, 414, 6, 8, "#9fc0c2");
          p.rect(636, 408, 4, 4, "#a8323a");
        },
      },
      { y: 484, paint: (p) => plant(p, 410, 484, true) },
    ],
    animate(p, time) {
      hearthFire(p, 480, 268, 64, time);
      if (!p.reduced)
        for (let i = 0; i < 3; i++) {
          const rise = (time * 9 + i * 7) % 20;
          p.ctx.globalAlpha = (1 - rise / 20) * 0.6;
          p.rect(680 + Math.sin(time * 2 + i) * 2, 316 - rise, 2, 2, "#f6ecd2");
          p.rect(
            612 + Math.sin(time * 1.6 + i) * 3,
            192 - rise,
            2,
            2,
            "#e8e4d0",
          );
          p.ctx.globalAlpha = 1;
        }
    },
  },
};

export const interiorIds = Object.keys(ROOMS);
// The two cabinets in the Game Dev cabin are playable: standing in front of
// one (or clicking it) opens its minigame in its own stage.
export const ARCADES = [
  { game: "maze", title: "Maze Munch", x: 204, w: 52, top: 132, bottom: 268 },
  { game: "flap", title: "Night Owl", x: 268, w: 52, top: 132, bottom: 268 },
];
export function interiorArcade(id, x, y) {
  if (id !== "gamedev" || y > 306) return null;
  return ARCADES.find((a) => Math.abs(x - (a.x + a.w / 2)) < a.w / 2 + 4)?.game || null;
}
export function interiorLabel(id) {
  return ROOMS[id]?.label || "";
}

// --- Movement ----------------------------------------------------------------

const LECTERN_SOLID = [
  LECTERN.x - 34,
  LECTERN.y - 26,
  LECTERN.x + 34,
  LECTERN.y + 18,
];

export function interiorWalkable(id, x, y) {
  const room = ROOMS[id];
  if (!room) return false;
  const doorway = x > DOOR.left + 6 && x < DOOR.right - 6 && y <= EXIT_Y + 8;
  if (x < ROOM.left + 36 || x > ROOM.right - 36 || y < 250) return false;
  if (y > FLOOR_END - 8 && !doorway) return false;
  return ![...room.solids, LECTERN_SOLID].some(
    ([left, top, right, bottom]) =>
      x > left && x < right && y > top && y < bottom,
  );
}

// Returns "lectern", "exit" or null for the player's feet.
export function interiorNear(x, y) {
  if (Math.hypot(x - LECTERN.x, (y - LECTERN.y - 14) * 1.2) < 52)
    return "lectern";
  if (y > 474 && Math.abs(x - DOOR.x) < 36) return "exit";
  return null;
}

// --- Painting ----------------------------------------------------------------

// The static room, cached once per cabin: the dimmed village, the shell,
// wall decor and everything standing against the back wall.
export function paintInterior(p, id) {
  const room = ROOMS[id];
  const { left, top, right, bottom } = ROOM;
  const width = right - left;
  // The village sinks into the night around the lit room.
  p.ctx.save();
  for (let y = 0; y < 540; y += 4) {
    const edge = Math.min(1, y / 70, (540 - y) / 40);
    p.ctx.globalAlpha = (Math.ceil(edge * 5) / 5) * 0.82;
    p.rect(0, y, 960, 4, "#060a0b");
  }
  p.ctx.restore();
  p.rect(left - 10, top - 10, width + 20, bottom - top + 22, "#0b100e");
  // Log back wall.
  const [wall, wallLight, wallDark] = room.wall;
  p.rect(left, top, width, WALL_FOOT - top, wall);
  for (let y = top + 12; y < WALL_FOOT; y += 14) {
    p.rect(left, y, width, 2, wallLight);
    p.rect(left, y + 10, width, 2, wallDark);
  }
  // Plank floor with staggered seams.
  const [floor, floorLight, floorDark] = room.floor;
  p.rect(left, WALL_FOOT, width, FLOOR_END - WALL_FOOT, floor);
  for (let y = WALL_FOOT + 4, row = 0; y < FLOOR_END; y += 14, row++) {
    p.rect(left, y + 12, width, 2, floorDark);
    p.ctx.save();
    p.ctx.globalAlpha = 0.28;
    p.rect(left, y, width, 2, floorLight);
    p.ctx.restore();
    for (let x = left + ((row * 37) % 110); x < right; x += 110)
      p.rect(x, y, 2, 12, floorDark);
    if (row % 2) p.rect(left + ((row * 53) % width), y + 6, 2, 2, floorDark);
  }
  // Grain is generated once with the room cache, at the same two-unit grid.
  const grain = seeded(
    902 + [...id].reduce((sum, c) => sum + c.charCodeAt(0), 0),
  );
  for (let y = WALL_FOOT + 6; y < FLOOR_END; y += 14)
    for (let x = left + 16; x < right - 12; x += 42) {
      const offset = Math.floor(grain() * 7) * 2;
      p.rect(x + offset, y + 2, 12 + grain() * 14, 2, "#4c2b201f");
      p.rect(x + offset + 3, y + 5, 8 + grain() * 12, 2, "#efbd7730");
      if (grain() > 0.7) {
        p.rect(x + offset, y + 6, 6, 2, "#442a225e");
        p.rect(x + offset + 2, y + 4, 2, 6, "#442a222a");
      }
    }
  // Stepped shadow at the cutaway and warm light beneath the original walls.
  p.ctx.save();
  for (let i = 0; i < 4; i++) {
    p.ctx.globalAlpha = 0.03 + i * 0.015;
    p.rect(left, FLOOR_END - 6 - i * 4, width, 6 + i * 4, "#171523");
    p.rect(left + 14, WALL_FOOT, 12 + i * 4, FLOOR_END - WALL_FOOT, "#171523");
    p.rect(
      right - 26 - i * 4,
      WALL_FOOT,
      12 + i * 4,
      FLOOR_END - WALL_FOOT,
      "#171523",
    );
  }
  p.ctx.restore();
  p.ctx.save();
  p.ctx.globalAlpha = 0.35;
  p.rect(left, WALL_FOOT, width, 10, "#000000");
  p.ctx.restore();
  p.rect(left, WALL_FOOT - 6, width, 6, WOOD_DARK);
  // Ceiling beam, corner posts and the front wall cut away at the doorway.
  p.rect(left, top, width, 10, WOOD);
  p.rect(left, top + 10, width, 2, WOOD_DARK);
  for (const x of [left, right - 14]) {
    p.rect(x, top, 14, bottom - top, WOOD);
    p.rect(x + 4, top, 2, bottom - top, "#5a4330");
  }
  for (let y = top + 18; y < WALL_FOOT; y += 14) {
    p.ellipse(left + 7, y, 12, 12, wallLight);
    p.ellipse(left + 7, y, 6, 6, wallDark);
    p.ellipse(right - 7, y, 12, 12, wallLight);
    p.ellipse(right - 7, y, 6, 6, wallDark);
  }
  for (const [a, b] of [
    [left, DOOR.left],
    [DOOR.right, right],
  ]) {
    p.rect(a, FLOOR_END, b - a, bottom - FLOOR_END, WOOD);
    p.rect(a, FLOOR_END, b - a, 2, "#5a4330");
  }
  p.rect(DOOR.left - 4, FLOOR_END - 6, 4, 18, "#5a4330");
  p.rect(DOOR.right, FLOOR_END - 6, 4, 18, "#5a4330");
  // Doormat and the night beyond the open door.
  p.rect(
    DOOR.left,
    FLOOR_END,
    DOOR.right - DOOR.left,
    bottom - FLOOR_END,
    "#101a17",
  );
  p.rect(DOOR.x - 22, FLOOR_END - 10, 44, 12, "#8a6844");
  for (let x = DOOR.x - 20; x < DOOR.x + 22; x += 6)
    p.rect(x, FLOOR_END - 8, 2, 8, "#6b4a2e");
  // Warm lamplight pools on the floor.
  const [rugBase, rugEdge, rugAccent] = room.rug;
  rug(p, LECTERN.x, LECTERN.y + 4, 210, 92, rugBase, rugEdge, rugAccent);
  if (id !== "career")
    wovenRug(p, LECTERN.x, LECTERN.y + 4, 210, 92, rugBase, rugEdge, rugAccent);
  room.backdrop(p);
  roomDetails(p, id);
  // A hanging lantern from the beam.
  p.rect(LECTERN.x - 1, top + 10, 2, 14, "#2a2a2a");
  p.rect(LECTERN.x - 8, top + 24, 16, 4, "#4a3a2a");
  p.rect(LECTERN.x - 6, top + 28, 12, 12, "#f6cf5a");
  p.rect(LECTERN.x - 8, top + 40, 16, 4, "#4a3a2a");
}

// Each frame: depth-sorted props, the player, flames and the quest marker.
export function drawInteriorScene(p, id, time, drawPlayer, lecternLit) {
  const room = ROOMS[id];
  if (!room) return;
  const scene = [
    ...room.props.map((prop) => ({
      y: prop.y,
      draw: () => prop.paint(p, time),
    })),
    { y: LECTERN.y, draw: () => lectern(p, lecternLit) },
    { y: p.player.y, draw: drawPlayer },
  ].sort((a, b) => a.y - b.y);
  scene.forEach((item) => item.draw());
  room.flames.forEach(([x, y], i) => flame(p, x, y, time, i));
  room.animate?.(p, time);
  p.glow(LECTERN.x, ROOM.top + 34, 60, "#f6cf5a");
  exclamation(p, time);
}

import { paintGround, paintFern } from "./ground.js";

const WIDTH = 960;

function random(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function mushroom(p, x, y) {
  p.rect(x - 2, y - 8, 4, 8, "#cbb792");
  p.ellipse(x, y - 9, 14, 8, "#ad725e");
  p.rect(x - 4, y - 12, 2, 2, "#e2c89d");
}

function log(p, x, y) {
  p.rect(x - 27, y - 8, 54, 16, "#4b3c2c");
  p.rect(x - 25, y - 7, 48, 4, "#796043");
  p.ellipse(x + 27, y, 12, 16, "#aa8b59");
  p.ellipse(x + 27, y, 6, 10, "#6c5038");
  p.rect(x - 13, y + 4, 18, 3, "#405339");
}

const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
const mix = (a, b, t) => {
  const from = a.match(/\w\w/g).map((h) => parseInt(h, 16)),
    to = b.match(/\w\w/g).map((h) => parseInt(h, 16));
  return `#${from
    .map((v, i) =>
      Math.round(lerp(v, to[i], t))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
};
export const CAMPER_LOOP = 13;
// One toasting loop: reach in, toast golden, catch fire, blow it out, eat,
// skewer a fresh marshmallow from the bag. Offsets are relative to the fire.
export function camperState(time, reduced = false) {
  const s = reduced ? 3 : ((time % CAMPER_LOOP) + CAMPER_LOOP) % CAMPER_LOOP;
  const rest = [-58, -16],
    toast = [-21, -6],
    blow = [-64, -12],
    mouth = [-76, -8],
    bag = [-46, 36];
  const at = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  let end = toast,
    phase = "toast",
    roast = 0,
    bites = 0;
  if (s < 0.9) {
    end = at(rest, toast, s / 0.9);
    phase = "reach";
  } else if (s < 6.4) {
    roast = (s - 0.9) / 5.5;
    end = [toast[0], toast[1] + Math.round(Math.sin(s * 3)) * 2];
  } else if (s < 8) {
    phase = "burning";
    roast = 1 + (s - 6.4) / 1.6;
  } else if (s < 9.4) {
    phase = "blowing";
    roast = 2;
    end = at(toast, blow, (s - 8) / 0.5);
  } else if (s < 11) {
    phase = "eating";
    roast = 1.4;
    end = at(blow, mouth, (s - 9.4) / 0.4);
    bites = Math.max(0, Math.min(3, Math.floor((s - 9.6) / 0.45) + 1));
  } else if (s < 12.2) {
    phase = "reload";
    end = at(mouth, bag, (s - 11) / 0.7);
    bites = s < 11.8 ? 3 : 0;
  } else {
    phase = "reach";
    end = at(bag, rest, (s - 12.2) / 0.8);
  }
  return { s, phase, end, roast, bites, burning: phase === "burning" || (phase === "blowing" && s < 8.9) };
}
function camper(p, x, y, time, reduced) {
  const state = camperState(time, reduced);
  const [ex, ey] = state.end;
  const breathe = reduced ? 0 : Math.floor(time * 1.3) % 3 === 0 ? 2 : 0;
  const lean = state.phase === "blowing" || state.phase === "eating" ? 2 : 0;
  const chew =
    state.phase === "eating" && !reduced ? (Math.floor(time * 7) % 2) * 2 : 0;
  const glow = reduced ? 0 : Math.floor(time * 6) % 3;
  const warm = ["#f2b676", "#f6c588", "#eaa866"][glow];
  // Legs folded over the log, boots planted in the dirt.
  p.ellipse(x - 76, y + 44, 34, 7, "#2c241b");
  p.rect(x - 88, y + 18, 22, 8, "#3b4658");
  p.rect(x - 70, y + 20, 8, 20, "#3b4658");
  p.rect(x - 72, y + 38, 12, 6, "#33271d");
  p.rect(x - 70, y + 20, 3, 18, "#56637a");
  // Plaid flannel torso with a firelit edge.
  const ty = y - 4 + breathe / 2 - lean / 2;
  p.rect(x - 96, ty, 18, 26, "#9c4f37");
  for (const dy of [4, 12, 20]) p.rect(x - 96, ty + dy, 18, 2, "#6f3326");
  for (const dx of [-92, -85]) p.rect(x + dx, ty, 2, 26, "#7c3b2b");
  p.rect(x - 80, ty + 2, 2, 22, warm);
  // Head in a knitted beanie; it leans in to blow and to eat.
  const hx = x - 94 + lean,
    hy = ty - 15 + chew / 2;
  p.rect(hx - 2, hy + 2, 4, 9, "#4f3424");
  p.rect(hx, hy, 14, 14, "#d6ab84");
  p.rect(hx + 12, hy + 2, 2, 10, warm);
  p.rect(hx - 2, hy - 6, 18, 8, "#3f6e7a");
  p.rect(hx - 2, hy - 1, 18, 2, "#2c5059");
  p.rect(hx + 4, hy - 9, 6, 4, "#e5dcc6");
  p.rect(hx + 9, hy + 4, 2, 3, "#2b2621");
  p.rect(hx + 7, hy + 9, 3, 2, "#c98463");
  if (state.phase === "blowing") {
    p.rect(hx + 12, hy + 9, 3, 3, "#5a3125");
    for (let i = 0; i < 3; i++) {
      const drift = ((state.s - 8) * 22 + i * 7) % 26;
      p.ctx.globalAlpha = Math.max(0, 0.7 - drift / 30);
      p.rect(hx + 16 + drift, hy + 8 - i * 2, 4 + i * 2, 3, "#e7e2d4");
      p.ctx.globalAlpha = 1;
    }
  } else p.rect(hx + 11, hy + 10, 3, 1 + chew / 2, "#7b4434");
  // Arms follow the stick; the hand stays a fixed reach from the shoulder.
  const handX = Math.max(x - 73, x - 70 + (ex - -21) * 0.18),
    handY = y + 4 + (ey - -6) * 0.25;
  p.path(
    [
      [x - 84, ty + 4],
      [handX, handY - 2],
      [handX, handY + 4],
      [x - 86, ty + 11],
    ],
    "#b5634a",
  );
  p.rect(handX - 2, handY - 2, 6, 6, "#d6ab84");
  // The stick: tail tucked under the arm, tip held at the marshmallow.
  const tipX = x + ex,
    tipY = y + ey,
    dx = tipX - handX,
    dy = tipY - handY,
    len = Math.hypot(dx, dy) || 1;
  const tailX = handX - (dx / len) * 12,
    tailY = handY - (dy / len) * 12;
  const nx = (-dy / len) * 1.2,
    ny = (dx / len) * 1.2;
  p.path(
    [
      [tailX + nx, tailY + ny],
      [tipX + nx, tipY + ny],
      [tipX - nx, tipY - ny],
      [tailX - nx, tailY - ny],
    ],
    "#b08c5b",
  );
  // The marshmallow browns, chars, and is eaten in three bites.
  if (state.bites < 3) {
    const r = state.roast;
    const color =
      r <= 1
        ? r < 0.55
          ? mix("f4eedf", "e9c17a", r / 0.55)
          : mix("e9c17a", "b8773d", (r - 0.55) / 0.45)
        : mix("b8773d", "3a2a20", Math.min(1, r - 1));
    const width = 10 - state.bites * 3;
    p.rect(tipX - 5, tipY - 4, width, 8, color);
    p.rect(tipX - 5, tipY - 4, width, 2, mix(color.slice(1), "ffffff", 0.25));
    if (state.burning) {
      const f = reduced ? 0 : Math.floor(time * 12) % 3;
      p.rect(tipX - 3, tipY - 9 - f, 6, 6 + f, "#e98a3a");
      p.rect(tipX - 1, tipY - 12 + f, 3, 5, "#ffd27a");
    }
  }
  if (state.phase === "eating" && state.s > 10.3 && !reduced) {
    // A small happy heart rises after the last bite.
    const rise = (state.s - 10.3) * 24;
    p.ctx.globalAlpha = Math.max(0, 1 - rise / 20);
    const cx = hx + 6,
      cy = hy - 14 - rise;
    p.rect(cx - 4, cy, 3, 3, "#e0707a");
    p.rect(cx + 1, cy, 3, 3, "#e0707a");
    p.rect(cx - 4, cy + 2, 8, 3, "#e0707a");
    p.rect(cx - 2, cy + 5, 4, 2, "#e0707a");
    p.ctx.globalAlpha = 1;
  }
}

function campfire(p, x, y, includeActors = false) {
  // An outdoor clearing: warm stones, log seats and cocoa under the trees.
  p.light?.({ kind: "point", x, y: y + 8, r: 150, color: "#ff9a40", power: 1.05, flatten: 1.6 });
  p.light?.({ kind: "emit", x: x - 14, y: y - 26, w: 28, h: 40 });
  p.ellipse(x, y + 20, 242, 172, "#304334");
  p.path(
    [
      [x - 100, y + 16],
      [x - 72, y - 49],
      [x - 12, y - 68],
      [x + 67, y - 43],
      [x + 110, y + 24],
      [x + 68, y + 82],
      [x - 46, y + 88],
      [x - 105, y + 54],
    ],
    "#514432",
  );
  p.ellipse(x, y + 12, 152, 116, "#614b32");
  p.ellipse(x, y + 8, 108, 74, "#775435");
  for (const [dx, dy] of [
    [-88, 17],
    [-57, -36],
    [66, -17],
    [72, 58],
    [-44, 69],
  ]) {
    p.rect(x + dx, y + dy, 8, 4, "#79654a");
    p.rect(x + dx + 2, y + dy - 2, 4, 2, "#96835b");
  }
  // Three fallen trunks form seats; bright cut ends show their growth rings.
  for (const [dx, dy] of [
    [-82, 35],
    [81, 35],
    [0, 77],
  ]) {
    log(p, x + dx, y + dy);
    p.rect(x + dx - 22, y + dy - 6, 41, 3, "#997048");
    p.rect(x + dx - 12, y + dy - 2, 22, 2, "#6b4c33");
  }
  // A wool blanket rests on one log rather than furnishing the woodland.
  p.rect(x - 91, y + 27, 17, 18, "#72867a");
  for (const dy of [30, 36, 42]) p.rect(x - 91, y + dy, 17, 2, "#a1ad91");
  p.ellipse(x, y + 6, 82, 42, "#352e27");
  const stone = (dx, dy, tone) => {
    p.ellipse(x + dx, y + dy, 17, 11, tone);
    p.rect(x + dx - 5, y + dy - 3, 9, 2, "#a19c81");
  };
  for (const angle of [
    Math.PI,
    Math.PI * 1.2,
    Math.PI * 1.4,
    Math.PI * 1.6,
    Math.PI * 1.8,
    Math.PI * 2,
  ])
    stone(Math.cos(angle) * 37, Math.sin(angle) * 18 + 7, "#787965");
  // Crossed fuel and layered stepped flames sit inside the stone ring.
  p.path(
    [
      [x - 25, y + 10],
      [x - 21, y + 3],
      [x + 25, y + 17],
      [x + 21, y + 24],
    ],
    "#725035",
  );
  p.path(
    [
      [x - 24, y + 18],
      [x - 20, y + 25],
      [x + 25, y + 8],
      [x + 20, y + 1],
    ],
    "#997045",
  );
  p.path(
    [
      [x - 21, y + 14],
      [x - 23, y - 5],
      [x - 14, y - 1],
      [x - 11, y - 24],
      [x - 3, y - 15],
      [x + 5, y - 41],
      [x + 13, y - 15],
      [x + 20, y - 22],
      [x + 23, y + 14],
    ],
    "#d88538",
  );
  p.path(
    [
      [x - 13, y + 15],
      [x - 14, y - 3],
      [x - 5, y + 1],
      [x + 3, y - 27],
      [x + 10, y - 7],
      [x + 14, y + 15],
    ],
    "#f0bb64",
  );
  p.path(
    [
      [x - 5, y + 15],
      [x - 3, y - 3],
      [x + 3, y - 12],
      [x + 7, y + 15],
    ],
    "#ffe1a0",
  );
  for (const angle of [0.25, 0.65, 1.05, 1.45, 1.85, 2.25, 2.65])
    stone(Math.cos(angle) * 37, Math.sin(angle) * 18 + 7, "#88836b");
  for (const [dx, dy] of [
    [-7, -48],
    [12, -60],
    [5, -78],
  ]) {
    p.rect(x + dx, y + dy, 3, 4, "#d9aa62");
    p.rect(x + dx + 3, y + dy - 7, 2, 2, "#8b8972");
  }
  // A paper bag of marshmallows waits beside the camper's seat.
  p.rect(x - 52, y + 40, 11, 11, "#e6dcc2");
  p.rect(x - 52, y + 40, 11, 2, "#bfb193");
  p.rect(x - 50, y + 45, 7, 3, "#d58f95");
  p.rect(x - 49, y + 37, 4, 4, "#f6f0e2");
  p.rect(x - 45, y + 38, 3, 3, "#f6f0e2");
  if (includeActors) camper(p, x, y, 0, true);
  // A spare marshmallow stick leans from the right seat toward the warmth.
  p.path(
    [
      [x + 80, y + 26],
      [x + 82, y + 23],
      [x + 29, y - 1],
      [x + 27, y + 1],
    ],
    "#b39161",
  );
  p.rect(x + 23, y - 5, 10, 9, "#e8d9b8");
  // A mug and thermos sit on a flat stone beside the right seat.
  p.ellipse(x + 97, y + 2, 33, 18, "#707662");
  p.rect(x + 85, y - 11, 8, 13, "#8aa39a");
  p.rect(x + 86, y - 14, 6, 4, "#b0b6a2");
  p.rect(x + 98, y - 6, 10, 10, "#ddcba4");
  p.rect(x + 100, y - 7, 6, 3, "#654833");
  p.rect(x + 108, y - 3, 3, 6, "#ddcba4");
  p.ellipse(x + 37, y + 99, 29, 16, "#b7966b");
  p.ellipse(x + 48, y + 94, 14, 12, "#c6a67b");
  p.path(
    [
      [x + 42, y + 90],
      [x + 43, y + 84],
      [x + 48, y + 88],
      [x + 52, y + 85],
      [x + 54, y + 91],
    ],
    "#c6a67b",
  );
  p.rect(x + 45, y + 94, 6, 2, "#5d4c3a");
  p.ellipse(x + 25, y + 101, 15, 8, "#d0ad7e");
}

// The lakeside campsite at the bottom of the page: a timber lodge, two
// canvas tents around a campfire, and a lamplit dock reaching into a cove.
// Coordinates are logical units from the clearing's top edge (960 × 600).
const COVE = [
  [990, 584],
  [880, 592],
  [760, 584],
  [662, 556],
  [624, 500],
  [646, 424],
  [706, 372],
  [800, 350],
  [900, 344],
  [990, 352],
];
export function campsiteGeometry(area) {
  const top = area.y;
  const box = (left, t, right, bottom) => ({ left, right, top: top + t, bottom: top + bottom });
  return {
    lodge: box(60, 60, 280, 240),
    woodpile: box(292, 196, 344, 236),
    tents: [box(330, 120, 430, 196), box(500, 96, 600, 172)],
    fire: box(390, 270, 500, 360),
    dock: box(684, 360, 770, 530),
    cove: COVE.map(([x, y]) => [x, top + y]),
  };
}
function inCove(x, y) {
  let inside = false;
  for (let i = 0, j = COVE.length - 1; i < COVE.length; j = i++) {
    const [ax, ay] = COVE[i],
      [bx, by] = COVE[j];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}
export { inCove };
// The fisherman's float and two ducks paddling a slow loop on the cove.
export function campsiteState(time, reduced = false) {
  const t = reduced ? 0 : time;
  const bite = (t % 11) > 9.2;
  return {
    bobber: { x: 806, y: 548 + (reduced ? 0 : Math.round(Math.sin(t * 2.4)) * 2) + (bite ? 4 : 0), bite },
    ducks: [0, 1].map((i) => {
      const angle = t * 0.16 + i * 0.5;
      return {
        x: 866 + Math.cos(angle) * 54 - i * 18,
        y: 452 + Math.sin(angle) * 30 + i * 10,
        facing: -Math.sin(angle) >= 0 ? 1 : -1,
      };
    }),
  };
}
function tent(p, x, y, lit) {
  // A ridge tent: canvas flanks, a dark open flap and guy ropes.
  p.ellipse(x, y + 4, 104, 18, "#1a2218");
  p.path([[x - 48, y], [x - 6, y - 64], [x + 2, y - 64], [x + 50, y]], "#8a7a5a");
  p.path([[x - 40, y], [x - 4, y - 58], [x - 4, y]], "#c8b48a");
  p.path([[x + 2, y - 58], [x + 42, y], [x + 2, y]], "#a8946c");
  p.rect(x - 4, y - 66, 8, 4, "#5c2d1f");
  p.path([[x - 14, y], [x - 1, y - 34], [x + 12, y]], lit ? "#ffb347" : "#2a2218");
  if (lit) {
    p.path([[x - 8, y], [x - 1, y - 24], [x + 6, y]], "#ffd77a");
    p.rect(x - 3, y - 12, 4, 6, "#fff1b8");
    p.light({ kind: "emit", x: x - 10, y: y - 22, w: 20, h: 22 });
    p.light({ kind: "point", x, y: y + 8, r: 70, color: "#ffb860", power: 0.9 });
  }
  for (const side of [-1, 1]) {
    p.rect(x + side * 60, y - 4, 2, 6, "#5c2d1f");
    for (let i = 0; i < 6; i++) p.rect(x + side * (10 + i * 8), y - 50 + i * 8, 2, 2, "#d0c0a0");
  }
}
function lodge(p, x, y) {
  // A low timber lodge on a stone footing, its chimney on the gable end.
  p.ellipse(x + 110, y + 184, 250, 26, "#141810");
  p.rect(x + 176, y + 6, 22, 70, "#2a2a36");
  for (let yy = y + 8; yy < y + 74; yy += 7)
    for (let xx = x + 178; xx < x + 196; xx += 7) p.rect(xx + ((yy / 7) % 2 ? 2 : 0), yy, 6, 5, (xx + yy) % 3 ? "#6a6474" : "#827c8c");
  p.rect(x + 174, y + 2, 26, 6, "#9a94a4");
  p.rect(x + 6, y + 150, 208, 24, "#4a4658");
  for (let xx = x + 8; xx < x + 212; xx += 16) {
    p.rect(xx, y + 152, 14, 9, "#6a6474");
    p.rect(xx + 8, y + 163, 14, 9, "#5a5666");
  }
  p.rect(x + 10, y + 80, 200, 72, "#6a3120");
  for (let yy = y + 84; yy < y + 150; yy += 8) {
    p.rect(x + 10, yy, 200, 2, "#3c201e");
    p.rect(x + 10, yy + 2, 200, 1, "#844024");
    p.rect(x + 6, yy, 6, 6, "#a0613b");
    p.rect(x + 208, yy + 3, 6, 6, "#a0613b");
  }
  p.path([[x - 12, y + 88], [x + 40, y + 34], [x + 180, y + 34], [x + 232, y + 88]], "#24151a");
  p.path([[x - 6, y + 84], [x + 42, y + 38], [x + 178, y + 38], [x + 226, y + 84]], "#4a3434");
  for (let yy = y + 44; yy < y + 84; yy += 6) {
    const t = (yy - y - 38) / 46,
      left = x + 42 - 48 * t,
      right = x + 178 + 48 * t;
    p.rect(left, yy, right - left, 2, "#24151a");
    for (let xx = left + ((yy / 6) % 2 ? 6 : 1); xx < right - 6; xx += 12) p.rect(xx, yy + 2, 8, 2, "#655048");
  }
  p.rect(x - 8, y + 84, 236, 4, "#a0613b");
  p.rect(x - 8, y + 88, 236, 3, "#24151a");
  // Two lit windows and a plank door with its own lantern.
  for (const wx of [x + 28, x + 150]) {
    p.rect(wx - 3, y + 100, 32, 28, "#3c201e");
    p.rect(wx, y + 103, 26, 22, "#ffb347");
    p.rect(wx + 2, y + 105, 10, 18, "#ffd77a");
    p.rect(wx + 12, y + 103, 2, 22, "#3c201e");
    p.rect(wx, y + 113, 26, 2, "#3c201e");
    p.rect(wx - 5, y + 128, 36, 3, "#a0613b");
    p.light({ kind: "emit", x: wx, y: y + 103, w: 26, h: 22 });
    p.light({ kind: "spill", x: wx + 13, y: y + 131, w: 30, h: 22, reach: 56, color: "#ffc070" });
  }
  p.rect(x + 92, y + 98, 36, 52, "#24151a");
  p.rect(x + 95, y + 101, 30, 49, "#5c2d1f");
  for (let xx = x + 98; xx < x + 124; xx += 6) p.rect(xx, y + 103, 2, 45, "#3c201e");
  p.rect(x + 119, y + 124, 3, 3, "#f0c060");
  p.rect(x + 82, y + 150, 56, 6, "#8a7464");
  p.lantern(x + 140, y + 128);
  // Split logs stacked under a little lean-to.
  p.rect(x + 232, y + 140, 54, 36, "#2c181b");
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 5 - row; i++) {
      const lx = x + 238 + i * 10 + row * 5,
        ly = y + 166 - row * 9;
      p.ellipse(lx, ly, 10, 9, "#844024");
      p.ellipse(lx, ly, 6, 5, "#c48a52");
    }
  p.path([[x + 226, y + 140], [x + 256, y + 126], [x + 292, y + 140]], "#4a3434");
  p.rect(x + 296, y + 168, 14, 10, "#6a3622");
  p.rect(x + 302, y + 156, 2, 14, "#8a6a4a");
  p.rect(x + 296, y + 154, 10, 4, "#9a9cb4");
}
function cove(p, area) {
  const top = area.y;
  const water = COVE.map(([x, y]) => [x, top + y]);
  p.path(water.map(([x, y]) => [x - 10, y - 12]), "#4a3e2c");
  p.path(water.map(([x, y]) => [x - 5, y - 6]), "#6a5a40");
  p.path(water, "#1a2550");
  for (let y = 356; y < 596; y += 7)
    for (let x = 610 + ((y * 7) % 19); x < 960; x += 26 + ((x + y) % 13))
      if (inCove(x, y) && inCove(x + 14, y)) p.rect(x, top + y, 8 + ((x * y) % 9), 2, y % 3 ? "#22305f" : "#2c3a70");
  const rand = random(7213);
  for (let i = 0; i < COVE.length - 1; i++) {
    const [ax, ay] = COVE[i],
      [bx, by] = COVE[i + 1];
    for (let t = 0; t < 1; t += 0.22) {
      const x = ax + (bx - ax) * t,
        y = ay + (by - ay) * t,
        w = 12 + rand() * 10;
      p.ellipse(x - 4, top + y - 2, w, 9, rand() < 0.5 ? "#55597a" : "#4a4e6c");
      p.rect(x - 8, top + y - 5, w * 0.4, 2, "#80859f");
    }
  }
  for (const [x, y] of [[640, 470], [668, 420], [700, 566]])
    for (let i = 0; i < 4; i++) {
      p.rect(x + i * 5, top + y - 12 - (i % 2) * 5, 2, 16, "#5a7040");
      p.rect(x + i * 5 - 1, top + y - 15 - (i % 2) * 5, 4, 6, "#8a6a3a");
    }
  for (const [x, y] of [[850, 520], [900, 400], [690, 540], [930, 560]]) {
    p.ellipse(x, top + y, 18, 7, "#3e5a34");
    p.rect(x - 5, top + y - 2, 7, 2, "#6a8a46");
    if (x % 3 === 0) p.rect(x - 2, top + y - 5, 5, 4, "#f0a8c4");
  }
}
function dock(p, area) {
  const top = area.y;
  p.rect(684, top + 356, 50, 170, "#2c181b");
  p.rect(670, top + 486, 94, 44, "#2c181b");
  for (let y = 358; y < 526; y += 6) {
    const wide = y > 488;
    p.rect(wide ? 672 : 686, top + y, wide ? 90 : 46, 5, "#7a3c22");
    p.rect(wide ? 672 : 686, top + y, wide ? 90 : 46, 1, "#b0663a");
  }
  for (const [x, y] of [[680, 380], [730, 380], [680, 440], [730, 440], [666, 528], [760, 528]]) {
    p.rect(x, top + y - 6, 6, 18, "#3c201e");
    p.rect(x + 1, top + y - 6, 2, 18, "#844024");
  }
  // Each dock lamp is doubled in the cove below it.
  for (const [x, y] of [[680, 372], [760, 512]]) {
    p.lantern(x + 2, top + y);
    for (let i = 0; i < 9; i++)
      p.rect(x - 2 + Math.sin(i * 2.1) * 3, top + y + 36 + i * 5, 8 - (i % 3) * 2, 2, i % 3 === 0 ? "#ffd27a" : i % 2 ? "#c07a3a" : "#8a5a3a");
  }
  // A canoe tied alongside, paddle across the thwarts.
  p.ellipse(800, top + 430, 82, 16, "#10173a");
  p.path([[760, top + 424], [842, top + 424], [830, top + 434], [772, top + 434]], "#5c2d1f");
  p.path([[764, top + 424], [838, top + 424], [828, top + 430], [774, top + 430]], "#a0613b");
  p.rect(790, top + 418, 4, 14, "#c48a52");
  p.rect(756, top + 426, 12, 2, "#c0b090");
  // A tackle box and a bait pail at the dock's end.
  p.rect(690, top + 492, 14, 10, "#4a5a3a");
  p.rect(690, top + 492, 14, 2, "#6a7a4a");
  p.rect(740, top + 494, 10, 10, "#7a7690");
}
function fisherman(p, x, y, state, time) {
  // Seated on the dock edge, rod raised, line running out to the float.
  p.rect(x - 8, y - 4, 16, 10, "#3a4a6a");
  p.rect(x - 6, y + 6, 5, 10, "#3a4a6a");
  p.rect(x + 2, y + 6, 5, 10, "#3a4a6a");
  p.rect(x - 7, y + 14, 6, 3, "#3c201e");
  p.rect(x + 2, y + 14, 6, 3, "#3c201e");
  p.rect(x - 9, y - 22, 18, 20, "#8a3a2a");
  p.rect(x - 9, y - 22, 18, 3, "#a84a36");
  p.rect(x - 7, y - 36, 14, 14, "#e0b088");
  p.rect(x - 9, y - 40, 18, 6, "#5a4a3a");
  p.rect(x - 11, y - 36, 22, 3, "#5a4a3a");
  const lift = state.bite ? -4 : Math.round(Math.sin(time * 0.8)) * 2;
  const tip = [x + 46, y - 46 + lift];
  for (let i = 0; i <= 12; i++)
    p.rect(x + 6 + (tip[0] - x - 6) * (i / 12), y - 14 + (tip[1] - y + 14) * (i / 12), 2, 2, "#8a6a4a");
  const { bobber } = state;
  for (let i = 0; i <= 16; i++) {
    const t = i / 16,
      sag = Math.sin(t * Math.PI) * 10;
    p.rect(tip[0] + (bobber.x - tip[0]) * t, tip[1] + (bobber.absY - tip[1]) * t + sag, 2, 2, "#c8c0b0");
  }
}
function duck(p, x, y, facing) {
  p.ellipse(x, y + 4, 20, 5, "#10173a");
  p.ellipse(x, y, 16, 8, "#8a7a5a");
  p.rect(x + facing * 4 - 3, y - 8, 7, 8, "#3a6a4a");
  p.rect(x + facing * 10 - (facing < 0 ? 4 : 0), y - 5, 5, 2, "#d0a050");
  p.rect(x + facing * 6, y - 7, 2, 2, "#10140f");
}
function campsite(p, area, includeActors) {
  const top = area.y;
  // A worn path runs down from the drift glade to the camp and the dock.
  const trail = [[480, -10], [470, 80], [452, 180], [446, 280], [520, 330], [610, 352], [690, 362]];
  for (let i = 0; i < trail.length - 1; i++) {
    const [ax, ay] = trail[i],
      [bx, by] = trail[i + 1];
    for (let t = 0; t < 1; t += 0.12) {
      const x = ax + (bx - ax) * t,
        y = ay + (by - ay) * t;
      p.ellipse(x, top + y, 34, 20, "#6a4a2c");
      p.ellipse(x, top + y - 1, 26, 14, "#8a5e36");
    }
  }
  cove(p, area);
  dock(p, area);
  lodge(p, 60, top + 60);
  tent(p, 380, top + 192, true);
  tent(p, 550, top + 168, false);
  // The camp fire: a stone ring, three log seats and a kettle on a tripod.
  const fx = 445,
    fy = top + 318;
  for (const [dx, dy, w] of [[-30, 10, 60], [26, -6, 54], [0, 22, 80], [-8, -16, 40]]) {
    p.ellipse(fx + dx, fy + dy, w, 22, "#6a4a2c");
    p.ellipse(fx + dx, fy + dy - 2, w - 14, 14, "#8a6038");
  }
  p.ellipse(fx, fy + 2, 42, 22, "#5a5050");
  p.ellipse(fx, fy + 1, 32, 15, "#1a120e");
  for (let k = 0; k < 10; k++) {
    const angle = (k / 10) * Math.PI * 2;
    p.rect(fx + Math.cos(angle) * 18 - 3, fy + Math.sin(angle) * 9 - 2, 6, 5, "#8a8078");
  }
  for (const [dx, dy] of [[-54, 6], [54, 6], [0, 34]]) {
    log(p, fx + dx, fy + dy);
  }
  for (const side of [-1, 1]) p.path([[fx + side * 16, fy + 6], [fx + side * 2, fy - 34], [fx + side * 4, fy - 34], [fx + side * 18, fy + 6]], "#4b241e");
  p.rect(fx - 1, fy - 34, 2, 14, "#2a2228");
  p.rect(fx - 8, fy - 22, 16, 11, "#2a2a36");
  p.rect(fx - 6, fy - 24, 12, 3, "#4a4a5a");
  p.light({ kind: "point", x: fx, y: fy, r: 185, color: "#ff9a40", power: 1.4, flatten: 1.7 });
  p.light({ kind: "emit", x: fx - 12, y: fy - 22, w: 24, h: 24 });
  // A lantern post where the trail meets the dock.
  p.lantern(620, top + 346);
  for (const [x, y] of [[300, 330], [560, 250], [180, 300], [600, 210]]) {
    p.ellipse(x, top + y, 22, 12, "#4a4e6c");
    p.rect(x - 6, top + y - 4, 10, 2, "#80859f");
    paintFern(p, x + 12, top + y + 6, 0.7);
  }
  for (const [x, y] of [[250, 380], [330, 420], [520, 420]]) mushroom(p, x, top + y);
  // A picnic table with a lantern, a rod rack by the dock and a hammock
  // slung between two pines.
  p.rect(276, top + 276, 56, 10, "#3c201e");
  p.rect(278, top + 276, 52, 3, "#a0613b");
  for (const lx of [282, 322]) p.rect(lx, top + 286, 4, 16, "#3c201e");
  for (const by of [top + 262, top + 300]) {
    p.rect(272, by, 64, 6, "#5c2d1f");
    p.rect(272, by, 64, 2, "#8a4c2a");
  }
  p.rect(300, top + 266, 8, 10, "#24151a");
  p.rect(301, top + 267, 6, 8, "#ffb347");
  p.light({ kind: "emit", x: 300, y: top + 266, w: 8, h: 10 });
  p.light({ kind: "point", x: 304, y: top + 284, r: 56, color: "#ffc070", power: 0.85 });
  for (const rx of [636, 668]) p.rect(rx, top + 300, 4, 34, "#3c201e");
  p.rect(632, top + 306, 42, 4, "#5c2d1f");
  for (let k = 0; k < 3; k++)
    for (let i = 0; i < 12; i++) p.rect(640 + k * 10 + i, top + 336 - i * 4, 2, 2, "#8a6a4a");
  for (let i = 0; i <= 20; i++) {
    const t = i / 20,
      sag = Math.sin(t * Math.PI) * 16;
    p.rect(782 + t * 80, top + 236 + t * 6 + sag, 4, 6, i % 4 < 2 ? "#b8605a" : "#e0c890");
  }
  // String lights sag between the two tents.
  for (let i = 0; i <= 16; i++) {
    const t = i / 16,
      x = 424 + t * 86,
      y = top + 128 - t * 22 + Math.sin(t * Math.PI) * 14;
    p.rect(x, y, 2, 2, "#2a2228");
    if (i % 2 === 0) {
      p.rect(x, y + 2, 2, 4, ["#ffd27a", "#ff9a6a", "#a8d8ff", "#ffe9a0"][(i / 2) % 4]);
      p.light({ kind: "emit", x, y: y + 2, w: 2, h: 4 });
    }
  }
  p.light({ kind: "point", x: 468, y: top + 150, r: 60, color: "#ffc070", power: 0.5 });
  // The woods close in around the camp in clumps, deepest at the edges.
  const geometry = campsiteGeometry({ y: 0 });
  const busy = [
    geometry.lodge,
    geometry.woodpile,
    ...geometry.tents,
    { left: 360, right: 540, top: 250, bottom: 380 },
    { left: 260, right: 350, top: 250, bottom: 320 },
    { left: 620, right: 690, top: 290, bottom: 350 },
    { left: 770, right: 870, top: 220, bottom: 270 },
    { left: 400, right: 500, top: 100, bottom: 250 },
  ];
  const rand = random(6631);
  const trees = [
    { x: 778, y: top + 244, s: 0.8, tone: 0.2 },
    { x: 868, y: top + 252, s: 0.85, tone: 0.5 },
  ];
  for (let y = 10; y < 640; y += 26)
    for (let x = -10 + ((y / 26) % 2) * 14; x < 980; x += 30) {
      const clump = 0.5 + 0.5 * Math.sin(x * 0.024 + y * 0.011) * Math.cos(y * 0.031 + 0.4);
      if (rand() > 0.2 + clump * 0.55) continue;
      const tree = { x: x + (rand() - 0.5) * 16, y: y + (rand() - 0.5) * 12, s: 0.7 + rand() * 0.4, tone: rand() < 0.85 ? rand() * 0.78 : 0.85 };
      const half = 42 * tree.s + 8,
        box = { left: tree.x - half, right: tree.x + half, top: tree.y - 70 * tree.s - 10, bottom: tree.y + 10 };
      const wet = [-half, 0, half].some((dx) => inCove(tree.x + dx, tree.y + 20) || inCove(tree.x + dx, tree.y - 20));
      const trail = Math.abs(tree.x - (tree.y < 300 ? 470 - tree.y * 0.05 : 520 + (tree.y - 300) * 2)) < 60 && tree.y < 380;
      const open = tree.x > 150 && tree.x < 640 && tree.y > 120 && tree.y < 470;
      if (wet || trail || open || busy.some((b) => intersects(box, b))) continue;
      trees.push({ ...tree, y: top + tree.y });
    }
  for (const tree of trees.sort((a, b) => a.y - b.y)) p.tree(tree);
  if (includeActors) animateCampsite(p, area, 0, true);
}
function animateCampsite(p, area, time, reduced) {
  const top = area.y,
    fx = 445,
    fy = top + 318,
    frame = reduced ? 1 : Math.floor(time * 8) % 4;
  p.rect(fx - 9, fy - 12 - (frame % 2) * 2, 18, 12, "#d8501c");
  p.rect(fx - 7, fy - 18 + (frame % 3) * 2, 14, 14, "#f08a28");
  p.rect(fx - 4 + (frame % 2) * 2, fy - 22 + frame, 8, 16, "#ffb347");
  p.rect(fx - 2, fy - 12, 5, 10, "#ffe9a0");
  p.rect(fx - 8, fy - 22, 16, 11, "#2a2a36");
  if (!reduced)
    for (let i = 0; i < 4; i++) {
      const rise = (time * 16 + i * 11) % 40;
      if (rise < 30) p.rect(fx - 4 + Math.sin(time * 3 + i * 2) * 8, fy - 30 - rise, 2, 2, i % 2 ? "#ffd27a" : "#ff9a40");
    }
  // Steam from the kettle and smoke from the lodge chimney.
  for (const [sx, sy, spread] of [[fx + 6, fy - 26, 4], [247, top + 56, 9]])
    for (let i = 0; i < 4; i++) {
      const phase = reduced ? i * 0.24 : (time * 0.14 + i * 0.24) % 1;
      if (phase > 0.85) continue;
      p.rect(sx + Math.sin(phase * 5) * spread + phase * 10, sy - phase * 48, 4 + phase * 8, 4 + phase * 4, phase < 0.4 ? "#b4b6c8" : "#7c8098");
    }
  const state = campsiteState(time, reduced);
  const bobber = { ...state.bobber, absY: top + state.bobber.y };
  fisherman(p, 716, top + 506, { ...state, bobber }, time);
  p.rect(bobber.x - 2, bobber.absY - 4, 4, 4, "#e04a3a");
  p.rect(bobber.x - 2, bobber.absY, 4, 2, "#f0f0e0");
  const ring = reduced ? 0 : Math.floor(time * 2) % 3;
  p.rect(bobber.x - 6 - ring * 3, bobber.absY + 4, 12 + ring * 6, 2, "#3a4a88");
  for (const d of state.ducks) duck(p, d.x, top + d.y, d.facing);
  for (let i = 0; i < 18; i++) {
    const x = 620 + ((i * 53 + (reduced ? 0 : time * 10)) % 330),
      y = 380 + ((i * 37) % 210);
    if (inCove(x, y) && inCove(x + 12, y)) p.rect(x, top + y, 6 + (i % 3) * 4, 2, "#3a4a88");
  }
}
function riverY(area, x) {
  return (
    area.y +
    area.height * 0.52 +
    Math.sin(x * 0.011) * Math.min(13, area.height * 0.12)
  );
}

function river(p, area) {
  // The lake's southern arm: a stone rim, a lamplit dock, lilies and a
  // moored rowboat on deep indigo water.
  const half = Math.min(52, area.height * 0.3);
  const upper = [],
    lower = [],
    innerUpper = [],
    innerLower = [];
  for (let x = -20; x <= 980; x += 20) {
    const y = riverY(area, x);
    upper.push([x, y - half - 12]);
    lower.push([x, y + half + 12]);
    innerUpper.push([x, y - half]);
    innerLower.push([x, y + half]);
  }
  p.path([...upper, ...lower.reverse()], "#3a3a2a");
  p.path([...innerUpper, ...innerLower.reverse()], "#1a2550");
  for (let x = -10; x < WIDTH + 10; x += 6) {
    const y = riverY(area, x);
    p.rect(x, y - half + 6, 6, half - 6, "#1d2a5a");
    p.rect(x, y + half * 0.3, 6, half * 0.7, "#172148");
  }
  for (let x = 0, i = 0; x < WIDTH; x += 29, i++) {
    const y = riverY(area, x) + Math.sin(i * 2.3) * half * 0.6;
    p.rect(x, y, 12 + (i % 3) * 6, 2, i % 2 ? "#2c3a70" : "#33437c");
  }
  // Round shore stones along both edges.
  const rand = random(5521);
  for (const side of [-1, 1])
    for (let x = -6; x < WIDTH + 10; x += 14 + Math.floor(rand() * 8)) {
      const y = riverY(area, x) + side * (half + 3) + (rand() - 0.5) * 4;
      const w = 14 + rand() * 10;
      p.ellipse(x, y + 3, w + 2, 11, "#141a30");
      p.ellipse(x, y, w, 9, rand() < 0.5 ? "#55597a" : "#4a4e6c");
      p.rect(x - w * 0.3, y - 3, w * 0.4, 2, "#80859f");
      if (rand() < 0.3) p.rect(x - w * 0.4, y - 5, w * 0.5, 2, "#3d5a34");
    }
  // Lily pads with a few pink blooms.
  for (const [x, offset] of [[120, 5], [300, 18], [610, -14], [700, 12], [862, 20], [236, -16]]) {
    const y = riverY(area, x) + offset;
    p.ellipse(x, y + 2, 22, 8, "#121a3c");
    p.ellipse(x, y, 18, 7, "#3e5a34");
    p.rect(x - 5, y - 2, 7, 2, "#6a8a46");
    p.rect(x + 1, y, 6, 2, "#1a2550");
    if (x % 4 === 0) {
      p.rect(x - 2, y - 5, 5, 4, "#f0a8c4");
      p.rect(x - 1, y - 6, 3, 2, "#ffd8e8");
      p.rect(x, y - 4, 1, 1, "#ffd060");
    }
  }
  // A rowboat moored by the western shore.
  {
    const bx = 178,
      by = riverY(area, bx) + 8;
    p.ellipse(bx, by + 6, 70, 12, "#10173a");
    p.path([[bx - 34, by - 4], [bx + 30, by - 4], [bx + 22, by + 8], [bx - 26, by + 8]], "#3c201e");
    p.path([[bx - 30, by - 2], [bx + 27, by - 2], [bx + 20, by + 6], [bx - 23, by + 6]], "#844024");
    p.rect(bx - 28, by - 4, 56, 2, "#b0663a");
    for (const sx of [bx - 14, bx + 6]) p.rect(sx, by - 2, 6, 7, "#5c2d1f");
    p.rect(bx + 14, by - 10, 3, 18, "#6a3622");
    p.rect(bx - 40, by - 6, 8, 2, "#8a7a5a");
  }
  // A plank dock runs out from the northern shore.
  {
    const dx = 480,
      top = riverY(area, dx) - half - 14,
      bottom = riverY(area, dx) + half * 0.15;
    p.rect(dx - 34, top, 68, bottom - top + 4, "#2c181b");
    for (let y = top + 2; y < bottom; y += 6) {
      p.rect(dx - 32, y, 64, 5, "#7a3c22");
      p.rect(dx - 32, y, 64, 1, "#b0663a");
      p.rect(dx - 32 + ((y * 7) % 50), y + 2, 2, 2, "#4b241e");
    }
    for (const px of [dx - 36, dx + 30]) {
      p.rect(px, top - 4, 6, bottom - top + 16, "#3c201e");
      p.rect(px + 1, top - 4, 2, bottom - top + 16, "#844024");
      p.lantern(px + 2, top + 2);
      for (let i = 0; i < 8; i++)
        p.rect(px - 2 + Math.sin(i * 2.1) * 3, bottom + 8 + i * 5, 8 - (i % 3) * 2, 2,
          i % 3 === 0 ? "#ffd27a" : i % 2 ? "#c07a3a" : "#8a5a3a");
    }
  }
  // Reeds at the water's edge.
  for (const x of [64, 336, 651, 906]) {
    const y = riverY(area, x) + half + 13;
    for (let i = 0; i < 4; i++) {
      p.rect(x + i * 5, y - 13 - (i % 2) * 5, 2, 18, "#5a7040");
      p.rect(x + i * 5 - 1, y - 16 - (i % 2) * 5, 4, 7, "#8a6a3a");
    }
    p.ellipse(x - 8, y + 1, 19, 9, "#2e4428");
  }
  // Shore lamps, each doubled as a broken amber column on the water.
  for (const x of [82, 350, 655, 910]) {
    const middle = riverY(area, x);
    p.lantern(x, middle - half - 12);
    for (let i = 0; i < 12; i++) {
      const yy = middle - half + 7 + i * ((half * 2 - 14) / 12),
        width = 7 + ((i * 7) % 17),
        offset = Math.sin(i * 2.3 + x) * 5;
      p.rect(x - width / 2 + offset, yy, width, 2,
        i % 3 === 0 ? "#ffd27a" : i % 2 ? "#c07a3a" : "#7a5a4a");
    }
  }
}

export function driftState(time, reduced = false) {
  if (reduced)
    return { x: 480, y: 266, yaw: -0.16, steer: 0, angle: 0, moving: false };
  const angle = ((((time % 9) + 9) % 9) / 9) * Math.PI * 2;
  return {
    x: 480 + Math.cos(angle) * 160,
    y: 205 + Math.sin(angle) * 62,
    yaw: angle + Math.PI / 2 + 0.42,
    steer: -0.5,
    angle,
    moving: true,
  };
}

export function driftGeometry(area) {
  return {
    center: { x: 480, y: area.y + 205 },
    radius: { x: 160, y: 62 },
    bounds: { left: 190, right: 770, top: area.y + 62, bottom: area.y + 340 },
  };
}

function pickup(p, state, area) {
  const { x, yaw, steer } = state,
    y = area.y + state.y;
  const point = (long, side, z = 0) => [
    x + Math.cos(yaw) * long - Math.sin(yaw) * side,
    y + Math.sin(yaw) * long + Math.cos(yaw) * side - z,
  ];
  const box = (long, side, length, width, z, height, color) => {
    const corners = [
      [long - length / 2, side - width / 2],
      [long + length / 2, side - width / 2],
      [long + length / 2, side + width / 2],
      [long - length / 2, side + width / 2],
    ];
    const base = corners.map(([a, b]) => point(a, b, z)),
      top = corners.map(([a, b]) => point(a, b, z + height));
    const faces = corners
      .map((_, i) => ({ i, depth: (base[i][1] + base[(i + 1) % 4][1]) / 2 }))
      .sort((a, b) => a.depth - b.depth);
    for (const { i } of faces)
      p.path(
        [base[i], base[(i + 1) % 4], top[(i + 1) % 4], top[i]],
        i % 2 ? color[1] : color[2],
      );
    p.path(top, color[0]);
  };
  p.ellipse(x, y + 5, 97, 36, "#302e27");
  // Projected boxes are rasterized on the native pixel grid; no rotated canvas.
  for (const long of [-29, 28])
    for (const side of [-23, 23]) {
      const wheel = point(long, side, 5),
        wheelYaw = yaw + (long > 0 ? steer : 0);
      const wx = Math.cos(wheelYaw) * 6,
        wy = Math.sin(wheelYaw) * 6;
      p.path(
        [
          [wheel[0] - wx - 3, wheel[1] - wy - 7],
          [wheel[0] + wx + 3, wheel[1] + wy - 7],
          [wheel[0] + wx + 3, wheel[1] + wy + 7],
          [wheel[0] - wx - 3, wheel[1] - wy + 7],
        ],
        "#202b29",
      );
      p.rect(wheel[0] - 2, wheel[1] - 2, 5, 5, "#949c8c");
    }
  box(0, 0, 91, 39, 10, 15, ["#3d514b", "#233834", "#2a403a"]);
  box(27, 0, 32, 37, 25, 6, ["#53665b", "#30443d", "#3b5147"]);
  box(-1, 0, 31, 37, 25, 22, ["#587068", "#344e48", "#3e5850"]);
  // Cab glass, door seams and a visibly open rear pickup bed.
  p.path(
    [
      point(15, -16, 31),
      point(15, 16, 31),
      point(15, 14, 43),
      point(15, -14, 43),
    ],
    "#99b2af",
  );
  for (const side of [-19, 19]) {
    p.path(
      [
        point(-12, side, 31),
        point(9, side, 31),
        point(9, side, 42),
        point(-12, side, 42),
      ],
      "#91a7a0",
    );
    p.path(
      [
        point(-14, side, 13),
        point(-12, side, 13),
        point(-12, side, 26),
        point(-14, side, 26),
      ],
      "#1e3330",
    );
    const handle = point(-4, side, 28);
    p.rect(handle[0] - 2, handle[1], 6, 2, "#bac0a5");
  }
  box(-32, 0, 32, 38, 25, 4, ["#4b6056", "#30483f", "#3c5146"]);
  p.path(
    [
      point(-45, -15, 29),
      point(-19, -15, 29),
      point(-19, 15, 29),
      point(-45, 15, 29),
    ],
    "#1c302d",
  );
  for (const long of [-42, -35, -28, -21])
    p.path(
      [
        point(long, -13, 30),
        point(long + 1, -13, 30),
        point(long + 1, 13, 30),
        point(long, 13, 30),
      ],
      "#355046",
    );
  p.path(
    [
      point(46, -16, 16),
      point(46, 16, 16),
      point(46, 16, 27),
      point(46, -16, 27),
    ],
    "#a0aba0",
  );
  for (const side of [-10, -4, 3, 10])
    p.path(
      [
        point(47, side, 18),
        point(47, side + 2, 18),
        point(47, side + 2, 25),
        point(47, side, 25),
      ],
      "#30423d",
    );
  const badge = point(48, 0, 22);
  p.ellipse(badge[0], badge[1], 8, 4, "#46738b");
  for (const side of [-17, 17]) {
    const light = point(47, side, 23);
    p.rect(light[0] - 2, light[1] - 2, 5, 5, "#eee5b4");
  }
  for (const side of [-17, 17]) {
    const light = point(-47, side, 22);
    p.rect(light[0] - 2, light[1] - 2, 4, 5, "#b77859");
  }
}

// Pixel dust thrown off the rear wheels; older puffs thin out pixel by
// pixel instead of fading as translucent discs.
function animateDrift(p, area, time, reduced) {
  const state = driftState(time, reduced);
  if (!reduced)
    for (let i = 2; i < 14; i++) {
      const past = driftState(time - i * 0.06, false),
        spread = 4 + i * 1.6;
      for (let k = 0; k < 9; k++) {
        if ((k * 7 + i * 3) % 14 < i - 1) continue;
        const angle = k * 2.4 + i,
          dx = Math.cos(angle) * spread,
          dy = Math.sin(angle) * spread * 0.5 - i * 0.8;
        p.rect(past.x + dx, area.y + past.y + 10 + dy, 2 + (k % 2) * 2, 2, k % 3 ? "#a08a62" : "#c4ad80");
      }
    }
  // The brazier's flames lick above the drum's rim.
  const flame = reduced ? 1 : Math.floor(time * 8) % 3;
  p.rect(794, area.y + 254 - flame * 2, 14, 10, "#d8501c");
  p.rect(796, area.y + 248 + flame, 10, 12, "#f08a28");
  p.rect(799, area.y + 244 + (flame % 2) * 2, 4, 12, "#ffd27a");
  pickup(p, state, area);
}
// Packed earth in pixel rows: a ragged edge, mottled tones and gravel.
function dirtOval(p, cx, cy, rx, ry, seed, tones) {
  const rand = random(seed);
  for (let y = -ry; y <= ry; y += 2) {
    const half = rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2)),
      ragged = (rand() - 0.5) * 10;
    p.rect(cx - half - ragged, cy + y, (half + ragged) * 2, 2, tones[0]);
  }
  for (let i = 0; i < (rx * ry) / 18; i++) {
    const angle = rand() * Math.PI * 2,
      d = Math.sqrt(rand()) * 0.94,
      x = cx + Math.cos(angle) * rx * d,
      y = cy + Math.sin(angle) * ry * d;
    p.rect(x, y, 2 + Math.floor(rand() * 3) * 2, 2, tones[1 + (i % (tones.length - 1))]);
  }
}
// Scattered forest floor: needles, tufts, moss, stones, ferns and blooms.
function forestFloor(p, top, bottom, seed, avoid = []) {
  const rand = random(seed);
  const count = Math.floor((WIDTH * (bottom - top)) / 380);
  for (let i = 0; i < count; i++) {
    const x = rand() * WIDTH,
      y = top + rand() * (bottom - top),
      kind = rand();
    if (avoid.some((a) => x > a.left && x < a.right && y > a.top && y < a.bottom)) continue;
    if (kind < 0.34) {
      p.rect(x, y, 4, 2, "#4a3a28");
      p.rect(x + 3, y + 2, 4, 2, "#5a4630");
    } else if (kind < 0.62) {
      p.rect(x, y, 2, 4, "#3e5a2e");
      p.rect(x + 2, y - 2, 2, 6, "#5a7a3a");
      p.rect(x + 4, y, 2, 4, "#34502a");
    } else if (kind < 0.76) {
      p.ellipse(x, y, 12, 6, "#2a4426");
      p.rect(x - 3, y - 2, 6, 2, "#4a6e36");
    } else if (kind < 0.86) {
      p.rect(x, y, 6, 4, "#4a4e5a");
      p.rect(x, y, 4, 2, "#6e7282");
    } else if (kind < 0.92) {
      paintFern(p, x, y, 0.55 + rand() * 0.3);
    } else if (kind < 0.96) {
      p.rect(x, y, 2, 2, ["#e8d8a0", "#d08aa8", "#a8b8e8", "#f0c060"][i % 4]);
      p.rect(x + 4, y + 2, 2, 2, ["#e8d8a0", "#d08aa8"][i % 2]);
      p.rect(x + 2, y + 2, 2, 4, "#3e5a2e");
    } else if (kind < 0.985) {
      mushroom(p, x, y);
    } else {
      p.rect(x - 14, y, 28, 4, "#3c2a1e");
      p.rect(x - 14, y, 28, 1, "#6a4a30");
      p.rect(x + 14, y - 1, 3, 6, "#8a6a44");
    }
  }
}
// The forest road that winds from the drift glade down to the campsite.
export function forestRoad(layout) {
  if (!layout.drift || !layout.stable) return [];
  const a = [480, layout.drift.y + 322],
    d = [480, layout.stable.y - 6],
    mid = (a[1] + d[1]) / 2;
  const b = [560, mid - 30],
    c = [400, mid + 30];
  return Array.from({ length: 25 }, (_, i) => {
    const t = i / 24,
      u = 1 - t;
    return [
      u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
      u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
    ];
  });
}
function road(p, layout) {
  const points = forestRoad(layout);
  if (!points.length) return;
  for (const [x, y] of points) p.ellipse(x, y, 64, 34, "#3a2c1e");
  for (const [x, y] of points) p.ellipse(x, y, 54, 26, "#6a4c30");
  const rand = random(4409);
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i],
      [bx, by] = points[i + 1],
      angle = Math.atan2(by - ay, bx - ax),
      nx = -Math.sin(angle),
      ny = Math.cos(angle);
    for (let t = 0; t < 1; t += 0.2) {
      const x = ax + (bx - ax) * t,
        y = ay + (by - ay) * t;
      for (const side of [-11, 11]) p.rect(x + nx * side - 2, y + ny * side, 5, 2, "#4a3420");
      if (rand() < 0.5) {
        p.rect(x - 1, y - 2, 2, 4, "#4e6a34");
        p.rect(x + 2, y, 2, 2, "#3e5a2e");
      }
      if (rand() < 0.25) p.rect(x + nx * (22 + rand() * 6), y + ny * 22, 4, 2, "#6e7282");
      if (rand() < 0.2) p.rect(x + (rand() - 0.5) * 30, y + (rand() - 0.5) * 12, 2, 2, "#8a7458");
    }
  }
  // A rain puddle holds a lantern's reflection, and a finger-post points
  // the way at the top.
  const [px, py] = points[9];
  p.ellipse(px + 8, py + 2, 26, 8, "#1c2650");
  p.rect(px + 2, py, 10, 2, "#c08a4a");
  for (const i of [6, 17]) {
    const [lx, ly] = points[i];
    p.lantern(lx + (i % 2 ? -36 : 36), ly + 6);
  }
  const [sx, sy] = points[2];
  p.rect(sx + 38, sy - 30, 4, 34, "#3c201e");
  p.path([[sx + 26, sy - 30], [sx + 56, sy - 30], [sx + 62, sy - 25], [sx + 56, sy - 20], [sx + 26, sy - 20]], "#8a4c2a");
  p.path([[sx + 22, sy - 16], [sx + 52, sy - 16], [sx + 52, sy - 6], [sx + 22, sy - 6], [sx + 16, sy - 11]], "#7a4224");
  p.rect(sx + 30, sy - 26, 20, 2, "#3c201e");
  p.rect(sx + 26, sy - 12, 20, 2, "#3c201e");
}

function garage(p, x, y) {
  // A timber workshop with its wide door open on a lit bench.
  p.ellipse(x + 78, y + 140, 190, 22, "#141810");
  p.rect(x, y + 50, 156, 92, "#4a2a20");
  for (let yy = y + 54; yy < y + 140; yy += 7) {
    p.rect(x, yy, 156, 2, "#2c181b");
    p.rect(x, yy + 2, 156, 1, "#6a3a24");
  }
  p.path([[x - 12, y + 56], [x + 78, y + 6], [x + 168, y + 56]], "#24151a");
  p.path([[x - 6, y + 52], [x + 78, y + 12], [x + 162, y + 52]], "#4a3434");
  for (let yy = y + 20; yy < y + 52; yy += 6) {
    const half = ((yy - y - 12) / 40) * 84;
    p.rect(x + 78 - half, yy, half * 2, 2, "#2c1c1e");
    for (let xx = x + 78 - half + ((yy / 6) % 2 ? 4 : 0); xx < x + 78 + half - 6; xx += 12) p.rect(xx, yy + 2, 8, 2, "#655048");
  }
  p.rect(x - 8, y + 52, 172, 4, "#a0613b");
  // The open door and the workshop inside.
  p.rect(x + 34, y + 72, 88, 70, "#24151a");
  p.rect(x + 38, y + 76, 80, 66, "#c07038");
  p.rect(x + 38, y + 76, 80, 14, "#a05a2c");
  for (const [tx, h] of [[48, 16], [58, 12], [66, 18], [76, 10]]) p.rect(x + tx, y + 80, 2, h, "#4a4048");
  p.rect(x + 44, y + 112, 68, 6, "#5c2d1f");
  p.rect(x + 46, y + 118, 4, 22, "#3c201e");
  p.rect(x + 106, y + 118, 4, 22, "#3c201e");
  p.rect(x + 54, y + 104, 12, 8, "#c84a3a");
  p.rect(x + 74, y + 106, 18, 6, "#6a6474");
  p.rect(x + 96, y + 100, 6, 12, "#3a6a9a");
  p.light?.({ kind: "emit", x: x + 38, y: y + 76, w: 80, h: 66 });
  p.light?.({ kind: "spill", x: x + 78, y: y + 142, w: 90, h: 60, reach: 80, color: "#ffb860" });
  p.lantern(x + 140, y + 100);
  // Barrels, a jerrycan and a stack of worn tyres by the wall.
  for (const [bx, color, band] of [[x + 6, "#2a4a7a", "#5a7aaa"], [x + 20, "#8a2a24", "#c05040"]]) {
    p.rect(bx, y + 114, 13, 26, "#141018");
    p.rect(bx + 1, y + 115, 11, 24, color);
    for (const yy of [y + 119, y + 132]) p.rect(bx + 1, yy, 11, 2, band);
  }
  for (let i = 0; i < 3; i++) {
    p.ellipse(x + 176, y + 136 - i * 8, 30, 12, "#141418");
    p.ellipse(x + 176, y + 135 - i * 8, 14, 5, "#2a2a30");
  }
  p.rect(x + 160, y + 122, 10, 14, "#b03a2a");
  p.rect(x + 162, y + 120, 4, 2, "#141018");
}

function drift(p, area, includeActors) {
  const top = area.y;
  // A grass rim, then the packed-earth arena worn into the forest.
  dirtOval(p, 480, top + 205, 300, 140, 811, ["#2c3a24", "#3a4a2c", "#24321e"]);
  dirtOval(p, 480, top + 205, 280, 128, 812, ["#5e4630", "#6e5438", "#4e3a26", "#7e6a50", "#8a8070"]);
  // Tyre ruts: overlapping loops from many laps, slightly off each other.
  for (const [radius, dy, tone] of [[148, 0, "#3e2c1e"], [158, -3, "#44301f"], [166, 2, "#3e2c1e"], [176, -1, "#4a3622"], [140, 4, "#4a3622"]]) {
    for (let i = 0; i < 160; i++) {
      const angle = (i / 160) * Math.PI * 2;
      if ((i * 7 + radius) % 23 < 3) continue;
      p.rect(480 + Math.cos(angle) * radius, top + 205 + dy + Math.sin(angle) * (62 + (radius - 160) * 0.3), 4, 2, tone);
    }
  }
  for (const [cx, cy] of [[420, 210], [560, 196]])
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      p.rect(cx + Math.cos(angle) * 26, top + cy + Math.sin(angle) * 10, 3, 2, "#3e2c1e");
    }
  // Two puddles catch the lanterns' light.
  for (const [x, y, w] of [[300, 262, 34], [664, 150, 28]]) {
    p.ellipse(x, top + y, w, 9, "#1c2650");
    p.rect(x - w * 0.2, top + y - 1, w * 0.3, 2, "#c08a4a");
    p.rect(x + w * 0.1, top + y + 2, w * 0.2, 2, "#3a4a88");
  }
  garage(p, 20, top + 40);
  // A log stack, a burning brazier and a bench for whoever is watching.
  for (let row = 0; row < 4; row++)
    for (let i = 0; i < 6 - row; i++) {
      const lx = 816 + i * 16 + row * 8,
        ly = top + 196 - row * 13;
      p.ellipse(lx, ly, 16, 14, "#3c201e");
      p.ellipse(lx, ly, 12, 10, "#a0683a");
      p.ellipse(lx, ly, 5, 4, "#6a4226");
    }
  p.rect(800, top + 204, 116, 4, "#24151a");
  p.rect(792, top + 262, 18, 26, "#2a2228");
  p.rect(792, top + 262, 18, 3, "#5a5462");
  for (let k = 0; k < 4; k++) p.rect(794 + k * 4, top + 270, 2, 2, "#ff9a40");
  p.light?.({ kind: "point", x: 801, y: top + 272, r: 96, color: "#ff9a40", power: 1.05, flatten: 1.5 });
  p.light?.({ kind: "emit", x: 790, y: top + 244, w: 22, h: 22 });
  log(p, 860, top + 292);
  // Log barriers and four lantern posts ring the track.
  for (const [x, y, w] of [[250, 100, 46], [690, 104, 46], [214, 250, 40], [760, 262, 40], [330, 330, 50], [620, 336, 50]]) {
    p.rect(x - w / 2, top + y - 4, w, 9, "#3c201e");
    p.rect(x - w / 2, top + y - 4, w, 3, "#844024");
    p.ellipse(x - w / 2, top + y, 8, 9, "#c48a52");
  }
  // Pines close in around the glade, densest behind the far edge.
  const trees = [];
  const rand = random(9902);
  for (let x = 160; x < 820; x += 30) {
    trees.push({ x: x + (rand() - 0.5) * 16, y: top + 46 + (rand() - 0.5) * 18, s: 0.62 + rand() * 0.3, tone: rand() * 0.78 });
    if (rand() < 0.6) trees.push({ x: x + 14, y: top + 24 + rand() * 10, s: 0.5 + rand() * 0.2, tone: rand() * 0.78 });
  }
  for (const [x, y, s, tone] of [
    [40, 220, 1, 0.3], [90, 262, 0.9, 0.1], [30, 330, 1.05, 0.6], [140, 330, 0.85, 0.2],
    [196, 352, 0.8, 0.4], [920, 110, 1, 0.2], [930, 240, 1.05, 0.5], [880, 340, 0.95, 0.15],
    [930, 350, 0.8, 0.3], [760, 356, 0.8, 0.7], [200, 360, 0.75, 0.2],
  ])
    trees.push({ x, y: top + y, s, tone });
  for (const tree of trees.sort((a, b) => a.y - b.y)) p.tree(tree);
  for (const [x, y] of [[210, 96], [752, 96], [214, 320], [748, 322]]) p.lantern(x, top + y);
  if (includeActors) animateDrift(p, area, 0, true);
}

function relics(p, x, y) {
  p.ellipse(x, y + 60, 194, 50, "#364b35");
  // Original geometric forest-beast sculptures, weathered into their clearing.
  p.path(
    [
      [x - 35, y + 52],
      [x - 32, y - 29],
      [x - 42, y - 58],
      [x - 30, y - 92],
      [x - 14, y - 74],
      [x + 14, y - 74],
      [x + 31, y - 94],
      [x + 43, y - 57],
      [x + 30, y - 31],
      [x + 35, y + 52],
    ],
    "#6e7a68",
  );
  p.path(
    [
      [x - 24, y + 45],
      [x - 22, y - 26],
      [x - 30, y - 52],
      [x - 23, y - 70],
      [x - 9, y - 56],
      [x + 12, y - 56],
      [x + 23, y - 72],
      [x + 31, y - 50],
      [x + 21, y - 27],
      [x + 24, y + 45],
    ],
    "#929a7f",
  );
  for (const side of [-1, 1]) {
    p.rect(x + side * 17 - 6, y - 44, 12, 8, "#3f5747");
    p.rect(x + side * 17 - 4, y - 41, 8, 3, "#b0b396");
    p.path(
      [
        [x + side * 6, y - 5],
        [x + side * 20, y + 6],
        [x + side * 7, y + 13],
      ],
      "#516554",
    );
  }
  p.path(
    [
      [x, y - 35],
      [x - 9, y - 19],
      [x + 9, y - 19],
    ],
    "#4c6350",
  );
  for (const dy of [19, 34]) p.rect(x - 19, y + dy, 38, 3, "#586e56");
  p.path(
    [
      [x - 24, y - 10],
      [x - 14, y + 1],
      [x - 17, y + 12],
      [x - 10, y + 21],
    ],
    "#657661",
  );
  p.ellipse(x - 66, y + 41, 46, 26, "#85917a");
  p.path(
    [
      [x - 84, y + 33],
      [x - 82, y + 20],
      [x - 72, y + 29],
      [x - 65, y + 19],
      [x - 59, y + 34],
    ],
    "#85917a",
  );
  p.rect(x - 78, y + 35, 5, 2, "#4a6050");
  p.ellipse(x + 63, y + 32, 31, 67, "#8b957c");
  for (const side of [-1, 1])
    p.path(
      [
        [x + 63 + side * 8, y + 6],
        [x + 63 + side * 15, y - 17],
        [x + 63 + side * 24, y - 19],
        [x + 63 + side * 17, y - 10],
        [x + 63 + side * 17, y - 25],
      ],
      "#a4ad90",
    );
  p.rect(x + 54, y + 21, 5, 3, "#526a50");
  p.rect(x + 68, y + 21, 5, 3, "#526a50");
  for (const [dx, dy] of [
    [-27, -59],
    [17, 42],
    [61, 56],
    [-74, 51],
  ]) {
    p.ellipse(x + dx, y + dy, 20, 9, "#526e42");
    paintFern(p, x + dx + 9, y + dy + 5, 0.7);
  }
  relicCandles(p, x, y);
}

// Votive candles ring the shrine: [dx, dy, height] from the relic centre.
const RELIC_CANDLES = [
  [-40, 56, 22],
  [40, 56, 20],
  [-96, 70, 12],
  [-66, 82, 18],
  [-32, 90, 10],
  [0, 92, 16],
  [32, 90, 12],
  [66, 82, 20],
  [96, 70, 10],
];

function relicCandles(p, x, y) {
  for (const [dx, dy, h] of RELIC_CANDLES) {
    const cx = x + dx,
      base = y + dy;
    p.ellipse(cx, base + 1, 16, 5, "#22301f");
    p.rect(cx - 4, base - h, 8, h, "#e9dcb8");
    p.rect(cx - 4, base - h, 2, h, "#fff6dc");
    p.rect(cx + 2, base - h, 2, h, "#c9b88e");
    // Wax runs down from the rim and pools at the foot.
    p.rect(cx - 2, base - h, 2, 6 + (h % 4), "#fff6dc");
    p.rect(cx - 6, base - 2, 12, 2, "#e9dcb8");
    p.rect(cx - 1, base - h - 3, 2, 3, "#3a2d22");
    p.light?.({ kind: "point", x: cx, y: base - h, r: 30, color: "#ffc070", power: 0.75 });
    p.light?.({ kind: "emit", x: cx - 2, y: base - h - 10, w: 4, h: 9 });
  }
}

function landmarks(layout) {
  const scenes = layout.invitation
    ? [
        {
          paint: campfire,
          x: 150,
          y: layout.invitation.y + layout.invitation.height / 2,
          rx: 130,
          ry: 110,
        },
        {
          paint: relics,
          x: 800,
          y: layout.invitation.y + layout.invitation.height / 2,
          rx: 105,
          ry: 105,
        },
      ]
    : [];
  if (layout.stable)
    scenes.push({
      paint: campsite,
      x: WIDTH / 2,
      y: layout.stable.y + layout.stable.height / 2,
      rx: WIDTH / 2 + 40,
      ry: layout.stable.height / 2 + 20,
    });
  if (layout.divider)
    scenes.push({
      paint: river,
      x: WIDTH / 2,
      y: layout.divider.y + layout.divider.height / 2,
      rx: WIDTH / 2 + 40,
      ry: layout.divider.height / 2 + 25,
    });
  if (layout.drift)
    scenes.push({
      paint: drift,
      x: 480,
      y: layout.drift.y + 180,
      rx: 310,
      ry: 180,
    });
  return scenes;
}

export function paintJourney(painter, layout, includeActors = true) {
  const p = painter;
  const start = (layout.skyHeight || 0) + 540;
  const scenery = landmarks(layout);
  p.ctx.save();
  // Paint complete canopies across the clearing boundary. Clipping at the
  // ground transition would slice the tops of this first forest row.
  paintGround(
    p,
    {
      x: 0,
      y: start,
      width: WIDTH,
      height: Math.max(0, layout.height - start),
    },
    9031,
  );
  const rand = random(3917);
  for (let i = 0; i < Math.ceil((layout.height - start) / 180); i++) {
    const x = rand() * WIDTH,
      y = start + rand() * Math.max(0, layout.height - start);
    paintFern(p, x, y, 0.7 + rand() * 0.5);
  }
  // Litter, tufts and stones everywhere the reading scrolls do not cover.
  forestFloor(
    p,
    start,
    layout.height,
    5303,
    (layout.sections || []).map((s) => ({
      left: s.x,
      right: s.x + s.width,
      top: s.y,
      bottom: s.y + s.height,
    })),
  );
  road(p, layout);
  const roadPoints = forestRoad(layout);
  const onRoad = (box) =>
    roadPoints.some(([x, y]) =>
      intersects(box, { left: x - 40, right: x + 40, top: y - 22, bottom: y + 22 }),
    );
  const trees = [];
  for (let y = start + 35; y < layout.height + 90; y += 62) {
    for (let x = 25; x < WIDTH; x += 54) {
      const tx = x + (rand() - 0.5) * 38,
        ty = y + (rand() - 0.5) * 34;
      const tree = { x: tx, y: ty, s: 0.75 + rand() * 0.45, tone: rand() };
      const footprint = treeFootprint(tree);
      const scenicOpening = onRoad(footprint) || scenery.some((scene) =>
        intersects(footprint, {
          left: scene.x - scene.rx,
          right: scene.x + scene.rx,
          top: scene.y - scene.ry,
          bottom: scene.y + scene.ry,
        }),
      );
      if (!scenicOpening) trees.push(tree);
    }
  }
  const readingTrees = [];
  for (const tree of trees) {
    const reading = (layout.sections || []).some(
      (section) =>
        tree.y > section.y - 30 && tree.y < section.y + section.height + 45,
    );
    if (!reading) continue;
    const extra = {
      x: tree.x + 27,
      y: tree.y + 29,
      s: 0.68 + rand() * 0.25,
      tone: rand(),
    };
    const footprint = treeFootprint(extra);
    if (
      !scenery.some((scene) =>
        intersects(footprint, {
          left: scene.x - scene.rx,
          right: scene.x + scene.rx,
          top: scene.y - scene.ry,
          bottom: scene.y + scene.ry,
        }),
      )
    )
      readingTrees.push(extra);
  }
  trees.push(...readingTrees);
  for (const tree of trees.sort((a, b) => a.y - b.y)) p.tree(tree);
  const framingTrees = [];
  if (layout.invitation) {
    const middle = layout.invitation.y + layout.invitation.height / 2;
    for (const [x, y, tone] of [
      [0, 76, 0.15],
      [282, -63, 0.2],
      [666, -64, 0.17],
      [950, 72, 0.25],
    ])
      framingTrees.push({ x, y: middle + y, s: 0.86, tone });
  }
  if (layout.invitation) {
    const invitation = layout.invitation,
      middle = invitation.y + invitation.height / 2;
    const notice = {
      left: 270,
      right: 690,
      top: invitation.y + 10,
      bottom: invitation.y + invitation.height - 10,
    };
    const candidates = [
      [-14, 205],
      [963, 160],
      [88, -155],
      [318, -145],
      [640, -145],
      [926, -150],
      [105, 207],
      [854, 207],
      [944, 50, 0.57, 0.76],
      [944, 130, 0.62, 0.13],
      [90, 185, 0.55, 0.82],
      [205, 187, 0.61, 0.11],
      [760, 185, 0.55, 0.74],
      [880, 190, 0.6, 0.2],
    ];
    for (const [x, offset, size = 0.79, tone = 0.19] of candidates) {
      const tree = { x, y: middle + offset, s: size, tone };
      const footprint = treeFootprint(tree);
      if (
        intersects(footprint, notice) ||
        scenery.some((scene) =>
          intersects(footprint, {
            left: scene.x - scene.rx,
            right: scene.x + scene.rx,
            top: scene.y - scene.ry,
            bottom: scene.y + scene.ry,
          }),
        )
      )
        continue;
      framingTrees.push(tree);
    }
  }
  for (const tree of framingTrees.sort((a, b) => a.y - b.y)) p.tree(tree);
  for (const scene of scenery) {
    if (scene.paint === campsite) campsite(p, layout.stable, includeActors);
    else if (scene.paint === river) river(p, layout.divider);
    else if (scene.paint === drift) drift(p, layout.drift, includeActors);
    else scene.paint(p, scene.x, scene.y, includeActors);
  }
  p.ctx.restore();
}

// World restores the cached visible band before these small animated overlays.
export function animateJourney(p, layout) {
  const time = p.reduced ? 0 : p.time;
  const viewport = p.viewport || { top: 0, bottom: layout.height };
  for (const scene of landmarks(layout)) {
    if (
      scene.y + scene.ry < viewport.top ||
      scene.y - scene.ry > viewport.bottom
    )
      continue;
    const { x, y } = scene;
    p.ctx.save();
    if (scene.paint === campfire) {
      const flicker = p.reduced ? 0 : Math.floor(time * 5) % 3;
      p.path(
        [
          [x - 13, y + 15],
          [x - 14, y - 3],
          [x - 5, y + 1],
          [x + 3, y - 27],
          [x + 10, y - 7],
          [x + 14, y + 15],
        ],
        ["#f0bb64", "#edaa53", "#f4c975"][flicker],
      );
      p.path(
        [
          [x - 5, y + 15],
          [x - 3, y - 3 - flicker * 2],
          [x + 3, y - 12 - flicker * 2],
          [x + 7, y + 15],
        ],
        "#ffe1a0",
      );
      for (let i = 0; i < 5; i++) {
        const rise = p.reduced ? i * 9 : (time * 18 + i * 17) % 70;
        p.rect(
          x + Math.sin(time * 0.7 + i * 2) * 15,
          y - 19 - rise,
          2,
          3,
          "#d6ab64",
        );
      }
      camper(p, x, y, time, p.reduced);
    } else if (scene.paint === relics) {
      RELIC_CANDLES.forEach(([dx, dy, h], i) => {
        const cx = x + dx,
          top = y + dy - h - 3;
        const f = p.reduced ? 1 : Math.floor(time * 7 + i * 1.9) % 3;
        p.rect(cx - 2, top - 6 - f, 4, 7 + f, "#e98a3a");
        p.rect(cx - 1, top - 4 - f, 2, 4 + f, "#ffe19a");
      });
    } else if (scene.paint === campsite) {
      animateCampsite(p, layout.stable, time, p.reduced);
    } else if (scene.paint === drift) {
      animateDrift(p, layout.drift, time, p.reduced);
    } else if (scene.paint === river) {
      const area = layout.divider;
      for (let i = 0; i < 30; i++) {
        const rx = ((p.reduced ? 0 : time * 13) + i * 41) % WIDTH;
        const ry =
          riverY(area, rx) +
          Math.sin(i * 2.7) * Math.min(29, area.height * 0.2);
        const onDock = Math.abs(rx - 480) < 44 && ry < riverY(area, 480) + 10;
        if (!onDock)
          p.rect(rx, ry, 10 + (i % 4) * 4, 2, i % 3 ? "#3a4a88" : "#6a7ab8");
      }
    }
    p.ctx.restore();
  }
}

// Drawn after the light map: things that make their own light. Headlight
// beams are dithered cones from the lamps forward; fireflies blink.
export function glowJourney(p, layout) {
  const time = p.reduced ? 0 : p.time;
  const viewport = p.viewport || { top: 0, bottom: layout.height };
  const visible = (y, r) => y + r > viewport.top && y - r < viewport.bottom;
  if (layout.drift && visible(layout.drift.y + 200, 220)) {
    const area = layout.drift,
      state = driftState(time, p.reduced),
      { x, yaw } = state,
      y = area.y + state.y;
    const at = (long, side, z = 0) => [
      x + Math.cos(yaw) * long - Math.sin(yaw) * side,
      y + Math.sin(yaw) * long + Math.cos(yaw) * side - z,
    ];
    for (const side of [-17, 17]) {
      for (let step = 1; step < 16; step++) {
        const reach = step * 6,
          width = 3 + step * 1.6;
        for (let k = -2; k <= 2; k++) {
          if ((step + k * 3) % 4 === 0 || step > 13 - Math.abs(k) * 2) continue;
          const [bx, by] = at(48 + reach, side + (k / 2) * width, Math.max(0, 23 - step * 1.4));
          p.rect(bx, by, 2, 2, step < 5 ? "#fff6d0" : "#e8dca8");
        }
      }
      const [hx, hy] = at(47, side, 23);
      p.rect(hx - 2, hy - 2, 5, 5, "#fffbe0");
      const [tx, ty] = at(-47, side, 22);
      p.rect(tx - 2, ty - 2, 4, 5, "#ff5a3a");
    }
  }
  const flies = [];
  if (layout.divider && visible(layout.divider.y + layout.divider.height / 2, layout.divider.height))
    for (let i = 0; i < 6; i++)
      flies.push([83 + i * 151, riverY(layout.divider, 83 + i * 151) - Math.min(49, layout.divider.height * 0.3) - 6, i]);
  if (layout.stable && visible(layout.stable.y + 300, 320))
    for (let i = 0; i < 10; i++) flies.push([120 + i * 52, layout.stable.y + 230 + ((i * 47) % 140), i + 6]);
  for (const [fx, fy, i] of flies) {
    if (!p.reduced && Math.sin(time * 1.4 + i * 2.1) < -0.2) continue;
    p.rect(fx + Math.sin(time * 0.6 + i) * 9, fy + Math.cos(time * 0.5 + i) * 5, 2, 2, "#f6e08a");
  }
}

export function journeyGeometry(layout) {
  return landmarks(layout).map(({ paint, x, y, rx, ry }) => ({
    kind: paint.name,
    x,
    y,
    rx,
    ry,
  }));
}

export function treeFootprint(tree) {
  return {
    left: tree.x - (46 * tree.s + 8),
    right: tree.x + (46 * tree.s + 8),
    top: tree.y - Math.max(80 * tree.s + 6, 68 * tree.s + 22),
    bottom: tree.y + 12,
  };
}

export function intersects(a, b) {
  return (
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  );
}

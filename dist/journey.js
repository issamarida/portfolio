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
// The camper is drawn on the same blocky body plan as the player: a
// 16-wide head, 22-wide tunic, 4-wide arms and short boots, with his own
// knitted beanie, beard and red flannel. He sits facing the fire.
function camper(p, x, y, time, reduced) {
  const state = camperState(time, reduced);
  const [ex, ey] = state.end;
  const sx = x - 84,
    seat = y + 16,
    breathe = reduced ? 0 : Math.floor(time * 1.3) % 3 === 0 ? 2 : 0,
    lean = state.phase === "blowing" || state.phase === "eating" ? 2 : 0,
    chew = state.phase === "eating" && !reduced ? (Math.floor(time * 7) % 2) * 2 : 0,
    blink = !reduced && time % 4.3 < 0.16,
    warm = ["#e8b070", "#f0c080", "#dca060"][reduced ? 0 : Math.floor(time * 6) % 3];
  p.ellipse(sx + 4, seat + 30, 34, 7, "#15271f");
  // Knees forward over the log, boots planted in the dirt.
  p.rect(sx - 6, seat - 4, 20, 8, "#3b4658");
  p.rect(sx + 10, seat, 6, 14, "#3b4658");
  p.rect(sx + 9, seat + 12, 9, 4, "#554835");
  p.rect(sx + 9, seat + 14, 9, 2, "#343732");
  // Tunic: red flannel with the player's stripe highlight.
  const body = seat - 20 + breathe / 2 - lean / 2;
  p.rect(sx - 11, body, 22, 18, "#9c4f37");
  p.rect(sx - 9, body + 1, 5, 16, "#b8664a");
  for (const dx of [-3, 4]) p.rect(sx + dx, body, 2, 18, "#6f3326");
  p.rect(sx - 11, body + 8, 22, 2, "#6f3326");
  p.rect(sx + 9, body + 2, 2, 14, warm);
  p.rect(sx - 13, body + 2, 4, 12, "#8a4430");
  p.rect(sx - 13, body + 12, 4, 4, "#dcbb85");
  // Head: the player's 16×17 face, a short beard and a knitted beanie.
  const hx = sx - 8 + lean,
    hy = body - 17 + chew / 2;
  p.rect(hx, hy, 16, 17, "#dcbb85");
  p.rect(hx + 14, hy + 3, 2, 12, warm);
  p.rect(hx, hy + 10, 12, 7, "#68533a");
  p.rect(hx - 2, hy + 2, 4, 10, "#4b4034");
  p.rect(hx - 2, hy - 4, 20, 7, "#8c2a2f");
  p.rect(hx - 2, hy + 2, 20, 2, "#c86a5a");
  p.rect(hx + 6, hy - 7, 6, 4, "#e8dcc4");
  if (state.burning) {
    p.rect(hx + 10, hy + 4, 2, 4, "#32392c");
    p.rect(hx + 13, hy + 11, 3, 3, "#3a2a20");
  } else if (state.phase === "eating" || blink) {
    p.rect(hx + 9, hy + 6, 4, 2, "#32392c");
    p.rect(hx + 12, hy + 12, 4, 2 + chew / 2, "#7b4434");
  } else {
    p.rect(hx + 10, hy + 5, 2, 3, "#32392c");
    p.rect(hx + 12, hy + 12, 4, 2, "#ad845a");
  }
  if (state.phase === "blowing") {
    p.rect(hx + 15, hy + 11, 3, 3, "#3a2a20");
    for (let i = 0; i < 3; i++) {
      const drift = ((state.s - 8) * 22 + i * 7) % 26;
      if (drift < 18) p.rect(hx + 20 + drift, hy + 10 - i * 2, 4 - Math.floor(drift / 7), 2, "#e7e2d4");
    }
  }
  // Front arm and hand follow the stick.
  const handX = sx + 16 + (ex + 21) * 0.2,
    handY = y + 2 + (ey + 6) * 0.25;
  p.path([[sx + 6, body + 2], [handX, handY - 2], [handX, handY + 2], [sx + 6, body + 6]], "#b8664a");
  p.rect(handX - 2, handY - 2, 4, 4, "#dcbb85");
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
    // A small happy heart floats up after the last bite and pops.
    const rise = (state.s - 10.3) * 24;
    if (rise < 18) {
      const cx = hx + 8,
        cy = hy - 14 - rise;
      p.rect(cx - 4, cy, 3, 3, "#e0707a");
      p.rect(cx + 1, cy, 3, 3, "#e0707a");
      p.rect(cx - 4, cy + 2, 8, 3, "#e0707a");
      p.rect(cx - 2, cy + 5, 4, 2, "#e0707a");
    }
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

// The fisherman's camp at the bottom of the page: his patched tent, a
// campfire where the catch is smoking, and a lamplit dock into a cove.
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
    tent: box(214, 150, 396, 256),
    fire: box(460, 300, 546, 384),
    logs: [box(392, 370, 456, 392), box(560, 370, 624, 392)],
    dock: box(670, 356, 764, 532),
    bucket: box(684, 498, 702, 518),
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
// The fisherman's loop: wait, a bite, reel the fish in, drop it into the
// bucket, re-bait, wind up and cast again. Positions are clearing-relative.
export const FISHING_LOOP = 16;
const ANGLER = { x: 722, y: 520 },
  HAND = [734, 500],
  WATER = [806, 548],
  BUCKET = [693, 502];
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const arc = (a, b, t, height) => {
  const [x, y] = lerp2(a, b, t);
  return [x, y - Math.sin(Math.min(1, Math.max(0, t)) * Math.PI) * height];
};
export function fishermanState(time, reduced = false) {
  const s = reduced ? 3 : ((time % FISHING_LOOP) + FISHING_LOOP) % FISHING_LOOP;
  const rodTip = (r) => {
    const angle = -0.3 + (-1.35 + 0.3) * r;
    return [HAND[0] + Math.cos(angle) * 56, HAND[1] + Math.sin(angle) * 56];
  };
  const bob = reduced ? 0 : Math.round(Math.sin(s * 2.4)) * 2;
  let phase = "wait",
    rod = 0.15,
    bobber = { x: WATER[0], y: WATER[1] + bob, visible: true },
    fish = null,
    splash = null,
    hand = HAND;
  if (s >= 6.4 && s < 7.2) {
    phase = "bite";
    rod = 0.2;
    bobber = { x: WATER[0], y: WATER[1] + 4, visible: true };
    splash = "water";
  } else if (s >= 7.2 && s < 8.8) {
    phase = "reel";
    const k = (s - 7.2) / 1.6;
    rod = lerp(0.2, 1, k);
    const [fx, fy] = arc(WATER, rodTip(rod), k, 30);
    fish = { x: fx, y: fy + 10, flap: Math.floor(s * 10) % 2 };
    bobber = { x: fx, y: fy, visible: true };
  } else if (s >= 8.8 && s < 10.4) {
    phase = "stow";
    const k = (s - 8.8) / 1.6;
    rod = lerp(1, 0.6, k);
    const [fx, fy] = arc([HAND[0] + 4, HAND[1] - 4], BUCKET, k, 24);
    fish = k < 0.95 ? { x: fx, y: fy, flap: Math.floor(s * 10) % 2 } : null;
    hand = lerp2(HAND, [BUCKET[0] + 14, BUCKET[1] - 8], Math.sin(k * Math.PI));
    splash = k > 0.85 ? "bucket" : null;
    bobber = { ...lerp2(rodTip(rod), rodTip(rod), 0), visible: false };
  } else if (s >= 10.4 && s < 13.4) {
    phase = s < 12.6 ? "bait" : "windup";
    rod = s < 12.6 ? 0.6 : lerp(0.6, 1.25, (s - 12.6) / 0.8);
    const [tx, ty] = rodTip(rod);
    bobber = { x: tx, y: ty + 14, visible: true };
    hand = s < 12.6 ? [HAND[0] - 6, HAND[1] + 2] : HAND;
  } else if (s >= 13.4 && s < 14.2) {
    phase = "cast";
    const k = (s - 13.4) / 0.8;
    rod = lerp(1.25, 0.15, Math.min(1, k * 1.6));
    const [bx, by] = arc(rodTip(1.25), WATER, k, 40);
    bobber = { x: bx, y: by, visible: true };
    if (k > 0.9) splash = "water";
  }
  const [tx, ty] = rodTip(rod);
  return { s, phase, rod, tip: [tx, ty], hand, bobber, fish, splash };
}
export function campsiteState(time, reduced = false) {
  const t = reduced ? 0 : time;
  return {
    angler: fishermanState(time, reduced),
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
  for (const [x, y] of [[850, 520], [900, 400], [930, 560], [760, 420]]) {
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
  for (const [x, y] of [[680, 380], [730, 380], [680, 440], [730, 440], [760, 528]]) {
    p.rect(x, top + y - 6, 6, 18, "#3c201e");
    p.rect(x + 1, top + y - 6, 2, 18, "#844024");
  }
  for (const [x, y] of [[680, 372], [664, 512]]) {
    p.lantern(x + 2, top + y);
    for (let i = 0; i < 9; i++)
      p.rect(x - 2 + Math.sin(i * 2.1) * 3, top + y + 36 + i * 5, 8 - (i % 3) * 2, 2, i % 3 === 0 ? "#ffd27a" : i % 2 ? "#c07a3a" : "#8a5a3a");
  }
  // His canoe is tied alongside, a net folded over the thwart.
  p.ellipse(800, top + 430, 82, 16, "#10173a");
  p.path([[760, top + 424], [842, top + 424], [830, top + 434], [772, top + 434]], "#5c2d1f");
  p.path([[764, top + 424], [838, top + 424], [828, top + 430], [774, top + 430]], "#a0613b");
  for (let k = 0; k < 6; k++) p.rect(786 + k * 4, top + 424 + (k % 2), 3, 3, "#8a8a7a");
  p.rect(756, top + 426, 12, 2, "#c0b090");
  // A tackle box on the boards.
  p.rect(744, top + 494, 14, 10, "#4a5a3a");
  p.rect(744, top + 494, 14, 2, "#6a7a4a");
}
// The bucket already holds his catch; a new fish splashes in each loop.
function bucket(p, x, y, splash) {
  p.ellipse(x, y + 8, 22, 5, "#141810");
  p.rect(x - 8, y - 10, 16, 18, "#4a2a1c");
  p.rect(x - 7, y - 9, 14, 16, "#7a4a2a");
  for (const dx of [-4, 1]) p.rect(x + dx, y - 9, 1, 16, "#5a3420");
  for (const dy of [-6, 3]) p.rect(x - 8, y + dy, 16, 2, "#4a4048");
  p.rect(x - 7, y - 10, 14, 3, "#1c2650");
  for (const [dx, h, color] of [[-5, 7, "#8aa0a0"], [-1, 9, "#7a9090"], [3, 6, "#9ab0a8"]]) {
    p.rect(x + dx, y - 10 - h, 3, h, color);
    p.rect(x + dx - 1, y - 12 - h, 5, 3, color);
  }
  p.rect(x - 9, y - 16, 2, 8, "#4a4048");
  p.rect(x + 7, y - 16, 2, 8, "#4a4048");
  p.rect(x - 9, y - 18, 18, 2, "#4a4048");
  if (splash) {
    p.rect(x - 6, y - 16, 2, 2, "#a8c8e8");
    p.rect(x + 4, y - 18, 2, 2, "#a8c8e8");
    p.rect(x, y - 20, 2, 2, "#d8e8f8");
  }
}
function fish(p, x, y, flap) {
  p.rect(x - 6, y - 2, 12, 5, "#8aa0a0");
  p.rect(x - 4, y - 2, 8, 2, "#b8d0c8");
  p.rect(x - 4, y + 1, 8, 1, "#5a7a7a");
  p.rect(x + 3, y - 1, 2, 2, "#1a2028");
  p.rect(x - 10, y - 3 + flap * 2, 4, 3, "#6a8a88");
  p.rect(x - 10, y + 1 - flap * 2, 4, 3, "#6a8a88");
}
// The fisherman shares the player's body plan, but is his own man: an olive
// bucket hat, a grey beard, a khaki vest over a blue shirt and rubber boots.
function angler(p, state, top, time, reduced) {
  const fx = ANGLER.x,
    fy = top + ANGLER.y,
    breathe = reduced ? 0 : Math.floor(time * 1.1) % 3 === 0 ? 1 : 0;
  const hand = [state.hand[0], top + state.hand[1]];
  p.ellipse(fx, fy + 3, 24, 7, "#15271f");
  p.rect(fx - 8, fy - 8, 6, 10, "#2e3e30");
  p.rect(fx + 2, fy - 8, 6, 10, "#2e3e30");
  p.rect(fx - 9, fy, 8, 3, "#1e2a20");
  p.rect(fx + 2, fy, 8, 3, "#1e2a20");
  const body = fy - breathe;
  p.rect(fx - 11, body - 24, 22, 18, "#4a5a7a");
  p.rect(fx - 9, body - 23, 5, 16, "#6a7a9a");
  p.rect(fx - 11, body - 24, 6, 18, "#a08a5a");
  p.rect(fx + 5, body - 24, 6, 18, "#a08a5a");
  p.rect(fx - 10, body - 18, 4, 4, "#8a7448");
  p.rect(fx + 6, body - 18, 4, 4, "#8a7448");
  p.rect(fx - 11, body - 8, 22, 2, "#3a3028");
  p.rect(fx - 13, body - 22, 4, 12, "#4a5a7a");
  p.rect(fx - 13, body - 12, 4, 4, "#dcbb85");
  p.rect(fx - 8, body - 40, 16, 17, "#dcbb85");
  p.rect(fx - 8, body - 30, 14, 7, "#a8a8a0");
  p.rect(fx - 8, body - 32, 4, 4, "#8a8a84");
  p.rect(fx + 8, body - 33, 3, 4, "#dcbb85");
  p.rect(fx + 3, body - 35, 2, 3, "#32392c");
  p.rect(fx + 2, body - 28, 4, 2, "#8a6a5a");
  p.rect(fx - 12, body - 42, 26, 3, "#4a5a2a");
  p.rect(fx - 8, body - 48, 16, 7, "#6a7a44");
  p.rect(fx - 8, body - 43, 16, 2, "#3a4a24");
  p.rect(fx - 6, body - 47, 4, 2, "#8a9a5a");
  p.path([[fx + 4, body - 22], [hand[0], hand[1] - 2], [hand[0], hand[1] + 2], [fx + 4, body - 17]], "#4a5a7a");
  p.rect(hand[0] - 2, hand[1] - 2, 4, 4, "#dcbb85");
  // The rod runs from his hand to the tip; the line to the float or fish.
  const [tx, ty] = [state.tip[0], top + state.tip[1]];
  for (let i = 0; i <= 14; i++) p.rect(hand[0] + (tx - hand[0]) * (i / 14), hand[1] + (ty - hand[1]) * (i / 14), 2, 2, i < 4 ? "#3a2a20" : "#8a6a4a");
  const end = state.fish ? [state.fish.x, top + state.fish.y - 4] : [state.bobber.x, top + state.bobber.y];
  if (state.phase !== "stow")
    for (let i = 0; i <= 18; i++) {
      const t = i / 18,
        sag = state.phase === "wait" || state.phase === "bite" ? Math.sin(t * Math.PI) * 10 : 0;
      p.rect(tx + (end[0] - tx) * t, ty + (end[1] - ty) * t + sag, 1, 1, "#c8c0b0");
    }
}
function fisherTent(p, x, base) {
  // His patched canvas tent, a lantern by the flap, a rod leaning on it
  // and a net drying on a line to a post.
  p.ellipse(x, base + 6, 190, 22, "#141810");
  p.path([[x - 84, base], [x - 4, base - 92], [x + 4, base - 92], [x + 86, base]], "#7a6c4c");
  p.path([[x - 76, base], [x - 2, base - 86], [x - 2, base]], "#c8b48a");
  p.path([[x + 2, base - 86], [x + 78, base], [x + 2, base]], "#a8946c");
  for (const [px, py, pw, ph, color] of [[-50, -26, 16, 12, "#a89a6a"], [30, -40, 14, 12, "#8a7a5a"], [-24, -56, 10, 10, "#b8a47a"]]) {
    p.rect(x + px, base + py, pw, ph, color);
    p.rect(x + px, base + py, pw, 1, "#5a4a34");
  }
  p.rect(x - 4, base - 96, 8, 6, "#5c2d1f");
  p.path([[x - 22, base], [x - 1, base - 50], [x + 20, base]], "#2a2018");
  p.path([[x - 14, base], [x - 1, base - 34], [x + 12, base]], "#ffb347");
  p.path([[x - 8, base], [x - 1, base - 22], [x + 6, base]], "#ffd77a");
  p.light({ kind: "emit", x: x - 10, y: base - 30, w: 20, h: 30 });
  p.light({ kind: "spill", x, y: base, w: 34, h: 30, reach: 54, color: "#ffb860" });
  for (const side of [-1, 1]) p.rect(x + side * 96, base - 3, 2, 6, "#5c2d1f");
  p.rect(x + 40, base - 4, 2, 4, "#3c201e");
  for (let i = 0; i < 26; i++) p.rect(x + 52 + i * 2, base - 62 - i * 2, 2, 2, "#8a6a4a");
  p.rect(x + 110, base - 74, 4, 78, "#3c201e");
  for (let i = 0; i <= 20; i++) {
    const t = i / 20,
      lx = x + 4 + t * 106,
      ly = base - 88 + t * 14 + Math.sin(t * Math.PI) * 10;
    p.rect(lx, ly, 2, 2, "#5a4a3a");
    if (t > 0.35 && t < 0.9)
      for (let k = 2; k < 18; k += 4) p.rect(lx + ((k + i) % 4), ly + k, 2, 2, "#8a8a7a");
  }
  p.rect(x - 96, base - 10, 16, 10, "#6a3a24");
  p.rect(x - 96, base - 10, 16, 2, "#9a5a34");
  p.rect(x - 70, base - 6, 5, 8, "#2e3e30");
  p.rect(x - 64, base - 6, 5, 8, "#2e3e30");
  p.lantern(x - 40, base + 4);
}
// His campfire: a stone ring, two logs to sit on and a stick rack where
// the day's catch is smoking over the coals.
function smokingFire(p, fx, fy) {
  dirtOval(p, fx, fy + 6, 118, 50, 4471, ["#4a3424", "#5a4030", "#3e2c1e", "#6a4a30"]);
  p.ellipse(fx, fy + 2, 48, 24, "#5a5050");
  p.ellipse(fx, fy + 1, 36, 16, "#1a120e");
  for (let k = 0; k < 12; k++) {
    const angle = (k / 12) * Math.PI * 2;
    p.rect(fx + Math.cos(angle) * 20 - 3, fy + Math.sin(angle) * 9 - 2, 7, 6, k % 2 ? "#8a8078" : "#a09888");
  }
  for (const [ex, ey] of [[-6, 4], [4, 6], [8, 2], [-2, 8]]) p.rect(fx + ex, fy + ey, 3, 2, "#ff7a30");
  log(p, fx - 80, fy + 20);
  log(p, fx + 86, fy + 20);
  for (const side of [-1, 1]) {
    p.path([[fx + side * 40, fy + 6], [fx + side * 30, fy - 48], [fx + side * 28, fy - 48], [fx + side * 37, fy + 6]], "#4b241e");
    p.path([[fx + side * 22, fy + 6], [fx + side * 32, fy - 48], [fx + side * 30, fy - 48], [fx + side * 19, fy + 6]], "#3c201e");
  }
  p.rect(fx - 36, fy - 50, 72, 3, "#5c2d1f");
  for (const dx of [-24, -8, 8, 24]) {
    p.rect(dx + fx, fy - 47, 1, 4, "#c8c0b0");
    p.rect(fx + dx - 3, fy - 43, 7, 14, "#b8783a");
    p.rect(fx + dx - 2, fy - 42, 2, 12, "#d8a060");
    p.rect(fx + dx - 3, fy - 36, 7, 1, "#8a5028");
    p.rect(fx + dx - 4, fy - 29, 9, 3, "#9a6a3a");
  }
  p.light({ kind: "point", x: fx, y: fy, r: 190, color: "#ff9440", power: 1.45, flatten: 1.7 });
  p.light({ kind: "emit", x: fx - 14, y: fy - 22, w: 28, h: 26 });
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
  dirtOval(p, 420, top + 300, 240, 120, 4470, ["#2c3a24", "#3a4a2c", "#34442a", "#4a3a28"]);
  cove(p, area);
  dock(p, area);
  fisherTent(p, 306, top + 246);
  smokingFire(p, 502, top + 360);
  for (const [x, y] of [[560, 250], [610, 214], [180, 330], [380, 430]]) {
    p.ellipse(x, top + y, 22, 12, "#4a4e6c");
    p.rect(x - 6, top + y - 4, 10, 2, "#80859f");
    paintFern(p, x + 12, top + y + 6, 0.7);
  }
  for (const [x, y] of [[250, 380], [300, 420], [600, 440], [170, 290]]) mushroom(p, x, top + y);
  // The woods close in around his camp in clumps, deepest at the edges.
  const geometry = campsiteGeometry({ y: 0 });
  const busy = [geometry.tent, geometry.fire, ...geometry.logs, { left: 196, right: 640, top: 150, bottom: 450 }];
  const rand = random(6631);
  const trees = [];
  for (let y = 10; y < 640; y += 26)
    for (let x = -10 + ((y / 26) % 2) * 14; x < 980; x += 30) {
      const clump = 0.5 + 0.5 * Math.sin(x * 0.024 + y * 0.011) * Math.cos(y * 0.031 + 0.4);
      if (rand() > 0.24 + clump * 0.55) continue;
      const tree = { x: x + (rand() - 0.5) * 16, y: y + (rand() - 0.5) * 12, s: 0.7 + rand() * 0.4, tone: rand() < 0.85 ? rand() * 0.78 : 0.85 };
      const half = 42 * tree.s + 8,
        box = { left: tree.x - half, right: tree.x + half, top: tree.y - 70 * tree.s - 10, bottom: tree.y + 10 };
      const wet = [-half, 0, half].some((dx) => inCove(tree.x + dx, tree.y + 20) || inCove(tree.x + dx, tree.y - 20));
      if (wet || busy.some((b) => intersects(box, b))) continue;
      trees.push({ ...tree, y: top + tree.y });
    }
  for (const tree of trees.sort((a, b) => a.y - b.y)) p.tree(tree);
  if (includeActors) animateCampsite(p, area, 0, true);
}
function animateCampsite(p, area, time, reduced) {
  const top = area.y,
    fx = 502,
    fy = top + 360,
    frame = reduced ? 1 : Math.floor(time * 8) % 4;
  p.rect(fx - 12, fy - 10 - (frame % 2) * 2, 24, 12, "#d8501c");
  p.rect(fx - 9, fy - 18 + (frame % 3) * 2, 18, 16, "#f08a28");
  p.rect(fx - 5 + (frame % 2) * 2, fy - 24 + frame, 10, 18, "#ffb347");
  p.rect(fx - 3, fy - 12, 6, 10, "#ffe9a0");
  // Smoke curls up through the hanging fish.
  for (let i = 0; i < 6; i++) {
    const phase = reduced ? i / 6 : (time * 0.18 + i / 6) % 1;
    if (phase > 0.9) continue;
    p.rect(fx - 4 + Math.sin(phase * 7 + i) * (6 + phase * 16), fy - 26 - phase * 80, 4 + phase * 8, 3 + phase * 4, phase < 0.35 ? "#a4a6b8" : "#6c7088");
  }
  const state = campsiteState(time, reduced),
    a = state.angler;
  bucket(p, BUCKET[0], top + BUCKET[1] + 12, a.splash === "bucket");
  angler(p, a, top, time, reduced);
  if (a.fish) fish(p, a.fish.x, top + a.fish.y, a.fish.flap);
  if (a.bobber.visible && !a.fish) {
    p.rect(a.bobber.x - 2, top + a.bobber.y - 4, 4, 4, "#e04a3a");
    p.rect(a.bobber.x - 2, top + a.bobber.y, 4, 2, "#f0f0e0");
  }
  if (a.phase === "wait" || a.splash === "water") {
    const ring = reduced ? 0 : Math.floor(time * 2) % 3;
    p.rect(WATER[0] - 6 - ring * 3, top + WATER[1] + 4, 12 + ring * 6, 2, a.splash ? "#a8c8e8" : "#3a4a88");
  }
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
function drift(p, area, includeActors) {
  const top = area.y;
  // A grass rim, then the packed-earth arena worn into the forest, edged
  // by a neat ring of stones. Nothing else stands near the track.
  dirtOval(p, 480, top + 205, 300, 140, 811, ["#2c3a24", "#3a4a2c", "#24321e"]);
  dirtOval(p, 480, top + 205, 280, 128, 812, ["#5e4630", "#6e5438", "#4e3a26", "#7e6a50", "#8a8070"]);
  for (const [radius, dy, tone] of [[148, 0, "#3e2c1e"], [158, -3, "#44301f"], [166, 2, "#3e2c1e"], [176, -1, "#4a3622"], [140, 4, "#4a3622"]]) {
    for (let i = 0; i < 160; i++) {
      const angle = (i / 160) * Math.PI * 2;
      if ((i * 7 + radius) % 23 < 3) continue;
      p.rect(480 + Math.cos(angle) * radius, top + 205 + dy + Math.sin(angle) * (62 + (radius - 160) * 0.3), 4, 2, tone);
    }
  }
  for (let k = 0; k < 44; k++) {
    const angle = (k / 44) * Math.PI * 2,
      sx = 480 + Math.cos(angle) * 286,
      sy = top + 205 + Math.sin(angle) * 132;
    p.ellipse(sx, sy + 2, 14, 7, "#2a2622");
    p.ellipse(sx, sy, 12, 6, k % 2 ? "#6a6660" : "#7a766e");
    p.rect(sx - 3, sy - 2, 5, 2, "#9a968c");
  }
  // Pines close in around the glade, a respectful distance from the track.
  const trees = [];
  const rand = random(9902);
  for (let x = 120; x < 860; x += 30) {
    trees.push({ x: x + (rand() - 0.5) * 16, y: top + 30 + (rand() - 0.5) * 14, s: 0.6 + rand() * 0.28, tone: rand() * 0.78 });
    if (rand() < 0.6) trees.push({ x: x + 14, y: top + 12 + rand() * 8, s: 0.5 + rand() * 0.2, tone: rand() * 0.78 });
  }
  for (const [x, y, s, tone] of [
    [40, 160, 1, 0.3], [60, 250, 0.9, 0.1], [30, 330, 1.05, 0.6], [110, 350, 0.85, 0.2],
    [920, 120, 1, 0.2], [930, 240, 1.05, 0.5], [880, 350, 0.95, 0.15], [940, 340, 0.8, 0.3],
    [130, 90, 0.9, 0.4], [850, 80, 0.9, 0.6],
  ])
    trees.push({ x, y: top + y, s, tone });
  for (const tree of trees.sort((a, b) => a.y - b.y)) p.tree(tree);
  // Four lanterns stand back among the trees and light the track.
  for (const [x, y] of [[152, 130], [810, 130], [156, 300], [806, 302]]) p.lantern(x, top + y);
  if (includeActors) animateDrift(p, area, 0, true);
}

// A forest memorial built around a bonfire: a coiled sword stands in a
// mound of ash and embers inside a broken flagstone ring, before a ruined
// arch of weathered stone where travellers leave candles. Grounded and
// quiet: only ember-light and candle-light, no glow of its own.
const ASH = ["#2e2a26", "#4e4a44", "#6a665e", "#8a867c", "#aaa69a"];
const RELIC_CANDLES = [
  [-44, -70, 8],
  [-38, -70, 6],
  [44, -58, 10],
  [-78, -44, 12],
  [-66, -48, 8],
  [70, -20, 10],
  [80, -24, 14],
  [-92, 28, 10],
  [-40, 52, 8],
  [44, 54, 12],
  [94, 34, 9],
];
function stoneBlock(p, x, y, w, h) {
  p.rect(x, y, w, h, ASH[1]);
  p.rect(x, y, w, 2, ASH[3]);
  p.rect(x, y + h - 2, w, 2, ASH[0]);
  p.rect(x + w - 2, y + 2, 2, h - 4, ASH[0]);
  p.rect(x + 2, y + 3, Math.max(2, w / 3), 1, ASH[2]);
}
function relics(p, x, y) {
  // Ash-grey ground, then a broken ring of worn flagstones.
  p.ellipse(x, y + 34, 224, 84, "#1e221c");
  p.ellipse(x, y + 32, 196, 66, "#38342e");
  for (let k = 0; k < 20; k++) {
    if (k === 3 || k === 11 || k === 16) continue;
    const angle = (k / 20) * Math.PI * 2;
    const sx = x + Math.cos(angle) * 84,
      sy = y + 32 + Math.sin(angle) * 28;
    p.ellipse(sx, sy + 1, 22, 10, ASH[0]);
    p.ellipse(sx, sy, 20, 8, k % 2 ? ASH[2] : ASH[3]);
    p.rect(sx - 4, sy - 2, 6, 1, ASH[4]);
    if (k % 5 === 0) p.rect(sx + 2, sy - 3, 4, 2, "#3d5a34");
  }
  // The ruin behind: a broken arch on two pillars and a crumbling wall.
  for (const [wx, wy, w, h] of [
    [-104, -10, 22, 14], [-82, -18, 20, 22], [-62, -8, 18, 12], [56, -12, 20, 16],
    [76, -22, 18, 26], [94, -6, 16, 10], [-96, -24, 16, 8], [80, -32, 12, 10],
  ])
    stoneBlock(p, x + wx, y + wy, w, h);
  const pillar = (px, height) => {
    p.rect(px - 9, y - height, 18, height + 4, ASH[0]);
    p.rect(px - 8, y - height, 16, height, ASH[2]);
    for (let yy = y - height + 8; yy < y; yy += 10) {
      p.rect(px - 8, yy, 16, 1, ASH[0]);
      p.rect(px - 7, yy + 1, 7, 1, ASH[3]);
    }
    p.rect(px + 4, y - height, 4, height, ASH[1]);
    p.rect(px - 11, y - 2, 22, 6, ASH[1]);
  };
  pillar(x - 44, 68);
  pillar(x + 44, 56);
  for (const [dx, dy, w] of [[50, -60, 8], [38, -58, 6], [56, -56, 6]]) p.rect(x + dx, y + dy, w, 4, ASH[2]);
  for (const [dx, dy] of [[-24, 4], [62, 10], [-70, 16]]) {
    p.rect(x + dx, y + dy, 14, 8, ASH[1]);
    p.rect(x + dx, y + dy, 14, 2, ASH[3]);
  }
  // The arch that once joined them lies broken across the ring's edge.
  for (const [dx, dy] of [[-30, -6], [-16, -10], [-2, -12], [14, -11]]) stoneBlock(p, x + dx, y + dy, 14, 9);
  // Moss and ivy have reclaimed the stone.
  for (const [vx, vy, len] of [[-50, -68, 30], [-40, -64, 18], [40, -56, 22], [-86, -18, 12], [82, -22, 14]])
    for (let k = 0; k < len; k += 3) {
      p.rect(x + vx + Math.round(Math.sin(k * 0.5) * 2), y + vy + k, 2, 3, "#24391f");
      if (k % 6 === 0) p.rect(x + vx - 2, y + vy + k, 4, 2, "#3d5a34");
    }
  // A rusted round shield rests against the left pillar.
  p.ellipse(x - 62, y + 4, 18, 18, "#3a2a22");
  p.ellipse(x - 62, y + 4, 14, 14, "#6a3a24");
  p.rect(x - 64, y + 2, 4, 4, "#8a7a6a");
  // The bonfire: a mound of ash, charred wood and a few old bones.
  p.ellipse(x, y + 30, 84, 26, ASH[0]);
  p.ellipse(x, y + 26, 72, 20, ASH[2]);
  p.ellipse(x, y + 22, 48, 14, ASH[3]);
  for (const [dx, dy, w, color] of [[-24, 24, 12, "#2a1a14"], [14, 26, 14, "#2a1a14"], [-8, 30, 10, "#3a2418"], [20, 20, 6, "#d8d0b8"], [-28, 30, 5, "#c8c0a8"]])
    p.rect(x + dx, y + dy, w, 3, color);
  p.rect(x - 34, y + 30, 6, 5, "#d8d0b8");
  p.rect(x - 33, y + 31, 2, 2, ASH[0]);
  for (const [ex, ey] of [[-16, 22], [-6, 26], [8, 24], [16, 28], [2, 30], [-22, 28]]) p.rect(x + ex, y + ey, 2, 2, "#c8501c");
  // The coiled sword, its blade twisted and blackened, stands in the ash.
  p.rect(x - 5, y - 38, 10, 62, "#1c1a18");
  for (let k = 0; k < 30; k++) {
    const by = y - 36 + k * 2,
      twist = k % 4,
      hot = by > y + 4;
    p.rect(x - 4 + twist * 2, by, 2, 2, hot ? "#c8642a" : "#9a968e");
    p.rect(x - 4 + ((twist + 1) % 4) * 2, by, 2, 2, hot ? "#8a3a1c" : "#6a665e");
    p.rect(x - 4 + ((twist + 3) % 4) * 2, by, 2, 2, "#2a2826");
  }
  p.rect(x - 3, y - 42, 6, 4, "#6a665e");
  p.rect(x - 15, y - 46, 30, 5, "#1c1c22");
  p.rect(x - 14, y - 46, 28, 2, "#7a7680");
  p.rect(x - 16, y - 44, 3, 3, "#3a3a40");
  p.rect(x + 13, y - 44, 3, 3, "#3a3a40");
  p.rect(x - 3, y - 62, 6, 16, "#4a3426");
  for (let k = 0; k < 5; k++) p.rect(x - 3, y - 61 + k * 3, 6, 1, "#2a1a14");
  p.rect(x - 4, y - 68, 8, 6, "#3a3a40");
  p.rect(x - 3, y - 68, 3, 2, "#8a8690");
  p.light?.({ kind: "point", x, y: y + 20, r: 120, color: "#ff8a40", power: 0.95, flatten: 1.5 });
  p.light?.({ kind: "emit", x: x - 10, y: y + 10, w: 20, h: 14 });
  relicCandles(p, x, y);
}
function relicCandles(p, x, y) {
  for (const [dx, dy, h] of RELIC_CANDLES) {
    const cx = x + dx,
      base = y + dy;
    p.rect(cx - 4, base - h, 8, h, "#d8ccaa");
    p.rect(cx - 4, base - h, 2, h, "#f0e6c8");
    p.rect(cx + 2, base - h, 2, h, "#a89a78");
    p.rect(cx - 2, base - h, 2, 4 + (h % 4), "#f0e6c8");
    p.rect(cx - 6, base - 2, 12, 2, "#c8bc98");
    p.rect(cx - 1, base - h - 3, 2, 3, "#3a2d22");
    p.light?.({ kind: "point", x: cx, y: base - h, r: 28, color: "#ffc070", power: 0.7 });
    p.light?.({ kind: "emit", x: cx - 2, y: base - h - 10, w: 4, h: 9 });
  }
}
// Flames lick up around the sword; sparks and ash drift away slowly.
function bonfireFlames(p, x, y, time, reduced) {
  const f = reduced ? 1 : Math.floor(time * 7) % 3;
  for (const [dx, h, color] of [[-10, 10 + f * 2, "#c8501c"], [6, 12 - f * 2, "#c8501c"], [-4, 16 + (f % 2) * 3, "#e8782a"], [2, 9 + f, "#f0a040"]]) {
    p.rect(x + dx, y + 22 - h, 5, h, color);
    p.rect(x + dx + 1, y + 22 - h + 2, 2, Math.max(2, h - 6), "#ffc060");
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
  const trees = [];
  for (let y = start + 35; y < layout.height + 90; y += 62) {
    for (let x = 25; x < WIDTH; x += 54) {
      const tx = x + (rand() - 0.5) * 38,
        ty = y + (rand() - 0.5) * 34;
      const tree = { x: tx, y: ty, s: 0.75 + rand() * 0.45, tone: rand() };
      const footprint = treeFootprint(tree);
      const scenicOpening = scenery.some((scene) =>
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
      bonfireFlames(p, x, y, time, p.reduced);
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
  if (layout.invitation) {
    const ry = layout.invitation.y + layout.invitation.height / 2;
    if (visible(ry, 110))
      for (let i = 0; i < 7; i++) {
        const rise = p.reduced ? i * 9 : (time * 9 + i * 13) % 70;
        if (rise > 56) continue;
        p.rect(800 + Math.sin(time * 0.8 + i * 1.7) * (6 + rise * 0.3), ry + 4 - rise, 2, 2, rise < 28 ? "#ffb060" : i % 2 ? "#c8501c" : "#6a6660");
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

import { paintGround, paintFern } from "./ground.js";
import {
  HOMESTEAD_BAND,
  paintHomestead,
  animateHomestead,
} from "./homestead.js";
export {
  HOMESTEAD_BAND,
  farmerState,
  dogState,
  crowState,
  homesteadGeometry,
} from "./homestead.js";

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

function stallHorse(p, x, y, feeding, time = 0) {
  const bob = time
    ? Math.round(Math.sin(time * (feeding ? 1.4 : 0.55))) * 2
    : 0;
  const tone = feeding ? "#aa7c4d" : "#c1bda4";
  const headY = y + (feeding ? 9 : -20) + bob;
  p.ellipse(x, y + 18, 59, 9, "#32372b");
  for (const dx of [-19, -9, 10, 19]) {
    p.rect(x + dx, y + 5, 5, 24, tone);
    p.rect(x + dx - 1, y + 26, 7, 4, "#39332a");
  }
  p.ellipse(x - 2, y, 48, 28, tone);
  p.path(
    [
      [x + 11, y - 9],
      [x + 20, headY - 7],
      [x + 29, headY + 2],
      [x + 21, y + 7],
    ],
    tone,
  );
  p.ellipse(x + 25, headY, 22, 15, tone);
  p.rect(x + 30, headY + 1, 10, 6, "#d0bfa0");
  p.rect(x + 19, headY - 10, 4, 6, tone);
  p.rect(x + 26, headY - 9, 4, 5, tone);
  p.rect(x + 28, headY - 3, 3, 2, "#3b372d");
  p.path(
    [
      [x + 12, y - 8],
      [x + 16, headY - 9],
      [x + 21, headY - 8],
      [x + 17, y + 2],
    ],
    "#4d4030",
  );
  p.path(
    [
      [x - 22, y - 6],
      [x - 28, y - 4],
      [x - 30 + (time ? Math.round(Math.sin(time)) * 2 : 0), y + 16],
      [x - 25, y + 18],
    ],
    "#4d4030",
  );
  if (feeding) {
    p.rect(x + 29, headY + 5, 10, 2, "#a89751");
    p.rect(x + 35, headY + 6, 2, 7, "#cab772");
  }
}

function stallFront(p) {
  for (const dx of [-98, 18]) {
    p.rect(dx, 35, 80, 6, "#9e7c4b");
    p.rect(dx, 47, 80, 5, "#85613c");
    p.rect(dx + 2, 31, 5, 27, "#c29a5d");
    p.rect(dx + 73, 31, 5, 27, "#c29a5d");
    p.rect(dx + 6, 36, 66, 2, "#c4a16a");
  }
}

function barn(p, x, y) {
  p.ellipse(x, y + 75, 440, 148, "#354333");
  p.ellipse(x, y + 69, 392, 113, "#5a4933");
  // A compact open-front timber stable, with hay and warm hanging lanterns.
  p.rect(x - 116, y - 65, 232, 121, "#483b2c");
  for (let dx = -112; dx < 114; dx += 16) {
    p.rect(x + dx, y - 62, 13, 114, "#76553b");
    p.rect(x + dx, y - 62, 3, 114, "#8b6746");
  }
  for (const dx of [-98, 18]) {
    p.rect(x + dx, y - 47, 80, 101, "#27302a");
    p.rect(x + dx + 4, y - 43, 72, 97, "#403c2d");
    p.rect(x + dx + 9, y + 25, 62, 27, "#a78b4c");
    for (let i = 0; i < 7; i++)
      p.rect(x + dx + 11 + i * 8, y + 22 + (i % 3) * 4, 3, 27, "#c2a662");
  }
  p.path(
    [
      [x - 136, y - 63],
      [x - 103, y - 113],
      [x + 101, y - 113],
      [x + 136, y - 63],
    ],
    "#293e38",
  );
  for (let row = 0; row < 5; row++) {
    const inset = (4 - row) * 7;
    p.rect(
      x - 131 + inset,
      y - 107 + row * 9,
      262 - inset * 2,
      7,
      row % 2 ? "#446052" : "#365349",
    );
  }
  p.rect(x - 138, y - 63, 276, 7, "#9c7b50");
  // A louvred cupola rides the ridge; an owl lives in its window.
  p.rect(x - 15, y - 135, 30, 23, "#6b5139");
  p.rect(x - 13, y - 133, 26, 2, "#86684a");
  p.rect(x - 8, y - 130, 16, 14, "#1f1a16");
  p.path(
    [
      [x - 20, y - 134],
      [x, y - 150],
      [x + 20, y - 134],
    ],
    "#365349",
  );
  p.rect(x - 1, y - 156, 2, 8, "#3b3a33");
  p.rect(x - 7, y - 153, 14, 2, "#3b3a33");
  // The hayloft door stands open, straw spilling over the sill.
  p.rect(x + 54, y - 104, 26, 34, "#2c241c");
  p.rect(x + 56, y - 80, 22, 10, "#c2a662");
  for (let i = 0; i < 5; i++) p.rect(x + 56 + i * 5, y - 72 + (i % 2) * 3, 2, 7, "#e0c47a");
  p.rect(x + 80, y - 104, 8, 34, "#76553b");
  // Horseshoe over the stalls and a saddle across the left rail.
  p.rect(x - 9, y - 56, 4, 9, "#a6a79c");
  p.rect(x + 5, y - 56, 4, 9, "#a6a79c");
  p.rect(x - 7, y - 49, 14, 4, "#a6a79c");
  p.ellipse(x - 179, y + 44, 30, 12, "#7d4a2b");
  p.rect(x - 186, y + 44, 12, 14, "#9c3f36");
  p.rect(x - 186, y + 48, 12, 2, "#d9b25e");
  p.rect(x - 166, y + 47, 3, 10, "#5b3b24");
  // A pitchfork leans against the corner post.
  p.rect(x + 128, y - 2, 2, 52, "#8c6a43");
  for (const dx of [124, 128, 132]) p.rect(x + dx, y - 10, 2, 9, "#a6a79c");
  p.rect(x + 124, y - 2, 10, 2, "#a6a79c");
  for (const dx of [-118, -4, 110]) {
    p.rect(x + dx, y - 57, 8, 115, "#b08a54");
    p.rect(x + dx + 2, y - 55, 3, 110, "#d0aa6e");
  }
  for (const side of [-1, 1]) {
    const sx = x + side * 179;
    p.rect(sx, y + 30, 7, 78, "#8c714b");
    p.rect(sx - 31, y + 46, 64, 7, "#a58b60");
    p.rect(sx - 31, y + 71, 64, 6, "#a58b60");
  }
  p.lantern(x - 113, y + 3);
  p.lantern(x + 117, y + 3);
  p.ellipse(x + 19, y + 132, 47, 20, "#665845");
  p.ellipse(x + 19, y + 127, 40, 15, "#3b5860");
}

function highlandCow(p, x, y, time = 0, phase = 0, pale = 0) {
  const bob = time ? Math.round(Math.sin(time * 0.65 + phase)) * 2 : 0;
  const tail = time ? Math.round(Math.sin(time * 0.9 + phase)) * 4 : 0;
  p.ellipse(x, y + 35, 105, 19, "#24342a");
  for (const dx of [-27, -13, 21, 34]) {
    p.rect(x + dx, y + 10, 10, 25, "#955e34");
    p.rect(x + dx - 1, y + 32, 12, 6, "#3f3429");
  }
  p.path(
    [
      [x - 42, y - 10],
      [x - 48, y - 4],
      [x - 53 + tail, y + 23],
      [x - 46 + tail, y + 27],
    ],
    "#b98042",
  );
  p.ellipse(x - 4, y, 91, 57, pale ? "#c3b591" : "#a86b35");
  p.ellipse(x - 13, y - 11, 65, 32, pale ? "#ddd0aa" : "#c28a47");
  for (let i = 0; i < 12; i++) {
    const dx = -43 + i * 7;
    p.rect(
      x + dx,
      y + 6 + (i % 3) * 3,
      7,
      12 + (i % 4) * 3,
      i % 3 ? "#ad743a" : "#ca924a",
    );
    p.rect(
      x + dx + 2,
      y - 13 + (i % 3) * 7,
      3,
      13,
      pale ? "#e9dab5" : "#d19c53",
    );
  }
  const hx = x + 30,
    hy = y - 8 + bob;
  for (const side of [-1, 1]) {
    p.path(
      [
        [hx + side * 15, hy - 12],
        [hx + side * 31, hy - 15],
        [hx + side * 36, hy - 28],
        [hx + side * 32, hy - 31],
        [hx + side * 26, hy - 20],
        [hx + side * 12, hy - 19],
      ],
      "#ddd0aa",
    );
    p.ellipse(hx + side * 22, hy, 17, 10, "#a66938");
    p.rect(hx + side * 20 - 4, hy - 2, 8, 4, "#c38a4b");
  }
  p.ellipse(hx, hy + 4, 41, 44, pale ? "#c8b896" : "#b8793e");
  p.ellipse(hx, hy - 10, 45, 22, pale ? "#e2d1a8" : "#d09a50");
  for (let i = 0; i < 7; i++)
    p.rect(
      hx - 21 + i * 6,
      hy - 10,
      7,
      17 + (i % 3) * 4,
      i % 2 ? "#c58b43" : "#d6a45a",
    );
  const blink = time && Math.floor(time * 0.32 + phase) % 8 === 0;
  for (const dx of [-12, 10])
    p.rect(hx + dx, hy + 4, 3, blink ? 2 : 4, "#3d3529");
  p.ellipse(hx, hy + 21, 28, 15, "#d0a56d");
  for (const dx of [-8, 5]) p.rect(hx + dx, hy + 19, 3, 3, "#80603c");
  p.rect(
    hx - 5,
    hy + 25,
    10,
    time && Math.floor(time * 1.5 + phase) % 2 ? 3 : 2,
    "#82613d",
  );
}

function grazingCow(p, x, y, time) {
  const chew = time ? (Math.floor(time * 1.8) % 2) * 2 : 0;
  const tail = time ? Math.round(Math.sin(time * 0.8)) * 3 : 0;
  p.ellipse(x, y + 37, 108, 17, "#24342a");
  for (const dx of [-26, -13, 17, 31]) {
    p.rect(x + dx, y + 10, 9, 27, "#744c31");
    p.rect(x + dx - 1, y + 34, 11, 5, "#343128");
  }
  p.path(
    [
      [x - 40, y - 6],
      [x - 47, y - 2],
      [x - 52 + tail, y + 27],
      [x - 44, y + 25],
    ],
    "#93603a",
  );
  p.ellipse(x - 4, y, 86, 49, "#875532");
  p.ellipse(x - 12, y - 9, 61, 29, "#aa7745");
  for (let i = 0; i < 11; i++)
    p.rect(
      x - 41 + i * 7,
      y + 7,
      7,
      12 + (i % 3) * 4,
      i % 2 ? "#93603a" : "#b17e47",
    );
  p.path(
    [
      [x + 21, y - 14],
      [x + 45, y + 10],
      [x + 39, y + 28],
      [x + 18, y + 8],
    ],
    "#9b693c",
  );
  p.ellipse(x + 43, y + 19 + chew, 35, 30, "#bb894d");
  for (const side of [-1, 1])
    p.path(
      [
        [x + 43 + side * 10, y + 13],
        [x + 43 + side * 28, y + 6],
        [x + 43 + side * 29, y - 4],
        [x + 43 + side * 24, y - 3],
        [x + 43 + side * 20, y + 3],
      ],
      "#ddd0aa",
    );
  for (let i = 0; i < 5; i++)
    p.rect(x + 27 + i * 6, y + 7 + chew, 7, 15 + (i % 2) * 4, "#c49152");
  p.rect(x + 36, y + 23 + chew, 5, 2, "#433528");
  p.ellipse(x + 46, y + 32 + chew, 23, 11, "#cfa56f");
  for (let i = 0; i < 4; i++)
    p.rect(x + 34 + i * 6, y + 38, 3, 7 + (i % 2) * 4, "#839351");
}

function sleepingCow(p, x, y, time) {
  const breath = time ? Math.round((Math.sin(time * 0.65) + 1) * 0.7) * 2 : 0;
  p.ellipse(x, y + 18, 94, 18, "#24342a");
  p.ellipse(x - 4, y - breath / 2, 89, 44 + breath, "#674b36");
  p.ellipse(x - 15, y - 8 - breath / 2, 62, 27 + breath, "#8e6b49");
  for (let i = 0; i < 10; i++)
    p.rect(x - 42 + i * 8, y + 8, 8, 7 + (i % 3) * 3, "#99724c");
  p.ellipse(x + 30, y + 5, 35, 29, "#a17b52");
  for (const side of [-1, 1])
    p.path(
      [
        [x + 30 + side * 10, y - 1],
        [x + 30 + side * 25, y - 8],
        [x + 30 + side * 28, y - 20],
        [x + 30 + side * 24, y - 22],
        [x + 30 + side * 19, y - 11],
      ],
      "#d1c29a",
    );
  for (let i = 0; i < 5; i++)
    p.rect(x + 14 + i * 6, y - 6, 7, 15 + (i % 2) * 3, "#b68c5c");
  p.rect(x + 21, y + 7, 6, 2, "#43382c");
  p.rect(x + 36, y + 8, 6, 2, "#43382c");
  p.ellipse(x + 30, y + 19, 24, 10, "#c3a47a");
  p.ellipse(x - 16, y + 17, 35, 11, "#a78258");
}

function calf(p, x, y, time) {
  const bob = time ? Math.round(Math.sin(time * 0.75)) * 2 : 0;
  const step = time ? Math.round(Math.sin(time * 1.4)) * 2 : 0;
  p.ellipse(x, y + 23, 67, 10, "#24342a");
  for (const [i, dx] of [-17, -6, 12, 21].entries()) {
    p.rect(x + dx, y + 7, 6, 16 + (i % 2 ? step : -step), "#cbab72");
    p.rect(x + dx - 1, y + 20 + (i % 2 ? step : -step), 8, 4, "#675137");
  }
  p.ellipse(x - 3, y, 55, 32, "#c0a16a");
  p.ellipse(x - 10, y - 7, 37, 17, "#dfc287");
  for (let i = 0; i < 8; i++)
    p.rect(x - 27 + i * 7, y + 7, 6, 7 + (i % 2) * 3, "#d7bb81");
  p.ellipse(x + 23, y - 2 + bob, 28, 28, "#d9b97c");
  for (const dx of [13, 29]) p.rect(x + dx, y - 22 + bob, 5, 9, "#e7d6ab");
  p.ellipse(x + 8, y - 6 + bob, 11, 7, "#d9b97c");
  p.ellipse(x + 38, y - 6 + bob, 11, 7, "#d9b97c");
  for (let i = 0; i < 5; i++)
    p.rect(x + 10 + i * 5, y - 12 + bob, 6, 12 + (i % 2) * 4, "#ead098");
  for (const dx of [15, 29]) p.rect(x + dx, y + 1 + bob, 3, 3, "#55452f");
  p.ellipse(x + 24, y + 11 + bob, 20, 9, "#eed9ad");
  p.rect(x + 21, y + 10 + bob, 6, 2, "#8d724c");
}

export function farmGeometry(area) {
  return {
    barn: [235, area.y + 139, 1],
    cows: [
      [570, 135],
      [820, 245],
      [560, 275],
      [685, 200],
      [700, 304],
      [815, 110],
    ].map(([x, y]) => [x, area.y + y]),
    animalScale: 1,
  };
}

export function farmFenceGeometry(area) {
  const points = [
    [38, 28],
    [248, 17],
    [482, 25],
    [724, 17],
    [910, 31],
    [940, 74],
    [944, 256],
    [954, 450],
    [952, 499],
    [704, 501],
    [442, 490],
    [231, 501],
    [59, 488],
    [22, 450],
    [28, 250],
    [20, 83],
  ].map(([x, y]) => [x, area.y + y]);
  return { points, gate: { left: 356, right: 440, y: area.y + 493 } };
}
function farmFence(p, area, front) {
  const { points, gate } = farmFenceGeometry(area);
  for (let i = 0; i < points.length; i++) {
    if ((i >= 7 && i <= 12) !== front) continue;
    const [ax, ay] = points[i],
      [bx, by] = points[(i + 1) % points.length];
    const length = Math.hypot(bx - ax, by - ay),
      count = Math.ceil(length / 52);
    p.path(
      [
        [ax, ay - 18],
        [bx, by - 18],
        [bx, by - 12],
        [ax, ay - 12],
      ],
      "#ac9060",
    );
    p.path(
      [
        [ax, ay - 5],
        [bx, by - 5],
        [bx, by],
        [ax, ay],
      ],
      "#967b50",
    );
    for (let j = 0; j < count; j++) {
      const x = ax + ((bx - ax) * j) / count,
        y = ay + ((by - ay) * j) / count;
      p.rect(x - 2, y - 25, 7, 31, "#8a7047");
      p.rect(x, y - 23, 3, 28, "#bda06c");
    }
  }
  if (front) {
    p.rect(
      gate.left + 7,
      gate.y - 18,
      gate.right - gate.left - 7,
      6,
      "#c1a16b",
    );
    p.rect(gate.left + 7, gate.y - 5, gate.right - gate.left - 7, 5, "#c1a16b");
    p.path(
      [
        [gate.left + 9, gate.y - 17],
        [gate.left + 13, gate.y - 18],
        [gate.right - 1, gate.y - 2],
        [gate.right - 4, gate.y + 1],
      ],
      "#ab8954",
    );
    p.rect(gate.right - 12, gate.y - 11, 8, 3, "#d7c490");
  }
}

function scaledAt(p, x, y, scale, paint) {
  p.ctx.save();
  p.ctx.translate(Math.round(x / 2) * 2, Math.round(y / 2) * 2);
  p.ctx.scale(scale, scale);
  paint();
  p.ctx.restore();
}

export function chickenState(time, reduced = false, index = 0) {
  const paths = [
    [205, 302, 15, 6],
    [320, 318, 15, 5],
    [62, 302, 10, 7],
    [450, 290, 10, 6],
    [440, 360, 10, 7],
    [435, 430, 8, 5],
    [82, 446, 12, 5],
    [180, 458, 15, 5],
    [280, 450, 15, 5],
    [365, 455, 10, 5],
  ];
  const [x, y, rx, ry] = paths[index % paths.length];
  const phase = reduced
    ? index * 1.7
    : time * (0.95 + index * 0.09) + index * 2.6;
  return {
    x: x + Math.sin(phase) * rx,
    y: y + Math.sin(phase * 1.3) * ry,
    face: Math.cos(phase) < 0 ? -1 : 1,
  };
}
function chicken(p, area, time, reduced, index) {
  const state = chickenState(time, reduced, index),
    x = state.x,
    y = area.y + state.y;
  const step = reduced ? 0 : (Math.floor(time * 8 + index) % 2) * 2;
  const body = [
    "#d1cdb0",
    "#ae8e62",
    "#e0d8bc",
    "#8d7759",
    "#c2ab80",
    "#d4bd8a",
  ][index % 6];
  // Hens stop now and then to peck at the ground.
  const peck = reduced ? 0 : Math.floor(time * 1.6 + index * 0.7) % 4 === 0 ? 6 : 0;
  p.ellipse(x, y, 15, 11, body);
  p.ellipse(x + state.face * (7 + peck / 3), y - 5 + peck, 8, 8, index % 2 ? "#c9ad80" : "#e5dcc0");
  p.rect(x + state.face * 5, y - 12 + peck, 4, 4, "#bd7955");
  p.rect(x + state.face * (11 + peck / 3), y - 4 + peck, 4, 2, "#c8a35b");
  p.rect(x - state.face * 8, y - 6, 4, 4, body);
  p.rect(x - 3, y + 4, 2, 5 + step, "#c8a35b");
  p.rect(x + 3, y + 4, 2, 7 - step, "#c8a35b");
}

export function pigState(time, reduced = false, index = 0) {
  const phase = reduced ? index * 2.1 : time * 0.55 + index * 2.1;
  return {
    x: (index ? 836 : 685) + Math.sin(phase) * 7,
    y: (index ? 441 : 405) + Math.cos(phase) * 3,
    roll: reduced ? index : Math.floor(time * 0.8 + index * 2) % 4,
    face: index ? -1 : 1,
  };
}
function pig(p, area, time, reduced, index) {
  const state = pigState(time, reduced, index),
    x = state.x,
    y = area.y + state.y;
  const upside = state.roll === 1 || state.roll === 2;
  p.ellipse(x, y + 11, 50, 13, "#65513c");
  p.ellipse(x, y, 43, upside ? 29 : 25, index ? "#c5947f" : "#d5aa90");
  p.ellipse(x - 5, y - 4, 25, upside ? 22 : 15, index ? "#ddad91" : "#e7bca1");
  for (const dx of [-13, 10])
    p.rect(x + dx, y + (upside ? -20 : 9), 6, 9, "#ad7e6b");
  const hx = x + state.face * 22,
    hy = y + (upside ? -2 : 3);
  p.ellipse(hx, hy, 23, 21, "#d9a38c");
  p.path(
    [
      [hx - 5, hy - 8],
      [hx - 10, hy - 17],
      [hx + 1, hy - 11],
    ],
    "#e3b298",
  );
  p.ellipse(hx + state.face * 10, hy + 4, 13, 10, "#e8b7a0");
  p.rect(hx + state.face * 12, hy + 2, 2, 3, "#966f60");
  p.rect(hx + state.face * 6, hy - 2, 3, 2, "#73594e");
  p.path(
    [
      [x - state.face * 23, y],
      [x - state.face * 30, y - 6],
      [x - state.face * 34, y - 2],
      [x - state.face * 29, y + 1],
    ],
    "#bd917b",
  );
  for (const [dx, dy] of [
    [-7, 5],
    [7, 2],
    [16, -4],
  ])
    p.rect(x + dx, y + dy, 7, 3, "#937456");
  if (!reduced && state.roll === 2) {
    p.rect(x - 27, y + 16, 4, 3, "#a18a67");
    p.rect(x + 30, y + 12, 5, 3, "#a18a67");
  }
}
export function pigPenGeometry(area) {
  return {
    left: 590,
    right: 940,
    top: area.y + 354,
    bottom: area.y + 474,
    inner: { left: 600, right: 930, top: area.y + 374, bottom: area.y + 469 },
  };
}
export function henGeometry(area) {
  return {
    left: 48,
    right: 330,
    top: area.y + 330,
    bottom: area.y + 489,
    shelter: { left: 78, right: 262, top: area.y + 335, bottom: area.y + 425 },
  };
}
function pigPen(p, area, frontOnly = false) {
  const pen = pigPenGeometry(area);
  if (!frontOnly) {
    p.ellipse(765, area.y + 414, 350, 120, "#736047");
    p.ellipse(763, area.y + 418, 315, 95, "#857052");
    for (let i = 0; i < 25; i++)
      p.rect(610 + i * 12, area.y + 370 + ((i * 19) % 80), 12, 2, "#9c8764");
    for (let x = pen.left; x <= pen.right; x += 50) {
      p.rect(x, pen.top - 15, 6, 32, "#8f7650");
      if (x < pen.right) {
        p.rect(x + 6, pen.top - 7, 44, 5, "#b29a6b");
        p.rect(x + 6, pen.top + 7, 44, 4, "#967d53");
      }
    }
    for (const x of [pen.left, pen.right]) {
      p.rect(x + 1, pen.top + 13, 3, 105, "#a78d5d");
      p.rect(x - 2, pen.top + 53, 8, 31, "#9d8155");
    }
    p.ellipse(913, area.y + 391, 32, 14, "#777c67");
    p.ellipse(913, area.y + 389, 26, 9, "#567370");
  }
  for (let x = pen.left; x <= pen.right; x += 50) {
    p.rect(x, pen.bottom - 23, 6, 29, "#967c52");
    if (x < pen.right) {
      p.rect(x + 6, pen.bottom - 16, 44, 5, "#bea16f");
      p.rect(x + 6, pen.bottom - 3, 44, 4, "#9c8257");
    }
  }
}
function henShelter(p, area) {
  const y = area.y;
  p.ellipse(224, y + 402, 408, 172, "#8c774a");
  for (let i = 0; i < 30; i++)
    p.rect(
      55 + ((i * 37) % 255),
      y + 393 + ((i * 19) % 81),
      6,
      2,
      i % 2 ? "#b79c62" : "#cab27b",
    );
  p.rect(90, y + 355, 158, 69, "#7c5c3b");
  for (let x = 96; x < 248; x += 13) p.rect(x, y + 359, 9, 61, "#9f784c");
  p.path(
    [
      [78, y + 356],
      [98, y + 335],
      [239, y + 335],
      [262, y + 356],
    ],
    "#50694e",
  );
  p.rect(80, y + 354, 180, 5, "#b4985f");
  p.rect(180, y + 377, 39, 45, "#3b4030");
  p.rect(186, y + 382, 27, 40, "#576245");
  p.rect(106, y + 370, 31, 29, "#5a4c34");
  p.rect(111, y + 375, 21, 19, "#ceb979");
  p.rect(120, y + 375, 3, 19, "#8c764a");
  for (let i = 0; i < 4; i++) p.rect(177, y + 423 + i * 6, 45, 4, "#b89d67");
  p.lantern(241, y + 408);
  p.ellipse(74, y + 415, 27, 13, "#797963");
  p.ellipse(74, y + 412, 21, 7, "#547574");
}
function rooster(p, x, y, time, reduced) {
  // Perched on the hay cart, he crows every few seconds.
  const s = reduced ? 0 : time % 7;
  const crowing = s > 5.4 && s < 6.6;
  const lift = crowing ? 4 : 0;
  p.path(
    [
      [x - 8, y - 2],
      [x - 16, y - 18],
      [x - 10, y - 16],
      [x - 6, y - 22],
      [x - 2, y - 6],
    ],
    "#2d4a3c",
  );
  p.rect(x - 14, y - 16, 3, 6, "#9c3f36");
  p.ellipse(x, y, 18, 14, "#b0603a");
  p.ellipse(x - 2, y + 2, 12, 8, "#d4a057");
  p.rect(x + 4, y - 14 - lift, 8, 12, "#c9773f");
  p.rect(x + 5, y - 19 - lift, 6, 5, "#c43f36");
  p.rect(x + 12, y - 10 - lift, 3, crowing ? 2 : 3, "#e1b45a");
  if (crowing) p.rect(x + 12, y - 7 - lift, 3, 2, "#e1b45a");
  p.rect(x + 7, y - 6 - lift, 3, 4, "#c43f36");
  p.rect(x + 8, y - 11 - lift, 2, 2, "#1f1d1a");
  for (const dx of [-3, 3]) p.rect(x + dx, y + 6, 2, 4, "#e1b45a");
  if (crowing)
    for (let i = 0; i < 3; i++) {
      const t = (s - 5.4) / 1.2;
      p.ctx.globalAlpha = 1 - t;
      p.rect(x + 18 + i * 6 + t * 10, y - 18 - i * 4 - t * 8, 3, 2, "#efe6c8");
      p.rect(x + 20 + i * 6 + t * 10, y - 22 - i * 4 - t * 8, 2, 4, "#efe6c8");
      p.ctx.globalAlpha = 1;
    }
}

function barnLife(p, time, reduced) {
  // Weathervane rooster swings with the night wind.
  const turn = reduced ? 1 : Math.cos(time * 0.45);
  const w = Math.max(0.2, Math.abs(turn)),
    dir = turn < 0 ? -1 : 1;
  for (const [dx, dy, rw, rh] of [
    [-6, -160, 10, 5],
    [2, -164, 5, 5],
    [6, -162, 3, 2],
    [-9, -164, 4, 5],
  ])
    p.rect(dir * dx * w - (dir < 0 ? rw * w : 0), dy, Math.max(2, rw * w), rh, "#2c2b26");
  // The owl in the cupola blinks and turns its head.
  const blink = !reduced && Math.floor(time * 0.8) % 6 === 0;
  const look = reduced ? 0 : Math.round(Math.sin(time * 0.35) * 2);
  p.ellipse(0, -121, 13, 12, "#8a6a4a");
  p.rect(-5 + look, -126, 4, blink ? 1 : 4, "#f0c85c");
  p.rect(1 + look, -126, 4, blink ? 1 : 4, "#f0c85c");
  p.rect(-1 + look, -122, 2, 2, "#d79c4a");
  // A barn cat sits on the ridge and flicks its tail.
  const tail = reduced ? 0 : Math.round(Math.sin(time * 1.8)) * 3;
  p.rect(60, -125, 12, 12, "#57524a");
  p.rect(64, -133, 9, 8, "#57524a");
  p.rect(64, -136, 2, 3, "#57524a");
  p.rect(71, -136, 2, 3, "#57524a");
  p.rect(70, -130, 2, 2, "#d9c05a");
  p.rect(54, -117 + tail, 8, 3, "#57524a");
  p.rect(52, -122 + tail, 3, 6, "#57524a");
}

function farmActors(p, area, time = 0) {
  const g = farmGeometry(area);
  scaledAt(p, ...g.barn, () => {
    stallHorse(p, -58, 8, true, time);
    stallHorse(p, 56, 8, false, time);
    stallFront(p);
    barnLife(p, time, p.reduced);
  });
  rooster(p, 380, area.y + 270, time, p.reduced);
  const poses = [
    highlandCow,
    grazingCow,
    sleepingCow,
    calf,
    (p, x, y, t) => calf(p, x, y, t * 0.4),
    (p, x, y, t) => highlandCow(p, x, y, t, 3, 1),
  ];
  g.cows.forEach(([x, y], i) =>
    scaledAt(
      p,
      x + (i === 3 && time ? Math.round(Math.sin(time * 0.18)) * 6 : 0),
      y,
      g.animalScale,
      () => poses[i](p, 0, 0, time, 1),
    ),
  );
  for (let i = 0; i < 10; i++) chicken(p, area, time, p.reduced, i);
  for (let i = 0; i < 2; i++) pig(p, area, time, p.reduced, i);
  pigPen(p, area, true);
  farmFence(p, area, true);
}

function paddock(p, area, includeActors) {
  const g = farmGeometry(area);
  p.path(
    [
      [0, area.y + 25],
      [110, area.y + 4],
      [270, area.y + 24],
      [468, area.y + 6],
      [653, area.y + 20],
      [825, area.y + 2],
      [960, area.y + 24],
      [960, area.y + area.height - 13],
      [773, area.y + area.height - 3],
      [592, area.y + area.height - 19],
      [383, area.y + area.height - 4],
      [195, area.y + area.height - 17],
      [0, area.y + area.height - 4],
    ],
    "#3e4c32",
  );
  p.ellipse(
    480,
    area.y + area.height * 0.65,
    1050,
    area.height * 0.6,
    "#596044",
  );
  const rand = random(1784);
  for (let i = 0; i < 230; i++) {
    const x = rand() * WIDTH,
      y = area.y + 20 + rand() * (area.height - 40);
    p.rect(x, y, 4 + rand() * 8, 2, i % 3 ? "#67714a" : "#82734e");
  }
  // One pasture and one service yard give each family a shared place.
  p.ellipse(694, area.y + 204, 516, 283, "#536449");
  p.ellipse(560, area.y + 279, 150, 78, "#62714b");
  for (let i = 0; i < 18; i++)
    p.rect(
      507 + ((i * 23) % 107),
      area.y + 264 + ((i * 13) % 37),
      8,
      2,
      "#929563",
    );
  // Local worn footways end at the stable, coop and mudpen gates.
  const routes = [
    [
      [385, 493],
      [418, 493],
      [421, 429],
      [449, 358],
      [456, 292],
      [426, 247],
      [361, 229],
      [350, 241],
      [410, 266],
      [426, 299],
      [423, 352],
      [395, 424],
    ],
    [
      [390, 447],
      [405, 461],
      [322, 467],
      [239, 448],
      [191, 428],
      [198, 415],
      [247, 434],
      [324, 450],
    ],
    [
      [408, 438],
      [407, 453],
      [498, 452],
      [566, 427],
      [591, 412],
      [583, 400],
      [557, 414],
      [492, 436],
    ],
  ];
  for (const route of routes)
    p.path(
      route.map(([x, y]) => [x, area.y + y]),
      "#6b6246",
    );
  p.ellipse(685, area.y + 138, 76, 24, "#797a5e");
  p.ellipse(685, area.y + 133, 64, 15, "#547878");
  p.rect(650, area.y + 145, 5, 11, "#746345");
  p.rect(716, area.y + 145, 5, 11, "#746345");
  p.ellipse(888, area.y + 301, 95, 29, "#746344");
  p.rect(852, area.y + 284, 72, 16, "#b49b59");
  for (let x = 856; x < 924; x += 9)
    p.rect(x, area.y + 280 + (x % 3) * 2, 3, 17, "#d3b96f");
  farmFence(p, area, false);
  scaledAt(p, ...g.barn, () => {
    barn(p, 0, 0);
    stallFront(p);
    // Straw bales, a water bucket and a spare warm blanket by the stalls.
    p.rect(-111, 84, 66, 29, "#a58a4b");
    p.rect(-107, 87, 58, 4, "#d1b76a");
    for (const dx of [-99, -76, -56]) p.rect(dx, 87, 2, 23, "#d1b76a");
    p.rect(-107, 102, 58, 3, "#786438");
    p.ellipse(107, 91, 28, 21, "#737469");
    p.rect(95, 88, 24, 20, "#737469");
    p.ellipse(107, 88, 27, 12, "#a3a68d");
    p.ellipse(107, 89, 20, 7, "#42666a");
    p.rect(-30, 73, 35, 7, "#6f8c7b");
    p.rect(-26, 80, 5, 12, "#96ad92");
  });
  for (const x of [30, 926]) p.lantern(x, area.y + 370);
  for (const [x, y] of [
    [-10, 175],
    [-8, 300],
    [970, 172],
    [972, 300],
  ])
    p.tree({ x, y: area.y + y, s: 0.9, tone: 0.1 });
  for (let x = 100; x <= 370; x += 18) {
    const y = area.y + 14 + Math.sin(((x - 100) / 270) * Math.PI) * 9;
    p.rect(x, y, 18, 2, "#6c785a");
    if ((x - 100) % 54 === 0) {
      p.rect(x + 6, y + 3, 5, 8, "#bd9e57");
      p.rect(x + 7, y + 4, 3, 5, "#efda94");
    }
  }
  p.rect(345, area.y + 294, 65, 23, "#886641");
  p.rect(342, area.y + 314, 72, 5, "#c29d61");
  for (const x of [355, 399]) {
    p.ellipse(x, area.y + 323, 17, 17, "#3f4130");
    p.ellipse(x, area.y + 323, 9, 9, "#b99560");
  }
  p.rect(349, area.y + 279, 56, 17, "#c2a159");
  for (let x = 352; x < 405; x += 9)
    p.rect(x, area.y + 276 + (x % 3) * 3, 3, 17, "#e0bf71");
  p.ellipse(124, area.y + 317, 90, 25, "#7c7656");
  p.ellipse(124, area.y + 312, 78, 15, "#527776");
  henShelter(p, area);
  pigPen(p, area);
  if (includeActors) farmActors(p, area);
  farmFence(p, area, true);
}

export function farmYard(stable) {
  return {
    ...stable,
    y: stable.y + HOMESTEAD_BAND,
    height: stable.height - HOMESTEAD_BAND,
  };
}

function farm(p, stable, includeActors) {
  paintHomestead(p, stable);
  paddock(p, farmYard(stable), includeActors);
  if (includeActors) animateHomestead(p, stable, 0);
}

function riverY(area, x) {
  return (
    area.y +
    area.height * 0.52 +
    Math.sin(x * 0.011) * Math.min(13, area.height * 0.12)
  );
}

function river(p, area) {
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
  p.path([...upper, ...lower.reverse()], "#51604a");
  p.path([...innerUpper, ...innerLower.reverse()], "#284a50");
  for (let x = 0; x < WIDTH; x += 38) {
    const y = riverY(area, x);
    p.rect(x, y - half + 3, 22, 2, "#59796e");
    p.rect(x + 14, y + half - 4, 21, 2, "#45665d");
    if (x % 3 === 0) {
      p.ellipse(x + 10, y + half + 4, 27, 13, "#71786a");
      p.rect(x + 3, y + half + 1, 13, 2, "#a1a38a");
    }
  }
  for (const [x, offset] of [
    [169, -8],
    [226, 9],
    [479, -4],
    [539, 10],
    [766, -12],
    [824, 7],
  ]) {
    const y = riverY(area, x) + offset;
    p.ellipse(x, y + 3, 43, 23, "#1d373b");
    p.ellipse(x, y, 35, 19, "#747e70");
    p.rect(x - 10, y - 5, 17, 3, "#a9ad92");
    p.rect(x - 14, y + 4, 19, 3, "#516655");
  }
  for (const x of [64, 336, 651, 906]) {
    const y = riverY(area, x) + half + 13;
    for (let i = 0; i < 4; i++) {
      p.rect(x + i * 5, y - 13 - (i % 2) * 5, 2, 18, "#84946a");
      p.rect(x + i * 5 - 1, y - 16 - (i % 2) * 5, 4, 7, "#a18a57");
    }
    p.ellipse(x - 8, y + 1, 19, 9, "#4c6650");
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

function animateDrift(p, area, time, reduced) {
  const state = driftState(time, reduced);
  if (!reduced)
    for (let i = 1; i < 12; i++) {
      const past = driftState(time - i * 0.065, false);
      p.ctx.globalAlpha = Math.max(0.08, 0.36 - i * 0.023);
      p.ellipse(
        past.x + Math.sin(i * 2) * 8,
        area.y + past.y + 10,
        10 + i * 2,
        6 + i,
        "#a18a60",
      );
    }
  p.ctx.globalAlpha = 1;
  pickup(p, state, area);
}

function drift(p, area, includeActors) {
  for (const [x, y, tone] of [
    [110, 100, 0.16],
    [850, 105, 0.22],
    [855, 310, 0.15],
    [125, 318, 0.2],
  ])
    p.tree({ x, y: area.y + y, s: 0.95, tone });
  for (const [x, y] of [
    [145, 208],
    [811, 226],
    [225, 82],
    [730, 313],
  ]) {
    p.ellipse(x, area.y + y, 35, 19, "#5c6954");
    p.rect(x - 10, area.y + y - 5, 18, 3, "#a1a48b");
    paintFern(p, x + 14, area.y + y + 7, 0.8);
  }

  p.ellipse(480, area.y + 205, 575, 266, "#3e4a32");
  p.ellipse(480, area.y + 205, 537, 237, "#786546");
  p.ellipse(480, area.y + 205, 498, 211, "#8a7553");
  for (const radius of [150, 160, 172]) {
    const outer = [],
      inner = [];
    for (let i = 0; i <= 48; i++) {
      const angle = (i / 48) * Math.PI * 2;
      outer.push([
        480 + Math.cos(angle) * (radius + 2),
        area.y + 205 + Math.sin(angle) * (62 + (radius - 160) * 0.28 + 1),
      ]);
      inner.push([
        480 + Math.cos(angle) * (radius - 2),
        area.y + 205 + Math.sin(angle) * (62 + (radius - 160) * 0.28 - 1),
      ]);
    }
    p.path([...outer, ...inner.reverse()], "#5b513c");
  }
  for (const [x, y] of [
    [205, 205],
    [751, 225],
    [718, 125],
  ]) {
    p.ellipse(x, area.y + y + 8, 66, 23, "#4b4938");
    for (let i = 0; i < 7; i++) {
      const dx = ((i * 19) % 51) - 25,
        dy = (i * 11) % 20;
      p.ellipse(x + dx, area.y + y - dy, 18 + (i % 3) * 4, 12, "#78806a");
      p.rect(x + dx - 5, area.y + y - dy - 3, 9, 2, "#a1a38a");
    }
  }
  for (let i = 0; i < 45; i++)
    p.rect(
      273 + ((i * 83) % 414),
      area.y + 110 + ((i * 37) % 192),
      3,
      2,
      "#9f8a63",
    );
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
      paint: farm,
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
    if (scene.paint === farm) farm(p, layout.stable, includeActors);
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
        // Two stepped pools of candlelight.
        p.ctx.globalAlpha = 0.06;
        p.rect(cx - 16, top - 12, 32, 22, "#f2c36a");
        p.ctx.globalAlpha = 0.1;
        p.rect(cx - 8, top - 8, 16, 14, "#f2c36a");
        p.ctx.globalAlpha = 1;
        p.rect(cx - 2, top - 6 - f, 4, 7 + f, "#e98a3a");
        p.rect(cx - 1, top - 4 - f, 2, 4 + f, "#ffe19a");
      });
    } else if (scene.paint === farm) {
      farmActors(p, farmYard(layout.stable), time);
      animateHomestead(p, layout.stable, time);
    } else if (scene.paint === drift) {
      animateDrift(p, layout.drift, time, p.reduced);
    } else if (scene.paint === river) {
      const area = layout.divider;
      for (let i = 0; i < 30; i++) {
        const rx = ((p.reduced ? 0 : time * 13) + i * 41) % WIDTH;
        const ry =
          riverY(area, rx) +
          Math.sin(i * 2.7) * Math.min(29, area.height * 0.2);
        const onRock = [
          [169, -8],
          [226, 9],
          [479, -4],
          [539, 10],
          [766, -12],
          [824, 7],
        ].some(
          ([rockX, offset]) =>
            Math.abs(rx - rockX) < 26 &&
            Math.abs(ry - riverY(area, rockX) - offset) < 15,
        );
        if (!onRock)
          p.rect(rx, ry, 10 + (i % 4) * 4, 2, i % 3 ? "#527c7c" : "#79a29b");
      }
      for (let i = 0; i < 6; i++) {
        const fx = 83 + i * 151 + Math.sin(time * 0.6 + i) * 9;
        const fy =
          riverY(area, fx) -
          Math.min(49, area.height * 0.3) -
          6 +
          Math.cos(time * 0.5 + i) * 5;
        p.ctx.globalAlpha = p.reduced
          ? 0.55
          : 0.4 + (Math.sin(time + i) + 1) * 0.2;
        p.rect(fx, fy, 2, 2, "#d4d895");
      }
    }
    p.ctx.restore();
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

import { paintGround, paintFern } from "./ground.js";
export { paintGround, paintFern } from "./ground.js";
import { paintJourney, animateJourney } from "./journey.js";
import {
  EXIT_Y,
  INTERIOR_SPAWN,
  drawInteriorScene,
  interiorNear,
  interiorWalkable,
  paintInterior,
} from "./interiors.js";
export const WIDTH = 960,
  HEIGHT = 540;
export const destinations = [
  {
    id: "projects",
    x: 245,
    y: 179,
    w: 137,
    h: 103,
    doorX: 312,
    doorY: 289,
    label: "THE WORKSHOP",
    sub: "PROJECTS",
    color: "#bdac78",
  },
  {
    id: "career",
    x: 627,
    y: 146,
    w: 116,
    h: 139,
    doorX: 687,
    doorY: 291,
    label: "THE OBSERVATORY",
    sub: "CAREER",
    color: "#a9bec3",
  },
  {
    id: "gamedev",
    x: 188,
    y: 339,
    w: 122,
    h: 89,
    doorX: 251,
    doorY: 435,
    label: "THE ARCADE",
    sub: "GAME DEV",
    color: "#b99ba7",
  },
  {
    id: "about",
    x: 648,
    y: 350,
    w: 133,
    h: 84,
    doorX: 714,
    doorY: 440,
    label: "THE CABIN",
    sub: "ABOUT ME",
    color: "#c5a977",
  },
];
// Rooftop billboards: one wooden board per cabin, lettered in a 5×7 pixel
// face. Geometry is shared with the DOM labels so both stay aligned.
const SIGN_TEXT = {
  projects: "PROJECTS",
  career: "CAREER",
  gamedev: "GAME DEV",
  about: "ABOUT",
};
const GLYPHS = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
};
const signTextWidth = (text) =>
  [...text].reduce((w, ch) => w + (ch === " " ? 3 : 6), -1);
// The surface the posts stand on: the shingle ridge, or Career's flat tower.
function roofLine(d, dx) {
  if (d.id === "career") return d.y - 49;
  return d.y - 14 + (Math.abs(dx) * 48) / (d.w / 2 + 14);
}
export function cabinSign(d) {
  const text = SIGN_TEXT[d.id],
    w = (signTextWidth(text) + 10) * 2,
    h = 30;
  const center = d.x + d.w / 2,
    bottom = roofLine(d, 0) - (d.id === "career" ? 8 : 10);
  const x = Math.round((center - w / 2) / 2) * 2,
    y = Math.round((bottom - h) / 2) * 2;
  const post = d.id === "career" ? 22 : w / 2 - 14;
  return { x, y, w, h, text, posts: [center - post, center + post] };
}
export function canWalk(x, y) {
  if (x < 158 || x > 818 || y < 274 || y > 478) return false;
  if (x > 430 && x < 521 && y < 280) return false;
  // The fountain is solid; the four paths remain open around its basin.
  if (Math.hypot((x - 482) / 1.15, y - 324) < 25) return false;
  return !destinations.some(
    (d) =>
      x > d.x - 9 && x < d.x + d.w + 9 && y > d.y + 18 && y < d.y + d.h + 3,
  );
}
export function nearbyArea(x, y) {
  return (
    destinations.find((d) => Math.hypot(x - d.doorX, y - d.doorY) < 48)?.id ||
    null
  );
}
export const WALK_SPEED = 184;
// Iris wipe between the village and a cabin: close, hold black, reopen.
export const IRIS = { close: 0.34, hold: 0.1, open: 0.36 };
export function movePlayer(player, dx, dy, dt, walkable = canWalk) {
  const length = Math.hypot(dx, dy);
  if (!length) return false;
  const amount = WALK_SPEED * Math.min(dt, 0.04);
  const previousX = player.x,
    previousY = player.y;
  // Small collision steps preserve passage through tight bends at lower frame rates.
  const steps = Math.max(1, Math.ceil(amount / 2));
  for (let step = 0; step < steps; step++) {
    const x = player.x + ((dx / length) * amount) / steps,
      y = player.y + ((dy / length) * amount) / steps;
    if (walkable(x, player.y)) player.x = x;
    if (walkable(player.x, y)) player.y = y;
  }
  player.facing = dx < 0 ? "left" : dx > 0 ? "right" : dy < 0 ? "up" : "down";
  return player.x !== previousX || player.y !== previousY;
}
export function walkFrame(time, moving, reduced) {
  return moving && !reduced ? Math.floor(time * 10) % 4 : 0;
}
const FOX_ROUTES = [
  [
    [334, 375],
    [393, 355],
    [427, 398],
    [355, 433],
    [332, 409],
  ],
  [
    [566, 380],
    [621, 334],
    [629, 393],
    [604, 424],
    [553, 410],
  ],
];
export function foxState(time, index, reduced = false, lead = 0) {
  const route = FOX_ROUTES[index];
  const lengths = route.map((point, i) =>
    Math.hypot(
      point[0] - route[(i + 1) % route.length][0],
      point[1] - route[(i + 1) % route.length][1],
    ),
  );
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let distance =
    ((reduced ? 0 : time) * (index ? 32 : 38) + index * 79 + lead) % total;
  let segment = 0;
  while (distance > lengths[segment]) distance -= lengths[segment++];
  const start = route[segment],
    end = route[(segment + 1) % route.length],
    t = distance / lengths[segment];
  return {
    x: start[0] + (end[0] - start[0]) * t,
    y: start[1] + (end[1] - start[1]) * t,
    facing: end[0] >= start[0] ? 1 : -1,
    frame: reduced ? 0 : Math.floor(time * 10 + index) % 4,
  };
}
// A rabbit stays ahead of each fox on the same loop, including at corners.
export function rabbitState(time, index, reduced = false) {
  return foxState(time, index, reduced, 58);
}
function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
export function riverCenter(x) {
  return 165 + Math.sin(x * 0.011) * 9 + Math.sin(x * 0.026) * 4;
}
export function riverBounds(x) {
  const center = riverCenter(x),
    halfWidth = 15 + Math.sin(x * 0.019) * 3;
  return { top: center - halfWidth, bottom: center + halfWidth };
}
export function treeFootprint(tree) {
  // Includes canopy sway, raster rounding, trunk and the ground shadow.
  const x = Math.round(tree.x / 2) * 2,
    y = Math.round(tree.y / 2) * 2;
  const halfWidth = 42 * tree.s + 8;
  return {
    left: x - halfWidth,
    right: x + halfWidth,
    top: y - Math.max(80 * tree.s + 6, 68 * tree.s + 22),
    bottom: y + 10,
  };
}
export function treeClearsRiver(tree) {
  const box = treeFootprint(tree);
  for (let x = box.left; x <= box.right; x += 2) {
    const river = riverBounds(x);
    if (box.bottom >= river.top - 3 && box.top <= river.bottom + 3)
      return false;
  }
  return true;
}
export function cabinPaths() {
  const curves = [
    [
      [312, 287],
      [346, 314],
      [399, 293],
      [446, 324],
    ],
    [
      [687, 289],
      [648, 321],
      [572, 291],
      [518, 324],
    ],
    [
      [251, 435],
      [296, 444],
      [389, 373],
      [461, 351],
    ],
    [
      [714, 440],
      [659, 438],
      [572, 379],
      [503, 351],
    ],
  ];
  return curves.map((points) =>
    Array.from({ length: 33 }, (_, i) => {
      const t = i / 32,
        u = 1 - t;
      return [
        u * u * u * points[0][0] +
          3 * u * u * t * points[1][0] +
          3 * u * t * t * points[2][0] +
          t * t * t * points[3][0],
        u * u * u * points[0][1] +
          3 * u * u * t * points[1][1] +
          3 * u * t * t * points[2][1] +
          t * t * t * points[3][1],
      ];
    }),
  );
}
export function treeClearsCabinPaths(tree) {
  const box = treeFootprint(tree),
    margin = 15;
  return cabinPaths().every((path) =>
    path.every(
      ([x, y]) =>
        x < box.left - margin ||
        x > box.right + margin ||
        y < box.top - margin ||
        y > box.bottom + margin,
    ),
  );
}
export function villageTrees() {
  const rand = seeded(827),
    trees = [];
  const place = (tree) => {
    if (!treeClearsRiver(tree) || !treeClearsCabinPaths(tree)) return;
    const b = treeFootprint(tree);
    if (b.left < 526 && b.right > 438 && b.top < 350 && b.bottom > 253) return;
    // Southern/side crowns never obscure cabin panels or their nameplates.
    if (
      tree.y > 250 &&
      destinations.some(
        (d) =>
          b.left < d.x + d.w + 16 &&
          b.right > d.x - 16 &&
          b.top < d.y + d.h + 38 &&
          b.bottom > d.y - 34,
      )
    )
      return;
    trees.push(tree);
  };
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 24; col++) {
      const x = col * 45 + (rand() - 0.5) * 22,
        y = 85 + row * 71 + (rand() - 0.5) * 27;
      const tree = { x, y, s: 0.65 + rand() * 0.5, tone: rand() };
      if (y > 160 && (x < 150 || x > 818)) place(tree);
    }
  // Uneven staggered rows stay on the northern bank and mask mountain feet.
  for (let row = 0; row < 2; row++)
    for (let x = -28; x < WIDTH + 45; x += 34) {
      const tree = {
        x: x + row * 17 + (rand() - 0.5) * 8,
        y: 91 + row * 23 + (rand() - 0.5) * 10,
        s: 0.78 + rand() * 0.22,
        tone: rand(),
      };
      // Limit the trunk bottom against the lowest river edge across its crown.
      const box = treeFootprint(tree);
      let northLimit = Infinity;
      for (let sx = box.left; sx <= box.right; sx += 2)
        northLimit = Math.min(northLimit, riverBounds(sx).top - 15);
      tree.y = Math.min(tree.y, northLimit);
      place(tree);
    }
  for (const tree of [
    { x: 82, y: 534, s: 1.02, tone: 0.65 },
    { x: 158, y: 552, s: 1.15, tone: 0.22 },
    { x: 231, y: 552, s: 0.96, tone: 0.71 },
    { x: 304, y: 542, s: 0.93, tone: 0.34 },
    { x: 372, y: 556, s: 1.05, tone: 0.18 },
    { x: 604, y: 556, s: 1, tone: 0.62 },
    { x: 676, y: 554, s: 1.08, tone: 0.3 },
    { x: 749, y: 556, s: 0.98, tone: 0.76 },
    { x: 832, y: 550, s: 1.15, tone: 0.21 },
    { x: 918, y: 538, s: 1.02, tone: 0.58 },
  ])
    place(tree);
  for (const [x, y, size] of [
    [586, 244, 0.35],
    [460, 227, 0.26],
    [530, 227, 0.26],
    [436, 242, 0.32],
    [405, 486, 0.32],
    [580, 485, 0.35],
    [608, 492, 0.34],
    [179, 280, 0.36],
    [820, 285, 0.36],
    [137, 322, 0.4],
    [841, 335, 0.4],
  ])
    place({ x, y, s: size, tone: rand() });
  // Small groves at the edge and saplings in generous gaps feel less regimented.
  for (const [x, y, size] of [
    [154, 290, 0.6],
    [170, 284, 0.5],
    [801, 288, 0.48],
    [844, 315, 0.65],
    [560, 250, 0.45],
    [552, 266, 0.48],
    [439, 237, 0.4],
    [380, 500, 0.56],
    [418, 506, 0.65],
    [551, 503, 0.52],
    [593, 514, 0.55],
  ])
    place({ x, y, s: size, tone: rand() });
  for (let row = 0; row < 4; row++)
    for (const side of [0, 1])
      for (let col = 0; col < 3; col++) {
        const x = side
          ? 868 + col * 41 + (rand() - 0.5) * 18
          : col * 42 + (rand() - 0.5) * 18;
        const y = 278 + row * 63 + (rand() - 0.5) * 22;
        place({ x, y, s: 0.6 + rand() * 0.42, tone: rand() });
      }
  return trees;
}
export class World {
  constructor(canvas, onNear) {
    this.canvas = canvas;
    this.surfaceLayer = canvas.parentElement;
    this.surfaces = [];
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.scale(0.5, 0.5);
    this.player = { x: 482, y: 355, facing: "down" };
    this.keys = new Set();
    this.onNear = onNear;
    this.near = null;
    this.active = true;
    this.visible = true;
    this.layout = {
      height: HEIGHT,
      skyHeight: 0,
      moonY: 55,
      sections: [],
      mobile: false,
    };
    this.gameVisible = true;
    this.viewport = { top: 0, bottom: HEIGHT };
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.time = 0;
    this.last = 0;
    this.walking = false;
    this.walkTime = 0;
    // Opening cutscene hooks: a script drives the player, the About door and
    // a greeting wave instead of the keyboard.
    this.cutscene = null;
    this.doorOpen = 0;
    this.emerging = false;
    this.waving = false;
    this.talking = false;
    // The cabin the player is standing in, or null for the village.
    this.interior = null;
    this.nearKind = null;
    this.iris = null;
    this.interiorCache = new Map();
    this.onScene = null;
    this.onTransition = null;
    // Set while the title screen covers the page and nothing needs drawing.
    this.suspended = false;
    const rand = seeded(827);
    this.grass = Array.from({ length: 1400 }, () => ({
      x: rand() * 960,
      y: 110 + rand() * 430,
      v: rand(),
    }));
    this.trees = villageTrees();
    this.clouds = [
      { x: 100, y: 16, w: 170, h: 24, speed: 2.0 },
      { x: 410, y: 30, w: 200, h: 26, speed: 1.2 },
      { x: 715, y: 18, w: 140, h: 22, speed: 1.7 },
      { x: 872, y: 72, w: 170, h: 24, speed: 1.0 },
    ];
    this.flies = Array.from({ length: 15 }, () => ({
      x: 145 + rand() * 680,
      y: 240 + rand() * 255,
      phase: rand() * 7,
    }));
    this.scene = document.createElement("canvas");
    this.scene.width = WIDTH / 2;
    this.scene.height = HEIGHT / 2;
    const main = this.ctx;
    this.ctx = this.scene.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.scale(0.5, 0.5);
    this.drawTerrain();
    this.ctx = main;
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }
  setLayout(layout, includeActors = false) {
    this.layout = layout;
    this.trees = villageTrees().filter(
      (tree) =>
        !layout.divider ||
        treeFootprint(tree).bottom + layout.skyHeight < layout.divider.y - 8,
    );
    this.scene.width = WIDTH / 2;
    this.scene.height = Math.ceil(layout.height / 2);
    const main = this.ctx,
      reduced = this.reduced,
      time = this.time;
    this.ctx = this.scene.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.scale(0.5, 0.5);
    this.reduced = true;
    this.time = 0;
    try {
      this.rect(0, 0, WIDTH, layout.height, "#22332e");
      this.drawSky();
      this.ctx.save();
      this.ctx.translate(0, layout.skyHeight);
      this.drawTerrain();
      this.ctx.restore();
      paintJourney(this, layout, includeActors);
    } finally {
      this.ctx = main;
      this.reduced = reduced;
      this.time = time;
    }

    if (!this.interior && !canWalk(this.player.x, this.player.y))
      this.player = { x: 482, y: 355, facing: "down" };
    this.buildSurfaces();
  }
  buildSurfaces() {
    if (!this.surfaceLayer) return;
    for (const surface of this.surfaces)
      if (surface.canvas !== this.canvas) surface.canvas.remove();
    this.surfaces = [];
    const firstHeight =
      Math.ceil(Math.max(1024, this.layout.skyHeight + 540) / 2) * 2;
    for (let top = 0; top < this.layout.height;) {
      const height = Math.min(
        top === 0 ? firstHeight : 1024,
        this.layout.height - top,
      );
      const canvas = top === 0 ? this.canvas : document.createElement("canvas");
      canvas.width = WIDTH / 2;
      canvas.height = Math.ceil(height / 2);
      canvas.dataset.worldSurface = "";
      if (top !== 0) canvas.setAttribute("aria-hidden", "true");
      canvas.style.top = `${Math.round(top * this.layout.scale)}px`;
      canvas.style.height = `${Math.round((top + height) * this.layout.scale) - Math.round(top * this.layout.scale)}px`;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.scale(0.5, 0.5);
      this.surfaces.push({ canvas, ctx, top, height });
      if (top !== 0) this.surfaceLayer.append(canvas);
      top += height;
    }
    const viewport = this.viewport;
    try {
      for (const surface of this.surfaces) {
        this.viewport = {
          top: surface.top,
          bottom: surface.top + surface.height,
        };
        this.drawSurface(surface);
      }
    } finally {
      this.viewport = viewport;
      this.ctx = this.surfaces[0].ctx;
    }
  }
  setViewport(viewport) {
    this.viewport = viewport;
  }
  isWalkable(x, y) {
    if (this.interior) return interiorWalkable(this.interior, x, y);
    return canWalk(x, y) && !this.signBlocks(x, y);
  }
  // The reading sign below the fountain is a DOM board standing in the
  // village: its posts and the ground in front of it are solid, so the
  // player can only pass behind it, where it turns translucent.
  setReadingSign(rect) {
    this.readingSign = rect;
    if (!this.interior && !this.isWalkable(this.player.x, this.player.y))
      this.player = { x: 482, y: 355, facing: "down" };
    this.updateSignShade();
  }
  signBlocks(x, y) {
    const s = this.readingSign;
    return Boolean(
      s && x > s.x - 8 && x < s.x + s.w + 8 && y > s.y + s.h - 16 && y < s.y + s.h + 60,
    );
  }
  updateSignShade() {
    const s = this.readingSign,
      { x, y } = this.player,
      behind = Boolean(
        s &&
          !this.interior &&
          x + 14 > s.x &&
          x - 16 < s.x + s.w &&
          y + 6 > s.y &&
          y - 44 < s.y + s.h,
      );
    if (behind === this.behindSign) return;
    this.behindSign = behind;
    this.onSignShade?.(behind);
  }
  enterCabin(id) {
    if (this.interior || this.iris || !destinations.some((d) => d.id === id))
      return;
    this.transition(() => {
      this.interior = id;
      this.player = { ...INTERIOR_SPAWN, facing: "up" };
    });
  }
  leaveCabin() {
    const d = destinations.find((d) => d.id === this.interior);
    if (!d || this.iris) return;
    this.transition(() => {
      this.interior = null;
      this.player = { x: d.doorX, y: d.doorY + 4, facing: "down" };
    });
  }
  transition(swap) {
    this.walking = false;
    this.setNear(null, null);
    if (this.reduced) {
      swap();
      this.onScene?.(this.interior);
      this.updateNear();
      this.draw();
      return;
    }
    this.iris = { t: 0, swap, swapped: false };
    this.onTransition?.(true);
  }
  stepIris(dt) {
    const iris = this.iris;
    iris.t += dt;
    if (!iris.swapped && iris.t >= IRIS.close + IRIS.hold / 2) {
      iris.swapped = true;
      iris.swap();
      this.onScene?.(this.interior);
    }
    if (iris.t >= IRIS.close + IRIS.hold + IRIS.open) {
      this.iris = null;
      this.onTransition?.(false);
      this.updateNear();
    }
  }
  setNear(near, kind) {
    if (near === this.near && kind === this.nearKind) return;
    this.near = near;
    this.nearKind = kind;
    this.onNear(near, kind);
  }
  updateNear() {
    const { x, y } = this.player;
    if (!this.interior) {
      const id = nearbyArea(x, y);
      return this.setNear(id, id && "cabin");
    }
    const spot = interiorNear(x, y);
    this.setNear(
      spot === "lectern" ? this.interior : spot === "exit" ? "exit" : null,
      spot,
    );
  }
  moonPosition() {
    return { x: 480, y: (this.layout.moonArea?.y || 0) + 125, diameter: 118 };
  }
  drawSky() {
    this.rect(0, 0, WIDTH, (this.layout.skyHeight || 0) + 190, "#17242b");
    const { x, y, diameter: d } = this.moonPosition();
    this.ellipse(x, y, d + 22, d + 22, "#253c40");
    this.ellipse(x, y, d + 10, d + 10, "#486360");
    this.ellipse(x, y, d, d, "#c6d3b5");
    this.ellipse(x - 2, y - 2, d - 6, d - 6, "#e5e4c7");
    this.ellipse(x - d * 0.23, y - d * 0.2, d * 0.19, d * 0.14, "#c6ceb4");
    this.ellipse(x + d * 0.22, y + d * 0.09, d * 0.23, d * 0.18, "#c9d0b9");
    this.ellipse(x - d * 0.03, y + d * 0.3, d * 0.13, d * 0.09, "#cbd2b8");
    const rand = seeded(714);
    for (let i = 0; i < 45; i++) {
      const sx = rand() * WIDTH,
        sy = rand() * this.layout.skyHeight;
      if (Math.hypot(sx - x, sy - y) > d * 0.7)
        this.rect(sx, sy, 2, 2, "#7d9693");
    }
    // All snowy silhouettes sit in front of the moon, below the clear identity sky.
    // Muted pigment gives depth while every silhouette stays on the pixel grid.
    const distantBase = this.layout.skyHeight + 122;
    this.ctx.save();
    try {
      this.ctx.globalAlpha = 0.78;
      for (const [center, height, span] of [
        [-70, 206, 360],
        [176, 226, 370],
        [430, 204, 350],
        [706, 236, 380],
        [966, 210, 370],
      ]) {
        const top = Math.max(distantBase - height, y + d * 0.3, 130);
        const peakHeight = distantBase - top;
        this.path(
          [
            [center - span * 0.5, distantBase],
            [center - span * 0.31, top + peakHeight * 0.55],
            [center - span * 0.08, top + peakHeight * 0.19],
            [center, top],
            [center + span * 0.24, top + peakHeight * 0.46],
            [center + span * 0.5, distantBase],
          ],
          "#2b4048",
        );
        this.path(
          [
            [center, top],
            [center + span * 0.24, top + peakHeight * 0.46],
            [center + span * 0.5, distantBase],
            [center + span * 0.07, distantBase],
          ],
          "#253741",
        );
        this.path(
          [
            [center - span * 0.13, top + peakHeight * 0.27],
            [center, top],
            [center + span * 0.15, top + peakHeight * 0.3],
            [center + span * 0.04, top + peakHeight * 0.25],
            [center - span * 0.02, top + peakHeight * 0.32],
            [center - span * 0.06, top + peakHeight * 0.2],
          ],
          "#557079",
        );
        this.path(
          [
            [center, top],
            [center + span * 0.15, top + peakHeight * 0.3],
            [center + span * 0.04, top + peakHeight * 0.25],
          ],
          "#405963",
        );
      }
      this.ctx.globalAlpha = 0.42;
      this.path(
        [
          [-20, distantBase - 30],
          [88, distantBase - 85],
          [186, distantBase - 49],
          [290, distantBase - 94],
          [394, distantBase - 46],
          [554, distantBase - 86],
          [690, distantBase - 35],
          [794, distantBase - 80],
          [940, distantBase - 37],
          [980, distantBase - 72],
          [980, distantBase],
          [-20, distantBase],
        ],
        "#30494d",
      );
    } finally {
      this.ctx.restore();
    }
    // A central crest covers the moon’s lower quarter; side ridges stay below it.
    const base = this.layout.skyHeight + 176;
    const moonFloor = y + d * 0.3;
    for (const [mx, height, w] of [
      [-30, 200, 310],
      [178, 240, 350],
      [480, 205, 320],
      [653, 252, 370],
      [902, 214, 350],
      [1100, 240, 330],
    ]) {
      const peak =
        mx === 480 ? base - (y + d * 0.25) : Math.min(height, base - moonFloor);
      this.path(
        [
          [mx - w / 2, base],
          [mx - w * 0.3, base - peak * 0.47],
          [mx, base - peak],
          [mx + w * 0.22, base - peak * 0.59],
          [mx + w / 2, base],
        ],
        "#344b50",
      );
      this.path(
        [
          [mx, base - peak],
          [mx + w * 0.22, base - peak * 0.59],
          [mx + w / 2, base],
          [mx + 10, base - 32],
        ],
        "#293f46",
      );
      this.path(
        [
          [mx - w * 0.2, base - peak * 0.67],
          [mx, base - peak],
          [mx + w * 0.19, base - peak * 0.66],
          [mx + w * 0.08, base - peak * 0.73],
          [mx + 2, base - peak * 0.63],
          [mx - w * 0.07, base - peak * 0.77],
        ],
        "#b3c7c4",
      );
      this.path(
        [
          [mx, base - peak],
          [mx + w * 0.19, base - peak * 0.66],
          [mx + w * 0.08, base - peak * 0.73],
        ],
        "#769fa4",
      );
      this.path(
        [
          [mx - w * 0.3, base - peak * 0.4],
          [mx - w * 0.11, base - peak * 0.57],
          [mx - w * 0.07, base - peak * 0.4],
          [mx + 12, base],
        ],
        "#3b5559",
      );
    }
  }
  // Art uses a 480-pixel-wide framebuffer and a two-unit pixel grid.
  rect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      Math.round(x / 2) * 2,
      Math.round(y / 2) * 2,
      Math.max(2, Math.round(w / 2) * 2),
      Math.max(2, Math.round(h / 2) * 2),
    );
  }
  path(points, color) {
    // Scanline rasterization keeps diagonals stepped instead of antialiased.
    const low = Math.floor(Math.min(...points.map((p) => p[1])) / 2) * 2;
    const high = Math.max(...points.map((p) => p[1]));
    for (let y = low; y < high; y += 2) {
      const intersections = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[i],
          b = points[(i + 1) % points.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y))
          intersections.push(
            a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]),
          );
      }
      intersections.sort((a, b) => a - b);
      for (let i = 0; i + 1 < intersections.length; i += 2)
        this.rect(
          intersections[i],
          y,
          intersections[i + 1] - intersections[i],
          2,
          color,
        );
    }
  }
  drawTerrain() {
    this.rect(0, 170, 960, 370, "#22332e");
    this.path(
      [
        [0, 124],
        [64, 86],
        [118, 104],
        [196, 113],
        [292, 112],
        [380, 119],
        [457, 115],
        [545, 109],
        [661, 115],
        [745, 117],
        [863, 113],
        [937, 119],
        [960, 110],
        [960, 165],
        [0, 165],
      ],
      "#253b3b",
    );
    this.path(
      [
        [0, 151],
        [78, 112],
        [180, 150],
        [271, 99],
        [386, 145],
        [508, 108],
        [630, 152],
        [735, 109],
        [851, 154],
        [960, 115],
        [960, 191],
        [0, 191],
      ],
      "#2b4240",
    );
    const r = seeded(832);
    paintGround(this, { x: 0, y: 170, width: WIDTH, height: 370 }, 9031);
    this.grass.forEach((g) => {
      if (g.y < 137) return;
      this.rect(g.x, g.y, 2 + g.v * 3, 2, g.v > 0.55 ? "#304438" : "#1c2c29");
      if (g.v > 0.78) {
        this.rect(g.x, g.y - 4, 2, 4, "#40503a");
        this.rect(g.x + 4, g.y - 2, 2, 4, "#354b37");
      }
    });
    for (const [x, y, size] of [
      [93, 245, 0.9],
      [133, 328, 1],
      [61, 430, 1.2],
      [872, 279, 0.85],
      [897, 372, 1.1],
      [848, 484, 1],
      [149, 496, 0.8],
      [558, 208, 0.8],
      [774, 213, 0.8],
      [298, 206, 0.7],
    ])
      paintFern(this, x, y, size);
    // Mossy creek banks, with a clear walkable bridge further downstream.
    const creek = [
      [439, 121],
      [480, 121],
      [504, 170],
      [466, 210],
      [496, 259],
      [521, 298],
      [492, 329],
      [465, 315],
      [478, 263],
      [444, 225],
      [453, 182],
    ];
    this.path(creek, "#3e5147");
    this.path(
      [
        [450, 120],
        [475, 121],
        [490, 170],
        [452, 209],
        [484, 260],
        [507, 298],
        [487, 315],
        [477, 305],
        [490, 266],
        [436, 222],
        [467, 170],
      ],
      "#314e54",
    );
    for (let y = 142; y < 279; y += 18) {
      this.rect(450 + Math.sin(y) * 9, y, 18, 2, "#456864");
      this.rect(479 + Math.cos(y) * 5, y + 8, 9, 2, "#233e47");
    }
    // Four separate spokes connect the fountain courtyard to the cabin doors.
    const paths = cabinPaths();
    for (const route of paths) {
      for (let i = 0; i < route.length - 1; i++) {
        const [ax, ay] = route[i],
          [bx, by] = route[i + 1];
        const angle = Math.atan2(by - ay, bx - ax);
        const nx = Math.sin(angle) * 12,
          ny = Math.cos(angle) * 12;
        this.path(
          [
            [ax - nx, ay + ny],
            [bx - nx, by + ny],
            [bx + nx, by - ny],
            [ax + nx, ay - ny],
          ],
          "#534e3c",
        );
        for (let t = 0; t < 1; t += 0.5) {
          const x = ax + (bx - ax) * t,
            y = ay + (by - ay) * t;
          this.ellipse(x, y, 27, 20, "#847352");
          this.rect(x - 5 + r() * 8, y - 4, 6, 2, "#b09a6b");
          this.rect(x - 10, y + 4, 4, 2, "#62583f");
        }
      }
    }
    this.ellipse(482, 338, 92, 32, "#20352e");
    this.ellipse(482, 330, 86, 48, "#656c60");
    this.ellipse(482, 325, 80, 40, "#9aa18c");
    this.ellipse(482, 322, 66, 28, "#344f55");
    this.ellipse(482, 322, 58, 22, "#568b8b");
    for (let x = 448; x <= 516; x += 12) {
      this.rect(x, 329, 2, 8, "#454f48");
      this.rect(x + 2, 336, 8, 2, "#869281");
    }
    // A moonlit stone owl on a tiered pedestal watches over the village.
    this.ellipse(482, 321, 24, 10, "#a7ae98");
    this.rect(476, 295, 12, 26, "#7a897d");
    this.rect(478, 296, 4, 22, "#a5b5a0");
    this.rect(470, 291, 24, 6, "#b5bfaa");
    this.ellipse(482, 279, 23, 25, "#849689");
    this.rect(471, 264, 6, 10, "#a3b5a4");
    this.rect(489, 264, 6, 10, "#a3b5a4");
    this.ellipse(477, 274, 8, 8, "#cbd0b8");
    this.ellipse(487, 274, 8, 8, "#cbd0b8");
    this.rect(476, 274, 2, 2, "#3b514d");
    this.rect(486, 274, 2, 2, "#3b514d");
    this.path(
      [
        [480, 277],
        [484, 277],
        [482, 282],
      ],
      "#c4b58a",
    );
    this.rect(478, 285, 8, 2, "#c0c9b3");
    this.riverBanks();
    // Tiny garden by the cabin: squash, flowers, and a crooked fence.
    this.rect(790, 384, 48, 62, "#182b28");
    for (let y = 392; y < 443; y += 16)
      for (let x = 797; x < 833; x += 14) {
        this.rect(x - 3, y, 12, 10, "#554b36");
        this.rect(x + 2, y - 3, 3, 6, "#68804a");
        this.rect(x - 1, y + 1, 8, 6, "#a47643");
        this.rect(x + 2, y + 1, 2, 5, "#c3944b");
      }
    for (let x = 785; x < 841; x += 14) {
      this.rect(x, 446, 3, 13, "#7a704b");
      this.rect(x, 448, 14, 3, "#98815b");
    }
    // Flowers, pebbles and clusters of mushrooms.
    for (let i = 0; i < 95; i++) {
      const x = 160 + r() * 670,
        y = 165 + r() * 337;
      if (!canWalk(x, y) || nearbyArea(x, y) || Math.abs(x - 482) < 33)
        continue;
      if (i % 4 === 0) {
        this.rect(x, y, 3, 6, "#778056");
        this.rect(x - 3, y - 2, 9, 4, "#a36452");
        this.rect(x, y - 2, 3, 2, "#ce9b77");
      } else if (i % 3 === 0) {
        this.rect(x, y, 2, 6, "#67794d");
        this.rect(x - 2, y - 2, 6, 4, "#b0aa79");
      } else {
        this.rect(x, y, 8, 4, "#53604e");
        this.rect(x + 2, y - 2, 5, 2, "#72806a");
      }
    }
    for (let x = 327; x < 420; x += 20) {
      this.rect(x, 461, 4, 20, "#82714e");
      this.rect(x, 464, 20, 3, "#a28a5f");
      this.rect(x, 474, 20, 3, "#5d583b");
    }
    this.rect(564, 453, 45, 6, "#a28a5e");
    this.rect(566, 444, 41, 7, "#786a4c");
    this.rect(568, 459, 4, 10, "#5c573e");
    this.rect(602, 459, 4, 10, "#5c573e");
    // A stone-ringed campfire in the clearing.
    this.rect(562, 342, 26, 6, "#1b2b27");
    this.rect(558, 336, 7, 7, "#71806b");
    this.rect(585, 337, 7, 7, "#71806b");
    this.rect(565, 347, 21, 4, "#586553");
    this.rect(563, 339, 22, 4, "#6c4d35");
    this.rect(568, 336, 5, 11, "#94704a");
  }
  ellipse(x, y, w, h, color) {
    for (let yy = -h / 2; yy <= h / 2; yy += 2) {
      const span = (w / 2) * Math.sqrt(Math.max(0, 1 - (yy / (h / 2)) ** 2));
      this.rect(x - span, y + yy, span * 2, 2, color);
    }
  }
  // Live village trees are drawn from two cached sprites per tree: the
  // trunk stays put and only the crown is shifted by the breeze.
  cachedTree(t) {
    if (!this.treeSprites) this.treeSprites = new WeakMap();
    let sprite = this.treeSprites.get(t);
    if (!sprite) {
      const box = treeFootprint(t);
      const left = Math.floor(box.left / 2) * 2 - 8,
        top = Math.floor(box.top / 2) * 2 - 8,
        width = Math.ceil((box.right - left) / 2) * 2 + 8,
        height = Math.ceil((box.bottom - top) / 2) * 2 + 8;
      const paint = (part) => {
        const canvas = document.createElement("canvas");
        canvas.width = width / 2;
        canvas.height = height / 2;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.scale(0.5, 0.5);
        ctx.translate(-left, -top);
        const main = this.ctx,
          reduced = this.reduced;
        this.ctx = ctx;
        this.reduced = true;
        try {
          this.tree(t, part);
        } finally {
          this.ctx = main;
          this.reduced = reduced;
        }
        return canvas;
      };
      sprite = { left, top, width, height, base: paint("base"), crown: paint("crown") };
      this.treeSprites.set(t, sprite);
    }
    const sway = this.reduced
      ? 0
      : Math.round(Math.sin(this.time * 0.8 + t.x * 0.017) * 1.2) * 2;
    const { left, top, width, height } = sprite;
    this.ctx.drawImage(sprite.base, left, top, width, height);
    this.ctx.drawImage(sprite.crown, left + sway, top, width, height);
  }
  tree(t, part) {
    const x = Math.round(t.x / 2) * 2,
      y = Math.round(t.y / 2) * 2;
    const s = t.s,
      width = Math.round((34 * s) / 2) * 2,
      height = Math.round((68 * s) / 2) * 2;
    if (part !== "crown") {
      this.ellipse(x, y + 2, width * 1.7, 12, "#192a24");
      this.rect(x - 6, y - 29, 12, 33, "#403c2c");
      this.rect(x - 3, y - 27, 4, 30, "#786445");
      this.rect(x - 9, y - 3, 5, 7, "#514c33");
      this.rect(x + 5, y - 5, 5, 9, "#514c33");
    }
    if (part === "base") return;
    this.ctx.save();
    const sway = this.reduced
      ? 0
      : Math.round(Math.sin(this.time * 0.8 + t.x * 0.017) * 1.2) * 2;
    this.ctx.translate(sway, 0);
    const dark = t.tone > 0.5 ? "#1e322b" : "#1c332f",
      mid = t.tone > 0.5 ? "#334b36" : "#2c4b3b",
      light = t.tone > 0.5 ? "#526644" : "#47644a";
    if (t.tone < 0.28) {
      // Pines mix with softer broadleaf trees around the clearing.
      this.path(
        [
          [x, y - height - 18],
          [x - 12 * s, y - height + 4],
          [x - 7 * s, y - height + 4],
          [x - 26 * s, y - 38 * s],
          [x - 18 * s, y - 38 * s],
          [x - 37 * s, y - 9],
          [x + 37 * s, y - 9],
          [x + 18 * s, y - 38 * s],
          [x + 26 * s, y - 38 * s],
          [x + 7 * s, y - height + 4],
          [x + 12 * s, y - height + 4],
        ],
        dark,
      );
      this.path(
        [
          [x, y - height - 13],
          [x - 9 * s, y - height + 5],
          [x - 5 * s, y - height + 5],
          [x - 21 * s, y - 37 * s],
          [x - 14 * s, y - 37 * s],
          [x - 31 * s, y - 13],
          [x - 1, y - 13],
        ],
        mid,
      );
      this.rect(x - 13 * s, y - 41 * s, 10 * s, 3, light);
      this.rect(x - 22 * s, y - 20, 16 * s, 3, light);
    } else {
      // Overlapping rasterized leaf clusters produce irregular, rounded crowns.
      this.ellipse(x, y - height * 0.7, width * 2.15, height * 0.9, dark);
      this.ellipse(
        x - width * 0.42,
        y - height * 0.66,
        width * 1.5,
        height * 0.66,
        dark,
      );
      this.ellipse(
        x + width * 0.43,
        y - height * 0.61,
        width * 1.5,
        height * 0.65,
        dark,
      );
      this.ellipse(x - 3, y - height * 0.84, width * 1.6, height * 0.56, mid);
      this.ellipse(
        x - width * 0.42,
        y - height * 0.61,
        width * 1.22,
        height * 0.58,
        mid,
      );
      this.ellipse(
        x + width * 0.32,
        y - height * 0.6,
        width * 1.25,
        height * 0.53,
        mid,
      );
      const r = seeded(Math.round(t.x * 47 + t.y));
      for (let i = 0; i < 32; i++) {
        const lx = (r() - 0.5) * width * 1.8,
          ly = (r() - 0.5) * height * 0.7;
        if ((lx / (width * 0.95)) ** 2 + (ly / (height * 0.4)) ** 2 < 1)
          this.rect(
            x + lx,
            y - height * 0.72 + ly,
            4 + r() * 4,
            2 + r() * 2,
            i % 3 === 0 ? light : dark,
          );
      }
      this.rect(x - width * 0.4, y - height * 0.94, width * 0.4, 3, light);
      this.rect(x - width * 0.75, y - height * 0.7, width * 0.3, 3, light);
    }
    this.ctx.restore();
  }
  glow(x, y, size, color = "#e0ac53") {
    // Three stepped pools of light instead of a smooth modern gradient.
    const c = this.ctx;
    c.save();
    [
      [size, 0.025],
      [size * 0.65, 0.04],
      [size * 0.35, 0.08],
    ].forEach(([s, alpha]) => {
      c.globalAlpha =
        alpha * (this.reduced ? 1 : 0.93 + Math.sin(this.time * 4 + x) * 0.07);
      this.rect(x - s, y - s * 0.45, s * 2, s * 0.9, color);
      this.rect(x - s * 0.7, y - s * 0.65, s * 1.4, s * 1.3, color);
    });
    c.restore();
  }
  building(d) {
    const { x, y, w, h, id } = d;
    this.rect(x - 6, y + h - 2, w + 12, 14, "#182622");
    this.rect(x - 2, y + 28, w + 4, h - 24, "#302d28");
    this.rect(x + 3, y + 31, w - 6, h - 30, "#79664b");
    for (let yy = y + 37; yy < y + h; yy += 9) {
      this.rect(x + 3, yy, w - 6, 2, "#4e4935");
      this.rect(x + 5, yy + 2, w - 10, 2, "#8e7652");
    }
    [x + 4, x + w - 10].forEach((xx) =>
      this.rect(xx, y + 31, 6, h - 31, "#4a4030"),
    );
    if (id === "career") {
      this.rect(x + 22, y - 34, w - 43, 66, "#69644e");
      for (let yy = y - 29; yy < y + 32; yy += 10)
        this.rect(x + 24, yy, w - 48, 2, "#454a3c");
      this.path(
        [
          [x + 13, y - 25],
          [x + 30, y - 49],
          [x + w - 29, y - 49],
          [x + w - 10, y - 25],
        ],
        "#59646a",
      );
      this.rect(x + 28, y - 35, w - 55, 10, "#74837d");
      this.rect(x + 46, y - 45, 6, 25, "#949582");
      this.rect(x + w - 4, y - 35, 4, 32, "#818d7c");
      this.rect(x + w - 2, y - 40, 20, 8, "#a1a895");
    } else {
      this.rect(x + w - 34, y - 18, 17, 37, "#565447");
      this.rect(x + w - 36, y - 20, 21, 5, "#7d7560");
    }
    const roof =
      id === "gamedev" ? "#765668" : id === "about" ? "#785b4e" : "#5a6460";
    const shade =
      id === "gamedev" ? "#4c3c4b" : id === "about" ? "#4d413a" : "#3c4a46";
    this.path(
      [
        [x - 14, y + 34],
        [x + w / 2, y - 14],
        [x + w + 14, y + 34],
        [x + w + 14, y + 43],
        [x - 14, y + 43],
      ],
      shade,
    );
    this.path(
      [
        [x - 10, y + 31],
        [x + w / 2, y - 9],
        [x + w + 10, y + 31],
      ],
      roof,
    );
    // Individual roof shingles and a bright timber eave.
    for (let row = 0; row < 6; row++) {
      const yy = y - 3 + row * 7,
        half = (yy - y + 13) * 1.65;
      this.rect(x + w / 2 - half, yy, half * 2, 2, shade);
      for (let xx = x + w / 2 - half + 5; xx < x + w / 2 + half - 4; xx += 16)
        this.rect(xx + (row % 2 ? 4 : 0), yy + 2, 2, 4, shade);
    }
    this.rect(x - 13, y + 37, w + 26, 5, "#a18a5c");
    this.rect(x - 9, y + 42, w + 18, 3, "#493f2f");
    const doorY = y + h - 42;
    this.rect(d.doorX - 13, doorY, 26, 42, "#30362c");
    this.rect(d.doorX - 10, doorY + 4, 20, 38, "#a17c47");
    for (let xx = d.doorX - 8; xx < d.doorX + 9; xx += 6)
      this.rect(xx, doorY + 6, 2, 34, "#765b39");
    this.rect(d.doorX - 7, doorY + 7, 14, 15, "#e2b765");
    this.rect(d.doorX - 1, doorY + 7, 2, 15, "#877047");
    this.rect(d.doorX + 5, doorY + 29, 3, 3, "#ecc981");
    if (id === "about" && this.doorOpen > 0) {
      // The door swings inward onto a warm, lamplit room.
      const leaf = Math.round((1 - this.doorOpen) * 10) * 2;
      this.rect(d.doorX - 10, doorY + 4, 20, 38, "#f0c063");
      this.rect(d.doorX - 8, doorY + 6, 16, 34, "#ffdc8e");
      this.rect(d.doorX - 10, doorY + 32, 20, 10, "#e3a64f");
      this.rect(d.doorX - 10, doorY + 4, Math.max(4, leaf), 38, "#7c5c36");
      this.glow(d.doorX, doorY + 40, 46 * this.doorOpen, "#f2c36a");
    }
    this.rect(d.doorX - 17, y + h, 34, 5, "#ad9a6b");
    this.rect(d.doorX - 22, y + h + 5, 44, 4, "#6c7354");
    [x + 16, x + w - 39].forEach((wx) => {
      this.rect(wx - 3, y + h - 50, 28, 31, "#39392c");
      this.rect(wx, y + h - 47, 22, 25, "#d3a24e");
      this.rect(wx + 3, y + h - 44, 16, 19, "#f0cc78");
      this.rect(wx + 9, y + h - 47, 3, 25, "#806242");
      this.rect(wx, y + h - 35, 22, 3, "#806242");
      this.rect(wx - 5, y + h - 21, 32, 5, "#a48a5b");
      this.rect(wx - 6, y + h - 49, 3, 25, "#5b6042");
      this.rect(wx + 26, y + h - 49, 3, 25, "#5b6042");
      this.glow(wx + 11, y + h - 34, 58);
    });
    if (id === "projects") {
      this.rect(x - 23, y + h - 20, 18, 21, "#80663e");
      this.rect(x - 21, y + h - 17, 14, 3, "#c19958");
      this.rect(x - 21, y + h - 6, 14, 3, "#493c2a");
      this.rect(x + w + 7, y + h - 19, 18, 22, "#5f5339");
      this.rect(x + w + 10, y + h - 15, 12, 3, "#a88850");
    }
    if (id === "gamedev") {
      this.rect(x + 35, y + 46, 52, 15, "#382f3b");
      this.rect(x + 41, y + 51, 7, 6, "#e4ae79");
      this.rect(x + 54, y + 51, 7, 6, "#b794a3");
      this.rect(x + 68, y + 51, 7, 6, "#97a88a");
    }
    if (id === "about") {
      this.rect(x + w + 4, y + h - 6, 17, 6, "#85674e");
      this.rect(x + w + 8, y + h - 13, 4, 8, "#626f48");
      this.rect(x + w + 14, y + h - 17, 4, 11, "#708352");
      this.rect(x - 21, y + h - 14, 12, 16, "#735f45");
      this.rect(x - 24, y + h - 19, 18, 8, "#485e3e");
    }
    this.rooftopSign(d);
  }
  rooftopSign(d) {
    if (!this.signSprites) this.signSprites = new Map();
    const sign = cabinSign(d);
    let sprite = this.signSprites.get(d.id);
    if (!sprite) {
      // Posts reach down to the roof; moss tufts rise above the board.
      const foot = Math.max(...sign.posts.map((px) => roofLine(d, px - d.x - d.w / 2))) + 4;
      const left = sign.x - 4,
        top = sign.y - 4,
        width = sign.w + 8,
        height = Math.ceil((foot - top) / 2) * 2 + 2;
      const canvas = document.createElement("canvas");
      canvas.width = width / 2;
      canvas.height = height / 2;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.scale(0.5, 0.5);
      ctx.translate(-left, -top);
      const main = this.ctx;
      this.ctx = ctx;
      try {
        this.paintSign(d, sign);
      } finally {
        this.ctx = main;
      }
      sprite = { canvas, left, top, width, height };
      this.signSprites.set(d.id, sprite);
    }
    // Walking behind a cabin, the player shows through its billboard.
    const { x: px, y: py } = this.player,
      behind =
        py < d.y + d.h &&
        px + 14 > sign.x &&
        px - 16 < sign.x + sign.w &&
        py + 6 > sign.y &&
        py - 44 < sign.y + sign.h + 6;
    this.ctx.save();
    try {
      if (behind) this.ctx.globalAlpha = 0.45;
      this.ctx.drawImage(sprite.canvas, sprite.left, sprite.top, sprite.width, sprite.height);
    } finally {
      this.ctx.restore();
    }
  }
  paintSign(d, sign) {
    const { x, y, w, h, text } = sign;
    const cols = w / 2,
      rows = h / 2;
    // One call per art pixel run keeps everything on the native grid.
    const px = (ax, ay, aw, ah, color) =>
      this.rect(x + ax * 2, y + ay * 2, aw * 2, ah * 2, color);
    // Posts first, so the board overlaps their tops.
    for (const postX of sign.posts) {
      const foot = roofLine(d, postX - d.x - d.w / 2) + 4,
        ax = Math.round((postX - x) / 2) - 1;
      this.rect(x + ax * 2 + 2, y + h, 4, foot - y - h, "#2a2016");
      this.rect(x + ax * 2, y + h, 4, foot - y - h, "#4a3824");
      this.rect(x + ax * 2, y + h, 2, foot - y - h, "#6b5234");
      this.rect(x + ax * 2 - 2, foot - 2, 10, 2, "#2c2722");
    }
    // A shadow line where the board meets the posts.
    px(1, rows, cols - 2, 1, "#1d1710");
    // Dark outline with notched corners.
    px(1, 0, cols - 2, 1, "#241b12");
    px(1, rows - 1, cols - 2, 1, "#241b12");
    px(0, 1, 1, rows - 2, "#241b12");
    px(cols - 1, 1, 1, rows - 2, "#241b12");
    // Bevelled frame: moonlit top edge, darker underside.
    px(1, 1, cols - 2, 1, "#a07a48");
    px(1, 2, 1, rows - 3, "#8a6a3e");
    px(cols - 2, 2, 1, rows - 3, "#5a4128");
    px(2, rows - 2, cols - 3, 1, "#4c3722");
    // Plank face with staggered seams and a little grain.
    px(2, 2, cols - 4, rows - 4, "#6b4f31");
    const rand = seeded(d.x * 7 + d.y);
    for (const seam of [5, 9]) {
      px(2, seam, cols - 4, 1, "#5a4129");
      const joint = 4 + Math.floor(rand() * (cols - 10));
      px(joint, seam - 3, 1, 3, "#5a4129");
    }
    for (let i = 0; i < cols / 3; i++)
      px(3 + Math.floor(rand() * (cols - 7)), 3 + Math.floor(rand() * (rows - 6)), 2, 1, "#7a5b39");
    // Iron nails at the corners.
    for (const [ax, ay] of [
      [2, 2],
      [cols - 3, 2],
      [2, rows - 3],
      [cols - 3, rows - 3],
    ])
      px(ax, ay, 1, 1, "#c9ad7a");
    // Painted letters with a dark drop shadow.
    for (const pass of [0, 1]) {
      let cursor = 5;
      for (const ch of text) {
        const glyph = GLYPHS[ch];
        if (glyph)
          glyph.forEach((row, gy) => {
            for (let gx = 0; gx < 5; gx++)
              if (row[gx] === "#")
                pass
                  ? px(cursor + gx, 4 + gy, 1, 1, gy < 2 ? "#fff3cf" : "#f0dcaa")
                  : px(cursor + gx + 1, 5 + gy, 1, 1, "#2b1f14");
          });
        cursor += ch === " " ? 3 : 6;
      }
    }
    // Moss creeping over the top edge.
    for (let i = 0; i < cols / 5; i++) {
      const ax = 1 + Math.floor(rand() * (cols - 4)),
        span = 1 + Math.floor(rand() * 3);
      px(ax, 0, span, 1, "#3f5a2e");
      if (rand() < 0.6) px(ax + (span > 1 ? 1 : 0), -1, 1, 1, "#5d7d3c");
    }
  }
  lantern(x, y) {
    this.rect(x, y - 33, 4, 35, "#575843");
    this.rect(x - 8, y - 35, 14, 4, "#a58e57");
    this.rect(x - 8, y - 30, 8, 11, "#d4a553");
    this.rect(x - 6, y - 28, 4, 7, "#f3d285");
    this.rect(x - 10, y - 33, 12, 3, "#534b33");
    this.rect(x - 10, y - 20, 12, 3, "#534b33");
    this.glow(x - 4, y - 25, 68);
  }
  character() {
    if (!this.emerging) return this.characterSprite();
    // Stepping out of the About cabin: hide whatever is still indoors.
    const about = destinations.find((d) => d.id === "about");
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(0, about.y + about.h, WIDTH, HEIGHT);
    this.ctx.rect(about.doorX - 10, about.y + about.h - 38, 20, 38);
    this.ctx.clip();
    try {
      this.characterSprite();
    } finally {
      this.ctx.restore();
    }
  }
  characterSprite() {
    const { x, y, facing } = this.player;
    const px = Math.round(x / 2) * 2,
      py = Math.round(y / 2) * 2;
    const frame = walkFrame(this.walkTime, this.walking, this.reduced);
    const stride = [0, 3, 0, -3][frame],
      bob = frame % 2 ? 2 : 0;
    const side = facing === "left" || facing === "right",
      direction = facing === "left" ? -1 : 1;
    this.ellipse(px, py + 3, 24, 7, "#15271f");
    // Boots alternate independently; the arms counter-swing against the legs.
    this.rect(px - 8, py - 8 - stride, 6, 10, "#343732");
    this.rect(px - 9, py - stride, 8, 3, "#554835");
    this.rect(px + 2, py - 8 + stride, 6, 10, "#343732");
    this.rect(px + 2, py + stride, 8, 3, "#554835");
    const body = py - bob;
    this.rect(px - 11, body - 24, 22, 18, "#789880");
    this.rect(px - 9, body - 23, 5, 16, "#98aa86");
    this.rect(px - 13, body - 22 + stride, 4, 12, "#9dad89");
    this.rect(px - 13, body - 12 + stride, 4, 4, "#dcbb85");
    this.rect(px + 9, body - 22 - stride, 4, 12, "#6c876f");
    this.rect(px + 9, body - 12 - stride, 4, 4, "#c7a878");
    this.rect(px - 8, body - 40, 16, 17, "#dcbb85");
    this.rect(px - 10, body - 42, 20, 9, "#4b4034");
    this.rect(px - 8, body - 44, 14, 4, "#68533a");
    this.rect(px - 12, body - 37, 4, 12, "#4b4034");
    this.rect(px - 12, body - 26, 24, 5, "#b86650");
    const scarfWave = this.reduced
      ? 0
      : Math.round(Math.sin(this.time * 4)) * 2;
    this.rect(px + (facing === "left" ? 9 : -13), body - 23, 5, 12, "#91463e");
    this.rect(
      px + (facing === "left" ? 10 : -16),
      body - 14 + scarfWave,
      7,
      4,
      "#b86650",
    );
    if (facing === "up") {
      this.rect(px - 8, body - 34, 16, 8, "#4b4034");
      this.rect(px - 7, body - 19, 14, 12, "#526d58");
      this.rect(px - 5, body - 17, 10, 4, "#839174");
      this.rect(px - 6, body - 8, 12, 3, "#ab976c");
    } else {
      if (side) {
        this.rect(px + (direction < 0 ? -11 : 8), body - 33, 3, 6, "#dcbb85");
        this.rect(px + (direction < 0 ? -6 : 5), body - 32, 2, 3, "#32392c");
      } else {
        this.rect(px - 5, body - 32, 2, 3, "#32392c");
        this.rect(px + 3, body - 32, 2, 3, "#32392c");
      }
      this.rect(px - 3, body - 27, 6, 2, "#ad845a");
      this.rect(px - 5, body - 18, 10, 10, "#5d7865");
      this.rect(px - 3, body - 16, 6, 2, "#b2b18b");
    }
    if (this.waving) {
      // A raised hand waves hello over the shoulder.
      const sway = this.reduced ? 0 : Math.round(Math.sin(this.time * 9)) * 3;
      this.rect(px + 9, body - 34, 5, 12, "#dcbb85");
      this.rect(px + 10, body - 40, 4, 8, "#9dad89");
      this.rect(px + 10 + sway, body - 47, 6, 7, "#dcbb85");
    }
    if (this.talking) {
      // A small speech bubble with drifting dots.
      const bx = px + 8,
        by = body - 74;
      this.rect(bx, by, 30, 18, "#f3ead2");
      this.rect(bx + 2, by - 2, 26, 22, "#f3ead2");
      this.rect(bx + 2, by + 18, 6, 4, "#f3ead2");
      this.rect(bx, by + 22, 4, 4, "#f3ead2");
      const dot = this.reduced ? 3 : Math.floor(this.time * 4) % 4;
      for (let i = 0; i < 3; i++)
        this.rect(bx + 6 + i * 8, by + 8 - (i === dot ? 2 : 0), 4, 4, "#4b4034");
    }
  }
  smoke(d) {
    if (d.id === "career") return;
    const x = d.x + d.w - 26,
      y = d.y - 23;
    for (let i = 0; i < 3; i++) {
      const phase = this.reduced ? i * 0.31 : (this.time * 0.11 + i * 0.31) % 1;
      const drift = this.reduced ? i * 3 : Math.sin(phase * 5 + d.x) * 7;
      this.ctx.globalAlpha = (1 - phase) * 0.21;
      this.rect(
        x + drift - 4,
        y - phase * 47,
        8 + phase * 12,
        6 + phase * 5,
        "#a2aaa0",
      );
    }
    this.ctx.globalAlpha = 1;
  }
  fire() {
    const frame = this.reduced ? 1 : Math.floor(this.time * 7) % 4;
    this.rect(569, 329, 16, 12, "#b9683a");
    this.rect(572, 325 - (frame % 2) * 3, 10, 15, "#df9845");
    this.rect(576, 322 + (frame % 3) * 2, 5, 18, "#f0c561");
    this.rect(576, 331, 4, 8, "#ffe19a");
    this.glow(576, 335, 64);
    if (!this.reduced) {
      const rise = (this.time * 13) % 27;
      this.ctx.globalAlpha = 1 - rise / 27;
      this.rect(571 + Math.sin(this.time * 3) * 4, 324 - rise, 2, 2, "#e4c078");
      this.ctx.globalAlpha = 1;
    }
  }
  riverCenter(x) {
    return riverCenter(x);
  }
  riverBanks() {
    // The river continues through both canvas edges, behind the cabin roofs.
    const upper = [],
      lower = [],
      waterUpper = [],
      waterLower = [];
    for (let x = -24; x <= WIDTH + 24; x += 12) {
      const y = this.riverCenter(x);
      const width = 15 + Math.sin(x * 0.019) * 3;
      upper.push([x, y - width - 7]);
      lower.unshift([x, y + width + 7]);
      waterUpper.push([x, y - width]);
      waterLower.unshift([x, y + width]);
    }
    this.path([...upper, ...lower], "#4e604a");
    this.path([...waterUpper, ...waterLower], "#31565c");
    const rand = seeded(1957);
    for (let i = 0; i < 96; i++) {
      const x = rand() * WIDTH,
        y = this.riverCenter(x);
      const side = i % 2 === 0 ? -1 : 1,
        bankY = y + side * (19 + rand() * 5);
      this.ellipse(x, bankY, 6 + rand() * 11, 4 + rand() * 5, "#6c796a");
      this.rect(x - 2, bankY - 2, 4, 2, "#879281");
      if (i % 3 === 0) {
        this.rect(x + 4, bankY - 10, 2, 12, "#899565");
        this.rect(x + 7, bankY - 7, 2, 9, "#647f59");
        this.rect(x + 4, bankY - 12, 2, 5, "#b09464");
      }
      if (i % 5 === 0) {
        this.ellipse(x, y, 16, 6, "#3b6669");
        this.rect(x - 4, y, 8, 2, "#557c78");
      }
    }
    // Soft moon reflections remain short, interrupted by the gentle current.
    for (let x = 560; x < 640; x += 14)
      this.rect(x, this.riverCenter(x) - 6 + (x % 3) * 3, 10, 2, "#78988b");
  }
  riverLife() {
    const phase = this.reduced ? 0 : Math.floor(this.time * 3) % 6;
    for (let x = 8; x < WIDTH; x += 36) {
      const flowX = x + phase * 2,
        y = this.riverCenter(flowX);
      this.rect(flowX, y - 5, 12, 2, "#6a948c");
      this.rect(flowX + 8 - phase, y + 5, 7, 2, "#466f72");
    }
    for (const [x, y] of [
      [470, 188],
      [456, 222],
      [473, 252],
    ]) {
      this.rect(x + phase, y, 12, 2, "#799f97");
      this.rect(x + 8 - phase, y + 5, 7, 2, "#456f72");
    }
    // A mallard and duckling drift quietly in a sheltered bend.
    const drift = this.reduced
      ? 0
      : Math.round(Math.sin(this.time * 0.3) * 7) * 2;
    const x = 550 + drift,
      y = this.riverCenter(x);
    this.ellipse(x, y + 5, 20, 5, "#203f45");
    this.ellipse(x, y, 15, 8, "#ab9d75");
    this.rect(x + 4, y - 8, 7, 9, "#476b59");
    this.rect(x + 11, y - 4, 5, 2, "#d1b26a");
    this.rect(x + 7, y - 6, 2, 2, "#182d29");
    this.ellipse(x - 21, y + 2, 8, 5, "#d4b879");
    this.rect(x - 17, y, 3, 2, "#cc9757");
  }
  crows() {
    for (let i = 0; i < 4; i++) {
      const t = this.reduced ? 0 : this.time;
      const x = ((t * 23 + i * 141 + 120) % (WIDTH + 140)) - 70;
      const moon = this.moonPosition();
      const floor = moon.y + moon.diameter / 2 + 24 - this.layout.skyHeight;
      const y =
        Math.max(floor, -28) +
        (i % 2) * 16 +
        Math.round(Math.sin(t * 0.5 + i) * 7) * 2;
      const flap = this.reduced
        ? 0
        : [-6, -2, 2, -2][Math.floor(t * 5 + i) % 4];
      this.rect(x - 2, y, 6, 4, "#1d2b30");
      this.path(
        [
          [x - 1, y + 1],
          [x - 12, y + flap],
          [x - 18, y + flap + 2],
          [x - 8, y + 4],
        ],
        "#233139",
      );
      this.path(
        [
          [x + 3, y + 1],
          [x + 14, y + flap],
          [x + 20, y + flap + 2],
          [x + 10, y + 4],
        ],
        "#233139",
      );
      this.rect(x + 5, y, 4, 2, "#53605c");
    }
  }
  fountainWater() {
    const phase = this.reduced ? 0 : Math.floor(this.time * 6) % 4;
    for (const side of [-1, 1]) {
      this.path(
        [
          [482 + side * 9, 291],
          [482 + side * 18, 298],
          [482 + side * 24, 316],
          [482 + side * 21, 316],
          [482 + side * 15, 300],
        ],
        "#8ebbb2",
      );
      this.rect(482 + side * 23, 311 + phase * 2, 3, 5, "#c3dace");
      this.rect(482 + side * 22 - 5, 322, 12, 2, "#abd0c0");
    }
    this.rect(449 + phase * 3, 318, 15, 2, "#8ab6af");
    this.rect(499 - phase * 2, 323, 11, 2, "#bad0b8");
  }
  rabbit(state, index) {
    const c = this.ctx;
    c.save();
    c.translate(Math.round(state.x / 2) * 2, Math.round(state.y / 2) * 2);
    c.scale(state.facing, 1);
    const hop = this.reduced ? 0 : [0, -3, -6, -2][state.frame];
    this.ellipse(0, 2, 22, 5, "#172920");
    const fur = index ? "#b9b4a0" : "#d8d6c0";
    this.ellipse(-2, -7 + hop, 17, 12, fur);
    this.rect(-12, -9 + hop, 5, 5, "#efdfc7");
    this.ellipse(7, -12 + hop, 10, 10, fur);
    this.rect(5, -27 + hop, 4, 13, fur);
    this.rect(11, -25 + hop, 4, 11, fur);
    this.rect(7, -23 + hop, 2, 6, "#bd8e89");
    this.rect(13, -22 + hop, 2, 5, "#bd8e89");
    this.rect(10, -14 + hop, 2, 2, "#354138");
    this.rect(13, -10 + hop, 3, 2, "#b48d7a");
    this.rect(-6, -2 + hop, 6, 3, fur);
    this.rect(5, -2 + hop, 6, 3, fur);
    c.restore();
  }
  fox(state) {
    const c = this.ctx;
    c.save();
    c.translate(Math.round(state.x / 2) * 2, Math.round(state.y / 2) * 2);
    c.scale(state.facing, 1);
    const stride = [0, 2, 0, -2][state.frame],
      bob = state.frame % 2 ? -2 : 0;
    this.ellipse(0, 2, 33, 7, "#172920");
    // A bushy tail with a cream tip, pointed ears, and a four-frame trot.
    this.rect(-23, -12 + bob, 12, 7, "#a76236");
    this.rect(-29, -14 + bob, 9, 7, "#e0d0a3");
    this.rect(-20, -9 + bob, 9, 7, "#c47b43");
    this.rect(-12, -12 + bob, 24, 11, "#b86d38");
    this.rect(-11, -14 + bob, 19, 5, "#d58d4b");
    this.rect(-8, -5 + bob, 18, 4, "#e3cc93");
    this.rect(-11, -2 + stride, 4, 5, "#4d3e2d");
    this.rect(-4, -2 - stride, 4, 5, "#5c4630");
    this.rect(7, -2 + stride, 4, 5, "#4d3e2d");
    this.rect(7, -18 + bob, 12, 12, "#ca8246");
    this.rect(8, -23 + bob, 4, 6, "#b66c38");
    this.rect(14, -23 + bob, 4, 6, "#b66c38");
    this.rect(10, -21 + bob, 2, 3, "#46372b");
    this.rect(16, -11 + bob, 8, 5, "#ebd8a6");
    this.rect(22, -11 + bob, 3, 3, "#342e27");
    this.rect(16, -16 + bob, 2, 2, "#302f27");
    c.restore();
  }
  skyClouds() {
    const c = this.ctx;
    c.save();
    for (const cloud of this.clouds) {
      const drift = this.reduced ? 0 : this.time * cloud.speed;
      const x = ((cloud.x + drift + 180) % (WIDTH + 360)) - 180;
      const moon = this.moonPosition();
      const y = Math.max(
        -48 + cloud.y * 0.35,
        moon.y + moon.diameter / 2 + 18 - this.layout.skyHeight,
      );
      c.globalAlpha = 0.76;
      this.ellipse(x, y, cloud.w, cloud.h, "#4b5e62");
      this.ellipse(
        x - cloud.w * 0.18,
        y - 5,
        cloud.w * 0.44,
        cloud.h * 0.92,
        "#4b5e62",
      );
      this.ellipse(
        x + cloud.w * 0.15,
        y - 3,
        cloud.w * 0.5,
        cloud.h * 0.8,
        "#4b5e62",
      );
      c.globalAlpha = 0.39;
      this.rect(
        x - cloud.w * 0.32,
        y + cloud.h * 0.22,
        cloud.w * 0.64,
        3,
        "#69746e",
      );
    }
    c.restore();
  }
  moonlight() {
    const c = this.ctx;
    c.save();
    // Pixel-stepped shafts are rendered before scenery, which occludes the light.
    const breathe = this.reduced ? 1 : 0.94 + Math.sin(this.time * 0.24) * 0.06;
    const moon = this.moonPosition(),
      originY = moon.y + moon.diameter * 0.25 - this.layout.skyHeight;
    const shafts = [
      {
        points: [
          [moon.x - 10, originY + 5],
          [moon.x - 3, originY + 5],
          [390, 540],
          [270, 540],
        ],
        alpha: 0.038,
      },
      {
        points: [
          [moon.x - 4, originY + 7],
          [moon.x + 4, originY + 7],
          [655, 540],
          [485, 540],
        ],
        alpha: 0.052,
      },
      {
        points: [
          [moon.x + 3, originY + 5],
          [moon.x + 10, originY + 5],
          [892, 530],
          [744, 530],
        ],
        alpha: 0.029,
      },
    ];
    for (const shaft of shafts) {
      c.globalAlpha = shaft.alpha * breathe;
      this.path(shaft.points, "#b5d5c8");
    }
    c.restore();
  }
  draw() {
    const main = this.ctx;
    try {
      for (const surface of this.surfaces) {
        if (
          surface.top < this.viewport.bottom &&
          surface.top + surface.height > this.viewport.top
        )
          this.drawSurface(surface);
      }
    } finally {
      this.ctx = main;
    }
  }
  drawSurface(surface) {
    const c = surface.ctx,
      previousContext = this.ctx;
    this.ctx = c;
    const top = surface.top,
      bottom = Math.min(this.layout.height, top + surface.height);
    const height = Math.max(0, bottom - top);
    if (!height) {
      this.ctx = previousContext;
      return;
    }
    c.save();
    try {
      c.translate(0, -top);
      c.beginPath();
      c.rect(0, top, WIDTH, height);
      c.clip();
      c.clearRect(0, top, WIDTH, height);
      c.drawImage(
        this.scene,
        0,
        top / 2,
        WIDTH / 2,
        height / 2,
        0,
        top,
        WIDTH,
        height,
      );
      animateJourney(this, this.layout);
      if (top < this.layout.skyHeight + 620) {
        c.save();
        try {
          c.translate(0, this.layout.skyHeight);
          if (this.interior) this.drawInterior();
          else {
            this.skyClouds();
            this.crows();
            this.moonlight();
            this.riverLife();
            for (let i = 0; i < 7; i++) {
              const phase = this.reduced ? 0 : Math.floor(this.time * 3 + i) % 4;
              this.rect(
                458 + Math.sin(i * 2) * 10 + phase * 2,
                148 + i * 19,
                12,
                2,
                "#51736b",
              );
            }
            const foxes = [
              foxState(this.time, 0, this.reduced),
              foxState(this.time, 1, this.reduced),
            ];
            const rabbits = [
              rabbitState(this.time, 0, this.reduced),
              rabbitState(this.time, 1, this.reduced),
            ];
            const sorted = [
              { y: 344, draw: () => this.fountainWater() },
              ...destinations.map((d) => ({
                y: d.y + d.h,
                draw: () => this.building(d),
              })),
              ...this.trees.map((t) => ({
                y: t.y,
                draw: () => this.cachedTree(t),
              })),
              ...foxes.map((fox) => ({ y: fox.y, draw: () => this.fox(fox) })),
              ...rabbits.map((rabbit, i) => ({
                y: rabbit.y,
                draw: () => this.rabbit(rabbit, i),
              })),
              {
                y: this.emerging ? Infinity : this.player.y,
                draw: () => this.character(),
              },
            ].sort((a, b) => a.y - b.y);
            sorted.forEach((o) => o.draw());
            destinations.forEach((d) => this.smoke(d));
            [
              [363, 289],
              [596, 314],
              [334, 420],
              [633, 452],
              [458, 460],
            ].forEach(([x, y]) => this.lantern(x, y));
            this.rect(531, 318, 4, 30, "#796343");
            this.rect(516, 318, 37, 10, "#b69b66");
            this.rect(519, 320, 29, 2, "#78613e");
            this.fire();
            // A sleeping cat beside the cabin: only its tail stirs.
            this.rect(626, 426, 17, 8, "#9f9472");
            this.rect(623, 424, 7, 8, "#9f9472");
            this.rect(623, 421, 3, 4, "#b4a17b");
            this.rect(627, 429, 2, 2, "#4c4e37");
            this.rect(636, 431, 9, 2, "#756f50");
            this.rect(
              643,
              424 +
                (this.reduced ? 0 : Math.round(Math.sin(this.time * 0.7)) * 2),
              7,
              3,
              "#aaa07b",
            );
            this.flies.forEach((f) => {
              const t = this.reduced ? f.phase : this.time;
              const x = f.x + Math.sin(t * 0.5 + f.phase) * 9,
                y = f.y + Math.cos(t * 0.7 + f.phase) * 6;
              c.globalAlpha = 0.4 + (0.5 + 0.5 * Math.sin(t + f.phase)) * 0.6;
              this.rect(x, y, 2, 2, "#cfcb85");
              c.globalAlpha = 1;
            });
            if (this.near) {
              const d = destinations.find((d) => d.id === this.near);
              this.rect(d.doorX - 4, d.y + d.h - 52, 8, 4, "#f1d58b");
              this.rect(d.doorX - 2, d.y + d.h - 48, 4, 3, "#f1d58b");
            }
  
          }
          if (this.iris) this.drawIris();
        } finally {
          c.restore();
        }
      }
    } finally {
      c.restore();
      this.ctx = previousContext;
    }
  }
  drawInterior() {
    let cache = this.interiorCache.get(this.interior);
    if (!cache) {
      // Rooms are painted once, at the village framebuffer resolution.
      cache = document.createElement("canvas");
      cache.width = WIDTH / 2;
      cache.height = HEIGHT / 2;
      const main = this.ctx,
        reduced = this.reduced,
        time = this.time;
      this.ctx = cache.getContext("2d");
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.scale(0.5, 0.5);
      this.reduced = true;
      this.time = 0;
      try {
        paintInterior(this, this.interior);
      } finally {
        this.ctx = main;
        this.reduced = reduced;
        this.time = time;
      }
      this.interiorCache.set(this.interior, cache);
    }
    this.ctx.drawImage(cache, 0, 0, WIDTH / 2, HEIGHT / 2, 0, 0, WIDTH, HEIGHT);
    drawInteriorScene(
      this,
      this.interior,
      this.reduced ? 0 : this.time,
      () => this.characterSprite(),
      this.nearKind === "lectern",
    );
  }
  drawIris() {
    // A pixel-stepped iris closes on the player, then opens on the new scene.
    const { t, swapped } = this.iris;
    const ease = (k) => k * k * (3 - 2 * k);
    const k = swapped
      ? ease(Math.min(1, Math.max(0, (t - IRIS.close - IRIS.hold) / IRIS.open)))
      : 1 - ease(Math.min(1, t / IRIS.close));
    const radius = k * 760,
      cx = this.player.x,
      cy = this.player.y - 22;
    const c = this.ctx;
    c.save();
    for (let y = 0; y < HEIGHT; y += 4) {
      const edge = Math.min(1, y / 70, (HEIGHT - y) / 40);
      c.globalAlpha = Math.ceil(edge * 5) / 5;
      const dy = y + 2 - cy;
      if (Math.abs(dy) >= radius) {
        this.rect(0, y, WIDTH, 4, "#050809");
        continue;
      }
      const half = Math.sqrt(radius * radius - dy * dy);
      if (cx - half > 1) this.rect(0, y, cx - half, 4, "#050809");
      if (cx + half < WIDTH - 1)
        this.rect(cx + half, y, WIDTH - cx - half, 4, "#050809");
    }
    c.restore();
  }
  frame(now) {
    requestAnimationFrame(this.frame);
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.04) : 0;
    this.last = now;
    if (!document.hidden && this.visible && !this.suspended) {
      if (this.cutscene) {
        this.cutscene(dt);
        if (this.walking) this.walkTime += dt;
      } else if (this.iris) {
        this.stepIris(dt);
      } else if (this.active && this.gameVisible) {
        const dx =
            Number(this.keys.has("right")) - Number(this.keys.has("left")),
          dy = Number(this.keys.has("down")) - Number(this.keys.has("up"));
        this.walking = movePlayer(this.player, dx, dy, dt, (x, y) =>
          this.isWalkable(x, y),
        );
        if (this.walking) this.walkTime += dt;
        else this.walkTime = 0;
        // Stepping down through the open door walks back into the village.
        if (this.interior && this.player.y > EXIT_Y) this.leaveCabin();
        else this.updateNear();
        this.updateSignShade();
      } else this.walking = false;
      this.time += dt;
      this.draw();
    }
  }
}

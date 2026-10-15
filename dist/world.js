import { paintGround, paintFern } from "./ground.js";
export { paintGround, paintFern } from "./ground.js";
import { paintJourney, animateJourney, glowJourney } from "./journey.js";
import { MOONLIGHT, ROOMLIGHT, lightBounds, lightCanvas, lightField } from "./lighting.js";
import {
  EXIT_Y,
  INTERIOR_SPAWN,
  drawInteriorScene,
  interiorArcade,
  interiorNear,
  interiorWalkable,
  paintInterior,
} from "./interiors.js";
export const WIDTH = 960,
  HEIGHT = 540;
// Lamp posts around the plaza and along the paths.
const LAMPS = [
  [363, 289],
  [596, 314],
  [334, 420],
  [633, 452],
  [458, 460],
  [446, 268],
  [522, 268],
];
// The front mountain range's body colour.
export const MOUNTAIN = "#3a3f74";
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
// The reading sign (reading-sign.js) letters with the same face, so the
// set also carries the letters and the narrow stops its words need.
export const GLYPHS = {
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
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  ".": [".", ".", ".", ".", ".", ".", "#"],
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
// The lake's near shore; it curls up to the far bank at both ends.
export function lakeShore(x) {
  const edge = Math.min(x, WIDTH - x);
  const side = 118 + Math.max(0, edge) * 0.48;
  return Math.min(riverBounds(x).bottom + 5, side);
}
export const WATERFALL = { x: 300, top: 52, foot: 112 };
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
  // Small far-shore spruce stand along the top of the lake, under the mountains.
  for (let row = 0; row < 2; row++)
    for (let x = -28; x < WIDTH + 45; x += 26) {
      const tree = {
        x: x + row * 13 + (rand() - 0.5) * 8,
        y: 98 + row * 6 + (rand() - 0.5) * 4,
        s: 0.42 + row * 0.06 + rand() * 0.1,
        tone: rand() * 0.78,
        far: true,
      };
      if (Math.abs(tree.x - WATERFALL.x) > 46) place(tree);
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
    [380, 500, 0.56],
    [418, 506, 0.65],
    [551, 503, 0.52],
    [593, 514, 0.55],
  ])
    place({ x, y, s: size, tone: rand() });
  // Clustered pines fill the woodland around the clearing: the shore band
  // behind the cabins, both flanks and the southern edge. Clumps and gaps
  // come from a smooth deterministic field, so the forest has depth rather
  // than rows; the walkable clearing, paths, lamps and signs stay open.
  const signs = destinations.map((d) => {
    const sign = cabinSign(d);
    return { left: sign.x - 8, right: sign.x + sign.w + 8, top: sign.y - 16, bottom: sign.y + sign.h + 8 };
  });
  const keepOut = [
    { left: 452, right: 514, top: 150, bottom: 300 },
    { left: 510, right: 548, top: 236, bottom: 276 },
    { left: 594, right: 636, top: 228, bottom: 278 },
    { left: 300, right: 660, top: 350, bottom: 560 },
    { left: 776, right: 850, top: 376, bottom: 470 },
  ];
  const woodland = (tree) => {
    const b = treeFootprint(tree);
    if (tree.y < lakeShore(tree.x) + 12) return false;
    if (tree.x > 150 && tree.x < 826 && tree.y > 268 && tree.y < 484) return false;
    if (Math.abs(tree.x - WATERFALL.x) < 52 && b.top < 130) return false;
    if (LAMPS.some(([lx, ly]) => Math.abs(tree.x - lx) < 20 && Math.abs(tree.y - ly) < 24)) return false;
    return ![...signs, ...keepOut].some((k) => b.left < k.right && b.right > k.left && b.top < k.bottom && b.bottom > k.top);
  };
  for (let y = 192; y < 556; y += 21)
    for (let x = -18 + ((y / 21) % 2) * 12; x < WIDTH + 20; x += 25) {
      const clump = 0.5 + 0.5 * Math.sin(x * 0.029 + 1.7) * Math.cos(y * 0.047 - 0.6);
      if (rand() > 0.28 + clump * 0.62) continue;
      const far = y < 262;
      const tree = {
        x: x + (rand() - 0.5) * 14,
        y: y + (rand() - 0.5) * 10,
        s: far ? 0.5 + rand() * 0.22 : 0.68 + rand() * 0.38,
        tone: rand() < 0.86 ? rand() * 0.78 : 0.82 + rand() * 0.15,
      };
      if (woodland(tree)) place(tree);
    }
  // Two small stands frame the north path between the upper cabins.
  for (const [x, y, size] of [
    [396, 236, 0.48], [420, 256, 0.55], [440, 232, 0.44], [400, 268, 0.5],
    [380, 250, 0.46], [570, 236, 0.38], [560, 262, 0.36],
  ]) {
    const tree = { x, y, s: size, tone: rand() * 0.78 };
    if (woodland(tree)) place(tree);
  }
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
      this.lightSink = [];
      paintJourney(this, layout, includeActors);
      this.buildLighting(this.lightSink);
    } finally {
      this.lightSink = null;
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
    const spot = interiorNear(x, y),
      arcade = !spot && interiorArcade(this.interior, x, y);
    if (arcade) return this.setNear(arcade, "arcade");
    this.setNear(
      spot === "lectern" ? this.interior : spot === "exit" ? "exit" : null,
      spot,
    );
  }
  moonPosition() {
    return { x: 480, y: (this.layout.moonArea?.y || 0) + 125, diameter: 118 };
  }
  drawSky() {
    // Indigo night in stepped bands, darkest overhead.
    const skyBottom = (this.layout.skyHeight || 0) + 190;
    const bands = ["#0d1636", "#101a3e", "#131f45", "#17244c", "#1b2a53", "#202f5a"];
    this.rect(0, 0, WIDTH, skyBottom, bands[0]);
    for (let i = 1; i < bands.length; i++) {
      const top = (skyBottom * (i + 1)) / (bands.length + 2);
      this.rect(0, top, WIDTH, skyBottom - top, bands[i]);
    }
    const { x, y, diameter: d } = this.moonPosition();
    // A peach harvest moon in a soft stepped halo.
    this.ctx.save();
    try {
      for (const [grow, alpha] of [[78, 0.08], [50, 0.1], [26, 0.14]]) {
        this.ctx.globalAlpha = alpha;
        this.ellipse(x, y, d + grow, d + grow, "#6a6aa0");
      }
    } finally {
      this.ctx.restore();
    }
    this.ellipse(x, y, d + 4, d + 4, "#c98a5a");
    this.ellipse(x, y, d, d, "#f2b674");
    this.ellipse(x - 3, y - 3, d - 10, d - 10, "#f8c584");
    this.ellipse(x - 8, y - 9, d - 40, d - 44, "#fcd59a");
    for (const [cx, cy, cw, ch] of [
      [-0.24, -0.2, 0.2, 0.15],
      [0.2, 0.08, 0.24, 0.19],
      [-0.05, 0.3, 0.14, 0.1],
      [0.26, -0.24, 0.1, 0.08],
      [-0.3, 0.12, 0.09, 0.08],
    ]) {
      this.ellipse(x + d * cx, y + d * cy, d * cw, d * ch, "#dc9a62");
      this.ellipse(x + d * cx - 2, y + d * cy - 2, d * cw * 0.6, d * ch * 0.5, "#e8aa6c");
    }
    const rand = seeded(714);
    for (let i = 0; i < 60; i++) {
      const sx = rand() * WIDTH,
        sy = rand() * (this.layout.skyHeight + 40);
      if (Math.hypot(sx - x, sy - y) > d * 0.95) {
        this.rect(sx, sy, 2, 2, i % 4 ? "#9aa6d8" : "#f4e6c0");
        if (i % 11 === 0) {
          this.rect(sx - 2, sy, 6, 2, "#6c78b0");
          this.rect(sx, sy - 2, 2, 6, "#6c78b0");
        }
      }
    }
    // Banks of moonlit cloud lean against the moon.
    this.pixelCloud(x - d * 0.95, y + d * 0.12, 150);
    this.pixelCloud(x + d * 1.05, y + d * 0.32, 120);
    this.pixelCloud(x - d * 2.6, y - d * 0.18, 96);
    this.pixelCloud(x + d * 2.7, y - d * 0.3, 110);
    // All snowy silhouettes sit in front of the moon, below the clear identity sky.
    const distantBase = this.layout.skyHeight + 122;
    this.ctx.save();
    try {
      this.ctx.globalAlpha = 0.85;
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
          "#30366a",
        );
        this.path(
          [
            [center, top],
            [center + span * 0.24, top + peakHeight * 0.46],
            [center + span * 0.5, distantBase],
            [center + span * 0.07, distantBase],
          ],
          "#252a58",
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
          "#8f94c4",
        );
        this.path(
          [
            [center, top],
            [center + span * 0.15, top + peakHeight * 0.3],
            [center + span * 0.04, top + peakHeight * 0.25],
          ],
          "#5d6398",
        );
      }
      this.ctx.globalAlpha = 0.5;
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
        "#262c5a",
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
        MOUNTAIN,
      );
      this.path(
        [
          [mx, base - peak],
          [mx + w * 0.22, base - peak * 0.59],
          [mx + w / 2, base],
          [mx + 10, base - 32],
        ],
        "#2a2e5c",
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
        "#d3d5ec",
      );
      this.path(
        [
          [mx, base - peak],
          [mx + w * 0.19, base - peak * 0.66],
          [mx + w * 0.08, base - peak * 0.73],
        ],
        "#8d92c2",
      );
      this.path(
        [
          [mx - w * 0.3, base - peak * 0.4],
          [mx - w * 0.11, base - peak * 0.57],
          [mx - w * 0.07, base - peak * 0.4],
          [mx + 12, base],
        ],
        "#464c84",
      );
    }
  }
  // A stepped cumulus: shadowed belly, indigo body and a moonlit crown.
  pixelCloud(x, y, w) {
    const h = w * 0.3;
    const puffs = [[-0.3, 0.05, 0.42, 0.7], [-0.05, -0.2, 0.42, 1], [0.24, 0, 0.36, 0.72], [0.02, 0.18, 0.9, 0.5]];
    for (const [dx, dy, pw, ph] of puffs)
      this.ellipse(x + dx * w, y + dy * h + 3, w * pw, h * ph, "#161d40");
    for (const [dx, dy, pw, ph] of puffs)
      this.ellipse(x + dx * w, y + dy * h, w * pw, h * ph, "#273163");
    for (const [dx, dy, pw, ph] of puffs.slice(0, 3))
      this.ellipse(x + dx * w - 2, y + dy * h - h * ph * 0.18, w * pw * 0.7, h * ph * 0.55, "#36437a");
    for (const [dx, dy, pw, ph] of puffs.slice(0, 3))
      this.rect(x + dx * w - w * pw * 0.2, y + dy * h - h * ph * 0.5, w * pw * 0.32, 2, "#5f6ca6");
  }
  // Art uses a 480-pixel-wide framebuffer and a two-unit pixel grid.
  rect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.cell(x, y, w, h);
  }
  // The same snapped fill without touching the colour, so shapes made of
  // many rows set their colour once rather than once per row.
  cell(x, y, w, h) {
    this.ctx.fillRect(
      Math.round(x / 2) * 2,
      Math.round(y / 2) * 2,
      Math.max(2, Math.round(w / 2) * 2),
      Math.max(2, Math.round(h / 2) * 2),
    );
  }
  path(points, color) {
    // Scanline rasterization keeps diagonals stepped instead of antialiased.
    let low = Infinity,
      high = -Infinity;
    for (const p of points) {
      if (p[1] < low) low = p[1];
      if (p[1] > high) high = p[1];
    }
    low = Math.floor(low / 2) * 2;
    this.ctx.fillStyle = color;
    const intersections = [];
    for (let y = low; y < high; y += 2) {
      intersections.length = 0;
      for (let i = 0; i < points.length; i++) {
        const a = points[i],
          b = points[(i + 1) % points.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y))
          intersections.push(
            a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]),
          );
      }
      if (intersections.length > 2) intersections.sort((a, b) => a - b);
      else if (intersections[0] > intersections[1])
        intersections.reverse();
      for (let i = 0; i + 1 < intersections.length; i += 2)
        this.cell(
          intersections[i],
          y,
          intersections[i + 1] - intersections[i],
          2,
        );
    }
  }
  drawTerrain() {
    this.rect(0, 100, 960, 440, "#22301f");
    paintGround(this, { x: 0, y: 170, width: WIDTH, height: 370 }, 9031);
    const r = seeded(832);
    // A far shore of black-green spruce under the mountains.
    this.path(
      [[0, 84], [120, 78], [260, 86], [400, 80], [560, 84], [700, 78],
        [840, 86], [960, 80], [960, 116], [0, 116]],
      "#131a2c",
    );
    const shore = seeded(3301);
    for (let x = -6; x < WIDTH + 6; x += 5) {
      const h = 10 + shore() * 22,
        base = 108 + shore() * 6;
      this.path([[x - 5, base], [x + 1, base - h], [x + 7, base]], shore() < 0.5 ? "#111828" : "#162034");
      this.rect(x, base - h + 4, 2, 2, "#22305a");
    }
    // The lake fills the valley floor behind the village; at both ends its
    // shore curves back up to the far forest instead of running off the edge.
    const lakeTop = [],
      lakeBottom = [];
    for (let x = -24; x <= WIDTH + 24; x += 12) {
      lakeTop.push([x, 108 + Math.sin(x * 0.03) * 2]);
      lakeBottom.unshift([x, lakeShore(x)]);
    }
    this.path([...lakeTop, ...lakeBottom], "#202c60");
    for (let y = 112; y < 190; y += 6) {
      const tone = y < 130 ? "#1a2552" : y < 160 ? "#283670" : "#2e3e7a";
      for (let x = (y * 7) % 23; x < WIDTH; x += 23 + ((x * y) % 17)) {
        if (y > lakeShore(x) - 3) continue;
        this.rect(x, y, 6 + ((x + y) % 11), 2, tone);
      }
    }
    // The moon's broken golden column on the water.
    for (let y = 112, i = 0; y < 186; y += 4, i++) {
      const width = 10 + ((i * 13) % 22),
        offset = Math.sin(i * 1.9) * 6;
      this.rect(480 - width / 2 + offset, y, width, 2, i % 3 ? "#d9925a" : "#f6c784");
    }
    // A spring-fed fall: water rises in a mossy grotto, fills a ledge pool
    // and pours from the outcrop into the lake.
    const fall = WATERFALL;
    this.path(
      [[fall.x - 40, 112], [fall.x - 36, 82], [fall.x - 26, 64], [fall.x - 12, 54],
        [fall.x + 10, 52], [fall.x + 26, 60], [fall.x + 36, 78], [fall.x + 42, 112]],
      "#262a44",
    );
    for (const [dx, dy, w] of [[-30, 70, 18], [-34, 88, 14], [18, 66, 16], [24, 84, 18], [-22, 100, 16], [20, 100, 16], [-6, 56, 14]]) {
      this.rect(fall.x + dx, dy, w, 8, "#4a4e72");
      this.rect(fall.x + dx, dy, w, 2, "#7a80aa");
      this.rect(fall.x + dx, dy + 8, w, 2, "#1e2238");
      this.rect(fall.x + dx + 2, dy - 2, w * 0.6, 2, "#3d5a34");
    }
    for (const [dx, h] of [[-34, 18], [-24, 24], [-12, 20], [12, 22], [24, 26], [34, 16]]) {
      const foot = Math.abs(dx) < 20 ? 56 : 68;
      this.path([[fall.x + dx - 7, foot], [fall.x + dx, foot - h], [fall.x + dx + 7, foot]], "#111828");
    }
    this.rect(fall.x - 9, 54, 18, 10, "#0c1020");
    this.rect(fall.x - 7, 52, 14, 2, "#0c1020");
    this.rect(fall.x - 12, 62, 24, 6, "#3c5a9c");
    this.rect(fall.x - 10, 62, 20, 2, "#8eaad8");
    this.rect(fall.x - 7, 66, 14, 44, "#4a64a8");
    this.rect(fall.x - 5, 66, 4, 44, "#a9c2ec");
    this.rect(fall.x + 2, 66, 2, 44, "#7a96d0");
    this.ellipse(fall.x, 112, 40, 10, "#6a86c0");
    this.ellipse(fall.x, 112, 26, 5, "#c8d6f0");
    for (const dx of [-26, 22]) this.rect(fall.x + dx, 116, 8, 2, "#4a5f9e");
    // A broad clearing of dark moss-green grass, warmed later by lamplight.
    const clearing = [[145, 301], [208, 288], [233, 268], [398, 277],
      [430, 251], [549, 250], [603, 274], [779, 279], [816, 311],
      [802, 358], [839, 416], [802, 476], [746, 484], [688, 468],
      [620, 488], [545, 481], [522, 502], [437, 496], [402, 480],
      [317, 491], [245, 476], [181, 480], [151, 439], [165, 385], [139, 345]];
    const inClearing = (x, y) => {
      let inside = false;
      for (let i = 0, j = clearing.length - 1; i < clearing.length; j = i++) {
        const a = clearing[i], b = clearing[j];
        if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0])
          inside = !inside;
      }
      return inside;
    };
    this.path(clearing, "#3a4626");
    const groundRand = seeded(4712);
    for (let patch = 0; patch < 350; patch++) {
      const px = 145 + groundRand() * 688, py = 252 + groundRand() * 248;
      if (!inClearing(px, py)) continue;
      const span = 8 + groundRand() * 15,
        tone = ["#465328", "#344222", "#525a2c", "#40502a", "#2f3c20"][patch % 5];
      this.rect(px, py, span, 4, tone);
      this.rect(px + 3, py - 3, span - 6, 3, tone);
      if (patch % 4 === 0) this.rect(px + 2, py + 4, span * 0.6, 3, "#626a34");
    }
    this.grass.forEach((g) => {
      if (g.y < 190) return;
      const warm = inClearing(g.x, g.y);
      this.rect(g.x, g.y, 2 + g.v * 3, 2,
        warm ? (g.v > 0.55 ? "#6a7038" : "#465026") : (g.v > 0.55 ? "#3a4c30" : "#1c2a1e"));
      if (g.v > 0.78) {
        this.rect(g.x, g.y - 4, 2, 4, "#4f6a38");
        this.rect(g.x + 4, g.y - 2, 2, 4, "#3e5a34");
      }
    });
    for (const [x, y, size] of [
      [93, 245, 0.9], [133, 328, 1], [61, 430, 1.2], [872, 279, 0.85],
      [897, 372, 1.1], [848, 484, 1], [149, 496, 0.8], [558, 212, 0.8],
      [774, 213, 0.8], [298, 206, 0.7],
    ])
      paintFern(this, x, y, size);
    // A path runs north from the plaza to a little jetty on the lake.
    this.path([[466, 300], [472, 246], [470, 196], [494, 196], [494, 246], [500, 300]], "#5a3a22");
    this.path([[470, 300], [476, 246], [474, 198], [490, 198], [490, 246], [496, 300]], "#b07440");
    for (let y = 204; y < 296; y += 9) {
      this.rect(476 + ((y * 3) % 9), y, 6, 2, "#c08452");
      this.rect(472 + ((y * 5) % 13), y + 4, 4, 2, "#73472a");
    }
    this.rect(470, 176, 26, 22, "#3c201e");
    for (let y = 176; y < 196; y += 5) {
      this.rect(472, y, 22, 4, "#8a4c2a");
      this.rect(472, y, 22, 1, "#b0703e");
    }
    for (const px of [470, 492]) this.rect(px, 172, 4, 26, "#4b241e");
    // Four spokes join the plaza to the cabin doors.
    const paths = cabinPaths();
    for (const route of paths) {
      for (let i = 0; i < route.length - 1; i++) {
        const [ax, ay] = route[i],
          [bx, by] = route[i + 1];
        const angle = Math.atan2(by - ay, bx - ax);
        const nx = Math.sin(angle) * 14,
          ny = Math.cos(angle) * 14;
        this.path(
          [[ax - nx, ay + ny], [bx - nx, by + ny], [bx + nx, by - ny], [ax + nx, ay - ny]],
          "#5a3a22",
        );
      }
    }
    for (const route of paths) {
      for (let i = 0; i < route.length - 1; i++) {
        const [ax, ay] = route[i],
          [bx, by] = route[i + 1];
        for (let t = 0; t < 1; t += 0.5) {
          const x = ax + (bx - ax) * t,
            y = ay + (by - ay) * t;
          this.ellipse(x, y, 30, 22, "#b07440");
          this.rect(x - 6 + r() * 8, y - 4, 6, 2, "#d49a5e");
          this.rect(x - 10, y + 4, 4, 2, "#73472a");
        }
      }
    }
    // A round flagstone plaza with a ring of stones around the campfire.
    this.ellipse(482, 330, 164, 94, "#3e2a20");
    this.ellipse(482, 329, 156, 86, "#6e5444");
    const flag = seeded(5150);
    for (const [rx, ry, count] of [[74, 41, 22], [54, 30, 16], [34, 19, 10]]) {
      for (let k = 0; k < count; k++) {
        const angle = (k / count) * Math.PI * 2 + flag() * 0.2;
        const sx = 482 + Math.cos(angle) * (rx - 9),
          sy = 329 + Math.sin(angle) * (ry - 5);
        this.ellipse(sx, sy, 15 + flag() * 5, 9 + flag() * 2, flag() < 0.5 ? "#8a6c56" : "#7c614e");
        this.rect(sx - 5, sy - 3, 6, 2, "#a8876a");
      }
      for (let a = 0; a < Math.PI * 2; a += 0.06)
        this.rect(482 + Math.cos(a) * rx, 329 + Math.sin(a) * ry, 2, 2, "#4a3428");
    }
    this.ellipse(482, 326, 36, 20, "#5a5050");
    this.ellipse(482, 325, 30, 15, "#2a1a14");
    for (let k = 0; k < 10; k++) {
      const angle = (k / 10) * Math.PI * 2;
      const sx = 482 + Math.cos(angle) * 16,
        sy = 326 + Math.sin(angle) * 9;
      this.rect(sx - 3, sy - 2, 6, 5, "#8a8078");
      this.rect(sx - 3, sy - 2, 4, 2, "#b0a698");
    }
    // Four split-log benches face the fire.
    for (const [lx, ly, tilt] of [[456, 312, -1], [508, 312, 1], [454, 340, 1], [510, 340, -1]]) {
      for (let i = 0; i < 4; i++) {
        this.rect(lx - 9 + i * 4, ly - 4 + i * tilt * 1.5, 6, 9, "#3c201e");
        this.rect(lx - 9 + i * 4, ly - 4 + i * tilt * 1.5, 6, 4, "#8a4c2a");
        this.rect(lx - 9 + i * 4, ly - 4 + i * tilt * 1.5, 6, 2, "#b0703e");
      }
      this.rect(lx - 11, ly - 4 - tilt * 0.5, 4, 8, "#c48a52");
      this.rect(lx - 10, ly - 2 - tilt * 0.5, 2, 4, "#8a5a30");
    }
    // Tiny lit cabins along the far shore, doubled in the still water.
    for (const [cx, offset] of [[91, 0], [188, 4], [392, 1], [573, 2], [786, 0], [893, 3]]) {
      if (cx < 150 || cx > 820) continue;
      const by = 108 + offset;
      this.rect(cx - 8, by - 12, 16, 12, "#2a1a1e");
      this.path([[cx - 11, by - 11], [cx, by - 21], [cx + 11, by - 11]], "#1a1828");
      this.rect(cx - 5, by - 8, 4, 4, "#ffb347");
      this.rect(cx + 2, by - 8, 4, 4, "#ffd27a");
      for (let i = 0; i < 6; i++)
        this.rect(cx - 4 + ((i * 3) % 5) - 2, by + 3 + i * 4, 6 - (i % 3), 2, i % 2 ? "#a8683a" : "#e0a060");
    }
    for (const [cx, cy] of [[300, 112], [340, 110], [636, 111], [700, 113], [520, 110], [250, 113]]) {
      this.rect(cx, cy - 4, 2, 2, "#ffc870");
      this.rect(cx, cy + 4, 2, 6, "#9a6a40");
    }
    this.riverBanks();
    // Tiny garden by the cabin: squash, flowers, and a crooked fence.
    this.rect(790, 384, 48, 62, "#1f2a1c");
    for (let y = 392; y < 443; y += 16)
      for (let x = 797; x < 833; x += 14) {
        this.rect(x - 3, y, 12, 10, "#4a3424");
        this.rect(x + 2, y - 3, 3, 6, "#68804a");
        this.rect(x - 1, y + 1, 8, 6, "#c0702e");
        this.rect(x + 2, y + 1, 2, 5, "#e09040");
      }
    for (let x = 785; x < 841; x += 14) {
      this.rect(x, 446, 3, 13, "#5a3422");
      this.rect(x, 448, 14, 3, "#8a5432");
    }
    // Flowers, pebbles and clusters of mushrooms.
    for (let i = 0; i < 95; i++) {
      const x = 160 + r() * 670,
        y = 165 + r() * 337;
      if (!canWalk(x, y) || nearbyArea(x, y) || Math.hypot((x - 482) / 1.8, y - 329) < 50)
        continue;
      if (i % 4 === 0) {
        this.rect(x, y, 3, 6, "#5a6a3a");
        this.rect(x - 3, y - 2, 9, 4, "#c0603e");
        this.rect(x, y - 2, 3, 2, "#f0a070");
      } else if (i % 3 === 0) {
        this.rect(x, y, 2, 6, "#5a7040");
        this.rect(x - 2, y - 2, 6, 4, "#f4e6c0");
        this.rect(x, y - 2, 2, 2, "#f0b040");
      } else {
        this.rect(x, y, 8, 4, "#4a4a3e");
        this.rect(x + 2, y - 2, 5, 2, "#6e6a58");
      }
    }
    for (const [cx, cy] of [[367, 329], [597, 344], [383, 422], [598, 434], [190, 452], [773, 461], [420, 380]]) {
      this.ellipse(cx, cy + 3, 29, 12, "#334826");
      for (let flower = 0; flower < 6; flower++) {
        const fx = cx + (r() - 0.5) * 27, fy = cy + (r() - 0.5) * 9;
        this.rect(fx, fy - 4, 2, 8, "#3e6a3a");
        this.rect(fx - 2, fy - 5, 6, 2, flower % 3 ? "#fff1cb" : "#f0a0c0");
        this.rect(fx, fy - 7, 2, 6, flower % 3 ? "#fff1cb" : "#f0a0c0");
        this.rect(fx, fy - 5, 2, 2, "#edb944");
      }
    }
    for (let x = 327; x < 420; x += 20) {
      this.rect(x, 461, 4, 20, "#5a3422");
      this.rect(x, 464, 20, 3, "#8a5432");
      this.rect(x, 474, 20, 3, "#4b2a1c");
    }
    this.rect(564, 453, 45, 6, "#8a5432");
    this.rect(566, 444, 41, 7, "#6a3a24");
    this.rect(568, 459, 4, 10, "#3c201e");
    this.rect(602, 459, 4, 10, "#3c201e");
    // Undergrowth: tufts, clover and pebbles across the green, shrubs along
    // every cabin wall and low scrub where the clearing meets the forest.
    const pathPoints = paths.flat();
    const onPath = (x, y) =>
      pathPoints.some(([px, py]) => Math.abs(px - x) < 17 && Math.abs(py - y) < 15) ||
      Math.hypot((x - 482) / 1.8, y - 329) < 48 ||
      (x > 462 && x < 504 && y < 302);
    const under = seeded(6107);
    for (let i = 0; i < 900; i++) {
      const x = 140 + under() * 700,
        y = 196 + under() * 300;
      if (onPath(x, y) || y < lakeShore(x) + 6) continue;
      const kind = under();
      if (kind < 0.55) {
        this.rect(x, y, 2, 4, "#4e6a34");
        this.rect(x + 2, y - 2, 2, 6, "#6a8040");
        this.rect(x + 4, y, 2, 4, "#3e5a2e");
      } else if (kind < 0.75) {
        this.rect(x, y, 6, 2, "#3e5a2e");
        this.rect(x + 1, y - 2, 4, 2, "#5a7a3a");
      } else if (kind < 0.88) {
        this.rect(x, y, 4, 2, "#5a5a54");
        this.rect(x, y - 2, 2, 2, "#7e7a6e");
      } else if (kind < 0.95) {
        this.rect(x, y, 2, 2, ["#e8d8a0", "#d08aa8", "#a8b8e8"][i % 3]);
        this.rect(x + 2, y + 2, 2, 2, "#3e5a2e");
      } else {
        this.rect(x, y, 4, 4, "#8a6a4a");
        this.rect(x, y - 2, 4, 2, "#c06040");
      }
    }
    const shrub = (x, y, size, bloom) => {
      this.ellipse(x, y + 2, size + 6, size * 0.5, "#141c12");
      this.ellipse(x, y - size * 0.2, size, size * 0.7, "#24391f");
      this.ellipse(x - size * 0.18, y - size * 0.35, size * 0.62, size * 0.45, "#355a2c");
      this.rect(x - size * 0.3, y - size * 0.55, size * 0.3, 2, "#5a7e3e");
      if (bloom) for (let k = 0; k < 3; k++) this.rect(x - size * 0.3 + k * size * 0.25, y - size * 0.4 + (k % 2) * 4, 2, 2, bloom);
    };
    for (const d of destinations) {
      const front = d.y + d.h + 2;
      for (const sx of [d.x + 8, d.x + d.w - 8]) {
        if (Math.abs(sx - d.doorX) < 30) continue;
        shrub(sx, front, 14, d.id === "gamedev" ? "#d08ad8" : "#f0c060");
      }
      shrub(d.x - 14, d.y + d.h - 10, 18, null);
      shrub(d.x + d.w + 16, d.y + d.h - 8, 16, "#e88a6a");
    }
    for (const [x, y, size] of [
      [168, 296, 16], [176, 340, 20], [164, 392, 18], [170, 452, 16],
      [806, 300, 18], [812, 350, 16], [806, 468, 20], [250, 272, 14],
      [420, 270, 16], [560, 274, 14], [770, 276, 16], [224, 484, 18],
      [282, 488, 14], [690, 486, 16], [748, 488, 18],
    ])
      shrub(x, y, size, size > 17 ? null : "#e8d8a0");
    // A finger-post beside the north path and a notice board by Career.
    this.rect(531, 240, 4, 32, "#3c201e");
    this.rect(514, 240, 30, 10, "#5a3020");
    this.rect(516, 241, 26, 7, "#a0613b");
    this.rect(520, 253, 26, 9, "#5a3020");
    this.rect(522, 254, 22, 6, "#8a4c2a");
    this.rect(518, 243, 18, 2, "#5a3020");
    this.rect(526, 256, 14, 2, "#3c201e");
    this.rect(600, 252, 4, 22, "#3c201e");
    this.rect(624, 252, 4, 22, "#3c201e");
    this.rect(596, 232, 36, 26, "#3c201e");
    this.rect(598, 234, 32, 22, "#8a5432");
    this.rect(601, 237, 9, 10, "#efe2c0");
    this.rect(612, 238, 8, 7, "#d8c8a0");
    this.rect(621, 237, 7, 12, "#efe2c0");
    this.rect(604, 249, 10, 5, "#c8b890");
  }
  ellipse(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    for (let yy = -h / 2; yy <= h / 2; yy += 2) {
      const span = (w / 2) * Math.sqrt(Math.max(0, 1 - (yy / (h / 2)) ** 2));
      this.cell(x - span, y + yy, span * 2, 2);
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
      y = Math.round(t.y / 2) * 2,
      s = t.s,
      height = Math.round((68 * s) / 2) * 2;
    if (part !== "crown") {
      this.ellipse(x, y + 2, 58 * s, 12, "#121c18");
      this.rect(x - 5 * s, y - 30 * s, 10 * s, 34 * s, "#3c201e");
      this.rect(x - 2 * s, y - 27 * s, 3 * s, 29 * s, "#844024");
      this.rect(x - 8 * s, y - 3, 5 * s, 6, "#5d4630");
      this.rect(x + 4 * s, y - 5, 5 * s, 8, "#493e2a");
    }
    if (part === "base") return;
    this.ctx.save();
    try {
      const sway = this.reduced ? 0 : Math.round(Math.sin(this.time * 0.8 + t.x * 0.017) * 1.2) * 2;
      this.ctx.translate(sway, 0);
      const rand = seeded(Math.round(t.x * 47 + t.y));
      if (t.far) {
        // Distant spruce read as dark silhouettes against the water.
        const top = y - height - 14,
          span = height + 8;
        const outline = [[x, top]];
        for (let tier = 0; tier < 4; tier++) {
          const reach = (8 + tier * 6) * s,
            by = top + (span * (tier + 1)) / 4;
          outline.push([x - reach, by], [x - reach * 0.6, by + 2]);
        }
        this.path([...outline, ...outline.slice().reverse().map(([tx, ty]) => [2 * x - tx, ty])], "#121a26");
        this.path([[x, top + 2], [x - 6 * s, top + span * 0.5], [x - 2 * s, top + span]], "#1c2a30");
        this.rect(x - s, top + 4, 2, span * 0.6, "#24343a");
      } else if (t.tone < 0.8) {
        // Five angular, overlapping tiers make the reference's dense spruce.
        // The crown fits the existing footprint and keeps its cached sway.
        const top = y - height - 18,
          span = height + 10,
          blue = t.tone < 0.45,
          shadow = blue ? "#0c1a22" : "#0f1f1c",
          body = blue ? "#1a3530" : "#203d2c",
          light = blue ? "#2e5a40" : "#3c6638",
          rim = blue ? "#5a8048" : "#8a9446";
        const left = [[x, top]];
        for (let tier = 0; tier < 5; tier++) {
          const reach = (9 + tier * 6) * s,
            by = top + span * (tier + 1) / 5;
          left.push([x - reach, by - 2], [x - reach * 0.64, by + 2]);
        }
        this.path([...left, ...left.slice().reverse().map(([tx, ty]) => [2 * x - tx, ty])], shadow);
        for (let tier = 0; tier < 5; tier++) {
          const reach = (8 + tier * 6) * s,
            ty = top + span * tier / 5,
            by = Math.min(y - 8, top + span * (tier + 1) / 5);
          this.path([[x - s, ty + 2], [x - reach + 2, by - 3],
            [x - reach * 0.69, by - 3], [x - reach * 0.76, by], [x + 2 * s, by]], body);
          this.path([[x - s, ty + 3], [x - reach * 0.65, by - 5],
            [x - reach * 0.33, by - 4], [x - 3 * s, by - 2]], light);
          this.path([[x + 3 * s, ty + 7], [x + reach - 3, by - 2],
            [x + reach * 0.65, by], [x + 4 * s, by - 1]], "#13281f");
          for (let tuft = 0; tuft < 3; tuft++) {
            const lx = x - reach * (0.73 - tuft * 0.22),
              ly = by - 4 - (tuft % 2) * 3 * s;
            this.rect(lx, ly, (4 + rand() * 3) * s, 2, tuft === 0 ? rim : light);
            this.rect(lx + 2 * s, ly + 2, 3 * s, 3 * s, body);
          }
        }
        this.rect(x - 2 * s, top + 4, 3 * s, 6 * s, light);
      } else {
        // Faceted olive leaf clusters replace the old circular blobs.
        const dark = "#1a3224", mid = "#3a5a30", light = "#7a8a40";
        const cluster = (cx, cy, width, tall, tone) => {
          const w = width * s, h = tall * s;
          this.path([[cx - w * 0.25, cy - h * 0.5], [cx + w * 0.18, cy - h * 0.5],
            [cx + w * 0.18, cy - h * 0.38], [cx + w * 0.4, cy - h * 0.38],
            [cx + w * 0.5, cy - h * 0.15], [cx + w * 0.42, cy + h * 0.25],
            [cx + w * 0.2, cy + h * 0.25], [cx + w * 0.2, cy + h * 0.43],
            [cx - w * 0.25, cy + h * 0.43], [cx - w * 0.25, cy + h * 0.3],
            [cx - w * 0.5, cy + h * 0.3], [cx - w * 0.5, cy - h * 0.15],
            [cx - w * 0.36, cy - h * 0.15], [cx - w * 0.36, cy - h * 0.38]], tone);
        };
        for (const [dx, dy, w, h] of [[-18, -39, 44, 42], [19, -41, 42, 40], [0, -61, 44, 36], [0, -28, 51, 33]])
          cluster(x + dx * s, y + dy * s, w, h, dark);
        for (const [dx, dy, w, h] of [[-20, -43, 33, 31], [15, -47, 35, 30], [-3, -64, 34, 29], [-1, -32, 39, 23]])
          cluster(x + dx * s, y + dy * s, w, h, mid);
        for (let leaf = 0; leaf < 30; leaf++) {
          const lx = (rand() - 0.5) * 56 * s,
            ly = -28 * s - rand() * 45 * s;
          if (Math.abs(lx) + Math.abs(ly + 49 * s) * 0.4 > 30 * s) continue;
          this.rect(x + lx, y + ly, (4 + rand() * 5) * s, 3 * s, leaf % 3 ? light : "#b2a35c");
          this.rect(x + lx + 2 * s, y + ly + 3 * s, 4 * s, 2, dark);
        }
      }
    } finally {
      this.ctx.restore();
    }
  }
  // Light comes from real sources only: while a static scene is painted,
  // each source is recorded for the light map; nothing is sprayed on top.
  glow(x, y, size, color = "#ffb544") {
    this.light({ kind: "point", x, y, r: size * 1.1, color });
  }
  light(source) {
    this.lightSink?.push(source);
  }
  building(d) {
    // Rich exterior art is cached like the trees; the original live door,
    // lantern flicker and player-aware billboard stay outside the cache.
    if (!this.cabinSprites) this.cabinSprites = new Map();
    let sprite = this.cabinSprites.get(d.id);
    if (!sprite) {
      const left = Math.floor((d.x - 44) / 2) * 2,
        top = Math.floor((d.y - 84) / 2) * 2,
        width = Math.ceil((d.w + 90) / 2) * 2,
        height = Math.ceil((d.h + 104) / 2) * 2,
        canvas = document.createElement("canvas"), main = this.ctx;
      canvas.width = width / 2;
      canvas.height = height / 2;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.scale(0.5, 0.5);
      ctx.translate(-left, -top);
      this.ctx = ctx;
      try { this.paintCabin(d); } finally { this.ctx = main; }
      sprite = { canvas, left, top, width, height };
      this.cabinSprites.set(d.id, sprite);
    }
    this.ctx.drawImage(sprite.canvas, sprite.left, sprite.top, sprite.width, sprite.height);
    const { y, h, id } = d, doorY = y + h - 42;
    if (id === "about" && this.doorOpen > 0) {
      const leaf = Math.round((1 - this.doorOpen) * 10) * 2;
      this.rect(d.doorX - 10, doorY + 4, 20, 38, "#f0c063");
      this.rect(d.doorX - 8, doorY + 6, 16, 34, "#ffdc8e");
      this.rect(d.doorX - 10, doorY + 32, 20, 10, "#e3a64f");
      this.rect(d.doorX - 10, doorY + 4, Math.max(4, leaf), 38, "#7c5c36");
    }
    this.rooftopSign(d);
  }
  // Shared cabin parts in the reference's dark timber and amber-glass palette.
  plankWall(x, y, w, h, base = "#6a3120", seam = "#3c201e", light = "#844024") {
    this.rect(x, y, w, h, base);
    const rand = seeded(Math.round(x * 13 + y));
    for (let yy = y + 5; yy < y + h; yy += 6) {
      this.rect(x, yy, w, 2, seam);
      this.rect(x, yy + 2, w, 1, light);
      for (let k = 0; k < w / 22; k++)
        this.rect(x + rand() * (w - 8), yy - 3, 2, 3, seam);
    }
  }
  roofPlane(xl, xr, eave, ridge, rl, rr, tone) {
    const [dark, body, light, rim] = tone;
    this.path([[xl - 2, eave + 4], [rl - 2, ridge - 3], [rr + 2, ridge - 3], [xr + 2, eave + 4]], dark);
    this.path([[xl, eave], [rl, ridge], [rr, ridge], [xr, eave]], body);
    for (let yy = ridge + 4, row = 0; yy < eave; yy += 6, row++) {
      const t = (yy - ridge) / (eave - ridge),
        left = rl + (xl - rl) * t,
        right = rr + (xr - rr) * t;
      this.rect(left, yy, right - left, 2, dark);
      for (let xx = left + (row % 2 ? 6 : 1); xx < right - 6; xx += 12)
        this.rect(xx, yy + 2, 8, 2, light);
    }
    this.rect(xl - 2, eave, xr - xl + 4, 3, rim);
    this.rect(xl - 2, eave + 3, xr - xl + 4, 3, dark);
  }
  litWindow(x, y, w, h, frame = "#3c201e") {
    this.rect(x - 3, y - 3, w + 6, h + 6, frame);
    this.rect(x, y, w, h, "#f08a2c");
    this.rect(x + 1, y + 1, w - 2, h - 2, "#ffb347");
    this.rect(x + 2, y + 2, w / 2 - 3, h - 4, "#ffd77a");
    this.rect(x + 2, y + 2, 2, h / 2, "#fff1b8");
    this.rect(x + w / 2 - 1, y, 2, h, frame);
    this.rect(x, y + h / 2 - 1, w, 2, frame);
    this.rect(x - 4, y + h + 2, w + 8, 3, "#a0613b");
  }
  crate(x, y, size = 14) {
    this.rect(x, y, size, size, "#3c201e");
    this.rect(x + 1, y + 1, size - 2, size - 2, "#97502b");
    this.rect(x + 1, y + 1, size - 2, 2, "#c27a44");
    this.rect(x + 1, y + size / 2 - 1, size - 2, 2, "#5c2d1f");
    this.rect(x + size / 2 - 1, y + 1, 2, size - 2, "#5c2d1f");
  }
  barrel(x, y) {
    this.rect(x, y, 14, 18, "#3c201e");
    this.rect(x + 1, y + 1, 12, 16, "#844024");
    this.rect(x + 3, y + 1, 4, 16, "#a0613b");
    for (const yy of [y + 3, y + 13]) this.rect(x, yy, 14, 2, "#4a4048");
  }
  deck(x, y, w, h) {
    this.rect(x, y, w, h, "#3c201e");
    for (let yy = y + 1; yy < y + h - 1; yy += 5) {
      this.rect(x + 1, yy, w - 2, 4, "#7a3c22");
      this.rect(x + 1, yy, w - 2, 1, "#a0613b");
    }
    for (let xx = x + 4; xx < x + w; xx += 24) this.rect(xx, y + h, 4, 8, "#2c181b");
  }
  paintCabin(d) {
    const { x, y, w, h, id } = d, cx = x + w / 2, gx = d.doorX,
      doorY = y + h - 42;
    this.ellipse(cx, y + h + 6, w + 40, 22, "#141810");
    if (id === "gamedev" || id === "about") this.deck(x - 26, y + h - 8, w + 52, 20);
    const tones = {
      projects: ["#24151a", "#4a3434", "#655048", "#a0613b"],
      career: ["#24151a", "#4b3030", "#6a4a40", "#a0613b"],
      gamedev: ["#1e1424", "#3e2a40", "#5e4260", "#a0613b"],
      about: ["#24151a", "#4a2e2a", "#68443a", "#a0613b"],
    }[id];
    if (id === "career") {
      // A tall timber-framed hall: steep hipped roof, stone chimney and a
      // front gable carrying the shield.
      this.rect(x + w - 4, y - 62, 24, 104, "#2a2a36");
      for (let yy = y - 60; yy < y + 40; yy += 7)
        for (let xx = x + w - 2; xx < x + w + 16; xx += 7) {
          this.rect(xx + ((yy / 7) % 2 ? 3 : 0), yy, 6, 5, (xx + yy) % 3 ? "#6a6474" : "#827c8c");
        }
      this.rect(x + w - 6, y - 66, 28, 6, "#9a94a4");
      this.rect(x + w - 6, y - 60, 28, 2, "#4a4658");
      this.plankWall(x - 2, y + 44, w + 4, h - 44, "#b49a7c", "#5c4636", "#d0b896");
      for (const px of [x - 2, x + 26, x + w - 30, x + w - 2])
        this.rect(px, y + 44, 6, h - 44, "#4b241e");
      this.rect(x - 2, y + 44, w + 4, 5, "#4b241e");
      this.rect(x - 2, y + 82, w + 4, 4, "#4b241e");
      this.roofPlane(x - 18, x + w + 18, y + 46, y - 49, x + 30, x + w - 30, tones);
      // Dormer windows peep out of the roof.
      for (const wx of [x + 14, x + w - 30]) {
        this.path([[wx - 6, y + 22], [wx + 8, y + 6], [wx + 22, y + 22]], "#2c1a1a");
        this.rect(wx - 2, y + 18, 20, 18, "#3c201e");
        this.litWindow(wx + 2, y + 21, 12, 12);
      }
      this.path([[gx - 38, y + 52], [gx, y + 4], [gx + 38, y + 52]], "#24151a");
      this.path([[gx - 32, y + 50], [gx, y + 10], [gx + 32, y + 50]], "#c2a684");
      this.rect(gx - 1, y + 12, 2, 38, "#4b241e");
      this.path([[gx - 40, y + 53], [gx, y + 3], [gx + 40, y + 53], [gx + 34, y + 54], [gx, y + 11], [gx - 34, y + 54]], "#5c2d1f");
      this.path([[gx - 40, y + 51], [gx, y + 3], [gx + 40, y + 51], [gx + 37, y + 51], [gx, y + 7], [gx - 37, y + 51]], "#a0613b");
      this.cabinEmblem(d, gx, y + 32);
      for (const wx of [x + 6, x + w - 26]) this.litWindow(wx, y + h - 52, 18, 24);
      for (const wx of [x + 34, x + w - 50]) this.litWindow(wx, y + h - 48, 14, 18);
      // Flower boxes under the lower windows.
      for (const wx of [x + 4, x + w - 28]) {
        this.rect(wx, y + h - 22, 22, 6, "#5c2d1f");
        for (let k = 0; k < 5; k++) {
          this.rect(wx + 1 + k * 4, y + h - 26, 3, 4, "#3e6a34");
          this.rect(wx + 2 + k * 4, y + h - 28, 2, 2, k % 2 ? "#f0d070" : "#e07050");
        }
      }
    } else {
      const eave = y + 36,
        tone = tones;
      const wallTop = y + 30;
      const wallBase = id === "gamedev" ? "#4b2a2e" : id === "projects" ? "#6a3120" : "#7a3a22";
      this.plankWall(x - 2, wallTop, w + 4, h - 30, wallBase,
        id === "gamedev" ? "#2c1820" : "#3c201e",
        id === "gamedev" ? "#5e3640" : "#97502b");
      for (const px of [x - 4, x + w - 2]) {
        this.rect(px, wallTop, 7, h - 30, "#3c201e");
        this.rect(px + 1, wallTop, 2, h - 30, "#844024");
      }
      this.roofPlane(x - 18, x + w + 18, eave, y - 14, cx - 6, cx + 6, tone);
      // The gable end over the door, in vertical boards.
      this.path([[gx - 40, eave + 2], [gx, y - 4], [gx + 40, eave + 2]], "#24151a");
      this.path([[gx - 34, eave], [gx, y + 3], [gx + 34, eave]], id === "gamedev" ? "#3a2230" : "#5c2d1f");
      for (let xx = gx - 30; xx < gx + 30; xx += 6) {
        const top = y + 4 + Math.abs(xx + 3 - gx) * 0.86;
        this.rect(xx, top, 2, eave - top, id === "gamedev" ? "#2a1824" : "#3c201e");
      }
      this.path([[gx - 42, eave + 3], [gx, y - 6], [gx + 42, eave + 3], [gx + 36, eave + 4], [gx, y + 1], [gx - 36, eave + 4]], "#4b241e");
      this.path([[gx - 42, eave + 1], [gx, y - 6], [gx + 42, eave + 1], [gx + 39, eave + 1], [gx, y - 2], [gx - 39, eave + 1]], "#a0613b");
      this.rect(x - 6, eave + 6, w + 12, 4, "#4b241e");
      this.rect(x - 6, eave + 6, w + 12, 1, "#a0613b");
      if (id === "gamedev") this.cabinEmblem(d, gx, y + 22);
    }
    // Door: dark planks, iron straps and a lit pane.
    {
      this.rect(gx - 14, doorY - 4, 28, 46, "#24151a");
      this.rect(gx - 12, doorY - 2, 24, 44, "#a0613b");
      this.rect(gx - 10, doorY + 2, 20, 40, "#5c2d1f");
      for (let xx = gx - 8; xx < gx + 9; xx += 5) this.rect(xx, doorY + 4, 2, 36, "#3c201e");
      for (const yy of [doorY + 10, doorY + 30]) this.rect(gx - 10, yy, 20, 2, "#2a2228");
      this.rect(gx - 5, doorY + 6, 10, 9, "#ffb347");
      this.rect(gx - 4, doorY + 7, 4, 7, "#ffe9a0");
      this.rect(gx + 5, doorY + 22, 3, 3, "#f0c060");
      this.rect(gx - 18, y + h, 36, 4, "#8a7464");
      this.rect(gx - 22, y + h + 4, 44, 4, "#6a5a50");
      this.rect(gx - 20, y + h + 4, 40, 1, "#a8968a");
    }
    // Wall lamps either side of the door.
    for (const sx of [gx - 19, gx + 19]) {
      this.rect(sx - 2, doorY + 3, 4, 3, "#24151a");
      this.rect(sx - 4, doorY + 6, 8, 12, "#24151a");
      this.rect(sx - 3, doorY + 7, 6, 10, "#ffb347");
      this.rect(sx - 1, doorY + 8, 2, 7, "#fff1b8");
    }
    if (id === "projects") {
      // An open workshop front, a dormer with an arched window and a brass
      // wheel on the ridge.
      for (const wx of [x + 10, x + w - 34]) this.litWindow(wx, y + h - 50, 22, 22);
      this.rect(x + 40, y + h - 56, 34, 52, "#24151a");
      this.rect(x + 42, y + h - 54, 30, 50, "#c07038");
      for (const yy of [y + h - 46, y + h - 32]) {
        this.rect(x + 42, yy, 30, 3, "#5c2d1f");
        for (let k = 0; k < 6; k++)
          this.rect(x + 44 + k * 5, yy - 5, 3, 5, ["#e0c070", "#6aa0c0", "#c05040", "#8ab060"][k % 4]);
      }
      this.rect(x + 40, y + h - 16, 34, 6, "#5c2d1f");
      this.rect(x + 42, y + h - 18, 30, 2, "#a0613b");
      this.rect(x + 22, y - 2, 30, 34, "#24151a");
      this.rect(x + 24, y + 2, 26, 30, "#7a6a68");
      this.rect(x + 24, y + 2, 26, 3, "#a8948a");
      this.ellipse(x + 37, y - 2, 30, 14, "#4a3434");
      this.ellipse(x + 37, y - 3, 24, 10, "#6a5048");
      this.ellipse(x + 37, y + 14, 16, 18, "#24151a");
      this.ellipse(x + 37, y + 14, 12, 14, "#ffb347");
      this.rect(x + 34, y + 10, 4, 10, "#ffe9a0");
      this.rect(x + 36, y + 8, 2, 16, "#3c201e");
      this.rect(x + 31, y + 14, 12, 2, "#3c201e");
      const wx = x + w + 2, wy = y + 12;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        this.rect(wx + Math.cos(a) * 13 - 2, wy + Math.sin(a) * 13 - 2, 4, 4, "#c07a3a");
        for (let k = 3; k < 12; k += 3) this.rect(wx + Math.cos(a) * k - 1, wy + Math.sin(a) * k - 1, 2, 2, "#8a4c24");
      }
      this.ellipse(wx, wy, 20, 20, "#5c2d1f");
      this.ellipse(wx, wy, 14, 14, "#ffc060");
      this.rect(wx - 1, wy - 7, 2, 14, "#8a4c24");
      this.rect(wx - 7, wy - 1, 14, 2, "#8a4c24");
      this.crate(x - 30, y + h - 26, 16);
      this.crate(x - 24, y + h - 40, 14);
      this.crate(x + w + 10, y + h - 22, 16);
      this.barrel(x + w + 12, y + h - 40);
      this.rect(x - 34, y + h - 8, 28, 4, "#5c2d1f");
    }
    if (id === "gamedev") {
      // Open arcade front: three cabinets glowing in the magenta dusk.
      this.rect(x + 18, y + 44, w - 36, h - 44, "#1a0f24");
      this.rect(x + 20, y + 46, w - 40, h - 48, "#3a1a46");
      this.rect(x + 20, y + h - 10, w - 40, 8, "#5a2a5e");
      for (let k = 0; k < 3; k++) {
        const ax = x + 26 + k * 26;
        if (Math.abs(ax + 8 - gx) < 14) continue;
        this.rect(ax, y + 52, 18, 34, "#14101e");
        this.rect(ax + 2, y + 54, 14, 12, ["#4ad0ff", "#ff5ad8", "#ffd060"][k]);
        this.rect(ax + 3, y + 55, 6, 4, "#ffffff");
        this.rect(ax + 1, y + 68, 16, 6, "#e04ac0");
        this.rect(ax + 4, y + 70, 2, 2, "#ffe060");
        this.rect(ax + 10, y + 70, 2, 2, "#60ffd0");
      }
      this.rect(gx - 14, doorY - 4, 28, 46, "#1a0f24");
      this.rect(gx - 10, doorY, 20, 42, "#5a2a6e");
      this.rect(gx - 8, doorY + 4, 16, 14, "#ff7ae0");
      this.litWindow(x + w - 26, y + 50, 16, 20);
      this.rect(x - 22, y + 40, 4, 40, "#3c201e");
      this.rect(x - 26, y + 50, 12, 14, "#24151a");
      this.rect(x - 24, y + 52, 8, 10, "#ff5ad8");
      this.rect(x - 22, y + 54, 4, 6, "#ffd0f4");
      this.barrel(x + w + 6, y + h - 22);
      this.rect(x + w + 24, y + h - 46, 22, 20, "#24151a");
      this.rect(x + w + 26, y + h - 44, 18, 16, "#2a3a6a");
      this.rect(x + w + 30, y + h - 40, 10, 8, "#f0a040");
      this.rect(x + w + 33, y + h - 26, 4, 20, "#3c201e");
    }
    if (id === "about") {
      // A reading porch: bookshelves, a lit window and ivy on the eaves.
      this.rect(x + 6, y + 46, 46, h - 50, "#24151a");
      this.rect(x + 8, y + 48, 42, h - 54, "#8a4a26");
      for (let row = 0; row < 3; row++) {
        const yy = y + 52 + row * 10;
        this.rect(x + 8, yy + 7, 42, 2, "#3c201e");
        for (let k = 0; k < 10; k++)
          this.rect(x + 9 + k * 4, yy + (k % 3), 3, 7 - (k % 3), ["#c05040", "#4a7ab0", "#e0c070", "#5a9a5a", "#a05aa0"][(k + row) % 5]);
      }
      this.litWindow(x + w - 34, y + h - 52, 22, 26);
      this.rect(x + w - 56, y + 48, 18, 32, "#24151a");
      this.rect(x + w - 54, y + 50, 14, 28, "#6a3420");
      for (let k = 0; k < 3; k++) this.rect(x + w - 54, y + 56 + k * 8, 14, 2, "#3c201e");
      for (let k = 0; k < 9; k++) this.rect(x + w - 53 + (k % 3) * 4, y + 51 + Math.floor(k / 3) * 8, 3, 5, ["#e0c070", "#c05040", "#4a7ab0"][k % 3]);
      this.rect(x + w - 34, y - 10, 18, 22, "#24151a");
      this.rect(x + w - 32, y - 6, 14, 18, "#7a3a22");
      this.rect(x + w - 28, y - 2, 6, 6, "#ffc060");
      this.path([[x + w - 37, y - 8], [x + w - 25, y - 18], [x + w - 13, y - 8]], "#3a2422");
      for (let step = 0; step < 22; step++) {
        const vx = x - 14 + step * ((w + 28) / 22),
          vy = y + 40 + ((step * 5) % 7);
        this.rect(vx, vy, 4, 6 + (step % 3) * 3, "#2a4a2a");
        this.rect(vx - 2, vy + 2, 6, 4, "#4e7a3a");
        this.rect(vx, vy, 3, 2, "#8aa04a");
      }
      this.rect(x + w + 4, y + h - 18, 26, 14, "#5c2d1f");
      this.rect(x + w + 6, y + h - 16, 22, 3, "#a0613b");
      for (let k = 0; k < 6; k++) {
        this.rect(x + w + 6 + k * 4, y + h - 24, 3, 6, "#3e6a34");
        this.rect(x + w + 6 + k * 4, y + h - 27, 3, 3, "#f0d040");
      }
      this.rect(x - 22, y + h - 18, 16, 3, "#a0613b");
      this.rect(x - 20, y + h - 15, 3, 10, "#5c2d1f");
      this.rect(x - 11, y + h - 15, 3, 10, "#5c2d1f");
      this.ellipse(x - 14, y + h - 26, 12, 12, "#3a6aa0");
      this.rect(x - 18, y + h - 29, 6, 4, "#6aa060");
      this.rect(x - 15, y + h - 20, 2, 2, "#c0a060");
    }
  }
  cabinEmblem(d, x, y) {
    if (d.id === "projects") {
      // Crossed hammer and pick, built as hard-edged pixel diagonals.
      for (let i = 0; i < 8; i++) {
        this.rect(x - 10 + i * 2, y + 8 - i * 2, 3, 3, "#efe1b4");
        this.rect(x - 8 + i * 2, y - 7 + i * 2, 3, 3, "#dec083");
      }
      this.rect(x + 3, y - 9, 8, 4, "#fff1c0");
      this.rect(x + 7, y - 10, 3, 7, "#e3c791");
      this.rect(x - 11, y - 10, 8, 4, "#f1e1b2");
      this.rect(x - 14, y - 7, 4, 5, "#d1b785");
    } else if (d.id === "career") {
      this.path([[x - 11, y - 12], [x + 11, y - 12], [x + 11, y + 5], [x, y + 14], [x - 11, y + 5]], "#e6b94f");
      this.path([[x - 8, y - 9], [x + 8, y - 9], [x + 8, y + 3], [x, y + 10], [x - 8, y + 3]], "#245597");
      this.rect(x - 1, y - 7, 3, 14, "#ffe085");
      this.rect(x - 5, y - 2, 11, 3, "#ffe085");
    } else if (d.id === "gamedev") {
      // A neon gamepad outline glows on the gable.
      const points = [[x - 11, y - 8], [x - 5, y - 8], [x - 3, y - 5], [x + 3, y - 5], [x + 5, y - 8], [x + 11, y - 8], [x + 16, y + 7], [x + 11, y + 9], [x + 5, y + 3], [x - 5, y + 3], [x - 11, y + 9], [x - 16, y + 7]];
      this.path(points.map(([px, py]) => [x + (px - x) * 1.12, y + (py - y) * 1.15]), "#2a6ad0");
      this.path(points, "#7ae0ff");
      this.path(points.map(([px, py]) => [x + (px - x) * 0.8, y + (py - y) * 0.68]), "#1a1430");
      this.rect(x - 9, y - 1, 7, 2, "#7ae0ff");
      this.rect(x - 7, y - 3, 2, 6, "#7ae0ff");
      this.rect(x + 6, y - 3, 3, 3, "#ff6ad8");
      this.rect(x + 9, y, 3, 3, "#ffd060");
    } else {
      this.path([[x - 10, y + 7], [x - 10, y - 3], [x - 6, y - 10], [x + 6, y - 10], [x + 10, y - 3], [x + 10, y + 7]], "#5f422d");
      this.path([[x - 7, y + 6], [x - 7, y - 2], [x - 4, y - 7], [x + 4, y - 7], [x + 7, y - 2], [x + 7, y + 6]], "#ffd164");
      this.rect(x - 1, y - 7, 2, 13, "#a47739");
      this.rect(x - 7, y - 1, 14, 2, "#a47739");
      this.rect(x - 5, y - 5, 3, 3, "#fff4be");
    }
  }
  rooftopSign(d) {
    if (!this.signSprites) this.signSprites = new Map();
    const sign = cabinSign(d);
    let sprite = this.signSprites.get(d.id);
    if (!sprite) {
      // Posts reach down to the roof; moss tufts rise above the board.
      const foot = Math.max(...sign.posts.map((px) => roofLine(d, px - d.x - d.w / 2))) + 4;
      const left = sign.x - 4,
        top = sign.y - 14,
        width = sign.w + 8,
        height = Math.ceil((Math.max(foot, sign.y + sign.h + 16) - top) / 2) * 2 + 2;
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
    px(1, 1, cols - 2, 1, "#b0703e");
    px(1, 2, 1, rows - 3, "#8a4c2a");
    px(cols - 2, 2, 1, rows - 3, "#3c201e");
    px(2, rows - 2, cols - 3, 1, "#3c201e");
    // Plank face, brightest under the two lamps and dimming toward the foot.
    px(2, 2, cols - 4, rows - 4, "#5c2d1f");
    px(2, 2, cols - 4, 3, "#86442a");
    px(2, 5, cols - 4, 3, "#6e3622");
    for (const lamp of [6, cols - 8]) px(lamp - 3, 2, 8, 2, "#a0582e");
    const rand = seeded(d.x * 7 + d.y);
    for (const seam of [5, 9]) {
      px(2, seam, cols - 4, 1, "#4b241e");
      const joint = 4 + Math.floor(rand() * (cols - 10));
      px(joint, seam - 3, 1, 3, "#4b241e");
    }
    for (let i = 0; i < cols / 3; i++)
      px(3 + Math.floor(rand() * (cols - 7)), 3 + Math.floor(rand() * (rows - 6)), 2, 1, "#6e3622");
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
                  ? px(cursor + gx, 4 + gy, 1, 1, gy < 2 ? "#fffbea" : gy < 5 ? "#ffe7b4" : "#f4c886")
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
    // Two gooseneck lamps lean over the top edge and light the lettering.
    for (const [lx, dir] of [[x + 6, 1], [x + w - 8, -1]]) {
      this.rect(lx, y - 10, 2, 10, "#1b1418");
      this.rect(dir > 0 ? lx : lx - 6, y - 12, 8, 2, "#1b1418");
      this.rect(lx + dir * 6 - 3, y - 12, 8, 4, "#24151a");
      this.rect(lx + dir * 6 - 2, y - 8, 6, 2, "#fff1b8");
    }
  }
  lantern(x, y) {
    // A timber lamp post on a stone footing with a square iron lantern.
    this.rect(x - 7, y - 6, 16, 8, "#4a4658");
    this.rect(x - 7, y - 6, 16, 2, "#7a7690");
    this.rect(x - 1, y - 40, 6, 36, "#3c201e");
    this.rect(x, y - 40, 2, 36, "#844024");
    this.rect(x - 7, y - 58, 16, 4, "#24151a");
    this.rect(x - 5, y - 62, 12, 4, "#3c201e");
    this.rect(x - 6, y - 54, 14, 16, "#24151a");
    this.rect(x - 4, y - 52, 10, 12, "#ffb347");
    this.rect(x - 2, y - 51, 6, 10, "#ffe9a0");
    this.rect(x, y - 50, 2, 7, "#fffbe0");
    this.rect(x - 7, y - 40, 16, 3, "#24151a");
    this.light({ kind: "point", x: x + 1, y: y - 22, r: 62, color: "#ffc070" });
    this.light({ kind: "emit", x: x - 4, y: y - 52, w: 10, h: 12 });
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
  }
  // A small speech bubble with drifting dots, drawn after the light map so
  // it reads like the other markers.
  speechBubble() {
    const px = Math.round(this.player.x / 2) * 2,
      bob = walkFrame(this.walkTime, this.walking, this.reduced) % 2 ? 2 : 0,
      bx = px + 8,
      by = Math.round(this.player.y / 2) * 2 - bob - 74;
    this.rect(bx, by, 30, 18, "#f3ead2");
    this.rect(bx + 2, by - 2, 26, 22, "#f3ead2");
    this.rect(bx + 2, by + 18, 6, 4, "#f3ead2");
    this.rect(bx, by + 22, 4, 4, "#f3ead2");
    const dot = this.reduced ? 3 : Math.floor(this.time * 4) % 4;
    for (let i = 0; i < 3; i++)
      this.rect(bx + 6 + i * 8, by + 8 - (i === dot ? 2 : 0), 4, 4, "#4b4034");
  }
  smoke(d) {
    const vent = { career: [d.x + d.w + 6, d.y - 66], about: [d.x + d.w - 25, d.y - 18] }[d.id];
    if (!vent) return;
    const [x, y] = vent;
    for (let i = 0; i < 4; i++) {
      const phase = this.reduced ? i * 0.24 : (this.time * 0.12 + i * 0.24) % 1;
      const drift = this.reduced ? i * 3 : Math.sin(phase * 5 + d.x) * 7 + phase * 12;
      this.ctx.globalAlpha = (1 - phase) * 0.3;
      this.rect(x + drift - 4, y - phase * 52, 8 + phase * 12, 6 + phase * 6, "#9a9cb4");
    }
    this.ctx.globalAlpha = 1;
  }
  fire() {
    const frame = this.reduced ? 1 : Math.floor(this.time * 8) % 4;
    const x = 482, y = 326;
    this.rect(x - 10, y - 4, 20, 6, "#3c201e");
    this.rect(x - 8, y - 6, 16, 3, "#844024");
    this.rect(x - 9, y - 14 - (frame % 2) * 2, 18, 12, "#d8501c");
    this.rect(x - 7, y - 22 + (frame % 3) * 2, 14, 18, "#f08a28");
    this.rect(x - 4 + (frame % 2) * 2, y - 30 + frame, 8, 20, "#ffb347");
    this.rect(x - 2, y - 16, 5, 12, "#ffe9a0");
    this.rect(x - 1 + ((frame + 1) % 3) * 2 - 2, y - 36 + (frame % 2) * 3, 4, 6, "#f08a28");
    if (!this.reduced)
      for (let i = 0; i < 4; i++) {
        const rise = (this.time * 18 + i * 13) % 46;
        this.ctx.globalAlpha = 1 - rise / 46;
        this.rect(x - 4 + Math.sin(this.time * 3 + i * 2) * 7, y - 30 - rise, 2, 2, i % 2 ? "#ffd27a" : "#ff9a40");
      }
    this.ctx.globalAlpha = 1;
  }
  // Pennant strings sag between the lamp heads around the plaza.
  bunting() {
    const colors = ["#c84a3a", "#e0a040", "#4a7ab0", "#5a9a5a", "#e07ab0", "#f0d070"];
    const sway = this.reduced ? 0 : Math.sin(this.time * 1.3);
    for (const [[ax, ay], [bx, by]] of [
      [[364, 236], [446, 216]],
      [[446, 216], [522, 216]],
      [[522, 216], [597, 261]],
    ]) {
      const flags = Math.round(Math.hypot(bx - ax, by - ay) / 13);
      for (let i = 0; i <= flags; i++) {
        const t = i / flags,
          sag = Math.sin(t * Math.PI) * (12 + sway * 2);
        const fx = ax + (bx - ax) * t,
          fy = ay + (by - ay) * t + sag;
        this.rect(fx, fy, 4, 2, "#2a1a14");
        if (i > 0 && i < flags) {
          const c = colors[(i + ax) % colors.length];
          this.rect(fx - 4, fy + 2, 10, 4, c);
          this.rect(fx - 2, fy + 6, 6, 3, c);
          this.rect(fx, fy + 9, 2, 3, c);
          this.rect(fx - 4, fy + 2, 10, 1, "#fff0c8");
        }
      }
    }
  }
  waterfalls() {
    // Water slides down the fall and foams where it meets the lake.
    const { x, foot } = WATERFALL,
      phase = this.reduced ? 0 : Math.floor(this.time * 12) % 8;
    for (let y = 66 + phase * 2; y < foot - 2; y += 16) {
      this.rect(x - 4, y, 2, 6, "#e6eefa");
      this.rect(x + 2, y + 8, 2, 5, "#cfdcf2");
    }
    const splash = this.reduced ? 0 : Math.floor(this.time * 6) % 3;
    this.rect(x - 12 + splash * 2, foot - 2, 6, 2, "#ffffff");
    this.rect(x + 6 - splash * 2, foot, 6, 2, "#e6eefa");
    this.rect(x - 2, foot + 4 + splash * 2, 4, 2, "#a9c2ec");
  }
  // Where each cabin's light comes from: glass glows, windows spill onto
  // the wall and ground, and the door lamps light the step.
  cabinLights(d) {
    const { x, y, w, h, id } = d,
      gx = d.doorX,
      doorY = y + h - 42,
      lights = [];
    const pane = (wx, wy, ww, wh, color = "#ffc070", reach = 46) => {
      lights.push({ kind: "emit", x: wx, y: wy, w: ww, h: wh });
      lights.push({ kind: "spill", x: wx + ww / 2, y: wy + wh, w: ww + 6, h: wh, reach, color });
    };
    for (const sx of [gx - 19, gx + 19]) {
      lights.push({ kind: "emit", x: sx - 3, y: doorY + 7, w: 6, h: 10 });
      lights.push({ kind: "point", x: sx, y: doorY + 22, r: 34, color: "#ffc070", power: 0.8 });
    }
    lights.push({ kind: "emit", x: gx - 5, y: doorY + 6, w: 10, h: 9 });
    if (id === "projects") {
      for (const wx of [x + 10, x + w - 34]) pane(wx, y + h - 50, 22, 22);
      pane(x + 42, y + h - 54, 30, 50, "#ffb050", 60);
      pane(x + 31, y + 8, 12, 14, "#ffc070", 4);
      lights.push({ kind: "emit", x: x + w - 5, y: y + 5, w: 14, h: 14 });
    } else if (id === "career") {
      for (const wx of [x + 6, x + w - 26]) pane(wx, y + h - 52, 18, 24);
      for (const wx of [x + 34, x + w - 50]) pane(wx, y + h - 48, 14, 18);
      for (const wx of [x + 16, x + w - 28]) pane(wx, y + 21, 12, 12, "#ffc070", 4);
    } else if (id === "gamedev") {
      pane(x + 20, y + 46, w - 40, h - 48, "#ff7ad8", 52);
      pane(x + w - 26, y + 50, 16, 20);
      lights.push({ kind: "emit", x: x - 24, y: y + 52, w: 8, h: 10 });
      lights.push({ kind: "point", x: x - 20, y: y + 70, r: 40, color: "#ff6ad0", power: 0.8 });
      lights.push({ kind: "emit", x: gx - 30, y: y + 8, w: 60, h: 28 });
    } else {
      pane(x + w - 34, y + h - 52, 22, 26);
      pane(x + 8, y + 48, 42, h - 54, "#ffb860", 50);
      lights.push({ kind: "emit", x: x + w - 28, y: y - 2, w: 6, h: 6 });
    }
    // Each rooftop board is lit by its two lamps, which also wash the roof.
    const sign = cabinSign(d);
    lights.push({ kind: "emit", x: sign.x - 2, y: sign.y - 12, w: sign.w + 4, h: sign.h + 14 });
    for (const lx of [sign.x + 12, sign.x + sign.w - 12])
      lights.push({ kind: "point", x: lx, y: sign.y + sign.h + 10, r: 46, color: "#ffc070", power: 0.8, flatten: 1.2 });
    return lights;
  }
  villageLights() {
    const lights = [
      // The campfire throws its light low and wide across the flagstones.
      { kind: "point", x: 482, y: 322, r: 175, color: "#ff9a40", power: 1.35, flatten: 1.7 },
      { kind: "emit", x: 470, y: 290, w: 24, h: 34 },
    ];
    for (const [x, y] of LAMPS) {
      lights.push({ kind: "point", x: x + 1, y: y - 22, r: 70, color: "#ffc070", power: 1.1 });
      lights.push({ kind: "emit", x: x - 4, y: y - 52, w: 10, h: 12 });
    }
    for (const d of destinations) lights.push(...this.cabinLights(d));
    for (const x of [188, 392, 573, 786])
      lights.push({ kind: "point", x, y: 102, r: 20, color: "#ffc070", power: 0.7 });
    return lights;
  }
  // The page's light: the village band plus a band around every source
  // recorded while the lower scenery was painted. Between bands only the
  // moonlight ambient applies, so long pages stay cheap. The sky above the
  // far shore is left exactly as painted.
  buildLighting(recorded) {
    if (typeof document === "undefined") return;
    const sky = this.layout.skyHeight || 0,
      start = Math.floor(sky / 2) * 2,
      ranges = [[start, start + HEIGHT]];
    for (const light of recorded) {
      const [, top, , bottom] = lightBounds(light);
      ranges.push([Math.floor((top - 8) / 2) * 2, Math.ceil((bottom + 8) / 2) * 2]);
    }
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const [a, b] of ranges) {
      const last = merged.at(-1);
      if (last && a <= last[1] + 16) last[1] = Math.max(last[1], b);
      else merged.push([Math.max(start, a), b]);
    }
    const lights = [...this.villageLights().map((l) => ({ ...l, y: l.y + sky })), ...recorded];
    this.pageLight = {
      start,
      ambient: `rgb(${MOONLIGHT.join(",")})`,
      bands: merged
        .map(([top, bottom]) => [top, Math.min(bottom, this.layout.height)])
        .filter(([top, bottom]) => bottom > top)
        .map(([top, bottom]) => ({
          top,
          bottom,
          canvas: lightCanvas(
            lightField(
              WIDTH,
              bottom - top,
              lights.map((l) => ({ ...l, y: l.y - top })),
              { ambient: MOONLIGHT, clear: (y) => (y + top - sky - 64) / 44 },
            ),
          ),
        })),
    };
  }
  // Multiplies the light over the rows a surface shows. Inside a cabin, the
  // room carries its own light, so the village band is left alone.
  applyPageLight(top, bottom) {
    const map = this.pageLight,
      c = this.ctx;
    if (!map || !c.drawImage) return;
    const sky = this.layout.skyHeight || 0,
      parts = [];
    let cursor = Math.max(top, map.start);
    for (const band of map.bands) {
      if (band.bottom <= cursor) continue;
      if (band.top >= bottom) break;
      if (band.top > cursor) parts.push([cursor, Math.min(band.top, bottom), null]);
      parts.push([Math.max(cursor, band.top), Math.min(band.bottom, bottom), band]);
      cursor = Math.min(band.bottom, bottom);
    }
    if (cursor < bottom) parts.push([cursor, bottom, null]);
    c.save();
    try {
      c.globalCompositeOperation = "multiply";
      c.fillStyle = map.ambient;
      const shown = this.interior
        ? parts.flatMap(([a, b, band]) => [
            [a, Math.min(b, sky), band],
            [Math.max(a, sky + HEIGHT), b, band],
          ])
        : parts;
      for (const [a, b, band] of shown) {
        if (b <= a) continue;
        if (band)
          c.drawImage(band.canvas, 0, (a - band.top) / 2, WIDTH / 2, (b - a) / 2, 0, a, WIDTH, b - a);
        else c.fillRect(0, a, WIDTH, b - a);
      }
    } finally {
      c.restore();
    }
  }
  riverCenter(x) {
    return riverCenter(x);
  }
  riverBanks() {
    // The near lakeshore: a mossy rim of round stones, reeds and lily pads.
    const rand = seeded(1957);
    const shore = [];
    for (let x = -24; x <= WIDTH + 24; x += 12) shore.push([x, lakeShore(x)]);
    this.path([...shore, ...shore.slice().reverse().map(([x, y]) => [x, y + 10])], "#2c3a24");
    for (let x = 0; x < WIDTH; x += 13 + Math.floor(rand() * 6)) {
      const y = lakeShore(x) + rand() * 4;
      const w = 12 + rand() * 9;
      this.ellipse(x, y + 2, w + 2, 10, "#1f2338");
      this.ellipse(x, y, w, 8, rand() < 0.5 ? "#55597a" : "#4a4e6c");
      this.rect(x - w * 0.25, y - 3, w * 0.4, 2, "#7d82a8");
      if (rand() < 0.3) this.rect(x - w * 0.4, y - 4, w * 0.5, 2, "#3d5a34");
    }
    for (const x of [205, 330, 610, 760, 840]) {
      const y = riverBounds(x).bottom - 2;
      for (let i = 0; i < 4; i++) {
        this.rect(x + i * 4, y - 12 - (i % 2) * 4, 2, 14, "#5a7040");
        this.rect(x + i * 4 - 1, y - 15 - (i % 2) * 4, 3, 5, "#8a6a3a");
      }
    }
    for (const [x, dy] of [[160, -8], [262, -6], [420, -12], [560, -9], [690, -7], [800, -11]]) {
      const y = riverBounds(x).bottom + dy;
      this.ellipse(x, y, 16, 6, "#3e5a34");
      this.rect(x - 4, y - 2, 6, 2, "#6a8a46");
      this.rect(x + 2, y, 4, 2, "#1a2350");
      if (x % 3 === 0) {
        this.rect(x - 2, y - 5, 4, 4, "#f0b0c8");
        this.rect(x - 1, y - 4, 2, 2, "#ffe0a0");
      }
    }
  }
  riverLife() {
    const phase = this.reduced ? 0 : Math.floor(this.time * 3) % 6;
    for (let x = 8; x < WIDTH; x += 36) {
      const flowX = x + phase * 2,
        y = this.riverCenter(flowX);
      this.rect(flowX, y - 5, 12, 2, "#4a5a98");
      this.rect(flowX + 8 - phase, y + 5, 7, 2, "#2c3a74");
    }
    // The moon's reflection shivers on the open water.
    for (let i = 0; i < 6; i++) {
      const y = 116 + i * 12 + (phase % 2) * 2,
        x = 480 + Math.sin(i * 2.1 + phase) * 8;
      this.rect(x - 6, y, 12, 2, i % 2 ? "#ffd89a" : "#e8a868");
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
    for (const cloud of this.clouds) {
      const drift = this.reduced ? 0 : this.time * cloud.speed;
      const x = ((cloud.x + drift + 180) % (WIDTH + 360)) - 180;
      const moon = this.moonPosition();
      const y = Math.max(
        -48 + cloud.y * 0.35,
        moon.y + moon.diameter / 2 + 18 - this.layout.skyHeight,
      );
      this.pixelCloud(x, y, cloud.w * 0.8);
    }
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
            this.riverLife();
            this.waterfalls();
            this.bunting();
            const foxes = [
              foxState(this.time, 0, this.reduced),
              foxState(this.time, 1, this.reduced),
            ];
            const rabbits = [
              rabbitState(this.time, 0, this.reduced),
              rabbitState(this.time, 1, this.reduced),
            ];
            const sorted = [
              { y: 330, draw: () => this.fire() },
              ...LAMPS.map(([x, y]) => ({ y, draw: () => this.lantern(x, y) })),
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
          }
        } finally {
          c.restore();
        }
      }
      // Light, then whatever makes its own: fireflies, beams and markers.
      this.applyPageLight(top, bottom);
      glowJourney(this, this.layout);
      if (top < this.layout.skyHeight + 620) {
        c.save();
        try {
          c.translate(0, this.layout.skyHeight);
          if (!this.interior) {
            this.flies.forEach((f) => {
              const t = this.reduced ? f.phase : this.time;
              const x = f.x + Math.sin(t * 0.5 + f.phase) * 9,
                y = f.y + Math.cos(t * 0.7 + f.phase) * 6;
              if (Math.sin(t * 1.3 + f.phase * 3) > -0.3)
                this.rect(x, y, 2, 2, "#f6e08a");
            });
            if (this.near) {
              const d = destinations.find((d) => d.id === this.near);
              this.rect(d.doorX - 4, d.y + d.h - 52, 8, 4, "#f1d58b");
              this.rect(d.doorX - 2, d.y + d.h - 48, 4, 3, "#f1d58b");
            }
            if (this.talking) this.speechBubble();
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
      this.lightSink = [];
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
    try {
      drawInteriorScene(
        this,
        this.interior,
        this.reduced ? 0 : this.time,
        () => this.characterSprite(),
        this.nearKind === "lectern",
      );
    } finally {
      // The room's lamps, hearths and candles (static and live) are
      // recorded on its first frame and light the room from then on.
      if (this.lightSink) {
        if (!this.interiorLight) this.interiorLight = new Map();
        if (typeof document !== "undefined")
          this.interiorLight.set(
            this.interior,
            lightCanvas(lightField(WIDTH, HEIGHT, this.lightSink, { ambient: ROOMLIGHT })),
          );
        this.lightSink = null;
      }
    }
    const light = this.interiorLight?.get(this.interior);
    if (light && this.ctx.drawImage) {
      this.ctx.save();
      try {
        this.ctx.globalCompositeOperation = "multiply";
        this.ctx.drawImage(light, 0, 0, WIDTH, HEIGHT);
      } finally {
        this.ctx.restore();
      }
    }
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
        if (this.walking) this.onStep?.(this.player);
      } else this.walking = false;
      this.time += dt;
      this.draw();
    }
  }
}

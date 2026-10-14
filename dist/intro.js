// Opening sequence: the village lake at night behind a broken wooden
// plank that drops in on its ropes, then a camera swoop onto the
// About cabin where the player steps outside to greet the visitor. It only
// borrows the live world canvases, so the final frame matches the page.
import { destinations } from "./world.js";
import { mountPlank } from "./plank.js";

const GREETING =
  "Hey, I’m Issam! Welcome to my little corner of the internet. Walk into any cabin and read the book on the lectern to get to know me a bit better.";
const about = destinations.find((d) => d.id === "about");
const START = { x: about.doorX, y: about.y + about.h - 2 },
  STOP = { x: about.doorX, y: about.y + about.h + 34 };
// Letters per second, and the time the dialogue plank takes to settle.
const TYPE_RATE = 38,
  SETTLE = 0.7;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = (t) => Math.min(1, Math.max(0, t));

export function shouldPlayIntro() {
  if (location.hash) return false;
  if (new URLSearchParams(location.search).get("intro") === "0") return false;
  const navigation = performance.getEntriesByType?.("navigation")[0];
  return navigation?.type !== "back_forward";
}

// The title backdrop is the village's own lake at night, painted on the
// same coarse pixel grid: indigo sky, the peach moon, snowy ranges, a black
// spruce shore with two lit cabins, and their light broken on the water.
// Two crisp glint layers trade places with stepped CSS animation.
const NIGHT = { w: 320, h: 180, horizon: 112, mx: 160, my: 44 };

function paintNight(backdrop, glints) {
  const { w: W, h: H, horizon, mx, my } = NIGHT;
  backdrop.width = W;
  backdrop.height = H;
  const c = backdrop.getContext("2d");
  const rect = (x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  };
  const disc = (cx, cy, r, color, squash = 1) => {
    for (let y = -r; y <= r; y++) {
      const half = Math.sqrt(Math.max(0, r * r - y * y));
      rect(cx - half, cy + y * squash, half * 2, Math.max(1, squash), color);
    }
  };
  let seed = 41;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  ["#0d1636", "#101a3e", "#131f45", "#17244c", "#1b2a53", "#202f5a"].forEach((color, i) =>
    rect(0, (i * horizon) / 6, W, horizon / 6 + 1, color),
  );
  for (let i = 0; i < 46; i++) rect(rand() * W, rand() * (horizon - 30), 1, 1, i % 4 ? "#9aa6d8" : "#f4e6c0");
  // Moon in stepped rings of haze, craters in a deeper peach.
  disc(mx, my, 30, "#1f2c5c");
  disc(mx, my, 25, "#283666");
  disc(mx, my, 19, "#c98a5a");
  disc(mx, my, 18, "#f2b674");
  disc(mx - 2, my - 2, 14, "#f8c584");
  for (const [dx, dy, r] of [[-6, -5, 3], [6, 3, 4], [-1, 9, 2], [8, -7, 2]]) disc(mx + dx, my + dy, r, "#dc9a62");
  const cloud = (x, y, w) => {
    disc(x, y + 1, w * 0.22, "#161d40", 0.5);
    disc(x - w * 0.18, y, w * 0.2, "#273163", 0.6);
    disc(x + w * 0.12, y - 2, w * 0.24, "#273163", 0.6);
    rect(x - w * 0.05, y - w * 0.15, w * 0.2, 1, "#5f6ca6");
  };
  cloud(mx - 52, my + 10, 70);
  cloud(mx + 60, my + 18, 56);
  cloud(40, 30, 50);
  cloud(280, 22, 46);
  // Two ranges of snowy peaks.
  const range = (peaks, base, body, shade, snow) => {
    for (const [x, h, w] of peaks) {
      for (let y = 0; y < h; y++) {
        const half = (w / 2) * (y / h);
        rect(x - half, base - h + y, half * 2, 1, body);
        rect(x, base - h + y, half, 1, shade);
        if (y < h * 0.3) rect(x - half, base - h + y, half * 2, 1, y < h * 0.15 ? "#d3d5ec" : snow);
      }
    }
  };
  range([[40, 34, 110], [120, 40, 120], [205, 36, 120], [290, 42, 130]], horizon - 10, "#30366a", "#252a58", "#8f94c4");
  range([[0, 30, 110], [86, 38, 120], [160, 30, 110], [246, 44, 130], [330, 30, 100]], horizon - 4, "#3a3f74", "#2a2e5c", "#9aa1cc");
  // The far spruce shore and two lit cabins.
  for (let x = -2; x < W + 2; x += 3) {
    const h = 5 + rand() * 9;
    for (let y = 0; y < h; y++) rect(x - (y / h) * 2.5, horizon - h + y, 1 + (y / h) * 5, 1, rand() < 0.5 ? "#111828" : "#162034");
  }
  rect(0, horizon - 2, W, 3, "#111828");
  for (const x of [92, 236]) {
    rect(x - 5, horizon - 8, 10, 7, "#2a1a1e");
    rect(x - 7, horizon - 9, 14, 2, "#1a1828");
    rect(x - 3, horizon - 6, 2, 2, "#ffb347");
    rect(x + 1, horizon - 6, 2, 2, "#ffd27a");
  }
  // The lake, darker toward the viewer, with a dock running out.
  ["#202c60", "#1d2858", "#1a2550", "#172148", "#141c3e"].forEach((color, i) =>
    rect(0, horizon + 1 + i * 14, W, 14, color),
  );
  for (let i = 0; i < 70; i++) {
    const y = horizon + 3 + rand() * (H - horizon - 3);
    rect(rand() * W, y, 3 + rand() * 8, 1, "#2c3a70");
  }
  rect(212, 150, 14, 30, "#2c181b");
  for (let y = 151; y < 180; y += 3) rect(213, y, 12, 2, "#5c2d1f");
  rect(210, 146, 2, 14, "#3c201e");
  rect(226, 146, 2, 14, "#3c201e");
  rect(209, 140, 4, 5, "#ffb347");
  paintGlints(glints, rand);
}

function paintGlints(glints, rand) {
  const { w: W, h: H, horizon, mx } = NIGHT;
  glints.forEach((canvas, layer) => {
    canvas.width = W;
    canvas.height = H;
    const c = canvas.getContext("2d");
    const rect = (x, y, w, color) => {
      c.fillStyle = color;
      c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), 1);
    };
    // The moon column and the cabin and dock lights, broken by ripples.
    for (let y = horizon + 2; y < H; y += 2) {
      const depth = (y - horizon) / (H - horizon);
      if (rand() < 0.75) rect(mx - 3 - depth * 12 + rand() * (6 + depth * 24), y, 2 + rand() * (3 + depth * 6), layer ? "#f6c784" : "#d9925a");
    }
    for (const [x, start] of [[92, horizon + 2], [236, horizon + 2], [211, 150]])
      for (let y = start; y < Math.min(H, start + 30); y += 3)
        if (rand() < 0.7) rect(x - 2 + rand() * 4, y, 2 + rand() * 3, layer ? "#ffd27a" : "#c07a3a");
  });
}

export function runIntro(world, { onFinish } = {}) {
  const reduced = () => world.reduced;
  const journey = document.querySelector("#journey-world");
  const root = document.createElement("div");
  root.className = "intro";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "intro-title");
  root.innerHTML = `
    <canvas class="intro-stage" aria-hidden="true"></canvas>
    <div class="intro-title-screen">
      <div class="intro-night" aria-hidden="true">
        <canvas class="intro-backdrop"></canvas>
        <canvas class="intro-glints"></canvas>
        <canvas class="intro-glints"></canvas>
      </div>
      <h2 id="intro-title" class="sr-only">Issam Arida’s portfolio</h2>
      <button class="intro-start" type="button">
        <span class="intro-plank"><span class="intro-start-label">Click to explore my portfolio</span></span>
      </button>
      <button class="intro-skip" type="button">Skip intro <span aria-hidden="true">▸▸</span></button>
    </div>
    <div class="intro-dialog" hidden>
      <div class="intro-plank">
        <img src="./photo.jpg" alt="" width="88" height="88" />
        <div class="intro-dialog-body">
          <p class="intro-speaker">Issam Arida</p>
          <p class="intro-line" aria-live="polite"></p>
          <p class="intro-controls" hidden>
            <span class="intro-keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows to walk · <kbd>E</kbd> to enter a cabin</span>
            <span class="intro-touch">Walk with the arrow pad · tap a cabin to enter</span>
            <button class="intro-continue" type="button">Let’s go <span aria-hidden="true">▼</span></button>
          </p>
        </div>
      </div>
    </div>
`;
  // The page behind stays alive but out of reach until the intro ends.
  const inert = [...document.body.children].filter((el) => !el.inert);
  inert.forEach((el) => (el.inert = true));
  document.body.append(root);
  document.documentElement.classList.add("intro-open");
  document.documentElement.classList.remove("intro-pending");
  const stage = root.querySelector(".intro-stage"),
    backdrop = root.querySelector(".intro-backdrop"),
    start = root.querySelector(".intro-start"),
    dialog = root.querySelector(".intro-dialog"),
    line = root.querySelector(".intro-line"),
    controls = root.querySelector(".intro-controls"),
    proceed = root.querySelector(".intro-continue");
  mountPlank(start.querySelector(".intro-plank"), 7);
  start.focus({ preventScroll: true });

  let phase = "title",
    clock = 0,
    typed = 0,
    camera = null,
    raf = 0,
    last = 0,
    finished = false;

  function pageView() {
    const box = journey.getBoundingClientRect(),
      scale = box.width / 960;
    return {
      scale,
      cx: (innerWidth / 2 - box.left) / scale,
      cy: (innerHeight / 2 - box.top) / scale,
    };
  }
  function cabinView() {
    const scale = Math.max(
      pageView().scale * 1.6,
      Math.min(innerWidth / 250, innerHeight / 200),
    );
    const sky = world.layout.skyHeight || 0;
    // The dialogue sits low, so frame the doorway in the upper half.
    return { scale, cx: about.doorX, cy: sky + 412 + (innerHeight * 0.2) / scale };
  }
  function mixView(a, b, t) {
    return {
      scale: Math.exp(Math.log(a.scale) + (Math.log(b.scale) - Math.log(a.scale)) * t),
      cx: a.cx + (b.cx - a.cx) * t,
      cy: a.cy + (b.cy - a.cy) * t,
    };
  }
  function paint(view, target = stage, ratio = devicePixelRatio || 1) {
    const ctx = target.getContext("2d");
    const width = Math.round(innerWidth * ratio),
      height = Math.round(innerHeight * ratio);
    if (target.width !== width || target.height !== height) {
      target.width = width;
      target.height = height;
    }
    ctx.imageSmoothingEnabled = false;
    const s = view.scale * ratio,
      left = view.cx - innerWidth / 2 / view.scale,
      top = view.cy - innerHeight / 2 / view.scale;
    // Only the village column is painted: the temple margins behind the
    // intro stay in view the whole way through.
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#17242b";
    ctx.fillRect(Math.round(-left * s), 0, Math.round(960 * s), height);
    for (const surface of world.surfaces) {
      const y = (surface.top - top) * s;
      if (y > height || y + surface.height * s < 0) continue;
      ctx.drawImage(
        surface.canvas,
        0,
        0,
        surface.canvas.width,
        surface.canvas.height,
        Math.round(-left * s),
        Math.round(y),
        Math.round(960 * s),
        Math.round(surface.height * s),
      );
    }
  }

  // The title backdrop is painted once; only its two glint layers move,
  // on the compositor.
  paintNight(backdrop, [...root.querySelectorAll(".intro-glints")]);

  // The script: door opens, Issam steps out, waves and starts talking.
  function script(dt) {
    clock += dt;
    const t = clock;
    world.doorOpen = clamp01((t - 1.6) / 0.5);
    if (t < 2.2) {
      world.player = { ...START, facing: "down" };
      world.walking = false;
    } else if (t < 3.4) {
      const k = (t - 2.2) / 1.2;
      world.player = {
        x: START.x,
        y: START.y + (STOP.y - START.y) * k,
        facing: "down",
      };
      world.walking = true;
    } else {
      world.player = { ...STOP, facing: "down" };
      world.walking = false;
      world.emerging = false;
      world.doorOpen = clamp01(1 - (t - 3.6) / 0.5);
      world.waving = t < 5.2;
      if (phase === "walk") showDialog();
    }
    world.emerging = t >= 2 && t < 3.4;
  }
  function showDialog() {
    phase = "talk";
    world.talking = true;
    dialog.hidden = false;
    // Writing starts once the plank has swung into place.
    typed = -SETTLE * TYPE_RATE;
    if (reduced()) finishTyping();
  }
  function finishTyping() {
    typed = GREETING.length;
    line.textContent = GREETING;
    phase = "ready";
    world.talking = false;
    controls.hidden = false;
    proceed.focus({ preventScroll: true });
  }

  function loop(now) {
    if (finished) return;
    raf = requestAnimationFrame(loop);
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    if (phase === "title") return;
    if (document.hidden) return;
    if (phase === "zoom-in") {
      const k = reduced() ? 1 : clamp01(clock / 1.5);
      paint(mixView(camera.from, cabinView(), ease(k)));
    } else if (phase === "zoom-out") {
      clock += dt;
      const k = reduced() ? 1 : clamp01(clock / 1.1);
      paint(mixView(camera.from, pageView(), ease(k)));
      if (k >= 1) finish();
      return;
    } else paint(cabinView());
    if (phase === "talk") {
      typed = Math.min(GREETING.length, typed + dt * TYPE_RATE);
      line.textContent = GREETING.slice(0, Math.max(0, Math.floor(typed)));
      if (typed >= GREETING.length) finishTyping();
    }
  }

  function begin() {
    if (phase !== "title") return;
    scrollTo(0, 0);
    phase = "zoom-in";
    world.suspended = false;
    root.classList.add("is-playing");
    camera = { from: pageView() };
    clock = 0;
    world.active = false;
    world.keys.clear();
    world.near = null;
    world.player = { ...START, facing: "down" };
    world.cutscene = (dt) => {
      script(dt);
      if (phase === "zoom-in" && clock >= 1.5) phase = "walk";
      if (reduced() && phase === "zoom-in") {
        clock = 3.4;
        phase = "walk";
      }
    };
    // Esc still skips, but the button is only offered on the title.
    root.tabIndex = -1;
    root.focus({ preventScroll: true });
  }
  function leave() {
    if (phase === "zoom-out" || finished) return;
    phase = "zoom-out";
    world.talking = false;
    world.waving = false;
    dialog.hidden = true;
    root.classList.add("is-leaving");
    camera = { from: cabinView() };
    clock = 0;
  }
  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    world.cutscene = null;
    world.emerging = world.waving = world.talking = false;
    world.doorOpen = 0;
    world.walking = false;
    // Skipping from the title keeps the usual fountain spawn.
    if (phase !== "title") world.player = { ...STOP, facing: "down" };
    world.active = true;
    world.keys.clear();
    removeEventListener("keydown", onKey, true);
    world.suspended = false;
    inert.forEach((el) => (el.inert = false));
    root.remove();
    document.documentElement.classList.remove("intro-open");
    onFinish?.();
  }
  function skip() {
    if (phase === "title") scrollTo(0, 0);
    finish();
  }
  function onKey(event) {
    if (finished) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      skip();
      return;
    }
    if (event.key === "Tab" || event.target.closest?.(".intro-skip")) return;
    event.stopImmediatePropagation();
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    advance();
  }
  function advance() {
    if (phase === "title") begin();
    else if (phase === "talk") finishTyping();
    else if (phase === "ready") leave();
  }
  addEventListener("keydown", onKey, true);
  // The live village is hidden behind the title, so it rests until play.
  world.suspended = true;
  start.addEventListener("click", (event) => {
    event.stopPropagation();
    begin();
  });
  proceed.addEventListener("click", (event) => {
    event.stopPropagation();
    leave();
  });
  root.querySelector(".intro-skip").addEventListener("click", (event) => {
    event.stopPropagation();
    skip();
  });
  root.addEventListener("click", advance);
  raf = requestAnimationFrame(loop);
  return { skip, root };
}

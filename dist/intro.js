// Opening sequence: a still, blurred night ocean behind a single unrolling
// scroll, then a camera swoop onto the
// About cabin where the player steps outside to greet the visitor. It only
// borrows the live world canvases, so the final frame matches the page.
import { destinations } from "./world.js";

const GREETING =
  "Hey, I’m Issam. Welcome to my portfolio! Walk into any cabin and read the book inside to get to know me.";
const about = destinations.find((d) => d.id === "about");
const START = { x: about.doorX, y: about.y + about.h - 2 },
  STOP = { x: about.doorX, y: about.y + about.h + 34 };
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = (t) => Math.min(1, Math.max(0, t));

export function shouldPlayIntro() {
  if (location.hash) return false;
  if (new URLSearchParams(location.search).get("intro") === "0") return false;
  const navigation = performance.getEntriesByType?.("navigation")[0];
  return navigation?.type !== "back_forward";
}

// A full moon at the top centre with rays fanning out over a dark sea,
// painted small, blurred once and scaled up. Two transparent layers of
// glints drift over the sea with compositor-only CSS animation.
const NIGHT = { w: 320, h: 180, horizon: 104, mx: 160, my: 34 };

function blurInto(canvas, art) {
  const { w, h } = NIGHT;
  canvas.width = w * 2;
  canvas.height = h * 2;
  const out = canvas.getContext("2d");
  out.imageSmoothingEnabled = true;
  if ("filter" in out) out.filter = "blur(3px)";
  out.drawImage(art, -8, -8, w * 2 + 16, h * 2 + 16);
}

function paintNight(backdrop, glints) {
  const { w: W, h: H, horizon, mx, my } = NIGHT;
  const art = document.createElement("canvas");
  art.width = W;
  art.height = H;
  const c = art.getContext("2d");
  const rect = (x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  let seed = 41;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  ["#070e17", "#09131e", "#0b1825", "#0e1d2c", "#112333"].forEach((color, i) =>
    rect(0, (i * horizon) / 5, W, horizon / 5 + 1, color),
  );
  for (let i = 0; i < 36; i++) rect(rand() * W, rand() * (horizon - 10), 1, 1, "#8fa6b0");
  // Rays fan out from the moon in every direction.
  c.fillStyle = "#cfe0d4";
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2 + 0.11,
      spread = 0.07 + (i % 3) * 0.025;
    c.globalAlpha = i % 2 ? 0.05 : 0.08;
    c.beginPath();
    c.moveTo(mx, my);
    c.lineTo(mx + Math.cos(angle - spread) * 260, my + Math.sin(angle - spread) * 260);
    c.lineTo(mx + Math.cos(angle + spread) * 260, my + Math.sin(angle + spread) * 260);
    c.fill();
  }
  c.globalAlpha = 1;
  for (const [r, color] of [
    [34, "#10283a"],
    [26, "#173749"],
    [20, "#22495a"],
    [14, "#d6e2cc"],
  ])
    for (let y = -r; y <= r; y++) {
      const half = Math.sqrt(r * r - y * y);
      rect(mx - half, my + y, half * 2, 1, color);
    }
  rect(mx - 6, my - 5, 4, 3, "#bccab3");
  rect(mx + 3, my + 3, 5, 3, "#bccab3");
  rect(mx - 2, my + 6, 3, 2, "#c4d1bb");
  // The sea, darkening towards the viewer.
  ["#0d1e2a", "#0b1923", "#09151e", "#081219", "#060e14"].forEach((color, i) =>
    rect(0, horizon + i * 16, W, 16, color),
  );
  rect(0, horizon, W, 1, "#1c3a48");
  blurInto(backdrop, art);
  // Glint layers: the moon path and scattered wave crests.
  glints.forEach((canvas, layer) => {
    c.clearRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) {
      const y = horizon + 2 + rand() * (H - horizon - 2),
        depth = (y - horizon) / (H - horizon),
        path = rand() < 0.6;
      const spread = 4 + depth * 46,
        x = path ? mx - spread + rand() * spread * 2 : rand() * W;
      rect(x, y, 2 + rand() * (4 + depth * 8), 1, path ? (layer ? "#b8cbbb" : "#9db3a8") : "#2a4a58");
    }
    blurInto(canvas, art);
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
        <span class="intro-roller" aria-hidden="true"></span>
        <span class="intro-paper"><span class="intro-start-label">Click to explore my portfolio</span></span>
        <span class="intro-roller" aria-hidden="true"></span>
      </button>
      <button class="intro-skip" type="button">Skip intro <span aria-hidden="true">▸▸</span></button>
    </div>
    <div class="intro-dialog" hidden>
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
    return { scale, cx: about.doorX, cy: sky + 412 + (innerHeight * 0.14) / scale };
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
    ctx.fillStyle = "#17242b";
    ctx.fillRect(0, 0, width, height);
    const s = view.scale * ratio,
      left = view.cx - innerWidth / 2 / view.scale,
      top = view.cy - innerHeight / 2 / view.scale;
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

  // The title backdrop is painted and blurred once, then never redrawn;
  // only its glint layers move, on the compositor.
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
      typed = Math.min(GREETING.length, typed + dt * 38);
      line.textContent = GREETING.slice(0, Math.floor(typed));
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
    root.querySelector(".intro-skip").focus({ preventScroll: true });
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

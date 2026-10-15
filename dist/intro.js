// Opening sequence: the village lake at night behind a broken wooden
// plank that drops in on its ropes. Exploring fades straight onto an
// ordinary shot of the About cabin; the door opens, the player steps out,
// pauses and greets the visitor, then the camera pulls smoothly back to
// reveal the whole hero. The camera moves the real page, so whatever it
// shows is the finished hero, boards and signs included, and the last
// frame simply is the page.
import { mountPlank } from "./plank.js";

const GREETING =
  "Hey, I’m Issam! Welcome to my little corner of the internet. Walk into any cabin and read the book on the lectern to get to know me a bit better.";
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

// The title is shown by the tiny boot module before the village's own code
// has even run, so a first visit only ever sees the opening. The live world
// attaches later, once it, the fonts and the hero's art are ready; a click
// or Escape before that is remembered and carried out on arrival, while the
// night scene stays up so nothing unfinished shows through.
let opened = null;
export const pendingIntro = () => opened;
export function runIntro(world, options) {
  const intro = openIntro();
  intro.attach(world, options);
  return intro;
}
export function openIntro() {
  if (opened) return opened;
  let world = null,
    onFinish = null,
    about = null,
    queued = null,
    START = null,
    STOP = null;
  const reduced = () =>
    world ? world.reduced : matchMedia("(prefers-reduced-motion: reduce)").matches;
  const journey = document.querySelector("#journey-world");
  const root = document.createElement("div");
  root.className = "intro";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "intro-title");
  root.innerHTML = `
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
  const backdrop = root.querySelector(".intro-backdrop"),
    start = root.querySelector(".intro-start"),
    dialog = root.querySelector(".intro-dialog"),
    line = root.querySelector(".intro-line"),
    controls = root.querySelector(".intro-controls"),
    proceed = root.querySelector(".intro-continue");
  mountPlank(start.querySelector(".intro-plank"), 7);
  start.focus({ preventScroll: true });
  // The lettering waits for its pixel face rather than flashing a fallback.
  Promise.race([
    document.fonts.load("24px VT323").catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]).then(() => root.classList.add("is-lettered"));

  let phase = "title",
    clock = 0,
    shot = 0,
    typed = 0,
    camera = null,
    raf = 0,
    last = 0,
    finished = false;

  // The page's own placement, measured without the camera on it.
  let home = null;
  function measure() {
    const transform = journey.style.transform;
    journey.style.transform = "";
    const box = journey.getBoundingClientRect();
    journey.style.transform = transform;
    home = { left: box.left, top: box.top, scale: box.width / 960 };
  }
  function pageView() {
    return {
      scale: home.scale,
      cx: (innerWidth / 2 - home.left) / home.scale,
      cy: (innerHeight / 2 - home.top) / home.scale,
    };
  }
  // The one shot of the cabin: the whole cabin and its roof sign at an
  // ordinary, comfortable scale, held in the upper part of the screen so
  // the greeting below never covers it, and never past the village's edge.
  function cabinView() {
    const scale = Math.max(home.scale * 1.6, Math.min(innerWidth / 300, innerHeight / 290)),
      sky = world.layout.skyHeight || 0,
      halfW = innerWidth / 2 / scale,
      centre = about.x + about.w / 2;
    return {
      scale,
      cx: halfW < 480 ? Math.min(960 - halfW, Math.max(halfW, centre)) : 480,
      cy: sky + about.y + about.h / 2 - 8 + (innerHeight * 0.16) / scale,
    };
  }
  // Pulling back from the cabin to the page: the visible width grows
  // smoothly on a log scale and the view's edges move in proportion, so
  // the shot widens around one steady point, with no swing or overshoot.
  function pullBack(a, b, t) {
    const wa = innerWidth / a.scale,
      wb = innerWidth / b.scale,
      w = Math.exp(Math.log(wa) + (Math.log(wb) - Math.log(wa)) * t),
      u = Math.abs(wb - wa) < 1e-6 ? t : (w - wa) / (wb - wa);
    return { scale: innerWidth / w, cx: a.cx + (b.cx - a.cx) * u, cy: a.cy + (b.cy - a.cy) * u };
  }
  // Puts the world point (cx, cy) in the middle of the screen at the given
  // scale by transforming the page itself, snapped to device pixels.
  function frame(view) {
    const ratio = devicePixelRatio || 1,
      snap = (value) => Math.round(value * ratio) / ratio,
      k = view.scale / home.scale,
      left = view.cx - innerWidth / 2 / view.scale,
      top = view.cy - innerHeight / 2 / view.scale;
    const x = snap(-left * view.scale - home.left),
      y = snap(-top * view.scale - home.top);
    journey.style.transformOrigin = "0 0";
    journey.style.transform =
      Math.abs(k - 1) < 1e-4 && !x && !y ? "" : `translate(${x}px, ${y}px) scale(${k})`;
  }
  function onResize() {
    if (phase === "title" || finished) return;
    measure();
    if (phase !== "zoom-out") frame(cabinView());
  }

  // The title backdrop is painted once; only its two glint layers move,
  // on the compositor.
  paintNight(backdrop, [...root.querySelectorAll(".intro-glints")]);

  // The script, in seconds from the moment the cabin is on screen: a beat
  // to take it in, the door opens, Issam steps out and waves, a short pause,
  // then he starts talking.
  const DOOR = 0.8,
    OUT = 1.4,
    STEPPED = 2.6,
    TALK = 3.1;
  function script(dt) {
    clock += dt;
    const t = clock;
    world.doorOpen = clamp01((t - DOOR) / 0.5);
    if (t < OUT) {
      world.player = { ...START, facing: "down" };
      world.walking = false;
    } else if (t < STEPPED) {
      const k = (t - OUT) / (STEPPED - OUT);
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
      world.doorOpen = clamp01(1 - (t - STEPPED - 0.2) / 0.5);
      world.waving = phase !== "zoom-out" && phase !== "pause" && t < STEPPED + 1.8;
      if (phase === "scene" && t >= TALK) showDialog();
    }
    world.emerging = t >= DOOR + 0.4 && t < STEPPED;
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
    if (phase === "pause") {
      // A breath between the goodbye and the pull-back.
      shot += dt;
      if (shot >= 0.35 || reduced()) {
        phase = "zoom-out";
        shot = 0;
      }
      return;
    }
    if (phase === "zoom-out") {
      shot += dt;
      const k = reduced() ? 1 : clamp01(shot / 2);
      frame(pullBack(camera.from, pageView(), ease(k)));
      if (k >= 1) finish();
      return;
    }
    frame(cabinView());
    if (phase === "talk") {
      typed = Math.min(GREETING.length, typed + dt * TYPE_RATE);
      line.textContent = GREETING.slice(0, Math.max(0, Math.floor(typed)));
      if (typed >= GREETING.length) finishTyping();
    }
  }

  function begin() {
    if (phase !== "title") return;
    if (!world) {
      // The plank answers at once; the night stays up until the village
      // behind it is completely ready.
      queued = queued || "begin";
      root.classList.add("is-starting");
      return;
    }
    scrollTo(0, 0);
    measure();
    phase = "scene";
    world.suspended = false;
    // The cabin shot is set before the night lifts: no zoom to arrive.
    frame(cabinView());
    root.classList.add("is-playing");
    clock = reduced() ? TALK : 0;
    world.active = false;
    world.keys.clear();
    world.near = null;
    world.player = { ...START, facing: "down" };
    world.cutscene = script;
    // Esc still skips, but the button is only offered on the title.
    root.tabIndex = -1;
    root.focus({ preventScroll: true });
  }
  function leave() {
    if (phase === "zoom-out" || phase === "pause" || finished) return;
    phase = "pause";
    world.talking = false;
    world.waving = false;
    dialog.hidden = true;
    root.classList.add("is-leaving");
    camera = { from: cabinView() };
    shot = 0;
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
    removeEventListener("resize", onResize);
    journey.style.transform = journey.style.transformOrigin = "";
    world.suspended = false;
    inert.forEach((el) => (el.inert = false));
    root.remove();
    document.documentElement.classList.remove("intro-open");
    onFinish?.();
  }
  function skip() {
    if (!world) {
      queued = "skip";
      return;
    }
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
  addEventListener("resize", onResize);
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
  opened = {
    root,
    skip,
    attach(live, options = {}) {
      if (world) return;
      world = live;
      onFinish = options.onFinish;
      about = options.about;
      START = { x: about.doorX, y: about.y + about.h - 2 };
      STOP = { x: about.doorX, y: about.y + about.h + 34 };
      // The live village is hidden behind the title, so it rests until play.
      world.suspended = true;
      root.classList.add("is-ready");
      if (queued === "skip") skip();
      else if (queued === "begin") begin();
    },
  };
  return opened;
}

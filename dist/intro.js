// Opening sequence: a medieval title screen, then a camera swoop onto the
// About cabin where the player steps outside to greet the visitor. It only
// borrows the live world canvases, so the final frame matches the page.
import { destinations } from "./world.js";

const GREETING =
  "Hello, welcome to my portfolio! I’m Issam. Walk around the cabins to view different aspects of my life!";
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

function torch(side) {
  return `<svg class="intro-torch intro-torch-${side}" viewBox="0 0 12 28" aria-hidden="true" shape-rendering="crispEdges">
    <g class="intro-flame">
      <path d="M5 0h2v2h1v2h1v3H8v1H4V7H3V4h1V2h1z" fill="#e98a3a"/>
      <path d="M5 3h2v2h1v2H4V5h1z" fill="#ffd27a"/>
    </g>
    <path d="M2 8h8v2H2z" fill="#6d5034"/><path d="M3 10h6v3H3z" fill="#8c6a43"/>
    <path d="M5 13h2v15H5z" fill="#5b4530"/><path d="M4 16h4v2H4z" fill="#a6a79c"/>
  </svg>`;
}

const CREST = `<svg class="intro-crest" viewBox="0 0 24 26" aria-hidden="true" shape-rendering="crispEdges">
  <path d="M1 1h22v12l-2 4-3 4-4 3-2 1-2-1-4-3-3-4-2-4z" fill="#e7c46e"/>
  <path d="M3 3h18v10l-2 3-3 4-4 3-4-3-3-4-2-3z" fill="#7d1f24"/>
  <path d="M12 3h9v10l-2 3-3 4-4 3z" fill="#24395f"/>
  <path d="M7 12l5-5 5 5v6H7z" fill="#e7c46e"/><path d="M9 12l3-3 3 3v5H9z" fill="#3a2a1c"/>
  <path d="M11 14h2v3h-2z" fill="#ffd27a"/><path d="M15 6h2v4h-2z" fill="#e7c46e"/>
</svg>`;

export function runIntro(world, { onFinish } = {}) {
  const reduced = () => world.reduced;
  const journey = document.querySelector("#journey-world");
  const root = document.createElement("div");
  root.className = "intro";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "intro-title");
  const embers = Array.from({ length: 22 }, (_, i) => {
    const left = (i * 37 + 11) % 100,
      delay = ((i * 7) % 11) * 0.45,
      duration = 5 + ((i * 13) % 7) * 0.6,
      size = i % 3 ? 4 : 6;
    return `<span style="--left:${left}%;--delay:-${delay}s;--duration:${duration}s;--size:${size}px"></span>`;
  }).join("");
  root.innerHTML = `
    <canvas class="intro-stage" aria-hidden="true"></canvas>
    <div class="intro-title-screen">
      <div class="intro-embers" aria-hidden="true">${embers}</div>
      <div class="intro-banner">
        ${torch("left")}
        <div class="intro-heraldry">
          ${CREST}
          <h2 id="intro-title" class="intro-name">Issam Arida</h2>
          <p class="intro-ribbon"><span>Portfolio</span></p>
        </div>
        ${torch("right")}
      </div>
      <button class="intro-start" type="button">
        <span class="intro-pointer" aria-hidden="true">▶</span>
        <span class="intro-start-label">Click to start</span>
        <span class="intro-pointer" aria-hidden="true">◀</span>
      </button>
      <p class="intro-hint">Press Enter or click · Esc skips the intro</p>
      <p class="intro-copyright">© ${new Date().getFullYear()} Issam Arida</p>
    </div>
    <div class="intro-dialog" hidden>
      <img src="./photo.jpg" alt="" width="88" height="88" />
      <div class="intro-dialog-body">
        <p class="intro-speaker">Issam</p>
        <p class="intro-line" aria-live="polite"></p>
        <p class="intro-controls" hidden>
          <span class="intro-keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows to walk · <kbd>E</kbd> to enter a cabin</span>
          <span class="intro-touch">Walk with the arrow pad · tap a cabin to enter</span>
          <button class="intro-continue" type="button">Let’s go <span aria-hidden="true">▼</span></button>
        </p>
      </div>
    </div>
    <button class="intro-skip" type="button">Skip intro <span aria-hidden="true">▸▸</span></button>`;
  // The page behind stays alive but out of reach until the intro ends.
  const inert = [...document.body.children].filter((el) => !el.inert);
  inert.forEach((el) => (el.inert = true));
  document.body.append(root);
  document.documentElement.classList.add("intro-open");
  const stage = root.querySelector(".intro-stage"),
    ctx = stage.getContext("2d"),
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
  function paint(view) {
    const ratio = devicePixelRatio || 1;
    const width = Math.round(innerWidth * ratio),
      height = Math.round(innerHeight * ratio);
    if (stage.width !== width || stage.height !== height) {
      stage.width = width;
      stage.height = height;
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

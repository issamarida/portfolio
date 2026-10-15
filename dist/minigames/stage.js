// The hidden minigames never run inside the village. Launching one closes a
// pixel iris over the page, pauses the world, hides and locks the portfolio
// and opens a dedicated full-screen stage where only that game is alive.
// Exiting tears the game down (its loop, listeners and DOM), restores the
// page untouched and opens the iris again on the hero section.
import { lockPage, unlockPage } from "../scroll-lock.js";
import { W, H } from "./pixel.js";

const GAMES = {
  maze: () => import("./maze.js"),
  flap: () => import("./flap.js"),
  fishing: () => import("./fishing.js"),
  drift: () => import("./drift.js"),
};
export const minigameIds = Object.keys(GAMES);

const KEYS = {
  ArrowUp: "up",
  w: "up",
  ArrowDown: "down",
  s: "down",
  ArrowLeft: "left",
  a: "left",
  ArrowRight: "right",
  d: "right",
  " ": "action",
  Enter: "action",
};
const TOUCH = {
  dpad: [
    ["up", "▲", "Up"],
    ["left", "◀", "Left"],
    ["down", "▼", "Down"],
    ["right", "▶", "Right"],
  ],
  drive: [
    ["left", "◀", "Steer left"],
    ["right", "▶", "Steer right"],
  ],
  hold: [["action", null, null]],
  tap: [],
};

let session = null;
export const minigameActive = () => Boolean(session);

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// A stepped pixel iris over the whole viewport, like the cabin doors'.
class Iris {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.className = "minigame-iris";
    this.canvas.setAttribute("aria-hidden", "true");
    this.canvas.width = Math.ceil(innerWidth / 4);
    this.canvas.height = Math.ceil(innerHeight / 4);
    this.ctx = this.canvas.getContext("2d");
    document.body.append(this.canvas);
  }
  paint(k, origin) {
    const { width, height } = this.canvas,
      cx = origin.x / 4,
      cy = origin.y / 4,
      reach = Math.hypot(Math.max(cx, width - cx), Math.max(cy, height - cy)) + 2,
      r = Math.round((k * reach) / 2) * 2,
      ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#050809";
    for (let y = 0; y < height; y++) {
      const dy = y + 0.5 - cy;
      if (Math.abs(dy) >= r) {
        ctx.fillRect(0, y, width, 1);
        continue;
      }
      const half = Math.round(Math.sqrt(r * r - dy * dy));
      ctx.fillRect(0, y, Math.max(0, cx - half), 1);
      ctx.fillRect(cx + half, y, width, 1);
    }
  }
  run(from, to, origin) {
    const duration = reducedMotion() ? 0 : 360;
    return new Promise((resolve) => {
      const start = performance.now();
      const step = (now) => {
        const t = duration ? Math.min(1, (now - start) / duration) : 1,
          eased = t * t * (3 - 2 * t);
        this.paint(from + (to - from) * eased, origin);
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }
  close(origin) {
    return this.run(1, 0, origin);
  }
  async open(origin) {
    await this.run(0, 1, origin);
    this.canvas.remove();
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function bestStore(id) {
  const key = `midnight-archive:minigame:${id}`;
  return {
    get() {
      try {
        return Number(localStorage.getItem(key)) || 0;
      } catch {
        return 0;
      }
    },
    save(value) {
      try {
        if (value > this.get()) localStorage.setItem(key, String(value));
      } catch {
        // Private windows may refuse storage; the best score just resets.
      }
    },
  };
}

// The stage is deliberately bare and the same for every game: the score
// alone centred above, the game in the middle and one controls hint centred
// below, in one scheme ("A / D to steer") even where more keys work. A
// small way out sits in the corner; on touch screens only the pads the game
// needs are added. The only things laid over the play are brief: a score
// that pops when it changes and a small number or word that rises and fades
// where something happened.
const coarse = () => matchMedia("(pointer: coarse)").matches;
function buildStage(meta) {
  const root = element("section", "minigame");
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", meta.title);
  root.dataset.game = meta.id;
  const exit = element("button", "minigame-exit");
  exit.type = "button";
  exit.innerHTML = '<span aria-hidden="true">◀</span> Exit';
  exit.setAttribute("aria-label", "Exit the game and return to the village");
  const score = element("p", "minigame-score", "0");
  score.setAttribute("aria-hidden", "true");
  const screen = element("div", "minigame-screen");
  screen.tabIndex = -1;
  screen.setAttribute("aria-label", meta.title);
  const frame = element("div", "minigame-frame"),
    canvas = element("canvas", "minigame-canvas");
  canvas.width = W;
  canvas.height = H;
  canvas.setAttribute("aria-hidden", "true");
  const banner = element("p", "minigame-banner"),
    floats = element("div", "minigame-floats");
  banner.hidden = true;
  banner.setAttribute("aria-hidden", "true");
  floats.setAttribute("aria-hidden", "true");
  frame.append(canvas, floats, banner);
  screen.append(frame);
  const hint = element("p", "minigame-hint");
  const touch = element("div", "minigame-touch");
  touch.dataset.layout = meta.touch;
  for (const [action, glyph, label] of TOUCH[meta.touch]) {
    const button = element("button", `minigame-pad pad-${action}`, glyph || meta.touchLabel);
    button.type = "button";
    button.dataset.action = action;
    button.setAttribute("aria-label", label || meta.touchLabel);
    touch.append(button);
  }
  const status = element("p", "sr-only");
  status.setAttribute("role", "status");
  root.append(exit, score, screen, hint, touch, status);
  return { root, exit, score, screen, frame, canvas, banner, floats, hint, touch, status };
}

// Launches a minigame. `origin` is the viewport point the iris closes on;
// `restore` puts the portfolio back and returns the point it reopens on.
export async function launchMinigame(id, { world, origin, restore }) {
  if (session || !GAMES[id]) return false;
  const current = (session = { id });
  // Until the stage is up, every key belongs to nobody: the village must not
  // walk or open cabins while the iris closes.
  const swallow = (event) => {
    if (event.key === "Tab") return;
    event.stopImmediatePropagation();
    event.preventDefault();
  };
  addEventListener("keydown", swallow, true);
  world.keys.clear();
  world.active = false;
  const iris = new Iris();
  let module;
  try {
    [module] = await Promise.all([GAMES[id](), iris.close(origin)]);
  } catch (error) {
    // The game failed to load: give the page back exactly as it was.
    removeEventListener("keydown", swallow, true);
    world.active = true;
    await iris.open(origin);
    session = null;
    throw error;
  }
  removeEventListener("keydown", swallow, true);
  const parts = buildStage(module.meta),
    hidden = [...document.body.children].filter(
      (el) => !el.inert && el !== iris.canvas && el.tagName !== "SCRIPT",
    );
  // Pause and hide the portfolio: no world frames, no page scroll, no focus.
  world.suspended = true;
  world.keys.clear();
  lockPage("minigame");
  hidden.forEach((el) => (el.inert = true));
  document.documentElement.classList.add("is-minigame");
  document.body.insertBefore(parts.root, iris.canvas);
  current.stage = new Stage(module, parts, () => leave());
  current.stage.start();
  iris.open({ x: innerWidth / 2, y: innerHeight / 2 });

  async function leave() {
    if (current.leaving) return;
    current.leaving = true;
    const out = new Iris();
    await out.close({ x: innerWidth / 2, y: innerHeight / 2 });
    current.stage.dispose();
    parts.root.remove();
    document.documentElement.classList.remove("is-minigame");
    hidden.forEach((el) => (el.inert = false));
    unlockPage("minigame", false);
    world.suspended = false;
    world.active = true;
    world.keys.clear();
    const back = restore?.() || { x: innerWidth / 2, y: innerHeight / 2 };
    session = null;
    await out.open(back);
  }
  return true;
}

export class Stage {
  constructor(module, parts, onExit) {
    this.module = module;
    this.meta = module.meta;
    this.parts = parts;
    this.onExit = onExit;
    this.held = new Set();
    this.paused = false;
    this.raf = 0;
    this.last = 0;
    this.listeners = [];
    this.frame = this.frame.bind(this);
  }
  on(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    this.listeners.push(() => target.removeEventListener(type, handler, options));
  }
  start() {
    const { parts } = this;
    const ctx = parts.canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const best = bestStore(this.meta.id);
    this.api = {
      canvas: parts.canvas,
      ctx,
      reduced: reducedMotion(),
      held: (action) => this.held.has(action),
      best,
      touch: coarse(),
      hud: {
        // The score, and nothing else, above the game.
        score: (text) => {
          if (parts.score.textContent !== String(text)) parts.score.textContent = text;
        },
        // A short bump of the score: gold for a gain, red for a loss.
        pop: (bad = false) => this.pop(bad),
        // A small word or number that rises from a point in the game and
        // fades within a second ("+120", "Perfect catch").
        float: (text, x, y, tone = "") => this.float(text, x, y, tone),
        // The one short controls hint below it: keyboard or touch wording.
        hint: (keys, taps = keys) => this.hint(coarse() ? taps : keys),
        // Only for the end of a run (and pausing): big lettering on the game.
        banner: (title) => this.banner(title),
        announce: (text) => (parts.status.textContent = text),
      },
    };
    this.game = this.module.createGame(this.api);
    this.fit();
    this.on(window, "keydown", (e) => this.key(e, true), true);
    this.on(window, "keyup", (e) => this.key(e, false), true);
    this.on(window, "blur", () => this.releaseAll());
    this.on(window, "resize", () => this.fit());
    this.on(document, "visibilitychange", () => {
      if (document.hidden) this.pause(true);
    });
    this.on(parts.exit, "click", () => this.onExit());
    this.on(parts.screen, "pointerdown", (e) => this.pointer(e, "down"));
    this.on(parts.screen, "pointerup", (e) => this.pointer(e, "up"));
    this.on(parts.screen, "pointercancel", (e) => this.pointer(e, "up"));
    this.on(parts.screen, "contextmenu", (e) => e.preventDefault());
    for (const button of parts.touch.querySelectorAll("button")) {
      const action = button.dataset.action;
      this.on(button, "pointerdown", (e) => {
        e.preventDefault();
        button.setPointerCapture?.(e.pointerId);
        button.classList.add("is-held");
        this.press(action);
      });
      const up = () => {
        button.classList.remove("is-held");
        this.release(action);
      };
      this.on(button, "pointerup", up);
      this.on(button, "pointercancel", up);
      this.on(button, "lostpointercapture", up);
      this.on(button, "contextmenu", (e) => e.preventDefault());
    }
    parts.screen.focus({ preventScroll: true });
    this.raf = requestAnimationFrame(this.frame);
  }
  // Integer scaling when there is room, so every game pixel stays square.
  fit() {
    // The wooden frame's border and shadow sit outside the canvas.
    const { screen, frame } = this.parts,
      box = screen.getBoundingClientRect(),
      room = { width: box.width - 26, height: box.height - 30 };
    let scale = Math.min(room.width / W, room.height / H);
    if (scale >= 2) scale = Math.floor(scale);
    scale = Math.max(0.5, scale);
    frame.style.width = `${Math.floor(W * scale)}px`;
    frame.style.height = `${Math.floor(H * scale)}px`;
  }
  frame(now) {
    this.raf = requestAnimationFrame(this.frame);
    const dt = this.last ? Math.min((now - this.last) / 1000, 1 / 20) : 0;
    this.last = now;
    if (document.hidden) return;
    if (!this.paused) this.game.update(dt);
    this.game.draw();
  }
  key(event, down) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    // While a game is up, every key belongs to it and nothing else.
    event.stopImmediatePropagation();
    if (event.key === "Tab") return;
    if (event.key === "Escape") {
      event.preventDefault();
      if (down) this.onExit();
      return;
    }
    const onButton = event.target.closest?.(".minigame button");
    if (onButton && (event.key === "Enter" || event.key === " ")) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === "p") {
      event.preventDefault();
      if (down && !event.repeat) this.pause(!this.paused);
      return;
    }
    const action = KEYS[key];
    if (!action) return;
    event.preventDefault();
    if (!down) return this.release(action);
    if (!event.repeat) this.press(action);
  }
  press(action) {
    if (this.paused) {
      if (action === "action") this.pause(false);
      return;
    }
    if (this.held.has(action)) return;
    this.held.add(action);
    this.game.press?.(action);
  }
  release(action) {
    if (!this.held.delete(action)) return;
    this.game.release?.(action);
  }
  releaseAll() {
    for (const action of [...this.held]) this.release(action);
  }
  pointer(event, kind) {
    if (event.target.closest("button")) return;
    if (kind === "down") {
      event.preventDefault();
      this.parts.screen.setPointerCapture?.(event.pointerId);
    }
    const box = this.parts.canvas.getBoundingClientRect(),
      x = ((event.clientX - box.left) / box.width) * W,
      y = ((event.clientY - box.top) / box.height) * H;
    if (this.paused) {
      if (kind === "down") this.pause(false);
      return;
    }
    // Games without their own pointer handling treat a tap as the action.
    if (this.game.pointer) this.game.pointer(kind, x, y);
    else if (kind === "down") this.press("action");
    else this.release("action");
  }
  pause(paused) {
    if (paused === this.paused) return;
    this.paused = paused;
    this.releaseAll();
    this.parts.root.classList.toggle("is-paused", paused);
    const saved = [this.bannerText, this.hintText];
    if (paused) {
      this.banner("Paused");
      this.hint(coarse() ? "TAP to resume" : "SPACE to resume");
      [this.bannerText, this.hintText] = saved;
      this.restore = saved;
    } else {
      this.banner(this.restore?.[0] || null);
      this.hint(this.restore?.[1] || "");
    }
  }
  pop(bad) {
    const score = this.parts.score;
    score.classList.remove("is-pop", "is-drop");
    // Restart the animation even when pops follow each other closely.
    void score.offsetWidth;
    score.classList.add(bad ? "is-drop" : "is-pop");
  }
  float(text, x, y, tone) {
    const chip = element("span", `minigame-float ${tone}`.trim(), text);
    chip.style.left = `${Math.min(92, Math.max(8, (x / W) * 100))}%`;
    chip.style.top = `${Math.min(92, Math.max(8, (y / H) * 100))}%`;
    this.parts.floats.append(chip);
    // Never more than a few at once.
    while (this.parts.floats.childElementCount > 4) this.parts.floats.firstChild.remove();
    setTimeout(() => chip.remove(), 950);
  }
  banner(title) {
    const banner = this.parts.banner;
    this.bannerText = title;
    banner.hidden = !title;
    if (title) {
      banner.textContent = title;
      this.parts.status.textContent = title;
    }
  }
  hint(text) {
    this.hintText = text;
    if (this.parts.hint.textContent !== text) this.parts.hint.textContent = text;
  }
  dispose() {
    cancelAnimationFrame(this.raf);
    this.releaseAll();
    this.game?.dispose?.();
    this.listeners.forEach((off) => off());
    this.listeners = [];
  }
}

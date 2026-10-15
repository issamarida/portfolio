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
    ["down", "Brake", "Brake"],
    ["action", "Drift", "Handbrake"],
    ["up", "Gas", "Accelerate"],
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

// The full-screen stage for one game: a bar with Exit, the title and live
// stats; the pixel screen; overlay banners and toasts; touch controls.
function buildStage(meta) {
  const root = element("section", "minigame");
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "minigame-title");
  root.dataset.game = meta.id;
  const bar = element("header", "minigame-bar"),
    exit = element("button", "minigame-exit");
  exit.type = "button";
  exit.innerHTML = '<span aria-hidden="true">◀</span> Exit <kbd>Esc</kbd>';
  exit.setAttribute("aria-label", "Exit the game and return to the village");
  const title = element("h2", "minigame-title", meta.title);
  title.id = "minigame-title";
  const stats = element("dl", "minigame-stats"),
    cells = {};
  for (const { id, label } of meta.stats) {
    const cell = element("div", "minigame-stat"),
      value = element("dd", null, "0");
    cell.dataset.stat = id;
    cell.append(element("dt", null, label), value);
    stats.append(cell);
    cells[id] = value;
  }
  bar.append(exit, title, stats);
  const screen = element("div", "minigame-screen");
  screen.tabIndex = -1;
  screen.setAttribute("aria-label", `${meta.title}. ${meta.help.keys}`);
  const frame = element("div", "minigame-frame"),
    canvas = element("canvas", "minigame-canvas");
  canvas.width = W;
  canvas.height = H;
  canvas.setAttribute("aria-hidden", "true");
  const banner = element("div", "minigame-banner"),
    floats = element("div", "minigame-floats"),
    toasts = element("div", "minigame-toasts");
  banner.hidden = true;
  floats.setAttribute("aria-hidden", "true");
  toasts.setAttribute("aria-hidden", "true");
  frame.append(canvas, floats, banner, toasts);
  screen.append(frame);
  const help = element("p", "minigame-help");
  help.innerHTML = `<span class="minigame-keys">${meta.help.keys}</span><span class="minigame-taps">${meta.help.touch}</span>`;
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
  root.append(bar, screen, help, touch, status);
  return { root, exit, screen, frame, canvas, banner, floats, toasts, touch, status, cells };
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
    this.bannerState = null;
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
      hud: {
        set: (id, value) => {
          const cell = parts.cells[id];
          if (cell && cell.textContent !== String(value)) cell.textContent = value;
        },
        banner: (title, detail = "", hint = "") => this.banner(title, detail, hint),
        toast: (text, tone = "") => this.toast(text, tone),
        float: (text, x, y, tone = "") => this.float(text, x, y, tone),
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
    if (paused) {
      const saved = this.bannerState;
      this.banner("Paused", "The game waits for you.", "Press Space, P or tap to carry on");
      this.bannerState = saved;
    } else {
      const saved = this.bannerState;
      if (saved) this.banner(...saved);
      else this.banner(null);
    }
  }
  banner(title, detail, hint) {
    const banner = this.parts.banner;
    this.bannerState = title ? [title, detail, hint] : null;
    if (!title) {
      banner.hidden = true;
      return;
    }
    banner.replaceChildren(element("strong", null, title));
    if (detail) banner.append(element("span", "minigame-detail", detail));
    if (hint) banner.append(element("span", "minigame-hint", hint));
    banner.hidden = false;
    this.parts.status.textContent = [title, detail, hint].filter(Boolean).join(". ");
  }
  toast(text, tone) {
    const chip = element("span", `minigame-toast ${tone}`, text);
    this.parts.toasts.append(chip);
    while (this.parts.toasts.children.length > 3) this.parts.toasts.firstChild.remove();
    setTimeout(() => chip.remove(), 1900);
  }
  float(text, x, y, tone) {
    const chip = element("span", `minigame-float ${tone}`, text);
    chip.style.left = `${(x / W) * 100}%`;
    chip.style.top = `${(y / H) * 100}%`;
    this.parts.floats.append(chip);
    setTimeout(() => chip.remove(), 1100);
  }
  dispose() {
    cancelAnimationFrame(this.raf);
    this.releaseAll();
    this.game?.dispose?.();
    this.listeners.forEach((off) => off());
    this.listeners = [];
  }
}

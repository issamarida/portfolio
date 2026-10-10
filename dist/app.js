import { World, destinations, cabinSign } from "./world.js";
import { areas } from "./content.js";
import { interiorLabel } from "./interiors.js";
import { runIntro, shouldPlayIntro } from "./intro.js";
import { mountPillars } from "./pillars.js";
const canvas = document.querySelector("#world"),
  panel = document.querySelector("#panel"),
  interact = document.querySelector("#interact");
let returnFocus = null;
const status = document.querySelector("#world-status");
function prompt(near, kind) {
  if (kind === "exit") return "Leave the cabin";
  if (kind === "lectern")
    return `Open to read about ${near === "about" ? "me" : areas[near].name}`;
  const section =
    near === "gamedev" ? "game development" : areas[near].name.toLowerCase();
  return `Enter the ${section} cabin`;
}
// The prompt stands just under the player's feet (or over their head when
// they are near the bottom of the frame), kept inside the play area.
function placePrompt() {
  if (interact.hidden) return;
  const wrap = interact.parentElement,
    width = wrap.clientWidth,
    height = wrap.clientHeight,
    scale = width / 960,
    { x, y } = world.player,
    half = interact.offsetWidth / 2,
    below = (y + 10) * scale + interact.offsetHeight <= height - 4;
  interact.style.left = `${Math.min(width - half - 4, Math.max(half + 4, x * scale))}px`;
  interact.style.top = `${below ? (y + 10) * scale : (y - 52) * scale - interact.offsetHeight}px`;
}
const world = new World(canvas, (near, kind) => {
  interact.hidden = !near;
  const label = near ? prompt(near, kind) : "";
  interact.querySelector("span").textContent = label;
  status.textContent = label && `Press E to ${label.toLowerCase()}`;
  placePrompt();
});
world.onStep = placePrompt;
const worldWrap = document.querySelector(".world-wrap");
// Each roof label sits exactly over its painted billboard, in the button's
// own percentage space, so hover, focus and clicks match the art.
document.querySelectorAll(".building-access button").forEach((button) => {
  const d = destinations.find((d) => d.id === button.dataset.area),
    label = button.querySelector(".house-label");
  if (!d || !label) return;
  const sign = cabinSign(d),
    box = (name) => parseFloat(button.style.getPropertyValue(name));
  const [bx, by, bw, bh] = ["--x", "--y", "--w", "--h"].map(box);
  label.style.setProperty("--sign-left", `${(((sign.x / 960) * 100 - bx) / bw) * 100}%`);
  label.style.setProperty("--sign-top", `${(((sign.y / 540) * 100 - by) / bh) * 100}%`);
  label.style.setProperty("--sign-width", `${((sign.w / 960) * 100 * 100) / bw}%`);
  label.style.setProperty("--sign-height", `${((sign.h / 540) * 100 * 100) / bh}%`);
  label.classList.add("is-billboard");
});
world.onScene = (id) => {
  worldWrap.classList.toggle("is-inside", Boolean(id));
  status.textContent = id
    ? `Inside ${interiorLabel(id)}. Walk to the lectern and press E to read about ${areas[id].name}, or press Escape to leave.`
    : "Back in the village.";
};
world.onSignShade = (behind) =>
  document.querySelector(".reading-invitation").classList.toggle("is-see-through", behind);
world.onTransition = (active) =>
  worldWrap.classList.toggle("is-transitioning", active);
// E acts on whatever is nearby: a cabin door, a lectern or the way out.
function act() {
  if (!world.near || world.iris) return;
  if (world.nearKind === "cabin") world.enterCabin(world.near);
  else if (world.nearKind === "exit") world.leaveCabin();
  else openArea(world.near);
}
const journey = document.querySelector("#journey-world");
let worldTop = 0,
  worldScale = 1,
  layoutSignature = "",
  resizePending = false;
function updateViewport() {
  const top = (scrollY - worldTop) / worldScale;
  const viewport = {
    top: Math.max(0, top - 20),
    bottom: Math.min(world.layout.height, top + innerHeight / worldScale + 20),
  };
  world.setViewport(viewport);
  world.visible = world.viewport.bottom > world.viewport.top;
  world.gameVisible =
    world.viewport.bottom > world.layout.skyHeight + 274 &&
    world.viewport.top < world.layout.skyHeight + 500;
  if (!world.gameVisible) world.keys.clear();
}
function resizeJourney() {
  const box = journey.getBoundingClientRect();
  if (box.width <= 0 || box.height <= 0) return;
  worldTop = scrollY + box.top;
  worldScale = box.width / 960;
  const sections = [...document.querySelectorAll(".reading-section")].map(
    (section) => {
      const rect = section.getBoundingClientRect();
      return {
        id: section.id,
        x: (rect.left - box.left) / worldScale,
        y: (rect.top - box.top) / worldScale,
        width: rect.width / worldScale,
        height: rect.height / worldScale,
      };
    },
  );
  const stableBox = document
    .querySelector(".stable-clearing")
    .getBoundingClientRect();
  const dividerBox = document
    .querySelector(".river-divider")
    .getBoundingClientRect();
  const driftBox = document
    .querySelector(".drift-clearing")
    .getBoundingClientRect();
  const invitationBox = document
    .querySelector(".reading-invitation")
    .getBoundingClientRect();
  const moonBox = document
    .querySelector(".moon-clearing")
    .getBoundingClientRect();
  const layout = {
    clearings: [],
    invitation: {
      x: 0,
      y: (invitationBox.top - box.top) / worldScale,
      width: 960,
      height: invitationBox.height / worldScale,
    },
    moonArea: {
      x: 0,
      y: (moonBox.top - box.top) / worldScale,
      width: 960,
      height: 90,
    },
    drift: {
      x: (driftBox.left - box.left) / worldScale,
      y: (driftBox.top - box.top) / worldScale,
      width: driftBox.width / worldScale,
      height: driftBox.height / worldScale,
    },
    scale: worldScale,
    divider: {
      x: (dividerBox.left - box.left) / worldScale,
      y: (dividerBox.top - box.top) / worldScale,
      width: dividerBox.width / worldScale,
      height: dividerBox.height / worldScale,
    },
    stable: {
      x: (stableBox.left - box.left) / worldScale,
      y: (stableBox.top - box.top) / worldScale,
      width: stableBox.width / worldScale,
      height: stableBox.height / worldScale,
    },
    height: Math.ceil(box.height / worldScale / 2) * 2,
    sections,
    skyHeight:
      (document.querySelector(".game-frame").getBoundingClientRect().top -
        box.top) /
      worldScale,
  };
  const signature = JSON.stringify([box.width, layout], (key, value) =>
    typeof value === "number" ? Math.round(value * 100) / 100 : value,
  );
  if (signature !== layoutSignature) {
    world.setLayout(layout);
    layoutSignature = signature;
  }
  // On desktop the reading sign stands in the village; phones keep it
  // below the river, where it is no obstacle.
  const frame = document.querySelector(".game-frame").getBoundingClientRect(),
    sign = document.querySelector(".reading-invitation a").getBoundingClientRect(),
    signRect = {
      x: (sign.left - frame.left) / worldScale,
      y: (sign.top - frame.top) / worldScale,
      w: sign.width / worldScale,
      h: sign.height / worldScale,
    };
  world.setReadingSign(
    sign.width && signRect.y >= 0 && signRect.y + signRect.h <= 540 ? signRect : null,
  );
  updateViewport();
  world.draw();
  placePrompt();
}
resizeJourney();
function scheduleResize() {
  if (resizePending) return;
  resizePending = true;
  requestAnimationFrame(() => {
    resizePending = false;
    resizeJourney();
  });
}
new ResizeObserver(scheduleResize).observe(journey);
document.fonts.ready.then(scheduleResize);
addEventListener("scroll", updateViewport, { passive: true });
addEventListener("resize", scheduleResize);
window.visualViewport?.addEventListener("resize", scheduleResize);
function stopExploring() {
  world.keys.clear();
  if (document.activeElement === canvas) canvas.blur();
}
addEventListener("wheel", stopExploring, { passive: true });
canvas.addEventListener("pointercancel", stopExploring);
document
  .querySelectorAll(".reading-section,.reading-invitation,.social-links")
  .forEach((element) => element.addEventListener("pointerdown", stopExploring));
function openArea(id) {
  const area = areas[id];
  if (!area) return;
  returnFocus = document.activeElement;
  world.active = false;
  world.keys.clear();
  document.querySelector("#panel-kicker").textContent =
    `${area.number} / ${area.subtitle}`;
  const source = document.querySelector(`#${area.sectionId} .section-body`);
  const body = source.cloneNode(true);
  // Cloned dialog content must not duplicate document IDs.
  body
    .querySelectorAll("[id]")
    .forEach((element) => element.removeAttribute("id"));
  const title = document.createElement("h2");
  title.id = "panel-title";
  title.textContent = area.name;
  document.querySelector("#panel-content").replaceChildren(title, body);
  panel.showModal();
  panel.scrollTop = 0;
  document.querySelector("#close-panel").focus();
}
function closeArea() {
  panel.close();
}
panel.addEventListener("close", () => {
  world.active = true;
  world.keys.clear();
  returnFocus?.focus();
});
panel.addEventListener("click", (e) => {
  if (e.target === panel) {
    const b = panel.getBoundingClientRect();
    if (
      e.clientX < b.left ||
      e.clientX > b.right ||
      e.clientY < b.top ||
      e.clientY > b.bottom
    )
      closeArea();
  }
});
document.querySelector("#close-panel").addEventListener("click", closeArea);
document.querySelector("#return-world").addEventListener("click", closeArea);
document
  .querySelectorAll("[data-area]")
  .forEach((b) => b.addEventListener("click", () => openArea(b.dataset.area)));
interact.addEventListener("click", act);
const movement = {
  w: "up",
  ArrowUp: "up",
  a: "left",
  ArrowLeft: "left",
  s: "down",
  ArrowDown: "down",
  d: "right",
  ArrowRight: "right",
};
window.addEventListener("keydown", (e) => {
  if (panel.open || !world.gameVisible || e.ctrlKey || e.metaKey || e.altKey)
    return;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const focused = document.activeElement;
  if (focused !== canvas && focused !== document.body) return;
  if (movement[key]) {
    e.preventDefault();
    world.keys.add(movement[key]);
  }
  if ((key === "e" || key === "Enter") && world.near) {
    e.preventDefault();
    act();
  }
  if (key === "Escape" && world.interior) {
    e.preventDefault();
    world.keys.clear();
    world.leaveCabin();
  }
});
window.addEventListener("keyup", (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  world.keys.delete(movement[key]);
});
window.addEventListener("blur", () => world.keys.clear());
document.addEventListener("visibilitychange", () => {
  world.keys.clear();
});
canvas.addEventListener("pointerdown", (event) => {
  const y =
    (event.clientY + scrollY - worldTop) / worldScale - world.layout.skyHeight;
  if (y >= 0 && y <= 540) canvas.focus({ preventScroll: true });
});
document.querySelectorAll("[data-move]").forEach((b) => {
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    canvas.focus({ preventScroll: true });
    world.keys.add(b.dataset.move);
  });
  const stop = () => world.keys.delete(b.dataset.move);
  b.addEventListener("pointerup", stop);
  b.addEventListener("pointercancel", stop);
  b.addEventListener("lostpointercapture", stop);
});
// Touch destination tap: clicking a nearby entrance opens it, a distant one remains explorable through navigation.
canvas.addEventListener("click", (e) => {
  const y =
    (e.clientY + scrollY - worldTop) / worldScale - world.layout.skyHeight;
  if (
    e.pointerType === "touch" &&
    world.gameVisible &&
    y >= 0 &&
    y <= 540 &&
    world.near
  )
    act();
});
matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
  "change",
  (e) => {
    world.reduced = e.matches;
  },
);
mountPillars(document.querySelector(".shell"));
// Key phrases light up one after another as each passage scrolls into view.
if ("IntersectionObserver" in window) {
  const reveal = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-lit");
        reveal.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -15% 0px" },
  );
  document.querySelectorAll(".reading-section mark.kw").forEach((mark) => {
    const order = [...mark.parentElement.querySelectorAll(":scope > mark.kw")].indexOf(mark);
    mark.style.setProperty("--kw-delay", `${order * 0.22}s`);
    reveal.observe(mark);
  });
  document.documentElement.classList.add("kw-ready");
}
if (shouldPlayIntro())
  runIntro(world, {
    onFinish: () => {
      updateViewport();
      canvas.focus({ preventScroll: true });
    },
  });

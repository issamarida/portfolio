// Hidden extras that reward exploring: both arcade cabinets in the Game Dev
// cabin, the fisherman at the bottom of the page and the drifting pickup in
// the forest clearing open their own minigames. This module only places the
// clickable spots and their "Click me!" planks; the games themselves load
// on demand and run in the separate stage (minigames/stage.js).
import { ARCADES } from "./interiors.js";
import { driftState } from "./journey.js";
import { launchMinigame } from "./minigames/stage.js";

const ANGLER = { x: 722, y: 496 },
  DRIFT_HEIGHT = 360,
  CAMP_HEIGHT = 600;

function spot(className, label, box) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `egg-spot ${className}`;
  button.setAttribute("aria-label", label);
  for (const [key, value] of Object.entries(box)) button.style.setProperty(`--${key}`, value);
  const tag = document.createElement("span");
  tag.className = "egg-tag";
  tag.setAttribute("aria-hidden", "true");
  tag.textContent = "Click me!";
  button.append(tag);
  return button;
}

const centre = (element) => {
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
};

export function mountEggs({ world, restore }) {
  const wrap = document.querySelector(".world-wrap"),
    driftClearing = document.querySelector(".drift-clearing"),
    camp = document.querySelector(".stable-clearing");

  function play(id, from) {
    closeOffer(false);
    launchMinigame(id, {
      world,
      origin: from ? centre(from) : { x: innerWidth / 2, y: innerHeight / 2 },
      restore: () => restore(id),
    }).catch(() => {
      // A failed download leaves the page exactly as it was.
    });
  }

  // Arcade cabinets, in the village frame's own percentage space.
  const arcades = {};
  for (const cabinet of ARCADES) {
    const button = spot("egg-arcade", `Play ${cabinet.title} on the arcade cabinet`, {
      x: `${(cabinet.x / 960) * 100}%`,
      y: `${(cabinet.top / 540) * 100}%`,
      w: `${(cabinet.w / 960) * 100}%`,
      h: `${((cabinet.bottom - cabinet.top) / 540) * 100}%`,
    });
    button.dataset.game = cabinet.game;
    button.addEventListener("click", () => play(cabinet.game, button));
    wrap.append(button);
    arcades[cabinet.game] = button;
  }

  // The drifting pickup: its spot rides along with the truck.
  const car = spot("egg-car", "Take the wheel of the drifting pickup", {
    x: "50%",
    y: "57%",
    w: `${(92 / 960) * 100}%`,
    h: `${(64 / DRIFT_HEIGHT) * 100}%`,
  });
  car.addEventListener("click", () => play("drift", car));
  driftClearing.append(car);
  let carShown = false,
    carFrame = 0;
  const followCar = () => {
    carFrame = carShown ? requestAnimationFrame(followCar) : 0;
    if (world.suspended) return;
    const state = driftState(world.time, world.reduced);
    car.style.left = `${(state.x / 960) * 100}%`;
    car.style.top = `${(state.y / DRIFT_HEIGHT) * 100}%`;
  };
  followCar();
  if ("IntersectionObserver" in window)
    new IntersectionObserver(([entry]) => {
      carShown = entry.isIntersecting;
      if (carShown && !carFrame) carFrame = requestAnimationFrame(followCar);
    }).observe(driftClearing);

  // The fisherman offers his rod before the game starts.
  const angler = spot("egg-angler", "Talk to the fisherman", {
    x: `${((ANGLER.x - 26) / 960) * 100}%`,
    y: `${((ANGLER.y - 44) / CAMP_HEIGHT) * 100}%`,
    w: `${(52 / 960) * 100}%`,
    h: `${(76 / CAMP_HEIGHT) * 100}%`,
  });
  angler.setAttribute("aria-haspopup", "dialog");
  angler.setAttribute("aria-expanded", "false");
  const offer = document.createElement("div");
  offer.className = "egg-offer";
  offer.hidden = true;
  offer.setAttribute("role", "dialog");
  offer.setAttribute("aria-labelledby", "egg-offer-line");
  offer.innerHTML = `
    <p id="egg-offer-line"><span class="egg-offer-name">The fisherman</span>Quiet night, and they’re biting. Fancy a cast?</p>
    <div class="egg-offer-actions">
      <button type="button" class="egg-offer-yes">Grab a rod</button>
      <button type="button" class="egg-offer-no">Not now</button>
    </div>`;
  const yes = offer.querySelector(".egg-offer-yes"),
    no = offer.querySelector(".egg-offer-no");
  camp.append(angler, offer);

  function openOffer() {
    offer.hidden = false;
    angler.setAttribute("aria-expanded", "true");
    // The board's pointer reaches down to the fisherman wherever it sits.
    const board = offer.getBoundingClientRect(),
      him = angler.getBoundingClientRect();
    offer.style.setProperty(
      "--tail",
      `${Math.min(board.width - 24, Math.max(16, him.left + him.width / 2 - board.left))}px`,
    );
    yes.focus({ preventScroll: true });
  }
  function closeOffer(returnFocus = true) {
    if (offer.hidden) return;
    offer.hidden = true;
    angler.setAttribute("aria-expanded", "false");
    if (returnFocus) angler.focus({ preventScroll: true });
  }
  angler.addEventListener("click", () => (offer.hidden ? openOffer() : closeOffer()));
  yes.addEventListener("click", () => play("fishing", angler));
  no.addEventListener("click", () => closeOffer());
  offer.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    closeOffer();
  });
  document.addEventListener("pointerdown", (event) => {
    if (!offer.hidden && !offer.contains(event.target) && !angler.contains(event.target))
      closeOffer(false);
  });

  return {
    play(id) {
      play(id, arcades[id] || null);
    },
    // The cabinet the player stands at shows its plank as if hovered.
    setNear(id) {
      for (const [game, button] of Object.entries(arcades))
        button.classList.toggle("is-near", game === id);
    },
    arcadeTitle: (id) => ARCADES.find((a) => a.game === id)?.title || "",
  };
}

// Hidden extras that reward exploring: both arcade cabinets in the Game Dev
// cabin, the marshmallow camper and the sword memorial by the reading sign,
// the drifting pickup in the forest clearing and the fisherman at the bottom
// of the page each open their own minigame, straight away on a click. This
// module only places the clickable spots and their "Click me!" planks; the
// games themselves load on demand and run in the separate stage
// (minigames/stage.js).
import { ARCADES } from "./interiors.js";
import { driftState } from "./journey.js";
import { launchMinigame } from "./minigames/stage.js";

// Spots by the reading sign, relative to the middle of its band: the
// camper and his fire at x 150, the memorial's sword at x 800.
const LANDMARK_SPOTS = {
  camper: [36, -62, 140, 96],
  memorial: [742, -78, 116, 116],
};
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

  // The fisherman lends his rod: a click goes straight to the lake.
  const angler = spot("egg-angler", "Borrow the fisherman's rod and play the fishing game", {
    x: `${((ANGLER.x - 26) / 960) * 100}%`,
    y: `${((ANGLER.y - 44) / CAMP_HEIGHT) * 100}%`,
    w: `${(52 / 960) * 100}%`,
    h: `${(76 / CAMP_HEIGHT) * 100}%`,
  });
  angler.addEventListener("click", () => play("fishing", angler));
  camp.append(angler);

  // The camper toasting marshmallows and the sword memorial stand either
  // side of the reading sign; their spots follow the world's own layout,
  // in the same village units the scene is painted in.
  const journey = document.querySelector("#journey-world");
  const camper = spot("egg-camper", "Toast marshmallows with the camper", {}),
    memorial = spot("egg-memorial", "Draw the sword at the memorial and play the slicing game", {});
  camper.addEventListener("click", () => play("toast", camper));
  memorial.addEventListener("click", () => play("slice", memorial));
  journey.append(camper, memorial);
  const unit = (value) => `calc(${value.toFixed(2)} * 100cqw / 960)`;
  function place(layout) {
    const band = layout?.invitation;
    for (const button of [camper, memorial]) button.hidden = !band;
    if (!band) return;
    const middle = band.y + band.height / 2;
    for (const [button, [x, y, w, h]] of [
      [camper, LANDMARK_SPOTS.camper],
      [memorial, LANDMARK_SPOTS.memorial],
    ])
      for (const [key, value] of Object.entries({ x, y: middle + y, w, h }))
        button.style.setProperty(`--${key}`, unit(value));
  }
  place(world.layout);

  return {
    play(id) {
      play(id, arcades[id] || null);
    },
    place,
    // The cabinet the player stands at shows its plank as if hovered.
    setNear(id) {
      for (const [game, button] of Object.entries(arcades))
        button.classList.toggle("is-near", game === id);
    },
    arcadeTitle: (id) => ARCADES.find((a) => a.game === id)?.title || "",
  };
}

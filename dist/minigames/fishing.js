// Moonlit Angler: the fisherman lends you his rod at the same night lake as
// his camp at the bottom of the page. Hold to wind up and release to cast,
// wait for the bobber to plunge, strike, then keep the fish inside the net
// zone until the meter fills. Each fish swims its own way and some are much
// rarer than others. One night lasts 75 seconds; no inventory, no menus.
import { W, H, painter, surface, format, seeded, nightSky, horizon, clamp } from "./pixel.js";

export const meta = { id: "fishing", title: "Moonlit Angler", touch: "hold", touchLabel: "Hold" };

export const NIGHT = 75;

// Species: weight is how common they are; behaviour shapes the fight.
// Common fish drift gently and leave a wide net; the rare ones are a
// little quicker and narrower, so there is still something to chase.
export const FISH = [
  { id: "perch", name: "Moon Perch", rarity: "Common", weight: 46, behaviour: "smooth", agility: 1.1, zone: 0.44, size: [14, 24], body: "#8aa0a0", back: "#5a7a7a", belly: "#c8d8d0", fin: "#c4552e" },
  { id: "bream", name: "Reed Bream", rarity: "Common", weight: 30, behaviour: "floater", agility: 0.9, zone: 0.44, size: [20, 34], body: "#c49a4a", back: "#8a6a3a", belly: "#e8d098", fin: "#8a6a3a" },
  { id: "trout", name: "Lantern Trout", rarity: "Uncommon", weight: 15, behaviour: "dart", agility: 2, zone: 0.38, size: [26, 44], body: "#7fa07a", back: "#4a6a4a", belly: "#e8d7ad", fin: "#e48f7a" },
  { id: "pike", name: "Mossback Pike", rarity: "Rare", weight: 7, behaviour: "sinker", agility: 2.4, zone: 0.33, size: [50, 80], body: "#5a7a44", back: "#3a4a2a", belly: "#b8c888", fin: "#749151" },
  { id: "koi", name: "Starlit Koi", rarity: "Legendary", weight: 2, behaviour: "mixed", agility: 3.2, zone: 0.28, size: [40, 62], body: "#f0ece0", back: "#e4573d", belly: "#fff8e8", fin: "#f0a040" },
];
const RARITY_BOOST = { Common: 0, Uncommon: 1, Rare: 2, Legendary: 3 };

// A longer, cleaner cast reaches deeper water, where rarer fish swim.
export function pickFish(roll, power = 0, perfect = false) {
  const weights = FISH.map((fish) => {
    const boost = RARITY_BOOST[fish.rarity];
    return fish.weight * (1 + boost * power) * (perfect && boost >= 2 ? 1.5 : 1);
  });
  let pick = roll * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < FISH.length; i++) if ((pick -= weights[i]) < 0) return FISH[i];
  return FISH[FISH.length - 1];
}

// The fight: the net zone rises while held and sinks when released,
// bouncing off the bottom; the meter fills while the fish is in the net.
// Forgiving by design: the meter starts near half, fills quickly and drains
// slowly, so a wobble or two never loses a fish.
export const REEL = { lift: 2.6, sink: 2, fill: 0.42, drain: 0.11, start: 0.45 };
export function reelStep(fight, holding, dt) {
  fight.zv += (holding ? REEL.lift : -REEL.sink) * dt;
  fight.zone += fight.zv * dt;
  if (fight.zone < 0) {
    fight.zone = 0;
    fight.zv = Math.abs(fight.zv) > 0.4 ? -fight.zv * 0.35 : 0;
  }
  if (fight.zone + fight.size > 1) {
    fight.zone = 1 - fight.size;
    fight.zv = Math.min(0, fight.zv);
  }
  fight.inside = fight.fish >= fight.zone && fight.fish <= fight.zone + fight.size;
  fight.progress = clamp(fight.progress + (fight.inside ? REEL.fill : -REEL.drain) * dt, 0, 1);
  return fight.progress >= 1 ? "caught" : fight.progress <= 0 ? "escaped" : "fighting";
}
// Where each kind of fish wants to be next, and how fast it gets there.
export function swimStep(fight, species, dt, random) {
  fight.timer -= dt;
  fight.clock += dt;
  const pick = (low, high) => low + random() * (high - low);
  if (fight.timer <= 0) {
    switch (species.behaviour) {
      case "smooth":
        fight.timer = pick(1.6, 2.4);
        fight.target = pick(0.3, 0.7);
        break;
      case "floater":
        fight.timer = pick(1.8, 2.6);
        fight.target = pick(0.45, 0.8);
        break;
      case "dart":
        fight.timer = pick(1.2, 1.9);
        fight.target = random() < 0.5 ? pick(0.15, 0.4) : pick(0.6, 0.85);
        break;
      case "sinker":
        fight.timer = pick(1.1, 1.8);
        fight.target = random() < 0.75 ? pick(0.1, 0.4) : pick(0.55, 0.8);
        break;
      default:
        fight.timer = pick(0.8, 1.3);
        fight.target = pick(0.08, 0.92);
    }
  }
  const wobble = species.behaviour === "smooth" ? Math.sin(fight.clock * 1.6) * 0.04 : 0;
  fight.fish = clamp(fight.fish + (fight.target + wobble - fight.fish) * Math.min(1, dt * species.agility), 0, 1);
  return fight.fish;
}

// Scene anchors.
const HORIZON = 112,
  DOCK = { left: 104, right: 252, top: 186 },
  ANGLER = { x: 230, feet: 186 },
  HAND = { x: 238, y: 168 },
  BUCKET = { x: 207, y: 186 },
  ROD = 36,
  BAR = { x: 278, y: 30, w: 20, h: 142 };
const SHORE = [
  [62, 112],
  [76, 128],
  [94, 148],
  [110, 172],
  [118, 196],
  [110, 226],
  [98, 270],
];
function shoreEdge(y) {
  for (let i = 1; i < SHORE.length; i++) {
    const [x0, y0] = SHORE[i - 1],
      [x1, y1] = SHORE[i];
    if (y <= y1) return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0 || 1);
  }
  return SHORE.at(-1)[0];
}

export function createGame(api) {
  const { ctx, hud, best } = api,
    p = painter(ctx),
    random = seeded(Date.now() & 0xffff);
  const backdrop = paintBackdrop();
  let state, clock, timer, night, started, catches, power, cast, bob, fight, species, landing, particles, ripples, message, bestCatch, ended, biggest, seen;
  bestCatch = best.get();

  function paintBackdrop() {
    const { canvas, ctx: c } = surface(W, H),
      b = painter(c);
    nightSky(b, HORIZON, 23, { x: 368, y: 40, r: 18 });
    horizon(b, HORIZON - 10, 13);
    b.rect(0, HORIZON - 4, W, 4, "#16261f");
    // The lake.
    b.rect(0, HORIZON, W, H - HORIZON, "#1a2550");
    for (let y = HORIZON; y < H; y += 12) b.rect(0, y + 6, W, 6, y < 160 ? "#1c284f" : "#1a2550");
    // Far shore lights: his tent and the village beyond the trees.
    for (const [x, y] of [
      [150, HORIZON - 6],
      [432, HORIZON - 5],
    ]) {
      b.glow(x, y, 8, "#ffb860", 0.14);
      b.rect(x, y, 2, 2, "#ffd27a");
    }
    // Lily pads and reeds.
    const r = seeded(77);
    for (let i = 0; i < 9; i++) {
      const x = 130 + r() * 320,
        y = 200 + r() * 60;
      if (x < 260 && y < 225) continue;
      b.oval(x, y, 7, 3, "#2f5a3a");
      b.rect(x - 2, y - 1, 4, 1, "#4a7a4a");
      if (r() < 0.3) b.rect(x + 2, y - 3, 2, 2, "#f0a8c4");
    }
    // The near shore, row by row so its edge stays on the pixel grid.
    for (let y = HORIZON; y < H; y++) {
      const edge = Math.round(shoreEdge(y));
      b.rect(0, y, edge, 1, y % 5 ? "#2c3a24" : "#34442a");
      b.rect(edge - 3, y, 3, 1, "#4a3e2c");
      b.rect(edge, y, 2, 1, "#55597a");
    }
    for (let i = 0; i < 40; i++) {
      const y = HORIZON + 4 + r() * (H - HORIZON - 8),
        x = r() * (shoreEdge(y) - 8);
      b.rect(x, y, 2, 1, r() < 0.5 ? "#3a4a2c" : "#4a3a28");
    }
    for (const [x, y] of [
      [112, 182],
      [116, 214],
      [104, 240],
    ])
      for (let i = 0; i < 4; i++) {
        b.rect(x + i * 3, y - 10 - (i % 2) * 4, 1, 12, "#5a7040");
        b.rect(x + i * 3 - 1, y - 12 - (i % 2) * 4, 2, 4, "#8a6a3a");
      }
    // His patched tent with a lamp inside.
    const tx = 40,
      ty = 160;
    b.oval(tx, ty + 2, 34, 4, "#141810");
    for (let y = 0; y < 34; y++) {
      const half = Math.round((y / 34) * 30);
      b.rect(tx - half, ty - 34 + y, half * 2, 1, y % 7 ? "#a8946c" : "#8a7a5a");
      b.rect(tx - half, ty - 34 + y, Math.max(1, half - 6), 1, "#c8b48a");
    }
    for (let y = 0; y < 18; y++) {
      const half = Math.round((y / 18) * 8);
      b.rect(tx - half, ty - 18 + y, half * 2, 1, y > 4 ? "#ffb347" : "#2a2018");
    }
    b.rect(tx - 10, ty - 22, 6, 5, "#8a7a5a");
    b.glow(tx, ty - 8, 26, "#ffb860", 0.08);
    // Dock posts and their reflections, then the boards.
    for (const x of [130, 174, 218, 246]) {
      b.rect(x, DOCK.top + 8, 4, 22, "#3c201e");
      b.rect(x + 1, DOCK.top + 8, 1, 22, "#844024");
      for (let k = 0; k < 4; k++) b.rect(x - (k % 2), DOCK.top + 32 + k * 4, 4, 2, "#2a2440");
    }
    b.rect(DOCK.left, DOCK.top, DOCK.right - DOCK.left, 8, "#7a3c22");
    b.rect(DOCK.left, DOCK.top, DOCK.right - DOCK.left, 1, "#b0663a");
    b.rect(DOCK.left, DOCK.top + 8, DOCK.right - DOCK.left, 3, "#2c181b");
    for (let x = DOCK.left + 5; x < DOCK.right; x += 6) b.rect(x, DOCK.top + 1, 1, 7, "#5c2d1f");
    // Lantern post at the end of the dock and his tackle box.
    b.rect(DOCK.right - 4, DOCK.top - 26, 2, 26, "#3c201e");
    b.rect(DOCK.right - 8, DOCK.top - 30, 8, 2, "#4a3a2a");
    b.rect(DOCK.right - 7, DOCK.top - 28, 6, 6, "#f6cf5a");
    b.rect(DOCK.right - 6, DOCK.top - 27, 2, 3, "#fff0b0");
    b.rect(DOCK.right - 8, DOCK.top - 22, 8, 2, "#4a3a2a");
    b.glow(DOCK.right - 4, DOCK.top - 25, 30, "#f6cf5a", 0.1);
    for (let i = 0; i < 7; i++) b.rect(DOCK.right - 8 + Math.sin(i * 2.1) * 2, DOCK.top + 14 + i * 4, 6 - (i % 3) * 2, 1, i % 2 ? "#c07a3a" : "#ffd27a");
    b.rect(176, DOCK.top - 6, 10, 6, "#4a5a3a");
    b.rect(176, DOCK.top - 6, 10, 2, "#6a7a4a");
    // His canoe tied alongside.
    b.oval(160, 222, 34, 5, "#10173a");
    for (let y = 0; y < 6; y++) b.rect(132 + y * 2, 216 + y, 56 - y * 4, 1, y < 2 ? "#a0613b" : "#5c2d1f");
    b.line(132, 216, 128, DOCK.top + 10, "#c0b090");
    return canvas;
  }

  function newNight() {
    state = "idle";
    clock = 0;
    timer = 0;
    night = NIGHT;
    started = false;
    ended = false;
    catches = [];
    biggest = null;
    seen = new Set();
    power = 0;
    cast = null;
    bob = null;
    fight = null;
    species = null;
    landing = null;
    particles = [];
    ripples = [];
    hud.banner(null);
    hint();
  }

  // One short hint below the game, following what the rod is doing.
  let hinted = null;
  function hint() {
    if (hinted === state) return;
    hinted = state;
    const [keys, taps] = {
      idle: ["Hold Space to cast", "Hold to cast"],
      charging: ["Let go to cast", "Let go to cast"],
      casting: ["Wait for a bite", "Wait for a bite"],
      waiting: ["Wait for a bite", "Wait for a bite"],
      bite: ["Space to strike!", "Tap to strike!"],
      fight: ["Hold Space to reel in", "Hold to reel in"],
      done: ["Space to fish again", "Tap to fish again"],
    }[state] || [null, null];
    if (keys) hud.hint(keys, taps);
  }
  function say(text, tone = "") {
    hud.float(text, 240, 44, tone);
  }
  function splash(x, y, count = 8, color = "#a8c8e8") {
    for (let i = 0; i < count; i++)
      particles.push({ x, y, vx: (random() - 0.5) * 60, vy: -30 - random() * 50, life: 0.5 + random() * 0.4, color });
    ripples.push({ x, y, age: 0 });
  }

  function press(action) {
    if (action !== "action") return;
    if (state === "done") {
      if (clock > 0.6) newNight();
      return;
    }
    if (state === "idle") {
      if (!started) {
        started = true;
        hud.banner(null);
      }
      state = "charging";
      timer = 0;
      power = 0;
    } else if (state === "bite") hook();
  }
  function release(action) {
    if (action !== "action" || state !== "charging") return;
    const perfect = power > 0.9;
    if (perfect) say("Perfect cast!");
    const reach = 0.15 + power * 0.85;
    cast = {
      from: tip(),
      to: { x: 268 + reach * 176, y: 216 - reach * 76 },
      power: reach,
      perfect,
      t: 0,
    };
    state = "casting";
    timer = 0;
  }
  function hook() {
    species = pickFish(random(), cast.power, cast.perfect);
    fight = {
      zone: 0.35,
      zv: 0,
      size: species.zone,
      fish: 0.4,
      target: 0.5,
      timer: 0,
      clock: 0,
      progress: REEL.start,
      inside: false,
    };
    state = "fight";
    timer = 0;
    splash(bob.x, bob.y, 10);
    hud.announce(`Hooked something. Hold to keep it in the net.`);
  }
  function reelIn() {
    state = "reeling";
    timer = 0;
  }
  function land() {
    const [low, high] = species.size,
      size = Math.round(low + random() * (high - low));
    landing = { species, size, t: 0, from: { x: bob.x, y: bob.y } };
    state = "landing";
    timer = 0;
    splash(bob.x, bob.y, 14);
  }

  function rodAngle() {
    switch (state) {
      case "charging":
        return -1.15 - power * 1.05;
      case "casting":
        return -2.2 + Math.min(1, cast.t / 0.16) * 1.6;
      case "waiting":
      case "bite":
        return -0.72 + (state === "bite" ? 0.18 : 0);
      case "fight":
        return -0.5 + Math.sin(clock * 11) * 0.06 + (fight.inside ? 0 : 0.08);
      case "landing":
        return -1.25 - Math.sin(Math.min(1, landing.t / 0.5) * Math.PI) * 0.3;
      default:
        return -1.15;
    }
  }
  function tip() {
    const a = rodAngle();
    return { x: HAND.x + Math.cos(a) * ROD, y: HAND.y + Math.sin(a) * ROD };
  }
  const arc = (a, b, k, height) => ({
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * height,
  });

  function update(dt) {
    clock += dt;
    timer += dt;
    if (started && !ended && state !== "done") {
      night = Math.max(0, night - dt);
      // When the night runs out, a fish already on the line still counts.
      if (night === 0 && !["fight", "landing"].includes(state)) endNight();
    }
    switch (state) {
      case "charging":
        // The wind-up swings back and forth, so a perfect cast is timing.
        power = 1 - Math.abs(((timer / 1.1) % 2) - 1);
        break;
      case "casting":
        cast.t += dt;
        {
          const k = Math.min(1, cast.t / 0.65);
          bob = arc(cast.from, cast.to, k, 40);
          if (k >= 1) {
            bob = { ...cast.to };
            splash(bob.x, bob.y, 6);
            state = "waiting";
            timer = 0;
            cast.wait = 1.4 + random() * (3.6 - cast.power * 1.2);
            cast.nibbles = [0.3, 0.55, 0.8].map((f) => f * cast.wait + random() * 0.2);
          }
        }
        break;
      case "waiting":
        if (cast.nibbles.some((n) => Math.abs(timer - n) < dt)) ripples.push({ x: bob.x, y: bob.y, age: 0 });
        if (timer >= cast.wait) {
          state = "bite";
          timer = 0;
          splash(bob.x, bob.y, 6);
          hud.announce("A bite! Strike now.");
        }
        break;
      case "bite":
        if (timer > 1.3) {
          say("It slipped the hook.", "is-bad");
          reelIn();
        }
        break;
      case "fight": {
        swimStep(fight, species, dt, random);
        const result = reelStep(fight, api.held("action"), dt);
        // The fish thrashes at the float.
        if (random() < dt * 8) particles.push({ x: bob.x + (random() - 0.5) * 8, y: bob.y, vx: (random() - 0.5) * 40, vy: -20 - random() * 30, life: 0.4, color: "#a8c8e8" });
        if (result === "caught") land();
        else if (result === "escaped") {
          say("It got away!", "is-bad");
          reelIn();
        }
        break;
      }
      case "landing":
        landing.t += dt;
        if (landing.t >= 1.25) {
          splash(BUCKET.x, BUCKET.y - 10, 6);
          const fresh = !seen.has(landing.species.id);
          seen.add(landing.species.id);
          catches.push(landing);
          if (!biggest || landing.size > biggest.size) biggest = landing;
          say(`${landing.species.name} · ${landing.size} cm${landing.species.rarity === "Common" ? "" : ` · ${landing.species.rarity}`}${fresh && catches.length > 1 ? " · new!" : ""}`);
          hud.announce(`Caught a ${landing.species.name}, ${landing.size} centimetres, ${landing.species.rarity}.`);
          landing = null;
          bob = null;
          state = night === 0 ? "done" : "idle";
          if (night === 0) endNight();
        }
        break;
      case "reeling":
        if (bob) {
          const t = tip(),
            k = Math.min(1, dt * 7);
          bob = { x: bob.x + (t.x - bob.x) * k, y: bob.y + (t.y + 10 - bob.y) * k };
        }
        if (timer > 0.55) {
          bob = null;
          state = night === 0 ? "done" : "idle";
          if (night === 0) endNight();
        }
        break;
    }
    for (const particle of particles) {
      particle.life -= dt;
      particle.vy += 160 * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
    }
    particles = particles.filter((particle) => particle.life > 0);
    for (const ripple of ripples) ripple.age += dt;
    ripples = ripples.filter((ripple) => ripple.age < 1.2);
    hint();
    hud.score(
      `${catches.length} ${catches.length === 1 ? "fish" : "fish"} · ${Math.floor(Math.ceil(night) / 60)}:${String(Math.ceil(night) % 60).padStart(2, "0")}`,
    );
  }
  function endNight() {
    if (ended) return;
    ended = true;
    bob = null;
    fight = null;
    state = "done";
    clock = 0;
    best.save(catches.length);
    const record = catches.length > bestCatch && catches.length > 0;
    bestCatch = Math.max(bestCatch, catches.length);
    hud.banner(record ? "Best night yet!" : "Night’s over");
    hint();
  }

  // --- Drawing -------------------------------------------------------------
  function fishSprite(fishType, x, y, length, facing = 1, flap = 0) {
    const h = Math.max(3, Math.round(length * 0.38)),
      half = length / 2;
    for (let i = 0; i < length; i++) {
      const k = i / length,
        thick = Math.round(h * Math.sin(Math.min(1, k * 1.15) * Math.PI) * 0.55 + 1),
        px = x + (facing > 0 ? half - i : -half + i);
      p.rect(px, y - thick, 1, thick, fishType.back);
      p.rect(px, y, 1, thick, k > 0.15 && k < 0.85 ? fishType.belly : fishType.body);
      p.rect(px, y - 1, 1, 2, fishType.body);
    }
    if (fishType.id === "koi")
      for (const k of [0.3, 0.6]) p.rect(x + (facing > 0 ? half - k * length : -half + k * length) - 1, y - 2, 3, 2, "#e4573d");
    if (fishType.id === "trout") p.rect(x - half + 3, y - 1, length - 6, 1, "#e48f7a");
    const tail = x + (facing > 0 ? -half : half),
      spread = 2 + flap;
    p.rect(tail - (facing > 0 ? 3 : 0), y - spread, 3, spread * 2, fishType.fin);
    p.rect(x + (facing > 0 ? half - 3 : -half + 2), y - 2, 1, 1, "#1a2028");
    p.rect(x - 1, y - Math.round(h * 0.55) - 1, 3, 1, fishType.fin);
  }
  function drawWater(time) {
    // Drifting ripple strokes and the moon's broken reflection.
    const r = seeded(91);
    for (let y = HORIZON + 4; y < H; y += 5) {
      const depth = (y - HORIZON) / (H - HORIZON),
        speed = 4 + depth * 10;
      for (let i = 0; i < 6; i++) {
        const base = r() * W * 1.4,
          x = ((base + time * speed * (i % 2 ? 1 : -1)) % (W * 1.4) + W * 1.4) % (W * 1.4) - 40,
          w = 6 + depth * 14 + r() * 8;
        if (x + w > shoreEdge(y)) p.rect(Math.max(x, shoreEdge(y) + 2), y, w, 1, depth < 0.4 ? "#2c3a70" : "#22305f");
      }
    }
    for (let y = HORIZON + 2; y < 236; y += 3) {
      const k = (y - HORIZON) / 120,
        w = Math.max(2, 16 - k * 10 + Math.sin(time * 2.2 + y * 0.7) * 4),
        shift = Math.sin(time * 1.4 + y * 0.31) * (2 + k * 4);
      p.rect(368 - w / 2 + shift, y, w, 1, y % 2 ? "#f3c46e" : "#dca052");
    }
    for (const ripple of ripples) {
      const k = ripple.age / 1.2,
        rx = 3 + k * 14;
      ctx.save();
      ctx.globalAlpha = 1 - k;
      p.rect(ripple.x - rx, ripple.y, 2, 1, "#8fa8d8");
      p.rect(ripple.x + rx - 2, ripple.y, 2, 1, "#8fa8d8");
      p.rect(ripple.x - rx * 0.6, ripple.y - 2, rx * 1.2, 1, "#8fa8d8");
      p.rect(ripple.x - rx * 0.6, ripple.y + 2, rx * 1.2, 1, "#6f88b8");
      ctx.restore();
    }
    // Two ducks paddle a slow loop on the far water.
    for (let i = 0; i < 2; i++) {
      const a = time * 0.12 + i * 0.6,
        x = 420 + Math.cos(a) * 36 - i * 14,
        y = 140 + Math.sin(a) * 8 + i * 4,
        facing = -Math.sin(a) >= 0 ? 1 : -1;
      p.rect(x - 4, y, 8, 3, "#8a7a5a");
      p.rect(x + facing * 3 - 1, y - 3, 3, 3, "#3a6a4a");
      p.rect(x + facing * 5 - (facing < 0 ? 1 : 0), y - 2, 2, 1, "#d0a050");
      p.rect(x - 5, y + 3, 10, 1, "#10173a");
    }
  }
  function drawCamp(time) {
    // His campfire on the shore, smoke curling up through the night.
    const fx = 66,
      fy = 200,
      frame = api.reduced ? 1 : Math.floor(time * 8) % 4;
    p.glow(fx, fy - 4, 34, "#ff9440", 0.12);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      p.rect(fx + Math.cos(a) * 9 - 1, fy + Math.sin(a) * 4, 3, 2, k % 2 ? "#8a8078" : "#a09888");
    }
    p.rect(fx - 6, fy - 3 - (frame % 2), 12, 4, "#d8501c");
    p.rect(fx - 4, fy - 8 + (frame % 3), 8, 6, "#f08a28");
    p.rect(fx - 2 + (frame % 2), fy - 11 + frame, 4, 8, "#ffb347");
    p.rect(fx - 1, fy - 5, 2, 3, "#ffe9a0");
    for (let i = 0; i < 5; i++) {
      const phase = api.reduced ? i / 5 : (time * 0.2 + i / 5) % 1;
      p.rect(fx - 2 + Math.sin(phase * 7 + i) * (3 + phase * 8), fy - 14 - phase * 44, 2 + phase * 4, 2 + phase * 2, phase < 0.4 ? "#a4a6b8" : "#6c7088");
    }
    // Fireflies along the shore.
    for (let i = 0; i < 10; i++) {
      const x = 14 + ((i * 37) % 96) + Math.sin(time * 0.6 + i) * 5,
        y = 130 + ((i * 29) % 110) + Math.cos(time * 0.5 + i) * 4;
      if (api.reduced || Math.sin(time * 1.5 + i * 2.1) > -0.2) p.rect(x, y, 1, 1, "#f6e08a");
    }
  }
  function drawBucket() {
    const x = BUCKET.x,
      y = BUCKET.y;
    for (let i = 0; i < Math.min(catches.length, 5); i++) {
      const fishType = catches[catches.length - 1 - i].species;
      p.rect(x - 5 + i * 2, y - 14 - (i % 2) * 2, 2, 5, fishType.body);
      p.rect(x - 6 + i * 2, y - 16 - (i % 2) * 2, 4, 2, fishType.fin);
    }
    p.rect(x - 6, y - 11, 12, 11, "#4a2a1c");
    p.rect(x - 5, y - 10, 10, 9, "#7a4a2a");
    p.rect(x - 2, y - 10, 1, 9, "#5a3420");
    p.rect(x + 2, y - 10, 1, 9, "#5a3420");
    p.rect(x - 6, y - 8, 12, 1, "#4a4048");
    p.rect(x - 6, y - 3, 12, 1, "#4a4048");
    p.rect(x - 5, y - 11, 10, 2, "#1c2650");
  }
  function drawAngler(time) {
    const x = ANGLER.x,
      feet = ANGLER.feet,
      breathe = api.reduced ? 0 : Math.floor(time * 1.1) % 3 === 0 ? 1 : 0,
      top = feet - breathe;
    p.oval(x, feet + 1, 9, 2, "#2c181b");
    p.rect(x - 5, feet - 4, 4, 4, "#1e2a20");
    p.rect(x + 1, feet - 4, 5, 4, "#1e2a20");
    p.rect(x - 5, feet - 12, 4, 8, "#2e3e30");
    p.rect(x + 1, feet - 12, 4, 8, "#2e3e30");
    p.rect(x - 6, top - 25, 12, 13, "#4a5a7a");
    p.rect(x - 6, top - 25, 3, 13, "#a08a5a");
    p.rect(x + 3, top - 25, 3, 13, "#a08a5a");
    p.rect(x - 5, top - 20, 2, 2, "#8a7448");
    p.rect(x - 6, top - 13, 12, 1, "#3a3028");
    // Head: skin, a grey beard and an olive bucket hat.
    p.rect(x - 4, top - 34, 9, 9, "#dcbb85");
    p.rect(x - 4, top - 29, 8, 4, "#a8a8a0");
    p.rect(x - 4, top - 30, 2, 2, "#8a8a84");
    p.rect(x + 2, top - 31, 1, 2, "#32392c");
    p.rect(x + 5, top - 30, 1, 2, "#dcbb85");
    p.rect(x - 7, top - 36, 15, 2, "#4a5a2a");
    p.rect(x - 4, top - 40, 9, 4, "#6a7a44");
    p.rect(x - 3, top - 39, 3, 1, "#8a9a5a");
    // His arm reaches to the rod.
    p.line(x + 3, top - 22, HAND.x, HAND.y, "#4a5a7a", 2);
    p.rect(HAND.x - 1, HAND.y - 1, 3, 3, "#dcbb85");
  }
  function drawRod(time) {
    const a = rodAngle(),
      t = tip();
    p.line(HAND.x - Math.cos(a) * 6, HAND.y - Math.sin(a) * 6, HAND.x + Math.cos(a) * 10, HAND.y + Math.sin(a) * 10, "#3a2a20", 2);
    p.line(HAND.x + Math.cos(a) * 10, HAND.y + Math.sin(a) * 10, t.x, t.y, "#8a6a4a");
    let end = null;
    if (state === "landing") {
      const k = landing.t;
      end = k < 0.55 ? arc(landing.from, HAND, k / 0.55, 46) : null;
    } else if (bob) end = bob;
    else if (state === "idle" || state === "charging") end = { x: t.x + 1, y: t.y + 10 };
    if (end) {
      const sag = state === "waiting" || state === "bite" ? 8 : state === "fight" ? -2 : 3;
      for (let i = 0; i <= 24; i++) {
        const k = i / 24;
        p.rect(t.x + (end.x - t.x) * k, t.y + (end.y - t.y) * k + Math.sin(k * Math.PI) * sag, 1, 1, "#c8c0b0");
      }
    }
    if (bob && state !== "landing") {
      const dip = state === "bite" ? 3 : state === "fight" ? 2 : 0,
        bobbing = api.reduced || state === "casting" ? 0 : Math.round(Math.sin(time * 2.6));
      const near = state === "waiting" && cast.nibbles.some((n) => Math.abs(timer - n) < 0.12);
      const y = Math.round(bob.y + bobbing + dip + (near ? 1 : 0));
      if (state !== "bite" || Math.floor(time * 10) % 2) {
        p.rect(bob.x - 1, y - 3, 3, 2, "#c4304a");
        p.rect(bob.x - 1, y - 1, 3, 1, "#f2ead8");
      }
      if (state === "fight") {
        // The fish's shadow pulls side to side under the float.
        const sway = (fight.fish - 0.5) * 18;
        ctx.save();
        ctx.globalAlpha = 0.45;
        p.oval(bob.x + sway, bob.y + 5, 7, 2, "#0b1230");
        ctx.restore();
      }
    }
    if (state === "charging") {
      // The wind-up meter by his side, with the perfect band at the top.
      const x = ANGLER.x - 22,
        y = ANGLER.feet - 46,
        h = 38;
      p.rect(x - 2, y - 2, 8, h + 4, "#22180f");
      p.rect(x, y, 4, h, "#142040");
      p.rect(x, y, 4, Math.round(h * 0.1), "#7a5a20");
      const fill = Math.round(h * power);
      p.rect(x, y + h - fill, 4, fill, power > 0.9 ? "#f6cf5a" : power > 0.5 ? "#7fc0a0" : "#4a8a6a");
    }
  }
  function drawLanding() {
    if (!landing) return;
    const k = landing.t,
      flap = Math.floor(k * 14) % 2,
      length = clamp(Math.round(landing.size / 4), 8, 18);
    let at;
    if (k < 0.55) at = arc(landing.from, HAND, k / 0.55, 46);
    else if (k < 1.1) at = arc(HAND, { x: BUCKET.x, y: BUCKET.y - 12 }, (k - 0.55) / 0.55, 22);
    if (!at) return;
    p.glow(at.x, at.y, 10, landing.species.rarity === "Common" ? "#a8c8e8" : "#f6cf5a", 0.12);
    fishSprite(landing.species, at.x, at.y, length, k < 0.55 ? -1 : -1, flap);
  }
  function drawFight(time) {
    if (state !== "fight") return;
    const { x, y, w, h } = BAR;
    // A wooden frame like the hanging boards, a deep water column inside.
    p.rect(x - 6, y - 6, w + 22, h + 12, "#22180f");
    p.rect(x - 4, y - 4, w + 18, h + 8, "#7c4a2a");
    p.rect(x - 4, y - 4, w + 18, 1, "#bf8848");
    p.rect(x, y, w, h, "#0f1a36");
    for (let yy = y + 6; yy < y + h; yy += 9) p.rect(x + 2, yy, w - 4, 1, "#142246");
    const zoneTop = y + Math.round((1 - fight.zone - fight.size) * h),
      zoneH = Math.round(fight.size * h);
    p.rect(x + 1, zoneTop, w - 2, zoneH, fight.inside ? "#3e8a5a" : "#2d5a46");
    p.rect(x + 1, zoneTop, w - 2, 1, fight.inside ? "#a8e0b0" : "#5a8a6a");
    p.rect(x + 1, zoneTop + zoneH - 1, w - 2, 1, fight.inside ? "#a8e0b0" : "#5a8a6a");
    const fy = clamp(y + Math.round((1 - fight.fish) * h), y + 4, y + h - 4);
    fishSprite(species, x + w / 2, fy, 10, Math.sin(time * 6) > 0 ? 1 : -1, Math.floor(time * 10) % 2);
    // The catch meter beside it fills red to gold to green.
    const mx = x + w + 4,
      fill = Math.round(fight.progress * h);
    p.rect(mx, y, 6, h, "#120a0c");
    p.rect(mx + 1, y + h - fill, 4, fill, fight.progress > 0.66 ? "#7fc0a0" : fight.progress > 0.33 ? "#f6cf5a" : "#e4573d");
  }
  function drawBite(time) {
    if (state !== "bite") return;
    const bob2 = api.reduced ? 0 : Math.round(Math.sin(time * 14)),
      x = ANGLER.x,
      y = ANGLER.feet - 62 + bob2;
    p.glow(x, y + 6, 12, "#f6cf5a", 0.18);
    p.rect(x - 3, y - 1, 6, 11, "#2a1a0c");
    p.rect(x - 3, y + 11, 6, 5, "#2a1a0c");
    p.rect(x - 2, y, 4, 9, "#f6cf5a");
    p.rect(x - 2, y + 12, 4, 3, "#f6cf5a");
  }

  function draw() {
    const time = api.reduced ? 0 : performance.now() / 1000;
    ctx.drawImage(backdrop, 0, 0);
    drawWater(time);
    drawCamp(time);
    drawBucket();
    drawAngler(time);
    drawRod(time);
    drawLanding();
    for (const particle of particles) p.rect(particle.x, particle.y, 1, 1, particle.color);
    drawFight(time);
    drawBite(time);
  }

  newNight();
  return { update, draw, press, release };
}

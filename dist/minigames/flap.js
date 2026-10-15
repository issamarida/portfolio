// Night Owl, the right arcade cabinet: a Flappy Bird-style flight through
// the village night. One button flaps; every gap between the mossy stone
// pillars is a point, and each gap is lit by a lantern hanging above it.
import { W, H, painter, sprite, surface, format, seeded, nightSky, horizon } from "./pixel.js";

export const meta = { id: "flap", title: "Night Owl", touch: "tap" };

export const FLIGHT = {
  gravity: 760,
  impulse: -225,
  maxFall: 340,
  speed: 88,
  maxSpeed: 128,
  gap: 80,
  minGap: 64,
  spacing: 136,
  width: 26,
  ground: 246,
  owlX: 128,
  radius: 6,
};

// Pure flight helpers, exported for tests.
export function fly(owl, dt) {
  owl.vy = Math.min(FLIGHT.maxFall, owl.vy + FLIGHT.gravity * dt);
  owl.y += owl.vy * dt;
  if (owl.y < 8) {
    owl.y = 8;
    owl.vy = Math.max(0, owl.vy);
  }
  return owl;
}
export function hitsPillar(owl, pillar, gap) {
  const r = FLIGHT.radius,
    left = pillar.x - 2,
    right = pillar.x + FLIGHT.width + 2;
  if (owl.x + r <= left || owl.x - r >= right) return false;
  return owl.y - r < pillar.gapY - gap / 2 || owl.y + r > pillar.gapY + gap / 2;
}
export const gapFor = (score) => Math.max(FLIGHT.minGap, FLIGHT.gap - score * 0.6);
export const speedFor = (score) => Math.min(FLIGHT.maxSpeed, FLIGHT.speed + score * 1.4);

const OWL = [
  "..##........##..",
  "..###......###..",
  "..############..",
  ".##############.",
  ".#ffff####ffff#.",
  ".#fyky####fyky#.",
  ".#ffff#bb#ffff#.",
  ".##ff##bb##ff##.",
  "..#cccccccccc#..",
  "..#cdccdccdcc#..",
  "..#cccccccccc#..",
  "...##########...",
  "....oo....oo....",
];
const OWL_COLORS = {
  "#": "#7a4e2c",
  f: "#e8d7ad",
  y: "#f6cf5a",
  k: "#1a1020",
  b: "#c98f2e",
  c: "#d6b36f",
  d: "#a8673a",
  o: "#c98f2e",
};

export function createGame(api) {
  const { ctx, hud, best } = api,
    p = painter(ctx),
    random = seeded(Date.now() & 0xffff),
    owlSprite = sprite(OWL, OWL_COLORS);
  const sky = paintSky(),
    ridge = paintRidge(),
    column = paintColumn();
  let state, owl, pillars, score, travelled, clock, deadClock, sparks, pulses, bestScore = best.get();

  function paintSky() {
    const { canvas, ctx: c } = surface(W, H);
    nightSky(painter(c), 200, 17, { x: 392, y: 50, r: 24 });
    return canvas;
  }
  function paintRidge() {
    const { canvas, ctx: c } = surface(W, 80);
    horizon(painter(c), 70, 9);
    return canvas;
  }
  // One tall mossy stone column, cached and cropped for every pillar.
  function paintColumn() {
    const { canvas, ctx: c } = surface(FLIGHT.width, H),
      b = painter(c),
      r = seeded(41);
    b.rect(0, 0, FLIGHT.width, H, "#5d6a66");
    b.rect(0, 0, 3, H, "#3e4a48");
    b.rect(FLIGHT.width - 4, 0, 4, H, "#46524f");
    b.rect(4, 0, 2, H, "#7d8a84");
    for (let y = 0; y < H; y += 12) {
      b.rect(0, y, FLIGHT.width, 1, "#3e4a48");
      const off = (y / 12) % 2 ? 9 : 17;
      b.rect(off, y, 1, 12, "#3e4a48");
      if (r() < 0.5) b.rect(3 + r() * 18, y + 3 + r() * 6, 3, 2, "#3d704f");
      if (r() < 0.3) b.rect(3 + r() * 18, y + 5, 2, 1, "#749151");
    }
    return canvas;
  }

  function reset() {
    owl = { x: FLIGHT.owlX, y: 120, vy: 0, flap: 0 };
    pillars = [];
    score = 0;
    travelled = 0;
    clock = 0;
    sparks = [];
    pulses = [];
    state = "ready";
    let x = W + 40;
    for (let i = 0; i < 4; i++, x += FLIGHT.spacing) pillars.push(newPillar(x, pillars.at(-1)));
    hud.banner(null);
    hud.hint("SPACE to flap", "TAP to flap");
  }
  function newPillar(x, previous) {
    const gap = gapFor(score),
      low = 40 + gap / 2,
      high = FLIGHT.ground - 24 - gap / 2;
    let gapY = low + random() * (high - low);
    if (previous) gapY = Math.min(previous.gapY + 70, Math.max(previous.gapY - 70, gapY));
    return { x, gapY, gap, scored: false };
  }

  function flap() {
    owl.vy = FLIGHT.impulse;
    owl.flap = 0.25;
  }
  function press(action) {
    if (action !== "action" && action !== "up") return;
    if (state === "ready") {
      state = "play";
      hud.banner(null);
      flap();
    } else if (state === "play") flap();
    else if (state === "over" && deadClock > 0.45) reset();
  }

  // Through a gap: the score pops, its lantern flares, and a few gold
  // sparks and one quick ring burst from the owl. Every tenth gap and a
  // new best on the way get a word of their own.
  function reward(pillar) {
    hud.pop();
    pillar.flare = 0.5;
    if (!api.reduced) {
      pulses.push({ x: owl.x, y: owl.y, age: 0 });
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + random() * 0.6,
          v = 40 + random() * 40;
        sparks.push({ x: owl.x, y: owl.y, vx: Math.cos(a) * v - 30, vy: Math.sin(a) * v, life: 0.35 + random() * 0.2 });
      }
    }
    if (bestScore > 0 && score === bestScore + 1) hud.float("New best!", owl.x, owl.y - 22, "is-good");
    else if (score % 10 === 0) hud.float(`${score}!`, owl.x, owl.y - 22, "is-big");
  }
  function crash() {
    state = "dead";
    deadClock = 0;
    owl.vy = Math.min(owl.vy, -80);
    api.hud.announce(`Crashed with ${score} points`);
  }
  function update(dt) {
    clock += dt;
    owl.flap = Math.max(0, owl.flap - dt);
    if (state === "ready") {
      owl.y = 120 + Math.sin(clock * 3) * 4;
      travelled += 30 * dt;
    } else if (state === "play") {
      const speed = speedFor(score);
      travelled += speed * dt;
      fly(owl, dt);
      for (const pillar of pillars) {
        pillar.x -= speed * dt;
        if (!pillar.scored && pillar.x + FLIGHT.width < owl.x) {
          pillar.scored = true;
          score++;
          reward(pillar);
        }
        if (hitsPillar(owl, pillar, pillar.gap)) return crash();
      }
      if (pillars[0].x < -FLIGHT.width - 8) {
        pillars.shift();
        pillars.push(newPillar(pillars.at(-1).x + FLIGHT.spacing, pillars.at(-1)));
      }
      if (owl.y + FLIGHT.radius >= FLIGHT.ground) crash();
    } else {
      deadClock += dt;
      if (owl.y + FLIGHT.radius < FLIGHT.ground) fly(owl, dt);
      else {
        owl.y = FLIGHT.ground - FLIGHT.radius;
        if (state === "dead") {
          state = "over";
          const record = score > bestScore;
          best.save(score);
          bestScore = Math.max(bestScore, score);
          hud.banner(record && score > 0 ? "New best!" : "Game over");
          hud.hint("SPACE to play again", "TAP to play again");
        }
      }
    }
    for (const pillar of pillars) pillar.flare = Math.max(0, (pillar.flare || 0) - dt);
    for (const spark of sparks) {
      spark.life -= dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vy += 120 * dt;
    }
    sparks = sparks.filter((spark) => spark.life > 0);
    for (const pulse of pulses) {
      pulse.age += dt;
      pulse.x -= speedFor(score) * dt;
    }
    pulses = pulses.filter((pulse) => pulse.age < 0.3);
    hud.score(format(score));
  }

  function draw() {
    const time = api.reduced ? 0 : performance.now() / 1000;
    ctx.drawImage(sky, 0, 0);
    // Parallax: mountains and the treeline drift slower than the pillars.
    const ridgeX = -Math.floor((travelled * 0.2) % W);
    ctx.drawImage(ridge, ridgeX, 150);
    ctx.drawImage(ridge, ridgeX + W, 150);
    p.rect(0, 226, W, 20, "#16261f");
    const r = seeded(5);
    for (let i = 0; i < 40; i++) {
      const x = ((r() * W * 2 - travelled * 0.5) % (W * 2) + W * 2) % (W * 2) - 20,
        h = 10 + r() * 16;
      for (let y = 0; y < h; y++) p.rect(x - (h - y) / 3, 236 - y, ((h - y) / 3) * 2, 1, "#1b2e26");
    }
    // Fireflies over the meadow.
    for (let i = 0; i < 12; i++) {
      const x = (((i * 53 - travelled * 0.6) % W) + W) % W,
        y = 150 + ((i * 37) % 70) + Math.sin(time * 1.3 + i) * 6;
      if (Math.sin(time * 2 + i * 1.7) > -0.2) p.rect(x, y, 1, 1, "#f6e08a");
    }
    for (const pillar of pillars) drawPillar(pillar, time);
    // Ground.
    p.rect(0, FLIGHT.ground, W, H - FLIGHT.ground, "#3a2a1c");
    p.rect(0, FLIGHT.ground, W, 4, "#3d704f");
    p.rect(0, FLIGHT.ground + 4, W, 2, "#235244");
    const shift = Math.floor(travelled % 16);
    for (let x = -shift; x < W; x += 16) {
      p.rect(x + 3, FLIGHT.ground + 10, 4, 2, "#4a3424");
      p.rect(x + 11, FLIGHT.ground + 17, 3, 2, "#55597a");
      p.rect(x + 7, FLIGHT.ground - 2, 2, 2, "#749151");
    }
    // The reward ring: a stepped pixel circle that widens and thins out.
    for (const pulse of pulses) {
      const k = pulse.age / 0.3,
        r = 6 + k * 12;
      ctx.save();
      ctx.globalAlpha = 0.8 * (1 - k);
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        p.rect(pulse.x + Math.cos(a) * r, pulse.y + Math.sin(a) * r * 0.9, 1, 1, "#ffe9a0");
      }
      ctx.restore();
    }
    drawOwl(time);
    for (const spark of sparks) p.rect(spark.x, spark.y, spark.life > 0.25 ? 2 : 1, spark.life > 0.25 ? 2 : 1, spark.life > 0.2 ? "#fff0b0" : "#f6cf5a");
  }
  function drawPillar(pillar, time) {
    const x = Math.round(pillar.x),
      top = Math.round(pillar.gapY - pillar.gap / 2),
      bottom = Math.round(pillar.gapY + pillar.gap / 2);
    if (x > W || x < -FLIGHT.width - 6) return;
    ctx.drawImage(column, 0, H - top, FLIGHT.width, top, x, 0, FLIGHT.width, top);
    ctx.drawImage(column, 0, 0, FLIGHT.width, FLIGHT.ground - bottom, x, bottom, FLIGHT.width, FLIGHT.ground - bottom);
    // Capitals at the gap, moss spilling over the lower one.
    for (const [y, h] of [
      [top - 8, 8],
      [bottom, 8],
    ]) {
      p.rect(x - 3, y, FLIGHT.width + 6, h, "#7d8a84");
      p.rect(x - 3, y + h - 2, FLIGHT.width + 6, 2, "#46524f");
      p.rect(x - 3, y, FLIGHT.width + 6, 1, "#a4b0a8");
    }
    p.rect(x - 2, bottom - 1, 10, 3, "#3d704f");
    p.rect(x + 14, bottom - 1, 8, 2, "#749151");
    // A lantern hangs under the top capital and lights the way through.
    const lx = x + FLIGHT.width / 2,
      sway = api.reduced ? 0 : Math.round(Math.sin(time * 2 + pillar.x * 0.05));
    p.rect(lx, top, 1, 6, "#2a2a2a");
    p.glow(lx + sway, top + 11, 18 + (pillar.flare || 0) * 30, "#f6cf5a", 0.12 + (pillar.flare || 0) * 0.3);
    p.rect(lx - 3 + sway, top + 6, 7, 2, "#4a3a2a");
    p.rect(lx - 2 + sway, top + 8, 5, 6, "#f6cf5a");
    p.rect(lx - 1 + sway, top + 9, 2, 3, "#fff0b0");
    p.rect(lx - 3 + sway, top + 14, 7, 2, "#4a3a2a");
  }
  function drawOwl(time) {
    const x = Math.round(owl.x - 8),
      y = Math.round(owl.y - 7),
      dead = state === "dead" || state === "over";
    // Wings: raised on a flap, gliding level, tucked when falling fast.
    const pose = dead ? 2 : owl.flap > 0.12 ? 0 : owl.vy > 160 ? 2 : state === "ready" ? Math.floor(time * 6) % 2 : 1;
    const wingY = [2, 6, 8][pose],
      wingH = [6, 4, 5][pose];
    for (const side of [-1, 1]) {
      const wx = side < 0 ? x - 3 : x + 15;
      p.rect(wx, y + wingY, 4, wingH, "#6b4426");
      p.rect(wx + (side < 0 ? 0 : 2), y + wingY + 1, 2, wingH - 1, "#8a5a33");
    }
    ctx.drawImage(owlSprite, x, y);
    if (dead) {
      p.rect(x + 3, y + 5, 3, 1, "#1a1020");
      p.rect(x + 10, y + 5, 3, 1, "#1a1020");
    }
  }

  reset();
  return { update, draw, press };
}

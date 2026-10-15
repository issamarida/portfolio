// Clearing Drift: take the wheel of the dark pickup that loops the forest
// clearing on the page. A compact top-down arena with arcade physics: the
// rear lets go when you turn hard at speed (or pull the handbrake) and
// slides out naturally. Drift angle, speed and an unbroken chain earn
// points; the combo grows the longer the chain lasts and is lost on a
// crash. Physics and scoring are pure and exported for tests.
import { W, H, painter, surface, format, seeded, rotations, clamp } from "./pixel.js";

// The truck keeps its foot down by itself, so steering is all there is to
// learn. Brake (S) and handbrake (Space) still work for those who find them.
export const meta = { id: "drift", title: "Clearing Drift", touch: "drive" };

export const ROUND = 90;
export const ARENA = { x: 240, y: 146, rx: 206, ry: 104 };
export const OBSTACLES = [
  { x: 240, y: 146, r: 15, kind: "boulders" },
  { x: 296, y: 226, r: 7, kind: "stump" },
  { x: 336, y: 176, r: 8, kind: "rock" },
  { x: 318, y: 104, r: 6, kind: "rock" },
  { x: 168, y: 186, r: 6, kind: "stump" },
];
export const CAR = {
  accel: 230,
  brake: 320,
  reverse: 110,
  maxSpeed: 190,
  maxReverse: 60,
  drag: 0.5,
  steer: 3.2,
  gripHigh: 9,
  gripLow: 2.1,
  handbrakeGrip: 0.9,
  radius: 7,
};

export function makeCar(x = 112, y = 150, heading = -Math.PI / 2) {
  return { x, y, heading, vx: 0, vy: 0 };
}
export const speedOf = (car) => Math.hypot(car.vx, car.vy);
// Angle between where the nose points and where the truck is going.
export function slipAngle(car) {
  const fx = Math.cos(car.heading),
    fy = Math.sin(car.heading),
    vf = car.vx * fx + car.vy * fy,
    vr = -car.vx * fy + car.vy * fx;
  return (Math.atan2(Math.abs(vr), Math.abs(vf)) * 180) / Math.PI;
}

// One physics step. Velocity is split along the nose and across it: gas
// and brakes act along it, tyre grip bleeds off the sideways part. Turning
// hard at speed loosens grip, so the heading outruns the velocity and the
// rear slides out.
export function carStep(car, input, dt) {
  const fx = Math.cos(car.heading),
    fy = Math.sin(car.heading);
  let vf = car.vx * fx + car.vy * fy,
    vr = -car.vx * fy + car.vy * fx;
  const speed = Math.hypot(vf, vr),
    steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (input.gas) vf += CAR.accel * dt * (1 - clamp(vf / CAR.maxSpeed, 0, 1));
  if (input.brake) vf = vf > 8 ? vf - CAR.brake * dt : Math.max(-CAR.maxReverse, vf - CAR.reverse * dt);
  vf *= 1 - CAR.drag * dt * (input.gas ? 0.25 : 1);
  const load = clamp((speed - 70) / 80, 0, 1) * Math.abs(steer);
  let grip = CAR.gripHigh + (CAR.gripLow - CAR.gripHigh) * load;
  if (input.handbrake) {
    grip = CAR.handbrakeGrip;
    vf *= 1 - 0.8 * dt;
  }
  const kept = vr * Math.exp(-grip * dt);
  // Some of the scrubbed slide carries the truck forward out of a drift.
  vf += Math.sign(vf || 1) * Math.abs(vr - kept) * 0.22;
  vr = kept;
  car.vx = vf * fx - vr * fy;
  car.vy = vf * fy + vr * fx;
  const turn = clamp(Math.abs(vf) / 70, 0, 1) * Math.sign(vf || 1),
    slide = clamp(Math.abs(vr) / 90, 0, 1);
  car.heading += steer * CAR.steer * turn * (1 + slide * 0.5) * dt;
  car.x += car.vx * dt;
  car.y += car.vy * dt;
  return car;
}

// Keeps the truck inside the stone ring and off the obstacles. Returns the
// strongest impact speed this step (0 when nothing was touched).
export function collide(car) {
  let impact = 0;
  const bounce = (nx, ny) => {
    const vn = car.vx * nx + car.vy * ny;
    if (vn <= 0) return;
    impact = Math.max(impact, vn);
    car.vx -= 1.4 * vn * nx;
    car.vy -= 1.4 * vn * ny;
    car.vx *= 0.8;
    car.vy *= 0.8;
  };
  const rx = ARENA.rx - CAR.radius,
    ry = ARENA.ry - CAR.radius,
    dx = car.x - ARENA.x,
    dy = car.y - ARENA.y,
    reach = (dx / rx) ** 2 + (dy / ry) ** 2;
  if (reach > 1) {
    const k = 1 / Math.sqrt(reach);
    car.x = ARENA.x + dx * k;
    car.y = ARENA.y + dy * k;
    const nx = dx / (rx * rx),
      ny = dy / (ry * ry),
      length = Math.hypot(nx, ny);
    bounce(nx / length, ny / length);
  }
  for (const o of OBSTACLES) {
    const ox = car.x - o.x,
      oy = car.y - o.y,
      distance = Math.hypot(ox, oy),
      reachO = o.r + CAR.radius;
    if (distance >= reachO || distance === 0) continue;
    const nx = ox / distance,
      ny = oy / distance;
    car.x = o.x + nx * reachO;
    car.y = o.y + ny * reachO;
    bounce(-nx, -ny);
  }
  return impact;
}

// Drift scoring: points flow while the truck slides fast and wide, held in
// a pending chain that banks (times the combo) once the drift settles.
export function makeScore() {
  return { total: 0, pending: 0, chain: 0, combo: 1, grace: 0, drifting: false };
}
export const DRIFT = { minSpeed: 55, minAngle: 12, maxAngle: 110, grace: 0.6, comboStep: 1.25, maxCombo: 9 };
export function scoreStep(score, car, dt) {
  const speed = speedOf(car),
    angle = slipAngle(car);
  score.drifting = speed > DRIFT.minSpeed && angle > DRIFT.minAngle && angle < DRIFT.maxAngle;
  if (score.drifting) {
    score.chain += dt;
    score.grace = DRIFT.grace;
    score.pending += angle * (speed / 100) * 9 * dt;
    score.combo = Math.min(DRIFT.maxCombo, 1 + Math.floor(score.chain / DRIFT.comboStep));
    return null;
  }
  if (score.pending <= 0) return null;
  score.grace -= dt;
  return score.grace <= 0 ? bank(score) : null;
}
export function bank(score) {
  const points = Math.round(score.pending * score.combo),
    combo = score.combo;
  score.total += points;
  score.pending = 0;
  score.chain = 0;
  score.combo = 1;
  return { points, combo };
}
// A crash throws away the drift in progress and dents the bank a little,
// so every crash costs something once there is anything to lose.
export const CRASH_TOLL = 50;
export function crash(score) {
  const toll = Math.min(CRASH_TOLL, score.total),
    lost = Math.round(score.pending * score.combo) + toll;
  score.total -= toll;
  score.pending = 0;
  score.chain = 0;
  score.combo = 1;
  score.grace = 0;
  return lost;
}

const TRUCK = {
  body: "#2b3a52",
  dark: "#141c2a",
  roof: "#3e5070",
  bed: "#1c2638",
  glass: "#8fb0d0",
  glassDark: "#5a7aa0",
  head: "#fff3c0",
  tail: "#e4573d",
  tyre: "#0c0f14",
};
function truckSprite() {
  const { canvas, ctx } = surface(24, 14),
    p = painter(ctx);
  for (const x of [4, 16]) {
    p.rect(x, 0, 4, 2, TRUCK.tyre);
    p.rect(x, 12, 4, 2, TRUCK.tyre);
  }
  p.rect(0, 1, 24, 12, TRUCK.dark);
  p.rect(1, 2, 22, 10, TRUCK.body);
  p.rect(2, 3, 7, 8, TRUCK.bed);
  p.rect(2, 3, 7, 1, TRUCK.roof);
  p.rect(2, 10, 7, 1, TRUCK.roof);
  p.rect(9, 2, 1, 10, TRUCK.dark);
  p.rect(10, 3, 1, 8, TRUCK.glassDark);
  p.rect(11, 2, 5, 10, TRUCK.roof);
  p.rect(12, 3, 3, 8, "#4a6088");
  p.rect(16, 3, 2, 8, TRUCK.glass);
  p.rect(16, 3, 1, 3, "#c8dcf0");
  p.rect(19, 4, 3, 1, "#3e5070");
  p.rect(19, 9, 3, 1, "#3e5070");
  p.rect(22, 2, 2, 2, TRUCK.head);
  p.rect(22, 10, 2, 2, TRUCK.head);
  p.rect(0, 2, 1, 2, TRUCK.tail);
  p.rect(0, 10, 1, 2, TRUCK.tail);
  return canvas;
}

export function createGame(api) {
  const { ctx, hud, best } = api,
    p = painter(ctx),
    frames = rotations(truckSprite(), 64),
    arena = paintArena(),
    skids = surface(W, H);
  let state, car, score, time, dust, shake, bestScore = best.get(), crashFlash, idle, sinceCrash, shownCombo;

  function paintArena() {
    const { canvas, ctx: c } = surface(W, H),
      b = painter(c),
      r = seeded(2207);
    b.rect(0, 0, W, H, "#1b2e26");
    for (let i = 0; i < 900; i++) b.rect(r() * W, r() * H, 2, 1, r() < 0.5 ? "#20372f" : "#16261f");
    // The dirt oval with its old tyre rings, as on the page.
    b.oval(ARENA.x, ARENA.y, ARENA.rx + 6, ARENA.ry + 6, "#3e2c1e");
    b.oval(ARENA.x, ARENA.y, ARENA.rx, ARENA.ry, "#4a3424");
    for (let i = 0; i < 1600; i++) {
      const a = r() * Math.PI * 2,
        d = Math.sqrt(r()),
        x = ARENA.x + Math.cos(a) * ARENA.rx * d,
        y = ARENA.y + Math.sin(a) * ARENA.ry * d;
      b.rect(x, y, r() < 0.2 ? 2 : 1, 1, ["#5a4030", "#3e2c1e", "#6a4a30", "#55597a"][Math.floor(r() * 4)]);
    }
    c.save();
    c.globalAlpha = 0.35;
    for (const [rx, ry] of [
      [150, 58],
      [160, 64],
      [128, 48],
    ])
      for (let a = 0; a < Math.PI * 2; a += 0.02) b.rect(ARENA.x + Math.cos(a) * rx, ARENA.y + 4 + Math.sin(a) * ry, 2, 1, "#2a1c12");
    c.restore();
    // The neat stone edge.
    for (let a = 0; a < Math.PI * 2; a += 0.055) {
      const x = ARENA.x + Math.cos(a) * (ARENA.rx + 7),
        y = ARENA.y + Math.sin(a) * (ARENA.ry + 7);
      b.rect(x - 2, y - 1, 4, 3, r() < 0.5 ? "#55597a" : "#4a4e6c");
      b.rect(x - 1, y - 1, 2, 1, "#80859f");
    }
    // Woods all round: pines and round crowns, deepest at the corners.
    const trees = [];
    for (let i = 0; i < 560; i++) {
      const x = r() * (W + 40) - 20,
        y = r() * (H + 30) - 10,
        reach = ((x - ARENA.x) / (ARENA.rx + 30)) ** 2 + ((y - ARENA.y) / (ARENA.ry + 34)) ** 2;
      if (reach < 1) continue;
      trees.push({ x, y, s: 0.85 + r() * 0.6, pine: r() < 0.75 });
    }
    for (const t of trees.sort((a, b2) => a.y - b2.y)) {
      b.oval(t.x, t.y + 2, 9 * t.s, 3 * t.s, "#101a14");
      if (t.pine)
        for (let k = 0; k < 3; k++) {
          const w = (12 - k * 3) * t.s,
            y = t.y - k * 6 * t.s;
          for (let row = 0; row < 8 * t.s; row++) b.rect(t.x - (w * (row + 1)) / (8 * t.s), y - row, ((w * (row + 1)) / (8 * t.s)) * 2, 1, row % 3 ? ["#16261f", "#1b2e26", "#20372f"][k] : "#2a4636");
        }
      else {
        b.oval(t.x, t.y - 6 * t.s, 10 * t.s, 8 * t.s, "#20372f");
        b.oval(t.x - 2, t.y - 8 * t.s, 6 * t.s, 4 * t.s, "#2f4a32");
      }
    }
    // Obstacles: a mossy boulder pile, stumps and rocks.
    for (const o of OBSTACLES) {
      b.oval(o.x + 2, o.y + 3, o.r + 2, o.r * 0.6, "#2a1c12");
      if (o.kind === "stump") {
        b.oval(o.x, o.y, o.r, o.r * 0.8, "#5c2d1f");
        b.oval(o.x, o.y - 1, o.r - 2, o.r * 0.6, "#a0613b");
        b.oval(o.x, o.y - 1, o.r - 4, o.r * 0.35, "#7a4a2a");
      } else if (o.kind === "rock") {
        b.oval(o.x, o.y, o.r, o.r * 0.8, "#4a4e6c");
        b.oval(o.x - 1, o.y - 2, o.r - 2, o.r * 0.5, "#6a6e86");
        b.rect(o.x - 2, o.y - 4, 3, 1, "#80859f");
      } else {
        for (const [dx, dy, s] of [
          [-6, 3, 9],
          [6, 2, 8],
          [0, -4, 10],
        ]) {
          b.oval(o.x + dx, o.y + dy, s, s * 0.8, "#4a4e6c");
          b.oval(o.x + dx - 1, o.y + dy - 2, s - 3, s * 0.5, "#6a6e86");
        }
        b.rect(o.x - 6, o.y - 10, 8, 2, "#3d704f");
        b.rect(o.x + 2, o.y - 6, 6, 2, "#749151");
      }
    }
    // Lanterns stand on the stone edge, with warm pools of light.
    for (const [x, y] of [
      [ARENA.x - ARENA.rx - 14, ARENA.y - 34],
      [ARENA.x - ARENA.rx - 14, ARENA.y + 40],
      [ARENA.x + ARENA.rx + 12, ARENA.y - 34],
      [ARENA.x + ARENA.rx + 12, ARENA.y + 40],
    ]) {
      b.glow(x, y + 6, 34, "#ffb860", 0.07);
      b.rect(x - 1, y - 8, 2, 14, "#3c201e");
      b.rect(x - 3, y - 13, 6, 2, "#4a3a2a");
      b.rect(x - 2, y - 11, 4, 4, "#f6cf5a");
      b.rect(x - 1, y - 10, 1, 2, "#fff0b0");
    }
    // Night closes in at the corners in stepped bands.
    c.save();
    for (let i = 0; i < 5; i++) {
      c.globalAlpha = 0.09;
      const inset = i * 10;
      b.rect(0, 0, W, 4 + inset / 2, "#050809");
      b.rect(0, H - 4 - inset / 2, W, 4 + inset / 2, "#050809");
      b.rect(0, 0, 6 + inset, H, "#050809");
      b.rect(W - 6 - inset, 0, 6 + inset, H, "#050809");
    }
    c.restore();
    return canvas;
  }

  function reset() {
    car = makeCar();
    score = makeScore();
    time = ROUND;
    dust = [];
    shake = 0;
    crashFlash = 0;
    shownCombo = 1;
    idle = 0;
    sinceCrash = 1;
    skids.ctx.clearRect(0, 0, W, H);
    state = "ready";
    hud.banner(null);
    hud.hint("A / D to steer", "◀ ▶ to steer");
  }
  const input = () => ({
    gas: !api.held("down"),
    brake: api.held("down"),
    left: api.held("left"),
    right: api.held("right"),
    handbrake: api.held("action"),
  });
  function press(action) {
    if (state === "ready") state = "play";
    else if (state === "over" && idle > 0.6 && action === "action") reset();
  }
  function finish() {
    if (score.pending > 0) bank(score);
    state = "over";
    idle = 0;
    const record = score.total > bestScore && score.total > 0;
    best.save(score.total);
    bestScore = Math.max(bestScore, score.total);
    hud.banner(record ? "New best!" : "Game over");
    hud.hint("SPACE to play again", "TAP to play again");
  }

  function update(dt) {
    idle += dt;
    shake = Math.max(0, shake - dt);
    crashFlash = Math.max(0, crashFlash - dt);
    if (state === "play") {
      time = Math.max(0, time - dt);
      sinceCrash += dt;
      // Fixed small physics steps keep the slide stable at any frame rate.
      const steps = Math.ceil(dt / (1 / 120)),
        h = dt / steps,
        controls = input();
      for (let i = 0; i < steps; i++) {
        carStep(car, controls, h);
        const impact = collide(car);
        // Grinding along a wall after a hit is one crash, not many.
        if (impact > 32 && sinceCrash > 0.7) {
          sinceCrash = 0;
          const lost = crash(score);
          shake = 0.25;
          crashFlash = 0.45;
          shownCombo = 1;
          hud.float(lost ? `−${format(lost)}` : "Crash!", car.x, car.y - 18, "is-bad");
          if (lost) hud.pop(true);
          hud.announce(lost ? `Crashed and lost ${format(lost)} points.` : "Crashed.");
        }
        const banked = scoreStep(score, car, h);
        // Drifting well shows as it happens: the multiplier as it climbs,
        // then the points as the slide banks.
        if (score.combo > shownCombo) {
          shownCombo = score.combo;
          hud.float(`×${score.combo}`, car.x, car.y - 22, "is-good");
        }
        if (banked && banked.points > 0) {
          shownCombo = 1;
          hud.float(`+${format(banked.points)}`, car.x, car.y - 18, banked.points >= 1000 ? "is-big" : "");
          hud.pop();
        }
      }
      leaveMarks(dt);
      if (time === 0) finish();
    } else if (state === "over") {
      // The truck rolls to a stop.
      carStep(car, {}, dt);
      collide(car);
    }
    for (const d of dust) {
      d.life -= dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vx *= 1 - dt * 2;
      d.vy *= 1 - dt * 2;
    }
    dust = dust.filter((d) => d.life > 0);
    hud.score(format(score.total));
  }
  // Rear tyres leave marks and kick up dust while they slide.
  function leaveMarks(dt) {
    const fx = Math.cos(car.heading),
      fy = Math.sin(car.heading),
      lateral = Math.abs(-car.vx * fy + car.vy * fx);
    if (lateral < 22 || speedOf(car) < 40) return;
    const marks = skids.ctx;
    marks.fillStyle = "#1e140c";
    marks.globalAlpha = clamp(lateral / 160, 0.15, 0.45);
    for (const side of [-5, 5]) {
      const x = car.x - fx * 8 - fy * side,
        y = car.y - fy * 8 + fx * side;
      marks.fillRect(Math.round(x), Math.round(y), 2, 1);
      if (!api.reduced && Math.random() < dt * 30)
        dust.push({ x, y, vx: -car.vx * 0.15 + (Math.random() - 0.5) * 20, vy: -car.vy * 0.15 + (Math.random() - 0.5) * 20, life: 0.6 + Math.random() * 0.4 });
    }
    marks.globalAlpha = 1;
  }

  function draw() {
    const time2 = api.reduced ? 0 : performance.now() / 1000;
    ctx.save();
    if (shake > 0 && !api.reduced) ctx.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 4));
    ctx.drawImage(arena, 0, 0);
    ctx.drawImage(skids.canvas, 0, 0);
    for (const d of dust) {
      ctx.globalAlpha = clamp(d.life, 0, 0.6);
      p.rect(d.x, d.y, 2, 2, "#8a6a4a");
    }
    ctx.globalAlpha = 1;
    // Headlights sweep the dirt ahead.
    const fx = Math.cos(car.heading),
      fy = Math.sin(car.heading);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let d = 14; d < 58; d += 3) {
      const spread = (d - 10) * 0.28,
        alpha = 0.07 * (1 - d / 62);
      ctx.globalAlpha = alpha;
      for (const side of [-4, 4]) {
        const cx = car.x + fx * d - fy * side * (1 + d / 40),
          cy = car.y + fy * d + fx * side * (1 + d / 40);
        p.rect(cx - spread / 2, cy - spread / 2, spread, spread, "#fff3c0");
      }
    }
    ctx.restore();
    // Shadow, then the truck from its pre-rotated frames.
    const index = ((Math.round((car.heading / (Math.PI * 2)) * 64) % 64) + 64) % 64,
      frame = frames[index];
    ctx.globalAlpha = 0.45;
    p.oval(car.x + 2, car.y + 3, 12, 8, "#0a0806");
    ctx.globalAlpha = 1;
    ctx.drawImage(frame, Math.round(car.x - frame.width / 2), Math.round(car.y - frame.height / 2));
    if (api.held("down") && state === "play") {
      for (const side of [-4, 4]) p.glow(car.x - fx * 12 - fy * side, car.y - fy * 12 + fx * side, 5, "#e4573d", 0.25);
    }
    // While drifting, a spark of the combo hangs over the truck.
    if (score.drifting && state === "play") {
      const pulse = Math.floor(time2 * 8) % 2;
      p.rect(car.x - 1, car.y - 18 - pulse, 2, 2, score.combo > 3 ? "#f6cf5a" : "#fff3d6");
    }
    // A crash glares red at the edges of the screen for a moment, in
    // stepped bands, and leaves the middle of the play clear.
    if (crashFlash > 0) {
      const k = crashFlash / 0.45;
      for (let i = 0; i < 4; i++) {
        ctx.globalAlpha = 0.34 * k * (1 - i / 4);
        const inset = i * 6;
        p.rect(inset, inset, W - inset * 2, 6, "#e4573d");
        p.rect(inset, H - inset - 6, W - inset * 2, 6, "#e4573d");
        p.rect(inset, inset + 6, 6, H - inset * 2 - 12, "#e4573d");
        p.rect(W - inset - 6, inset + 6, 6, H - inset * 2 - 12, "#e4573d");
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  reset();
  return { update, draw, press };
}

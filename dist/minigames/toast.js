// Golden Marshmallow, the camper's game by the reading sign: one
// marshmallow at a time turns over his fire, going from raw to golden to
// burnt. Pull it away at the right moment: golden scores best, a little
// early or late scores less, and burnt costs points. The fire gets hotter
// as the score rises. Cooked marshmallows land on his plate, so the plate
// shows how the night is going; three burnt ones end it. Timing is pure
// and exported for tests.
import { W, H, painter, surface, format, seeded, nightSky, clamp } from "./pixel.js";

export const meta = { id: "toast", title: "Golden Marshmallow", touch: "tap" };

// How done a marshmallow is runs from 0 (raw) to 1 (on fire).
export const GRADES = [
  { below: 0.35, grade: "raw", label: "Raw", points: 1 },
  { below: 0.55, grade: "early", label: "Too early", points: 3 },
  { below: 0.72, grade: "perfect", label: "Perfect", points: 10 },
  { below: 0.88, grade: "late", label: "Too late", points: 4 },
  { below: Infinity, grade: "burnt", label: "Burnt", points: -5 },
];
export function judge(done) {
  return GRADES.find((g) => done < g.below);
}
// Seconds from raw to aflame: slower at first, hotter as the score rises.
export const cookTime = (score) => clamp(3.4 - score / 55, 1.5, 3.4);
export const STRIKES = 3;

// Raw white through gold and brown to charcoal.
const STOPS = [
  [0, [244, 239, 228]],
  [0.3, [242, 226, 184]],
  [0.55, [232, 184, 104]],
  [0.68, [216, 154, 72]],
  [0.8, [168, 100, 46]],
  [0.9, [90, 52, 32]],
  [1, [42, 26, 18]],
];
export function toastColor(done) {
  const d = clamp(done, 0, 1);
  let i = 1;
  while (i < STOPS.length - 1 && STOPS[i][0] < d) i++;
  const [a, from] = STOPS[i - 1],
    [b, to] = STOPS[i],
    k = (d - a) / (b - a || 1);
  return `#${from.map((v, j) => Math.round(v + (to[j] - v) * k).toString(16).padStart(2, "0")).join("")}`;
}

const FIRE = { x: 262, y: 224 },
  TIP = { x: 262, y: 150 },
  HAND = { x: 132, y: 168 },
  PLATE = { x: 392, y: 214 };

export function createGame(api) {
  const { ctx, hud, best } = api,
    p = painter(ctx),
    random = seeded(Date.now() & 0xffff);
  const backdrop = paintBackdrop();
  let state, phase, clock, score, done, timer, plate, strikes, sparks, glare, streak, idle, flight, bestScore = best.get();

  function paintBackdrop() {
    const { canvas, ctx: c } = surface(W, H),
      b = painter(c),
      r = seeded(17);
    b.rect(0, 0, W, H, "#22301f");
    nightSky(b, 178, 41, { x: 404, y: 40, r: 16 });
    // Dark spruces close around the fire.
    for (let i = 0; i < 26; i++) {
      const x = (i / 25) * W + (r() - 0.5) * 20,
        h = 60 + r() * 50,
        base = 168 + r() * 10;
      for (let y = 0; y < h; y++) {
        const w = ((y / h) * 18 + 2) * (1 + (y % 8 < 3 ? 0.2 : 0));
        b.rect(x - w, base - h + y, w * 2, 1, y % 9 < 2 ? "#16261f" : "#1b2e26");
      }
    }
    b.rect(0, 176, W, H - 176, "#22301f");
    for (let i = 0; i < 160; i++) b.rect(r() * W, 178 + r() * 92, 2, 1, r() < 0.5 ? "#2c3a24" : "#1c2618");
    // Trodden dirt round the fire and the warm light on it.
    b.oval(FIRE.x, FIRE.y + 14, 150, 40, "#3e2c1e");
    b.oval(FIRE.x, FIRE.y + 14, 120, 30, "#4a3424");
    b.glow(FIRE.x, FIRE.y - 10, 140, "#ff9440", 0.07);
    // The stone ring and the logs.
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      b.oval(FIRE.x + Math.cos(a) * 34, FIRE.y + 10 + Math.sin(a) * 12, 7, 5, k % 2 ? "#8a8078" : "#a09888");
    }
    b.rect(FIRE.x - 26, FIRE.y + 2, 52, 8, "#3a2418");
    b.rect(FIRE.x - 18, FIRE.y - 2, 36, 6, "#4b2c1c");
    // The camper's seat log and the log the plate sits on.
    for (const [x, y, w] of [[118, 214, 92], [PLATE.x, PLATE.y + 12, 96]]) {
      b.rect(x - w / 2, y - 8, w, 16, "#4b3c2c");
      b.rect(x - w / 2 + 2, y - 7, w - 6, 4, "#796043");
      b.oval(x + w / 2, y, 6, 8, "#aa8b59");
      b.oval(x + w / 2, y, 3, 5, "#6c5038");
    }
    // His plate.
    b.oval(PLATE.x, PLATE.y, 34, 7, "#7a7f8a");
    b.oval(PLATE.x, PLATE.y - 1, 30, 5, "#a8adb8");
    // The marshmallow bag by his boot.
    b.rect(160, 226, 16, 14, "#e8e4dc");
    b.rect(160, 226, 16, 3, "#c4304a");
    b.rect(164, 231, 8, 4, "#f4efe4");
    return canvas;
  }

  function reset() {
    state = "ready";
    phase = "toast";
    clock = 0;
    score = 0;
    done = 0;
    timer = 0;
    plate = [];
    strikes = 0;
    sparks = [];
    glare = 0;
    streak = 0;
    idle = 0;
    flight = null;
    hud.banner(null);
    hud.hint("SPACE to pull", "TAP to pull");
  }

  function pull() {
    const result = judge(done);
    streak = result.grade === "perfect" ? streak + 1 : 0;
    const bonus = result.grade === "perfect" && streak >= 3 ? 2 : 0,
      points = result.points + bonus;
    score = Math.max(0, score + points);
    plate.push(result.grade === "burnt" ? 1 : done);
    if (plate.length > 9) plate.shift();
    const tone = result.grade === "perfect" ? "is-big" : result.grade === "burnt" ? "is-bad" : "";
    hud.float(`${result.label} ${points >= 0 ? "+" : "−"}${Math.abs(points)}`, TIP.x, TIP.y - 22, tone);
    if (bonus) hud.float(`Streak ×${streak}`, W / 2, 34, "is-good");
    if (result.grade === "burnt") {
      strikes++;
      glare = 0.45;
      hud.pop(true);
    } else hud.pop();
    if (result.grade === "perfect" && !api.reduced)
      for (let i = 0; i < 12; i++)
        sparks.push({ x: TIP.x, y: TIP.y, vx: (random() - 0.5) * 90, vy: -30 - random() * 60, life: 0.5 + random() * 0.3, color: i % 2 ? "#f6cf5a" : "#fff0b0" });
    hud.announce(`${result.label}, ${points} points.`);
    // The marshmallow hops onto the plate, then a fresh one goes on.
    flight = { from: { ...TIP }, t: 0, done };
    phase = "serve";
    timer = 0;
    if (strikes >= STRIKES) finish();
  }
  function finish() {
    state = "over";
    idle = 0;
    const record = score > bestScore && score > 0;
    best.save(score);
    bestScore = Math.max(bestScore, score);
    hud.banner(record ? "New best!" : "Game over");
    hud.hint("SPACE to play again", "TAP to play again");
  }

  function press(action) {
    if (action !== "action") return;
    if (state === "over") {
      if (idle > 0.6) reset();
      return;
    }
    if (state === "ready") {
      state = "play";
      return;
    }
    if (phase === "toast") pull();
  }

  function update(dt) {
    clock += dt;
    idle += dt;
    glare = Math.max(0, glare - dt);
    timer += dt;
    if (state === "play") {
      if (phase === "toast") {
        done += dt / cookTime(score);
        // Left too long, it catches fire on its own.
        if (done >= 1.02) pull();
      } else if (phase === "serve") {
        if (flight) {
          flight.t += dt;
          if (flight.t >= 0.45) flight = null;
        }
        if (timer >= 0.75 && state === "play") {
          phase = "toast";
          done = 0;
          timer = 0;
        }
      }
    }
    for (const spark of sparks) {
      spark.vy += 140 * dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.life -= dt;
    }
    sparks = sparks.filter((spark) => spark.life > 0);
    hud.score(format(score));
  }

  function marshmallow(x, y, cooked, turn) {
    const base = toastColor(cooked),
      under = toastColor(Math.min(1, cooked * 1.12 + 0.03)),
      top = toastColor(cooked * 0.8);
    p.rect(x - 7, y - 8, 14, 16, base);
    p.rect(x - 6, y - 9, 12, 1, top);
    p.rect(x - 6, y + 8, 12, 1, under);
    p.rect(x - 7, y + 2, 14, 6, under);
    // The browned side turning round with the stick.
    const band = Math.round(Math.sin(turn) * 5);
    p.rect(x + band - 2, y - 7, 4, 15, toastColor(Math.min(1, cooked * 1.2)));
    p.rect(x - 6, y - 7, 2, 12, top);
  }
  function draw() {
    const time = api.reduced ? 0 : performance.now() / 1000;
    ctx.drawImage(backdrop, 0, 0);
    // Flames, taller and redder as the fire gets hotter.
    const heat = 1 - (cookTime(score) - 1.5) / 1.9,
      f = api.reduced ? 1 : Math.floor(time * 8) % 3;
    p.glow(FIRE.x, FIRE.y - 16, 46 + heat * 20, "#ff9440", 0.14);
    for (const [dx, h, color] of [[-16, 14 + f * 3, "#d8501c"], [8, 18 - f * 2, "#d8501c"], [-6, 26 + (f % 2) * 4, "#f08a28"], [2, 16 + f * 2, "#ffb347"], [-2, 10, "#ffe9a0"]])
      p.rect(FIRE.x + dx, FIRE.y - h * (1 + heat * 0.25), 8, h * (1 + heat * 0.25), color);
    for (let i = 0; i < 6; i++) {
      const phaseK = api.reduced ? i / 6 : (time * 0.6 + i / 6) % 1;
      p.rect(FIRE.x - 6 + Math.sin(phaseK * 9 + i) * 10, FIRE.y - 30 - phaseK * 60, 2, 2, phaseK < 0.5 ? "#ffd27a" : "#c07a3a");
    }
    // The camper on his log, holding the stick out over the fire.
    const sx = 104,
      seat = 206;
    p.rect(sx - 6, seat - 2, 24, 8, "#3b4658");
    p.rect(sx + 12, seat + 4, 6, 12, "#3b4658");
    p.rect(sx + 11, seat + 14, 9, 4, "#554835");
    p.rect(sx - 11, seat - 24, 22, 22, "#9c4f37");
    p.rect(sx - 9, seat - 23, 5, 20, "#b8664a");
    for (const dx of [-3, 4]) p.rect(sx + dx, seat - 24, 2, 22, "#6f3326");
    p.rect(sx - 11, seat - 14, 22, 2, "#6f3326");
    p.rect(sx - 8, seat - 41, 16, 17, "#dcbb85");
    p.rect(sx - 8, seat - 31, 12, 7, "#68533a");
    p.rect(sx - 10, seat - 45, 20, 7, "#8c2a2f");
    p.rect(sx - 10, seat - 39, 20, 2, "#c86a5a");
    p.rect(sx - 2, seat - 48, 6, 4, "#e8dcc4");
    p.rect(sx + 2, seat - 36, 2, 3, "#32392c");
    p.line(sx + 6, seat - 19, HAND.x, HAND.y, "#b8664a", 4);
    p.rect(HAND.x - 2, HAND.y - 2, 5, 5, "#dcbb85");
    // The stick: pulled back while a marshmallow is served.
    const back = phase === "serve" ? Math.sin(Math.min(1, timer / 0.75) * Math.PI) * 26 : 0,
      tip = { x: TIP.x - back, y: TIP.y + back * 0.2 };
    p.line(HAND.x - 10, HAND.y + 4, tip.x + 8, tip.y, "#6b4a2e", 2);
    p.line(HAND.x - 10, HAND.y + 3, tip.x + 8, tip.y - 1, "#8a6a44");
    if (phase === "toast" && state !== "over") {
      const turn = api.reduced ? 0 : time * 2.4;
      marshmallow(tip.x, tip.y, done, turn);
      if (done > 0.78 && !api.reduced)
        for (let i = 0; i < 3; i++) {
          const k = (time * 0.8 + i / 3) % 1;
          p.rect(tip.x - 2 + Math.sin(k * 8 + i) * 4, tip.y - 12 - k * 30, 3, 3, "#6c7088");
        }
      if (done > 0.9) {
        const flick = api.reduced ? 1 : Math.floor(time * 10) % 3;
        p.rect(tip.x - 5, tip.y - 14 - flick, 4, 6 + flick, "#f08a28");
        p.rect(tip.x + 1, tip.y - 16 + flick, 4, 8, "#ffb347");
      }
    }
    // A served marshmallow hops to the plate.
    if (flight) {
      const k = Math.min(1, flight.t / 0.45),
        x = flight.from.x + (PLATE.x - 10 + plate.length * 2 - flight.from.x) * k,
        y = flight.from.y + (PLATE.y - 6 - flight.from.y) * k - Math.sin(k * Math.PI) * 30;
      marshmallow(x, y, flight.done, 0);
    }
    // The plate shows the night so far; the burnt ones are the strikes.
    plate.slice(0, flight ? -1 : undefined).forEach((cooked, i) => {
      const x = PLATE.x - 24 + (i % 5) * 12,
        y = PLATE.y - 4 - Math.floor(i / 5) * 6;
      p.rect(x - 4, y - 4, 9, 7, toastColor(cooked));
      p.rect(x - 3, y - 4, 7, 1, toastColor(cooked * 0.8));
    });
    for (const spark of sparks) p.rect(spark.x, spark.y, 2, 2, spark.color);
    if (glare > 0) {
      const k = glare / 0.45;
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
  }

  reset();
  return { update, draw, press };
}

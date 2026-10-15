// Memorial Blade, the sword memorial by the reading sign: a Fruit Ninja
// style slicer at the bonfire. Training dummies, wooden shields, apples and
// potions are tossed up out of the fire; drag across them to cut them in
// two. Bombs and cursed skulls cost points, and quick clean cuts in a row
// build a combo. A round lasts 60 seconds. Space swings an aimed slash, so
// the game also plays without a pointer. Geometry is pure and exported.
import { W, H, painter, sprite, surface, format, seeded, rotations, nightSky, clamp } from "./pixel.js";

export const meta = { id: "slice", title: "Memorial Blade", touch: "tap" };

export const ROUND = 60;
export const GRAVITY = 250;
// What each target is worth; the last two are the ones to leave alone.
export const TARGETS = {
  apple: { points: 5, radius: 10, weight: 34, juice: ["#c4304a", "#e86a6a", "#f6e0a0"] },
  dummy: { points: 10, radius: 15, weight: 26, juice: ["#c8a86a", "#e0c890", "#7a5a34"] },
  shield: { points: 10, radius: 15, weight: 22, juice: ["#8a5a33", "#b07a44", "#9a9aa2"] },
  potion: { points: 20, radius: 11, weight: 8, juice: ["#8a4ad8", "#c8a0ff", "#a8c8d8"] },
  bomb: { points: -30, radius: 11, weight: 0, hazard: true, juice: ["#ff9a40", "#ffe08a", "#5a5a68"] },
  skull: { points: -20, radius: 10, weight: 0, hazard: true, juice: ["#6ad08a", "#b4f0c0", "#e8e0c8"] },
};
// Clean cuts less than this far apart (seconds) keep a combo going.
export const COMBO_WINDOW = 0.65;
export const comboBonus = (count) => (count >= 3 ? count * 3 : 0);

// The shortest distance from point (px, py) to the segment a-b.
export function segmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax,
    dy = by - ay,
    length = dx * dx + dy * dy,
    t = length ? clamp(((px - ax) * dx + (py - ay) * dy) / length, 0, 1) : 0;
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}
// The launch that carries a target from the fire up to `apex` and across
// towards the middle of the box.
export function launch(x, apex, random) {
  const vy = -Math.sqrt(2 * GRAVITY * (H + 12 - apex)),
    vx = (W / 2 - x) * 0.32 + (random() - 0.5) * 50;
  return { x, y: H + 12, vx, vy };
}
// How dangerous the sky gets as the round goes on: more targets per toss
// and more hazards among them.
export function wave(elapsed, random) {
  const k = clamp(elapsed / ROUND, 0, 1),
    count = 1 + Math.floor(random() * (1.6 + k * 2.6)),
    hazards = 0.08 + k * 0.16;
  return { count, hazards, gap: 1.25 - k * 0.55 };
}

const SPRITES = {
  apple: [
    "....g.l..",
    "....g.ll.",
    ".rrrgrrr.",
    "rrhrrrrrr",
    "rhhrrrrrr",
    "rhrrrrrrd",
    "rrrrrrrrd",
    "rrrrrrrdd",
    ".rrrrrdd.",
    "..rrddd..",
  ],
  dummy: [
    "......kk......",
    ".....kkkk.....",
    "....ssssss....",
    "...ssssssss...",
    "...sseesees...",
    "...ssssssss...",
    "....ssssss....",
    ".....rrrr.....",
    "..ssssssssss..",
    ".ssssttttssss.",
    "ssssttwwttssss",
    "ssssttwwttssss",
    "ssssttttttssss",
    "rrrrrrrrrrrrrr",
    "ssssssssssssss",
    ".ssssssssssss.",
    "..ssssssssss..",
    "......pp......",
    "......pp......",
  ],
  shield: [
    "....iiiiii....",
    "..iippppppii..",
    ".ippqqppqqppi.",
    ".ipqqppqqpppi.",
    "ippqqppqqppppi",
    "ipqqppbbqqpppi",
    "ipqqpbccbqpppi",
    "ipqqpbccbqpppi",
    "ipqqppbbqqpppi",
    "ippqqppqqppppi",
    ".ipqqppqqpppi.",
    ".ippqqppqqppi.",
    "..iippppppii..",
    "....iiiiii....",
  ],
  potion: [
    "...cc...",
    "...cc...",
    "..gggg..",
    "...gg...",
    "...gg...",
    "..gllg..",
    ".gllllg.",
    "gllhlllg",
    "glhlllll",
    "gllllllg",
    "gllllllg",
    ".gllllg.",
    "..gggg..",
  ],
  bomb: [
    "........ff",
    ".......f..",
    "......ff..",
    "...kkkkk..",
    ".kkkkkkkk.",
    "kkhhkkkkkk",
    "khhkkkkkkk",
    "khkkkkkkkk",
    "kkkkkkkkkk",
    "kkkkkkkkkk",
    ".kkkkkkkk.",
    "...kkkk...",
  ],
  skull: [
    "..bbbbbb..",
    ".bbbbbbbb.",
    "bbbbbbbbbb",
    "bbeebbeebb",
    "bbeebbeebb",
    "bbbbnnbbbb",
    ".bbbbbbbb.",
    "..btbtbt..",
    "..bbbbbb..",
  ],
};
const COLORS = {
  apple: { r: "#c4304a", h: "#e86a6a", d: "#8a1e34", g: "#5a3a20", l: "#4a8a3a" },
  dummy: { s: "#c8a86a", k: "#d8bc80", e: "#3a2a1c", r: "#7a5a34", t: "#c4304a", w: "#f2ead8", p: "#5c3a22" },
  shield: { i: "#5a5a62", p: "#8a5a33", q: "#6b4426", b: "#7a7a84", c: "#c8c8d0" },
  potion: { c: "#a8784a", g: "#a8c8d8", l: "#8a4ad8", h: "#e0d0ff" },
  bomb: { k: "#2a2a32", h: "#5a5a68", f: "#c8b080" },
  skull: { b: "#e8e0c8", e: "#1a1418", n: "#3a3028", t: "#1a1418" },
};
const FRAMES = 16;

export function createGame(api) {
  const { ctx, hud, best } = api,
    p = painter(ctx),
    random = seeded(Date.now() & 0xffff);
  const backdrop = paintBackdrop();
  // Every target, and each of its halves, drawn at two units per art
  // pixel like the village and pre-rotated on that grid.
  const doubled = (source) => {
    const { canvas, ctx: c } = surface(source.width * 2, source.height * 2);
    c.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas;
  };
  const art = {};
  for (const [kind, rows] of Object.entries(SPRITES)) {
    const whole = doubled(sprite(rows, COLORS[kind])),
      half = (left) => {
        const { canvas, ctx: c } = surface(whole.width, whole.height),
          cut = Math.floor(whole.width / 2);
        c.drawImage(whole, left ? 0 : cut, 0, left ? cut : whole.width - cut, whole.height, left ? 0 : cut, 0, left ? cut : whole.width - cut, whole.height);
        return canvas;
      };
    art[kind] = { whole: rotations(whole, FRAMES), left: rotations(half(true), FRAMES), right: rotations(half(false), FRAMES) };
  }
  let state, clock, elapsed, score, targets, pieces, sparks, blade, toss, combo, lastCut, glare, shake, idle, bestScore = best.get();

  function paintBackdrop() {
    const { canvas, ctx: c } = surface(W, H),
      b = painter(c),
      r = seeded(31);
    b.rect(0, 0, W, H, "#1e221c");
    nightSky(b, 196, 29, { x: 98, y: 46, r: 18 });
    // Far ruined walls and broken pillars of the memorial.
    for (const [x, w, h] of [[40, 30, 70], [96, 18, 46], [400, 26, 80], [446, 20, 52], [356, 16, 36], [140, 14, 28]]) {
      b.rect(x - w / 2, 200 - h, w, h, "#2a2c34");
      b.rect(x - w / 2, 200 - h, 3, h, "#3a3d48");
      for (let y = 200 - h + 6; y < 200; y += 8) b.rect(x - w / 2, y, w, 1, "#1e2028");
      b.rect(x - w / 2 - 2, 200 - h - 4, w + 4, 4, "#3a3d48");
    }
    for (const [x, y, len] of [[34, 140, 24], [404, 128, 30], [96, 160, 16]])
      for (let k = 0; k < len; k += 3) b.rect(x + Math.round(Math.sin(k * 0.6) * 2), y + k, 2, 3, "#24391f");
    // Ash ground with flagstones, then the bonfire glow at the bottom.
    b.rect(0, 196, W, H - 196, "#1e221c");
    for (let i = 0; i < 26; i++) {
      const x = r() * W,
        y = 204 + r() * 60;
      b.oval(x, y, 10 + r() * 8, 4, r() < 0.5 ? "#38342e" : "#2e2a26");
    }
    b.glow(W / 2, H - 6, 120, "#ff8a40", 0.06);
    b.oval(W / 2, H - 2, 60, 14, "#38342e");
    b.oval(W / 2, H - 4, 44, 9, "#4e4a44");
    // The coiled sword stands in the ash, hilt up.
    const sx = W / 2;
    b.rect(sx - 3, 214, 6, 46, "#1c1a18");
    for (let k = 0; k < 22; k++) {
      const y = 216 + k * 2;
      b.rect(sx - 2 + (k % 3), y, 2, 2, y > 248 ? "#c8642a" : "#9a968e");
    }
    b.rect(sx - 9, 210, 18, 3, "#7a7680");
    b.rect(sx - 2, 200, 4, 10, "#4a3426");
    b.rect(sx - 3, 196, 6, 4, "#8a8690");
    // Candles along the ring.
    for (const [x, y, h] of [[150, 236, 10], [176, 250, 7], [318, 246, 9], [344, 232, 6], [60, 252, 8], [420, 254, 11]]) {
      b.rect(x - 2, y - h, 4, h, "#d8ccaa");
      b.rect(x - 2, y - h, 1, h, "#f0e6c8");
      b.glow(x, y - h - 3, 10, "#ffc070", 0.12);
      b.rect(x - 1, y - h - 4, 2, 3, "#ffe19a");
    }
    return canvas;
  }

  function reset() {
    state = "ready";
    clock = 0;
    elapsed = 0;
    score = 0;
    targets = [{ kind: "dummy", x: W / 2, y: 112, vx: 0, vy: 0, spin: 0, angle: 0, practice: true }];
    pieces = [];
    sparks = [];
    blade = [];
    toss = 0.6;
    combo = 0;
    lastCut = -9;
    glare = 0;
    shake = 0;
    idle = 0;
    hud.banner(null);
    hud.hint("DRAG to slice", "SWIPE to slice");
  }

  function pick() {
    const kinds = Object.entries(TARGETS).filter(([, t]) => !t.hazard),
      total = kinds.reduce((sum, [, t]) => sum + t.weight, 0);
    let roll = random() * total;
    for (const [kind, t] of kinds) if ((roll -= t.weight) < 0) return kind;
    return "apple";
  }
  function throwWave() {
    const { count, hazards, gap } = wave(elapsed, random);
    for (let i = 0; i < count; i++) {
      const kind = random() < hazards ? (random() < 0.55 ? "bomb" : "skull") : pick(),
        x = 70 + random() * (W - 140),
        apex = 30 + random() * 90;
      targets.push({ kind, ...launch(x, apex, random), spin: (random() - 0.5) * 6, angle: random() * Math.PI * 2, delay: i * 0.12 });
    }
    toss = gap * (0.8 + random() * 0.4);
  }

  // One cut through a target: halves fly apart across the stroke, juice
  // or splinters spray, and the score answers.
  function cut(target, dx, dy) {
    target.cut = true;
    const info = TARGETS[target.kind],
      length = Math.hypot(dx, dy) || 1,
      nx = -dy / length,
      ny = dx / length;
    for (const side of [-1, 1])
      pieces.push({
        kind: target.kind,
        half: side < 0 ? "left" : "right",
        x: target.x + nx * side * 3,
        y: target.y + ny * side * 3,
        vx: target.vx * 0.6 + nx * side * 50,
        vy: Math.min(target.vy, 0) * 0.4 + ny * side * 50 - 30,
        angle: target.angle,
        spin: target.spin + side * 4,
        life: 1.4,
      });
    for (let i = 0; i < 12; i++)
      sparks.push({
        x: target.x,
        y: target.y,
        vx: (random() - 0.5) * 140 + dx * 0.4,
        vy: (random() - 0.5) * 140 + dy * 0.4,
        life: 0.35 + random() * 0.3,
        color: info.juice[i % info.juice.length],
      });
    if (target.practice) {
      state = "play";
      toss = 0.5;
      hud.float("Go!", target.x, target.y - 18, "is-good");
      return;
    }
    if (info.hazard) {
      score = Math.max(0, score + info.points);
      combo = 0;
      glare = 0.45;
      shake = target.kind === "bomb" ? 0.3 : 0.12;
      hud.pop(true);
      hud.float(`${info.points}`, target.x, target.y - 14, "is-bad");
      hud.announce(target.kind === "bomb" ? "A bomb went off." : "A cursed skull.");
      return;
    }
    combo = elapsed - lastCut <= COMBO_WINDOW ? combo + 1 : 1;
    lastCut = elapsed;
    score += info.points;
    hud.pop();
    hud.float(`+${info.points}`, target.x, target.y - 14, target.kind === "potion" ? "is-big" : "");
  }
  function endCombo() {
    if (combo >= 3) {
      const bonus = comboBonus(combo);
      score += bonus;
      hud.pop();
      hud.float(`Combo ×${combo} +${bonus}`, W / 2, 44, "is-big");
      hud.announce(`Combo of ${combo}, ${bonus} bonus points.`);
    }
    combo = 0;
  }

  // The blade: the last stretch of the stroke, cutting whatever it crosses.
  function swing(x, y) {
    const last = blade.at(-1);
    blade.push({ x, y, age: 0 });
    if (!last || Math.hypot(x - last.x, y - last.y) < 2) return;
    for (const target of targets) {
      if (target.cut || target.delay > 0) continue;
      const reach = TARGETS[target.kind].radius + 2;
      if (segmentDistance(target.x, target.y, last.x, last.y, x, y) <= reach) cut(target, x - last.x, y - last.y);
    }
  }
  let dragging = false;
  function pointer(kind, x, y) {
    if (state === "over") {
      if (kind === "down" && idle > 0.6) reset();
      return;
    }
    if (kind === "down") {
      dragging = true;
      blade = [];
      swing(x, y);
    } else if (kind === "move" && dragging) swing(x, y);
    else if (kind === "up") dragging = false;
  }
  // Space: a quick aimed slash through the nearest good target.
  function press(action) {
    if (action !== "action") return;
    if (state === "over") {
      if (idle > 0.6) reset();
      return;
    }
    const aim = targets
      .filter((t) => !t.cut && !(t.delay > 0) && !TARGETS[t.kind].hazard && t.y < H)
      .sort((a, b) => Math.hypot(a.x - W / 2, a.y - H / 2) - Math.hypot(b.x - W / 2, b.y - H / 2))[0];
    if (!aim) return;
    const angle = -0.5 + random();
    blade = [];
    for (let k = -3; k <= 3; k++) swing(aim.x + Math.cos(angle) * k * 10, aim.y + Math.sin(angle) * k * 10);
  }

  function update(dt) {
    clock += dt;
    idle += dt;
    glare = Math.max(0, glare - dt);
    shake = Math.max(0, shake - dt);
    if (state === "play") {
      elapsed += dt;
      toss -= dt;
      if (toss <= 0 && elapsed < ROUND - 1) throwWave();
      if (combo && elapsed - lastCut > COMBO_WINDOW) endCombo();
      if (elapsed >= ROUND && !targets.some((t) => !t.cut && !t.practice)) finish();
    }
    for (const t of targets) {
      if (t.practice) {
        t.y = 112 + Math.sin(clock * 2) * 6;
        t.angle = Math.sin(clock * 1.5) * 0.3;
        continue;
      }
      if (t.delay > 0) {
        t.delay -= dt;
        continue;
      }
      t.vy += GRAVITY * dt;
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.angle += t.spin * dt;
      // A good target that falls back into the fire breaks the combo.
      if (!t.cut && t.vy > 0 && t.y > H + 16) {
        t.gone = true;
        if (!TARGETS[t.kind].hazard && combo) endCombo();
      }
    }
    targets = targets.filter((t) => !t.cut && !t.gone);
    for (const piece of pieces) {
      piece.vy += GRAVITY * dt;
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;
      piece.angle += piece.spin * dt;
      piece.life -= dt;
    }
    pieces = pieces.filter((piece) => piece.life > 0 && piece.y < H + 30);
    for (const spark of sparks) {
      spark.vy += 200 * dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.life -= dt;
    }
    sparks = sparks.filter((spark) => spark.life > 0);
    for (const point of blade) point.age += dt;
    blade = blade.filter((point) => point.age < 0.14);
    hud.score(format(score));
  }
  function finish() {
    if (combo) endCombo();
    state = "over";
    idle = 0;
    const record = score > bestScore && score > 0;
    best.save(score);
    bestScore = Math.max(bestScore, score);
    hud.banner(record ? "New best!" : "Game over");
    hud.hint("SPACE to play again", "TAP to play again");
  }

  function drawFrame(frames, x, y, angle) {
    const index = ((Math.round((angle / (Math.PI * 2)) * FRAMES) % FRAMES) + FRAMES) % FRAMES,
      frame = frames[api.reduced ? 0 : index];
    ctx.drawImage(frame, Math.round(x - frame.width / 2), Math.round(y - frame.height / 2));
  }
  function draw() {
    const time = api.reduced ? 0 : performance.now() / 1000;
    ctx.save();
    if (shake > 0 && !api.reduced) ctx.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 4));
    ctx.drawImage(backdrop, 0, 0);
    // The bonfire licks up around the sword.
    const f = api.reduced ? 1 : Math.floor(time * 8) % 3;
    for (const [dx, h, color] of [[-12, 12 + f * 2, "#c8501c"], [6, 14 - f * 2, "#c8501c"], [-4, 18 + (f % 2) * 3, "#e8782a"], [2, 10 + f, "#f0a040"]]) {
      p.rect(W / 2 + dx, H - 4 - h, 6, h, color);
      p.rect(W / 2 + dx + 2, H - 2 - h, 2, Math.max(2, h - 6), "#ffc060");
    }
    for (const t of targets) {
      if (t.delay > 0) continue;
      const info = TARGETS[t.kind];
      if (info.hazard) p.glow(t.x, t.y, 16, t.kind === "bomb" ? "#ff7a30" : "#6ad08a", 0.12);
      if (t.practice) p.glow(t.x, t.y, 22, "#f6cf5a", 0.08 + (Math.sin(time * 3) + 1) * 0.03);
      drawFrame(art[t.kind].whole, t.x, t.y, t.angle);
      if (t.kind === "bomb" && Math.floor(time * 12) % 2) {
        const a = t.angle - 0.8;
        p.rect(t.x + Math.cos(a) * 15, t.y + Math.sin(a) * 15, 3, 3, "#ffe08a");
      }
    }
    for (const piece of pieces) {
      ctx.globalAlpha = clamp(piece.life * 2, 0, 1);
      drawFrame(art[piece.kind][piece.half], piece.x, piece.y, piece.angle);
    }
    ctx.globalAlpha = 1;
    for (const spark of sparks) p.rect(spark.x, spark.y, spark.life > 0.3 ? 2 : 1, spark.life > 0.3 ? 2 : 1, spark.color);
    // The blade trail: bright at the tip, thinning to gold behind it.
    for (let i = 1; i < blade.length; i++) {
      const a = blade[i - 1],
        b = blade[i],
        k = 1 - b.age / 0.14;
      p.line(a.x, a.y, b.x, b.y, "#f6cf5a", k > 0.5 ? 3 : 2);
      p.line(a.x, a.y, b.x, b.y, "#fff8e0", 1);
    }
    // A bad cut glares red at the edges for a moment.
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
    ctx.restore();
  }

  reset();
  return { update, draw, press, pointer };
}

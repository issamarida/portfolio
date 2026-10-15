// Maze Munch, the left arcade cabinet: a Pac-Man-style chase in the Game Dev
// cabin's plum and neon. Munch every firefly in the maze; the four lanterns
// turn the wisps blue for a few seconds so they can be eaten back to their
// house. Grid logic is pure and exported for tests; drawing stays in
// createGame.
import { W, H, painter, sprite, surface, format, seeded } from "./pixel.js";

export const meta = { id: "maze", title: "Maze Munch", touch: "dpad" };

// # wall · x outside the maze · . firefly · o lantern · - wisp door
// G wisp house · P start · space open floor. Row 9 wraps through tunnels.
export const MAZE = [
  "#####################",
  "#.........#.........#",
  "#o###.###.#.###.###o#",
  "#...................#",
  "#.###.#.#####.#.###.#",
  "#.....#...#...#.....#",
  "#####.### # ###.#####",
  "xxxx#.         .#xxxx",
  "#####.# ##-## #.#####",
  "     .  #GGG#  .     ",
  "#####.# ##### #.#####",
  "xxxx#.#       #.#xxxx",
  "#####.#.#####.#.#####",
  "#.........#.........#",
  "#.###.###.#.###.###.#",
  "#o..#.....P.....#..o#",
  "###.#.#.#####.#.#.###",
  "#.....#...#...#.....#",
  "#.#######.#.#######.#",
  "#...................#",
  "#####################",
];
export const COLS = 21,
  ROWS = 21,
  TILE = 12;
const OX = (W - COLS * TILE) / 2,
  OY = (H - ROWS * TILE) / 2;
export const DIRS = { up: [0, -1], left: [-1, 0], down: [0, 1], right: [1, 0] };
const ORDER = ["up", "left", "down", "right"],
  OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };
const START = { c: 10, r: 15 },
  DOOR_OUT = { c: 10, r: 7 },
  HOUSE = [
    { c: 9, r: 9 },
    { c: 10, r: 9 },
    { c: 11, r: 9 },
  ];
const wrap = (c) => ((c % COLS) + COLS) % COLS;

export function mazeCell(c, r) {
  if (r < 0 || r >= ROWS) return "#";
  return MAZE[r][wrap(c)];
}
// The player and roaming wisps stay out of the house; wisps going home or
// leaving it may pass the door.
export function mazeOpen(c, r, home = false) {
  const cell = mazeCell(c, r);
  if (cell === "#" || cell === "x") return false;
  if (cell === "-" || cell === "G") return home;
  return true;
}
export function pellets() {
  const list = new Map();
  MAZE.forEach((row, r) =>
    [...row].forEach((cell, c) => {
      if (cell === "." || cell === "o") list.set(`${c},${r}`, cell === "o" ? "power" : "dot");
    }),
  );
  return list;
}
export function reachable(from = START) {
  const seen = new Set([`${from.c},${from.r}`]),
    queue = [from];
  while (queue.length) {
    const { c, r } = queue.shift();
    for (const [dc, dr] of Object.values(DIRS)) {
      const next = { c: wrap(c + dc), r: r + dr },
        key = `${next.c},${next.r}`;
      if (!seen.has(key) && mazeOpen(next.c, next.r)) {
        seen.add(key);
        queue.push(next);
      }
    }
  }
  return seen;
}

// A grid mover sits on tile (c, r) and is `t` of the way to the next tile
// in `dir`. Decisions are only taken on tile centres (t = 0).
export function makeMover(c, r, dir) {
  return { c, r, dir, t: 0, stopped: false };
}
export function moverPosition(m) {
  const [dx, dy] = DIRS[m.dir];
  return { x: m.c + dx * m.t, y: m.r + dy * m.t };
}
export function reverse(m) {
  if (m.t > 0) {
    const [dx, dy] = DIRS[m.dir];
    m.c = wrap(m.c + dx);
    m.r += dy;
    m.t = 1 - m.t;
  }
  m.dir = OPPOSITE[m.dir];
}
export function advance(m, distance, canGo, decide, arrive) {
  let guard = 0;
  while (distance > 1e-9 && guard++ < 16) {
    if (m.t === 0) {
      decide?.(m);
      const [dx, dy] = DIRS[m.dir];
      if (!canGo(m.c + dx, m.r + dy)) {
        m.stopped = true;
        return;
      }
      m.stopped = false;
    }
    const step = Math.min(distance, 1 - m.t);
    m.t += step;
    distance -= step;
    if (m.t >= 1 - 1e-9) {
      const [dx, dy] = DIRS[m.dir];
      m.c = wrap(m.c + dx);
      m.r += dy;
      m.t = 0;
      arrive?.(m);
    }
  }
}
// Among the open ways (never straight back unless trapped), a wisp takes the
// one closest to its target; ties go up, left, down, right.
export function chooseTurn(m, target, canGo, random = null) {
  let options = ORDER.filter((dir) => {
    const [dx, dy] = DIRS[dir];
    return dir !== OPPOSITE[m.dir] && canGo(m.c + dx, m.r + dy);
  });
  if (!options.length) options = [OPPOSITE[m.dir]];
  if (random) return options[Math.floor(random() * options.length)];
  let best = options[0],
    bestDistance = Infinity;
  for (const dir of options) {
    const [dx, dy] = DIRS[dir],
      distance = (m.c + dx - target.c) ** 2 + (m.r + dy - target.r) ** 2;
    if (distance < bestDistance) {
      best = dir;
      bestDistance = distance;
    }
  }
  return best;
}

const WISPS = [
  { name: "Ember", color: "#e4573d", corner: { c: 19, r: -2 } },
  { name: "Bloom", color: "#f0a0c8", corner: { c: 1, r: -2 } },
  { name: "Tide", color: "#6fd0e0", corner: { c: 19, r: 22 } },
  { name: "Moss", color: "#f0a040", corner: { c: 1, r: 22 } },
];
const SCHEDULE = [
  ["scatter", 7],
  ["chase", 20],
  ["scatter", 7],
  ["chase", 20],
  ["scatter", 5],
  ["chase", Infinity],
];

const GHOST_A = [
  "....####....",
  "..########..",
  ".##########.",
  ".##########.",
  "############",
  "############",
  "############",
  "############",
  "############",
  "############",
  "##.##..##.##",
  "#...#..#...#",
];
const GHOST_B = [...GHOST_A.slice(0, 10), "#.###..###.#", "..##....##.."];

export function createGame(api) {
  const { ctx, hud, best } = api,
    p = painter(ctx),
    random = seeded(Date.now() & 0xffff);
  // Ghost bodies in every colour, two skirt frames each.
  const bodies = new Map();
  const body = (color, frame) => {
    const key = `${color}${frame}`;
    if (!bodies.has(key)) bodies.set(key, sprite(frame ? GHOST_B : GHOST_A, { "#": color }));
    return bodies.get(key);
  };
  const board = paintBoard();
  let state, score, lives, level, pellet, eaten, player, want, wisps, modeIndex, modeClock, fright, chain, clock, fruit, bestScore;
  bestScore = best.get();

  function paintBoard() {
    const { canvas, ctx: c } = surface(W, H),
      b = painter(c);
    // Just the maze on the cabinet's dark glass: no side panels.
    b.rect(0, 0, W, H, "#0b0614");
    for (let r = 0; r < ROWS; r++)
      for (let col = 0; col < COLS; col++) {
        const cell = MAZE[r][col],
          x = OX + col * TILE,
          y = OY + r * TILE;
        if (cell === "-") {
          b.rect(x, y + 5, TILE, 2, "#f0a0c8");
          continue;
        }
        if (cell !== "#") continue;
        b.rect(x, y, TILE, TILE, "#24112f");
        const openAt = (dc, dr) => {
          const n = mazeCell(col + dc, r + dr);
          return n !== "#" && n !== "x" && !(r + dr < 0 || r + dr >= ROWS);
        };
        if (openAt(0, -1)) b.rect(x, y, TILE, 2, "#c58ad8");
        if (openAt(0, 1)) b.rect(x, y + TILE - 2, TILE, 2, "#c58ad8");
        if (openAt(-1, 0) && col > 0) b.rect(x, y, 2, TILE, "#c58ad8");
        if (openAt(1, 0) && col < COLS - 1) b.rect(x + TILE - 2, y, 2, TILE, "#c58ad8");
      }
    return canvas;
  }

  function resetActors() {
    player = makeMover(START.c, START.r, "left");
    want = null;
    wisps = WISPS.map((w, i) => ({
      ...w,
      mode: i === 0 ? "out" : "house",
      mover: i === 0 ? makeMover(DOOR_OUT.c, DOOR_OUT.r, "left") : null,
      home: i === 0 ? null : { ...HOUSE[i - 1], x: HOUSE[i - 1].c, y: HOUSE[i - 1].r },
      release: [0, 1.2, 4.5, 8][i] / (1 + (level - 1) * 0.25),
      frightened: false,
    }));
    modeIndex = 0;
    modeClock = 0;
    fright = 0;
    chain = 0;
  }
  function newGame() {
    score = 0;
    lives = 3;
    level = 1;
    newLevel();
    state = "ready";
    hud.banner(null);
    hud.hint("WASD to move", "SWIPE to move");
  }
  function newLevel() {
    pellet = pellets();
    eaten = 0;
    fruit = null;
    resetActors();
    clock = 0;
  }
  const speedFor = (base) => base * Math.min(1.25, 1 + (level - 1) * 0.04);

  function wispTarget(w, i) {
    const pos = { c: player.c, r: player.r };
    if (w.mode === "eyes") return DOOR_OUT;
    const mode = SCHEDULE[modeIndex][0];
    if (mode === "scatter") return w.corner;
    const [dx, dy] = DIRS[player.dir];
    if (i === 1) return { c: pos.c + dx * 4, r: pos.r + dy * 4 };
    if (i === 2) {
      const lead = { c: pos.c + dx * 2, r: pos.r + dy * 2 },
        ember = wisps[0].mover || DOOR_OUT;
      return { c: lead.c * 2 - ember.c, r: lead.r * 2 - ember.r };
    }
    if (i === 3 && (pos.c - (w.mover?.c ?? 10)) ** 2 + (pos.r - (w.mover?.r ?? 9)) ** 2 < 64) return w.corner;
    return pos;
  }

  function pickFruit() {
    if (!fruit || player.c !== fruit.c || player.r !== fruit.r) return;
    const value = 200 + level * 100;
    score += value;
    fruit = null;
  }
  function eat() {
    const key = `${player.c},${player.r}`,
      kind = pellet.get(key);
    if (!kind) return pickFruit();
    pellet.delete(key);
    eaten++;
    if (kind === "dot") score += 10;
    else {
      score += 50;
      fright = Math.max(2.5, 7.5 - level);
      chain = 0;
      for (const w of wisps)
        if (w.mode === "out") {
          w.frightened = true;
          reverse(w.mover);
        }
    }
    if (eaten === 60 || eaten === 130) fruit = { c: 10, r: 11, time: 9 };
    pickFruit();
    if (!pellet.size) {
      state = "clear";
      clock = 0;
    }
  }

  function updatePlay(dt) {
    clock += dt;
    // Mode clock pauses while the lanterns burn.
    if (fright > 0) {
      fright -= dt;
      if (fright <= 0) wisps.forEach((w) => (w.frightened = false));
    } else {
      modeClock += dt;
      if (modeClock >= SCHEDULE[modeIndex][1]) {
        modeClock = 0;
        modeIndex = Math.min(SCHEDULE.length - 1, modeIndex + 1);
        for (const w of wisps) if (w.mode === "out") reverse(w.mover);
      }
    }
    // The muncher: buffered turns at tile centres, instant reversals and a
    // little forgiveness for turning just past a corner.
    if (want) {
      const [dx, dy] = DIRS[want];
      if (want === OPPOSITE[player.dir] && player.t > 0) reverse(player);
      else if (player.t > 0 && player.t < 0.22 && want !== player.dir && mazeOpen(player.c + dx, player.r + dy)) {
        player.t = 0;
        player.dir = want;
      }
    }
    const tunnel = (m) => m.r === 9 && (m.c <= 4 || m.c >= 16);
    advance(
      player,
      speedFor(7.2) * dt,
      (c, r) => mazeOpen(c, r),
      (m) => {
        if (want) {
          const [dx, dy] = DIRS[want];
          if (mazeOpen(m.c + dx, m.r + dy)) m.dir = want;
        }
      },
      eat,
    );
    if (player.t === 0) eat();
    // Wisps.
    wisps.forEach((w, i) => {
      if (w.mode === "house") {
        w.release -= dt;
        w.home.y = w.home.r + Math.sin(clock * 6 + i) * 0.18;
        if (w.release <= 0) w.mode = "leaving";
        return;
      }
      if (w.mode === "leaving" || w.mode === "entering") {
        const goal = w.mode === "leaving" ? DOOR_OUT : { c: 10, r: 9 },
          step = 4 * dt;
        const h = w.home;
        if (Math.abs(h.x - goal.c) > 0.01) h.x += Math.sign(goal.c - h.x) * Math.min(step, Math.abs(goal.c - h.x));
        else h.y += Math.sign(goal.r - h.y) * Math.min(step, Math.abs(goal.r - h.y));
        if (Math.abs(h.x - goal.c) < 0.01 && Math.abs(h.y - goal.r) < 0.01) {
          if (w.mode === "leaving") {
            w.mode = "out";
            w.frightened = false;
            w.mover = makeMover(DOOR_OUT.c, DOOR_OUT.r, random() < 0.5 ? "left" : "right");
          } else {
            w.mode = "house";
            w.release = 0.8;
            w.home = { c: 10, r: 9, x: 10, y: 9 };
          }
        }
        return;
      }
      const m = w.mover,
        eyes = w.mode === "eyes",
        speed = eyes ? 14 : w.frightened ? 4.2 : tunnel(m) ? 4 : speedFor(6.7);
      advance(
        m,
        speed * dt,
        (c, r) => mazeOpen(c, r),
        (mover) => {
          mover.dir = chooseTurn(mover, wispTarget(w, i), (c, r) => mazeOpen(c, r), w.frightened && !eyes ? random : null);
        },
        (mover) => {
          if (eyes && mover.c === DOOR_OUT.c && mover.r === DOOR_OUT.r) {
            w.mode = "entering";
            w.home = { c: 10, r: 7, x: 10, y: 7 };
            w.mover = null;
          }
        },
      );
    });
    // Fruit: a lantern berry under the house for a few seconds.
    if (fruit) {
      fruit.time -= dt;
      if (fruit.time <= 0) fruit = null;
    }
    // Collisions.
    const me = moverPosition(player);
    for (const w of wisps) {
      if (w.mode !== "out") continue;
      const them = moverPosition(w.mover),
        dx = Math.min(Math.abs(me.x - them.x), COLS - Math.abs(me.x - them.x));
      if (dx * dx + (me.y - them.y) ** 2 > 0.5) continue;
      if (w.frightened) {
        const value = 200 * 2 ** chain++;
        score += value;
        w.frightened = false;
        w.mode = "eyes";
        api.hud.announce(`Ate ${w.name} for ${value} points`);
      } else {
        state = "dying";
        clock = 0;
        return;
      }
    }
  }
  function update(dt) {
    if (state === "play") updatePlay(dt);
    else if (state === "dying") {
      clock += dt;
      if (clock > 1.6) {
        lives--;
        if (lives <= 0) {
          state = "over";
          const record = score > bestScore && score > 0;
          best.save(score);
          bestScore = Math.max(bestScore, score);
          hud.banner(record ? "New best!" : "Game over");
          hud.hint("SPACE to play again", "TAP to play again");
        } else {
          resetActors();
          state = "ready";
        }
      }
    } else if (state === "clear") {
      clock += dt;
      if (clock > 1.8) {
        level++;
        newLevel();
        state = "ready";
      }
    }
    hud.score(format(score));
  }

  function steer(dir) {
    want = dir;
    if (state === "ready") {
      state = "play";
      hud.banner(null);
      if (player.t === 0) {
        const [dx, dy] = DIRS[dir];
        if (mazeOpen(player.c + dx, player.r + dy)) player.dir = dir;
      }
    }
  }
  function press(action) {
    if (state === "over") {
      if (action === "action") {
        newGame();
      }
      return;
    }
    if (DIRS[action]) steer(action);
  }

  let swipe = null;
  function pointer(kind, x, y) {
    if (kind === "down") {
      swipe = { x, y };
      if (state === "over") return press("action");
      // A tap steers towards where it lands.
      const me = moverPosition(player),
        dx = x - (OX + (me.x + 0.5) * TILE),
        dy = y - (OY + (me.y + 0.5) * TILE);
      if (Math.hypot(dx, dy) > 14) steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
      return;
    }
    if (!swipe) return;
    const dx = x - swipe.x,
      dy = y - swipe.y;
    swipe = null;
    if (Math.hypot(dx, dy) > 10) steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  }

  // --- Drawing -------------------------------------------------------------
  function muncher(cx, cy, dir, mouth) {
    const angle = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[dir];
    for (let y = -5; y < 5; y++)
      for (let x = -5; x < 5; x++) {
        const px = x + 0.5,
          py = y + 0.5;
        if (px * px + py * py > 25) continue;
        let a = Math.atan2(py, px) - angle;
        a = Math.atan2(Math.sin(a), Math.cos(a));
        if (Math.abs(a) < mouth) continue;
        p.rect(cx + x, cy + y, 1, 1, px * px + py * py < 6 && x < 0 ? "#fff0b0" : "#f6cf5a");
      }
  }
  function wisp(w, x, y, time) {
    const frame = Math.floor(time * 6) % 2;
    if (w.mode !== "eyes") {
      let color = w.color;
      if (w.frightened) color = fright < 2 && Math.floor(time * 8) % 2 ? "#e8e4f0" : "#2d3c9a";
      ctx.drawImage(body(color, frame), Math.round(x - 6), Math.round(y - 6));
      if (w.frightened) {
        p.rect(x - 3, y - 2, 2, 2, "#f6dc8e");
        p.rect(x + 2, y - 2, 2, 2, "#f6dc8e");
        for (let i = 0; i < 4; i++) p.rect(x - 4 + i * 2, y + 2 + (i % 2), 2, 1, "#f6dc8e");
        return;
      }
    }
    const dir = w.mover ? DIRS[w.mover.dir] : [0, 1];
    for (const ex of [-3, 2]) {
      p.rect(x + ex - 1, y - 3, 3, 4, "#fff3d6");
      p.rect(x + ex + dir[0], y - 2 + dir[1], 2, 2, "#1d2a6b");
    }
  }
  function draw() {
    const time = performance.now() / 1000;
    ctx.drawImage(board, 0, 0);
    if (state === "clear" && Math.floor(clock * 6) % 2) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.25;
      p.rect(OX, OY, COLS * TILE, ROWS * TILE, "#c58ad8");
      ctx.restore();
    }
    for (const [key, kind] of pellet) {
      const [c, r] = key.split(",").map(Number),
        x = OX + c * TILE + TILE / 2,
        y = OY + r * TILE + TILE / 2;
      if (kind === "dot") p.rect(x - 1, y - 1, 2, 2, "#f6e08a");
      else {
        const lit = api.reduced || Math.floor(time * 4) % 4;
        p.glow(x, y, 10, "#f6cf5a", lit ? 0.16 : 0.08);
        p.rect(x - 2, y - 4, 4, 1, "#5a3a20");
        p.rect(x - 3, y - 3, 6, 6, lit ? "#f6cf5a" : "#c98f2e");
        p.rect(x - 1, y - 2, 2, 3, "#fff0b0");
      }
    }
    if (fruit) {
      const x = OX + fruit.c * TILE + TILE / 2,
        y = OY + fruit.r * TILE + TILE / 2;
      p.rect(x - 1, y - 6, 2, 3, "#3d704f");
      p.oval(x, y, 4, 4, "#c4304a");
      p.rect(x - 2, y - 2, 2, 2, "#f0a0b8");
    }
    const tile = (pos) => [OX + (pos.x + 0.5) * TILE, OY + (pos.y + 0.5) * TILE];
    for (const w of wisps) {
      const [x, y] = w.mover ? tile(moverPosition(w.mover)) : tile(w.home);
      if (state === "dying" && clock > 0.5) continue;
      if (state === "clear") continue;
      wisp(w, x, y, time);
    }
    const [mx, my] = tile(moverPosition(player));
    if (state === "dying") {
      const k = Math.min(1, Math.max(0, (clock - 0.5) / 1));
      if (k < 1) muncher(mx, my, "up", 0.5 + k * Math.PI);
    } else {
      const moving = state === "play" && !player.stopped,
        mouth = moving && !api.reduced ? [0.08, 0.5, 0.9, 0.5][Math.floor(time * 14) % 4] : 0.5;
      muncher(mx, my, player.dir, mouth);
    }
    // Black out the tunnel mouths so movers slip out of sight.
    p.rect(OX - TILE, OY + 9 * TILE - 1, TILE, TILE + 2, "#0b0614");
    p.rect(OX + COLS * TILE, OY + 9 * TILE - 1, TILE, TILE + 2, "#0b0614");
    // CRT scanlines.
    ctx.save();
    ctx.globalAlpha = 0.12;
    for (let y = 0; y < H; y += 2) p.rect(0, y, W, 1, "#000000");
    ctx.restore();
  }

  newGame();
  return { update, draw, press, pointer };
}

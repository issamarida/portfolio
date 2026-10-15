import test from "node:test";
import assert from "node:assert/strict";
import {
  ARCADES,
  EXIT_Y,
  INTERIOR_SPAWN,
  interiorArcade,
  interiorNear,
  interiorWalkable,
} from "../dist/interiors.js";
import {
  MAZE,
  COLS,
  ROWS,
  advance,
  chooseTurn,
  makeMover,
  mazeOpen,
  pellets,
  reachable,
  reverse,
} from "../dist/minigames/maze.js";
import { FLIGHT, fly, gapFor, hitsPillar, speedFor } from "../dist/minigames/flap.js";
import { FISH, REEL, pickFish, reelStep, swimStep } from "../dist/minigames/fishing.js";
import {
  ARENA,
  OBSTACLES,
  bank,
  carStep,
  collide,
  crash,
  makeCar,
  makeScore,
  scoreStep,
  slipAngle,
  speedOf,
} from "../dist/minigames/drift.js";
import { minigameIds } from "../dist/minigames/stage.js";

const seeded = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

test("every hidden extra has a minigame module", () => {
  assert.deepEqual([...minigameIds].sort(), ["drift", "fishing", "flap", "maze"]);
  for (const cabinet of ARCADES) assert.ok(minigameIds.includes(cabinet.game));
});

test("both arcade cabinets can be reached and only exist in the Game Dev cabin", () => {
  const found = new Set(),
    seen = new Set(),
    queue = [[INTERIOR_SPAWN.x, INTERIOR_SPAWN.y]];
  while (queue.length) {
    const [x, y] = queue.pop(),
      key = `${x},${y}`;
    if (seen.has(key) || !interiorWalkable("gamedev", x, y) || y > EXIT_Y) continue;
    seen.add(key);
    const game = interiorArcade("gamedev", x, y);
    if (game) {
      found.add(game);
      // A cabinet never hides the lectern or the way out.
      assert.equal(interiorNear(x, y), null);
    }
    for (const [dx, dy] of [
      [6, 0],
      [-6, 0],
      [0, 6],
      [0, -6],
    ])
      queue.push([x + dx, y + dy]);
  }
  assert.deepEqual([...found].sort(), ["flap", "maze"]);
  for (const id of ["about", "projects", "career"]) assert.equal(interiorArcade(id, 230, 290), null);
});

test("the maze is symmetric, closed and every firefly can be reached", () => {
  assert.equal(MAZE.length, ROWS);
  for (const row of MAZE) {
    assert.equal(row.length, COLS);
    const plain = row.replace("P", ".");
    assert.equal(plain, [...plain].reverse().join(""));
  }
  const open = reachable();
  for (const key of pellets().keys()) assert.ok(open.has(key), `firefly ${key} is reachable`);
  assert.equal([...pellets().values()].filter((kind) => kind === "power").length, 4);
  // The muncher cannot slip into the wisps' house.
  assert.equal(mazeOpen(10, 8), false);
  assert.equal(mazeOpen(10, 8, true), true);
});

test("maze movers turn on tile centres, wrap through the tunnel and reverse cleanly", () => {
  const mover = makeMover(1, 9, "left");
  advance(mover, 3, (c, r) => mazeOpen(c, r));
  assert.equal(mover.r, 9);
  assert.equal(mover.c, 19, "walked left through the tunnel");
  const blocked = makeMover(1, 1, "up");
  advance(blocked, 2, (c, r) => mazeOpen(c, r));
  assert.equal(blocked.stopped, true);
  const half = makeMover(1, 1, "right");
  advance(half, 0.25, (c, r) => mazeOpen(c, r));
  reverse(half);
  assert.equal(half.dir, "left");
  assert.equal(half.c, 2);
  assert.ok(Math.abs(half.t - 0.75) < 1e-9);
  // Wisps head for their target and never double back unless trapped.
  const wisp = makeMover(5, 3, "right");
  assert.equal(chooseTurn(wisp, { c: 5, r: 20 }, (c, r) => mazeOpen(c, r)), "down");
  assert.notEqual(chooseTurn(wisp, { c: 0, r: 3 }, (c, r) => mazeOpen(c, r)), "left");
});

test("the owl falls, flaps and collides with pillars but not the gap", () => {
  const owl = { x: FLIGHT.owlX, y: 100, vy: 0 };
  fly(owl, 0.2);
  assert.ok(owl.y > 100 && owl.vy > 0);
  const pillar = { x: FLIGHT.owlX - 10, gapY: 120 };
  assert.equal(hitsPillar({ x: FLIGHT.owlX, y: 120 }, pillar, 80), false);
  assert.equal(hitsPillar({ x: FLIGHT.owlX, y: 60 }, pillar, 80), true);
  assert.equal(hitsPillar({ x: FLIGHT.owlX, y: 200 }, pillar, 80), true);
  assert.equal(hitsPillar({ x: FLIGHT.owlX + 80, y: 10 }, pillar, 80), false);
  assert.ok(gapFor(100) >= FLIGHT.minGap && speedFor(1000) <= FLIGHT.maxSpeed);
});

test("rarer fish bite more often on long, clean casts", () => {
  const rare = (power, perfect) => {
    const random = seeded(4);
    let count = 0;
    for (let i = 0; i < 4000; i++) if (pickFish(random(), power, perfect).rarity !== "Common") count++;
    return count;
  };
  assert.ok(rare(1, true) > rare(0, false) * 1.4);
  assert.equal(pickFish(0).id, "perch");
  assert.equal(pickFish(0.9999).id, "koi");
  assert.equal(new Set(FISH.map((fish) => fish.behaviour)).size, FISH.length, "every fish swims its own way");
});

test("a steady net lands a fish quickly and a few slips never lose it", () => {
  const fight = { zone: 0.3, zv: 0, size: 0.3, fish: 0.45, target: 0.45, timer: 1, clock: 0, progress: REEL.start, inside: false };
  let result = "fighting",
    time = 0;
  while (result === "fighting" && time < 10) {
    fight.fish = fight.zone + fight.size / 2;
    result = reelStep(fight, fight.zone < 0.3, 1 / 60);
    time += 1 / 60;
  }
  assert.equal(result, "caught");
  assert.ok(time > 0.8 && time < 2, `caught in ${time.toFixed(2)}s`);
  // Two seconds out of the net still leaves the fish on the line.
  const slip = { zone: 0, zv: 0, size: 0.4, fish: 0.9, target: 0.9, timer: 1, clock: 0, progress: REEL.start, inside: false };
  for (let i = 0; i < 120; i++) assert.equal(reelStep(slip, false, 1 / 60), "fighting");
  const lost = { zone: 0, zv: 0, size: 0.2, fish: 0.9, target: 0.9, timer: 1, clock: 0, progress: REEL.start, inside: false };
  let outcome = "fighting";
  for (let i = 0; i < 600 && outcome === "fighting"; i++) outcome = reelStep(lost, false, 1 / 60);
  assert.equal(outcome, "escaped");
  // Common fish leave a wider net and swim slower than the rare ones.
  const [perch, , , pike, koi] = FISH;
  assert.ok(perch.zone >= 0.4 && perch.zone > pike.zone && pike.zone > koi.zone);
  assert.ok(perch.agility < pike.agility && pike.agility < koi.agility);
  // Fish stay inside the bar whatever they do.
  const random = seeded(9);
  for (const species of FISH) {
    const swim = { fish: 0.5, target: 0.5, timer: 0, clock: 0 };
    for (let i = 0; i < 600; i++) {
      swimStep(swim, species, 1 / 60, random);
      assert.ok(swim.fish >= 0 && swim.fish <= 1);
    }
  }
});

test("turning hard at speed slides the rear out and builds a combo", () => {
  const car = makeCar(0, 0, 0),
    score = makeScore();
  for (let i = 0; i < 150; i++) carStep(car, { gas: true }, 1 / 120);
  assert.ok(slipAngle(car) < 3, "drives straight with grip");
  let widest = 0;
  for (let i = 0; i < 360; i++) {
    carStep(car, { gas: true, right: true }, 1 / 120);
    scoreStep(score, car, 1 / 120);
    widest = Math.max(widest, slipAngle(car));
  }
  assert.ok(widest > 25, `rear slides out (${widest.toFixed(0)}°)`);
  assert.ok(score.pending > 0 && score.combo >= 2);
  let banked = null;
  for (let i = 0; i < 240 && !banked; i++) {
    carStep(car, { gas: true }, 1 / 120);
    banked = scoreStep(score, car, 1 / 120);
  }
  assert.ok(banked && banked.points > 0 && score.total === banked.points && score.combo === 1);
});

test("crashes cost the pending drift, and the ring and obstacles hold", () => {
  const score = makeScore();
  score.pending = 400;
  score.combo = 3;
  assert.equal(crash(score), 1200);
  assert.equal(score.pending, 0);
  assert.equal(score.combo, 1);
  assert.deepEqual(bank(makeScore()), { points: 0, combo: 1 });
  const wall = makeCar(ARENA.x + ARENA.rx + 20, ARENA.y, 0);
  wall.vx = 150;
  assert.ok(collide(wall) > 100);
  assert.ok(((wall.x - ARENA.x) / ARENA.rx) ** 2 + ((wall.y - ARENA.y) / ARENA.ry) ** 2 <= 1);
  assert.ok(wall.vx < 0, "bounces back off the stones");
  const rock = OBSTACLES[0],
    car = makeCar(rock.x - 2, rock.y, 0);
  car.vx = 60;
  collide(car);
  assert.ok(Math.hypot(car.x - rock.x, car.y - rock.y) >= rock.r + 6.99);
  // The start is clear of everything.
  const start = makeCar();
  assert.equal(collide(start), 0);
  assert.equal(speedOf(start), 0);
});

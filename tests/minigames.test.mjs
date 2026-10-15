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
  CRASH_TOLL,
  DRIFT,
  makeCar,
  makeScore,
  scoreStep,
  slipAngle,
  speedOf,
} from "../dist/minigames/drift.js";
import { minigameIds } from "../dist/minigames/stage.js";
import { COMBO_WINDOW, GRAVITY, ROUND as SLICE_ROUND, TARGETS, comboBonus, launch, segmentDistance, wave } from "../dist/minigames/slice.js";
import { GRADES, STRIKES, cookTime, judge, toastColor } from "../dist/minigames/toast.js";

const seeded = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

test("every hidden extra has a minigame module", () => {
  assert.deepEqual([...minigameIds].sort(), ["drift", "fishing", "flap", "maze", "slice", "toast"]);
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

test("fishing takes skill: commons reward attention, rare fish are a real chase", () => {
  // A steady, well-kept net lands a fish in under two seconds.
  const fight = { zone: 0.3, zv: 0, size: 0.3, fish: 0.45, target: 0.45, timer: 1, clock: 0, progress: REEL.start, inside: false };
  let result = "fighting",
    time = 0;
  while (result === "fighting" && time < 10) {
    fight.fish = fight.zone + fight.size / 2;
    result = reelStep(fight, fight.zone < 0.3, 1 / 60);
    time += 1 / 60;
  }
  assert.equal(result, "caught");
  assert.ok(time > 1 && time < 2.2, `caught in ${time.toFixed(2)}s`);
  // One slip of a second never loses a fish; leaving it alone does.
  const slip = { zone: 0, zv: 0, size: 0.4, fish: 0.9, target: 0.9, timer: 1, clock: 0, progress: REEL.start, inside: false };
  for (let i = 0; i < 60; i++) assert.equal(reelStep(slip, false, 1 / 60), "fighting");
  const lost = { zone: 0, zv: 0, size: 0.2, fish: 0.9, target: 0.9, timer: 1, clock: 0, progress: REEL.start, inside: false };
  let outcome = "fighting";
  for (let i = 0; i < 300 && outcome === "fighting"; i++) outcome = reelStep(lost, false, 1 / 60);
  assert.equal(outcome, "escaped");
  // Nets shrink and fish quicken with rarity, and rarer fish pay more.
  const [perch, bream, trout, pike, koi] = FISH;
  assert.ok(perch.zone <= 0.36 && perch.zone > pike.zone && pike.zone > koi.zone);
  assert.ok(perch.agility < pike.agility && pike.agility < koi.agility);
  assert.ok(perch.points < trout.points && trout.points < pike.points && pike.points < koi.points);
  // Play many fights with different players: one who watches the fish
  // with a human beat of lag, and lazy ones who hold, never hold or tap a
  // rhythm without looking.
  const players = {
    attentive: (f, lagged, noise) => f.zone + f.size / 2 + f.zv * 0.25 + (noise() - 0.5) * 0.06 < lagged,
    hold: () => true,
    idle: () => false,
  };
  const rate = (species, player) => {
    const random = seeded(11),
      noise = seeded(5);
    let caught = 0;
    for (let trial = 0; trial < 200; trial++) {
      const f = { zone: 0.5 - species.zone / 2, zv: 0, size: species.zone, fish: 0.5, target: 0.5, timer: 0, clock: 0, progress: REEL.start, inside: false },
        seen = [];
      let state = "fighting",
        hold = false;
      for (let frame = 0; state === "fighting" && frame < 60 * 40; frame++) {
        swimStep(f, species, 1 / 60, random);
        seen.push(f.fish);
        if (seen.length % 6 === 0) hold = players[player](f, seen[Math.max(0, seen.length - 15)], noise);
        state = reelStep(f, hold, 1 / 60);
      }
      if (state === "caught") caught++;
    }
    return caught / 200;
  };
  for (const species of [perch, bream]) {
    assert.ok(rate(species, "attentive") >= 0.9, `${species.id} rewards attention`);
    assert.ok(rate(species, "hold") < 0.4 && rate(species, "idle") < 0.4, `${species.id} needs more than one key held`);
  }
  assert.ok(rate(pike, "attentive") < rate(trout, "attentive"));
  assert.ok(rate(koi, "attentive") < rate(pike, "attentive"));
  assert.ok(rate(koi, "attentive") > 0.08, "the koi can still be landed");
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

test("the truck grips until the player commits to a drift, then can hold or recover it", () => {
  const drive = (car, input, seconds, each) => {
    let widest = 0;
    for (let i = 0; i < seconds * 120; i++) {
      carStep(car, input, 1 / 120);
      widest = Math.max(widest, slipAngle(car));
      each?.(i);
    }
    return widest;
  };
  // Straight, gentle and slow driving keep the tyres planted.
  const car = makeCar(0, 0, 0);
  assert.ok(drive(car, { gas: true }, 1.5) < 1, "drives straight with grip");
  const tapping = makeCar(0, 0, 0);
  drive(tapping, { gas: true }, 1.5);
  let taps = 0;
  for (let k = 0; k < 6; k++) taps = Math.max(taps, drive(tapping, { gas: true, right: k % 2 === 0 }, 0.2));
  assert.ok(taps < DRIFT.minAngle, `quick steering corrections grip (${taps.toFixed(1)}°)`);
  const slow = makeCar(0, 0, 0);
  drive(slow, { gas: true }, 0.35);
  assert.ok(drive(slow, { right: true }, 2) < DRIFT.minAngle, "slow turns never slide");
  // A held hard turn at speed steps the rear out progressively and settles
  // into a drift that can be held for as long as the turn is.
  const score = makeScore(),
    trace = [];
  drive(car, { gas: true, right: true }, 3, (i) => {
    scoreStep(score, car, 1 / 120);
    if (i % 12 === 0) trace.push(slipAngle(car));
  });
  assert.ok(trace[1] < DRIFT.minAngle, "the first instant of a turn still grips");
  assert.ok(Math.max(...trace) > 30, `the rear steps out (${Math.max(...trace).toFixed(0)}°)`);
  assert.ok(trace.slice(-8).every((angle) => angle > 15 && angle < 40), "a held turn holds a steady drift");
  assert.ok(score.pending > 0 && score.combo >= 2, "a held drift builds a combo");
  // Letting go straightens the truck within a moment, and opposite lock
  // catches a slide faster still.
  const released = [];
  drive(car, { gas: true }, 1, (i) => i % 12 === 0 && released.push(slipAngle(car)));
  assert.ok(released[3] < 6, "releasing the turn regains grip");
  const caught = makeCar(0, 0, 0),
    loose = makeCar(0, 0, 0);
  for (const c of [caught, loose]) {
    drive(c, { gas: true }, 1.5);
    drive(c, { gas: true, right: true }, 1.1);
  }
  drive(caught, { gas: true, left: true }, 0.15);
  drive(loose, { gas: true }, 0.15);
  assert.ok(caught.slide < loose.slide, "opposite lock catches the slide");
  // The settled drift banks its points once it is over.
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
  // Once there is a bank, every crash dents it a little, never below zero.
  score.total = 500;
  assert.equal(crash(score), CRASH_TOLL);
  assert.equal(score.total, 500 - CRASH_TOLL);
  score.total = 20;
  assert.equal(crash(score), 20);
  assert.equal(score.total, 0);
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

test("the blade cuts what it crosses and the sky fills up as the round goes on", () => {
  // Distance to the stroke, not to its endpoints.
  assert.equal(segmentDistance(5, 3, 0, 0, 10, 0), 3);
  assert.equal(segmentDistance(-4, 3, 0, 0, 10, 0), 5);
  assert.equal(segmentDistance(2, 2, 2, 2, 2, 2), 0);
  // A launch from the fire peaks where it was aimed, inside the box.
  const random = seeded(3);
  for (const apex of [30, 80, 120]) {
    const t = launch(200, apex, random);
    let top = t.y;
    for (let i = 0; i < 400; i++) {
      t.vy += GRAVITY / 120;
      t.y += t.vy / 120;
      t.x += t.vx / 120;
      top = Math.min(top, t.y);
    }
    assert.ok(Math.abs(top - apex) < 3, `apex ${top.toFixed(1)} vs ${apex}`);
  }
  // Later waves bring more targets, more hazards and less time between.
  const early = wave(0, () => 0.5),
    late = wave(SLICE_ROUND, () => 0.5);
  assert.ok(late.count > early.count && late.hazards > early.hazards && late.gap < early.gap);
  // Hazards cost points, everything else scores, and combos pay from three.
  for (const [kind, target] of Object.entries(TARGETS))
    assert.ok(target.hazard ? target.points < 0 : target.points > 0, kind);
  assert.equal(comboBonus(2), 0);
  assert.ok(comboBonus(4) > comboBonus(3) && comboBonus(3) > 0);
  assert.ok(COMBO_WINDOW > 0.3 && COMBO_WINDOW < 1);
});

test("marshmallows score best golden, worse early or late, and cost points burnt", () => {
  assert.equal(judge(0.62).grade, "perfect");
  assert.equal(judge(0.62).points, 10);
  assert.equal(judge(0.45).grade, "early");
  assert.equal(judge(0.8).grade, "late");
  assert.equal(judge(0.1).grade, "raw");
  assert.equal(judge(0.95).grade, "burnt");
  assert.ok(judge(0.95).points < 0);
  const best = Math.max(...GRADES.map((g) => g.points));
  assert.equal(GRADES.find((g) => g.points === best).grade, "perfect");
  // Colour darkens steadily from raw to burnt.
  const lightness = (hex) => [1, 3, 5].reduce((sum, i) => sum + parseInt(hex.slice(i, i + 2), 16), 0);
  let previous = Infinity;
  for (let done = 0; done <= 1; done += 0.1) {
    const value = lightness(toastColor(done));
    assert.ok(value <= previous);
    previous = value;
  }
  // The fire speeds up with the score, within sensible bounds.
  assert.ok(cookTime(0) > cookTime(60) && cookTime(60) > cookTime(200));
  assert.ok(cookTime(1000) >= 1.5 && cookTime(0) <= 3.5);
  // The golden window stays catchable even at full heat.
  const golden = GRADES.find((g) => g.grade === "perfect"),
    early = GRADES.find((g) => g.grade === "early");
  assert.ok((golden.below - early.below) * cookTime(1000) > 0.2);
  assert.equal(STRIKES, 3);
});

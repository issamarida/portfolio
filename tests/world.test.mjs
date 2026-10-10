import test from "node:test";
import assert from "node:assert/strict";
import {
  World,
  villageTrees,
  treeClearsRiver,
  cabinPaths,
  treeClearsCabinPaths,
  foxState,
  rabbitState,
  WALK_SPEED,
  walkFrame,
  canWalk,
  movePlayer,
  nearbyArea,
  destinations,
  cabinSign,
} from "../dist/world.js";
import { paintPillar, paintTemple } from "../dist/pillars.js";
import { areas } from "../dist/content.js";
test("every portfolio area has a walkable entrance and matching content", () => {
  assert.equal(destinations.length, 4);
  for (const d of destinations) {
    assert.ok(areas[d.id]);
    assert.ok(canWalk(d.doorX, d.doorY));
    assert.equal(nearbyArea(d.doorX, d.doorY), d.id);
  }
});
test("buildings, stream and world boundaries block movement", () => {
  assert.equal(canWalk(0, 300), false);
  assert.equal(canWalk(480, 190), false);
  for (const d of destinations)
    assert.equal(canWalk(d.x + 30, d.y + 50), false);
  assert.equal(canWalk(482, 355), true);
});
test("diagonal movement uses equal speed and frame spikes are capped", () => {
  const a = { x: 482, y: 355 },
    b = { ...a };
  movePlayer(a, 1, 0, 0.02);
  movePlayer(b, 1, 1, 0.02);
  assert.ok(Math.abs(Math.hypot(b.x - 482, b.y - 355) - (a.x - 482)) < 1e-6);
  const c = { x: 482, y: 355 };
  movePlayer(c, 1, 0, 20);
  assert.ok(Math.abs(c.x - (482 + WALK_SPEED * 0.04)) < 1e-6);
  assert.ok(Math.abs(a.x - (482 + 184 * 0.02)) < 1e-6);
});
test("all entrances are reachable from spawn through collision map", () => {
  const grid = 4,
    queue = [[480, 356]],
    seen = new Set(["480,356"]);
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const [dx, dy] of [
      [grid, 0],
      [-grid, 0],
      [0, grid],
      [0, -grid],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        key = `${nx},${ny}`;
      if (!seen.has(key) && canWalk(nx, ny)) {
        seen.add(key);
        queue.push([nx, ny]);
      }
    }
  }
  for (const d of destinations)
    assert.ok(
      queue.some(([x, y]) => Math.hypot(x - d.doorX, y - d.doorY) < 12),
      `${d.id} must be reachable`,
    );
});

test("walking has four discrete frames and respects reduced motion", () => {
  assert.deepEqual(
    [0, 0.1, 0.2, 0.3].map((t) => walkFrame(t, true, false)),
    [0, 1, 2, 3],
  );
  assert.equal(walkFrame(0.375, false, false), 0);
  assert.equal(walkFrame(0.375, true, true), 0);
});
test("blocked movement does not trigger a walking animation", () => {
  const player = { x: 48, y: 300 };
  assert.equal(movePlayer(player, -1, 0, 0.03), false);
  assert.equal(player.x, 48);
});

test("both fox routes stay in reachable clearings and freeze under reduced motion", () => {
  for (let index = 0; index < 2; index++) {
    for (let time = 0; time < 40; time += 0.1) {
      const fox = foxState(time, index);
      assert.ok(canWalk(fox.x, fox.y));
      assert.ok(fox.frame >= 0 && fox.frame < 4);
    }
    assert.deepEqual(foxState(0, index, true), foxState(20, index, true));
    assert.notDeepEqual(foxState(0, index), foxState(1, index));
  }
});

test("scrollable scenery never expands the playable cabin clearing", () => {
  const world = Object.create(World.prototype);
  world.layout = { height: 6200, skyHeight: 400, mobile: true, sections: [] };
  for (const point of [
    [482, 540],
    [482, 1400],
    [100, 355],
    [900, 355],
    [482, 250],
  ])
    assert.equal(world.isWalkable(...point), false);
  assert.ok(world.isWalkable(482, 355));
  const player = { x: 482, y: 355 };
  for (let i = 0; i < 600; i++) movePlayer(player, 0, 1, 0.04);
  assert.ok(player.y <= 478);
});

test("capped-frame movement cannot skip a narrow obstacle", () => {
  const player = { x: 482, y: 355 };
  movePlayer(player, 1, 0, 0.04, (x) => x < 486 || x > 488);
  assert.ok(player.x < 486);
});

test("statue fountain blocks entry without trapping the player", () => {
  assert.equal(canWalk(482, 324), false);
  assert.equal(canWalk(482, 355), true);
  for (const point of [
    [446, 324],
    [518, 324],
    [482, 290],
    [482, 356],
  ])
    assert.ok(canWalk(...point));
  const player = { x: 482, y: 355 };
  for (let i = 0; i < 30; i++) movePlayer(player, 0, -1, 0.04);
  assert.ok(player.y >= 349);
});
test("rabbits lead foxes on reachable routes and freeze for reduced motion", () => {
  for (let i = 0; i < 2; i++) {
    for (let t = 0; t < 40; t += 0.1) {
      const rabbit = rabbitState(t, i);
      assert.ok(canWalk(rabbit.x, rabbit.y));
      assert.notDeepEqual(rabbit, foxState(t, i));
    }
    assert.deepEqual(rabbitState(0, i, true), rabbitState(10, i, true));
  }
});

test("a transient render error cannot stop the next animation frame", () => {
  const previousRAF = globalThis.requestAnimationFrame;
  const previousDocument = globalThis.document;
  const queued = [];
  globalThis.requestAnimationFrame = (callback) => queued.push(callback);
  globalThis.document = { hidden: false };
  try {
    let rendered = 0;
    const world = {
      last: 0,
      time: 0,
      visible: true,
      active: false,
      draw() {
        throw new Error("transient render failure");
      },
    };
    world.frame = World.prototype.frame.bind(world);
    assert.throws(() => world.frame(100), /transient render failure/);
    assert.equal(queued.length, 1);
    world.draw = () => rendered++;
    queued[0](116);
    assert.equal(rendered, 1);
    assert.equal(queued.length, 2);
  } finally {
    if (previousRAF === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = previousRAF;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});

test("every complete village tree stays out of the river", () => {
  assert.ok(villageTrees().length > 30);
  assert.ok(villageTrees().every(treeClearsRiver));
  assert.equal(treeClearsRiver({ x: 480, y: 180, s: 1, tone: 0.5 }), false);
  assert.deepEqual(villageTrees(), villageTrees());
});

test("a drawing exception restores every surface transform and context", () => {
  let depth = 0;
  const ctx = {
    save() {
      depth++;
    },
    restore() {
      depth--;
    },
    translate() {},
    beginPath() {},
    rect() {},
    clip() {},
    clearRect() {},
    drawImage() {},
  };
  const original = {};
  const world = {
    ctx: original,
    layout: { height: 540, skyHeight: 0, clearings: [] },
    viewport: { top: 0, bottom: 540 },
    time: 0,
    reduced: false,
    scene: {},
    skyClouds() {
      throw new Error("paint failure");
    },
  };
  assert.throws(
    () => World.prototype.drawSurface.call(world, { ctx, top: 0, height: 540 }),
    /paint failure/,
  );
  assert.equal(depth, 0);
  assert.equal(world.ctx, original);
});

test("moon remains centered in its fixed scene at every resolution", () => {
  const world = Object.create(World.prototype);
  for (const scale of [0.333, 0.75, 1.5]) {
    world.layout = {
      scale,
      mobile: scale < 1,
      moonArea: { y: 200, height: 90 },
    };
    assert.deepEqual(world.moonPosition(), { x: 480, y: 325, diameter: 118 });
  }
});

test("curved cabin paths keep complete tree canopies clear", () => {
  assert.ok(villageTrees().every(treeClearsCabinPaths));
  const paths = cabinPaths();
  assert.equal(paths.length, 4);
  for (const path of paths) {
    assert.equal(path.length, 33);
    const [a, b, c] = [path[0], path[16], path[32]];
    assert.ok(
      Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) >
        1,
    );
  }
});

test("every mountain layer paints in front of the moon and the crest covers its lower quarter", () => {
  const world = Object.create(World.prototype),
    draws = [];
  world.layout = { skyHeight: 230, moonArea: { y: 40 } };
  world.ctx = { save() {}, restore() {} };
  for (const method of ["rect", "path", "ellipse"])
    world[method] = (...args) => draws.push([method, ...args]);
  world.drawSky();
  assert.ok(
    draws.findIndex((d) => d[0] === "ellipse") <
      draws.findIndex((d) => d[0] === "path"),
  );
  const center = draws.find(
    (d) => d[0] === "path" && d[2] === "#344b50" && d[1][2][0] === 480,
  );
  const moon = world.moonPosition();
  assert.equal(center[1][2][1], moon.y + moon.diameter * 0.25);
});

test("rooftop billboards stand above each roof, clear of one another and the chimneys", () => {
  const signs = destinations.map((d) => ({ d, sign: cabinSign(d) }));
  for (const { d, sign } of signs) {
    // On the native two-unit grid, centred over the ridge and inside the frame.
    assert.equal(sign.x % 2, 0);
    assert.equal(sign.y % 2, 0);
    assert.ok(Math.abs(sign.x + sign.w / 2 - (d.x + d.w / 2)) <= 2);
    assert.ok(sign.y >= 0 && sign.x >= 0 && sign.x + sign.w <= 960);
    // Above the roof peak (or Career's tower), with posts landing on the roof.
    const peak = d.id === "career" ? d.y - 49 : d.y - 14;
    assert.ok(sign.y + sign.h < peak, d.id);
    for (const post of sign.posts) assert.ok(post > d.x - 10 && post < d.x + d.w + 10, d.id);
    if (d.id !== "career") assert.ok(sign.y + sign.h < d.y - 20, "board clears the chimney cap");
    // The lettering fits inside the frame with room to spare.
    const letters = [...sign.text].reduce((w, ch) => w + (ch === " " ? 3 : 6), -1);
    assert.ok(letters * 2 + 16 <= sign.w);
  }
  // Standing at any door, the player's body is never behind a billboard.
  for (const door of destinations)
    for (const { sign } of signs)
      assert.ok(
        door.doorX + 13 <= sign.x ||
          door.doorX - 16 >= sign.x + sign.w ||
          door.doorY - 6 <= sign.y ||
          door.doorY - 44 >= sign.y + sign.h,
        `${door.id} entrance is hidden by a billboard`,
      );
  for (const a of signs)
    for (const b of signs)
      if (a !== b)
        assert.ok(
          a.sign.x + a.sign.w <= b.sign.x ||
            b.sign.x + b.sign.w <= a.sign.x ||
            a.sign.y + a.sign.h <= b.sign.y ||
            b.sign.y + b.sign.h <= a.sign.y,
          `${a.d.id} and ${b.d.id} billboards overlap`,
        );
});

test("margin pillars paint deterministically and mirror towards the page", () => {
  const surface = (width, height) => {
    let data = null;
    return {
      width,
      height,
      getContext: () => ({
        createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        putImageData: (image) => (data = image.data),
      }),
      pixels: () => data,
    };
  };
  const left = surface(80, 300),
    again = surface(80, 300),
    right = surface(80, 300);
  paintPillar(left, false, 17);
  paintPillar(again, false, 17);
  paintPillar(right, true, 17);
  assert.deepEqual(left.pixels(), again.pixels());
  // Mirrored: every row of the right pillar is the left pillar reversed.
  const row = (canvas, y) =>
    Array.from({ length: 80 }, (_, x) => canvas.pixels().slice((y * 80 + x) * 4, (y * 80 + x) * 4 + 4).join());
  for (const y of [20, 150, 290]) assert.deepEqual(row(right, y), row(left, y).reverse());
  // Stone fills the middle; the outer margins stay transparent above the ground.
  const alpha = (x, y) => left.pixels()[(y * 80 + x) * 4 + 3];
  assert.equal(alpha(40, 150), 255);
  assert.equal(alpha(1, 150), 0);
});

test("each margin is one mossy column running unbroken from top to bottom", () => {
  const surface = (width, height) => {
    let data = null;
    return {
      width,
      height,
      getContext: () => ({
        createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        putImageData: (image) => (data = image.data),
      }),
      pixels: () => data,
    };
  };
  for (const [w, h] of [
    [171, 463],
    [309, 617],
    [20, 400],
  ]) {
    const left = surface(w, h),
      again = surface(w, h),
      right = surface(w, h);
    paintTemple(left, false, 17);
    paintTemple(again, false, 17);
    paintTemple(right, true, 17);
    const px = left.pixels();
    assert.deepEqual(px, again.pixels());
    // No gap anywhere, so nothing behind the column can show through.
    for (let i = 3; i < px.length; i += 4) assert.equal(px[i], 255);
    const row = (canvas, y) =>
      Array.from({ length: w }, (_, x) => canvas.pixels().slice((y * w + x) * 4, (y * w + x) * 4 + 4).join());
    for (const y of [0, Math.floor(h / 2), h - 1]) assert.deepEqual(row(right, y), row(left, y).reverse());
    // No soil or grass band at the foot: the last rows are carved stone and
    // moss, like the rest of the shaft.
    const soil = new Set(["20,23,17", "29,34,25", "38,45,32"]);
    const bottom = row(left, h - 1).filter((c) => soil.has(c.split(",").slice(0, 3).join(",")));
    assert.ok(bottom.length < w * 0.2, "the column runs past the bottom edge");
    // Moss: plenty of green on the shaft.
    let green = 0;
    for (let i = 0; i < px.length; i += 4) if (px[i + 1] > px[i] + 12 && px[i + 1] > px[i + 2] + 12) green++;
    assert.ok(green > (w * h) * 0.08, `mossy enough at ${w}px (${((green / (w * h)) * 100).toFixed(1)}%)`);
  }
});

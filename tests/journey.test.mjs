import test from "node:test";
import assert from "node:assert/strict";
import {
  animateJourney,
  journeyGeometry,
  driftGeometry,
  driftState,
  treeFootprint,
  intersects,
  camperState,
  CAMPER_LOOP,
  campsiteGeometry,
  campsiteState,
  fishermanState,
  FISHING_LOOP,
  inCove,
  glowJourney,
} from "../dist/journey.js";

const layout = {
  height: 7000,
  mobile: false,
  invitation: { x: 0, y: 1000, width: 960, height: 280 },
  sections: [
    { id: "about", x: 86, y: 1000, width: 557, height: 900 },
    { id: "projects", x: 317, y: 2200, width: 557, height: 900 },
    { id: "career", x: 86, y: 3400, width: 557, height: 900 },
  ],
  divider: { x: 0, y: 650, width: 960, height: 200 },
  drift: { x: 0, y: 4700, width: 960, height: 360 },
  stable: { x: 0, y: 5700, width: 960, height: 520 },
};
function render(time, reduced, viewport) {
  const draws = [];
  const painter = {
    time,
    reduced,
    viewport,
    ctx: {
      save() {},
      restore() {},
      translate() {},
      scale() {},
      beginPath() {},
      rect() {},
      clip() {},
    },
  };
  for (const method of ["rect", "ellipse", "path", "lantern"])
    painter[method] = (...args) =>
      draws.push([method, painter.ctx.globalAlpha ?? 1, ...args]);
  animateJourney(painter, layout);
  return draws;
}
test("each visible scene changes with the animation clock", () => {
  for (const viewport of [
    { top: 600, bottom: 850 },
    { top: 900, bottom: 2000 },

    { top: 4700, bottom: 5000 },
    { top: 5700, bottom: 6600 },
  ]) {
    assert.ok(render(0, false, viewport).length > 0);
    assert.notDeepEqual(
      render(15, false, viewport),
      render(25, false, viewport),
    );
  }
});
test("reduced motion freezes lower scenery, campsite and river", () => {
  assert.deepEqual(render(0, true), render(20, true));
});
test("offscreen scenery has no animated draw calls", () => {
  assert.deepEqual(render(2, false, { top: 0, bottom: 500 }), []);
});

test("fixed scene compositions are identical at every resolution", () => {
  assert.deepEqual(
    journeyGeometry({ ...layout, mobile: true }),
    journeyGeometry({ ...layout, mobile: false }),
  );
  const scenes = journeyGeometry(layout);
  assert.deepEqual(
    scenes.map((s) => s.kind),
    ["campfire", "relics", "campsite", "river", "drift"],
  );
  assert.ok(
    !scenes.some((s) => ["pond", "pod", "cave", "sleepers"].includes(s.kind)),
  );
});
test("pickup loops continuously inside the dirt clearing and parks under reduced motion", () => {
  const { bounds } = driftGeometry(layout.drift);
  for (let t = 0; t < 9; t += 0.1) {
    const state = driftState(t);
    const repeat = driftState(t + 9);
    assert.ok(Math.abs(state.x - repeat.x) < 1e-8);
    assert.ok(Math.abs(state.y - repeat.y) < 1e-8);
    assert.ok(state.moving);
    assert.ok(state.x - 70 > bounds.left && state.x + 70 < bounds.right);
    assert.ok(layout.drift.y + state.y - 70 > bounds.top);
    assert.ok(layout.drift.y + state.y + 70 < bounds.bottom);
  }
  assert.deepEqual(driftState(0, true), driftState(30, true));
});
test("tree exclusion tests canopies instead of just trunk centers", () => {
  const box = treeFootprint({ x: 300, y: 100, s: 1 });
  assert.ok(intersects(box, { left: 250, right: 350, top: 30, bottom: 50 }));
});

test("the camper toasts, burns, blows out, eats and reloads in one loop", () => {
  const phases = new Set();
  for (let t = 0; t < CAMPER_LOOP; t += 0.05) {
    const state = camperState(t);
    phases.add(state.phase);
    assert.ok(state.bites >= 0 && state.bites <= 3);
    // The stick tip stays between the camper's seat and the fire ring.
    assert.ok(state.end[0] >= -80 && state.end[0] <= -20);
    assert.ok(state.end[1] >= -20 && state.end[1] <= 40);
  }
  for (const phase of ["reach", "toast", "burning", "blowing", "eating", "reload"])
    assert.ok(phases.has(phase), phase);
  assert.deepEqual(camperState(1, true), camperState(9, true));
  assert.deepEqual(camperState(2), camperState(2 + CAMPER_LOOP));
});

test("the fisherman's camp keeps its parts apart and inside the clearing", () => {
  const area = layout.stable,
    parts = campsiteGeometry(area);
  const boxes = [parts.tent, parts.fire, ...parts.logs, parts.dock];
  for (const box of [...boxes, parts.bucket]) {
    assert.ok(box.left >= 0 && box.right <= 960);
    assert.ok(box.top >= area.y && box.bottom <= area.y + 600);
  }
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++)
      assert.ok(!intersects(boxes[i], boxes[j]), `${i} ${j}`);
  // The dock reaches into the cove, the bucket sits on it, the fire on land.
  assert.ok(inCove(727, 520) && !inCove(727, 362));
  assert.ok(intersects(parts.bucket, parts.dock));
  assert.ok(!inCove(502, 360));
});

test("the fisherman waits, hooks a fish, drops it in the bucket and casts again", () => {
  const phases = new Set();
  let stowedAt = null;
  for (let t = 0; t < FISHING_LOOP; t += 0.05) {
    const state = fishermanState(t);
    phases.add(state.phase);
    if (state.phase === "wait" || state.phase === "bite")
      assert.ok(inCove(state.bobber.x, state.bobber.y), `float in the water at ${t}`);
    if (state.splash === "bucket") stowedAt ??= t;
  }
  for (const phase of ["wait", "bite", "reel", "stow", "bait", "windup", "cast"])
    assert.ok(phases.has(phase), phase);
  assert.ok(stowedAt !== null, "the fish lands in the bucket");
  // During the stow the fish ends right above the bucket.
  const late = fishermanState(10.3);
  assert.ok(late.fish && Math.abs(late.fish.x - 693) < 8 && Math.abs(late.fish.y - 502) < 10);
  assert.deepEqual(fishermanState(2, true), fishermanState(9, true));
  assert.deepEqual(fishermanState(4), fishermanState(4 + FISHING_LOOP));
});

test("ducks paddle on the cove and freeze under reduced motion", () => {
  for (let t = 0; t < 60; t += 0.25)
    for (const duck of campsiteState(t).ducks)
      for (const dx of [-10, 10]) assert.ok(inCove(duck.x + dx, duck.y + 4), `duck at ${t}`);
  assert.deepEqual(campsiteState(3, true), campsiteState(40, true));
});

test("headlights and fireflies are drawn after the light map and only when visible", () => {
  const draws = [];
  const painter = { time: 4, reduced: false, viewport: { top: 4700, bottom: 5100 } };
  painter.rect = (...args) => draws.push(args);
  glowJourney(painter, layout);
  assert.ok(draws.length > 20);
  draws.length = 0;
  painter.viewport = { top: 0, bottom: 400 };
  glowJourney(painter, layout);
  assert.equal(draws.length, 0);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  animateJourney,
  journeyGeometry,
  driftGeometry,
  driftState,
  farmGeometry,
  chickenState,
  pigState,
  pigPenGeometry,
  henGeometry,
  farmFenceGeometry,
  treeFootprint,
  intersects,
  camperState,
  CAMPER_LOOP,
  farmYard,
  HOMESTEAD_BAND,
  farmerState,
  dogState,
  crowState,
  homesteadGeometry,
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
test("reduced motion freezes lower scenery, farm animals and river", () => {
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
    ["campfire", "relics", "farm", "river", "drift"],
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
test("ten running chickens keep separate routes within the fenced pasture", () => {
  assert.equal(farmGeometry(layout.stable).cows.length, 6);
  for (let i = 0; i < 10; i++) {
    assert.notDeepEqual(chickenState(0, false, i), chickenState(2, false, i));
    assert.deepEqual(chickenState(0, true, i), chickenState(20, true, i));
  }
  for (let t = 0; t < 30; t += 0.2) {
    const chickens = Array.from({ length: 10 }, (_, i) =>
      chickenState(t, false, i),
    );
    chickens.forEach((state, i) => {
      assert.ok(state.x > 30 && state.x < 940);
      assert.ok(state.y > 190 && state.y < 470);
      chickens
        .slice(i + 1)
        .forEach((other) =>
          assert.ok(Math.hypot(state.x - other.x, state.y - other.y) > 30),
        );
    });
  }
});
test("wallowing pigs stay inside their mud pen and freeze under reduced motion", () => {
  for (let i = 0; i < 2; i++) {
    assert.deepEqual(pigState(0, true, i), pigState(30, true, i));
    assert.notDeepEqual(pigState(0, false, i), pigState(2, false, i));
    for (let t = 0; t < 30; t += 0.2) {
      const state = pigState(t, false, i);
      assert.ok(state.x - 45 > 590 && state.x + 45 < 940);
      assert.ok(state.y - 30 > 354 && state.y + 20 < 474);
      assert.ok(state.roll >= 0 && state.roll < 4);
    }
  }
});
test("tree exclusion tests canopies instead of just trunk centers", () => {
  const box = treeFootprint({ x: 300, y: 100, s: 1 });
  assert.ok(intersects(box, { left: 250, right: 350, top: 30, bottom: 50 }));
});

test("organic pasture surrounds the enlarged right pig pen and left hen shelter", () => {
  const pen = pigPenGeometry(layout.stable),
    hen = henGeometry(layout.stable);
  assert.ok(pen.right - pen.left >= 350 && pen.bottom - pen.top >= 120);
  assert.ok(pen.left > 480 && hen.right < 480);
  const { points } = farmFenceGeometry(layout.stable);
  assert.equal(points.length, 16);
  assert.ok(points.slice(0, 5).some((p) => p[1] !== points[0][1]));
  const inside = ([x, y]) => {
    let result = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [ax, ay] = points[i],
        [bx, by] = points[j];
      if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax)
        result = !result;
    }
    return result;
  };
  for (let time = 0; time < 30; time += 0.2)
    for (let i = 0; i < 10; i++) {
      const state = chickenState(time, false, i);
      for (const dx of [-16, 16])
        for (const dy of [-15, 15])
          assert.ok(inside([state.x + dx, layout.stable.y + state.y + dy]));
    }
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

test("the homestead band sits above the paddock fence without overlaps", () => {
  const yard = farmYard(layout.stable);
  assert.equal(yard.y, layout.stable.y + HOMESTEAD_BAND);
  const fenceTop = Math.min(...farmFenceGeometry(yard).points.map((p) => p[1]));
  const parts = Object.entries(homesteadGeometry(layout.stable)).filter(
    ([name]) => name !== "lane",
  );
  for (const [name, box] of parts) {
    assert.ok(box.top >= layout.stable.y, name);
    assert.ok(box.bottom < fenceTop - 18, name);
    assert.ok(box.left >= 0 && box.right <= 960, name);
  }
  for (let i = 0; i < parts.length; i++)
    for (let j = i + 1; j < parts.length; j++)
      assert.ok(!intersects(parts[i][1], parts[j][1]), `${parts[i][0]} ${parts[j][0]}`);
});

test("farmer, dog and crow keep to the lane and sky and freeze under reduced motion", () => {
  const actions = new Set();
  for (let t = 0; t < 40; t += 0.1) {
    const farmer = farmerState(t),
      dog = dogState(t),
      crow = crowState(t);
    actions.add(farmer.action);
    for (const actor of [farmer, dog]) {
      assert.ok(actor.x > 100 && actor.x < 500);
      assert.ok(actor.y > 150 && actor.y + 12 < HOMESTEAD_BAND - 8);
    }
    assert.ok(crow.y > 30 && crow.y < 100);
  }
  for (const action of ["walk", "crank", "carry", "water", "rest"])
    assert.ok(actions.has(action), action);
  assert.deepEqual(farmerState(3, true), farmerState(17, true));
  assert.deepEqual(dogState(3, true), dogState(17, true));
  assert.deepEqual(crowState(3, true), crowState(17, true));
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  EXIT_Y,
  INTERIOR_SPAWN,
  interiorIds,
  interiorNear,
  interiorWalkable,
} from "../dist/interiors.js";
import { destinations } from "../dist/world.js";

// Flood-fill the walkable floor from the doorway on a coarse grid.
function reachable(id) {
  const step = 6,
    seen = new Set(),
    queue = [[INTERIOR_SPAWN.x, INTERIOR_SPAWN.y]],
    spots = new Set();
  while (queue.length) {
    const [x, y] = queue.pop();
    const key = `${x},${y}`;
    if (seen.has(key) || !interiorWalkable(id, x, y)) continue;
    seen.add(key);
    const near = interiorNear(x, y);
    if (near) spots.add(near);
    if (y > EXIT_Y) spots.add("outside");
    for (const [dx, dy] of [
      [step, 0],
      [-step, 0],
      [0, step],
      [0, -step],
    ])
      queue.push([x + dx, y + dy]);
  }
  return spots;
}

test("every cabin has a furnished interior", () => {
  assert.deepEqual(
    [...interiorIds].sort(),
    destinations.map((d) => d.id).sort(),
  );
});

test("the lectern and the way out are reachable in every cabin", () => {
  for (const id of interiorIds) {
    assert.ok(interiorWalkable(id, INTERIOR_SPAWN.x, INTERIOR_SPAWN.y), id);
    assert.equal(interiorNear(INTERIOR_SPAWN.x, INTERIOR_SPAWN.y), null);
    const spots = reachable(id);
    assert.ok(spots.has("lectern"), `${id} lectern`);
    assert.ok(spots.has("exit"), `${id} exit prompt`);
    assert.ok(spots.has("outside"), `${id} doorway`);
  }
});

test("walls and furniture block movement", () => {
  for (const id of interiorIds) {
    assert.equal(interiorWalkable(id, 480, 200), false);
    assert.equal(interiorWalkable(id, 100, 400), false);
    assert.equal(interiorWalkable(id, 480, 346), false);
    assert.equal(interiorWalkable(id, 300, 500), false);
  }
});

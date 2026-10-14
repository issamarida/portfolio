import test from "node:test";
import assert from "node:assert/strict";
import { MOONLIGHT, intensity, lightField, tint } from "../dist/lighting.js";

const pixel = (field, x, y) => {
  const i = (Math.floor(y / 2) * field.width + Math.floor(x / 2)) * 4;
  return [...field.data.slice(i, i + 3)];
};
const near = (a, b, slack = 6) => a.every((v, i) => Math.abs(v - b[i]) <= slack);

test("unlit ground keeps the cool moonlight ambient and the sky stays as painted", () => {
  const field = lightField(200, 200, [], { clear: (y) => (y - 100) / 20 });
  assert.ok(near(pixel(field, 50, 180), MOONLIGHT));
  assert.deepEqual(pixel(field, 50, 40), [255, 255, 255]);
  assert.deepEqual(lightField(200, 200, []).data, lightField(200, 200, []).data);
});

test("sources light only their surroundings, warm for fire and full for glass", () => {
  const lights = [
    { kind: "point", x: 100, y: 100, r: 40, color: "#ff9a40" },
    { kind: "emit", x: 10, y: 10, w: 10, h: 10 },
  ];
  const field = lightField(200, 200, lights);
  const lit = pixel(field, 100, 100);
  // Warmer and brighter than moonlight at the source, untouched far away.
  assert.ok(lit[0] > MOONLIGHT[0] + 80 && lit[0] > lit[2]);
  assert.ok(near(pixel(field, 180, 180), MOONLIGHT));
  assert.deepEqual(pixel(field, 14, 14), [255, 255, 255]);
  assert.equal(intensity(lights[0], 141, 100), 0);
  assert.ok(tint("#ff9a40")[2] < 0, "firelight pushes back the blue");
});

test("a window spills a widening pool forward onto the ground", () => {
  const spill = { kind: "spill", x: 100, y: 50, w: 20, h: 20, reach: 40 };
  assert.ok(intensity(spill, 100, 60) > intensity(spill, 100, 85));
  assert.ok(intensity(spill, 118, 80) > 0, "the pool widens with distance");
  assert.equal(intensity(spill, 100, 95), 0);
});

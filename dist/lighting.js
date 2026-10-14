// Source-based pixel lighting. Cool moonlight is the ambient; each real
// source (window, lantern, fire, candle) adds its own colour with a soft
// falloff. The field is computed once per layout at the native two-unit
// pixel grid, ordered-dithered so transitions stay soft but crisp, and then
// multiplied over the painted scene: light reveals the warm painted colours
// instead of being sprayed on top as a translucent blob.

export const MOONLIGHT = [118, 130, 188];
export const ROOMLIGHT = [150, 128, 136];

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const STEP = 6;

function hex(color) {
  const n = parseInt(color.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// The colour a source adds on top of the ambient at full strength: it pulls
// lit surfaces toward a tint of the source, so firelight reads warm and
// neon reads pink, while blue moonlight is pushed back where they reach.
export function tint(color = "#ffb544", ambient = MOONLIGHT) {
  const rgb = hex(color);
  return ambient.map((a, i) => 255 * 0.42 + rgb[i] * 0.58 - a);
}

// Intensity of one source at a logical point, before tinting.
export function intensity(light, x, y) {
  const dx = x - light.x,
    dy = y - light.y;
  if (light.kind === "spill") {
    // A window: a little light on its own wall, and a pool thrown forward
    // onto the ground that widens as it travels.
    const wall = Math.hypot(dx / (light.w * 0.9), dy / (light.h * 0.9));
    let value = wall < 1 ? (1 - wall) ** 2 * 0.7 : 0;
    if (dy > -2 && dy < light.reach) {
      const t = Math.max(0, dy) / light.reach,
        half = light.w / 2 + Math.max(0, dy) * 0.5,
        edge = Math.min(1, Math.max(0, (half - Math.abs(dx)) / 8));
      value = Math.max(value, (1 - t) ** 1.7 * edge * 0.85);
    }
    return value * (light.power ?? 1);
  }
  // Points sit on the ground plane, so their pools are wider than tall.
  const d = Math.hypot(dx, dy * (light.flatten ?? 1.35)) / light.r;
  return d < 1 ? (1 - d) ** 2 * (light.power ?? 1) : 0;
}

export function lightBounds(light) {
  if (light.kind === "emit") return [light.x, light.y, light.x + light.w, light.y + light.h];
  if (light.kind === "spill") {
    const spread = light.w / 2 + light.reach * 0.5 + 8;
    return [light.x - spread, light.y - light.h, light.x + spread, light.y + light.reach];
  }
  const ry = light.r / (light.flatten ?? 1.35);
  return [light.x - light.r, light.y - ry, light.x + light.r, light.y + ry];
}

// RGBA bytes for a logical area `width`×`height` (native size is half).
// `clear(y)` returns 0 where the painted scene is left untouched (the sky)
// and 1 where the ambient applies fully.
export function lightField(width, height, lights, { ambient = MOONLIGHT, clear = () => 1 } = {}) {
  const w = Math.ceil(width / 2),
    h = Math.ceil(height / 2);
  const light = new Float32Array(w * h * 3),
    emit = new Uint8Array(w * h);
  for (const source of lights) {
    const [l, t, r, b] = lightBounds(source);
    const x0 = Math.max(0, Math.floor(l / 2)),
      x1 = Math.min(w - 1, Math.ceil(r / 2)),
      y0 = Math.max(0, Math.floor(t / 2)),
      y1 = Math.min(h - 1, Math.ceil(b / 2));
    if (source.kind === "emit") {
      for (let py = y0; py < y1; py++) emit.fill(1, py * w + x0, py * w + x1);
      continue;
    }
    const add = source.tint || tint(source.color, ambient);
    for (let py = y0; py <= y1; py++)
      for (let px = x0; px <= x1; px++) {
        const value = intensity(source, px * 2 + 1, py * 2 + 1);
        if (value <= 0) continue;
        const i = (py * w + px) * 3;
        light[i] += add[0] * value;
        light[i + 1] += add[1] * value;
        light[i + 2] += add[2] * value;
      }
  }
  const out = new Uint8ClampedArray(w * h * 4);
  for (let py = 0; py < h; py++) {
    const amount = Math.max(0, Math.min(1, clear(py * 2 + 1)));
    for (let px = 0; px < w; px++) {
      const i = py * w + px,
        o = i * 4,
        threshold = (BAYER[(py & 3) * 4 + (px & 3)] / 16 - 0.5) * STEP;
      for (let c = 0; c < 3; c++) {
        let value = emit[i] ? 255 : Math.min(255, Math.max(0, ambient[c] + light[i * 3 + c]));
        value = 255 + (value - 255) * amount;
        // Full light stays exactly white so glass and sky are untouched.
        out[o + c] = value >= 254.5 ? 255 : Math.min(255, Math.max(0, Math.round((value + threshold) / STEP) * STEP));
      }
      out[o + 3] = 255;
    }
  }
  return { width: w, height: h, data: out };
}

// Paints a field into a canvas that can be multiplied over the scene.
export function lightCanvas(field) {
  const canvas = document.createElement("canvas");
  canvas.width = field.width;
  canvas.height = field.height;
  const ctx = canvas.getContext("2d"),
    image = ctx.createImageData(field.width, field.height);
  image.data.set(field.data);
  ctx.putImageData(image, 0, 0);
  return canvas;
}

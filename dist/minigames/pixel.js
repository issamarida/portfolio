// Shared pixel tools for the hidden minigames. Every game draws on a 480 ×
// 270 framebuffer (the village's native resolution), one unit per pixel,
// with smoothing off, so the games share the site's chunky pixel grid.
export const W = 480,
  H = 270;

export function seeded(seed) {
  let value = seed >>> 0;
  return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function surface(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

// Integer-snapped drawing helpers bound to one context.
export function painter(ctx) {
  const rect = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  // A filled pixel ellipse built from whole rows, never anti-aliased.
  const oval = (cx, cy, rx, ry, color) => {
    ctx.fillStyle = color;
    const top = Math.round(cy - ry),
      bottom = Math.round(cy + ry);
    for (let y = top; y < bottom; y++) {
      const dy = (y + 0.5 - cy) / ry,
        half = Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy)));
      if (half > 0) ctx.fillRect(Math.round(cx) - half, y, half * 2, 1);
    }
  };
  const line = (x0, y0, x1, y1, color, size = 1) => {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    ctx.fillStyle = color;
    for (let i = 0; i <= steps; i++)
      ctx.fillRect(
        Math.round(x0 + ((x1 - x0) * i) / steps),
        Math.round(y0 + ((y1 - y0) * i) / steps),
        size,
        size,
      );
  };
  // Soft light made of stepped rings, additive, still on the pixel grid.
  const glow = (cx, cy, radius, color, strength = 0.18) => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let r = radius, i = 0; r > 1; r -= Math.max(2, radius / 5), i++) {
      ctx.globalAlpha = strength * (0.5 + i * 0.12);
      oval(cx, cy, r, r * 0.8, color);
    }
    ctx.restore();
  };
  return { ctx, rect, oval, line, glow };
}

// A sprite from rows of palette keys; "." and " " stay transparent.
export function sprite(rows, palette) {
  const { canvas, ctx } = surface(rows[0].length, rows.length);
  rows.forEach((row, y) =>
    [...row].forEach((key, x) => {
      if (key === "." || key === " " || !palette[key]) return;
      ctx.fillStyle = palette[key];
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  return canvas;
}

// Pre-rotated copies of a sprite by nearest-neighbour sampling, so turning
// sprites keep hard pixel edges instead of the browser's blurry rotation.
export function rotations(source, count, from = 0, to = Math.PI * 2) {
  const sw = source.width,
    sh = source.height,
    size = Math.ceil(Math.hypot(sw, sh)) + 2,
    pixels = source.getContext("2d").getImageData(0, 0, sw, sh).data,
    frames = [];
  for (let i = 0; i < count; i++) {
    const angle = from + ((to - from) * i) / (to === Math.PI * 2 ? count : count - 1),
      cos = Math.cos(angle),
      sin = Math.sin(angle),
      { canvas, ctx } = surface(size, size),
      image = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const dx = x + 0.5 - size / 2,
          dy = y + 0.5 - size / 2,
          sx = Math.floor(cos * dx + sin * dy + sw / 2),
          sy = Math.floor(-sin * dx + cos * dy + sh / 2);
        if (sx < 0 || sy < 0 || sx >= sw || sy >= sh) continue;
        const from4 = (sy * sw + sx) * 4,
          to4 = (y * size + x) * 4;
        if (!pixels[from4 + 3]) continue;
        image.data.set(pixels.subarray(from4, from4 + 4), to4);
      }
    ctx.putImageData(image, 0, 0);
    frames.push(canvas);
  }
  return frames;
}

export const format = (n) => Math.round(n).toLocaleString("en-US");

export const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

// The night sky every outdoor game shares: stepped indigo bands, a few
// stars and a full moon with its craters, matching the village sky.
export function nightSky(p, bottom, seed = 11, moon = { x: 380, y: 46, r: 22 }) {
  const bands = ["#0d1636", "#101a3e", "#131f45", "#17244c", "#1b2a53", "#202f5a"];
  bands.forEach((color, i) =>
    p.rect(0, Math.floor((bottom * i) / bands.length), W, Math.ceil(bottom / bands.length) + 1, color),
  );
  const rand = seeded(seed);
  for (let i = 0; i < 70; i++) {
    const x = rand() * W,
      y = rand() * bottom * 0.8;
    p.rect(x, y, 1, 1, rand() < 0.3 ? "#fff3d6" : "#9fb0d8");
  }
  if (moon) {
    p.glow(moon.x, moon.y, moon.r * 2.2, "#f6cf5a", 0.07);
    p.oval(moon.x, moon.y, moon.r, moon.r, "#f3c46e");
    p.oval(moon.x - 6, moon.y - 6, 5, 4, "#dca052");
    p.oval(moon.x + 8, moon.y + 4, 6, 5, "#dca052");
    p.oval(moon.x - 2, moon.y + 10, 3, 3, "#dca052");
  }
}

// Layered mountain ridges and a pine treeline, as in the village horizon.
export function horizon(p, base, seed = 3) {
  const rand = seeded(seed);
  for (const [height, color, step] of [
    [56, "#2c3366", 46],
    [40, "#3a3f74", 34],
  ]) {
    let x = -20;
    while (x < W + 20) {
      const peak = height * (0.55 + rand() * 0.45),
        half = step * (0.7 + rand() * 0.6);
      for (let y = 0; y < peak; y++) {
        const w = (half * (peak - y)) / peak;
        p.rect(x - w, base - y, w * 2, 1, color);
      }
      if (peak > height * 0.8)
        for (let y = 0; y < 6; y++) {
          const w = (half * y) / peak;
          p.rect(x - w, base - peak + y, w * 2, 1, "#c9d3e8");
        }
      x += step * (0.8 + rand() * 0.5);
    }
  }
  for (let x = -4; x < W + 8; x += 5) {
    const h = 10 + rand() * 12;
    for (let y = 0; y < h; y++) {
      const w = Math.max(1, ((h - y) / h) * 4);
      p.rect(x - w, base + 4 - y, w * 2, 1, y % 4 === 3 ? "#16261f" : "#1b2e26");
    }
  }
  p.rect(0, base + 4, W, 3, "#16261f");
}

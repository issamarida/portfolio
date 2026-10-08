import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

// Bake the same world renderer into a static fallback for readers without JavaScript.
// Run with the local preview running. This is an authoring tool, not a deployment build.
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  await page.goto(process.env.ART_URL || "http://localhost:5173/?intro=0");
  await page.evaluate(() => document.fonts.ready);
  const data = await page.evaluate(async () => {
    const { World } = await import("./world.js");
    const root = document.querySelector("#journey-world"),
      box = root.getBoundingClientRect(),
      scale = box.width / 960;
    const sections = [...document.querySelectorAll(".reading-section")].map(
      (section) => {
        const rect = section.getBoundingClientRect();
        return {
          id: section.id,
          x: (rect.left - box.left) / scale,
          y: (rect.top - box.top) / scale,
          width: rect.width / scale,
          height: rect.height / scale,
        };
      },
    );
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 270;
    const painter = new World(canvas, () => {});
    const stableBox = document
      .querySelector(".stable-clearing")
      .getBoundingClientRect();
    const dividerBox = document
      .querySelector(".river-divider")
      .getBoundingClientRect();
    const driftBox = document
      .querySelector(".drift-clearing")
      .getBoundingClientRect();
    const invitationBox = document
      .querySelector(".reading-invitation")
      .getBoundingClientRect();
    const moonBox = document
      .querySelector(".moon-clearing")
      .getBoundingClientRect();
    painter.setLayout(
      {
        clearings: [],
        invitation: {
          x: 0,
          y: (invitationBox.top - box.top) / scale,
          width: 960,
          height: invitationBox.height / scale,
        },
        moonArea: {
          x: 0,
          y: (moonBox.top - box.top) / scale,
          width: 960,
          height: 90,
        },
        scale,
        drift: {
          x: (driftBox.left - box.left) / scale,
          y: (driftBox.top - box.top) / scale,
          width: driftBox.width / scale,
          height: driftBox.height / scale,
        },
        divider: {
          x: (dividerBox.left - box.left) / scale,
          y: (dividerBox.top - box.top) / scale,
          width: dividerBox.width / scale,
          height: dividerBox.height / scale,
        },
        stable: {
          x: (stableBox.left - box.left) / scale,
          y: (stableBox.top - box.top) / scale,
          width: stableBox.width / scale,
          height: stableBox.height / scale,
        },
        height: Math.ceil(box.height / scale / 2) * 2,
        sections,
        skyHeight:
          (document.querySelector(".game-frame").getBoundingClientRect().top -
            box.top) /
          scale,
      },
      true,
    );
    return painter.scene.toDataURL("image/png").split(",")[1];
  });
  await writeFile("dist/art/journey.png", Buffer.from(data, "base64"));
  console.log(
    "Generated continuous woodland fallback from the live world renderer.",
  );
} finally {
  await browser.close();
}

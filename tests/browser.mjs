import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(process.env.TEST_URL || "http://localhost:5173");
  // The medieval title screen blocks the page until started or skipped.
  assert.equal(await page.locator(".intro").isVisible(), true);
  assert.match(await page.locator(".intro-start").innerText(), /click to explore my portfolio/i);
  assert.equal(
    await page.locator(".intro-start").evaluate((el) => el === document.activeElement),
    true,
  );
  assert.equal(await page.locator(".shell").evaluate((el) => el.inert), true);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".intro").count(), 0);
  assert.equal(await page.locator(".shell").evaluate((el) => el.inert), false);
  for (const id of ["projects", "career", "gamedev", "about"]) {
    const button = page.locator(`[data-area="${id}"]`);
    await button.click();
    assert.equal(await page.locator("#panel").evaluate((el) => el.open), true);
    assert.ok(await page.locator("#panel-title").textContent());
    await page.keyboard.press("Escape");
    assert.equal(
      await button.evaluate((el) => el === document.activeElement),
      true,
    );
  }
  assert.equal(await page.locator("h1").textContent(), "Issam Arida");
  assert.doesNotMatch(
    await page.locator(".reading-invitation").innerText(),
    /↓/,
  );
  assert.equal(await page.title(), "Issam Arida's Portfolio");
  assert.equal(await page.locator(".reading-section .inline-links").count(), 0);
  assert.equal(await page.locator("#projects .project-card").count(), 6);
  assert.doesNotMatch(await page.locator("#projects").innerText(), /LLTE/);
  assert.equal(
    await page.locator('#projects a[href$="structural_atlas"]').count(),
    1,
  );
  assert.doesNotMatch(
    await page.locator("#gamedev").innerText(),
    /Beyond the woodland|Structural Atlas/,
  );
  assert.ok(
    await page
      .locator(".house-label")
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily.includes("VT323")),
  );
  assert.ok(
    await page
      .locator("#interact")
      .evaluate((el) => getComputedStyle(el).fontFamily.includes("VT323")),
  );
  assert.ok(
    await page
      .locator(".social-links")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize) >= 20),
  );
  assert.equal(await page.locator(".email-icon").count(), 1);
  assert.doesNotMatch(
    await page.locator(".email-link").innerText(),
    /Contact:/,
  );
  assert.deepEqual(await page.locator(".social-emoji").allTextContents(), [
    "🐙",
    "💼",
  ]);
  // No controls bar above the moon; the key reminder only shows on focus.
  assert.equal(await page.locator(".keyboard-hint").count(), 0);
  assert.equal(await page.locator(".walk-hint").isVisible(), false);
  assert.equal(await page.locator("#panel-footer-note").count(), 0);
  assert.match(
    await page.locator("#return-world").innerText(),
    /Close section/,
  );
  assert.doesNotMatch(
    await page.locator("body").innerText(),
    /back to the woodlands|a page from the archive/i,
  );
  const scenery = await page.evaluate(async () => {
    const styles = [
      getComputedStyle(document.querySelector("#journey-world"))
        .backgroundImage,
    ];
    const sources = styles.join(",").matchAll(/url\("?([^"\)]+)"?\)/g);
    return Promise.all(
      [...sources].map(
        ([, src]) =>
          new Promise((resolve) => {
            const image = new Image();
            image.onload = () => resolve(image.naturalWidth > 0);
            image.onerror = () => resolve(false);
            image.src = src;
          }),
      ),
    );
  });
  assert.equal(scenery.length, 1);
  assert.ok(scenery.every(Boolean));
  assert.equal(
    await page
      .locator(".shell")
      .evaluate((el) => getComputedStyle(el).backgroundImage),
    "none",
  );
  assert.ok(await page.locator("#world").evaluate((el) => el.height < 1000));
  assert.deepEqual(await page.locator(".house-label").allTextContents(), [
    "Projects",
    "Career",
    "Game Dev",
    "About",
  ]);
  assert.ok(
    await page
      .locator(".identity img")
      .evaluate((el) => el.getBoundingClientRect().width >= 90),
  );
  assert.ok(
    await page
      .locator(".reading-invitation a")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize) >= 20),
  );
  assert.equal(
    await page.locator(".email-link").getAttribute("href"),
    "mailto:issamaarida@gmail.com",
  );
  assert.equal(
    await page
      .locator(".identity img")
      .evaluate((el) => el.complete && el.naturalWidth > 0),
    true,
  );
  assert.deepEqual(
    await page
      .locator(".reading-section> .section-heading h2")
      .allTextContents(),
    ["About", "Career", "Projects", "Game Dev"],
  );
  assert.equal(await page.locator(".destinations, .progress").count(), 0);
  for (const id of ["about", "projects", "career", "gamedev"]) {
    await page.locator(`[data-area="${id}"]`).click();
    assert.equal(
      await page.locator("#panel-content .section-body").innerText(),
      await page.locator(`#${id} .section-body`).innerText(),
    );
    await page.keyboard.press("Escape");
  }
  assert.equal(await page.locator("#about .volunteer-list article").count(), 2);
  assert.match(await page.locator("#about").innerText(), /Tzu Chi Foundation/);
  assert.match(
    await page.locator("#career").innerText(),
    /AI Engineer · Optimiza/,
  );
  assert.equal(await page.locator("#sound, #motion, .section-lead").count(), 0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#world").focus();
  await page.waitForTimeout(50);
  const before = await page.locator("#world").evaluate((el) => el.toDataURL());
  await page.keyboard.down("d");
  await page.waitForTimeout(180);
  await page.keyboard.up("d");
  const after = await page.locator("#world").evaluate((el) => el.toDataURL());
  assert.notEqual(
    after,
    before,
    "Keyboard movement changes the rendered player position",
  );
  await page.keyboard.down("d");
  await page.waitForTimeout(1000);
  await page.keyboard.up("d");
  await page.keyboard.down("w");
  await page.waitForTimeout(400);
  await page.keyboard.up("w");
  assert.equal(
    await page.locator("#interact span").textContent(),
    "Enter the career cabin",
  );
  // E steps inside the cabin; the lectern in the middle opens the section.
  await page.keyboard.press("e");
  await page.locator(".world-wrap.is-inside").waitFor();
  await page.keyboard.down("w");
  await page.waitForTimeout(500);
  await page.keyboard.up("w");
  assert.equal(
    await page.locator("#interact span").textContent(),
    "Open to read about Career",
  );
  await page.keyboard.press("e");
  assert.equal(await page.locator("#panel-title").textContent(), "Career");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".world-wrap.is-inside").count(), 0);
  assert.equal(
    await page.locator("#interact span").textContent(),
    "Enter the career cabin",
  );
  // Only the visible world band is animated; the offscreen village stays still.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator(".reading-invitation a").click();
  assert.equal(new URL(page.url()).hash, "#about");
  await page.locator("#career").scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(100);
  const offscreen = await page
    .locator("#world")
    .evaluate((el) => el.toDataURL());
  await page.keyboard.down("d");
  await page.waitForTimeout(250);
  await page.keyboard.up("d");
  assert.equal(
    await page.locator("#world").evaluate((el) => el.toDataURL()),
    offscreen,
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(100);
  const resumed = await page.locator("#world").evaluate((el) => el.toDataURL());
  await page.waitForTimeout(250);
  assert.notEqual(
    await page.locator("#world").evaluate((el) => el.toDataURL()),
    resumed,
  );
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: "/tmp/midnight-desktop.png", fullPage: false });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  assert.equal(await page.locator(".touch-pad").isVisible(), true);
  assert.ok(
    await page
      .locator(".identity img")
      .evaluate((el) => el.getBoundingClientRect().width >= 76),
  );
  assert.ok(
    await page
      .locator(".reading-invitation a")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize) >= 18),
  );
  const box = await page.locator(".world-wrap").boundingBox();
  assert.ok(Math.abs(box.width / box.height - 16 / 9) < 0.01);
  await page.locator('[data-area="projects"]').click();
  assert.equal(
    await page
      .locator("#panel")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
    true,
  );
  await page.locator("#close-panel").click();
  await page.screenshot({ path: "/tmp/midnight-mobile.png", fullPage: false });
  await page.setViewportSize({ width: 320, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.locator(".email-link").scrollIntoViewIfNeeded();
  assert.equal(
    await page
      .locator(".email-link")
      .evaluate((el) => el.getBoundingClientRect().right <= innerWidth),
    true,
  );
  const reduced = await browser.newPage({ reducedMotion: "reduce" });
  await reduced.goto(process.env.TEST_URL || "http://localhost:5173");
  await reduced.keyboard.press("Escape");
  await reduced.evaluate(() => document.fonts.ready);
  await reduced.waitForTimeout(100);
  const still = await reduced
    .locator("#world")
    .evaluate((el) => el.toDataURL());
  await reduced.waitForTimeout(250);
  assert.equal(
    await reduced.locator("#world").evaluate((el) => el.toDataURL()),
    still,
  );
  await reduced.close();
  const plain = await browser.newPage({ javaScriptEnabled: false });
  await plain.goto(process.env.TEST_URL || "http://localhost:5173");
  assert.equal(await plain.locator(".intro").count(), 0);
  assert.equal(await plain.locator(".reading-section").count(), 4);
  assert.equal(await plain.locator(".building-access").isVisible(), false);
  assert.equal(await plain.locator(".social-links").isVisible(), true);
  assert.ok(await plain.locator(".reading-invitation a strong").count());
  await plain.locator(".reading-invitation a").click();
  assert.equal(new URL(plain.url()).hash, "#about");
  assert.equal(await plain.locator("#projects .project-card").count(), 6);
  assert.equal(
    await plain.locator("#about .volunteer-list article").count(),
    2,
  );
  await plain.close();
  const walking = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  walking.on("pageerror", (error) => errors.push(error.message));
  await walking.goto(process.env.TEST_URL || "http://localhost:5173");
  await walking.keyboard.press("Escape");
  await walking.locator("#world").focus();
  await walking.evaluate(() => scrollTo(0, 0));
  await walking.keyboard.down("s");
  await walking.waitForTimeout(1800);
  await walking.keyboard.up("s");
  assert.equal(
    await walking
      .locator("#journey-world")
      .evaluate((el) => el.classList.contains("is-exploring")),
    false,
  );
  assert.equal(await walking.evaluate(() => scrollY), 0);
  assert.equal(
    await walking
      .locator(".game-bottom")
      .evaluate((el) => getComputedStyle(el).position),
    "static",
  );
  await walking.locator("#about").scrollIntoViewIfNeeded();
  await walking.locator("#world").dispatchEvent("click", {
    pointerType: "touch",
    clientX: 40,
    clientY: 400,
  });
  assert.equal(
    await walking.locator("#panel").evaluate((el) => el.open),
    false,
  );
  await walking.close();
  // The full opening: start, Issam steps out of the About cabin and greets.
  const intro = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
  });
  intro.on("pageerror", (error) => errors.push(error.message));
  await intro.goto(process.env.TEST_URL || "http://localhost:5173");
  await intro.keyboard.press("Enter");
  await intro.locator(".intro-dialog").waitFor({ state: "visible" });
  await intro.locator(".intro-controls").waitFor({ state: "visible" });
  assert.match(
    await intro.locator(".intro-line").innerText(),
    /Hey, I’m Issam! Welcome to my little corner of the internet\. Walk into any cabin/,
  );
  await intro.locator(".intro-continue").click();
  await intro.locator(".intro").waitFor({ state: "detached" });
  assert.equal(
    await intro.evaluate(() => document.activeElement.id),
    "world",
  );
  await intro.locator("#interact").waitFor({ state: "visible" });
  assert.equal(
    await intro.locator("#interact span").textContent(),
    "Enter the about cabin",
  );
  await intro.close();
  const linked = await browser.newPage();
  await linked.goto(`${process.env.TEST_URL || "http://localhost:5173"}#career`);
  assert.equal(await linked.locator(".intro").count(), 0);
  await linked.close();
  assert.deepEqual(errors, []);
  console.log(
    "Browser verification passed: title screen and opening cutscene, 4 destinations, focus return, Escape, shared static reading content and portrait, bounded cabin movement and viewport rendering, reduced motion, mobile layout, and no runtime errors.",
  );
} finally {
  await browser.close();
}

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
  // Escape skips, as soon as the hero behind the title is ready.
  await page.keyboard.press("Escape");
  await page.locator(".intro").waitFor({ state: "detached" });
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
  // The live canvas paints the scenery; the baked image is never fetched.
  assert.equal(
    await page.locator("#journey-world").evaluate((el) => getComputedStyle(el).backgroundImage),
    "none",
  );
  assert.equal(
    await page.evaluate(() =>
      performance.getEntriesByType("resource").some((entry) => entry.name.endsWith("/art/journey.png")),
    ),
    false,
  );
  // Key phrases are lit from the start rather than swept in on scroll, the
  // portrait has no ring, and the reading sign is a cabin billboard.
  assert.deepEqual(
    await page
      .locator("#career mark.kw")
      .first()
      .evaluate((el) => [getComputedStyle(el).backgroundSize, getComputedStyle(el).animationName]),
    ["100% 100%", "none"],
  );
  // The portrait sits in a dark carved recess on its board: no blue ring.
  assert.doesNotMatch(
    await page.locator(".identity img").evaluate((el) => getComputedStyle(el).boxShadow),
    /61, 104, 176|42, 76, 138/,
  );
  // The reading sign is fixed pixel art painted like the cabin billboards,
  // with its words kept in the link.
  assert.match(
    await page.locator(".reading-invitation a").evaluate((el) => getComputedStyle(el).backgroundImage),
    /reading-sign\.svg/,
  );
  assert.equal(await page.locator(".reading-invitation canvas").count(), 0);
  assert.match(await page.locator(".reading-invitation a").innerText(), /Prefer reading instead of playing\?/i);
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
  // The name board hangs smaller than it once did: the portrait stays
  // recognisable without the board dominating the sky.
  {
    const portrait = await page
      .locator(".identity img")
      .evaluate((el) => el.getBoundingClientRect().width);
    assert.ok(portrait >= 56 && portrait <= 72, `desktop portrait is ${portrait}px`);
  }
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
  {
    const portrait = await page
      .locator(".identity img")
      .evaluate((el) => el.getBoundingClientRect().width);
    assert.ok(portrait >= 44 && portrait <= 56, `phone portrait is ${portrait}px`);
  }
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
  const plain = await browser.newPage({ javaScriptEnabled: false }),
    fetched = [];
  plain.on("response", (response) => fetched.push([new URL(response.url()).pathname, response.status()]));
  await plain.goto(process.env.TEST_URL || "http://localhost:5173");
  await plain.waitForLoadState("networkidle");
  // Without scripts the baked woodland scene stands in for the canvas.
  assert.ok(fetched.some(([path, status]) => path.endsWith("/art/journey.png") && status === 200));
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
  // The title and greeting are painted wooden planks, and the temple
  // margins are already standing behind the title screen.
  assert.equal(await intro.locator(".intro-paper, .intro-roller").count(), 0);
  assert.match(
    await intro.locator(".intro-start .intro-plank").evaluate((el) => el.style.getPropertyValue("--plank")),
    /^url\(data:image\/png/,
  );
  assert.equal(await intro.locator(".temple").isVisible(), true);
  await intro.keyboard.press("Enter");
  await intro.locator(".intro-dialog").waitFor({ state: "visible" });
  await intro.locator(".intro-controls").waitFor({ state: "visible" });
  assert.equal(await intro.locator(".intro-dialog img").evaluate((el) => getComputedStyle(el).boxShadow), "none");
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
  // The prompt stands just under the player at the About door.
  {
    const { prompt, door, frame } = await intro.evaluate(async () => {
      const { destinations } = await import("./world.js");
      const about = destinations.find((d) => d.id === "about"),
        frame = document.querySelector(".world-wrap").getBoundingClientRect();
      return {
        prompt: document.querySelector("#interact").getBoundingClientRect().toJSON(),
        frame: frame.toJSON(),
        door: {
          x: frame.left + (about.doorX * frame.width) / 960,
          y: frame.top + ((about.y + about.h) * frame.height) / 540,
        },
      };
    });
    assert.ok(Math.abs((prompt.left + prompt.right) / 2 - door.x) < 40, "prompt is centred on the player");
    assert.ok(prompt.top > door.y && prompt.bottom <= frame.bottom, "prompt sits below the player");
  }
  // Inside a cabin the village's reading sign is not shown.
  await intro.keyboard.press("e");
  await intro.locator(".world-wrap.is-inside").waitFor();
  assert.equal(await intro.locator(".reading-invitation a").isVisible(), false);
  await intro.keyboard.press("Escape");
  await intro.locator(".world-wrap.is-inside").waitFor({ state: "detached" });
  assert.equal(await intro.locator(".reading-invitation a").isVisible(), true);
  await intro.close();
  // Reading a lectern book scrolls the book alone: the page underneath is
  // locked while it is open and free again once it closes.
  const extras = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
  });
  extras.on("pageerror", (error) => errors.push(error.message));
  await extras.goto(`${process.env.TEST_URL || "http://localhost:5173"}/?intro=0`);
  const locked = () =>
    extras.evaluate(() => document.documentElement.classList.contains("is-page-locked"));
  await extras.locator('[data-area="career"]').click();
  assert.equal(await locked(), true);
  await extras.mouse.move(640, 420);
  await extras.mouse.wheel(0, 3000);
  await extras.waitForTimeout(400);
  assert.equal(await extras.evaluate(() => scrollY), 0, "the page holds still behind the book");
  assert.ok(await extras.locator("#panel").evaluate((el) => el.scrollTop > 0), "the book scrolls");
  await extras.keyboard.press("Escape");
  await extras.waitForFunction(() => !document.documentElement.classList.contains("is-page-locked"));
  await extras.mouse.wheel(0, 400);
  await extras.waitForTimeout(300);
  assert.ok(await extras.evaluate(() => scrollY > 0), "the page scrolls again once the book closes");
  // Hidden extras run in their own stage: the portfolio is paused, hidden,
  // locked and out of reach, and exiting returns to the hero section.
  const inStage = () =>
    extras.evaluate(() => ({
      shellInert: document.querySelector(".shell").inert,
      locked: document.documentElement.classList.contains("is-page-locked"),
      hidden: getComputedStyle(document.querySelector(".shell")).visibility === "hidden",
      focus: document.activeElement.className,
    }));
  const backHome = async () => {
    await extras.locator(".minigame").waitFor({ state: "detached" });
    await extras.locator(".minigame-iris").waitFor({ state: "detached" });
    const home = await extras.evaluate(() => ({
      scrollY,
      focus: document.activeElement.id,
      inert: document.querySelector(".shell").inert,
      locked: document.documentElement.classList.contains("is-page-locked"),
    }));
    assert.deepEqual(home, { scrollY: 0, focus: "world", inert: false, locked: false });
  };
  await extras.locator(".drift-clearing").scrollIntoViewIfNeeded();
  await extras.locator(".egg-car").click({ force: true });
  await extras.locator('.minigame[data-game="drift"]').waitFor();
  assert.deepEqual(await inStage(), {
    shellInert: true,
    locked: true,
    hidden: true,
    focus: "minigame-screen",
  });
  const lockedAt = await extras.evaluate(() => scrollY);
  await extras.keyboard.down("w");
  await extras.keyboard.down("d");
  await extras.waitForTimeout(1400);
  await extras.keyboard.up("d");
  await extras.keyboard.up("w");
  assert.equal(await extras.evaluate(() => scrollY), lockedAt, "driving never scrolls the page");
  // Every stage shows the score alone above the game and one control
  // scheme below it.
  assert.match(await extras.locator(".minigame-score").textContent(), /^[\d,]+$/);
  assert.equal(await extras.locator(".minigame-hint").textContent(), "A / D to steer");
  await extras.keyboard.press("Escape");
  await backHome();
  // The fisherman lends his rod straight away: no popup in between.
  await extras.locator(".stable-clearing").scrollIntoViewIfNeeded();
  await extras.locator(".egg-angler").click({ force: true });
  assert.equal(await extras.locator(".egg-offer").count(), 0);
  await extras.locator('.minigame[data-game="fishing"]').waitFor();
  assert.equal(await extras.locator(".minigame-hint").textContent(), "SPACE to reel");
  // Score plank, game box and hint stack as one centred unit.
  {
    const unit = await extras.evaluate(() => {
      const box = (s) => document.querySelector(s).getBoundingClientRect(),
        score = box(".minigame-score"),
        frame = box(".minigame-frame"),
        hint = box(".minigame-hint"),
        mid = (r) => r.left + r.width / 2;
      return {
        stacked: score.bottom <= frame.top && frame.top - score.bottom < 40 && hint.top >= frame.bottom && hint.top - frame.bottom < 40,
        centred: Math.abs(mid(score) - mid(frame)) < 2 && Math.abs(mid(hint) - mid(frame)) < 2,
        wood: getComputedStyle(document.querySelector(".minigame-score")).borderImageSource.includes("hanging-board"),
      };
    });
    assert.deepEqual(unit, { stacked: true, centred: true, wood: true });
  }
  await extras.keyboard.down(" ");
  await extras.waitForTimeout(400);
  await extras.keyboard.up(" ");
  assert.equal(await extras.locator(".minigame-banner").isVisible(), false);
  assert.equal(await extras.locator(".minigame-score").textContent(), "0");
  assert.equal(await extras.locator(".minigame-hint").textContent(), "SPACE to reel");
  await extras.locator(".minigame-exit").click();
  await backHome();
  // The camper and the sword memorial by the reading sign open their games.
  for (const [spot, game, hint] of [
    [".egg-camper", "toast", "SPACE to pull"],
    [".egg-memorial", "slice", "DRAG to slice"],
  ]) {
    await extras.locator(spot).scrollIntoViewIfNeeded();
    await extras.locator(spot).click({ force: true });
    await extras.locator(`.minigame[data-game="${game}"]`).waitFor();
    assert.equal(await extras.locator(".minigame-hint").textContent(), hint);
    await extras.keyboard.press(" ");
    await extras.waitForTimeout(300);
    await extras.keyboard.press("Escape");
    await backHome();
  }
  // Both cabinets in the Game Dev cabin: walk up to the left one and press
  // E, then step across and click the right one.
  const held = async (key, ms) => {
    await extras.keyboard.down(key);
    await extras.waitForTimeout(ms);
    await extras.keyboard.up(key);
  };
  const promptText = () =>
    extras.evaluate(() =>
      document.querySelector("#interact").hidden ? null : document.querySelector("#interact span").textContent,
    );
  await held("s", 250);
  await held("a", 1300);
  await held("s", 300);
  await held("a", 400);
  assert.equal(await promptText(), "Enter the game development cabin");
  await extras.keyboard.press("e");
  await extras.locator('.world-wrap.is-inside[data-room="gamedev"]').waitFor();
  await held("w", 480);
  await held("a", 1700);
  await held("w", 700);
  assert.equal(await promptText(), "Play Maze Munch");
  assert.equal(await extras.locator('.egg-arcade[data-game="maze"]').evaluate((el) => el.classList.contains("is-near")), true);
  await extras.keyboard.press("e");
  await extras.locator('.minigame[data-game="maze"]').waitFor();
  assert.equal(await extras.locator(".minigame-hint").textContent(), "WASD to move");
  await extras.keyboard.press("Escape");
  await backHome();
  assert.equal(await extras.locator(".world-wrap").evaluate((el) => el.dataset.room), "gamedev", "still in the cabin");
  await held("d", 380);
  assert.equal(await promptText(), "Play Night Owl");
  await extras.locator('.egg-arcade[data-game="flap"]').click();
  await extras.locator('.minigame[data-game="flap"]').waitFor();
  assert.equal(await extras.locator(".minigame-hint").textContent(), "SPACE to flap");
  // Feedback only appears when something happens, never at rest.
  assert.equal(await extras.locator(".minigame-float").count(), 0);
  await extras.locator(".minigame-exit").click();
  await backHome();
  await extras.close();
  const linked = await browser.newPage();
  await linked.goto(`${process.env.TEST_URL || "http://localhost:5173"}#career`);
  assert.equal(await linked.locator(".intro").count(), 0);
  await linked.close();
  assert.deepEqual(errors, []);
  console.log(
    "Browser verification passed: title screen and opening cutscene, 4 destinations, focus return, Escape, locked page behind the reading book, isolated minigame stages for both arcade cabinets, the fisherman and the pickup, shared static reading content and portrait, bounded cabin movement and viewport rendering, reduced motion, mobile layout, and no runtime errors.",
  );
} finally {
  await browser.close();
}

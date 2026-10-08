// The homestead above the paddock: the farmhouse, garden, well, windmill and
// washing line, with the small daily chores that keep the stable alive.
// Coordinates are logical world units; `top` is the stable clearing's top edge.

export const HOMESTEAD_BAND = 200;
export const LANE_Y = 166;
export const FARMER_LOOP = 18;
export const HOMESTEAD_SPOTS = {
  door: 150,
  well: 452,
  garden: 340,
  scarecrow: 392,
  windmill: [660, 66],
};

const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
const loop = (time, period) => ((time % period) + period) % period;

// The farmer fetches water, waters the pumpkins, then rests by the door.
export function farmerState(time, reduced = false) {
  const s = reduced ? 11 : loop(time, FARMER_LOOP);
  const { door, well, garden } = HOMESTEAD_SPOTS;
  let x = door,
    face = 1,
    moving = false,
    action = "rest",
    full = false;
  if (s < 4.5) {
    x = lerp(door, well, s / 4.5);
    moving = true;
    action = "walk";
  } else if (s < 8) {
    x = well;
    action = "crank";
  } else if (s < 10) {
    x = lerp(well, garden, (s - 8) / 2);
    face = -1;
    moving = true;
    action = "carry";
    full = true;
  } else if (s < 13) {
    x = garden;
    face = -1;
    action = "water";
    full = true;
  } else if (s < 16) {
    x = lerp(garden, door, (s - 13) / 3);
    face = -1;
    moving = true;
    action = "walk";
  }
  return { s, x, y: LANE_Y, face, moving, action, full };
}

// The dog trails the farmer, chases its own tail at the well and naps at home.
export function dogState(time, reduced = false) {
  const now = farmerState(time, reduced),
    lag = farmerState(time - 0.7, reduced);
  if (now.action === "crank")
    return {
      x: now.x - 34 + (reduced ? 0 : Math.round(Math.sin(time * 6)) * 4),
      y: LANE_Y + 10,
      face: reduced || Math.floor(time * 5) % 2 ? 1 : -1,
      moving: !reduced,
      action: "spin",
    };
  if (now.action === "rest" && lag.action === "rest")
    return { x: now.x + 34, y: LANE_Y + 10, face: -1, moving: false, action: "nap" };
  return {
    x: lag.x - lag.face * 28,
    y: LANE_Y + 10,
    face: lag.face,
    moving: lag.moving,
    action: lag.moving ? "trot" : "sit",
  };
}

// A crow perches on the scarecrow's arm, loops over the garden and returns.
export function crowState(time, reduced = false) {
  const s = reduced ? 1 : loop(time, 10);
  const perch = [HOMESTEAD_SPOTS.scarecrow + 22, 92];
  if (s < 5) return { x: perch[0], y: perch[1], flying: false, face: 1, peck: !reduced && s % 1.6 < 0.25 };
  const angle = ((s - 5) / 5) * Math.PI * 2;
  return {
    x: perch[0] - 50 + Math.cos(angle) * 50,
    y: perch[1] - Math.sin(angle / 2) * 46,
    flying: true,
    face: Math.sin(angle) > 0 ? -1 : 1,
    peck: false,
  };
}

export function homesteadGeometry(stable) {
  const top = stable.y;
  return {
    house: { left: 46, right: 252, top: top + 28, bottom: top + 164 },
    garden: { left: 252, right: 430, top: top + 112, bottom: top + 158 },
    well: { left: 462, right: 518, top: top + 62, bottom: top + 160 },
    windmill: { left: 594, right: 726, top: top + 2, bottom: top + 170 },
    line: { left: 768, right: 940, top: top + 80, bottom: top + 172 },
    lane: { left: 120, right: 480, y: top + LANE_Y },
  };
}

function cottage(p, top) {
  const Y = (v) => top + v;
  // Fieldstone footing, timber walls and a slate roof with a stone chimney.
  p.rect(186, Y(26), 18, 46, "#6f7064");
  p.rect(184, Y(22), 22, 6, "#8f907f");
  for (const [dx, dy] of [[188, 34], [196, 44], [189, 56]])
    p.rect(dx, Y(dy), 7, 3, "#5a5b51");
  p.rect(58, Y(86), 162, 68, "#7c5e3f");
  for (let yy = 92; yy < 150; yy += 8) {
    p.rect(60, Y(yy), 158, 2, "#5f4630");
    p.rect(62, Y(yy + 2), 154, 2, "#8d6c49");
  }
  for (const xx of [58, 214]) p.rect(xx, Y(86), 6, 68, "#4f3a27");
  p.path(
    [
      [44, Y(94)],
      [139, Y(30)],
      [234, Y(94)],
    ],
    "#3a4651",
  );
  for (let row = 0; row < 8; row++) {
    const yy = 40 + row * 7,
      half = (yy - 30) * 1.48;
    p.rect(139 - half, Y(yy), half * 2, 2, "#2c3640");
    for (let xx = 139 - half + 4; xx < 139 + half - 4; xx += 14)
      p.rect(xx + (row % 2 ? 6 : 0), Y(yy + 2), 2, 4, "#2c3640");
    if (row % 2) p.rect(139 - half + 6, Y(yy + 3), half * 2 - 12, 2, "#4d5a66");
  }
  p.rect(42, Y(92), 196, 5, "#9c7f55");
  // Stone footing.
  p.rect(54, Y(152), 170, 12, "#66665a");
  for (let xx = 56; xx < 220; xx += 15) p.rect(xx + ((xx / 15) % 2) * 5, Y(155), 9, 3, "#85857a");
  // A lit doorway with porch steps and a wreath of dried flowers.
  p.rect(124, Y(108), 30, 46, "#33281e");
  p.rect(128, Y(112), 22, 42, "#98683b");
  for (const xx of [131, 137, 143]) p.rect(xx, Y(114), 2, 38, "#7a5230");
  p.rect(133, Y(116), 12, 8, "#efc56c");
  p.rect(146, Y(133), 3, 3, "#e6c27e");
  p.rect(120, Y(154), 38, 5, "#a58e66");
  p.rect(116, Y(159), 46, 5, "#7f6c4e");
  for (const [dx, dy, c] of [[-4, 0, "#c76f5a"], [4, -2, "#d9b25e"], [0, 4, "#8fae7a"]])
    p.rect(139 + dx - 2, Y(100 + dy), 4, 4, c);
  // Two warm windows with shutters and flower boxes.
  for (const wx of [76, 172]) {
    p.rect(wx - 3, Y(102), 32, 28, "#3a3328");
    p.rect(wx, Y(105), 26, 22, "#e1ad55");
    p.rect(wx + 3, Y(108), 20, 16, "#f3d283");
    p.rect(wx + 12, Y(105), 2, 22, "#7a5a3a");
    p.rect(wx, Y(115), 26, 2, "#7a5a3a");
    p.rect(wx - 9, Y(102), 6, 28, "#4c6b5b");
    p.rect(wx + 29, Y(102), 6, 28, "#4c6b5b");
    p.rect(wx - 4, Y(130), 34, 6, "#7b5737");
    for (let i = 0; i < 6; i++)
      p.rect(wx - 2 + i * 6, Y(126 + (i % 2) * 2), 4, 4, ["#d16d6d", "#e5c46b", "#c98ad0"][i % 3]);
    p.glow(wx + 13, Y(116), 46);
  }
  // Split firewood stacked against the gable, and a chopping block with axe.
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3 - (r === 2 ? 1 : 0); c++) {
      const lx = 230 + c * 9 + (r % 2) * 4,
        ly = Y(156 - r * 8);
      p.ellipse(lx, ly, 9, 8, "#a47c4e");
      p.ellipse(lx, ly, 4, 4, "#6c4f33");
    }
  p.rect(32, Y(150), 16, 12, "#6e5236");
  p.ellipse(40, Y(150), 16, 5, "#b18c5c");
  p.rect(40, Y(136), 2, 14, "#8c6a43");
  p.rect(36, Y(136), 6, 5, "#a7aca3");
  p.lantern(166, Y(150));
}

function garden(p, top) {
  const Y = (v) => top + v;
  // A low wattle fence around raised beds of cabbages, carrots and pumpkins.
  p.rect(252, Y(116), 178, 44, "#3f3126");
  for (let r = 0; r < 4; r++) p.rect(256, Y(120 + r * 10), 170, 4, "#5a4532");
  for (let x = 252; x <= 430; x += 12) p.rect(x, Y(106), 3, 14, "#8b7350");
  p.rect(252, Y(108), 180, 3, "#a68b5f");
  p.rect(252, Y(114), 180, 2, "#7a6345");
  for (let i = 0; i < 13; i++) {
    const x = 262 + i * 12,
      row = i % 4,
      y = Y(122 + row * 10);
    if (x > 372 && x < 410) continue;
    if (i % 3 === 0) {
      p.ellipse(x, y, 13, 9, "#c4742f");
      p.rect(x - 4, y - 2, 2, 5, "#a35d27");
      p.rect(x + 2, y - 2, 2, 5, "#a35d27");
      p.rect(x - 1, y - 7, 3, 4, "#5b6e33");
    } else if (i % 3 === 1) {
      p.ellipse(x, y, 12, 9, "#6f9a5b");
      p.ellipse(x, y - 1, 6, 5, "#a3c48a");
    } else {
      for (const dx of [-3, 0, 3]) p.rect(x + dx, y - 6, 2, 7, "#7fa65a");
      p.rect(x - 1, y + 1, 3, 3, "#d9813b");
    }
  }
  // Scarecrow in a patched coat and a wide straw hat.
  const x = 392;
  p.rect(x - 2, Y(76), 4, 84, "#7a5e3c");
  p.rect(x - 30, Y(94), 60, 4, "#7a5e3c");
  p.rect(x - 14, Y(92), 28, 30, "#59704f");
  p.rect(x - 4, Y(100), 8, 8, "#b8594a");
  p.rect(x - 14, Y(118), 28, 4, "#3f4f3a");
  for (const side of [-1, 1]) {
    p.rect(x + side * 22 - 6, Y(91), 12, 9, "#59704f");
    p.rect(x + side * 30 - 2, Y(92), 5, 7, "#d9bd6b");
  }
  for (const dx of [-10, -4, 4, 10]) p.rect(x + dx, Y(121), 2, 6, "#d9bd6b");
  p.rect(x - 8, Y(72), 16, 18, "#c9b088");
  p.rect(x - 4, Y(78), 3, 3, "#3d3127");
  p.rect(x + 2, Y(78), 3, 3, "#3d3127");
  p.rect(x - 4, Y(84), 8, 2, "#7a5a3c");
  p.rect(x - 18, Y(70), 36, 4, "#d6b462");
  p.rect(x - 9, Y(62), 18, 9, "#c7a352");
  p.rect(x - 9, Y(68), 18, 2, "#8d4436");
}

function well(p, top) {
  const Y = (v) => top + v;
  p.ellipse(490, Y(160), 70, 14, "#2c3a2a");
  p.rect(468, Y(124), 44, 36, "#757767");
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      p.rect(470 + c * 11 + (r % 2) * 5, Y(127 + r * 8), 8, 2, "#999b88");
  p.ellipse(490, Y(124), 48, 14, "#9a9c88");
  p.ellipse(490, Y(124), 36, 8, "#1d2b2b");
  p.ellipse(490, Y(126), 22, 4, "#3e6466");
  for (const x of [470, 506]) p.rect(x, Y(78), 5, 48, "#6d5034");
  p.path(
    [
      [458, Y(84)],
      [490, Y(58)],
      [522, Y(84)],
    ],
    "#5b3e2e",
  );
  for (let row = 0; row < 3; row++) {
    const half = 8 + row * 9;
    p.rect(490 - half, Y(66 + row * 7), half * 2, 2, "#3f2a20");
  }
  p.rect(466, Y(95), 48, 4, "#8d6b45");
  p.rect(489, Y(98), 2, 22, "#c9b27f");
}

function windmillBody(p, top) {
  const Y = (v) => top + v;
  p.ellipse(660, Y(170), 104, 14, "#2c3a2a");
  p.path(
    [
      [630, Y(170)],
      [690, Y(170)],
      [677, Y(72)],
      [643, Y(72)],
    ],
    "#8a7556",
  );
  for (let yy = 80; yy < 168; yy += 9) {
    const inset = (170 - yy) * 0.13;
    p.rect(630 + inset, Y(yy), 60 - inset * 2, 2, "#6b5a41");
  }
  p.path(
    [
      [638, Y(76)],
      [682, Y(76)],
      [674, Y(52)],
      [660, Y(44)],
      [646, Y(52)],
    ],
    "#5a3c31",
  );
  p.rect(636, Y(74), 48, 4, "#a3825a");
  p.rect(651, Y(140), 18, 30, "#33281e");
  p.rect(654, Y(143), 12, 27, "#7d5734");
  p.rect(655, Y(98), 10, 13, "#2f2a22");
  p.rect(657, Y(100), 6, 9, "#e8b55c");
  p.glow(660, Y(104), 30);
  // Grain sacks and crates wait by the mill door.
  for (const [x, y] of [[700, 158], [714, 162], [706, 150]]) {
    p.ellipse(x, Y(y), 14, 14, "#cdbb92");
    p.rect(x - 3, Y(y - 8), 6, 3, "#9d8a63");
  }
  p.rect(612, Y(150), 16, 16, "#8b6a42");
  p.rect(612, Y(150), 16, 3, "#b08a58");
  p.rect(619, Y(150), 2, 16, "#5e4529");
}

function clothesline(p, top) {
  const Y = (v) => top + v;
  for (const x of [770, 936]) {
    p.rect(x, Y(78), 5, 92, "#6d5034");
    p.rect(x - 7, Y(80), 19, 4, "#8d6b45");
  }
  for (let x = 774; x < 936; x += 4) p.rect(x, Y(83 + Math.sin(((x - 774) / 162) * Math.PI) * 7), 4, 2, "#cfc7b0");
  // Skep beehives on a plank bench beneath the line.
  p.rect(796, Y(162), 72, 5, "#7a5a3a");
  for (const x of [796, 818, 858, 866]) p.rect(x, Y(166), 3, 6, "#5d4329");
  for (const x of [812, 850]) {
    for (let r = 0; r < 4; r++)
      p.ellipse(x, Y(156 - r * 6), 26 - r * 5, 8, r % 2 ? "#b88f47" : "#cfa55b");
    p.rect(x - 3, Y(156), 6, 4, "#3a2a1c");
  }
}

export function paintHomestead(p, stable) {
  const top = stable.y;
  // A meadow yard and a worn lane join the cottage, garden, well and mill.
  p.path(
    [
      [0, top + 30],
      [140, top + 16],
      [330, top + 34],
      [520, top + 18],
      [720, top + 32],
      [960, top + 20],
      [960, top + 210],
      [0, top + 210],
    ],
    "#3e4c32",
  );
  p.ellipse(480, top + 150, 1000, 110, "#4a5a3b");
  for (let i = 0; i < 70; i++)
    p.rect((i * 137) % 940 + 10, top + 40 + ((i * 53) % 150), 6, 2, i % 3 ? "#5b6a44" : "#6d7650");
  p.path(
    [
      [36, top + LANE_Y - 6],
      [300, top + LANE_Y - 9],
      [560, top + LANE_Y - 5],
      [930, top + LANE_Y - 8],
      [930, top + LANE_Y + 10],
      [560, top + LANE_Y + 13],
      [300, top + LANE_Y + 9],
      [36, top + LANE_Y + 11],
    ],
    "#6b6246",
  );
  for (let i = 0; i < 28; i++) p.rect(50 + i * 31, top + LANE_Y - 3 + ((i * 7) % 11), 4, 2, "#857a58");
  for (const [x, y] of [[-6, 120], [966, 128], [560, 40]])
    p.tree({ x, y: top + y, s: 0.82, tone: 0.18 });
  cottage(p, top);
  garden(p, top);
  well(p, top);
  windmillBody(p, top);
  clothesline(p, top);
}

function farmer(p, state, time, reduced) {
  const x = Math.round(state.x / 2) * 2,
    y = state.y,
    f = state.face;
  const frame = state.moving && !reduced ? Math.floor(time * 8) % 4 : 0;
  const stride = [0, 3, 0, -3][frame],
    bob = frame % 2 ? 2 : 0;
  p.ellipse(x, y + 2, 26, 7, "#25291d");
  p.rect(x - 7 - stride * f, y - 12, 6, 12, "#3d5070");
  p.rect(x + 1 + stride * f, y - 12, 6, 12, "#4b6380");
  p.rect(x - 8 - stride * f + (f > 0 ? 1 : -1), y - 2, 8, 4, "#3a2a1e");
  p.rect(x + stride * f + (f > 0 ? 1 : -1), y - 2, 8, 4, "#3a2a1e");
  const b = y - bob;
  p.rect(x - 9, b - 30, 18, 19, "#d8cfb4");
  p.rect(x - 8, b - 24, 16, 14, "#4b6380");
  p.rect(x - 6, b - 30, 2, 7, "#4b6380");
  p.rect(x + 4, b - 30, 2, 7, "#4b6380");
  p.rect(x - 3, b - 21, 6, 4, "#3d5070");
  // Head with a grey beard and a straw hat.
  p.rect(x - 7, b - 44, 14, 14, "#d4a57c");
  p.rect(x - 7 + (f > 0 ? 4 : 0), b - 35, 10, 7, "#b9b2a2");
  p.rect(x + f * 3 - 1, b - 40, 2, 3, "#2b2621");
  p.rect(x + f * 7 - 1, b - 37, 3, 3, "#c98463");
  p.rect(x - 13, b - 46, 26, 3, "#c9a254");
  p.rect(x - 8, b - 53, 16, 8, "#d8b86a");
  p.rect(x - 8, b - 48, 16, 2, "#8d4436");
  // The arm and bucket depend on the chore.
  let hx = x + f * 9,
    hy = b - 14;
  if (state.action === "crank") {
    const turn = reduced ? 0 : time * 5;
    hx = x + 14 + Math.round(Math.cos(turn) * 3);
    hy = b - 26 + Math.round(Math.sin(turn) * 4);
  } else if (state.action === "water") {
    hx = x + f * 14;
    hy = b - 22;
  }
  p.path(
    [
      [x + f * 2, b - 28],
      [hx, hy - 2],
      [hx, hy + 2],
      [x + f * 2, b - 22],
    ],
    "#cbbf9f",
  );
  p.rect(hx - 2, hy - 2, 5, 5, "#d4a57c");
  const tilt = state.action === "water";
  const bx = state.action === "crank" ? x - f * 12 : hx + f * (tilt ? 6 : 0),
    by = state.action === "crank" ? b - 10 : hy + (tilt ? -2 : 2);
  p.rect(bx - 5, by, 11, tilt ? 8 : 11, "#8a8f86");
  p.rect(bx - 6, by, 13, 2, "#b6bab0");
  if (state.full && !tilt) p.rect(bx - 4, by + 1, 9, 2, "#5c8c94");
  if (tilt && !reduced)
    for (let i = 0; i < 4; i++) {
      const fall = (time * 40 + i * 6) % 22;
      p.rect(bx + f * (6 + (i % 2) * 2), by + 4 + fall, 2, 3, "#86b6bd");
    }
}

function dog(p, state, time, reduced) {
  const x = Math.round(state.x / 2) * 2,
    y = state.y,
    f = state.face;
  const run = state.moving && !reduced ? Math.floor(time * 10) % 2 : 0;
  const wag = reduced ? 0 : Math.round(Math.sin(time * 14)) * 2;
  p.ellipse(x, y + 2, 26, 6, "#25291d");
  if (state.action === "nap") {
    p.ellipse(x, y - 4, 26, 12, "#8b5d38");
    p.ellipse(x + f * 10, y - 6, 12, 10, "#a3714a");
    p.rect(x + f * 10 - 4, y - 12, 4, 4, "#5b3b24");
    p.rect(x - f * 14, y - 3, 6, 3, "#e8dcc4");
    if (!reduced) {
      const rise = (time * 8) % 16;
      p.ctx.globalAlpha = 1 - rise / 16;
      p.rect(x + f * 6, y - 18 - rise, 4, 2, "#d9d4c4");
      p.rect(x + f * 8, y - 16 - rise, 2, 2, "#d9d4c4");
      p.rect(x + f * 6, y - 14 - rise, 4, 2, "#d9d4c4");
      p.ctx.globalAlpha = 1;
    }
    return;
  }
  const sit = state.action === "sit";
  for (const [i, dx] of [-8, -4, 4, 8].entries())
    p.rect(x + dx * f, y - 6, 3, 6 + ((i + run) % 2 ? 0 : -2) * (sit ? 0 : 1), "#6e4a2d");
  p.ellipse(x, y - 9 - (sit ? 2 : 0), 22, 11, "#8b5d38");
  p.rect(x - 4 * f, y - 10, 8, 5, "#e8dcc4");
  p.ellipse(x + f * 11, y - 15 - run, 11, 10, "#a3714a");
  p.rect(x + f * 15, y - 14 - run, 5, 4, "#e8dcc4");
  p.rect(x + f * 19, y - 15 - run, 2, 2, "#2b2621");
  p.rect(x + f * 8, y - 21 - run, 3, 6, "#5b3b24");
  p.rect(x + f * 12, y - 17 - run, 2, 2, "#2b2621");
  p.rect(x - f * 13, y - 15 + wag, 4, 3, "#a3714a");
  p.rect(x - f * 15, y - 17 + wag, 3, 3, "#e8dcc4");
}

function grandpa(p, top, time, reduced) {
  const rock = reduced ? 0 : Math.sin(time * 1.7);
  const dx = Math.round(rock * 2),
    x = 88,
    y = top + 164;
  // Curved runners keep him rocking in place on the porch.
  p.path(
    [
      [x - 20, y - 2 - Math.round(rock * 2)],
      [x + 20, y - 2 + Math.round(rock * 2)],
      [x + 18, y + 1 + Math.round(rock * 2)],
      [x - 18, y + 1 - Math.round(rock * 2)],
    ],
    "#6d4e32",
  );
  p.rect(x - 14 + dx, y - 40, 4, 38, "#7f5b3a");
  p.rect(x - 14 + dx, y - 18, 26, 4, "#8d6a43");
  for (const lx of [x - 10, x + 8]) p.rect(lx + dx, y - 15, 3, 13, "#7f5b3a");
  // Seated, wrapped in a plaid lap blanket, cap pulled low.
  p.rect(x - 10 + dx, y - 34, 14, 18, "#6f7f8c");
  p.rect(x - 4 + dx, y - 20, 20, 10, "#5c7a55");
  for (const lx of [x, x + 8]) p.rect(lx + dx, y - 20, 2, 10, "#8bab79");
  p.rect(x + 12 + dx, y - 10, 5, 10, "#4a4033");
  p.rect(x + 12 + dx, y - 2, 8, 3, "#2f281f");
  p.rect(x - 7 + dx, y - 46, 12, 12, "#d6ab84");
  p.rect(x - 3 + dx, y - 38, 9, 7, "#e7e2d6");
  p.rect(x - 9 + dx, y - 49, 16, 5, "#4d5b4a");
  p.rect(x + 3 + dx, y - 47, 6, 2, "#4d5b4a");
  p.rect(x + 2 + dx, y - 41, 3, 1, "#2b2621");
  if (!reduced)
    for (let i = 0; i < 2; i++) {
      const rise = (time * 9 + i * 13) % 26;
      p.ctx.globalAlpha = Math.max(0, 1 - rise / 26);
      const zx = x + 8 + rise * 0.5 + i * 2,
        zy = y - 54 - rise;
      p.rect(zx, zy, 5, 2, "#e8e2cf");
      p.rect(zx + 2, zy + 2, 2, 2, "#e8e2cf");
      p.rect(zx, zy + 4, 5, 2, "#e8e2cf");
      p.ctx.globalAlpha = 1;
    }
}

function crow(p, top, time, reduced) {
  const state = crowState(time, reduced),
    x = state.x,
    y = top + state.y,
    f = state.face;
  const flap = state.flying && !reduced ? Math.floor(time * 10) % 2 : 0;
  p.ellipse(x, y, 12, 8, "#23252a");
  p.rect(x + f * 5, y - 6 + (state.peck ? 4 : 0), 6, 6, "#2c2f35");
  p.rect(x + f * 10, y - 4 + (state.peck ? 4 : 0), 4, 2, "#c9a254");
  p.rect(x + f * 6, y - 5 + (state.peck ? 4 : 0), 2, 2, "#e8d9a0");
  p.rect(x - f * 9, y - 1, 6, 3, "#1c1e22");
  if (state.flying)
    p.path(
      [
        [x - 6, y - 1],
        [x - 2, y - 8 + flap * 12],
        [x + 4, y - 1],
      ],
      "#30333a",
    );
  else for (const dx of [-2, 2]) p.rect(x + dx, y + 4, 2, 4, "#8a7a48");
}

function sails(p, top, time, reduced) {
  const [cx, cyRel] = HOMESTEAD_SPOTS.windmill,
    cy = top + cyRel;
  const angle = reduced ? 0.4 : time * 0.9;
  for (let k = 0; k < 4; k++) {
    const a = angle + (k * Math.PI) / 2,
      ux = Math.cos(a),
      uy = Math.sin(a),
      vx = -uy,
      vy = ux;
    const at = (r, s) => [cx + ux * r + vx * s, cy + uy * r + vy * s];
    p.path([at(4, -2), at(64, -2), at(64, 2), at(4, 2)], "#5e4430");
    p.path([at(18, 3), at(62, 3), at(62, 15), at(18, 13)], "#d8cbab");
    for (const r of [30, 46]) p.path([at(r, 3), at(r + 2, 3), at(r + 2, 14), at(r, 14)], "#a8977a");
  }
  p.rect(cx - 5, cy - 5, 10, 10, "#3f2e22");
  p.rect(cx - 2, cy - 2, 4, 4, "#a3825a");
}

function laundry(p, top, time, reduced) {
  const items = [
    [786, 18, 22, "#b8574a", "shirt"],
    [814, 32, 34, "#d9d2bf", "sheet"],
    [858, 16, 28, "#4b6380", "trousers"],
    [884, 10, 12, "#c9a254", "sock"],
    [900, 22, 22, "#7d9a6f", "shirt"],
  ];
  for (const [x, w, h, color, kind] of items) {
    const lineY = top + 83 + Math.sin(((x + w / 2 - 774) / 162) * Math.PI) * 7;
    const sway = reduced ? 0 : Math.sin(time * 2.4 + x * 0.07) * 4;
    p.path(
      [
        [x, lineY],
        [x + w, lineY],
        [x + w + sway, lineY + h],
        [x + sway * 0.6, lineY + h],
      ],
      color,
    );
    if (kind === "shirt") {
      p.rect(x - 4 + sway * 0.3, lineY + 1, 5, 9, color);
      p.rect(x + w - 1 + sway * 0.3, lineY + 1, 5, 9, color);
      p.rect(x + w / 2 - 2, lineY, 4, 3, "#00000033");
    }
    if (kind === "trousers") p.rect(x + w / 2 - 1 + sway * 0.4, lineY + 10, 2, h - 10, "#2f3d52");
    if (kind === "sheet") p.rect(x + 4 + sway * 0.4, lineY + 14, w - 8, 3, "#b9b09a");
    p.rect(x + 2, lineY - 2, 2, 4, "#a8875a");
    p.rect(x + w - 4, lineY - 2, 2, 4, "#a8875a");
  }
}

export function animateHomestead(p, stable, time) {
  const top = stable.y,
    reduced = p.reduced;
  // Chimney smoke curls up from the cottage.
  for (let i = 0; i < 4; i++) {
    const phase = reduced ? i * 0.25 : (time * 0.13 + i * 0.25) % 1;
    p.ctx.globalAlpha = (1 - phase) * 0.26;
    p.rect(
      190 + Math.sin(phase * 6 + i) * 6,
      top + 18 - phase * 60,
      8 + phase * 14,
      6 + phase * 6,
      "#a2aaa0",
    );
  }
  p.ctx.globalAlpha = 1;
  sails(p, top, time, reduced);
  laundry(p, top, time, reduced);
  // Bees drift between the two skeps.
  for (let i = 0; i < 6; i++) {
    const t = reduced ? i : time * (1.4 + i * 0.1) + i * 1.9;
    p.rect(831 + Math.cos(t) * 26, top + 138 + Math.sin(t * 2.1) * 8, 2, 2, i % 2 ? "#f0cf5c" : "#3a2d1c");
  }
  grandpa(p, top, time, reduced);
  crow(p, top, time, reduced);
  const farmerNow = farmerState(time, reduced),
    dogNow = dogState(time, reduced);
  farmer(p, { ...farmerNow, y: top + farmerNow.y }, time, reduced);
  dog(p, { ...dogNow, y: top + dogNow.y }, time, reduced);
  // Fireflies over the meadow.
  for (let i = 0; i < 9; i++) {
    const t = reduced ? i * 1.3 : time * 0.6 + i * 1.3;
    p.ctx.globalAlpha = reduced ? 0.6 : 0.35 + (Math.sin(time * 2 + i * 2) + 1) * 0.3;
    p.rect(60 + ((i * 113) % 860) + Math.sin(t) * 14, top + 50 + ((i * 37) % 70) + Math.cos(t * 1.3) * 8, 2, 2, "#d9de95");
  }
  p.ctx.globalAlpha = 1;
}

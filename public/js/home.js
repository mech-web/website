/*
 * Homepage behavior. Plain JS, no dependencies, no build step.
 *
 *   1. Header: hidden while the top of the hero is visible, shown on scroll.
 *   2. Hero: draws the 3D "MECH" letters on a <canvas>, with a hover grow effect.
 *   3. GitHub star count: refreshed from the GitHub API, silently keeps the
 *      number written in index.html if the request fails.
 *
 * Colors come from CSS (--home-letter-fill / --home-letter-shade in home.css).
 */
(function () {
  "use strict";

  /* ---------- 1. Header visibility ---------- */

  var header = document.getElementById("home-header");
  var HEADER_SHOW_AFTER = 30; // px scrolled before the header appears

  function updateHeader() {
    header.classList.toggle("is-hidden", window.scrollY <= HEADER_SHOW_AFTER);
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* ---------- 3. GitHub star count ---------- */

  (function refreshStarCount() {
    var el = document.getElementById("gh-star-count");
    if (!el || !window.fetch) return;
    var controller = window.AbortController ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 5000) : null;
    fetch("https://api.github.com/repos/mech-lang/mech", {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller ? controller.signal : undefined,
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (repo) {
        if (typeof repo.stargazers_count === "number") {
          el.textContent = new Intl.NumberFormat("en-US").format(repo.stargazers_count);
        }
      })
      .catch(function () { /* keep the number from index.html */ })
      .then(function () { if (timer) clearTimeout(timer); });
  })();

  /* ---------- 2. Hero canvas ---------- */

  var hero = document.getElementById("home-hero");
  var panel = document.getElementById("bp-panel");
  var canvas = document.getElementById("bp-canvas");
  if (!hero || !panel || !canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var FRAME = 30;                          // width of the A-E / 1-4 label gutter
  var WORD = "MECH";
  var HOVER_SCALE = reduceMotion ? 1 : 1.08;
  var SCALE_EASE = reduceMotion ? 1 : 0.18;

  function cssColor(name, fallback) {
    var v = getComputedStyle(document.body).getPropertyValue(name).trim();
    return v || fallback;
  }
  var FILL = cssColor("--home-letter-fill", "#F6C04E");
  var SHADE = cssColor("--home-letter-shade", "#785714");

  // Which grid cells each letter occupies, used for sizing and hover hit-testing.
  var LETTER_GRID = {
    M: { minCol: 1, maxCol: 5, minRow: 1, maxRow: 5 },
    E: { minCol: 2, maxCol: 5, minRow: 1, maxRow: 5 },
    C: { minCol: 2, maxCol: 5, minRow: 1, maxRow: 5 },
    H: { minCol: 1, maxCol: 5, minRow: 1, maxRow: 5 },
  };

  // Oblique projection axes: depth (A), width (B), height (C).
  var A = { x: 0.42, y: 0.0 };
  var B = { x: -0.81, y: 2.01 };
  var C = { x: -0.81, y: -2.01 };

  function add(u, v) { return { x: u.x + v.x, y: u.y + v.y }; }
  function add3(u, v, w) { return add(add(u, v), w); }
  function mul(v, s) { return { x: v.x * s, y: v.y * s }; }

  function cubeFaces(offset, widthVec, heightVec, depthVec) {
    var v0 = offset;
    var v1 = add(offset, depthVec);
    var v2 = add(offset, widthVec);
    var v3 = add(offset, heightVec);
    var v4 = add3(offset, depthVec, widthVec);
    var v5 = add3(offset, depthVec, heightVec);
    var v6 = add3(offset, widthVec, heightVec);
    var v7 = add3(offset, depthVec, add(widthVec, heightVec));
    return {
      front: [v0, v2, v6, v3],
      back: [v1, v4, v7, v5],
      right: [v0, v3, v5, v1],
      left: [v2, v6, v7, v4],
      top: [v0, v2, v4, v1],
      bottom: [v3, v6, v7, v5],
    };
  }

  /* Letter definitions.
   * box(row, col, width, height, faces, edges) draws one block on the 5x5 grid.
   * `faces` is draw order. `edges` maps a face to four 0/1 flags saying which
   * of its four outlines to stroke. Front faces use FILL, other faces SHADE. */
  var ALL = [1, 1, 1, 1];
  var LETTERS = {
    H: [
      [1, 5, 1, 5, ["front", "top", "right"], { front: ALL, right: ALL, top: [1, 1, 1, 0] }],
      [3, 4, 1, 1, ["front", "top", "right"], { front: ALL, right: ALL, top: [1, 1, 1, 0] }],
      [1, 2, 1, 5, ["front", "top", "right"], { front: ALL, right: ALL, top: [1, 1, 1, 0] }],
    ],
    C: [
      [1, 5, 1, 5, ["front", "top", "right"], { front: ALL, right: ALL, top: [1, 1, 1, 0] }],
      [5, 2, 3, 1, ["front", "top", "right"], { front: ALL, right: ALL, top: ALL }],
      [1, 2, 2, 1, ["front", "top", "right"], { front: ALL, right: ALL, top: ALL }],
      [4, 2, 1, 2, ["front", "top", "right"], { front: ALL, right: ALL, top: ALL }],
      [1, 2, 1, 2, ["front", "top", "right"], { front: ALL, right: ALL, top: [0, 0, 1, 1] }],
    ],
    E: [
      [3, 5, 1, 5, ["front", "top", "right"], { front: ALL, right: [1, 1, 1, 0], top: [1, 1, 1, 0] }],
      [5, 2, 3, 1, ["front", "top", "right"], { front: ALL, right: ALL, top: ALL }],
      [3, 2, 3, 1, ["front", "top", "right"], { front: ALL, right: ALL, top: [0, 0, 1, 0] }],
      [1, 2, 4, 1, ["front", "top", "right"], { front: ALL, right: ALL, top: ALL }],
    ],
    M: [
      [3, 5, 1, 3, ["front", "top", "right"], { front: ALL, right: ALL, top: ALL }],
      [1, 3, 1, 4, ["left", "front", "right"], { front: [0, 1, 1, 1], right: [1, 1, 1, 0], left: [0, 0, 0, 0] }],
      [3, 1, 1, 3, ["left", "front", "top", "right"], { front: ALL, right: ALL, top: ALL, left: [0, 0, 0, 0] }],
      [1, 4, 2, 1, ["top", "front"], { front: ALL, top: [1, 1, 1, 0] }],
      [1, 3, 1, 1, ["front", "top"], { front: ALL, top: [1, 0, 1, 0] }],
      [1, 1, 2, 1, ["right", "top", "front"], { front: ALL, right: ALL, top: [1, 0, 1, 1] }],
    ],
  };

  var letters = WORD.split("").map(function (ch, i) {
    return { ch: ch, index: i, current: 1, target: 1, bounds: null };
  });

  var width = 1;
  var height = 1;
  var dpr = 1;
  var scale = 1;
  var hovered = -1;
  var pointer = { x: 0, y: 0, inside: false };
  var frameRequest = null;

  /* Screen-space bounds of a letter's grid cells at a given size. */
  function letterBounds(ch, drawScale) {
    var g = LETTER_GRID[ch];
    var unit = drawScale / 5;
    var origin = add(mul(B, (g.minCol - 1) * unit), mul(C, (g.minRow - 1) * unit));
    var w = mul(B, (g.maxCol - g.minCol + 1) * unit);
    var h = mul(C, (g.maxRow - g.minRow + 1) * unit);
    var d = mul(A, drawScale);
    var corners = [
      origin, add(origin, d), add(origin, w), add(origin, h),
      add3(origin, d, w), add3(origin, d, h), add3(origin, w, h), add3(origin, d, add(w, h)),
    ];
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    corners.forEach(function (p) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, -p.y); maxY = Math.max(maxY, -p.y);
    });
    return { minX: minX, maxX: maxX, minY: minY, maxY: maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
  }

  function wordBounds(drawScale, spacing) {
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    WORD.split("").forEach(function (ch, i) {
      var b = letterBounds(ch, drawScale);
      minX = Math.min(minX, b.minX + spacing * i); maxX = Math.max(maxX, b.maxX + spacing * i);
      minY = Math.min(minY, b.minY); maxY = Math.max(maxY, b.maxY);
    });
    return { minX: minX, minY: minY, width: maxX - minX, height: maxY - minY };
  }

  function drawFace(verts, fill, edges, strokeWidth) {
    ctx.beginPath();
    ctx.moveTo(verts[0].x, -verts[0].y);
    for (var i = 1; i < verts.length; i++) ctx.lineTo(verts[i].x, -verts[i].y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.strokeStyle = FILL;
    ctx.lineWidth = strokeWidth;
    for (var j = 0; j < verts.length; j++) {
      if (!edges || !edges[j]) continue;
      var p1 = verts[j];
      var p2 = verts[(j + 1) % verts.length];
      ctx.beginPath();
      ctx.moveTo(p1.x, -p1.y);
      ctx.lineTo(p2.x, -p2.y);
      ctx.stroke();
    }
  }

  function drawBox(part, originX, originY, drawScale) {
    var row = part[0], col = part[1], w = part[2], h = part[3], faces = part[4], edges = part[5];
    var unit = drawScale / 5;
    var cols = Math.min(5, col + w - 1) - col + 1;
    var rows = Math.min(5, row + h - 1) - row + 1;
    var offset = add(mul(B, (col - 1) * unit), mul(C, (row - 1) * unit));
    var geometry = cubeFaces(offset, mul(B, unit * cols), mul(C, unit * rows), mul(A, drawScale));
    var fills = { front: FILL, right: SHADE, top: SHADE, left: SHADE };

    ctx.save();
    ctx.translate(originX, originY);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    faces.forEach(function (face) {
      drawFace(geometry[face], fills[face], edges[face], 1);
    });
    ctx.restore();
  }

  function drawLetter(state, originX, originY) {
    var base = letterBounds(state.ch, scale);
    var drawScale = scale * state.current;
    var scaled = letterBounds(state.ch, drawScale);
    // Grow around the letter's own center so it doesn't drift while hovered.
    var cx = originX + (base.cx - scaled.cx);
    var cy = originY + (base.cy - scaled.cy);
    state.bounds = {
      minX: cx + scaled.minX, maxX: cx + scaled.maxX,
      minY: cy + scaled.minY, maxY: cy + scaled.maxY,
      cx: cx + scaled.cx, cy: cy + scaled.cy,
    };
    LETTERS[state.ch].forEach(function (part) { drawBox(part, cx, cy, drawScale); });
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Fit the word between the label gutter and the info panel.
    var innerW = Math.max(1, width - FRAME);
    var innerH = Math.max(1, height - FRAME);
    var panelTop = panel.getBoundingClientRect().top - hero.getBoundingClientRect().top;
    var top = FRAME + Math.max(10, innerH * 0.03);
    var bottom = Math.max(top + 80, panelTop - 18);
    var area = { left: FRAME + innerW * 0.04, top: top, width: innerW * 0.92, height: Math.max(80, bottom - top) };

    var unitBounds = wordBounds(1, 2.2);
    var fit = Math.min(area.width / unitBounds.width, area.height / unitBounds.height) * 0.776;
    scale = Math.max(12, fit);
    var spacing = scale * 2.2;
    var wb = wordBounds(scale, spacing);
    var x0 = area.left + (area.width - wb.width) / 2 - wb.minX;
    var y0 = area.top + (area.height - wb.height) / 2 - wb.minY;

    // Right to left, so overlapping letters stack the way the logo does.
    for (var i = letters.length - 1; i >= 0; i--) drawLetter(letters[i], x0 + spacing * i, y0);
  }

  /* ---------- hover + animation ---------- */

  function requestRender() {
    if (frameRequest === null) frameRequest = requestAnimationFrame(renderFrame);
  }

  function stepAnimation() {
    var animating = false;
    letters.forEach(function (s) {
      var delta = s.target - s.current;
      if (Math.abs(delta) < 0.001) { s.current = s.target; return; }
      s.current += delta * SCALE_EASE;
      animating = true;
    });
    return animating;
  }

  function setHovered(next) {
    if (hovered === next) return false;
    hovered = next;
    letters.forEach(function (s, i) { s.target = i === hovered ? HOVER_SCALE : 1; });
    return true;
  }

  function pickLetter(x, y) {
    var best = -1, bestDist = Infinity;
    letters.forEach(function (s) {
      var b = s.bounds;
      if (!b || x < b.minX || x > b.maxX || y < b.minY || y > b.maxY) return;
      var d = (x - b.cx) * (x - b.cx) + (y - b.cy) * (y - b.cy);
      if (d < bestDist) { bestDist = d; best = s.index; }
    });
    return best;
  }

  function renderFrame() {
    frameRequest = null;
    var animating = stepAnimation();
    draw();
    var changed = pointer.inside && setHovered(pickLetter(pointer.x, pointer.y));
    if (animating || changed) requestRender();
  }

  function clearHover() {
    pointer.inside = false;
    if (setHovered(-1)) requestRender();
  }

  function onPointerMove(e) {
    var rect = canvas.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
      clearHover();
      return;
    }
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.inside = true;
    if (setHovered(pickLetter(pointer.x, pointer.y))) requestRender();
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    width = Math.max(1, Math.round(hero.clientWidth));
    height = Math.max(1, Math.round(hero.clientHeight));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    requestRender();
  }

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", onPointerMove);
  window.addEventListener("mouseleave", clearHover);
  window.addEventListener("blur", clearHover);
  window.addEventListener("scroll", clearHover, { passive: true });
  resize();
})();

/* ORIONECT — constellation background v2
   Professional, refined. Subliminal depth, not decoration.
   Principle: barely there in light mode, softly present in dark.
   Parallax speed differences create the depth, not glow/size. */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ---- canvas ---- */
  var canvas = document.createElement('canvas');
  canvas.id = 'constellation-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = [
    'position:fixed',
    'inset:0',
    'width:100%',
    'height:100%',
    'z-index:-1',
    'pointer-events:none',
    'mix-blend-mode:normal',
  ].join(';');
  document.body.insertBefore(canvas, document.body.firstChild);

  var ctx = canvas.getContext('2d');
  var W = 0, H = 0;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var scrollY = 0;
  var animId;
  var tick = 0;

  /* ----------------------------------------------------------------
     ORION — actual star positions, normalized 0..1 (y down).
     Sized to fill ~72% of viewport height, centered at 48% x / 50% y.
     This is the "ghost layer" — slowest, most faint. 
  ---------------------------------------------------------------- */
  var O_STARS = [
    { x: 0.470, y: 0.025, mag: 1.0,  name: 'Meissa'     },
    { x: 0.265, y: 0.235, mag: 1.55, name: 'Betelgeuse' },
    { x: 0.680, y: 0.210, mag: 1.15, name: 'Bellatrix'  },
    { x: 0.400, y: 0.545, mag: 1.15, name: 'Alnitak'    },
    { x: 0.500, y: 0.560, mag: 1.20, name: 'Alnilam'    },
    { x: 0.600, y: 0.510, mag: 1.10, name: 'Mintaka'    },
    { x: 0.350, y: 0.955, mag: 1.05, name: 'Saiph'      },
    { x: 0.710, y: 0.935, mag: 1.55, name: 'Rigel'      },
    { x: 0.476, y: 0.685, mag: 0.70, name: 'sword1'     },
    { x: 0.462, y: 0.775, mag: 0.65, name: 'sword2'     },
  ];
  var O_EDGES = [
    [0,1],[0,2],[1,2],
    [1,3],[2,5],
    [3,4],[4,5],
    [3,6],[5,7],
    [4,8],[8,9],
  ];
  /* assign static twinkle phases */
  O_STARS.forEach(function (s) {
    s.phase  = Math.random() * Math.PI * 2;
    s.tspeed = 0.15 + Math.random() * 0.35;
  });

  /* ----------------------------------------------------------------
     AMBIENT FIELD — three sparse layers, no connecting lines.
     All very small, purely positional (no glow, no halo).
  ---------------------------------------------------------------- */
  var FIELD = [
    /* far    */ { depth: 0.010, count: 90,  rMin: 0.35, rMax: 0.80 },
    /* mid    */ { depth: 0.028, count: 55,  rMin: 0.40, rMax: 0.95 },
    /* near   */ { depth: 0.055, count: 22,  rMin: 0.55, rMax: 1.20 },
  ];
  function seedField() {
    FIELD.forEach(function (layer) {
      layer.stars = [];
      for (var i = 0; i < layer.count; i++) {
        layer.stars.push({
          nx:     Math.random(),
          ny:     -0.15 + Math.random() * 1.30,
          r:      layer.rMin + Math.random() * (layer.rMax - layer.rMin),
          phase:  Math.random() * Math.PI * 2,
          tspeed: 0.10 + Math.random() * 0.40,
        });
      }
    });
  }

  /* ----------------------------------------------------------------
     RESIZE
  ---------------------------------------------------------------- */
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    seedField();
  }

  /* ----------------------------------------------------------------
     THEME COLOURS — ultra-subtle; different per mode
  ---------------------------------------------------------------- */
  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }
  function clr(alpha) {
    if (isDark()) return 'rgba(235,215,185,' + alpha + ')';
    return 'rgba(45,28,12,' + alpha + ')';
  }

  /* ----------------------------------------------------------------
     ORION GEOMETRY — computes screen coords each frame (cheap)
  ---------------------------------------------------------------- */
  function orionPts(shift) {
    var oH = H * 0.72;
    var oW = oH * 0.62;
    var cx = W * 0.52;
    var x0 = cx - oW * 0.5;
    var y0 = H * 0.14;
    var rBase = Math.min(W, H) * 0.0022;
    return O_STARS.map(function (s) {
      return {
        sx: x0 + s.x * oW,
        sy: y0 + s.y * oH + shift,
        r:  rBase * s.mag,
        s:  s,
      };
    });
  }

  /* ----------------------------------------------------------------
     DRAW ORION — hairline lines, pinpoint stars, very faint
  ---------------------------------------------------------------- */
  function drawOrion(t, motionOff) {
    var shift = motionOff ? 0 : scrollY * 0.004 * -1;
    var dark  = isDark();
    /* opacity: barely there in light, softly present in dark */
    var lineAlpha = dark ? 0.055 : 0.038;
    var starAlpha = dark ? 0.22  : 0.14;
    var pts = orionPts(shift);

    ctx.lineWidth = 0.35;
    O_EDGES.forEach(function (e) {
      var a = pts[e[0]], b = pts[e[1]];
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.strokeStyle = clr(lineAlpha);
      ctx.stroke();
    });

    pts.forEach(function (p) {
      var tw = motionOff ? 1 : 0.88 + 0.12 * Math.sin(t * p.s.tspeed + p.s.phase);
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, p.r * tw, 0, Math.PI * 2);
      ctx.fillStyle = clr(starAlpha * tw);
      ctx.fill();
    });
  }

  /* ----------------------------------------------------------------
     DRAW FIELD — ambient pinpoints only, no lines, no halos
  ---------------------------------------------------------------- */
  function drawField(t, motionOff) {
    var dark = isDark();
    FIELD.forEach(function (layer) {
      var shift = motionOff ? 0 : scrollY * layer.depth * -1;
      /* deeper layers fainter */
      var base = dark
        ? (layer.depth < 0.015 ? 0.10 : layer.depth < 0.035 ? 0.14 : 0.18)
        : (layer.depth < 0.015 ? 0.05 : layer.depth < 0.035 ? 0.08 : 0.11);

      layer.stars.forEach(function (s) {
        var tw = motionOff ? 1 : 0.82 + 0.18 * Math.sin(t * s.tspeed + s.phase);
        ctx.beginPath();
        ctx.arc(s.nx * W, s.ny * H + shift, s.r, 0, Math.PI * 2);
        ctx.fillStyle = clr(base * tw);
        ctx.fill();
      });
    });
  }

  /* ----------------------------------------------------------------
     MAIN LOOP
  ---------------------------------------------------------------- */
  function draw(ts) {
    var t = ts * 0.001;
    ctx.clearRect(0, 0, W, H);
    var motionOff = document.documentElement.getAttribute('data-motion') === 'off';
    /* Orion first (deepest) then ambient field on top */
    drawOrion(t, motionOff);
    drawField(t, motionOff);
    animId = requestAnimationFrame(draw);
  }

  /* ----------------------------------------------------------------
     EVENTS
  ---------------------------------------------------------------- */
  window.addEventListener('scroll', function () { scrollY = window.scrollY; }, { passive: true });
  var rTimer;
  window.addEventListener('resize', function () {
    clearTimeout(rTimer);
    rTimer = setTimeout(function () {
      cancelAnimationFrame(animId);
      resize();
      animId = requestAnimationFrame(draw);
    }, 80);
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) cancelAnimationFrame(animId);
    else animId = requestAnimationFrame(draw);
  });

  resize();
  animId = requestAnimationFrame(draw);

})();

/* 3D bottle scene: glass, labels, crown cap and a sloshing, foaming, bubbling liquid. */
(function () {
  'use strict';
  var T = window.THREE;
  var canvas = document.getElementById('stage');
  if (!T || !canvas) return;

  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (e) {
    document.querySelectorAll('.scene').forEach(function (s) { s.classList.add('in'); });
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  var FOV = 28, CAM_DIST = 9.6;
  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 1.25, CAM_DIST);
  camera.lookAt(0, 0, 0);

  /* ---------- studio environment (softboxes reflected in the glass) ---------- */
  (function () {
    var env = new T.Scene();
    env.add(new T.Mesh(new T.SphereGeometry(20, 16, 12),
      new T.MeshBasicMaterial({ color: 0x15100a, side: T.BackSide })));
    function panel(w, h, x, y, z, color, power) {
      var m = new T.Mesh(new T.PlaneGeometry(w, h),
        new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(power), side: T.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
    }
    panel(2.2, 12, -8, 2, 4, 0xffffff, 14);
    panel(1.0, 10, 8, 1, 5, 0xfff2d8, 9);
    panel(3.0, 9, 7, 2, -6, 0xffd9a0, 4);
    panel(9, 9, 0, 11, 0, 0xffffff, 3);
    panel(10, 5, 0, -1, 12, 0xffe6b8, 1.2);
    var pmrem = new T.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(env, 0.03).texture;
    pmrem.dispose();
  })();
  var key = new T.DirectionalLight(0xfff4dc, 1.6);
  key.position.set(-3, 4, 6);
  scene.add(key);

  /* ---------- bottle profile (radius, height) — 3 units tall ---------- */
  var OUTER = [[0, 0.035], [0.34, 0.025], [0.44, 0], [0.49, 0.03], [0.51, 0.1], [0.51, 0.3], [0.506, 0.36],
    [0.496, 0.395], [0.51, 0.44], [0.51, 1.0], [0.51, 1.6], [0.503, 1.76], [0.47, 1.92], [0.4, 2.05],
    [0.31, 2.16], [0.235, 2.25], [0.203, 2.34], [0.188, 2.46], [0.17, 2.66], [0.158, 2.8], [0.158, 2.86],
    [0.176, 2.885], [0.176, 2.93], [0.16, 2.955], [0.152, 3.0], [0.128, 3.0]];
  var outerPts = new T.CatmullRomCurve3(OUTER.map(function (p) { return new T.Vector3(p[0], p[1], 0); }), false, 'centripetal')
    .getPoints(240).map(function (p) { return new T.Vector2(Math.max(p.x, 0), p.y); });
  var lowest = 0;
  outerPts.forEach(function (p, i) { if (p.y < outerPts[lowest].y) lowest = i; });
  var wall = outerPts.slice(lowest);
  function radiusAt(y) {
    for (var i = 1; i < wall.length; i++) {
      if (wall[i].y >= y) {
        var a = wall[i - 1], b = wall[i];
        return a.x + (b.x - a.x) * T.MathUtils.clamp((y - a.y) / Math.max(b.y - a.y, 1e-6), 0, 1);
      }
    }
    return wall[wall.length - 1].x;
  }
  // A strip of the bottle surface, used for labels.
  function band(y0, y1, phiCenter, span, offset) {
    var pts = [];
    for (var i = 0; i <= 32; i++) {
      var y = y0 + (y1 - y0) * i / 32;
      pts.push(new T.Vector2(radiusAt(y) + offset, y));
    }
    return new T.LatheGeometry(pts, 72, phiCenter - span / 2, span);
  }

  var FILL_MIN = 0.35, FILL_MAX = 2.56, LIQ_BOTTOM = 0.08, LIQ_TOP = 2.84;

  var rig = new T.Group();      // position, zoom, tilt
  var bottle = new T.Group();   // spin
  var body = new T.Group();     // geometry, origin at bottle base
  body.position.y = -1.5;
  bottle.add(body); rig.add(bottle); scene.add(rig);

  /* ---------- glow behind the bottle ---------- */
  (function () {
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var g = c.getContext('2d'), grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255,190,60,.55)'); grad.addColorStop(0.45, 'rgba(230,140,20,.16)'); grad.addColorStop(1, 'rgba(230,140,20,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
    var glow = new T.Mesh(new T.PlaneGeometry(5.2, 6.2),
      new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
    glow.position.z = -1.6; glow.renderOrder = -1;
    rig.add(glow);
  })();

  /* ---------- liquid ---------- */
  var liquidUniforms = {
    uTime: { value: 0 }, uAgit: { value: 0 }, uFoam: { value: 0.03 }, uScale: { value: 1 },
    uCenter: { value: new T.Vector3() }, uNormal: { value: new T.Vector3(0, 1, 0) },
    uLight: { value: new T.Color(0xffc21c) }, uDeep: { value: new T.Color(0xb86a06) },
    uGlow: { value: new T.Color(0xfff0a0) }, uFoamCol: { value: new T.Color(0xfff6dc) }
  };
  var NOISE = [
    'float hash(vec3 p){ p = fract(p*0.3183099 + .1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }',
    'float noise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);',
    '  return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x), mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),',
    '             mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x), mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z); }'
  ].join('\n');
  // Height of a world-space point above the (tilting, rippling) liquid surface, in bottle units.
  var SURFACE = [
    'uniform vec3 uCenter; uniform vec3 uNormal; uniform float uScale; uniform float uTime; uniform float uAgit;',
    'float surfaceHeight(vec3 wp){',
    '  vec3 q = wp / uScale;',
    '  float h = dot(wp - uCenter, uNormal) / uScale;',
    '  return h + (sin(q.x*11.0 + uTime*3.1) + sin(q.z*9.0 - uTime*2.3)) * 0.0035 * (1.0 + uAgit*6.0);',
    '}'
  ].join('\n');

  var liquidPts = [new T.Vector2(0, LIQ_BOTTOM)];
  for (var li = 0; li <= 140; li++) {
    var ly = LIQ_BOTTOM + (LIQ_TOP - LIQ_BOTTOM) * li / 140;
    var round = Math.sqrt(Math.min(1, (ly - LIQ_BOTTOM) / 0.07));
    liquidPts.push(new T.Vector2((radiusAt(ly) - 0.026) * (0.8 + 0.2 * round), ly));
  }
  liquidPts.push(new T.Vector2(0, LIQ_TOP));
  var liquid = new T.Mesh(new T.LatheGeometry(liquidPts, 72), new T.ShaderMaterial({
    uniforms: liquidUniforms,
    side: T.DoubleSide,
    vertexShader: [
      'varying vec3 vWorld; varying vec3 vN; varying vec3 vView; varying float vY;',
      'void main(){',
      '  vec4 wp = modelMatrix * vec4(position, 1.0); vWorld = wp.xyz; vY = position.y;',
      '  vec4 mv = viewMatrix * wp; vView = -mv.xyz; vN = normalMatrix * normal;',
      '  gl_Position = projectionMatrix * mv;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'varying vec3 vWorld; varying vec3 vN; varying vec3 vView; varying float vY;',
      'uniform float uFoam; uniform vec3 uLight; uniform vec3 uDeep; uniform vec3 uGlow; uniform vec3 uFoamCol;',
      SURFACE, NOISE,
      'void main(){',
      '  float h = surfaceHeight(vWorld);',
      '  if (h > 0.0) discard;',
      '  vec3 q = vWorld / uScale;',
      '  vec3 col;',
      '  if (!gl_FrontFacing) {',
      // the far wall seen through the cut: shade it as the liquid surface
      '    float n = noise(vec3(q.x*16.0, uTime*0.3, q.z*16.0));',
      '    float cover = clamp(0.35 + uFoam*9.0 + (n-0.5)*0.5, 0.0, 1.0);',
      '    col = mix(uLight*1.08, uFoamCol*(0.9 + 0.1*n), cover);',
      '  } else {',
      '    float ndv = abs(dot(normalize(vN), normalize(vView)));',
      '    col = mix(uLight, uDeep, pow(1.0 - ndv, 1.5) * 0.9);',
      '    col += uGlow * pow(ndv, 4.0) * 0.16;',
      '    col *= 0.9 + 0.2 * noise(q*vec3(3.5, 2.0, 3.5) + vec3(0.0, -uTime*0.3, uTime*0.12));',
      '    col *= mix(0.8, 1.06, smoothstep(0.0, 2.6, vY));',
      '    float fh = uFoam * (0.7 + 0.6*noise(vec3(q.x*13.0, uTime*0.25, q.z*13.0)));',
      '    float foam = smoothstep(-fh - 0.014, -fh, h);',
      '    float fizz = noise(q*42.0 + vec3(0.0, uTime*0.6, 0.0));',
      '    col = mix(col, uGlow, smoothstep(-fh - 0.09, -fh, h) * 0.22);',
      '    col = mix(col, uFoamCol * (0.8 + 0.2*ndv) * (0.93 + 0.07*fizz), foam);',
      '  }',
      '  gl_FragColor = vec4(col, 1.0);',
      '  #include <colorspace_fragment>',
      '}'
    ].join('\n')
  }));
  body.add(liquid);

  /* ---------- bubbles ---------- */
  var BUBBLES = 220, seeds = new Float32Array(BUBBLES * 4);
  for (var bi = 0; bi < seeds.length; bi++) seeds[bi] = Math.random();
  var bubbleGeo = new T.BufferGeometry();
  bubbleGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(BUBBLES * 3), 3));
  bubbleGeo.setAttribute('aSeed', new T.BufferAttribute(seeds, 4));
  var bubbleUniforms = {
    uTime: liquidUniforms.uTime, uAgit: liquidUniforms.uAgit, uScale: liquidUniforms.uScale,
    uCenter: liquidUniforms.uCenter, uNormal: liquidUniforms.uNormal,
    uRise: { value: 0 }, uFill: { value: FILL_MAX }, uPx: { value: 1000 }
  };
  var bubbles = new T.Points(bubbleGeo, new T.ShaderMaterial({
    uniforms: bubbleUniforms,
    transparent: true, depthTest: false, depthWrite: false,
    vertexShader: [
      'attribute vec4 aSeed; uniform float uRise; uniform float uFill; uniform float uPx;',
      'varying float vAlpha;',
      SURFACE,
      'void main(){',
      '  float phase = fract(aSeed.x + uRise * (0.1 + 0.22*aSeed.y));',
      '  float y = 0.12 + phase * max(uFill - 0.12, 0.01);',
      // approximate inner radius of the bottle at this height
      '  float r = mix(0.46, 0.17, smoothstep(1.68, 2.32, y));',
      '  r = mix(r, 0.12, smoothstep(2.32, 2.85, y)) * 0.84 * sqrt(aSeed.z);',
      '  float ang = aSeed.w * 6.2832 + sin(uRise*1.7 + aSeed.x*40.0) * 0.35;',
      '  vec4 wp = modelMatrix * vec4(sin(ang)*r, y, cos(ang)*r, 1.0);',
      '  vec4 mv = viewMatrix * wp;',
      '  float size = (0.012 + 0.03*aSeed.y*aSeed.y) * (0.55 + 0.7*phase);',
      '  gl_PointSize = size * uScale * uPx / -mv.z;',
      '  float shown = step(fract(aSeed.x*7.31 + aSeed.w), 0.35 + 0.65*uAgit);',
      '  vAlpha = shown * smoothstep(0.0, 0.06, phase) * step(surfaceHeight(wp.xyz), -0.012);',
      '  gl_Position = projectionMatrix * mv;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'varying float vAlpha;',
      'void main(){',
      '  vec2 c = gl_PointCoord - 0.5; float d = length(c) * 2.0;',
      '  if (d > 1.0 || vAlpha < 0.01) discard;',
      '  float rim = smoothstep(0.5, 0.95, d) * (1.0 - smoothstep(0.95, 1.0, d));',
      '  float spark = 1.0 - smoothstep(0.0, 0.28, length(c - vec2(-0.16, -0.16)));',
      '  gl_FragColor = vec4(vec3(1.0, 0.96, 0.78), (0.16 + 0.55*rim + 0.6*spark) * vAlpha);',
      '}'
    ].join('\n')
  }));
  bubbles.frustumCulled = false;
  bubbles.renderOrder = 2;
  body.add(bubbles);

  /* ---------- glass ---------- */
  function glassMaterial(side) {
    var m = new T.MeshPhysicalMaterial({
      color: 0x060605, roughness: 0.03, metalness: 0, envMapIntensity: 1.5, side: side,
      transparent: true, depthWrite: false,
      // reflections add on top of what is behind; alpha only dims it slightly
      blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneMinusSrcAlphaFactor,
      blendSrcAlpha: T.OneFactor, blendDstAlpha: T.OneMinusSrcAlphaFactor
    });
    m.onBeforeCompile = function (shader) {
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', [
        'float rimGlass = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.6);',
        'outgoingLight += vec3(0.85, 0.95, 0.9) * rimGlass * 0.1;',
        'diffuseColor.a = clamp(0.03 + rimGlass * 0.3, 0.0, 1.0);',
        '#include <opaque_fragment>'
      ].join('\n'));
    };
    return m;
  }
  var glassGeo = new T.LatheGeometry(outerPts, 96);
  var glassBack = new T.Mesh(glassGeo, glassMaterial(T.BackSide));
  var glassFront = new T.Mesh(glassGeo, glassMaterial(T.FrontSide));
  glassBack.renderOrder = 1; glassFront.renderOrder = 4;
  body.add(glassBack, glassFront);

  /* ---------- labels ---------- */
  var labelSpecs = [
    { name: 'front', geo: band(0.47, 1.6, 0, 3.5, 0.004) },
    { name: 'back', geo: band(0.62, 1.48, Math.PI, 1.9, 0.004) },
    { name: 'neck', geo: band(2.3, 2.76, 0, 3.0, 0.004) }
  ];
  var labelMaterials = labelSpecs.map(function (spec) {
    var mat = new T.MeshStandardMaterial({
      roughness: 0.62, metalness: 0, envMapIntensity: 0.55, side: T.DoubleSide,
      transparent: true, alphaTest: 0.5
    });
    var mesh = new T.Mesh(spec.geo, mat);
    mesh.renderOrder = 3;   // after the bubbles, so paper hides them
    body.add(mesh);
    return mat;
  });
  function paintLabels() {
    labelSpecs.forEach(function (spec, i) {
      var tex = new T.CanvasTexture(window.BottleLabels[spec.name]());
      tex.colorSpace = T.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      if (labelMaterials[i].map) labelMaterials[i].map.dispose();
      labelMaterials[i].map = tex;
      labelMaterials[i].needsUpdate = true;
    });
  }
  paintLabels();
  if (document.fonts && document.fonts.load) {
    Promise.all([
      document.fonts.load('400 100px "Ruslan Display"', 'Мельник'),
      document.fonts.load('700 100px "Playfair Display"', 'ИЗ БОЧОНКА'),
      document.fonts.load('400 100px "Playfair Display"', 'Пиво')
    ]).then(paintLabels, function () {});
  }

  /* ---------- crown cap ---------- */
  (function () {
    var pts = [[0, 3.036], [0.11, 3.036], [0.16, 3.028], [0.183, 3.008], [0.19, 2.975], [0.193, 2.94], [0.204, 2.905]]
      .map(function (p) { return new T.Vector2(p[0], p[1]); });
    var geo = new T.LatheGeometry(new T.SplineCurve(pts).getPoints(24), 126);
    var pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      var t = T.MathUtils.smoothstep(3.0 - y, 0, 0.09);
      var k = 1 + 0.05 * t * Math.sin(Math.atan2(x, z) * 21);
      pos.setXYZ(i, x * k, y, z * k);
    }
    geo.computeVertexNormals();
    var cap = new T.Mesh(geo, new T.MeshStandardMaterial({
      color: 0xd9a431, metalness: 1, roughness: 0.3, envMapIntensity: 1.3, side: T.DoubleSide
    }));
    body.add(cap);
  })();

  /* ---------- scroll-driven staging ---------- */
  var TAU = Math.PI * 2;
  // x is a fraction of the visible width, y is in world units
  var STAGES = [
    { x: 0.22, y: 0, rot: -0.3, zoom: 1, fill: 2.5 },
    { x: -0.23, y: 0, rot: TAU + 0.35, zoom: 1, fill: 2.5 },
    { x: 0.2, y: -1.0, rot: TAU - 0.25, zoom: 1.75, fill: 1.96 },
    { x: -0.23, y: 0, rot: 2 * TAU + 0.3, zoom: 1, fill: 2.5 }
  ];
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-scene]'));
  var target = { x: 0, y: 0, rot: 0, zoom: 1, fill: 2.5 };
  var narrow = false, viewW = 1;

  function readScroll() {
    var mid = window.scrollY + window.innerHeight / 2;
    var centers = sections.map(function (s) { return s.offsetTop + s.offsetHeight / 2; });
    var i = 0;
    while (i < centers.length - 2 && mid > centers[i + 1]) i++;
    var a = STAGES[i], b = STAGES[Math.min(i + 1, STAGES.length - 1)];
    var t = centers.length > 1 ? T.MathUtils.clamp((mid - centers[i]) / (centers[i + 1] - centers[i]), 0, 1) : 0;
    t = t * t * (3 - 2 * t);
    ['x', 'y', 'rot', 'zoom', 'fill'].forEach(function (k) { target[k] = a[k] + (b[k] - a[k]) * t; });
  }

  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    narrow = w < 760;
    viewW = 2 * Math.tan(T.MathUtils.degToRad(FOV / 2)) * CAM_DIST * camera.aspect;
    bubbleUniforms.uPx.value = renderer.domElement.height / (2 * Math.tan(T.MathUtils.degToRad(FOV / 2)));
    readScroll();
  }
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', readScroll, { passive: true });

  /* ---------- interaction ---------- */
  var spin = { offset: 0, vel: 0, dragging: false, lastX: 0 };
  var pointer = { x: 0, y: 0 };
  var sips = 0, shake = 0, agit = 1;

  window.addEventListener('pointerdown', function (e) {
    if (e.target.closest && e.target.closest('a, button')) return;
    spin.dragging = true; spin.lastX = e.clientX; spin.vel = 0;
  });
  window.addEventListener('pointermove', function (e) {
    pointer.x = e.clientX / window.innerWidth * 2 - 1;
    pointer.y = e.clientY / window.innerHeight * 2 - 1;
    if (!spin.dragging) return;
    var d = (e.clientX - spin.lastX) * 0.009;
    spin.lastX = e.clientX;
    spin.offset += d;
    spin.vel = d * 60;
  });
  ['pointerup', 'pointercancel', 'blur'].forEach(function (n) {
    window.addEventListener(n, function () { spin.dragging = false; });
  });

  var slosh = { x: 0, z: 0, vx: 0, vz: 0 };
  var actions = {
    shake: function () { shake = 1; agit = 1; slosh.vx += 5; slosh.vz += 2; },
    sip: function () { sips = Math.min(sips + 1, 6); slosh.vx -= 2.5; agit = Math.max(agit, 0.45); },
    refill: function () { sips = 0; agit = 1; slosh.vx += 1.5; }
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-action]');
    if (b && actions[b.dataset.action]) actions[b.dataset.action]();
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) en.target.classList.add('in'); });
    }, { threshold: 0.25 });
    sections.forEach(function (s) { io.observe(s); });
  } else {
    sections.forEach(function (s) { s.classList.add('in'); });
  }

  /* ---------- animation loop ---------- */
  var cur = { x: 0, y: 0, rot: -2.2, zoom: 0.9, fill: FILL_MIN };
  var prev = { x: 0, rot: 0, dx: 0, dr: 0, primed: false };
  var meter = document.getElementById('meter');
  var clock = new T.Clock(), time = 0, rise = 0;
  var fillPoint = new T.Vector3();

  function approach(a, b, rate, dt) { return a + (b - a) * (1 - Math.exp(-rate * dt)); }

  function frame() {
    var rawDt = Math.max(clock.getDelta(), 1e-3);
    var dt = Math.min(rawDt, 1 / 12);
    time += dt;

    var tx = narrow ? 0 : target.x * viewW;
    var ty = target.y + (narrow ? 0.75 : 0);
    var tz = target.zoom * (narrow ? 0.7 : 1);
    cur.x = approach(cur.x, tx, 4, dt);
    cur.y = approach(cur.y, ty, 4, dt);
    cur.zoom = approach(cur.zoom, tz, 4, dt);
    cur.rot = approach(cur.rot, target.rot, 3, dt);
    cur.fill = approach(cur.fill, T.MathUtils.clamp(target.fill - sips * 0.24, FILL_MIN, FILL_MAX), 1.6, dt);

    if (!spin.dragging) {
      spin.offset += spin.vel * dt;
      spin.vel *= Math.exp(-2.2 * dt);
    }
    shake *= Math.exp(-3.2 * dt);

    var rotY = cur.rot + spin.offset + Math.sin(time * 0.45) * 0.14;
    rig.position.set(cur.x + Math.sin(time * 34) * 0.07 * shake, cur.y + Math.sin(time * 0.9) * 0.03, 0);
    rig.scale.setScalar(cur.zoom);
    rig.rotation.z = approach(rig.rotation.z, -pointer.x * 0.07, 3, dt) + Math.sin(time * 29) * 0.11 * shake;
    rig.rotation.x = approach(rig.rotation.x, pointer.y * 0.05, 3, dt);
    bottle.rotation.y = rotY;

    // Slosh: a damped spring kicked by changes in the bottle's sideways and spin speed.
    if (prev.primed) {
      // real elapsed time, so slow frames don't read as jolts
      var dx = (rig.position.x - prev.x) / rawDt, dr = (rotY - prev.rot) / rawDt;
      slosh.vx += T.MathUtils.clamp((dx - prev.dx) * 0.22, -3, 3);
      slosh.vz += T.MathUtils.clamp((dr - prev.dr) * 0.05, -3, 3);
      prev.dx = dx; prev.dr = dr;
    }
    prev.x = rig.position.x; prev.rot = rotY; prev.primed = true;
    slosh.vx += (-55 * slosh.x - 2.4 * slosh.vx) * dt;
    slosh.vz += (-55 * slosh.z - 2.4 * slosh.vz) * dt;
    slosh.x = T.MathUtils.clamp(slosh.x + slosh.vx * dt, -0.55, 0.55);
    slosh.z = T.MathUtils.clamp(slosh.z + slosh.vz * dt, -0.55, 0.55);

    agit = Math.max(agit * Math.exp(-0.45 * dt), Math.min(1, Math.hypot(slosh.x, slosh.z) * 2.4));
    rise += dt * (1 + agit * 3.5);

    scene.updateMatrixWorld();
    body.localToWorld(fillPoint.set(0, cur.fill, 0));
    liquidUniforms.uCenter.value.copy(fillPoint);
    liquidUniforms.uNormal.value.set(slosh.x, 1, slosh.z).normalize();
    liquidUniforms.uScale.value = cur.zoom;
    liquidUniforms.uTime.value = time;
    liquidUniforms.uAgit.value = agit;
    liquidUniforms.uFoam.value = 0.022 + 0.15 * agit;
    bubbleUniforms.uRise.value = rise;
    bubbleUniforms.uFill.value = cur.fill;
    if (meter) meter.style.transform = 'scaleX(' + ((cur.fill - FILL_MIN) / (FILL_MAX - FILL_MIN)).toFixed(3) + ')';

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  resize();
  cur.x = narrow ? 0 : target.x * viewW;
  cur.y = target.y + (narrow ? 0.75 : 0);
  canvas.classList.add('ready');
  requestAnimationFrame(frame);
})();

/* Label artwork, painted onto canvases and used as textures on the bottle. */
(function () {
  'use strict';

  var INK = '#2a190b', GOLD = '#c9982f', GOLD_DARK = '#8c6212', CREAM = '#f7eec9';
  var DISPLAY = '"Ruslan Display", "Playfair Display", Georgia, serif';
  var SERIF = '"Playfair Display", Georgia, serif';

  function canvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  // Largest font size (up to `size`) at which `text` fits in `maxWidth`.
  function fit(ctx, text, weight, family, size, maxWidth) {
    ctx.font = weight + ' ' + size + 'px ' + family;
    var w = ctx.measureText(text).width;
    if (w > maxWidth) {
      size = Math.floor(size * maxWidth / w);
      ctx.font = weight + ' ' + size + 'px ' + family;
    }
    return size;
  }

  function spaced(ctx, text, x, y, spacing) {
    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = spacing + 'px';
      ctx.fillText(text, x + spacing / 2, y);
      ctx.letterSpacing = '0px';
    } else {
      ctx.fillText(text, x, y);
    }
  }

  function windmill(ctx, x, y, s, body, dark) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-0.27 * s, 0); ctx.lineTo(0.27 * s, 0);
    ctx.lineTo(0.16 * s, -0.78 * s); ctx.lineTo(-0.16 * s, -0.78 * s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(-0.21 * s, -0.78 * s); ctx.lineTo(0, -1.04 * s); ctx.lineTo(0.21 * s, -0.78 * s);
    ctx.closePath(); ctx.fill();
    ctx.fillRect(-0.05 * s, -0.24 * s, 0.1 * s, 0.24 * s);
    ctx.fillRect(-0.04 * s, -0.58 * s, 0.08 * s, 0.1 * s);
    // sails
    ctx.translate(0, -0.84 * s);
    ctx.rotate(0.62);
    ctx.strokeStyle = dark; ctx.lineCap = 'round';
    for (var i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.lineWidth = 0.035 * s;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -0.92 * s); ctx.stroke();
      ctx.lineWidth = 0.018 * s;
      ctx.strokeRect(0.02 * s, -0.9 * s, 0.17 * s, 0.62 * s);
      for (var k = 1; k < 5; k++) {
        ctx.beginPath();
        ctx.moveTo(0.02 * s, -0.9 * s + k * 0.124 * s);
        ctx.lineTo(0.19 * s, -0.9 * s + k * 0.124 * s);
        ctx.stroke();
      }
    }
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.arc(0, 0, 0.06 * s, 0, 7); ctx.fill();
    ctx.restore();
  }

  function tree(ctx, x, y, r, c1, c2) {
    ctx.fillStyle = c2;
    ctx.beginPath(); ctx.arc(x + r * 0.25, y + r * 0.1, r, 0, 7); ctx.fill();
    ctx.fillStyle = c1;
    ctx.beginPath(); ctx.arc(x - r * 0.2, y - r * 0.15, r * 0.85, 0, 7); ctx.fill();
  }

  function wheat(ctx, x, y, s, flip) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(flip ? -1 : 1, 1); ctx.rotate(-0.22);
    ctx.strokeStyle = GOLD_DARK; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, s); ctx.quadraticCurveTo(-s * 0.1, 0, 0, -s); ctx.stroke();
    ctx.fillStyle = GOLD;
    for (var i = 0; i < 7; i++) {
      var t = -s + i * s * 0.2;
      for (var d = -1; d <= 1; d += 2) {
        ctx.save();
        ctx.translate(d * s * 0.07, t + s * 0.1); ctx.rotate(d * 0.5);
        ctx.beginPath(); ctx.ellipse(0, 0, s * 0.055, s * 0.15, 0, 0, 7); ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function paper(ctx, w, h) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#fbf4d6'); g.addColorStop(1, '#efdfa6');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // faint fibre speckle
    ctx.fillStyle = 'rgba(140,100,30,.05)';
    for (var i = 0; i < 1400; i++) ctx.fillRect((i * 7919) % w, (i * 104729) % h, 3, 2);
  }

  function front() {
    var W = 2048, H = 1344, c = canvas(W, H), ctx = c.getContext('2d');
    var cx = W / 2;

    // label silhouette: arched top
    ctx.beginPath();
    ctx.moveTo(0, 190); ctx.quadraticCurveTo(cx, -70, W, 190);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.clip();
    paper(ctx, W, H);

    // landscape
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(40, 215); ctx.quadraticCurveTo(cx, -30, W - 40, 215);
    ctx.lineTo(W - 40, 500);
    ctx.bezierCurveTo(W * 0.75, 560, W * 0.62, 470, cx, 520);
    ctx.bezierCurveTo(W * 0.38, 570, W * 0.25, 470, 40, 520);
    ctx.closePath(); ctx.clip();
    var sky = ctx.createLinearGradient(0, 40, 0, 420);
    sky.addColorStop(0, '#bfe0ee'); sky.addColorStop(1, '#f6f1d2');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 600);
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    [[620, 150, 60], [700, 140, 80], [790, 160, 55], [1300, 120, 70], [1390, 135, 50]].forEach(function (p) {
      ctx.beginPath(); ctx.ellipse(p[0], p[1], p[2] * 1.5, p[2] * 0.5, 0, 0, 7); ctx.fill();
    });
    // far forest
    for (var i = 0; i < 34; i++) {
      var tx = 40 + i * 62, tr = 52 + ((i * 37) % 30);
      tree(ctx, tx, 300 - ((i * 53) % 26), tr, '#4f8f3a', '#2f6a2a');
    }
    // meadow and river
    ctx.fillStyle = '#7fb24a'; ctx.fillRect(0, 330, W, 300);
    ctx.fillStyle = '#a9d3e0';
    ctx.beginPath();
    ctx.moveTo(0, 400); ctx.bezierCurveTo(400, 350, 700, 430, 1050, 400);
    ctx.bezierCurveTo(1250, 385, 1300, 470, 900, 500); ctx.lineTo(0, 540); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.fillRect(200, 425, 260, 5); ctx.fillRect(520, 455, 200, 5); ctx.fillRect(120, 470, 160, 5);
    ctx.fillStyle = '#5f9a3c';
    ctx.beginPath(); ctx.moveTo(1050, 600); ctx.bezierCurveTo(1200, 400, 1700, 380, W, 420); ctx.lineTo(W, 600); ctx.closePath(); ctx.fill();
    // hut, mill, near trees
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(560, 285, 90, 50);
    ctx.fillStyle = '#5a3414'; ctx.beginPath(); ctx.moveTo(545, 288); ctx.lineTo(605, 245); ctx.lineTo(665, 288); ctx.closePath(); ctx.fill();
    windmill(ctx, 790, 345, 130, '#9a6b3a', '#4a2c12');
    tree(ctx, 1500, 300, 95, '#3f8a34', '#256026');
    tree(ctx, 1650, 320, 80, '#4f9a3a', '#2c6a2a');
    tree(ctx, 330, 330, 70, '#3f8a34', '#256026');
    // cart track and haystacks
    ctx.strokeStyle = '#c9b477'; ctx.lineWidth = 16;
    ctx.beginPath(); ctx.moveTo(1150, 520); ctx.bezierCurveTo(1300, 440, 1500, 430, 1800, 450); ctx.stroke();
    ctx.fillStyle = '#d9b24a';
    [[1280, 420, 46], [1380, 408, 36]].forEach(function (p) {
      ctx.beginPath(); ctx.ellipse(p[0], p[1], p[2], p[2] * 0.8, 0, Math.PI, 0); ctx.fill();
    });
    ctx.restore();

    // gold frame
    ctx.strokeStyle = GOLD; ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(40, 215); ctx.quadraticCurveTo(cx, -30, W - 40, 215);
    ctx.lineTo(W - 40, H - 40); ctx.lineTo(40, H - 40); ctx.closePath(); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeRect(62, 540, W - 124, H - 602);

    // wordmark
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
    function wordmark(text, x, y, size, maxW) {
      fit(ctx, text, '400', DISPLAY, size, maxW);
      ctx.strokeStyle = CREAM; ctx.lineWidth = 34; ctx.strokeText(text, x, y);
      ctx.strokeStyle = GOLD; ctx.lineWidth = 16; ctx.strokeText(text, x, y);
      ctx.fillStyle = INK; ctx.fillText(text, x, y);
    }
    wordmark('Старый', cx - 150, 720, 200, 620);
    wordmark('Мельник', cx, 965, 330, 1060);

    ctx.fillStyle = INK;
    fit(ctx, 'ИЗ БОЧОНКА', '700', SERIF, 96, 800);
    spaced(ctx, 'ИЗ БОЧОНКА', cx, 1085, 14);

    // ribbon
    var rw = 560, rh = 104, ry = 1140;
    var rg = ctx.createLinearGradient(0, ry, 0, ry + rh);
    rg.addColorStop(0, '#e8c25a'); rg.addColorStop(1, '#b98720');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(cx - rw / 2 - 60, ry); ctx.lineTo(cx + rw / 2 + 60, ry);
    ctx.lineTo(cx + rw / 2 + 20, ry + rh / 2); ctx.lineTo(cx + rw / 2 + 60, ry + rh);
    ctx.lineTo(cx - rw / 2 - 60, ry + rh); ctx.lineTo(cx - rw / 2 - 20, ry + rh / 2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = GOLD_DARK; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#3a2408';
    fit(ctx, 'МЯГКОЕ', '700', SERIF, 74, rw - 60);
    spaced(ctx, 'МЯГКОЕ', cx, ry + 78, 18);

    // side details
    ctx.fillStyle = INK; ctx.font = '700 44px ' + SERIF;
    ctx.fillText('Алк.', 330, 1010);
    ctx.fillText('4,3% об.', 330, 1064);
    wheat(ctx, 190, 880, 190, false);
    wheat(ctx, W - 190, 880, 190, true);
    ctx.strokeStyle = GOLD_DARK; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(W - 350, 1020, 70, 0, 7); ctx.stroke();
    windmill(ctx, W - 350, 1062, 70, GOLD, GOLD_DARK);
    return c;
  }

  function neck() {
    var W = 720, H = 640, c = canvas(W, H), ctx = c.getContext('2d');
    var cx = W / 2;
    ctx.beginPath();
    ctx.moveTo(150, 60); ctx.quadraticCurveTo(cx, -20, W - 150, 60);
    ctx.lineTo(W - 60, 470); ctx.quadraticCurveTo(cx, 700, 60, 470);
    ctx.closePath(); ctx.clip();
    paper(ctx, W, H);
    ctx.strokeStyle = GOLD; ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(172, 78); ctx.quadraticCurveTo(cx, 6, W - 172, 78);
    ctx.lineTo(W - 86, 462); ctx.quadraticCurveTo(cx, 664, 86, 462);
    ctx.closePath(); ctx.stroke();
    windmill(ctx, cx, 400, 250, '#b8873a', '#5a3712');
    ctx.fillStyle = INK; ctx.textAlign = 'center';
    fit(ctx, 'ИЗ БОЧОНКА', '700', SERIF, 46, 400);
    spaced(ctx, 'ИЗ БОЧОНКА', cx, 478, 6);
    return c;
  }

  function back() {
    var W = 1024, H = 1024, c = canvas(W, H), ctx = c.getContext('2d');
    var cx = W / 2;
    paper(ctx, W, H);
    ctx.strokeStyle = GOLD; ctx.lineWidth = 8; ctx.strokeRect(30, 30, W - 60, H - 60);
    ctx.textAlign = 'center'; ctx.fillStyle = INK;
    fit(ctx, 'Старый Мельник', '400', DISPLAY, 110, W - 160);
    ctx.fillText('Старый Мельник', cx, 170);
    ctx.fillStyle = GOLD_DARK;
    fit(ctx, 'ИЗ БОЧОНКА · МЯГКОЕ', '700', SERIF, 50, W - 200);
    ctx.fillText('ИЗ БОЧОНКА · МЯГКОЕ', cx, 250);
    ctx.fillStyle = INK; ctx.font = '400 40px ' + SERIF;
    ['Пиво светлое пастеризованное.', 'Мягкий вкус и золотистый цвет —', 'как из настоящего бочонка.', '', 'Алк. 4,3% об.', 'Подавать охлаждённым.']
      .forEach(function (line, i) { ctx.fillText(line, cx, 350 + i * 62); });
    // barcode
    ctx.fillStyle = '#fff'; ctx.fillRect(cx - 230, 740, 460, 210);
    ctx.fillStyle = '#111';
    var x = cx - 205;
    for (var i = 0; x < cx + 200; i++) {
      var bw = 3 + ((i * 7) % 4) * 3;
      if (i % 2 === 0) ctx.fillRect(x, 760, bw, 150);
      x += bw;
    }
    return c;
  }

  window.BottleLabels = { front: front, neck: neck, back: back };
})();

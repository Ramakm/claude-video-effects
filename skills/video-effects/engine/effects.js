// techwith.ram video effects: 20 canvas effects for talking-head clips.
// Every effect is fn(c, S) drawing one output frame. S holds:
//   F, C        current frame and person cutout (canvases, W x H)
//   W, H, u     output size and a unit (1% of the short side)
//   t, p, d     seconds into the effect window, progress 0..1, window length
//   k           in/out envelope 0..1 (0 = untouched frame)
//   face        {x, y, r} face centre and half-height in pixels (tracked)
//   hist(n)     {F, C} from n frames ago (half resolution)
//   o           options: text, color, ...

const INK = '#111111', BAN = '#B8D432', PAPER = '#F4F4F2';
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ss = (a, b, x) => { x = clamp((x - a) / (b - a)); return x * x * (3 - 2 * x); };
const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
const easeBack = x => { x = clamp(x); const s = 1.7; x -= 1; return x * x * ((s + 1) * x + s) + 1; };
const lerpRect = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));

function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
function shadow(c, blur, a, oy = 0) { c.shadowColor = `rgba(20,12,8,${a})`; c.shadowBlur = blur; c.shadowOffsetY = oy; }
function noShadow(c) { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0; }
function chip(c, x, y, w, h, r, fill, stroke, lw) { rr(c, x, y, w, h, r); c.fillStyle = fill; c.fill(); if (stroke) { c.lineWidth = lw || 2; c.strokeStyle = stroke; c.stroke(); } }
function font(c, px, mono, weight = 700) { c.font = `${weight} ${Math.max(1, px)}px ${mono ? 'SM' : 'SG'}`; }

// Draw img so it covers rect (x,y,w,h), cropping around a focus point (fx,fy in 0..1 of the image).
function cover(c, img, x, y, w, h, fx = .5, fy = .4) {
  const iw = img.width, ih = img.height, ra = w / h, ri = iw / ih;
  let sw = iw, sh = ih;
  if (ri > ra) sw = ih * ra; else sh = iw / ra;
  const sx = clamp(fx * iw - sw / 2, 0, iw - sw), sy = clamp(fy * ih - sh / 2, 0, ih - sh);
  c.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}
// Same crop maths, returning where the full image would land (so a cutout can be drawn aligned, unclipped).
function coverRect(img, x, y, w, h, fx = .5, fy = .4) {
  const iw = img.width, ih = img.height, ra = w / h, ri = iw / ih;
  let sw = iw, sh = ih;
  if (ri > ra) sw = ih * ra; else sh = iw / ra;
  const sx = clamp(fx * iw - sw / 2, 0, iw - sw), sy = clamp(fy * ih - sh / 2, 0, ih - sh);
  const s = w / sw;
  return [x - sx * s, y - sy * s, iw * s, ih * s];
}

const EFFECTS = {};
const META = {};
function fx(name, cat, desc, fn) { EFFECTS[name] = fn; META[name] = { cat, desc }; }

// ---------------------------------------------------------------- 01 grid-dive
fx('grid-dive', 'TRANSITION', "You're one tile in a wall of video", (c, S) => {
  const { W, H, u, F } = S, e = easeOut(S.k);
  c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
  const s = lerp(1, .27, e), w = W * s, h = H * s, g = 1.6 * u * s + e * u * .6;
  for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) {
    const x = W / 2 - w / 2 + i * (w + g), y = H / 2 - h / 2 + j * (h + g);
    if (x > W || y > H || x + w < 0 || y + h < 0) continue;
    c.save(); rr(c, x, y, w, h, 2.2 * u * s + u * e); c.clip();
    const src = (i || j) ? S.hist(4 + ((i * 7 + j * 13) % 40 + 40) % 40).F : F;
    c.drawImage(src, x, y, w, h); c.restore();
  }
});

// -------------------------------------------------------------- 02 title-orbit
fx('title-orbit', 'HOOK', 'Your title circles your head', (c, S) => {
  const { W, H, F, C, face, k, t } = S;
  c.drawImage(F, 0, 0, W, H);
  const label = (S.o.text || 'TITLE ORBIT').toUpperCase() + ' · ';
  const grow = lerp(.6, 1, easeOut(k));
  const cx = face.x, cy = face.y - face.r * .95, rx = Math.min(face.r * 1.9, W * .44) * grow, ry = face.r * .34 * grow;
  const fs = Math.min(face.r * .3, rx * .17), circ = TAU * Math.sqrt((rx * rx + ry * ry) / 2);
  const reps = Math.max(1, Math.round(circ / (fs * .78 * label.length))), txt = label.repeat(reps), n = txt.length, a0 = -t * 1.3;
  const draw = front => {
    for (let i = 0; i < n; i++) {
      const th = a0 + i * TAU / n, z = Math.sin(th);
      if ((z > 0) !== front) continue;
      c.save(); c.translate(cx - rx * Math.cos(th), cy + ry * z); c.scale(Math.max(.12, Math.abs(Math.sin(th))), 1);
      font(c, fs * (1 + .25 * z)); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.globalAlpha = k * (front ? 1 : .55); c.fillStyle = '#fff'; shadow(c, fs * .3, .55, fs * .05);
      c.fillText(txt[i], 0, 0); c.restore();
    }
  };
  draw(false); c.drawImage(C, 0, 0, W, H); draw(true);
});

// ---------------------------------------------------------- 03 magnifying-lens
fx('magnifying-lens', 'TRANSITION', 'A glass disc slides over your shot', (c, S) => {
  const { W, H, F, face, k, t, u } = S;
  c.drawImage(F, 0, 0, W, H);
  const r = face.r * 1.25 * easeBack(ss(0, .8, k)); if (r < 1) return;
  const x = face.x + face.r * 1.5 * Math.sin(t * 1.7), y = face.y + face.r * .55 * Math.sin(t * 3.1), z = 1.85;
  c.save(); shadow(c, r * .25, .45, r * .06); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = '#fff'; c.fill(); noShadow(c); c.clip();
  c.drawImage(F, x - x * z, y - y * z, W * z, H * z);
  const g = c.createRadialGradient(x - r * .45, y - r * .45, r * .05, x, y, r);
  g.addColorStop(0, 'rgba(255,255,255,.4)'); g.addColorStop(.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.28)');
  c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore();
  c.lineWidth = r * .07; c.strokeStyle = '#fff'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
  c.lineWidth = r * .025; c.strokeStyle = S.accent; c.beginPath(); c.arc(x, y, r * 1.05, 0, TAU); c.stroke();
});

// ------------------------------------------------------------------- 04 portal
fx('portal', 'HOOK', 'A ring of light you fly through', (c, S) => {
  const { W, H, F, face, k, t, u } = S;
  const z = 1 + .14 * k * (1 + Math.sin(t * 2.2)) / 2;
  c.drawImage(F, face.x - face.x * z, face.y - face.y * z, W * z, H * z);
  const R = Math.hypot(W, H) * .7;
  for (let i = 0; i < 3; i++) {
    const q = (t * .75 + i / 3) % 1, r = lerp(face.r * .25, R, q * q), a = Math.sin(Math.PI * q) * k;
    c.save(); c.globalAlpha = a; c.lineWidth = lerp(.4, 3.4, q) * u; c.shadowColor = i % 2 ? S.accent : BAN; c.shadowBlur = 3 * u;
    c.strokeStyle = i % 2 ? S.accent : BAN; c.beginPath(); c.ellipse(face.x, face.y, r, r * .94, 0, 0, TAU); c.stroke();
    c.lineWidth /= 3; c.strokeStyle = '#fff'; c.stroke(); c.restore();
  }
});

// --------------------------------------------------------------- 05 clone-room
fx('clone-room', 'HOOK', 'Copies of you step out behind you', (c, S) => {
  const { W, H, F, C, k, face } = S;
  c.drawImage(F, 0, 0, W, H);
  const clones = [[-.5, .7, .45, 22, .2], [.5, .7, .45, 30, .2], [-.3, .84, 0, 8, .5], [.3, .84, 0, 14, .5]];
  for (const [dx, s, dl, lag, lift] of clones) {
    const a = ss(dl, 1, k); if (a <= 0) continue;
    const w = W * s, h = H * s, y = face.y + face.r * lift - face.y * s;
    c.save(); c.globalAlpha = a; c.filter = 'saturate(.75) brightness(.88)';
    c.drawImage(S.hist(lag).C, face.x - face.x * s + dx * W * easeOut(a), lerp(H - h, y, easeOut(a)), w, h); c.restore();
  }
  c.drawImage(C, 0, 0, W, H);
});

// ------------------------------------------------------------ 06 infinite-zoom
fx('infinite-zoom', 'TRANSITION', 'Frames inside frames, then through', (c, S) => {
  const { W, H, F, p, u } = S;
  const s = .32, ox = .62, oy = .06, fxp = ox / (1 - s), fyp = oy / (1 - s);
  const z = Math.pow(1 / s, ss(.15, .9, p)), insetA = ss(0, .14, p) * (1 - ss(.86, 1, p));
  for (let L = 0; L < 5; L++) {
    const sc = Math.pow(s, L), x0 = L ? ox * (1 - sc) / (1 - s) : 0, y0 = L ? oy * (1 - sc) / (1 - s) : 0;
    const X = (fxp + z * (x0 - fxp)) * W, Y = (fyp + z * (y0 - fyp)) * H, w = W * sc * z, h = H * sc * z;
    if (w < 4) break;
    c.save();
    if (L > 0) { c.globalAlpha = L === 1 ? Math.max(insetA, ss(.15, .3, p)) * (L === 1 && p > .86 ? 1 : 1) : insetA; const b = Math.max(1, w * .022); shadow(c, w * .04, .35, w * .01); c.fillStyle = '#fff'; c.fillRect(X - b, Y - b, w + 2 * b, h + 2 * b); noShadow(c); }
    c.drawImage(F, X, Y, w, h); c.restore();
  }
});

// ---------------------------------------------------------------- 07 cube-spin
fx('cube-spin', 'TRANSITION', 'Your shot turns like a cube', (c, S) => {
  const { W, H, F, p } = S;
  const th = Math.PI / 2 * ss(.12, .88, p), m = 1 - .32 * Math.sin(2 * th);
  c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
  const d = W / 2 * m, hh = H * m, foc = W * 2.4, cy = H / 2, k0 = foc / (foc - d);
  c.save(); c.globalAlpha = .22 * Math.sin(2 * th); c.fillStyle = '#5a4038'; c.beginPath(); c.ellipse(W / 2, cy + hh / 2 + H * .03, d * 1.2, H * .02, 0, 0, TAU); c.fill(); c.restore();
  for (let f = 0; f < 2; f++) {
    const a = th - f * Math.PI / 2, nz = Math.cos(a); if (nz <= .001) continue;
    const pts = [[-d, d], [d, d]].map(([x, zz]) => { const X = x * Math.cos(a) + zz * Math.sin(a), Z = -x * Math.sin(a) + zz * Math.cos(a), kk = foc / (foc - Z) / k0; return [W / 2 + X * kk, hh * kk]; });
    const [[x1, h1], [x2, h2]] = pts, n = 80;
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n, xa = lerp(x1, x2, u0), xb = lerp(x1, x2, u1), h = lerp(h1, h2, (u0 + u1) / 2);
      c.drawImage(F, u0 * F.width, 0, F.width / n + 1, F.height, xa, cy - h / 2, xb - xa + .8, h);
    }
    c.fillStyle = `rgba(0,0,0,${(1 - nz) * .5})`; c.beginPath(); c.moveTo(x1, cy - h1 / 2); c.lineTo(x2, cy - h2 / 2); c.lineTo(x2, cy + h2 / 2); c.lineTo(x1, cy + h1 / 2); c.fill();
  }
});

// ------------------------------------------------------------- 08 liquid-glass
fx('liquid-glass', 'TRANSITION', 'A drop of glass becomes a pane', (c, S) => {
  const { W, H, F, k, u } = S;
  c.drawImage(F, 0, 0, W, H);
  const m = ss(0, 1, k); if (m <= 0) return;
  const h = Math.min(W, H) * .15, w = lerp(h, W * .8, ss(.15, 1, m)), x = W / 2 - w / 2, y = H * .8 - h / 2;
  c.save(); c.globalAlpha = ss(0, .15, m); shadow(c, 3 * u, .35, u); rr(c, x, y, w, h, h / 2); c.fillStyle = 'rgba(255,255,255,.2)'; c.fill(); noShadow(c); c.clip();
  c.filter = `blur(${1.4 * u}px) brightness(1.12)`; c.drawImage(F, -2 * u, -2 * u, W + 4 * u, H + 4 * u); c.filter = 'none';
  c.fillStyle = 'rgba(255,255,255,.26)'; c.fillRect(x, y, w, h);
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(x, y, w, h / 2); c.restore();
  c.save(); c.globalAlpha = ss(0, .15, m); rr(c, x, y, w, h, h / 2); c.lineWidth = .4 * u; c.strokeStyle = 'rgba(255,255,255,.95)'; c.stroke(); c.restore();
  const ia = ss(.7, 1, m); if (ia <= 0) return;
  c.save(); c.globalAlpha = ia; c.fillStyle = S.accent; c.strokeStyle = S.accent; c.lineWidth = h * .07; c.lineCap = 'round';
  const cy = y + h / 2, q = h * .2, xs = [.2, .4, .6, .8].map(v => x + w * v);
  c.beginPath(); c.moveTo(xs[0] - q, cy); c.lineTo(xs[0], cy - q); c.lineTo(xs[0] + q, cy); c.lineTo(xs[0] + q, cy + q); c.lineTo(xs[0] - q, cy + q); c.closePath(); c.fill();
  c.beginPath(); c.arc(xs[1] - q * .2, cy - q * .2, q * .75, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(xs[1] + q * .35, cy + q * .35); c.lineTo(xs[1] + q, cy + q); c.stroke();
  c.beginPath(); c.moveTo(xs[2] - q * .7, cy - q); c.lineTo(xs[2] + q, cy); c.lineTo(xs[2] - q * .7, cy + q); c.fill();
  c.beginPath(); c.arc(xs[3], cy - q * .45, q * .5, 0, TAU); c.fill(); c.beginPath(); c.arc(xs[3], cy + q * 1.1, q, Math.PI, TAU); c.fill(); c.restore();
});

// -------------------------------------------------------- 09 screen-in-screen
fx('screen-in-screen', 'SCREEN', 'You, playing on a laptop', (c, S) => {
  const { W, H, F, face, k, u } = S, e = easeOut(k);
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f6f7f6'); g.addColorStop(1, '#e6e8e6'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const sw = Math.min(W * .84, H * .5 * 1.6), sh = sw / 1.6, sx = W / 2 - sw / 2, sy = H * .46 - sh / 2;
  const [x, y, w, h] = lerpRect([0, 0, W, H], [sx, sy, sw, sh], e), b = sw * .025;
  c.save(); c.globalAlpha = e; shadow(c, 3 * u, .3, u); chip(c, x - b, y - b, w + 2 * b, h + 2 * b, b, '#1d1d1f'); noShadow(c);
  c.fillStyle = '#c3c8cb'; c.beginPath(); c.moveTo(x - w * .06, y + h + b); c.lineTo(x + w * 1.06, y + h + b); c.lineTo(x + w * 1.1, y + h + b + h * .07); c.lineTo(x - w * .1, y + h + b + h * .07); c.fill();
  c.fillStyle = '#9aa2a7'; rr(c, x + w * .44, y + h + b, w * .12, h * .02, h * .01); c.fill(); c.restore();
  cover(c, F, x, y, w, h, face.x / W, face.y / H);
});

// ------------------------------------------------------------- 10 frame-break
fx('frame-break', 'FRAME BREAK', 'Your head breaks out of a photo', (c, S) => {
  const { W, H, F, C, face, k, u } = S, e = easeOut(ss(0, .55, k)), b = ss(.35, 1, k);
  c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
  const pw = W * .72, ph = Math.min(pw * 1.05, H * .58), px = W / 2 - pw / 2, py = H * .6 - ph / 2;
  const [x, y, w, h] = lerpRect([0, 0, W, H], [px, py, pw, ph], e), m = pw * .045 * e;
  // where the full frame lands: scaled so the photo shows the face, then lifted so the head breaks out
  const sc = lerp(1, pw * 1.18 / W, e), iw = W * sc, ih = H * sc;
  const ix = lerp(0, W / 2 - face.x * sc, e), iy = lerp(0, py + ph * .42 - face.y * sc, e) - b * face.r * sc * 1.75;
  c.save(); c.translate(W / 2, H * .6); c.rotate(-.045 * e); c.translate(-W / 2, -H * .6);
  shadow(c, 3 * u * e, .3, u * e); c.fillStyle = '#fff'; c.fillRect(x - m, y - m, w + 2 * m, h + m * 3.2); noShadow(c);
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.drawImage(F, ix, iy, iw, ih); c.restore();
  if (b > 0) { c.save(); c.beginPath(); c.rect(-W, -H, 3 * W, y + H + 1); c.clip(); c.drawImage(C, ix, iy, iw, ih); c.restore(); }
  c.restore();
  for (let i = 0; i < 10; i++) {
    const L = i < 5, a = L ? -Math.PI * (.6 + .08 * i) : -Math.PI * (.4 - .08 * (i - 5)), dd = b * (6 + (i * 37) % 8) * u;
    const sx = (L ? px + pw * (.04 + .06 * i) : px + pw * (.7 + .06 * (i - 5))) + Math.cos(a) * dd, sy = py + Math.sin(a) * dd;
    c.save(); c.globalAlpha = ss(0, .3, b); c.translate(sx, sy); c.rotate(i + b * 3); c.fillStyle = i % 3 ? '#fff' : S.accent; shadow(c, u, .3);
    const q = 1.6 * u; c.beginPath(); c.moveTo(0, -q); c.lineTo(q * 1.3, q * .7); c.lineTo(-q, q * .9); c.fill(); c.restore();
  }
});

// -------------------------------------------------------------- 11 tile-tunnel
fx('tile-tunnel', 'TRANSITION', 'A tunnel of tiles opens behind you', (c, S) => {
  const { W, H, F, k, t, u } = S, e = easeOut(k);
  c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
  const q = (t * .6) % 2, base = .72;
  for (let j = -2; j <= 10; j++) {
    const s = Math.pow(base, j - q); if (s > 2.2) continue;
    const w = W * s, h = H * s; c.fillStyle = (((j % 2) + 2) % 2) ? '#FFEBD6' : '#fff'; c.fillRect(W / 2 - w / 2, H / 2 - h / 2, w, h);
    c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = .15 * u; c.strokeRect(W / 2 - w / 2, H / 2 - h / 2, w, h);
  }
  const vw = W * .44, vh = H * .44; c.strokeStyle = 'rgba(0,0,0,.12)';
  for (let i = 0; i <= 6; i++) { const v = i / 6; for (const [ax, ay, bx, by] of [[v * W, 0, W / 2 - vw / 2 + v * vw, H / 2 - vh / 2], [v * W, H, W / 2 - vw / 2 + v * vw, H / 2 + vh / 2], [0, v * H, W / 2 - vw / 2, H / 2 - vh / 2 + v * vh], [W, v * H, W / 2 + vw / 2, H / 2 - vh / 2 + v * vh]]) { c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); } }
  const [x, y, w, h] = lerpRect([0, 0, W, H], [W / 2 - vw / 2, H / 2 - vh / 2, vw, vh], e);
  c.save(); shadow(c, 3 * u * e, .35, u * e); c.fillStyle = '#fff'; const bb = .6 * u * e; c.fillRect(x - bb, y - bb, w + 2 * bb, h + 2 * bb); noShadow(c); c.drawImage(F, x, y, w, h); c.restore();
});

// ------------------------------------------------------------------ 12 depth-ui
fx('depth-ui', 'SCREEN', 'App windows float around you', (c, S) => {
  const { W, H, F, face, k, t, u } = S, z = 1 + .05 * k;
  c.drawImage(F, face.x - face.x * z, face.y - face.y * z, W * z, H * z);
  const pop = d => easeBack(ss(d, d + .45, k)), fl = ph => Math.sin(t * 1.6 + ph);
  const cw = W * .4;
  // A: Claude chat card (top-left)
  let a = pop(0); if (a > 0) { c.save(); c.globalAlpha = clamp(a); c.translate(W * .05 + cw / 2 + fl(0) * u, H * .05 + cw * .35 + fl(1) * u); c.scale(a, a); shadow(c, 4 * u, .35, u);
    chip(c, -cw / 2, -cw * .35, cw, cw * .7, 2.4 * u, '#fff'); noShadow(c); c.fillStyle = S.accent; font(c, cw * .085); c.textBaseline = 'middle'; c.fillText('✦ Claude', -cw * .4, -cw * .22);
    c.fillStyle = 'rgba(255,138,31,.4)'; for (let i = 0; i < 3; i++) { rr(c, -cw * .4, -cw * .08 + i * cw * .1, cw * (i % 2 ? .55 : .8), cw * .045, cw * .02); c.fill(); } c.restore(); }
  // B: terminal card (top-right)
  a = pop(.12); if (a > 0) { c.save(); c.globalAlpha = clamp(a); c.translate(W * .95 - cw / 2 + fl(2) * u, H * .05 + cw * .95 + fl(3) * u); c.scale(a, a); shadow(c, 4 * u, .4, u);
    chip(c, -cw / 2, -cw * .3, cw, cw * .6, 2.4 * u, '#1d1d1f'); noShadow(c); font(c, cw * .062, true); c.textBaseline = 'middle';
    c.fillStyle = BAN; c.fillText('$ claude render', -cw * .42, -cw * .15); c.fillText('effects: 20 ✓', -cw * .42, 0); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillText('frames ' + Math.min(216, Math.floor(t * 72)) + '/216', -cw * .42, cw * .15); c.restore(); }
  // C: "Reel ready" chip under the face
  a = pop(.24); if (a > 0) { const label = S.o.text || 'Reel ready', cwid = cw * 1.05, chh = cw * .26;
    c.save(); c.globalAlpha = clamp(a); c.translate(clamp(face.x + face.r * 1.3, cwid / 2 + 2 * u, W - cwid / 2 - 2 * u) + fl(4) * u, clamp(face.y + face.r * 2, 0, H * .9)); c.scale(a, a); shadow(c, 4 * u, .35, u);
    chip(c, -cwid / 2, -chh / 2, cwid, chh, chh / 2, '#fff', BAN, .5 * u); noShadow(c);
    c.fillStyle = BAN; c.beginPath(); c.arc(-cwid / 2 + chh * .55, 0, chh * .32, 0, TAU); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = chh * .09; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-cwid / 2 + chh * .4, 0); c.lineTo(-cwid / 2 + chh * .52, chh * .12); c.lineTo(-cwid / 2 + chh * .72, -chh * .14); c.stroke();
    c.fillStyle = INK; font(c, chh * .38); c.textBaseline = 'middle'; c.fillText(label, -cwid / 2 + chh * 1.05, chh * .02); c.restore(); }
});

// -------------------------------------------------------------------- 13 vertigo
fx('vertigo', 'HOOK', "The room stretches, you don't", (c, S) => {
  const { W, H, F, C, face, k, u } = S, z = lerp(1, .6, easeOut(k));
  c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
  c.save(); c.globalAlpha = k; c.strokeStyle = S.accent; c.lineWidth = .3 * u; const R = Math.hypot(W, H);
  for (let i = 0; i < 64; i++) { const a = i / 64 * TAU + .03; c.beginPath(); c.moveTo(face.x + Math.cos(a) * face.r, face.y + Math.sin(a) * face.r); c.lineTo(face.x + Math.cos(a) * R, face.y + Math.sin(a) * R); c.stroke(); } c.restore();
  const x = face.x - face.x * z, y = face.y - face.y * z, b = .7 * u * k;
  c.fillStyle = BAN; c.fillRect(x - b, y - b, W * z + 2 * b, H * z + 2 * b); c.drawImage(F, x, y, W * z, H * z);
  c.drawImage(C, 0, 0, W, H);
});

// ------------------------------------------------------------------ 14 phone-fan
fx('phone-fan', 'SCREEN', 'Phones fan out like a hand of cards', (c, S) => {
  const { W, H, F, face, k, u } = S, e = easeOut(ss(0, .6, k)), a = .38 * easeBack(ss(.45, 1, k));
  c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
  const pw = Math.min(W * .46, H * .48 / 2.05), ph = pw * 2.05, pvx = W / 2, pvy = H * .5 + ph * .62;
  const side = (ang, kind) => { if (a <= 0) return; c.save(); c.translate(pvx, pvy); c.rotate(ang); c.translate(-pw / 2, -ph * 1.12);
    shadow(c, 3 * u, .3, u); chip(c, 0, 0, pw, ph, pw * .12, '#1d1d1f'); noShadow(c); c.save(); rr(c, pw * .03, pw * .03, pw * .94, ph - pw * .06, pw * .1); c.clip();
    if (kind) { const g = c.createLinearGradient(0, 0, pw, ph); g.addColorStop(0, S.accent); g.addColorStop(1, '#ffd2a8'); c.fillStyle = g; c.fillRect(0, 0, pw, ph); }
    else { c.fillStyle = '#f1f6e0'; c.fillRect(0, 0, pw, ph); c.fillStyle = BAN; for (let i = 0; i < 3; i++) for (let j = 0; j < 6; j++) { rr(c, pw * (.08 + i * .29), ph * (.06 + j * .15), pw * .24, ph * .12, pw * .04); c.fill(); } }
    c.restore(); c.restore(); };
  side(-a, 1); side(a, 0);
  const tgt = [W / 2 - pw / 2, pvy - ph * 1.12, pw, ph], [x, y, w, h] = lerpRect([0, 0, W, H], tgt, e), bz = pw * .03 * e;
  c.save(); shadow(c, 3 * u * e, .3, u * e); chip(c, x - bz, y - bz, w + 2 * bz, h + 2 * bz, pw * .12 * e, '#1d1d1f'); noShadow(c);
  rr(c, x, y, w, h, pw * .1 * e); c.clip(); cover(c, F, x, y, w, h, face.x / W, face.y / H); c.restore();
});

// -------------------------------------------------------------------- 15 shatter
let TRI = null;
function tris(W, H) {
  if (TRI && TRI.W === W && TRI.H === H) return TRI.t;
  const cols = 7, rows = Math.max(4, Math.round(7 * H / W)), pts = []; let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) { let x = i / cols * W, y = j / rows * H; if (i > 0 && i < cols) x += (rnd() - .5) * W / cols * .7; if (j > 0 && j < rows) y += (rnd() - .5) * H / rows * .7; pts.push([x, y]); }
  const t = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = j * (cols + 1) + i, b = a + 1, cc = a + cols + 1, d = cc + 1;
    if (rnd() < .5) t.push([pts[a], pts[b], pts[d]], [pts[a], pts[d], pts[cc]]); else t.push([pts[a], pts[b], pts[cc]], [pts[b], pts[d], pts[cc]]); }
  TRI = { W, H, t: t.map(q => ({ q, cx: (q[0][0] + q[1][0] + q[2][0]) / 3, cy: (q[0][1] + q[1][1] + q[2][1]) / 3, r: (rnd() - .5) * 2.4, k: .7 + rnd() * .8 })) };
  return TRI.t;
}
fx('shatter', 'TRANSITION', 'Your shot cracks like glass', (c, S) => {
  const { W, H, F, face, p, u } = S;
  const e = ss(.3, .55, p) - ss(.66, .92, p), cr = ss(.08, .26, p) * (1 - ss(.3, .4, p));
  c.fillStyle = '#111'; c.fillRect(0, 0, W, H);
  for (const s of tris(W, H)) {
    const dx = (s.cx - face.x) * e * s.k * .9, dy = (s.cy - face.y) * e * s.k * .9 + e * e * 4 * u;
    c.save(); c.translate(s.cx + dx, s.cy + dy); c.rotate(s.r * e); c.translate(-s.cx, -s.cy);
    c.beginPath(); c.moveTo(...s.q[0]); c.lineTo(...s.q[1]); c.lineTo(...s.q[2]); c.closePath();
    c.save(); c.clip(); c.drawImage(F, 0, 0, W, H); c.restore();
    const ln = Math.max(cr, e); if (ln > 0) { c.lineWidth = .3 * u; c.strokeStyle = `rgba(255,255,255,${ln * .9})`; c.stroke(); }
    c.restore();
  }
});

// ------------------------------------------------------------------ 16 spotlight
fx('spotlight', 'HOOK', 'One theatre light finds your face', (c, S) => {
  const { W, H, F, face, k, p } = S;
  c.drawImage(F, 0, 0, W, H);
  const x = face.x + W * .38 * (1 - easeOut(ss(.04, .42, p))), y = face.y - face.r * .1, r = face.r * 2;
  const g = c.createRadialGradient(x, y, r * .5, x, y, r * 1.1);
  g.addColorStop(0, 'rgba(10,6,6,0)'); g.addColorStop(1, `rgba(10,6,6,${.9 * k})`); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.globalAlpha = .14 * k; c.fillStyle = '#fff6e2'; c.beginPath(); c.moveTo(x - r * .35, 0); c.lineTo(x + r * .35, 0); c.lineTo(x + r * .8, y); c.lineTo(x - r * .8, y); c.fill(); c.restore();
});

// ----------------------------------------------------------- 17 pull-back-reveal
fx('pull-back-reveal', 'SCREEN', "You're inside a video editor", (c, S) => {
  const { W, H, F, k, t, u } = S, e = easeOut(k);
  c.fillStyle = '#1b1b1e'; c.fillRect(0, 0, W, H);
  const s = lerp(1, .6, e), w = W * s, h = H * s, x = W / 2 - w / 2, y = lerp(0, H * .05, e), tl = y + h + 2 * u;
  c.save(); c.globalAlpha = e;
  c.fillStyle = '#2b2b30'; c.fillRect(0, 0, x - u, tl - u); c.fillRect(x + w + u, 0, W - x - w - u, tl - u);
  c.fillStyle = '#26262a'; c.fillRect(0, tl, W, H - tl);
  const rows = 4, rh = (H - tl - 4 * u) / rows, cols = [S.accent, BAN, '#6b6b72', S.accent, BAN, '#6b6b72', S.accent, BAN];
  for (let r = 0; r < rows; r++) for (let j = 0; j < 2; j++) { const x0 = W * ((r * .23 + j * .52) % 1) * .9, w0 = W * (.25 + .15 * ((r + j) % 3)); rr(c, x0, tl + 2 * u + r * rh, Math.min(w0, W - x0 - u), rh * .7, rh * .15); c.fillStyle = cols[(r * 2 + j) % cols.length]; c.fill(); }
  c.fillStyle = S.accent; c.fillRect(W * (.1 + .8 * ((t * .25) % 1)), tl, .4 * u, H - tl);
  c.restore();
  c.drawImage(F, x, y, w, h);
  if (e > .02) { c.strokeStyle = BAN; c.lineWidth = .4 * u * e; c.strokeRect(x, y, w, h); }
});

// --------------------------------------------------------------- 18 ribbon-wrap
fx('ribbon-wrap', 'FRAME BREAK', 'A ribbon carries your words', (c, S) => {
  const { W, H, F, C, face, k, t } = S;
  c.drawImage(F, 0, 0, W, H);
  const label = (S.o.text || 'RIBBON WRAP').toUpperCase() + ' · ';
  const cx = face.x, cy = Math.min(face.y + face.r * 2.15, H * .86), rx = Math.min(face.r * 2.6, W * .6), ry = face.r * .42, rot = -.1;
  const bw = face.r * .44 * easeOut(k); if (bw < 1) return;
  const P = th => { const x = -rx * Math.cos(th), y = ry * Math.sin(th); return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]; };
  const circ = TAU * Math.sqrt((rx * rx + ry * ry) / 2), cw = bw * .42, reps = Math.max(1, Math.round(circ / (cw * label.length))), m = reps * label.length, off = t * .8;
  const band = front => {
    const n = 120;
    for (let i = 0; i < n; i++) { const a = i / n * TAU, b = (i + 1.2) / n * TAU, z = Math.sin((a + b) / 2); if ((z > 0) !== front) continue; const A = P(a), B = P(b);
      c.beginPath(); c.moveTo(A[0], A[1] - bw / 2); c.lineTo(B[0], B[1] - bw / 2); c.lineTo(B[0], B[1] + bw / 2); c.lineTo(A[0], A[1] + bw / 2); c.fillStyle = front ? S.accent : S.accentDark; c.fill(); }
    for (let i = 0; i < m; i++) { const th = i / m * TAU + off, z = Math.sin(th); if ((z > 0) !== front) continue; const [x, y] = P(th), [x2, y2] = P(th + .01);
      c.save(); c.translate(x, y); c.rotate(Math.atan2(y2 - y, x2 - x)); font(c, bw * .56, true); c.fillStyle = front ? INK : 'rgba(17,17,17,.55)'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label[i % label.length], 0, bw * .04); c.restore(); }
  };
  band(false); c.drawImage(C, 0, 0, W, H); band(true);
});

// -------------------------------------------------------------- 19 zoom-through
fx('zoom-through', 'SCREEN', 'A Claude chat flies into your clip', (c, S) => {
  const { W, H, F, p, u } = S;
  c.drawImage(F, 0, 0, W, H);
  const q = ss(.05, .95, p), s = .12 * Math.pow(30, q), a = ss(0, .15, q) * (1 - ss(.72, .92, q)); if (a <= 0) return;
  const cw = Math.min(W, H) * .62, ch = cw * .62, prompt = S.o.text || '/zoom-through';
  c.save(); c.globalAlpha = a; c.translate(W / 2, H * .5); c.scale(s, s); shadow(c, cw * .06, .35, cw * .02);
  chip(c, -cw / 2, -ch / 2, cw, ch, cw * .06, '#fff'); noShadow(c);
  c.fillStyle = S.accent; font(c, cw * .075); c.textBaseline = 'middle'; c.fillText('✦ Claude', -cw * .42, -ch * .34);
  chip(c, -cw * .42, -ch * .18, cw * .58, ch * .14, ch * .07, '#eef0ee'); chip(c, -cw * .16, ch * .02, cw * .58, ch * .14, ch * .07, '#ffe5cc');
  chip(c, -cw * .42, ch * .24, cw * .84, ch * .16, ch * .08, '#fff', BAN, cw * .008);
  c.fillStyle = INK; font(c, cw * .048, true); c.fillText(prompt, -cw * .37, ch * .325); c.restore();
});

// -------------------------------------------------------------- 20 head-pop-out
fx('head-pop-out', 'FRAME BREAK', 'Your head springs out of a panel', (c, S) => {
  const { W, H, F, C, face, k, u } = S, e = easeOut(ss(0, .5, k)), sp = easeBack(ss(.35, .85, k));
  c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
  const px = W * .08, pw = W * .84, py = H * .44, ph = H * .5;
  const [x, y, w, h] = lerpRect([0, 0, W, H], [px, py, pw, ph], e);
  const s0 = pw * 1.05 / W, sT = Math.max(s0, (py + ph - (py - face.r * s0 * .55)) / Math.max(1, H - face.y) * 1.04);
  const sc = lerp(1, sT, e), iw = W * sc, ih = H * sc;
  const ix = lerp(0, W / 2 - face.x * sc, e), fyIn = py + face.r * sc * 1.9, fyOut = py - face.r * sc * .55;
  const iy = lerp(0, lerp(fyIn, fyOut, sp) - face.y * sc, e);
  c.save(); rr(c, x, y, w, h, 2 * u * e); c.fillStyle = PAPER; c.fill(); c.clip(); c.drawImage(F, ix, iy, iw, ih); c.restore();
  rr(c, x, y, w, h, 2 * u * e); c.lineWidth = .8 * u * e; c.strokeStyle = S.accent; c.stroke();
  if (sp > 0) { c.save(); c.beginPath(); c.rect(0, 0, W, y + .4 * u); c.clip(); c.drawImage(C, ix, iy, iw, ih); c.restore(); }
  const tag = (S.o.text || 'START HERE').toUpperCase(), ta = ss(.5, .8, k);
  if (ta > 0) { font(c, 2.6 * u, true); const tw = c.measureText(tag).width + 4 * u, th = 5.2 * u;
    c.save(); c.globalAlpha = ta; chip(c, W * .92 - tw, H * .06, tw, th, 1.2 * u, S.accent); c.fillStyle = INK; c.textBaseline = 'middle'; c.fillText(tag, W * .92 - tw + 2 * u, H * .06 + th / 2); c.restore(); }
});

if (typeof window !== 'undefined') { window.EFFECTS = EFFECTS; window.META = META; }

/* ============================================================
   kimono-field.js — TECIDO DE MOTIVOS
   ------------------------------------------------------------
   PRINCÍPIO (o que faz parecer TECIDO e não ladrilhos):
   as LINHAS do padrão são uma MALHA CONTÍNUA de vértices COMPARTILHADOS.
   Cada quadro, todo vértice é deslocado pela mesma ONDA VIAJANTE; como
   vértices vizinhos (e os compartilhados entre unidades adjacentes) se
   movem juntos, as linhas DOBRAM em conjunto e fluem ATRAVÉS das fronteiras
   das unidades — o tecido inteiro ondula como um pano só, sem nenhuma
   unidade se soltar nem abrir vão.

   • 0 · 青海波 seigaiha — escamas de arcos sobrepostos (SPRITES; os arcos já
     fluem de uma escama p/ a outra). Mantido como está: é o exemplo certo.
   • 1 · 麻葉 asanoha   — malha hexagonal de linhas (raios + estrela), cantos
     COMPARTILHADOS entre hexágonos → teia contínua.
   • 2 · 矢羽根 yabane   — colunas de chevrons cujas linhas são zigue-zagues
     CONTÍNUOS (vértices compartilhados verticalmente).
   • 3 · 亀甲花 kikkō    — rede de casco (favo) de linhas CONTÍNUAS + flores.

   Desempenho: cada motivo monta sua geometria em poucos Path2D (1-3 fills,
   1-2 strokes) → poucas chamadas de desenho, sem milhares de stroke()
   isolados. Tudo determinístico por posição de repouso → nada pisca.

   KimonoField.P (tweenável p/ GSAP):
     patternMix 0..3 · life 1..0 · waveAmp px · scatter 0..1 ·
     opacity · unitScale · density
   ============================================================ */
(function (global) {
  const TAU = Math.PI * 2, SQ3 = Math.sqrt(3), PI6 = Math.PI / 6, PI3 = Math.PI / 3;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const hexc = (h) => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const css = (c, al) => al == null ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${al})`;
  const hash2 = (i, j) => (((i * 73856093) ^ (j * 19349663)) >>> 0) / 4294967295;

  const MOT = [
    { pal: { a: '#15294f', b: '#2f5c98', c: '#5e90c9', hi: '#bcd7f2', bg: '#0c1834' } }, // seigaiha índigo
    { pal: { a: '#11313f', b: '#23596b', c: '#52a6b3', hi: '#cdeee6', bg: '#081a24' } }, // asanoha teal
    { pal: { a: '#5e1820', b: '#a3303a', c: '#d07a6a', hi: '#f3d3c6', bg: '#330c11' } }, // yabane beni
    { pal: { a: '#6f1a1f', b: '#b3742a', c: '#d8a23c', hi: '#f6df93', bg: '#380e12' } }, // kikkō ouro/vermelho
  ];
  const NMOT = MOT.length;

  let canvas, ctx, W, H, dpr, raf = 0, running = false, t0 = 0, curT = 0;
  let MARGIN = 0, sdpr = 2, dispR = 50;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const P = { patternMix: 0, life: 1, waveAmp: 13, waveSpeed: 1, scatter: 0, opacity: 1, unitScale: 1, density: 1 };

  /* tamanhos por motivo */
  const seigR = () => clamp(Math.min(W, H) / (11 * P.density), 44, 104);
  const asaR = () => clamp(Math.min(W, H) / (15 * P.density), 34, 74);
  const yabR = () => clamp(Math.min(W, H) / (13 * P.density), 40, 84);
  const kikR = () => clamp(Math.min(W, H) / (16 * P.density), 32, 70);
  const meshR = () => clamp(Math.min(W, H) / (17 * P.density), 28, 62);

  /* ===================== ONDA: deslocamento de UM vértice (repouso → animado) =====================
     Baixa frequência → vértices vizinhos andam quase juntos → as linhas que
     os ligam dobram coerentemente. 'scatter' espalha por hash da posição de
     repouso (compartilhado → a teia se desfaz mas continua ligada). */
  function D(x, y) {
    const t = curT * P.waveSpeed, amp = P.waveAmp;
    const p1 = x * 0.0034 + y * 0.0022 - t * 0.85;
    const p2 = x * 0.0019 - y * 0.0031 - t * 0.55;
    let X = x + amp * (0.62 * Math.sin(p1) + 0.38 * Math.sin(p2));
    let Y = y + amp * (0.50 * Math.cos(p1) + 0.30 * Math.sin(p2 * 1.15));
    if (P.scatter > 0) {
      const a = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; const f = a - Math.floor(a);
      const ang = f * TAU, m = P.scatter * dispR * 2.2;
      X += Math.cos(ang) * m; Y += Math.sin(ang) * m - P.scatter * dispR * 0.6;
    }
    return [X, Y];
  }

  /* helpers de path */
  const mv = (p, q) => p.moveTo(q[0], q[1]);
  const ln = (p, q) => p.lineTo(q[0], q[1]);
  function poly(p, pts) { mv(p, pts[0]); for (let i = 1; i < pts.length; i++) ln(p, pts[i]); p.closePath(); }
  function seg(p, a, b) { mv(p, a); ln(p, b); }
  function dot(p, c, r) { p.moveTo(c[0] + r, c[1]); p.arc(c[0], c[1], r, 0, TAU); }

  /* ===================== 0 · SEIGAIHA (sprites de escama) ===================== */
  function spriteCanvas(ext, draw) {
    const s = document.createElement('canvas');
    s.width = s.height = Math.ceil(ext * 2 * sdpr);
    const g = s.getContext('2d');
    g.setTransform(sdpr, 0, 0, sdpr, ext * sdpr, ext * sdpr);
    g.lineJoin = 'round'; g.lineCap = 'round';
    draw(g);
    return { cn: s, ext };
  }
  function spSeigaihaUnit(P_, r, variant) {
    return spriteCanvas(r * 1.12, (g) => {
      g.fillStyle = css(variant === 1 ? P_.a : P_.b);
      g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
      const rings = 7; g.lineWidth = Math.max(1.1, r * 0.072);
      for (let k = rings; k >= 1; k--) { g.strokeStyle = css(k & 1 ? P_.hi : P_.c, 0.95); g.beginPath(); g.arc(0, 0, r * (k / rings), 0, TAU); g.stroke(); }
      g.lineWidth = Math.max(1, r * 0.05); g.strokeStyle = css(P_.bg, 0.55); g.beginPath(); g.arc(0, 0, r * 0.992, 0, TAU); g.stroke();
      if (variant === 2) {
        g.fillStyle = css(P_.hi);
        for (let i = 0; i < 6; i++) { const a = i * PI3, px = Math.cos(a) * r * 0.2, py = -r * 0.04 + Math.sin(a) * r * 0.2; g.beginPath(); g.ellipse(px, py, r * 0.16, r * 0.08, a, 0, TAU); g.fill(); }
        g.fillStyle = css(P_.a); g.beginPath(); g.arc(0, -r * 0.04, r * 0.1, 0, TAU); g.fill();
      }
    });
  }
  let seigSprites = [];
  function drawSeigaiha(alpha) {
    const r = seigR(), dx = r * 1.16, dy = r * 0.64, rowOff = r * 0.58;
    const amp = P.waveAmp, t = curT * P.waveSpeed, sct = P.scatter;
    let row = Math.floor(-MARGIN / dy) - 1;
    for (let ly = row * dy; ly < H + MARGIN; ly += dy, row++) {
      const ox = (row & 1) ? rowOff : 0; let col = 0;
      for (let lx = -MARGIN + ox; lx < W + MARGIN; lx += dx, col++) {
        const p1 = lx * 0.0034 + ly * 0.0022 - t * 0.85, p2 = lx * 0.0019 - ly * 0.0031 - t * 0.55;
        const s1 = Math.sin(p1), c1 = Math.cos(p1), s2 = Math.sin(p2);
        let ddx = amp * (0.62 * s1 + 0.38 * s2), ddy = amp * (0.50 * c1 + 0.30 * Math.sin(p2 * 1.15));
        let scl = 1 + 0.045 * s1, al = alpha;
        if (sct > 0) { const h = hash2(col + 5, row + 9), a = h * TAU, mg = sct * r * 2.4; ddx += Math.cos(a) * mg; ddy += Math.sin(a) * mg * 0.9 - sct * r * 0.7; scl *= 1 - sct * 0.35; al *= 1 - sct * 0.55; }
        const spr = seigSprites[hash2(col, row) < 0.1 ? 2 : (hash2(col, row) < 0.55 ? 0 : 1)];
        const e = spr.ext * scl; ctx.globalAlpha = al;
        ctx.drawImage(spr.cn, lx + ddx - e, ly + ddy - e, e * 2, e * 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ===================== MOTOR DE ESCAMAS (shingle) =====================
     A MESMA receita do seigaiha (a única que o usuário aprovou), agora geral:
     unidades NÍTIDAS, OPACAS e SOBREPOSTAS, empilhadas de trás p/ frente, com
     a âncora deslocada por uma onda suave (amplitude < sobreposição). Como as
     unidades se sobrepõem, NUNCA abre vão e a forma NUNCA vira "linha torta";
     como cada uma anda numa fase de onda um pouco diferente, elas DESLIZAM
     sobre as vizinhas (a oclusão migra) = interação real, como as escamas do
     seigaiha. 1 drawImage por unidade → leve, nítido, sem piscar. */
  function shingle(sprArr, geom, alpha) {
    const { dx, dy, rowOff, r, pick } = geom;
    const amp = P.waveAmp, t = curT * P.waveSpeed, sct = P.scatter;
    let row = Math.floor(-MARGIN / dy) - 1;
    for (let ly = row * dy; ly < H + MARGIN; ly += dy, row++) {
      const ox = (rowOff && (row & 1)) ? rowOff : 0; let col = 0;
      for (let lx = -MARGIN + ox; lx < W + MARGIN; lx += dx, col++) {
        const p1 = lx * 0.0034 + ly * 0.0022 - t * 0.85, p2 = lx * 0.0019 - ly * 0.0031 - t * 0.55;
        const s1 = Math.sin(p1), c1 = Math.cos(p1), s2 = Math.sin(p2);
        let ddx = amp * (0.62 * s1 + 0.38 * s2), ddy = amp * (0.50 * c1 + 0.30 * Math.sin(p2 * 1.15));
        let scl = 1 + 0.045 * s1, al = alpha;
        if (sct > 0) { const h = hash2(col + 5, row + 9), a = h * TAU, mg = sct * r * 2.4; ddx += Math.cos(a) * mg; ddy += Math.sin(a) * mg * 0.9 - sct * r * 0.7; scl *= 1 - sct * 0.35; al *= 1 - sct * 0.55; }
        const spr = sprArr[pick(col, row)];
        const e = spr.ext * scl; ctx.globalAlpha = al;
        ctx.drawImage(spr.cn, lx + ddx - e, ly + ddy - e, e * 2, e * 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---- 1 · ASANOHA — placa hexagonal nítida com estrela de cânhamo (verde-azul) ---- */
  function drawAsanoha(alpha) {
    const r = asaR();
    shingle(asaSprites, { dx: SQ3 * r, dy: 1.5 * r, rowOff: SQ3 * r / 2, r, pick: (c, w) => { const h = hash2(c, w); return h < 0.16 ? 2 : (h < 0.58 ? 0 : 1); } }, alpha);
  }

  /* ---- 2 · YABANE — penas de flecha empilhadas (vermelho), colunas alternam ---- */
  function drawYabane(alpha) {
    const r = yabR();
    shingle(yabSprites, { dx: r * 1.18, dy: r * 0.82, rowOff: 0, r, pick: (c) => (c & 1) ? 1 : 0 }, alpha);
  }

  /* ---- 3 · KIKKŌ-HANA — cascos de tartaruga nítidos + flores (dourado) ---- */
  function drawKikko(alpha) {
    const r = kikR();
    shingle(kikSprites, { dx: SQ3 * r, dy: 1.5 * r, rowOff: SQ3 * r / 2, r, pick: (c, w) => hash2(c, w) < 0.22 ? 1 : 0 }, alpha);
  }

  const DRAW = [drawSeigaiha, drawAsanoha, drawYabane, drawKikko];

  /* sprites das 3 novas famílias (montados 1x no build) */
  let asaSprites = [], yabSprites = [], kikSprites = [];
  const hexPath = (g, R2, rot) => { g.beginPath(); for (let i = 0; i < 6; i++) { const a = rot + i * PI3, x = Math.cos(a) * R2, y = Math.sin(a) * R2; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); };

  // ASANOHA: hexágono opaco (a aresta do hexágono É a malha) + estrela de raios/triângulos.
  function spAsanohaUnit(P_, r, variant) {
    const ext = r * 1.18;                         // > célula → sempre sobrepõe (nunca abre vão)
    return spriteCanvas(ext, (g) => {
      const hr = r * 1.02;
      const v = []; for (let i = 0; i < 6; i++) { const a = PI6 + i * PI3; v.push([Math.cos(a) * hr, Math.sin(a) * hr]); }
      // 6 triângulos alternados (dá o miolo do asanoha)
      for (let i = 0; i < 6; i++) { g.fillStyle = css(i & 1 ? P_.b : P_.a); g.beginPath(); g.moveTo(0, 0); g.lineTo(v[i][0], v[i][1]); g.lineTo(v[(i + 1) % 6][0], v[(i + 1) % 6][1]); g.closePath(); g.fill(); }
      g.lineJoin = g.lineCap = 'round';
      // estrela: raios + os 2 triângulos girados
      g.lineWidth = Math.max(1.2, hr * 0.06); g.strokeStyle = css(variant === 2 ? P_.hi : P_.c, 0.96);
      g.beginPath();
      for (let i = 0; i < 6; i++) { g.moveTo(0, 0); g.lineTo(v[i][0], v[i][1]); }
      g.moveTo(v[0][0], v[0][1]); g.lineTo(v[2][0], v[2][1]); g.lineTo(v[4][0], v[4][1]); g.closePath();
      g.moveTo(v[1][0], v[1][1]); g.lineTo(v[3][0], v[3][1]); g.lineTo(v[5][0], v[5][1]); g.closePath();
      g.stroke();
      // contorno do hexágono = linha da malha (compartilhada visualmente com vizinhos)
      g.lineWidth = Math.max(1, hr * 0.05); g.strokeStyle = css(P_.bg, 0.55); hexPath(g, hr, PI6); g.stroke();
      g.fillStyle = css(variant === 2 ? P_.hi : P_.c); g.beginPath(); g.arc(0, 0, hr * 0.1, 0, TAU); g.fill();
    });
  }

  // YABANE: pena de flecha opaca, ponta p/ cima; empilha em coluna = fletching contínuo.
  function spYabaneUnit(P_, r, variant) {
    const ext = r * 0.92, light = variant === 1;
    return spriteCanvas(ext, (g) => {
      const w = r * 0.86, top = -r * 0.78, baseY = r * 0.66, notch = r * 0.06;
      g.lineJoin = g.lineCap = 'round';
      g.fillStyle = css(light ? P_.c : P_.a);
      g.beginPath(); g.moveTo(-w, baseY); g.lineTo(0, top); g.lineTo(w, baseY); g.lineTo(0, notch); g.closePath(); g.fill();
      // barbas
      g.lineWidth = Math.max(1.1, w * 0.07); g.strokeStyle = css(light ? P_.a : P_.hi, 0.9);
      const nb = 5; for (let b = 1; b <= nb; b++) { const tt = b / (nb + 1); const lx = -w + (0 - -w) * tt, ly = baseY + (top - baseY) * tt; const rx = w + (0 - w) * tt, ry = baseY + (top - baseY) * tt; const my = notch + (top - notch) * tt; g.beginPath(); g.moveTo(lx, ly); g.lineTo(0, my); g.lineTo(rx, ry); g.stroke(); }
      // haste
      g.lineWidth = Math.max(1, w * 0.06); g.strokeStyle = css(P_.hi, 0.6); g.beginPath(); g.moveTo(0, top); g.lineTo(0, baseY); g.stroke();
      g.lineWidth = Math.max(1, w * 0.05); g.strokeStyle = css(P_.bg, 0.5); g.beginPath(); g.moveTo(-w, baseY); g.lineTo(0, top); g.lineTo(w, baseY); g.stroke();
    });
  }

  // KIKKŌ: casco hexagonal opaco (hex aninhado) + flor; favo com sobreposição → cascos.
  function spKikkoUnit(P_, r, variant) {
    const ext = r * 1.16, accent = variant === 1;
    return spriteCanvas(ext, (g) => {
      const hr = r * 1.02;
      g.lineJoin = g.lineCap = 'round';
      g.fillStyle = css(P_.a); hexPath(g, hr, PI6); g.fill();
      g.lineWidth = Math.max(1, hr * 0.05); g.strokeStyle = css(P_.bg, 0.6); hexPath(g, hr, PI6); g.stroke();
      g.fillStyle = css(P_.b); hexPath(g, hr * 0.64, PI6); g.fill();
      g.lineWidth = Math.max(1, hr * 0.04); g.strokeStyle = css(P_.bg, 0.4); hexPath(g, hr * 0.64, PI6); g.stroke();
      // flor central
      g.fillStyle = css(accent ? P_.hi : P_.c);
      for (let i = 0; i < 6; i++) { const a = PI6 + i * PI3, px = Math.cos(a) * hr * 0.3, py = Math.sin(a) * hr * 0.3; g.beginPath(); g.ellipse(px, py, hr * 0.24, hr * 0.12, a, 0, TAU); g.fill(); }
      g.fillStyle = css(accent ? P_.c : P_.hi); g.beginPath(); g.arc(0, 0, hr * 0.16, 0, TAU); g.fill();
    });
  }

  let PALc = [];
  function build() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    sdpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    MARGIN = Math.ceil(seigR() * 2.6);
    PALc = MOT.map(m => { const p = m.pal; return { a: hexc(p.a), b: hexc(p.b), c: hexc(p.c), hi: hexc(p.hi), bg: hexc(p.bg) }; });
    seigSprites = [0, 1, 2].map(v => spSeigaihaUnit(PALc[0], seigR(), v));
    asaSprites = [0, 1, 2].map(v => spAsanohaUnit(PALc[1], asaR(), v));
    yabSprites = [0, 1].map(v => spYabaneUnit(PALc[2], yabR(), v));
    kikSprites = [0, 1].map(v => spKikkoUnit(PALc[3], kikR(), v));
  }

  /* profundidade atmosférica + vinheta */
  function drawDepth(bg) {
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.72);
    g.addColorStop(0, css(mix(bg, [0, 0, 0], 0.18), 0.6));
    g.addColorStop(1, css(bg, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const v = ctx.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.34, W / 2, H * 0.5, Math.max(W, H) * 0.82);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, css(mix(bg, [0, 0, 0], 0.45), 0.5));
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }
  function drawSheen() {
    const lv = clamp(P.life, 0, 1); if (lv < 0.25) return;
    const ph = curT * P.waveSpeed * 0.22;
    const cxp = W * (0.5 + 0.42 * Math.sin(ph)), cyp = H * (0.5 + 0.34 * Math.cos(ph * 0.8));
    const g = ctx.createRadialGradient(cxp, cyp, 0, cxp, cyp, Math.max(W, H) * 0.75);
    g.addColorStop(0, `rgba(255,244,214,${0.06 * lv})`); g.addColorStop(1, 'rgba(255,244,214,0)');
    ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }

  function frame(ts) {
    if (!running) return;
    if (!t0) t0 = ts;
    curT = reduce ? 0 : (ts - t0) / 1000;

    const pm = clamp(P.patternMix, 0, NMOT - 1);
    const i0 = Math.floor(pm), i1 = Math.min(i0 + 1, NMOT - 1), fr = pm - i0;
    const bg = mix(PALc[i0].bg, PALc[i1].bg, fr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bgr = ctx.createLinearGradient(0, 0, 0, H);
    bgr.addColorStop(0, css(mix(bg, [0, 0, 0], 0.1))); bgr.addColorStop(1, css(mix(bg, [255, 255, 255], 0.04)));
    ctx.fillStyle = bgr; ctx.fillRect(0, 0, W, H);

    const op = clamp(P.opacity, 0, 1);
    ctx.save();
    if (P.unitScale !== 1) { ctx.translate(W / 2, H / 2); ctx.scale(P.unitScale, P.unitScale); ctx.translate(-W / 2, -H / 2); }
    DRAW[i0](op * (fr > 0.01 ? 1 - fr : 1));
    if (fr > 0.01) DRAW[i1](op * fr);
    ctx.restore();

    drawDepth(bg);
    drawSheen();

    if (P.life < 0.995) {
      ctx.save(); ctx.globalCompositeOperation = 'saturation';
      ctx.globalAlpha = clamp(1 - P.life, 0, 1); ctx.fillStyle = 'hsl(0,0%,55%)'; ctx.fillRect(0, 0, W, H);
      ctx.restore(); ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  function init(selector) {
    canvas = typeof selector === 'string' ? document.querySelector(selector) : selector;
    ctx = canvas.getContext('2d');
    build();
    let to; window.addEventListener('resize', () => { clearTimeout(to); to = setTimeout(build, 180); });
    start();
  }
  function start() { if (running) return; running = true; t0 = 0; raf = requestAnimationFrame(frame); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

  global.KimonoField = { init, start, stop, build, P, NMOT };
})(window);

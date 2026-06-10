/**
 * KimonoField — campo animado de padrões japoneses em <canvas>.
 *
 * Pinta o fundo da história: cada motivo (seigaiha, yabane, kikkō) tem
 * sprites pré-renderizados que são tiled na tela com deslocamento de onda
 * e dispersão controlados pelo objeto público `P` (manipulado pela
 * timeline GSAP em kimono-story.js).
 *
 * IIFE para isolar estado interno; expõe a API em `window.KimonoField`.
 */
(function (global) {
  const TAU = Math.PI * 2, SQ3 = Math.sqrt(3), PI6 = Math.PI / 6, PI3 = Math.PI / 3;

  // clamp — limita v ao intervalo [a, b]
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  // lerp — interpolação linear de a → b por t ∈ [0, 1]
  const lerp = (a, b, t) => a + (b - a) * t;
  // hexc — converte string "#rrggbb" em [r, g, b] inteiros
  const hexc = (h) => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  // mix — interpola duas cores [r,g,b] por t
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  // css — serializa [r,g,b] em "rgb(...)" ou "rgba(...)" com alfa opcional
  const css = (c, al) => al == null ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${al})`;
  // hash2 — hash determinístico 2D em [0, 1) (variação reproduzível por célula)
  const hash2 = (i, j) => (((i * 73856093) ^ (j * 19349663)) >>> 0) / 4294967295;

  const MOT = [
    { pal: { a: '#15294f', b: '#2f5c98', c: '#5e90c9', hi: '#bcd7f2', bg: '#0c1834' } }, // seigaiha índigo
    { pal: { a: '#5e1820', b: '#a3303a', c: '#d07a6a', hi: '#f3d3c6', bg: '#330c11' } }, // yabane beni
    { pal: { a: '#6f1a1f', b: '#b3742a', c: '#d8a23c', hi: '#f6df93', bg: '#380e12' } }, // kikkō ouro/vermelho
  ];
  const NMOT = MOT.length;

  let canvas, ctx, W, H, dpr, raf = 0, running = false, t0 = 0, curT = 0;
  let MARGIN = 0, sdpr = 2, dispR = 50;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Parâmetros públicos animáveis (a timeline GSAP escreve aqui).
   * - patternMix: índice contínuo do motivo (0..NMOT-1); fração interpola dois motivos
   * - life: saturação (0 = pb, 1 = vivo) aplicada via filtro CSS
   * - waveAmp / waveSpeed: amplitude e velocidade do deslocamento de onda
   * - scatter: dispersão aleatória das células (efeito "desbota")
   * - opacity: opacidade global das camadas de motivo
   * - unitScale: zoom aplicado ao conjunto (mantém o centro)
   * - density: densidade dos tiles (maior = unidades menores)
   */
  const P = { patternMix: 0, life: 1, waveAmp: 13, waveSpeed: 1, scatter: 0, opacity: 1, unitScale: 1, density: 1 };

  /* Raio (em px) de cada motivo, em função do viewport e de P.density.
     Cada motivo tem proporção própria — não dá pra usar um valor único. */
  const seigR = () => clamp(Math.min(W, H) / (11 * P.density), 44, 104);
  const yabR = () => clamp(Math.min(W, H) / (13 * P.density), 40, 84);
  const kikR = () => clamp(Math.min(W, H) / (16 * P.density), 32, 70);

  /**
   * Deslocamento da onda em (x, y): combina duas senoides em direções
   * diferentes (campo Perlin-like) e opcionalmente soma um jitter
   * pseudo-aleatório quando P.scatter > 0 (efeito de pétalas se soltando).
   * @returns {[number, number]} ponto deslocado [X, Y]
   */
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

  // Helpers Canvas — aliases com tuplas [x, y] no lugar dos pares soltos
  const mv = (p, q) => p.moveTo(q[0], q[1]);
  const ln = (p, q) => p.lineTo(q[0], q[1]);
  function poly(p, pts) { mv(p, pts[0]); for (let i = 1; i < pts.length; i++) ln(p, pts[i]); p.closePath(); }
  function seg(p, a, b) { mv(p, a); ln(p, b); }
  function dot(p, c, r) { p.moveTo(c[0] + r, c[1]); p.arc(c[0], c[1], r, 0, TAU); }

  /**
   * Pré-renderiza um sprite num <canvas> offscreen para reuso pelo loop.
   * Centro do contexto fica no meio do canvas; `ext` define o raio visível
   * (canvas tem lado = 2·ext, multiplicado por sdpr para nitidez em HiDPI).
   * @param {number} ext extensão (raio) do conteúdo desenhado
   * @param {(g: CanvasRenderingContext2D) => void} draw rotina de desenho
   * @returns {{cn: HTMLCanvasElement, ext: number}}
   */
  function spriteCanvas(ext, draw) {
    const s = document.createElement('canvas');
    s.width = s.height = Math.ceil(ext * 2 * sdpr);
    const g = s.getContext('2d');
    g.setTransform(sdpr, 0, 0, sdpr, ext * sdpr, ext * sdpr);
    g.lineJoin = 'round'; g.lineCap = 'round';
    draw(g);
    return { cn: s, ext };
  }
  /**
   * Sprite de uma unidade do padrão seigaiha (青海波 — ondas concêntricas).
   * @param {{a,b,c,hi,bg:[number,number,number]}} P_ paleta em RGB
   * @param {number} r raio da unidade
   * @param {0|1|2} variant 0 = base, 1 = paleta alternada,
   *                        2 = variante "olho" com pétalas no centro
   */
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

  /**
   * Tiles do seigaiha em grade alternada (shingle).
   * Não usa `shingle` genérico porque tem decay próprio no scatter e
   * sorteia entre 3 variantes (a "olho" é rara, ~10%).
   * @param {number} alpha opacidade desta camada na composição
   */
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
        const hv = hash2(col, row);
        const spr = seigSprites[hv < 0.1 ? 2 : (hv < 0.55 ? 0 : 1)];
        const e = spr.ext * scl; ctx.globalAlpha = al;
        ctx.drawImage(spr.cn, lx + ddx - e, ly + ddy - e, e * 2, e * 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Tiler genérico em grade (com offset alternado opcional por linha).
   * Compartilhado por yabane e kikkō; aplica deslocamento de onda + scatter
   * em cada célula e escolhe sprite via `geom.pick(col, row)`.
   * @param {Array<{cn,ext}>} sprArr sprites disponíveis para este motivo
   * @param {{dx,dy,rowOff,r:number, pick:(c:number,r:number)=>number}} geom geometria da grade
   * @param {number} alpha opacidade desta camada
   */
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

  /** Tile do yabane (矢絣 — flechas); alterna sprite par/ímpar por coluna. */
  function drawYabane(alpha) {
    const r = yabR();
    shingle(yabSprites, { dx: r * 1.18, dy: r * 0.82, rowOff: 0, r, pick: (c) => (c & 1) ? 1 : 0 }, alpha);
  }

  /** Tile do kikkō (亀甲 — favo de tartaruga); ~22% das células ganham variante acentuada. */
  function drawKikko(alpha) {
    const r = kikR();
    shingle(kikSprites, { dx: SQ3 * r, dy: 1.5 * r, rowOff: SQ3 * r / 2, r, pick: (c, w) => hash2(c, w) < 0.22 ? 1 : 0 }, alpha);
  }

  const DRAW = [drawSeigaiha, drawYabane, drawKikko];

  let yabSprites = [], kikSprites = [];

  /** Caminho hexagonal centrado em (0,0), raio R2 e rotação inicial rot. */
  const hexPath = (g, R2, rot) => { g.beginPath(); for (let i = 0; i < 6; i++) { const a = rot + i * PI3, x = Math.cos(a) * R2, y = Math.sin(a) * R2; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); };

  /**
   * Sprite de uma flecha do yabane.
   * @param {0|1} variant 0 = flecha escura (preenche com paleta a),
   *                      1 = flecha clara (preenche com paleta c)
   */
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

  /**
   * Sprite de uma célula do kikkō (hexágono com ornato interno).
   * @param {0|1} variant 0 = ornato neutro,
   *                      1 = ornato com destaque dourado (acento raro)
   */
  function spKikkoUnit(P_, r, variant) {
    const ext = r * 1.16, accent = variant === 1;
    return spriteCanvas(ext, (g) => {
      const hr = r * 1.02;
      g.lineJoin = g.lineCap = 'round';
      g.fillStyle = css(P_.a); hexPath(g, hr, PI6); g.fill();
      g.lineWidth = Math.max(1, hr * 0.05); g.strokeStyle = css(P_.bg, 0.6); hexPath(g, hr, PI6); g.stroke();
      g.fillStyle = css(P_.b); hexPath(g, hr * 0.64, PI6); g.fill();
      g.lineWidth = Math.max(1, hr * 0.04); g.strokeStyle = css(P_.bg, 0.4); hexPath(g, hr * 0.64, PI6); g.stroke();
      g.fillStyle = css(accent ? P_.hi : P_.c);
      for (let i = 0; i < 6; i++) { const a = PI6 + i * PI3, px = Math.cos(a) * hr * 0.3, py = Math.sin(a) * hr * 0.3; g.beginPath(); g.ellipse(px, py, hr * 0.24, hr * 0.12, a, 0, TAU); g.fill(); }
      g.fillStyle = css(accent ? P_.c : P_.hi); g.beginPath(); g.arc(0, 0, hr * 0.16, 0, TAU); g.fill();
    });
  }

  let PALc = [];

  /**
   * (Re)constrói o canvas, paletas em RGB e sprites pré-renderizados.
   * Chamado no init e em todo resize (com debounce de 180ms).
   * Não toca em P — preserva estado da timeline em curso.
   */
  function build() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    dpr = 1;
    sdpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    MARGIN = Math.ceil(seigR() * 2.6);
    PALc = MOT.map(m => { const p = m.pal; return { a: hexc(p.a), b: hexc(p.b), c: hexc(p.c), hi: hexc(p.hi), bg: hexc(p.bg) }; });
    seigSprites = [0, 1, 2].map(v => spSeigaihaUnit(PALc[0], seigR(), v));
    yabSprites = [0, 1].map(v => spYabaneUnit(PALc[1], yabR(), v));
    kikSprites = [0, 1].map(v => spKikkoUnit(PALc[2], kikR(), v));
  }

  /* Caches para evitar regravar gradientes a cada frame: a `key` combina
     a cor de fundo interpolada e as dimensões do canvas — invalida apenas
     quando uma das duas muda. */
  const bgCache = { c: document.createElement('canvas'), key: '' };
  const depthCache = { c: document.createElement('canvas'), key: '' };

  /** Repinta o gradiente vertical de fundo (sumi mais escuro no topo). */
  function repaintBgCache(bg) {
    const c = bgCache.c; c.width = W; c.height = H;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, css(mix(bg, [0, 0, 0], 0.1)));
    grad.addColorStop(1, css(mix(bg, [255, 255, 255], 0.04)));
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
  }
  /** Repinta a camada de profundidade: vinheta + escurecimento radial nas bordas. */
  function repaintDepthCache(bg) {
    const c = depthCache.c; c.width = W; c.height = H;
    const g = c.getContext('2d');
    const lin = g.createLinearGradient(0, 0, 0, H * 0.72);
    lin.addColorStop(0, css(mix(bg, [0, 0, 0], 0.18), 0.6));
    lin.addColorStop(1, css(bg, 0));
    g.fillStyle = lin; g.fillRect(0, 0, W, H);
    const rad = g.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.34, W / 2, H * 0.5, Math.max(W, H) * 0.82);
    rad.addColorStop(0, 'rgba(0,0,0,0)');
    rad.addColorStop(1, css(mix(bg, [0, 0, 0], 0.45), 0.5));
    g.fillStyle = rad; g.fillRect(0, 0, W, H);
  }
  /**
   * Loop de animação (requestAnimationFrame).
   * Compõe: fundo cacheado → motivo(s) interpolados → camada de profundidade.
   * Quando P.patternMix tem fração > 0, desenha dois motivos sobrepostos
   * para fazer a transição suave entre seigaiha/yabane/kikkō.
   */
  function frame(ts) {
    if (!running) return;
    if (!t0) t0 = ts;
    curT = reduce ? 0 : (ts - t0) / 1000;

    const pm = clamp(P.patternMix, 0, NMOT - 1);
    const i0 = Math.floor(pm), i1 = Math.min(i0 + 1, NMOT - 1), fr = pm - i0;
    const bg = mix(PALc[i0].bg, PALc[i1].bg, fr);
    const key = ((bg[0] | 0) << 16) | ((bg[1] | 0) << 8) | (bg[2] | 0);
    const dimKey = key + '|' + W + 'x' + H;

    if (bgCache.key !== dimKey) { repaintBgCache(bg); bgCache.key = dimKey; }
    if (depthCache.key !== dimKey) { repaintDepthCache(bg); depthCache.key = dimKey; }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(bgCache.c, 0, 0);

    const op = clamp(P.opacity, 0, 1);
    ctx.save();
    if (P.unitScale !== 1) { ctx.translate(W / 2, H / 2); ctx.scale(P.unitScale, P.unitScale); ctx.translate(-W / 2, -H / 2); }
    if (P.life < 0.995) ctx.filter = `saturate(${(clamp(P.life, 0, 1) * 100) | 0}%)`;
    DRAW[i0](op * (fr > 0.01 ? 1 - fr : 1));
    if (fr > 0.01) DRAW[i1](op * fr);
    ctx.restore();

    ctx.drawImage(depthCache.c, 0, 0);

    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  /**
   * Bootstrap público. Liga o campo ao canvas indicado.
   * @param {string|HTMLCanvasElement} selector seletor CSS ou elemento canvas
   */
  function init(selector) {
    canvas = typeof selector === 'string' ? document.querySelector(selector) : selector;
    ctx = canvas.getContext('2d');
    build();
    let to; window.addEventListener('resize', () => { clearTimeout(to); to = setTimeout(build, 180); });
    start();
  }
  /** Inicia o loop de animação (idempotente). */
  function start() { if (running) return; running = true; t0 = 0; raf = requestAnimationFrame(frame); }
  /** Para o loop e cancela o frame pendente. */
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

  global.KimonoField = { init, start, stop, build, P, NMOT };
})(window);

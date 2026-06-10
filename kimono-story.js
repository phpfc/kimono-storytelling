/* ============================================================
   kimono-story.js  ·  Storytelling controlado por botão (next) — one-way
   Timeline GSAP em modo paused; navegação one-way + botão reiniciar no fim.
   ============================================================ */
(function () {
  const $ = (s) => document.querySelector(s);

  /* inicia o campo de padrões */
  KimonoField.init('#patternfield');
  const F = KimonoField.P;

  /* ---------- textos laterais: posicionar absolutos ---------- */
  document.querySelectorAll('.side .rows').forEach((wrap) => {
    wrap.style.height = '64vh';
    wrap.querySelectorAll('.row').forEach((row) => {
      row.style.position = 'absolute';
      row.style.top = '50%';
      row.style.left = '50%';
      row.style.transform = 'translate(-50%,-50%)';
      row.style.color = '#f1ead9';
      row.style.textShadow = '0 2px 18px rgba(0,0,0,.55)';
    });
  });
  const sideRows = (ch) => document.querySelectorAll(`.side .row[data-ch="${ch}"]`);
  const photos = document.querySelectorAll('#photo-row .photo');
  const cap = $('#cap');
  const setCap = (t) => () => (cap.textContent = t);

  /* intro: abertura visível por padrão */
  gsap.set(sideRows(0), { opacity: 1 });

  /* ===== timeline (paused — controlada por botão next) ===== */
  const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true });

  /* ===== padrões (KimonoField): 0=seigaiha · 1=yabane · 2=kikkō ===== */

  /* ---- CAP.1 · abertura · 青海波 seigaiha ---- */
  tl.add(setCap('青海波 · seigaiha'), 0);
  tl.fromTo(F, { waveAmp: 13 }, { waveAmp: 18, duration: 6 }, 0);

  /* ---- CAP.2 · gaveta (vídeo) sobre 矢絣 yagasuri (vermelho) ---- */
  tl.to('#opening', { opacity: 0, duration: 2 }, 7);
  tl.to(sideRows(0), { opacity: 0, duration: 1.5 }, 7);
  tl.to(F, { patternMix: 1, duration: 4.5, ease: 'power1.inOut' }, 6.5);  // seigaiha → yabane
  tl.add(setCap('矢絣 · yagasuri'), 8.5);
  tl.to('#drawer-scene', { opacity: 1, duration: 2 }, 8.5);
  tl.to(sideRows(1), { opacity: 1, duration: 1.5 }, 12.5);
  tl.to(F, { waveAmp: 22, unitScale: 1.06, duration: 4, ease: 'sine.inOut' }, 13);
  tl.to(F, { waveAmp: 15, unitScale: 1, duration: 3, ease: 'sine.inOut' }, 17);

  /* ---- CAP.3 · a cor se esvai ---- */
  tl.add(setCap('色褪せ · a cor desbota'), 21);
  tl.to('#drawer-scene', { opacity: 0, duration: 2.5 }, 21);
  tl.to(sideRows(1), { opacity: 0, duration: 1.2 }, 21);
  tl.to(sideRows(2), { opacity: 1, duration: 1.5 }, 22);
  tl.to(F, { life: 0, duration: 5, ease: 'power1.in' }, 21);
  tl.to(F, { waveAmp: 3, duration: 5, ease: 'power2.in' }, 21);
  tl.to(F, { scatter: 0.14, duration: 5, ease: 'power1.in' }, 21);
  tl.to(sideRows(2), { opacity: 0, duration: 1.6 }, 26.2);
  tl.to('#sakura', { opacity: 1, duration: 2.6, ease: 'power2.out' }, 21.5);
  tl.to('#sakura', { opacity: 0, duration: 2.4, ease: 'power1.in' }, 25.6);

  /* ---- CAP.4 · blackout ---- */
  tl.to('#blackout', { opacity: 1, duration: 3, ease: 'power2.in' }, 27.5);
  tl.add(setCap(''), 28);

  /* ---- CAP.5 · 1890 — 2020 ---- */
  tl.to('#years-scene', { opacity: 1, duration: 2 }, 32);
  tl.from('#years-num', { letterSpacing: '0.4em', opacity: 0, y: 30, duration: 3, ease: 'power2.out' }, 32);
  tl.from('#years-scene .lead', { opacity: 0, y: 20, duration: 2.5, ease: 'power2.out' }, 33);

  /* ---- CAP.6 · fotos quimonos desbotados ---- */
  tl.to('#years-scene', { opacity: 0, duration: 1.8 }, 39);
  tl.to('#flash-scene', { opacity: 1, duration: 0.6 }, 40);
  tl.add(setCap('褪せた着物 · quimonos esquecidos'), 40);
  photos.forEach((k, i) => {
    const s = 40.4 + i * 0.7;
    tl.fromTo(k, { opacity: 0, y: 18 }, { opacity: 0.9, y: 0, duration: 0.7, ease: 'power2.out' }, s);
  });
  tl.to('#flash-scene', { opacity: 0, duration: 1.6 }, 46.5);

  /* ---- CAP.7 · cinco anos ---- */
  tl.to('#five-scene', { opacity: 1, duration: 1.6 }, 48);
  tl.from('#five-scene .kanji-sub', { opacity: 0, y: 20, duration: 2, ease: 'power2.out' }, 48);
  tl.from('#five-scene .lead', { opacity: 0, y: 24, duration: 2.4, ease: 'power2.out' }, 48.5);
  tl.to(sideRows(4), { opacity: 1, duration: 1.4 }, 48.5);
  tl.add(setCap('五年 · cinco anos'), 51);

  /* ---- CAP.7 · renascimento · 亀甲 kikkō + finale (stop único) ---- */
  tl.to('#five-scene', { opacity: 0, duration: 1.6 }, 53.5);
  tl.to(sideRows(4), { opacity: 0, duration: 1.2 }, 53.5);
  tl.set(F, { scatter: 0.8, waveAmp: 6, patternMix: 2, life: 0.15 }, 54);  // → kikkō
  tl.to('#blackout', { opacity: 0, duration: 2, ease: 'power2.out' }, 54);
  tl.to(F, { scatter: 0, duration: 3.2, ease: 'power3.out' }, 54.3);
  tl.to(F, { life: 1, duration: 1.6, ease: 'power3.out' }, 54.4);
  tl.to(F, { waveAmp: 15, duration: 3, ease: 'power2.out' }, 54.4);
  tl.to('#cranes', { opacity: 0.85, duration: 3, ease: 'power2.out' }, 55.6);
  tl.add(setCap(''), 56);

  /* ---- finale (mesma dobra) ---- */
  tl.to('#finale-scene', { opacity: 1, duration: 2 }, 56);
  tl.fromTo('#finale-scene .kanji-sub', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 2, ease: 'power2.out' }, 56);
  tl.fromTo('#finale-scene .lead', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 2.4, ease: 'power2.out', stagger: 0.5 }, 56.5);
  tl.fromTo('#finale-scene .finale-mark', { opacity: 0 }, { opacity: 1, duration: 2.4, ease: 'power2.out' }, 58);
  tl.fromTo('#finale-scene .finale-contact', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 2.4, ease: 'power2.out' }, 59);
  tl.to(sideRows(5), { opacity: 1, duration: 1.6 }, 57);

  /* lock final: tween curto + set instantâneo em t=62 garantem estado pleno
     mesmo se o tweenTo da navegação cortar antes dos fromTo() completarem.
     Sem clearProps — alguns navegadores limpam estados de opacity em cascata. */
  const finaleLocks = ['#finale-scene', '#finale-scene .kanji-sub', '#finale-scene .lead', '#finale-scene .finale-mark', '#finale-scene .finale-contact'];
  tl.to(finaleLocks, { opacity: 1, y: 0, duration: 0.4, ease: 'none', overwrite: 'auto' }, 61.6);
  tl.set(finaleLocks, { opacity: 1, y: 0 }, 62);
  tl.to({}, { duration: 1 }, 64);

  /* ===== NAVEGAÇÃO POR CAPÍTULOS (one-way) ===== */
  const STOPS = [
    { t: 0,  label: '青海波' },         // 01 abertura · seigaiha
    { t: 11, label: '引き出し' },       // 02 gaveta · vídeo sobre yagasuri
    { t: 27, label: '色褪せ' },         // 03 cor desbota · sakura
    { t: 36, label: '1890 — 2020' },    // 04 memória · 130 anos · três gerações
    { t: 45, label: '褪せた着物' },     // 05 fotos quimonos esquecidos
    { t: 52, label: '五年' },           // 06 hoje na sua gaveta
    { t: 62, label: '褪色' },           // 07 renascimento kikkō + CTA
  ];
  const DRAWER_STOP = 1;
  const LAST_STOP = STOPS.length - 1;

  const nav        = $('#chapter-nav');
  const numEl      = $('#chapter-num');
  const totalEl    = $('#chapter-total');
  const labelEl    = $('#chapter-label');
  const nextBtn    = $('#btn-next');
  const restartBtn = $('#btn-restart');
  const drawerVid  = document.querySelector('.drawer-video');

  let currentStop = 0;
  let activeTween = null;
  let videoLocked = false;       // next desabilitado enquanto vídeo toca
  let videoTimeout = null;       // fallback caso vídeo não dispare `ended`

  if (totalEl) totalEl.textContent = String(STOPS.length).padStart(2, '0');

  function updateNavUI() {
    if (numEl)   numEl.textContent   = String(currentStop + 1).padStart(2, '0');
    if (labelEl) labelEl.textContent = STOPS[currentStop].label;
    if (nextBtn) nextBtn.disabled = videoLocked || currentStop === LAST_STOP;
  }

  function forceFinaleVisible() {
    /* segunda camada de garantia: aplica direto via gsap.set caso o tween
       da navegação tenha cortado antes do estado final propagar.
       Selector inclui filhos do .finale-contact para garantir o link [email]
       e o tag — alguns fromTo() encadeados podem deixar valores intermediários. */
    gsap.set('#finale-scene', { opacity: 1 });
    gsap.set('#finale-scene .scrim', { opacity: 1 });
    gsap.set('#finale-scene .kanji-sub', { opacity: 1, y: 0 });
    gsap.set('#finale-scene .lead', { opacity: 1, y: 0 });
    gsap.set('#finale-scene .finale-mark', { opacity: 1, y: 0 });
    gsap.set('#finale-scene .finale-contact', { opacity: 1, y: 0 });
    gsap.set('#finale-scene .finale-contact > *', { opacity: 1 });
  }

  function clearVideoLock() {
    videoLocked = false;
    if (videoTimeout) { clearTimeout(videoTimeout); videoTimeout = null; }
    updateNavUI();
  }

  function controlVideo(idx) {
    if (!drawerVid) return;
    if (idx === DRAWER_STOP) {
      drawerVid.currentTime = 0;
      videoLocked = true;        // trava next durante a reprodução
      /* fallback: se o vídeo não disparar `ended` em 12s (autoplay bloqueado,
         erro de codec etc.), libera o next para o usuário avançar manualmente */
      if (videoTimeout) clearTimeout(videoTimeout);
      videoTimeout = setTimeout(() => clearVideoLock(), 12000);
      const pr = drawerVid.play();
      if (pr && pr.catch) pr.catch(() => clearVideoLock());
    } else {
      drawerVid.pause();
      drawerVid.currentTime = 0;
      clearVideoLock();
    }
  }

  function revealRestart() {
    if (!nav || !restartBtn) return;
    nav.setAttribute('data-final', 'true');
  }

  function hideRestart() {
    if (!nav) return;
    nav.removeAttribute('data-final');
  }

  function goToStop(idx, opts = {}) {
    idx = Math.max(0, Math.min(LAST_STOP, idx));
    /* one-way: rejeita qualquer movimento para trás (exceto restart com force) */
    if (!opts.force && idx <= currentStop) return;
    /* next bloqueado enquanto vídeo toca */
    if (!opts.force && videoLocked && idx > DRAWER_STOP) return;
    if (activeTween) { activeTween.kill(); activeTween = null; }
    currentStop = idx;
    updateNavUI();
    controlVideo(idx);
    const target = STOPS[idx].t;
    const dt = Math.abs(target - tl.time());
    /* duração proporcional ao deltaT da timeline. Com 5 stops o salto final
       (1890→2020 ─ CTA) cobre 26s — clamps até 7s para não parecer skip. */
    const dur = opts.duration ?? Math.min(7.0, Math.max(0.8, dt * 0.3));
    activeTween = tl.tweenTo(target, {
      duration: dur,
      ease: 'power2.inOut',
      onComplete: () => {
        activeTween = null;
        if (idx === LAST_STOP) {
          forceFinaleVisible();
          revealRestart();
        }
      },
    });
  }

  function restart() {
    if (activeTween) { activeTween.kill(); activeTween = null; }
    clearVideoLock();
    hideRestart();
    /* overlay preto rápido esconde o reset (evita reverter a timeline e
       mostrar todas as cenas em playback reverso) */
    gsap.to('#blackout', {
      opacity: 1, duration: 0.4, ease: 'power2.in',
      onComplete: () => {
        tl.time(0);
        currentStop = 0;
        updateNavUI();
        controlVideo(0);
        /* zera estado visual: cenas posteriores escondidas, abertura visível */
        gsap.set(['#drawer-scene', '#years-scene', '#five-scene', '#finale-scene', '#cranes', '#sakura'], { opacity: 0 });
        gsap.set(finaleLocks, { opacity: 0, y: 0 });
        gsap.set('#opening', { opacity: 1 });
        [1, 2, 3, 4, 5].forEach(ch => gsap.set(sideRows(ch), { opacity: 0 }));
        gsap.set(sideRows(0), { opacity: 1 });
        cap.textContent = '青海波 · seigaiha';
        gsap.to('#blackout', { opacity: 0, duration: 0.7, delay: 0.15, ease: 'power2.out' });
      },
    });
  }

  if (nextBtn)    nextBtn.addEventListener('click', () => goToStop(currentStop + 1));
  if (restartBtn) restartBtn.addEventListener('click', restart);

  /* one-way: apenas teclas de avanço */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      goToStop(currentStop + 1);
    }
  });

  /* fim do vídeo → libera next e avança para o próximo stop (color desbota) */
  if (drawerVid) {
    drawerVid.addEventListener('ended', () => {
      if (currentStop !== DRAWER_STOP) return;
      clearVideoLock();
      goToStop(currentStop + 1, { force: true });
    });
  }

  /* estado inicial */
  updateNavUI();
  controlVideo(0);

  window.__tl = tl;
  window.__story = { goToStop, restart, STOPS };
})();

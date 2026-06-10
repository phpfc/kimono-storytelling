/**
 * KimonoStory — narrativa GSAP que conduz a história "褪色".
 *
 * Orquestra:
 * - a timeline de cenas (texto, vídeo, finale);
 * - a animação do campo de padrões (escrevendo em KimonoField.P);
 * - a navegação one-way por capítulos (botão "próximo" + teclas).
 *
 * IIFE — depende de GSAP global e do KimonoField já carregado.
 */
(function () {
  // $ — atalho para querySelector
  const $ = (s) => document.querySelector(s);

  KimonoField.init('#patternfield');
  const F = KimonoField.P;

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
  // sideRows — seleciona as linhas verticais (esquerda + direita) de um capítulo
  const sideRows = (ch) => document.querySelectorAll(`.side .row[data-ch="${ch}"]`);
  const photos = document.querySelectorAll('#photo-row .photo');
  const cap = $('#cap');
  /**
   * Fabrica um callback que troca o texto da legenda superior.
   * Usado com `tl.add(setCap('...'), tempo)` para sincronizar com a timeline.
   */
  const setCap = (t) => () => (cap.textContent = t);

  gsap.set(sideRows(0), { opacity: 1 });

  const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true });


  tl.add(setCap('青海波 · seigaiha'), 0);
  tl.fromTo(F, { waveAmp: 13 }, { waveAmp: 18, duration: 6 }, 0);

  tl.to('#opening', { opacity: 0, duration: 2 }, 7);
  tl.to(sideRows(0), { opacity: 0, duration: 1.5 }, 7);
  tl.to(F, { patternMix: 1, duration: 4.5, ease: 'power1.inOut' }, 6.5);  
  tl.add(setCap('矢絣 · yagasuri'), 8.5);
  tl.to('#drawer-scene', { opacity: 1, duration: 2 }, 8.5);
  tl.to(sideRows(1), { opacity: 1, duration: 1.5 }, 12.5);
  tl.to(F, { waveAmp: 22, unitScale: 1.06, duration: 4, ease: 'sine.inOut' }, 13);
  tl.to(F, { waveAmp: 15, unitScale: 1, duration: 3, ease: 'sine.inOut' }, 17);

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

  tl.to('#blackout', { opacity: 1, duration: 3, ease: 'power2.in' }, 27.5);
  tl.add(setCap(''), 28);

  tl.to('#years-scene', { opacity: 1, duration: 2 }, 32);
  tl.from('#years-num', { letterSpacing: '0.4em', opacity: 0, y: 30, duration: 3, ease: 'power2.out' }, 32);
  tl.from('#years-scene .lead', { opacity: 0, y: 20, duration: 2.5, ease: 'power2.out' }, 33);

  tl.to('#years-scene', { opacity: 0, duration: 1.8 }, 39);
  tl.to('#flash-scene', { opacity: 1, duration: 0.6 }, 40);
  tl.add(setCap('褪せた着物 · quimonos esquecidos'), 40);
  photos.forEach((k, i) => {
    const s = 40.4 + i * 0.7;
    tl.fromTo(k, { opacity: 0, y: 18 }, { opacity: 0.9, y: 0, duration: 0.7, ease: 'power2.out' }, s);
  });
  tl.to('#flash-scene', { opacity: 0, duration: 1.6 }, 46.5);

  tl.to('#five-scene', { opacity: 1, duration: 1.6 }, 48);
  tl.from('#five-scene .kanji-sub', { opacity: 0, y: 20, duration: 2, ease: 'power2.out' }, 48);
  tl.from('#five-scene .lead', { opacity: 0, y: 24, duration: 2.4, ease: 'power2.out' }, 48.5);
  tl.to(sideRows(4), { opacity: 1, duration: 1.4 }, 48.5);
  tl.add(setCap('五年 · cinco anos'), 51);

  tl.to('#five-scene', { opacity: 0, duration: 1.6 }, 53.5);
  tl.to(sideRows(4), { opacity: 0, duration: 1.2 }, 53.5);
  tl.set(F, { scatter: 0.8, waveAmp: 6, patternMix: 2, life: 0.15 }, 54);  
  tl.to('#blackout', { opacity: 0, duration: 2, ease: 'power2.out' }, 54);
  tl.to(F, { scatter: 0, duration: 3.2, ease: 'power3.out' }, 54.3);
  tl.to(F, { life: 1, duration: 1.6, ease: 'power3.out' }, 54.4);
  tl.to(F, { waveAmp: 15, duration: 3, ease: 'power2.out' }, 54.4);
  tl.to('#cranes', { opacity: 0.85, duration: 3, ease: 'power2.out' }, 55.6);
  tl.add(setCap(''), 56);

  tl.to('#finale-scene', { opacity: 1, duration: 2 }, 56);
  tl.fromTo('#finale-scene .kanji-sub', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 2, ease: 'power2.out' }, 56);
  tl.fromTo('#finale-scene .lead', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 2.4, ease: 'power2.out', stagger: 0.5 }, 56.5);
  tl.fromTo('#finale-scene .finale-mark', { opacity: 0 }, { opacity: 1, duration: 2.4, ease: 'power2.out' }, 58);
  tl.fromTo('#finale-scene .finale-contact', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 2.4, ease: 'power2.out' }, 59);
  tl.to(sideRows(5), { opacity: 1, duration: 1.6 }, 57);

  const finaleLocks = ['#finale-scene', '#finale-scene .kanji-sub', '#finale-scene .lead', '#finale-scene .finale-mark', '#finale-scene .finale-contact'];
  tl.to(finaleLocks, { opacity: 1, y: 0, duration: 0.4, ease: 'none', overwrite: 'auto' }, 61.6);
  tl.set(finaleLocks, { opacity: 1, y: 0 }, 62);
  tl.to({}, { duration: 1 }, 64);

  const STOPS = [
    { t: 0,  label: '青海波' },         
    { t: 11, label: '引き出し' },       
    { t: 27, label: '色褪せ' },         
    { t: 36, label: '1890 — 2020' },    
    { t: 45, label: '褪せた着物' },     
    { t: 52, label: '五年' },           
    { t: 62, label: '褪色' },           
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
  let videoLocked = false;       
  let videoTimeout = null;       

  if (totalEl) totalEl.textContent = String(STOPS.length).padStart(2, '0');

  /** Sincroniza UI da nav (número, label e estado disabled do botão "próximo"). */
  function updateNavUI() {
    if (numEl)   numEl.textContent   = String(currentStop + 1).padStart(2, '0');
    if (labelEl) labelEl.textContent = STOPS[currentStop].label;
    if (nextBtn) nextBtn.disabled = videoLocked || currentStop === LAST_STOP;
  }

  /**
   * Trava opacidade total no finale após chegar nele.
   * Evita flicker quando algum tween residual ainda está em curso ao
   * "completar" o último stop (especialmente em pulos rápidos pela nav).
   */
  function forceFinaleVisible() {
    gsap.set('#finale-scene', { opacity: 1 });
    gsap.set('#finale-scene .scrim', { opacity: 1 });
    gsap.set('#finale-scene .kanji-sub', { opacity: 1, y: 0 });
    gsap.set('#finale-scene .lead', { opacity: 1, y: 0 });
    gsap.set('#finale-scene .finale-mark', { opacity: 1, y: 0 });
    gsap.set('#finale-scene .finale-contact', { opacity: 1, y: 0 });
    gsap.set('#finale-scene .finale-contact > *', { opacity: 1 });
  }

  /** Libera o lock do botão "próximo" (cena da gaveta). */
  function clearVideoLock() {
    videoLocked = false;
    if (videoTimeout) { clearTimeout(videoTimeout); videoTimeout = null; }
    updateNavUI();
  }

  /**
   * Toca/pausa o vídeo conforme o stop atual.
   * Quando entra na cena da gaveta: trava o "próximo" até o vídeo terminar
   * (ou até 12s, como rede de segurança caso `ended` nunca dispare —
   * autoplay bloqueado, codec, etc.).
   * @param {number} idx índice do stop atual
   */
  function controlVideo(idx) {
    if (!drawerVid) return;
    if (idx === DRAWER_STOP) {
      drawerVid.currentTime = 0;
      videoLocked = true;        
      
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

  /** Mostra o botão "reiniciar" no lugar de "próximo" (data-final ativa o CSS). */
  function revealRestart() {
    if (!nav || !restartBtn) return;
    nav.setAttribute('data-final', 'true');
  }

  /** Restaura a nav para o estado padrão (mostra "próximo" de novo). */
  function hideRestart() {
    if (!nav) return;
    nav.removeAttribute('data-final');
  }

  /**
   * Avança a timeline até o stop indicado.
   * Navegação one-way: ignora se idx <= currentStop e bloqueia avanço
   * durante o vídeo da gaveta — a menos que `opts.force` seja true
   * (usado pelo handler `ended` do vídeo).
   * Duração do tween é proporcional à distância na timeline (entre 0.8s e 7s),
   * podendo ser sobrescrita por `opts.duration`.
   * @param {number} idx índice em STOPS
   * @param {{force?: boolean, duration?: number}} [opts]
   */
  function goToStop(idx, opts = {}) {
    idx = Math.max(0, Math.min(LAST_STOP, idx));
    if (!opts.force && idx <= currentStop) return;
    if (!opts.force && videoLocked && idx > DRAWER_STOP) return;
    if (activeTween) { activeTween.kill(); activeTween = null; }
    currentStop = idx;
    updateNavUI();
    controlVideo(idx);
    const target = STOPS[idx].t;
    const dt = Math.abs(target - tl.time());
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

  /**
   * Volta a história ao começo via fade para blackout.
   * Reseta cenas, sidebars, caption, vídeo e a posição da timeline
   * antes de desbotar o blackout — evita ver o "rebobinar" das cenas.
   */
  function restart() {
    if (activeTween) { activeTween.kill(); activeTween = null; }
    clearVideoLock();
    hideRestart();
    gsap.to('#blackout', {
      opacity: 1, duration: 0.4, ease: 'power2.in',
      onComplete: () => {
        tl.time(0);
        currentStop = 0;
        updateNavUI();
        controlVideo(0);
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

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      goToStop(currentStop + 1);
    }
  });

  if (drawerVid) {
    drawerVid.addEventListener('ended', () => {
      if (currentStop !== DRAWER_STOP) return;
      clearVideoLock();
      goToStop(currentStop + 1, { force: true });
    });
  }

  updateNavUI();
  controlVideo(0);

  window.__tl = tl;
  window.__story = { goToStop, restart, STOPS };
})();

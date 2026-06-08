/* ============================================================
   kimono-story.js  ·  Scrollytelling com GSAP + ScrollTrigger
   Dirige o campo de padrões (KimonoField.P) ao longo do scroll.
   ============================================================ */
(function () {
  gsap.registerPlugin(ScrollTrigger);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const $ = (s) => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* intro: abertura visível por padrão (entrada via CSS, sem depender do ticker) */
  gsap.set(sideRows(0), { opacity: 1 });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '#track', start: 'top top', end: 'bottom bottom', scrub: 1,
      onUpdate: (self) => {
        $('#pbar').style.height = (self.progress * 100).toFixed(1) + '%';
        $('#hint').style.opacity = self.progress > 0.02 ? 0 : 1;
      },
    },
  });

  /* ===== posições absolutas (segundos da timeline) =====
     C1 abertura 0 · C2 gaveta 7 · C3 aberta 13 · C4 cor esvai 21
     C5 blackout 28 · C6 1890—2020 32 · C7 fotos 40 · C8 5 anos 48
     C9 renascimento 54  (fim ~64) */

  /* ---- CAP.1 · abertura · 青海波 seigaiha (escamas vivas) ---- */
  tl.add(setCap('青海波 · seigaiha'), 0);
  tl.fromTo(F, { waveAmp: 13 }, { waveAmp: 18, duration: 6 }, 0);

  /* ---- CAP.2 · transição → 麻葉 asanoha (estrela facetada) ---- */
  tl.to('#opening', { opacity: 0, duration: 2 }, 7);
  tl.to(sideRows(0), { opacity: 0, duration: 1.5 }, 7);
  tl.to(F, { patternMix: 1, duration: 4.5, ease: 'power1.inOut' }, 6.5);   // seigaiha → asanoha
  tl.add(setCap('麻葉 · asanoha'), 8.5);
  tl.to('#drawer-scene', { opacity: 1, duration: 2 }, 8.5);

  /* ---- CAP.3 · gaveta aberta → 矢絣 yagasuri (penas de flecha) ---- */
  tl.to(sideRows(1), { opacity: 1, duration: 1.5 }, 12.5);
  tl.to(F, { patternMix: 2, duration: 4.5, ease: 'power1.inOut' }, 13.5);  // asanoha → yagasuri
  tl.add(setCap('矢絣 · yagasuri'), 15.5);
  tl.to(F, { waveAmp: 22, unitScale: 1.06, duration: 4, ease: 'sine.inOut' }, 13);
  tl.to(F, { waveAmp: 15, unitScale: 1, duration: 3, ease: 'sine.inOut' }, 17);

  /* ---- CAP.4 · a cor se esvai (life→0, onda amortece, leve dispersão) ---- */
  tl.add(setCap('色褪せ · a cor desbota'), 21);
  tl.to('#drawer-scene', { opacity: 0, duration: 2.5 }, 21);
  tl.to(sideRows(1), { opacity: 0, duration: 1.2 }, 21);
  tl.to(sideRows(2), { opacity: 1, duration: 1.5 }, 22);
  tl.to(F, { life: 0, duration: 5, ease: 'power1.in' }, 21);          // DRENA A COR (sobre yagasuri)
  tl.to(F, { waveAmp: 3, duration: 5, ease: 'power2.in' }, 21);       // movimento morre
  tl.to(F, { scatter: 0.14, duration: 5, ease: 'power1.in' }, 21);    // unidades se soltam
  // a linha lateral 2 some antes do blackout (evita acúmulo no final)
  tl.to(sideRows(2), { opacity: 0, duration: 1.6 }, 26.2);
  // sakura caindo (anexos) enquanto a cor se esvai
  tl.to('#sakura', { opacity: 1, duration: 2.6, ease: 'power2.out' }, 21.5);
  tl.to('#sakura', { opacity: 0, duration: 2.4, ease: 'power1.in' }, 25.6);

  /* ---- CAP.5 · blackout ---- */
  tl.to('#blackout', { opacity: 1, duration: 3, ease: 'power2.in' }, 27.5);
  tl.add(setCap(''), 28);

  /* ---- CAP.6 · 1890 — 2020 ---- */
  tl.to('#years-scene', { opacity: 1, duration: 2 }, 32);
  tl.from('#years-num', { letterSpacing: '0.4em', opacity: 0, y: 30, duration: 3, ease: 'power2.out' }, 32);
  tl.from('#years-scene .lead', { opacity: 0, y: 20, duration: 2.5, ease: 'power2.out' }, 33);

  /* ---- CAP.7 · fotos de quimonos desbotados (placeholders) ---- */
  tl.to('#years-scene', { opacity: 0, duration: 1.8 }, 39);
  tl.to('#flash-scene', { opacity: 1, duration: 0.6 }, 40);
  tl.add(setCap('褪せた着物 · quimonos esquecidos'), 40);
  photos.forEach((k, i) => {
    const s = 40.4 + i * 0.7;
    tl.fromTo(k, { opacity: 0, y: 18 }, { opacity: 0.9, y: 0, duration: 0.7, ease: 'power2.out' }, s);
  });
  tl.to('#flash-scene', { opacity: 0, duration: 1.6 }, 46.5);

  /* ---- CAP.8 · cinco anos ---- */
  tl.to('#five-scene', { opacity: 1, duration: 1.6 }, 48);
  tl.from('#five-scene .kanji-sub', { opacity: 0, y: 20, duration: 2, ease: 'power2.out' }, 48);
  tl.from('#five-scene .lead', { opacity: 0, y: 24, duration: 2.4, ease: 'power2.out' }, 48.5);
  tl.to(sideRows(4), { opacity: 1, duration: 1.4 }, 48.5);

  /* ---- CAP.9 · renascimento: reagrupa e floresce em 亀甲 kikkō (ouro) ---- */
  tl.add(setCap('亀甲 · kikkō'), 54);
  tl.to('#five-scene', { opacity: 0, duration: 1.6 }, 53.5);
  tl.to(sideRows(4), { opacity: 0, duration: 1.2 }, 53.5);
  // estado disperso/sem cor por baixo do preto → floresce em KIKU (crisântemo)
  tl.set(F, { scatter: 0.8, waveAmp: 6, patternMix: 3, life: 0.15 }, 54);  // → kiku
  tl.to('#blackout', { opacity: 0, duration: 2, ease: 'power2.out' }, 54);
  // reagrupa + ganha cor RÁPIDO
  tl.to(F, { scatter: 0, duration: 3.2, ease: 'power3.out' }, 54.3);       // unidades voltam à malha
  tl.to(F, { life: 1, duration: 1.6, ease: 'power3.out' }, 54.4);         // cor volta rápido
  tl.to(F, { waveAmp: 15, duration: 3, ease: 'power2.out' }, 54.4);       // tecido respira de novo
  // grous (anexo) voam atrás do texto, na faixa superior
  tl.to('#cranes', { opacity: 0.85, duration: 3, ease: 'power2.out' }, 55.6);
  // finale — entradas explícitas (fromTo) p/ evitar o gotcha de .from() com scrub
  tl.to('#finale-scene', { opacity: 1, duration: 2 }, 56);
  tl.fromTo('#finale-scene .kanji-sub', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 2, ease: 'power2.out' }, 56);
  tl.fromTo('#finale-scene .lead', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 2.4, ease: 'power2.out', stagger: 0.5 }, 56.5);
  tl.fromTo('#finale-scene .finale-mark', { opacity: 0 }, { opacity: 1, duration: 2.4, ease: 'power2.out' }, 58);
  tl.fromTo('#finale-scene .finale-contact', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 2.4, ease: 'power2.out' }, 59);
  tl.to(sideRows(5), { opacity: 1, duration: 1.6 }, 57);
  // TRAVA DE PERMANÊNCIA: garante que todo o bloco final fique visível até o fim do scroll
  tl.set(['#finale-scene', '#finale-scene .kanji-sub', '#finale-scene .lead', '#finale-scene .finale-mark', '#finale-scene .finale-contact'], { opacity: 1, y: 0, clearProps: 'transform' }, 62.5);
  tl.to({}, { duration: 1 }, 64);

  window.__tl = tl;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();

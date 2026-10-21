/* ════════════════════════════════════════════════════════════════════
   FLASH PRINT · Cancún  ·  app.js
   Dependencias locales (carpeta /vendor): GSAP 3.12 + ScrollTrigger, Lenis.
   Si alguna falla al cargar, la página sigue siendo 100% usable
   (formulario, configurador, FAQ y enlaces funcionan sin animaciones).
   ════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  /* ───────────── utilidades ───────────── */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const root = document.documentElement;

  const WA_NUMBER = '529984072527';
  const waUrl = (msg) => `https://wa.me/${WA_NUMBER}` + (msg ? `?text=${encodeURIComponent(msg)}` : '');

  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const REDUCE = mqReduce.matches;
  const HAS_GSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  const safe = (fn, name) => {
    try { return fn(); } catch (err) { console.error(`[Flash Print] ${name || fn.name}:`, err); return null; }
  };

  let lenis = null;
  let heroGL = null;

  /* ═════════════ 1 · ENLACES DE WHATSAPP (mensaje por contexto) ═════════════ */
  function initWhatsAppLinks() {
    $$('[data-wa]').forEach((a) => { a.href = waUrl(a.dataset.wa); });
  }

  /* ═════════════ 2 · SEPARAR PALABRAS (revelado de titulares) ═════════════ */
  function wrapWords(el, mode) {
    const words = [];
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            if (mode === 'mask') {
              const outer = document.createElement('span');
              outer.className = 'w';
              const inner = document.createElement('span');
              inner.className = 'wi';
              inner.textContent = part;
              outer.appendChild(inner);
              frag.appendChild(outer);
              words.push(inner);
            } else {
              const sp = document.createElement('span');
              sp.className = 'sw';
              sp.textContent = part;
              frag.appendChild(sp);
              words.push(sp);
            }
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && !child.classList.contains('sr-only')) {
          walk(child);
        }
      });
    };
    walk(el);
    return words;
  }

  /* ═════════════ 3 · BOTONES: origen del relleno + efecto magnético ═════════════ */
  function initButtons() {
    $$('.btn').forEach((btn) => {
      const setOrigin = (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--px', `${e.clientX - r.left}px`);
        btn.style.setProperty('--py', `${e.clientY - r.top}px`);
      };
      btn.addEventListener('pointerenter', setOrigin);
      btn.addEventListener('pointerleave', setOrigin);
    });
    if (!HAS_GSAP || REDUCE || !mqFine.matches) return;
    $$('[data-magnetic]').forEach((btn) => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3' });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
      });
      btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ═════════════ 4 · MENÚ MÓVIL ═════════════ */
  const menuEl = $('#menu');
  const burger = $('#burger');
  function setMenu(open) {
    if (!menuEl || !burger) return;
    menuEl.classList.toggle('is-open', open);
    menuEl.setAttribute('aria-hidden', String(!open));
    if (open) menuEl.removeAttribute('inert'); else menuEl.setAttribute('inert', '');
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    if (lenis) { open ? lenis.stop() : lenis.start(); }
    else root.style.overflow = open ? 'hidden' : '';
  }
  function initMenu() {
    if (!burger) return;
    burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
  }

  /* ═════════════ 5 · SCROLL SUAVE (Lenis) + anclas ═════════════ */
  function targetY(el) {
    // una sección fijada (pin) ocupa más scroll que su alto: el ancla debe ir al INICIO del pin
    if (HAS_GSAP) {
      const st = ScrollTrigger.getAll().find((t) => t.pin === el);
      if (st) return st.start;
    }
    return el.getBoundingClientRect().top + window.scrollY;
  }
  function scrollToTarget(el) {
    const y = targetY(el);
    if (lenis) lenis.scrollTo(y, { duration: 1.7 });
    else window.scrollTo({ top: y, behavior: REDUCE ? 'auto' : 'smooth' });
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
  function initSmoothScroll() {
    if (HAS_GSAP) {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });
    }
    if (HAS_GSAP && typeof window.Lenis !== 'undefined' && !REDUCE) {
      lenis = new Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
    }
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id.length < 2) return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        const wasOpen = menuEl && menuEl.classList.contains('is-open');
        if (wasOpen) setMenu(false);
        // si el menú estaba abierto, esperamos a que Lenis se reactive
        setTimeout(() => scrollToTarget(target), wasOpen ? 120 : 0);
      });
    });
  }

  /* ═════════════ 6 · HERO: shader WebGL (halftone CMYK vivo) ═════════════ */
  function initHeroGL() {
    const canvas = $('#hero-gl');
    if (!canvas) return null;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance' });
    if (!gl) return null;

    const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
    const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uFade;

float hash(vec2 p){ p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * noise(p); p = p * 2.02 + 11.7; a *= 0.5; }
  return v;
}
/* trama de puntos (halftone) sobre una rejilla rotada, como en offset real */
float dots(vec2 frag, float ang, float cell, float tone){
  float s = sin(ang), c = cos(ang);
  vec2 p = mat2(c, -s, s, c) * frag / cell;
  vec2 g = fract(p) - 0.5;
  float r = sqrt(clamp(tone, 0.0, 1.0)) * 0.72;
  float aa = 0.9 / cell;
  return smoothstep(r + aa, r - aa, length(g));
}
void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0);
  float t = uTime * 0.07;

  vec2 q = vec2(fbm(p * 1.5 + vec2(t, -t * 0.6)), fbm(p * 1.5 + vec2(-t * 0.7, t) + 3.1));
  vec2 w = p + (q - 0.5) * 1.0;

  vec2 m = (uMouse - 0.5) * vec2(asp, 1.0);
  float swell = smoothstep(0.5, 0.0, length(p - m));

  float fc = fbm(w * 2.1 + vec2( t * 1.3, 0.0) + 1.7);
  float fm = fbm(w * 2.1 + vec2(0.0, -t * 1.1) + 9.3);
  float fy = fbm(w * 2.1 + vec2(-t, t * 0.8) + 17.9);
  float tc = smoothstep(0.44, 0.80, fc + swell * 0.30);
  float tm = smoothstep(0.46, 0.82, fm + swell * 0.30);
  float ty = smoothstep(0.50, 0.86, fy + swell * 0.30);

  /* la tinta se concentra a la derecha/arriba y deja limpia la zona del texto */
  float mask = mix(0.10, 1.0, smoothstep(0.15, 0.85, uv.x)) * mix(0.5, 1.0, smoothstep(0.0, 0.6, uv.y));

  float cell = max(6.0, uRes.y / 92.0);
  float dc = dots(frag, 0.2618, cell, tc * mask);  /* cian    15° */
  float dm = dots(frag, 1.3090, cell, tm * mask);  /* magenta 75° */
  float dy = dots(frag, 0.0,    cell, ty * mask);  /* amarillo 0° */

  vec3 C = vec3(0.0, 0.682, 0.937);
  vec3 M = vec3(0.925, 0.0, 0.549);
  vec3 Y = vec3(1.0, 0.949, 0.0);
  vec3 ink = vec3(0.027, 0.047, 0.094);
  vec3 col = ink + C * dc * 0.78 + M * dm * 0.78 + Y * dy * 0.70;
  col *= 1.0 - 0.45 * dot(uv - 0.5, uv - 0.5);
  col = mix(ink, col, uFade);
  gl_FragColor = vec4(col, 1.0);
}`;

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn('[Flash Print] shader:', gl.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uMouse = gl.getUniformLocation(prog, 'uMouse');
    const uFade = gl.getUniformLocation(prog, 'uFade');

    const mouse = { x: 0.72, y: 0.55, tx: 0.72, ty: 0.55 };
    let paused = false;
    let raf = 0;
    const t0 = performance.now();

    let quality = 1;      // baja sola si el equipo no alcanza ~30fps
    let frames = 0; let acc = 0; let last = 0;
    function resize() {
      const small = window.innerWidth < 768;
      const scale = Math.min(window.devicePixelRatio || 1, 1.25) * (small ? 0.6 : 0.85) * quality;
      const w = Math.max(2, Math.floor(canvas.clientWidth * scale));
      const h = Math.max(2, Math.floor(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }
    function render(now, fixedTime) {
      const time = fixedTime != null ? fixedTime : (now - t0) / 1000;
      if (!mqFine.matches && fixedTime == null) {
        mouse.tx = 0.72 + Math.sin(time * 0.35) * 0.14;
        mouse.ty = 0.55 + Math.cos(time * 0.28) * 0.12;
      }
      mouse.x = lerp(mouse.x, mouse.tx, 0.06);
      mouse.y = lerp(mouse.y, mouse.ty, 0.06);
      const fade = clamp(1 - window.scrollY / (window.innerHeight * 0.95), 0, 1);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uFade, REDUCE ? 1 : fade);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (document.hidden) { last = 0; return; }
      if (last) {
        acc += now - last; frames += 1;
        if (frames >= 40) {
          if (acc / frames > 34 && quality > 0.42) { quality *= 0.78; resize(); }
          frames = 0; acc = 0;
        }
      }
      last = now;
      render(now);
    }
    function start() { if (!raf && !REDUCE) raf = requestAnimationFrame(loop); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    window.addEventListener('pointermove', (e) => {
      if (paused || e.pointerType === 'touch') return;
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = 1 - e.clientY / window.innerHeight;
    }, { passive: true });
    window.addEventListener('resize', () => { resize(); if (REDUCE) render(0, 5); });

    resize();
    if (REDUCE) render(0, 5); else start();

    return {
      setPaused(v) {
        if (v === paused) return;
        paused = v;
        v ? stop() : start();
      },
    };
  }

  /* ═════════════ 7 · PRELOADER ═════════════ */
  function decodeImage(img) {
    if (!img) return Promise.resolve();
    if (img.decode) return img.decode().catch(() => {});
    return new Promise((res) => { img.complete ? res() : img.addEventListener('load', res, { once: true }); });
  }

  function runLoader(onDone) {
    const loader = $('#loader');
    if (!loader) { onDone(); return; }
    const pctEl = $('#loader-pct');
    const labelEl = $('#loader-label');
    const plateBars = $$('.loader__plates i');
    const fill = $('.loader__bolt-fill');
    const labels = ['Calibrando tintas', 'Cargando tipografías', 'Alineando registro', 'Listo para imprimir'];

    const waitFonts = Promise.race([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise((r) => setTimeout(r, 3500)),
    ]);
    const waitLoad = new Promise((res) => {
      if (document.readyState === 'complete') res();
      else window.addEventListener('load', res, { once: true });
    });
    const ready = Promise.all([waitFonts, waitLoad, decodeImage($('#hero-logo'))]);

    const state = { v: 0 };
    let finished = false;
    const paint = () => {
      const v = state.v;
      pctEl.textContent = String(Math.round(v));
      plateBars.forEach((bar, i) => bar.style.setProperty('--f', clamp((v - i * 25) / 25, 0, 1)));
      labelEl.textContent = labels[clamp(Math.floor(v / 26), 0, 3)];
      if (fill) fill.style.clipPath = `inset(${100 - v}% 0 0 0)`;
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      loader.setAttribute('aria-busy', 'false');
      if (!HAS_GSAP) {
        loader.remove();
        root.classList.remove('is-loading');
        onDone();
        return;
      }
      const tl = gsap.timeline({
        onComplete: () => { loader.remove(); root.classList.remove('is-loading'); },
      });
      tl.to(state, { v: 100, duration: 0.45, ease: 'power2.out', onUpdate: paint })
        .to('.loader__core,.loader__meta', { autoAlpha: 0, scale: 1.12, duration: 0.5, ease: 'power2.in' }, '+=0.15')
        .to('.loader__panel--top', { yPercent: -101, duration: 1.0, ease: 'expo.inOut' }, '-=0.15')
        .to('.loader__panel--bot', { yPercent: 101, duration: 1.0, ease: 'expo.inOut' }, '<')
        .add(onDone, '-=0.55');
    };

    if (!HAS_GSAP) { ready.then(finish); setTimeout(finish, 4000); return; }

    const minTime = REDUCE ? 0.2 : 1.9;
    gsap.to(state, { v: 88, duration: minTime, ease: 'power1.out', onUpdate: paint });
    Promise.all([ready, new Promise((r) => setTimeout(r, minTime * 1000))]).then(finish);
    setTimeout(finish, 6500); // salvavidas
  }

  /* ═════════════ 8 · INTRO DEL HERO ═════════════ */
  let heroWords = [];
  function prepHero() {
    if (!HAS_GSAP || REDUCE) return;
    const title = $('.hero__title');
    if (title) heroWords = wrapWords(title, 'mask');
    gsap.set(heroWords, { yPercent: 118, rotate: 5 });
    gsap.set(['.hero__eyebrow', '.hero__lead', '.hero__actions'], { autoAlpha: 0, y: 30 });
    gsap.set('.hero__art', { autoAlpha: 0, scale: 0.78 });
    gsap.set('.nav__bar', { yPercent: -180, autoAlpha: 0 });
    gsap.set('.wa-float', { scale: 0, transformOrigin: '100% 100%' });
  }
  function playIntro() {
    root.classList.remove('is-loading');
    if (lenis) lenis.start();
    if (!HAS_GSAP || REDUCE) {
      setTimeout(() => $('#wa-float') && $('#wa-float').classList.add('is-tip'), 6500);
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('.hero__art', { autoAlpha: 1, scale: 1, duration: 1.8 }, 0)
      .to('.hero__eyebrow', { autoAlpha: 1, y: 0, duration: 0.9 }, 0.15)
      .to(heroWords, { yPercent: 0, rotate: 0, duration: 1.25, stagger: 0.075 }, 0.25)
      .to('.hero__lead', { autoAlpha: 1, y: 0, duration: 1 }, 0.75)
      .to('.hero__actions', { autoAlpha: 1, y: 0, duration: 1 }, 0.9)
      .to('.nav__bar', { yPercent: 0, autoAlpha: 1, duration: 1.1 }, 0.7)
      .to('.wa-float', { scale: 1, duration: 1.2, ease: 'elastic.out(1,.55)' }, 1.6);
    // rayo periódico: pulso de luz desde el logotipo (identidad de marca)
    if (!REDUCE) {
      gsap.timeline({ repeat: -1, repeatDelay: 6.5, delay: 3 })
        .to('.hero__flash', { opacity: 0.6, duration: 0.07 })
        .to('.hero__flash', { opacity: 0.05, duration: 0.09 })
        .to('.hero__flash', { opacity: 0.45, duration: 0.06 })
        .to('.hero__flash', { opacity: 0, duration: 1.1, ease: 'power2.out' });
    }
    setTimeout(() => $('#wa-float') && $('#wa-float').classList.add('is-tip'), 6500);
    setTimeout(() => $('#wa-float') && $('#wa-float').classList.remove('is-tip'), 12500);
  }

  /* inclinación 3D del logotipo con el puntero */
  function initHeroTilt() {
    if (!HAS_GSAP || REDUCE || !mqFine.matches) return;
    const art = $('.hero__art');
    const hero = $('.hero');
    if (!art || !hero) return;
    const rx = gsap.quickTo(art, 'rotationX', { duration: 1.1, ease: 'power3' });
    const ry = gsap.quickTo(art, 'rotationY', { duration: 1.1, ease: 'power3' });
    gsap.set(art, { transformPerspective: 1000 });
    hero.addEventListener('pointermove', (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      ry(nx * 14);
      rx(-ny * 12);
    });
    hero.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }

  /* ═════════════ 9 · MARQUEE (reacciona a la velocidad del scroll) ═════════════ */
  function initMarquee() {
    const wrap = $('#marquee');
    if (!wrap || REDUCE || !HAS_GSAP) return;
    const track = $('.marquee__track', wrap);
    const set = $('.marquee__set', track);
    const setW = () => set.offsetWidth;
    const copies = Math.ceil((window.innerWidth * 2.4) / Math.max(1, setW())) + 1;
    for (let i = 0; i < copies; i++) track.appendChild(set.cloneNode(true));
    let x = 0;
    let boost = 0;
    gsap.ticker.add((_, dt) => {
      const d = dt / 1000;
      const v = lenis ? lenis.velocity : 0;
      boost = lerp(boost, v, 0.08);
      x -= (70 + Math.abs(boost) * 38) * d;
      const w = setW();
      if (w && x <= -w) x += w;
      track.style.transform = `translate3d(${x}px,0,0)`;
    });
  }

  /* ═════════════ 10 · PLIEGO: impresión en 4 tintas (canvas) ═════════════ */
  function createSheetArt(canvas) {
    const ctx = canvas.getContext('2d');
    const PAPER = '#F3F5F8';
    const COL = { c: '#00AEEF', m: '#EC008C', y: '#FFF200', k: '#0B1020' };
    const ORDER = ['c', 'm', 'y', 'k'];
    const RANGE = { c: [0, 0.26], m: [0.24, 0.5], y: [0.48, 0.74], k: [0.72, 1] };
    const NAMES = { c: 'cian', m: 'magenta', y: 'amarillo', k: 'negro' };
    const BOLT = [[40, 2], [12, 34], [28, 34], [22, 62], [52, 24], [36, 24]];
    let W = 0; let H = 0; let dpr = 1; let unit = 1; let layers = null; let guides = null; let lastP = 0;

    const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    const mkCanvas = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };

    /* convierte un campo de tonos en puntos de trama a un ángulo dado */
    function halftone(toneFn, angleDeg, cell, color) {
      const c = mkCanvas();
      const g = c.getContext('2d');
      g.fillStyle = color;
      const a = (angleDeg * Math.PI) / 180;
      const ca = Math.cos(a); const sa = Math.sin(a);
      const n = Math.ceil(Math.hypot(W, H) / cell / 2) + 2;
      for (let i = -n; i <= n; i++) {
        for (let j = -n; j <= n; j++) {
          const gx = i * cell; const gy = j * cell;
          const x = W / 2 + gx * ca - gy * sa;
          const y = H / 2 + gx * sa + gy * ca;
          if (x < -cell || y < -cell || x > W + cell || y > H + cell) continue;
          const t = toneFn(x, y);
          if (t < 0.03) continue;
          g.beginPath();
          g.arc(x, y, Math.sqrt(t) * cell * 0.74, 0, 6.2832);
          g.fill();
        }
      }
      return c;
    }

    /* marcas de corte y de registro (guías tenues + tinta negra) */
    function drawMarks(g, s, color, lw) {
      g.strokeStyle = color; g.fillStyle = color; g.lineWidth = lw;
      const m = s * 0.055; const L = s * 0.035; const off = s * 0.012;
      const line = (x1, y1, x2, y2) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
      [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, sx, sy]) => {
        line(x - sx * (off + L), y, x - sx * off, y);
        line(x, y - sy * (off + L), x, y - sy * off);
      });
      const target = (x, y) => {
        const r = s * 0.013;
        g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.stroke();
        g.beginPath(); g.arc(x, y, r * 0.38, 0, 6.2832); g.fill();
        line(x - r * 2.1, y, x + r * 2.1, y);
        line(x, y - r * 2.1, x, y + r * 2.1);
      };
      target(m * 0.7, H / 2); target(W - m * 0.7, H / 2);
      target(W / 2, H - m * 0.7);
    }

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(2, Math.round(canvas.clientWidth * dpr));
      H = Math.max(2, Math.round(canvas.clientHeight * dpr));
      canvas.width = W; canvas.height = H;
      const s = Math.min(W, H * 1.08);
      unit = s;
      /* zona útil: debajo de la nav (arriba) y de la barra de narración (abajo) */
      const cx = W / 2; const cy = H * 0.467;
      const R = Math.min(W / 3.4, H * 0.235);
      const cell = Math.max(5 * dpr, s / 105);
      const pts = { c: [cx - R * 0.62, cy - R * 0.42], m: [cx + R * 0.62, cy - R * 0.42], y: [cx, cy + R * 0.66] };
      const disc = ([px, py]) => (x, y) => 1 - smooth(R * 0.5, R, Math.hypot(x - px, y - py));

      layers = {
        c: halftone(disc(pts.c), 15, cell, COL.c),
        m: halftone(disc(pts.m), 75, cell, COL.m),
        y: halftone(disc(pts.y), 0, cell, COL.y),
        k: mkCanvas(),
      };

      /* plancha negra: rayo + anillo + marcas + rotulado */
      const g = layers.k.getContext('2d');
      g.fillStyle = COL.k;
      const bh = R * 1.7; const k = bh / 60;
      g.beginPath();
      BOLT.forEach(([x, y], i) => {
        const px = cx + (x - 32) * k; const py = cy + (y - 32) * k;
        i ? g.lineTo(px, py) : g.moveTo(px, py);
      });
      g.closePath(); g.fill();
      g.setLineDash([6 * dpr, 7 * dpr]);
      g.strokeStyle = COL.k; g.lineWidth = Math.max(1, 1.4 * dpr);
      g.beginPath(); g.arc(cx, cy + R * 0.1, R * 1.62, 0, 6.2832); g.stroke();
      g.setLineDash([]);
      drawMarks(g, s, COL.k, Math.max(1, dpr));

      /* tira de control de color, justo debajo de la nav */
      const patches = [{ c: 1 }, { m: 1 }, { y: 1 }, { k: 1 }, { c: 0.5 }, { m: 0.5 }, { y: 0.5 }, { k: 0.5 }, { c: 1, m: 1 }, { m: 1, y: 1 }, { c: 1, y: 1 }, { c: 1, m: 1, y: 1 }];
      const pw = Math.min(W * 0.052, s * 0.055); const ph = Math.min(s * 0.02, 16 * dpr);
      const sx0 = (W - pw * patches.length) / 2; const sy = 86 * dpr;
      patches.forEach((p, i) => ORDER.forEach((ch) => {
        if (!p[ch]) return;
        const pg = layers[ch].getContext('2d');
        pg.globalAlpha = p[ch]; pg.fillStyle = COL[ch];
        pg.fillRect(sx0 + i * pw, sy, pw, ph);
        pg.globalAlpha = 1;
      }));

      guides = mkCanvas();
      const gg = guides.getContext('2d');
      drawMarks(gg, s, 'rgba(7,12,24,.17)', Math.max(1, dpr));
      /* guías de composición: círculos y rayo en trazo punteado (así no se ve vacío antes de imprimir) */
      gg.strokeStyle = 'rgba(7,12,24,.20)'; gg.lineWidth = Math.max(1, dpr);
      gg.setLineDash([5 * dpr, 7 * dpr]);
      Object.values(pts).forEach(([px, py]) => { gg.beginPath(); gg.arc(px, py, R, 0, 6.2832); gg.stroke(); });
      gg.beginPath();
      BOLT.forEach(([x, y], i) => { const px = cx + (x - 32) * k; const py = cy + (y - 32) * k; i ? gg.lineTo(px, py) : gg.moveTo(px, py); });
      gg.closePath(); gg.stroke(); gg.setLineDash([]);
    }

    function drawHead(y, color, label) {
      const hh = Math.max(3, dpr * 3);
      ctx.save();
      ctx.shadowColor = color; ctx.shadowBlur = 26 * dpr;
      ctx.fillStyle = color;
      ctx.fillRect(0, y - hh / 2, W, hh);
      ctx.restore();
      ctx.fillStyle = COL.k;
      ctx.fillRect(0, y - 0.5 * dpr, W, Math.max(1, dpr));
      const sweep = (lastP * 36) % 2;
      const x = (sweep > 1 ? 2 - sweep : sweep) * W;
      ctx.fillRect(x - 30 * dpr, y - 10 * dpr, 60 * dpr, 20 * dpr);
      ctx.fillStyle = color;
      ctx.fillRect(x - 30 * dpr, y + 7 * dpr, 60 * dpr, 3 * dpr);
      /* etiqueta que viaja con el cabezal: dice qué tinta se está imprimiendo */
      const fs = Math.round(11 * dpr);
      ctx.font = `500 ${fs}px "Geist Mono", monospace`;
      ctx.textBaseline = 'middle';
      const tw = ctx.measureText(label).width;
      const padX = 10 * dpr; const th = 26 * dpr; const sq = 10 * dpr;
      const lx = Math.max(14 * dpr, unit * 0.07); const ly = y - th - 10 * dpr;
      const lw = padX * 2 + sq + 8 * dpr + tw;
      ctx.fillStyle = COL.k;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(lx, ly, lw, th, th / 2); else ctx.rect(lx, ly, lw, th);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.fillRect(lx + padX, ly + (th - sq) / 2, sq, sq);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, lx + padX + sq + 8 * dpr, ly + th / 2 + dpr * 0.5);
    }

    /* p: 0..1 progreso de impresión. Devuelve el estado para la interfaz. */
    function draw(p) {
      if (!layers) build();
      lastP = p;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(guides, 0, 0);
      ctx.globalCompositeOperation = 'multiply';
      let active = -1; let headY = 0;
      ORDER.forEach((ch, i) => {
        const [a, b] = RANGE[ch];
        const f = clamp((p - a) / (b - a), 0, 1);
        if (f <= 0) return;
        const h = Math.max(1, Math.round(f * H));
        ctx.drawImage(layers[ch], 0, 0, W, h, 0, 0, W, h);
        if (f < 1) { active = i; headY = f * H; }
      });
      ctx.globalCompositeOperation = 'source-over';
      if (active > -1) {
        const ch = ORDER[active];
        const f = clamp((p - RANGE[ch][0]) / (RANGE[ch][1] - RANGE[ch][0]), 0, 1);
        drawHead(headY, COL[ch], `IMPRIMIENDO ${NAMES[ch].toUpperCase()} ${Math.round(f * 100)}%`);
      }
      const done = ORDER.filter((ch) => p > RANGE[ch][0] + 0.005);
      const key = p <= 0.004 ? 'idle' : p >= 0.999 ? 'done' : (active > -1 ? ORDER[active] : 'k');
      return { active, done, key, pct: Math.round(p * 100) };
    }

    return { build, draw, rebuild() { layers = null; build(); return draw(lastP); } };
  }

  function initSheet() {
    const section = $('.sheet');
    const stage = $('#sheet-stage');
    const canvas = $('#sheet-canvas');
    if (!section || !stage || !canvas) return;
    const art = createSheetArt(canvas);
    const dock = $('#sheet-dock');
    const plates = $$('.plates li', dock);
    const titleEl = $('#dock-title');
    const descEl = $('#dock-desc');
    const pctEl = $('#dock-pct');
    /* guion: qué hace cada tinta, para que nunca parezca que "no pasa nada" */
    const STORY = {
      idle: { t: 'Un pliego en blanco', d: 'Así empieza cada impresión. Baja y míralo recibir el color, tinta por tinta.', tone: '#FFFFFF' },
      c: { t: 'Primero, el cian', d: 'La base de los azules, los verdes y los cielos.', tone: '#00AEEF' },
      m: { t: 'Ahora, el magenta', d: 'Suma rosas, rojos y morados al mezclarse con el cian.', tone: '#EC008C' },
      y: { t: 'Entra el amarillo', d: 'Aporta luz y calidez. Con el cian forma los verdes.', tone: '#FFF200' },
      k: { t: 'Cierra el negro', d: 'Define detalles y contraste. Da nitidez a todo.', tone: '#FFFFFF' },
      done: { t: 'Listo. Color fiel, de borde a borde.', d: 'Cuatro tintas reproducen cualquier color de tu diseño.', tone: '#FFF200' },
    };
    let lastKey = '';
    let lastPct = -1;
    const paintUI = (st) => {
      if (st.pct !== lastPct) { lastPct = st.pct; pctEl.textContent = String(st.pct); }
      if (st.key === lastKey) return;
      const first = lastKey === '';
      lastKey = st.key;
      const story = STORY[st.key];
      plates.forEach((li) => li.classList.toggle('is-on', st.done.includes(li.dataset.plate)));
      dock.classList.toggle('is-done', st.key === 'done');
      dock.style.setProperty('--tone', story.tone);
      titleEl.textContent = story.t;
      descEl.textContent = story.d;
      if (HAS_GSAP && !REDUCE && !first) {
        gsap.fromTo([titleEl, descEl], { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out', overwrite: true });
      }
    };

    if (!HAS_GSAP || REDUCE) {
      paintUI(art.draw(1));
      window.addEventListener('resize', () => paintUI(art.rebuild()));
      return;
    }

    section.classList.add('is-anim');
    const state = { p: 0 };
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const intro = $('.sheet__intro');
      /* la tarjeta inicial se acomoda entre el título (arriba) y la barra de narración (abajo) */
      const clipFrom = () => {
        const vw = window.innerWidth; const vh = window.innerHeight;
        const introBottom = intro.offsetTop + intro.offsetHeight;
        const bottom = dock.offsetHeight + 36;
        const cw = Math.min(vw * 0.86, 560);
        const maxH = vh - bottom - introBottom - 18;
        const ch = clamp(Math.min(vh * (vw < 700 ? 0.42 : 0.46), 460), 190, Math.max(190, maxH));
        const left = (vw - cw) / 2; const top = vh - bottom - ch;
        return `inset(${top}px ${left}px ${bottom}px ${left}px round 28px)`;
      };
      state.p = 0;
      paintUI(art.draw(0));
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section, start: 'top top', end: '+=340%', pin: true, scrub: 0.6,
          anticipatePin: 1, invalidateOnRefresh: true,
          onToggle: (self) => root.classList.toggle('sheet-active', self.isActive),
          onRefresh: () => { paintUI(art.rebuild()); },
        },
      });
      tl.fromTo(stage, { clipPath: clipFrom }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', ease: 'power2.inOut', duration: 1.15 }, 0)
        .fromTo(canvas, { scale: 1.14 }, { scale: 1, ease: 'power2.out', duration: 1.5 }, 0)
        .to(intro, { autoAlpha: 0, y: -50, duration: 0.5, ease: 'power2.in' }, 0.04)
        .to(state, { p: 1, ease: 'none', duration: 3, onUpdate: () => paintUI(art.draw(state.p)) }, 0.65)
        .to({}, { duration: 0.35 });
      return () => { section.classList.remove('is-anim'); };
    });
  }

  /* ═════════════ 11 · SERVICIOS: scroll horizontal fijado (desktop) ═════════════ */
  function initServices() {
    if (!HAS_GSAP) return;
    const section = $('.svc');
    const track = $('.svc__track');
    const bar = $('.svc__bar i');
    if (!section || !track) return;
    const cards = $$('.svc-card', track);
    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)', () => {
      section.classList.add('is-hpin');
      const dist = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: section, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8,
          invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => { if (bar) bar.style.transform = `scaleX(${self.progress})`; },
        },
      });
      cards.forEach((card) => {
        ScrollTrigger.create({
          trigger: card, containerAnimation: tween, start: 'left 72%', end: 'right 28%',
          toggleClass: { targets: card, className: 'is-reg' },
        });
        const glyph = $('.reg--k', card);
        if (glyph) {
          gsap.fromTo(glyph, { xPercent: -7 }, {
            xPercent: 7, ease: 'none',
            scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
          });
        }
      });
      return () => section.classList.remove('is-hpin');
    });

    mm.add('(max-width: 1023px), (prefers-reduced-motion: reduce)', () => {
      const viewport = $('.svc__viewport');
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => en.target.classList.toggle('is-reg', en.intersectionRatio > 0.6));
      }, { root: viewport, threshold: [0, 0.6, 1] });
      cards.forEach((c) => io.observe(c));
      return () => io.disconnect();
    });
  }

  /* ═════════════ 12 · MANIFIESTO: texto que se "imprime" con el scroll + cifras ═════════════ */
  function initManifesto() {
    const p = $('.manifesto__text');
    if (!p) return;
    const words = wrapWords(p, 'plain');
    if (!HAS_GSAP || REDUCE) return;
    const marks = $$('mark', p).map((m) => {
      const idx = words.filter((w) => m.contains(w)).map((w) => words.indexOf(w));
      return { el: m, a: idx[0], n: idx.length };
    });
    p.classList.add('is-scrub');
    const n = words.length;
    const apply = (progress) => {
      const pos = progress * (n + 4);
      words.forEach((w, i) => { w.style.opacity = (0.14 + 0.86 * clamp(pos - i, 0, 1)).toFixed(3); });
      marks.forEach((m) => m.el.style.setProperty('--hl', clamp((pos - m.a - 2) / Math.max(1, m.n), 0, 1).toFixed(3)));
    };
    marks.forEach((m) => m.el.style.setProperty('--hl', 0));
    apply(0);
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      ScrollTrigger.create({
        trigger: p, start: 'top 80%', end: 'bottom 48%', scrub: true,
        onUpdate: (self) => apply(self.progress),
      });
    });
  }

  function initCounters() {
    $$('[data-count]').forEach((el) => {
      const target = parseFloat(el.dataset.count);
      if (!HAS_GSAP || REDUCE) { el.textContent = String(target); return; }
      const obj = { v: 0 };
      el.textContent = '0';
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.to(obj, {
          v: target, duration: 1.8, ease: 'power2.out',
          onUpdate: () => { el.textContent = String(Math.round(obj.v)); },
          onComplete: () => { el.textContent = String(target); },
        }),
      });
    });
  }

  /* ═════════════ 13. REVELADOS DE TITULARES Y ELEMENTOS ═════════════ */
  function initReveals() {
    if (!HAS_GSAP || REDUCE) return;
    // Titulares: palabra por palabra, con el marcador amarillo que se dibuja detrás
    $$('[data-split]').forEach((h) => {
      if (h.classList.contains('hero__title')) return;
      const words = wrapWords(h, 'mask');
      const ems = $$('em', h);
      gsap.set(words, { yPercent: 118, rotate: 4 });
      if (ems.length && h.closest('.s-light')) gsap.set(ems, { '--hl': 0 });
      ScrollTrigger.create({
        trigger: h, start: 'top 86%', once: true,
        onEnter: () => {
          gsap.to(words, { yPercent: 0, rotate: 0, duration: 1.15, stagger: 0.06, ease: 'expo.out' });
          if (ems.length && h.closest('.s-light')) gsap.to(ems, { '--hl': 1, duration: 0.9, delay: 0.55, ease: 'power2.out' });
        },
      });
    });

    // Elementos sueltos: entrada escalonada por lotes
    const sel = ['.lead', '.facts__item', '.tile', '.step', '.qa', '.board__row', '.contact__list li', '.form',
      '.cfg__stage', '.cfg__panel .field', '.cfg__panel .total', '.cfg__cta', '.cfg__fine', '.epp__art', '.epp__copy .btn',
      '.proc__head .btn', '.foot__grid > *', '.faq__head .eyebrow', '.epp__copy .eyebrow'].join(',');
    const items = $$(sel).filter((el) => !el.closest('.svc, .sheet, .hero'));
    gsap.set(items, { autoAlpha: 0, y: 46 });
    ScrollTrigger.batch(items, {
      start: 'top 90%', once: true,
      onEnter: (batch) => gsap.to(batch, {
        autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.09, ease: 'expo.out', overwrite: true,
        clearProps: 'transform,opacity,visibility',
      }),
    });
  }

  /* ═════════════ 14 · PARALLAX / CORTINA DEL HERO, PROGRESO, NAV ═════════════ */
  function initPageMotion() {
    if (!HAS_GSAP) return;
    ScrollTrigger.create({
      start: 40, end: 'max',
      toggleClass: { targets: '#nav', className: 'is-scrolled' },
    });
    if (REDUCE) return;
    gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });

    // el hero se "hunde" mientras el contenido lo cubre
    gsap.to('.hero__inner', {
      yPercent: 10, scale: 0.94, opacity: 0.25, ease: 'none',
      scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'top 15%', scrub: true },
    });
    // el shader se pausa cuando ya está cubierto
    ScrollTrigger.create({
      trigger: '.manifesto', start: 'top top',
      onEnter: () => heroGL && heroGL.setPaused(true),
      onLeaveBack: () => heroGL && heroGL.setPaused(false),
    });

    // cinta del lanyard: se desplaza con el scroll (sin loop infinito)
    const strap = $('.strap');
    if (strap) {
      gsap.fromTo(strap, { '--sx': '-12%' }, {
        '--sx': '2%', ease: 'none',
        scrollTrigger: { trigger: '.tile--lan', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }

    // texto gigante del footer
    gsap.from('.foot__giant', {
      yPercent: 45, autoAlpha: 0, duration: 1.4, ease: 'expo.out',
      scrollTrigger: { trigger: '.foot__giant', start: 'top 98%', once: true },
    });
  }

  /* ═════════════ 14b · NAV: enlace activo según la sección visible ═════════════ */
  function initNavActive() {
    if (!HAS_GSAP) return;
    const links = $$('.nav__links a');
    links.forEach((a) => {
      const sec = $(a.getAttribute('href'));
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 55%', end: 'bottom 55%',
        onToggle: (self) => a.classList.toggle('is-active', self.isActive),
      });
    });
  }

  /* ═════════════ 15 · PROCESO: línea que se dibuja ═════════════ */
  function initProcess() {
    const list = $('#steps');
    if (!list) return;
    const steps = $$('.step', list);
    if (!HAS_GSAP || REDUCE) { steps.forEach((s) => s.classList.add('is-on')); return; }
    const line = document.createElement('i');
    line.className = 'steps__line';
    line.setAttribute('aria-hidden', 'true');
    list.prepend(line);
    gsap.to(line, {
      '--p': 1, ease: 'none',
      scrollTrigger: { trigger: list, start: 'top 62%', end: 'bottom 62%', scrub: true },
    });
    steps.forEach((s) => ScrollTrigger.create({
      trigger: s, start: 'top 62%', toggleClass: { targets: s, className: 'is-on' },
    }));
  }

  /* ═════════════ 16 · PRECIOS ═════════════ */
  function initPricing() {
    $$('.board__row').forEach((row) => {
      const side = (e) => {
        const r = row.getBoundingClientRect();
        row.style.setProperty('--ox', e.clientX < r.left + r.width / 2 ? '0%' : '100%');
      };
      row.addEventListener('pointerenter', side);
      row.addEventListener('pointerleave', side);
    });
    if (!HAS_GSAP || REDUCE) return;
    const steps = $$('.stair__step');
    gsap.set(steps, { transformOrigin: '50% 100%', scaleY: 0 });
    ScrollTrigger.create({
      trigger: '.stair', start: 'top 88%', once: true,
      onEnter: () => gsap.to(steps, { scaleY: 1, duration: 1.2, stagger: 0.14, ease: 'expo.out' }),
    });
  }

  /* ═════════════ 17 · REGISTRO DE COLOR en tiles y EPP (se "alinean" al verse) ═════════════ */
  function initRegistration() {
    const targets = $$('.tile, .epp__badge');
    if (!('IntersectionObserver' in window)) { targets.forEach((t) => t.classList.add('is-reg')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => en.target.classList.toggle('is-reg', en.intersectionRatio > 0.5));
    }, { threshold: [0, 0.5, 1] });
    targets.forEach((t) => io.observe(t));

    // foco de luz que sigue al puntero en los tiles
    if (mqFine.matches) {
      $$('.tile').forEach((tile) => {
        tile.addEventListener('pointermove', (e) => {
          const r = tile.getBoundingClientRect();
          tile.style.setProperty('--mx', `${e.clientX - r.left}px`);
          tile.style.setProperty('--my', `${e.clientY - r.top}px`);
        });
      });
    }
  }

  /* ═════════════ 18 · CONFIGURADOR DE PLAYERA ═════════════ */
  function initConfigurator() {
    const form = $('#cfg-form');
    if (!form) return;
    const stage = $('#cfg-stage');
    const shirt = $('#shirt');
    const qty = $('#qty');
    const totalEl = $('#cfg-total');
    const unitEl = $('#cfg-unit');
    const saveEl = $('#cfg-save');
    const cta = $('#cfg-cta');
    const tiers = $$('.tiers li');
    const priceFor = (n) => (n >= 100 ? 130 : n >= 12 ? 145 : 190);
    const fmt = (n) => `$${n.toLocaleString('es-MX')}`;
    const num = { v: 0 };
    let first = true;

    const readQty = () => {
      let n = parseInt(qty.value, 10);
      if (!Number.isFinite(n) || n < 1) n = 1;
      return clamp(n, 1, 999);
    };

    function update() {
      const n = readQty();
      const checked = form.querySelector('input[name="color"]:checked');
      const color = checked.value;
      const size = form.querySelector('input[name="talla"]:checked').value;
      const unit = priceFor(n);
      const total = unit * n;
      const saved = 190 * n - total;

      stage.style.setProperty('--shirt', checked.dataset.hex);
      shirt.setAttribute('aria-label', `Playera Dry Fit color ${color} con estampado tamaño carta`);
      const tierIdx = n >= 100 ? 2 : n >= 12 ? 1 : 0;
      tiers.forEach((li, i) => li.classList.toggle('is-on', i === tierIdx));
      unitEl.textContent = `${n} ${n === 1 ? 'pieza' : 'piezas'} a ${fmt(unit)} c/u`;
      saveEl.hidden = saved <= 0;
      saveEl.textContent = `Ahorras ${fmt(saved)} frente a menudeo`;

      if (HAS_GSAP && !REDUCE && !first) {
        gsap.to(num, { v: total, duration: 0.6, ease: 'power3.out', overwrite: true, onUpdate: () => { totalEl.textContent = fmt(Math.round(num.v)); } });
      } else {
        num.v = total;
        totalEl.textContent = fmt(total);
      }
      first = false;

      const msg = [
        'Hola Flash Print, quiero cotizar playeras Dry Fit Spandex.',
        `Color: ${color}`,
        `Talla: ${size}`,
        `Cantidad: ${n} ${n === 1 ? 'pieza' : 'piezas'}`,
        `Total estimado: ${fmt(total)} MXN (${fmt(unit)} c/u)`,
        'Mi logo o diseño lo envío por aquí.',
      ].join('\n');
      cta.href = waUrl(msg);
    }

    form.addEventListener('change', update);
    form.addEventListener('submit', (e) => e.preventDefault());
    qty.addEventListener('input', update);
    qty.addEventListener('blur', () => { qty.value = String(readQty()); update(); });
    $('#qty-minus').addEventListener('click', () => { qty.value = String(clamp(readQty() - 1, 1, 999)); update(); });
    $('#qty-plus').addEventListener('click', () => { qty.value = String(clamp(readQty() + 1, 1, 999)); update(); });
    update();

    // inclinación suave de la playera con el puntero
    if (mqFine.matches && !REDUCE) {
      let raf = 0;
      stage.addEventListener('pointermove', (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const r = stage.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          shirt.style.transform = `perspective(900px) rotateY(${nx * 12}deg) rotateX(${-ny * 9}deg)`;
        });
      });
      stage.addEventListener('pointerleave', () => { shirt.style.transform = ''; });
    }
  }

  /* ═════════════ 19 · FAQ ═════════════ */
  function initFaq() {
    const buttons = $$('.qa__q');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const wasOpen = btn.getAttribute('aria-expanded') === 'true';
        buttons.forEach((b) => { b.setAttribute('aria-expanded', 'false'); b.closest('.qa').classList.remove('is-open'); });
        if (!wasOpen) { btn.setAttribute('aria-expanded', 'true'); btn.closest('.qa').classList.add('is-open'); }
        if (HAS_GSAP) setTimeout(() => ScrollTrigger.refresh(), 650);
      });
    });
  }

  /* ═════════════ 20 · FORMULARIO → WHATSAPP ═════════════ */
  function initContactForm() {
    const form = $('#contact-form');
    if (!form) return;
    const name = $('#f-name'); const service = $('#f-service'); const msg = $('#f-msg');
    const status = $('#form-status');
    const setErr = (input, text) => {
      const out = $(`#${input.id}-err`);
      if (out) out.textContent = text;
      input.classList.toggle('is-invalid', !!text);
      input.setAttribute('aria-invalid', text ? 'true' : 'false');
      if (out) input.setAttribute('aria-describedby', out.id);
    };
    [name, service].forEach((el) => el.addEventListener('input', () => setErr(el, '')));
    service.addEventListener('change', () => setErr(service, ''));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      const n = name.value.trim();
      if (n.length < 2) { setErr(name, 'Escribe tu nombre para saber cómo llamarte.'); ok = false; } else setErr(name, '');
      if (!service.value) { setErr(service, 'Elige qué quieres imprimir.'); ok = false; } else setErr(service, '');
      if (!ok) { status.textContent = ''; (n.length < 2 ? name : service).focus(); return; }

      const lines = [`Hola Flash Print, soy ${n}.`, `Quiero cotizar: ${service.value}.`];
      if (msg.value.trim()) lines.push(`Detalles: ${msg.value.trim()}`);
      const url = waUrl(lines.join('\n'));
      const win = window.open(url, '_blank', 'noopener');
      status.textContent = '';
      status.append(document.createTextNode('Listo, abrimos WhatsApp con tu mensaje. Si no se abrió, '));
      const a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'toca aquí';
      status.append(a, document.createTextNode('.'));
      if (!win) window.location.href = url;
    });
  }

  /* ═════════════ 21 · FOOTER: texto gigante ajustado al ancho ═════════════ */
  function initFooterFit() {
    const el = $('.foot__giant');
    if (!el) return;
    const fit = () => {
      el.style.fontSize = '100px';
      el.style.display = 'inline-block';
      const w = el.scrollWidth;
      el.style.display = '';
      const target = el.parentElement.clientWidth;
      if (w) el.style.fontSize = `${(100 * target * 0.945) / w}px`;
    };
    fit();
    if (document.fonts) document.fonts.ready.then(fit);
    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 150); });
  }

  /* ═════════════ ARRANQUE ═════════════ */
  function boot() {
    safe(initWhatsAppLinks, 'links');
    safe(initButtons, 'buttons');
    safe(initMenu, 'menu');
    safe(initFaq, 'faq');
    safe(initConfigurator, 'configurator');
    safe(initContactForm, 'contact');
    safe(initFooterFit, 'footer');
    safe(initSmoothScroll, 'scroll');
    safe(prepHero, 'prepHero');
    heroGL = safe(initHeroGL, 'heroGL');

    // Los ScrollTrigger se crean en orden de documento (los "pin" primero que sus dependientes)
    if (HAS_GSAP) {
      safe(initManifesto, 'manifesto');
      safe(initServices, 'services');
      safe(initSheet, 'sheet');
      safe(initReveals, 'reveals');
      safe(initCounters, 'counters');
      safe(initProcess, 'process');
      safe(initPricing, 'pricing');
      safe(initPageMotion, 'pageMotion');
      safe(initNavActive, 'navActive');
      safe(initHeroTilt, 'heroTilt');
      safe(initMarquee, 'marquee');
    } else {
      safe(initSheet, 'sheet');
      safe(initManifesto, 'manifesto');
      safe(initCounters, 'counters');
      safe(initProcess, 'process');
      safe(initPricing, 'pricing');
    }
    safe(initRegistration, 'registration');

    runLoader(() => {
      playIntro();
      if (HAS_GSAP) {
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      }
      // URL con #sección: corregimos el salto nativo (las secciones fijadas ocupan más scroll)
      if (location.hash.length > 1) {
        const t = $(location.hash);
        if (t) setTimeout(() => scrollToTarget(t), 150);
      }
    });
    if (HAS_GSAP) {
      window.addEventListener('load', () => ScrollTrigger.refresh());
      if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

/* ORIONECT — interactions v2 */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ================================================================
     LENIS — smooth scroll
  ================================================================ */
  var lenis = new Lenis({ lerp: 0.10, smoothWheel: true });
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  } else {
    (function lenisRaf(t) { lenis.raf(t); requestAnimationFrame(lenisRaf); })(0);
  }

  /* ================================================================
     HEADER — scrolled state
  ================================================================ */
  var header = document.getElementById('header');
  function onScroll() {
    if (window.scrollY > 24) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ================================================================
     MOBILE MENU
  ================================================================ */
  var menu   = document.getElementById('mobileMenu');
  var toggle = document.getElementById('menuToggle');
  var mclose = document.getElementById('menuClose');
  function openMenu()  { menu.classList.add('open');    document.body.style.overflow = 'hidden'; }
  function closeMenu() { menu.classList.remove('open'); document.body.style.overflow = ''; }
  if (toggle) toggle.addEventListener('click', openMenu);
  if (mclose) mclose.addEventListener('click', closeMenu);
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });

  /* ================================================================
     THEME — system-aware with manual override
     Priority: localStorage override > prefers-color-scheme (live)
  ================================================================ */
  function applyTheme(theme, persist) {
    root.setAttribute('data-theme', theme);
    if (persist) {
      localStorage.setItem('orionect-theme', theme);
    }
    // dark: let the [data-theme="dark"] stylesheet own surfaces
    if (theme === 'dark') {
      root.style.removeProperty('--paper');
      root.style.removeProperty('--paper-2');
      root.style.removeProperty('--ink');
    }
    // ensure hero reveals are visible after theme swap
    document.querySelectorAll('.hero .reveal').forEach(function (el) {
      el.classList.add('in');
    });
    // broadcast so Tweaks panel toggle stays in sync
    window.dispatchEvent(new CustomEvent('orionect-theme', { detail: theme === 'dark' }));
  }

  var sysMq = window.matchMedia('(prefers-color-scheme: dark)');

  // initial — saved manual preference wins; otherwise follow system
  var saved = localStorage.getItem('orionect-theme');
  applyTheme(saved || (sysMq.matches ? 'dark' : 'light'), false);

  // live system changes — only respected while no manual override exists
  sysMq.addEventListener('change', function (e) {
    if (!localStorage.getItem('orionect-theme')) {
      applyTheme(e.matches ? 'dark' : 'light', false);
    }
  });

  // nav moon/sun toggle — sets a manual override
  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
    });
  }

  /* ================================================================
     SMOOTH ANCHOR SCROLL — eased, respects header height
  ================================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -76 });
    });
  });

  /* ================================================================
     SCROLL REVEAL
  ================================================================ */
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        revealIO.unobserve(en.target);
      }
    });
  }, { threshold: 0.10, rootMargin: '0px 0px -6% 0px' });

  document.querySelectorAll('.reveal, .reveal-line').forEach(function (el) {
    revealIO.observe(el);
  });

  // fire hero reveals immediately (above fold)
  requestAnimationFrame(function () {
    document.querySelectorAll('.hero .reveal, .hero .reveal-line').forEach(function (el) {
      el.classList.add('in');
    });
  });

  /* ================================================================
     PARALLAX — ScrollTrigger scrub, synced to Lenis
  ================================================================ */
  var motionOk = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

  if (motionOk && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    // scrub: higher = more lag/smoothness behind scroll
    var PX_CONFIG = [
      { sel: '.hero-bg-ring--1', y: 60,  scrub: 2.5 },
      { sel: '.hero-bg-ring--2', y: 120, scrub: 2.5 },
      { sel: '.hero-status',     y: 40,  scrub: 1.8 },
      { sel: '.hero h1',         y: 90,  scrub: 1.8 },
      { sel: '.hero-foot',       y: 60,  scrub: 1.8 },
      { sel: '.hero-badge',      y: 240, scrub: 1.0 },
      { sel: '.ph-glyph',        y: 130, scrub: 1.2 },
      { sel: '.ph-art',          y: 70,  scrub: 1.5 },
      { sel: '.section-head h2', y: 45,  scrub: 2.5 },
      { sel: '.approach-quote',  y: 90,  scrub: 1.8 },
      { sel: '.cta h2',          y: 50,  scrub: 2.5 },
      { sel: '.stat .num',       y: 40,  scrub: 1.8 },
      { sel: '.proc-step h4',    y: 35,  scrub: 2.5 },
    ];

    PX_CONFIG.forEach(function (cfg) {
      document.querySelectorAll(cfg.sel).forEach(function (el) {
        el.classList.add('px-target');
        gsap.fromTo(el,
          { y: cfg.y * 0.5 },
          {
            y: -cfg.y * 0.5,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: cfg.scrub,
            },
          }
        );
      });
    });

    // Hero badge: also rotates as you scroll past the hero
    gsap.to('.hero-badge', {
      rotation: 25,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
    });
  }

  /* ================================================================
     COUNTUP — animate stat numbers when scrolled into view
  ================================================================ */
  var CountUpClass = (typeof CountUp !== 'undefined') ? CountUp
    : (typeof countUp !== 'undefined' && countUp.CountUp) ? countUp.CountUp : null;

  if (CountUpClass) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        countIO.unobserve(en.target);
        var numEl = en.target.querySelector('.num');
        if (!numEl) return;
        var uSpan = numEl.querySelector('.u');
        var suffix = uSpan ? uSpan.textContent : '';
        var numText = numEl.childNodes[0].textContent.trim();
        var endVal = parseFloat(numText);
        var decimals = numText.indexOf('.') !== -1 ? numText.length - numText.indexOf('.') - 1 : 0;
        var target = document.createElement('span');
        numEl.textContent = '';
        numEl.appendChild(target);
        if (uSpan) { uSpan.textContent = suffix; numEl.appendChild(uSpan); }
        var cu = new CountUpClass(target, endVal, { decimalPlaces: decimals, duration: 2.5 });
        if (!cu.error) cu.start();
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.stat').forEach(function (el) { countIO.observe(el); });
  }

  /* ================================================================
     VANILLA TILT — 3D perspective tilt on work cards (pointer devices only)
  ================================================================ */
  if (typeof VanillaTilt !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
    VanillaTilt.init(document.querySelectorAll('.work-card'), {
      max: 8,
      speed: 400,
      glare: true,
      'max-glare': 0.12,
      scale: 1.02,
    });
  }

})();

/* ============================================================
   ONCO AI — App Scripts
   Particle network hero · Cell canvas · GSAP reveals ·
   Counter animations · Interactive demo · Nav · FAQ
   ============================================================ */

/* ── Helpers ─────────────────────────────────────────────── */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* ── Scroll progress bar ─────────────────────────────────── */
function initScrollProgress() {
  const bar = $('#scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    bar.style.transform = `scaleX(${pct})`;
  }, { passive: true });
}

/* ── Nav: scroll state + active section ─────────────────── */
function initNav() {
  const nav = $('#nav');
  const burger = $('#navBurger');
  const menu = $('#mobileMenu');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });

  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        menu.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // Active link highlight
  const sections = $$('section[id]');
  const links = $$('.nav__links a');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => io.observe(s));
}

/* ── Year footer ─────────────────────────────────────────── */
function initYear() {
  const el = $('#year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ── Reveal on scroll ────────────────────────────────────── */
function initReveal() {
  const els = $$('.reveal-up, .reveal-fade');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        const delay = Number(e.target.dataset.delay || 0);
        setTimeout(() => e.target.classList.add('visible'), delay);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  // Stagger siblings
  els.forEach(el => {
    const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal-up') || c.classList.contains('reveal-fade'));
    const idx = siblings.indexOf(el);
    el.dataset.delay = idx * 80;
    io.observe(el);
  });
}

/* ── Counter animation ───────────────────────────────────── */
function animateCount(el, target, duration = 1400) {
  let start = null;
  const step = (ts) => {
    if (!start) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(ease * target);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initCounters() {
  const els = $$('.stat-num[data-count]');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCount(e.target, Number(e.target.dataset.count));
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  els.forEach(el => io.observe(el));
}

/* ── Hero particle network canvas ────────────────────────── */
function initHeroCanvas() {
  const canvas = $('#hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [], mouse = { x: -999, y: -999 };
  const NODE_COUNT = 80;
  const MAX_DIST = 140;
  const COLORS = [
    [91, 159, 255],  // blue
    [168, 127, 255], // purple
    [120, 200, 255], // cyan
  ];

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function makeNode() {
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1.5 + Math.random() * 2.5,
      alpha: 0.3 + Math.random() * 0.5,
      color: c,
    };
  }

  function init() {
    resize();
    nodes = Array.from({ length: NODE_COUNT }, makeNode);
  }

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });
  window.addEventListener('resize', () => { resize(); });

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Update + draw nodes
    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;

      // Mouse repel
      const dx = n.x - mouse.x, dy = n.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        const force = (100 - dist) / 100 * 0.6;
        n.vx += (dx / dist) * force;
        n.vy += (dy / dist) * force;
        const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (spd > 2) { n.vx /= spd * 0.8; n.vy /= spd * 0.8; }
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${n.color},${n.alpha})`;
      ctx.fill();
    });

    // Draw edges
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.25;
          const ci = nodes[i].color, cj = nodes[j].color;
          const grad = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
          grad.addColorStop(0, `rgba(${ci},${alpha})`);
          grad.addColorStop(1, `rgba(${cj},${alpha})`);
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  init();
  draw();
}

/* ── Cell visualization canvas ───────────────────────────── */
function initCellCanvas() {
  const canvas = $('#cell-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, cells = [], t = 0;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function makeCell(benign = true) {
    return {
      x: 30 + Math.random() * (W - 60),
      y: 30 + Math.random() * (H - 60),
      r: benign ? 8 + Math.random() * 10 : 12 + Math.random() * 18,
      benign,
      phase: Math.random() * Math.PI * 2,
      speed: 0.003 + Math.random() * 0.005,
      wobble: 0.05 + Math.random() * 0.15,
      hue: benign ? 210 + Math.random() * 40 : 260 + Math.random() * 40,
    };
  }

  function init() {
    resize();
    cells = [];
    for (let i = 0; i < 9; i++) cells.push(makeCell(true));
    for (let i = 0; i < 4; i++) cells.push(makeCell(false));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.012;

    cells.forEach(c => {
      c.phase += c.speed;
      const rx = c.r * (1 + Math.sin(c.phase) * c.wobble);
      const ry = c.r * (1 + Math.cos(c.phase * 1.3) * c.wobble * 0.8);

      // Cell body
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, rx * 1.5);
      if (c.benign) {
        grad.addColorStop(0, `hsla(${c.hue}, 80%, 75%, 0.25)`);
        grad.addColorStop(0.7, `hsla(${c.hue}, 60%, 55%, 0.12)`);
        grad.addColorStop(1, `hsla(${c.hue}, 50%, 45%, 0.0)`);
      } else {
        grad.addColorStop(0, `hsla(${c.hue}, 70%, 65%, 0.3)`);
        grad.addColorStop(0.6, `hsla(${c.hue}, 55%, 45%, 0.15)`);
        grad.addColorStop(1, `hsla(${c.hue}, 45%, 35%, 0.0)`);
      }
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, rx * 1.5, ry * 1.5, c.phase * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Cell membrane
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, rx, ry, c.phase * 0.2, 0, Math.PI * 2);
      ctx.strokeStyle = c.benign
        ? `hsla(${c.hue}, 80%, 70%, 0.45)`
        : `hsla(${c.hue}, 70%, 65%, 0.55)`;
      ctx.lineWidth = c.benign ? 1 : 1.5;
      ctx.stroke();

      // Nucleus
      const nr = c.r * (c.benign ? 0.38 : 0.52);
      ctx.beginPath();
      ctx.ellipse(
        c.x + Math.sin(c.phase * 0.7) * c.r * 0.1,
        c.y + Math.cos(c.phase * 0.5) * c.r * 0.1,
        nr, nr * 0.85, 0, 0, Math.PI * 2
      );
      ctx.fillStyle = c.benign
        ? `hsla(${c.hue}, 70%, 60%, 0.6)`
        : `hsla(${c.hue - 10}, 65%, 55%, 0.7)`;
      ctx.fill();

      // Irregularity marker for malignant
      if (!c.benign) {
        ctx.beginPath();
        ctx.arc(c.x + rx * 0.5, c.y - ry * 0.4, c.r * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${c.hue}, 70%, 70%, 0.5)`;
        ctx.fill();
      }
    });

    // Legend
    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillStyle = 'rgba(150,160,200,0.55)';
    ctx.fillText('● Benigno', 16, H - 30);
    ctx.fillStyle = 'rgba(180,140,255,0.55)';
    ctx.fillText('● Maligno', 16, H - 14);

    requestAnimationFrame(draw);
  }

  init();
  draw();
  window.addEventListener('resize', () => { resize(); init(); });
}

/* ── Interactive prediction demo ─────────────────────────── */
function initDemo() {
  const form = $('#demo-form');
  if (!form) return;

  const features = {
    radius:      { el: null, min: 6, max: 28, val: 14.1 },
    texture:     { el: null, min: 9,  max: 39, val: 19.3 },
    perimeter:   { el: null, min: 43, max: 188, val: 91.9 },
    smoothness:  { el: null, min: 52, max: 189, val: 62.0 },
    compactness: { el: null, min: 19, max: 345, val: 65.0 },
  };

  Object.keys(features).forEach(k => {
    const f = features[k];
    f.el = form.querySelector(`input[name="${k}"]`);
    const valEl = form.querySelector(`[data-val="${k}"]`);
    if (!f.el) return;
    f.el.min = f.min; f.el.max = f.max; f.el.step = 0.1;
    f.el.value = f.val;
    if (valEl) valEl.textContent = f.val.toFixed(1);
    f.el.addEventListener('input', () => {
      if (valEl) valEl.textContent = (+f.el.value).toFixed(1);
      predict();
    });
  });

  const resultEl = $('#demo-result');
  const resultVal = $('#demo-result-val');
  const resultConf = $('#demo-result-conf');
  const resultIcon = $('#demo-result-icon');
  const confFill = $('#demo-conf-fill');

  function predict() {
    const r = +features.radius.el.value;
    const tx = +features.texture.el.value;
    const p = +features.perimeter.el.value;
    const sm = +features.smoothness.el.value;
    const co = +features.compactness.el.value;

    // Simple logistic-like scoring (heuristic that mimics Wisconsin dataset patterns)
    const rN  = (r - 6) / 22;
    const txN = (tx - 9) / 30;
    const pN  = (p - 43) / 145;
    const smN = (sm - 52) / 137;
    const coN = (co - 19) / 326;

    const score = rN * 0.35 + txN * 0.2 + pN * 0.25 + smN * 0.1 + coN * 0.1;
    const confidence = Math.round(clamp(score * 100, 5, 95));
    const malignant = score > 0.48;

    resultEl.className = 'demo__result ' + (malignant ? 'malignant' : 'benign');
    resultVal.textContent = malignant ? 'Maligno' : 'Benigno';
    resultConf.textContent = `Confianza: ${malignant ? confidence : 100 - confidence}%`;
    resultIcon.textContent = malignant ? '⚠' : '✓';
    confFill.style.width = (malignant ? confidence : 100 - confidence) + '%';
  }

  predict();
}

/* ── Roadmap timeline progress line ──────────────────────── */
function initRoadmap() {
  const prog = $('#timeline-progress');
  if (!prog) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        prog.style.height = '100%';
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  io.observe(prog.parentElement);
}

/* ── Smooth anchor scrolling ─────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

/* ── Boot ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initScrollProgress();
  initNav();
  initYear();
  initReveal();
  initCounters();
  initHeroCanvas();
  initCellCanvas();
  initDemo();
  initRoadmap();
  initSmoothScroll();
});

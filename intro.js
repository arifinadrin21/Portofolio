/* Intro: Kartu nama gantung dengan fisika Verlet.
   Koordinat dihitung relatif terhadap .intro-stage supaya
   posisi kartu tidak meleset saat layout berubah. */
(function () {
  const root  = document.documentElement;
  const intro = document.getElementById('intro');
  if (!intro) { root.classList.remove('intro-lock'); return; }

  const card  = intro.querySelector('.id-card');
  const stage = intro.querySelector('.intro-stage');
  const btn   = intro.querySelector('.intro-btn');
  const strap = intro.querySelector('#strap');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const GRAVITY = 0.65;
  const DAMP = 0.992;
  const STEP = 1000 / 60;

  let A = { x: 0, y: -10 };
  let L = 150;
  let H = 340;
  let W = 280;

  let P, Q, Pp, Qp;
  let dragging = false;
  let f = 0.5;
  let ptr = { x: 0, y: 0 };

  let raf = null;
  let last = 0;
  let acc = 0;
  let closed = false;
  let started = false;

  const clamp = (min, max, v) => Math.max(min, Math.min(max, v));

  function measure() {
    W = card.offsetWidth || 280;
    H = card.offsetHeight || 340;
    A = { x: stage.clientWidth / 2, y: -10 };
    L = Math.max(70, Math.min(260, stage.clientHeight - H - 20));
  }

  function init() {
    measure();
    const sx = reduce ? 0 : L * 0.55;
    P = { x: A.x + sx, y: A.y + (reduce ? L : L * 0.4) };
    Q = { x: P.x, y: P.y + H };
    Pp = { ...P };
    Qp = { ...Q };
  }

  function dist(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y) || 0.0001;
  }

  function verlet(p, pp) {
    let vx = (p.x - pp.x) * DAMP;
    let vy = (p.y - pp.y) * DAMP;
    const v = Math.hypot(vx, vy);
    if (v > 45) { vx *= 45 / v; vy *= 45 / v; }
    pp.x = p.x;
    pp.y = p.y;
    p.x += vx;
    p.y += vy + GRAVITY;
  }

  function step() {
    verlet(P, Pp);
    verlet(Q, Qp);

    if (dragging) {
      const gx = P.x + (Q.x - P.x) * f;
      const gy = P.y + (Q.y - P.y) * f;
      const dx = ptr.x - gx;
      const dy = ptr.y - gy;
      P.x += dx * (1 - f); P.y += dy * (1 - f);
      Q.x += dx * f;       Q.y += dy * f;
    }

    const half = W / 2;
    const minX = Math.min(half + 8, stage.clientWidth / 2);
    const maxX = Math.max(stage.clientWidth - half - 8, stage.clientWidth / 2);

    for (let i = 0; i < 8; i++) {
      // Tali: maksimal sepanjang L
      let d = dist(A, P);
      if (d > L) {
        P.x = A.x + (P.x - A.x) * L / d;
        P.y = A.y + (P.y - A.y) * L / d;
      }

      // Kartu kaku sepanjang H
      d = dist(P, Q);
      const k = (d - H) / d / 2;
      const ox = (Q.x - P.x) * k;
      const oy = (Q.y - P.y) * k;
      P.x += ox; P.y += oy;
      Q.x -= ox; Q.y -= oy;

      for (const p of [P, Q]) {
        p.x = clamp(minX, maxX, p.x);
        p.y = Math.max(-20, p.y);
      }
    }
  }

  function render() {
    const ang = -Math.atan2(Q.x - P.x, Q.y - P.y) * 180 / Math.PI;

    card.style.transform =
      `translate3d(${P.x - W / 2}px, ${P.y}px, 0) rotate(${ang}deg)`;

    // Tali menempel ke crimp di atas kartu
    const rad = ang * Math.PI / 180;
    const hx = P.x + Math.sin(rad) * 44;
    const hy = P.y - Math.cos(rad) * 44;
    strap.setAttribute('d', `M${A.x},${A.y} L${hx},${hy}`);
  }

  function loop(t) {
    if (closed) return;
    acc += Math.min(100, t - (last || t));
    last = t;
    while (acc >= STEP) {
      step();
      acc -= STEP;
    }
    render();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (started) return;
    started = true;
    init();
    card.style.opacity = '1';
    render();
    if (!reduce) raf = requestAnimationFrame(loop);
  }

  function toLocal(e) {
    const r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  card.addEventListener('pointerdown', e => {
    if (!started) return;
    card.setPointerCapture(e.pointerId);
    dragging = true;
    card.classList.add('grab');
    ptr = toLocal(e);

    const vx = Q.x - P.x;
    const vy = Q.y - P.y;
    const denom = H * H || 1;
    f = clamp(0, 1, ((ptr.x - P.x) * vx + (ptr.y - P.y) * vy) / denom);
  });

  card.addEventListener('pointermove', e => {
    if (dragging) ptr = toLocal(e);
  });

  const release = () => {
    dragging = false;
    card.classList.remove('grab');
  };
  card.addEventListener('pointerup', release);
  card.addEventListener('pointercancel', release);

  function leave() {
    if (closed) return;
    closed = true;
    root.classList.remove('intro-lock');
    window.scrollTo(0, 0);
    intro.classList.add('leave');

    const done = () => {
      if (raf) cancelAnimationFrame(raf);
      intro.remove();
    };
    intro.addEventListener('transitionend', e => {
      if (e.target === intro) done();
    }, { once: true });
    setTimeout(done, 1300);
  }

  btn.addEventListener('click', leave);
  addEventListener('keydown', e => {
    if (e.key === 'Escape') leave();
  });

  addEventListener('resize', () => {
    if (!started) return;
    measure();
    const half = W / 2;
    const minX = Math.min(half + 8, stage.clientWidth / 2);
    const maxX = Math.max(stage.clientWidth - half - 8, stage.clientWidth / 2);
    P.x = clamp(minX, maxX, P.x);
    Q.x = clamp(minX, maxX, Q.x);
  });

  const img = card.querySelector('.id-photo');
  if (img && !img.complete) {
    img.addEventListener('load', start, { once: true });
    img.addEventListener('error', start, { once: true });
    setTimeout(start, 900);
  } else {
    start();
  }
})();
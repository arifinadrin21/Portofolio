/* ============================================================
   Portfolio behaviour:
   tema hitam/putih, navbar, filter, reveal, progress bar,
   cursor glow, dan efek magnetic.
   ============================================================ */
(function () {
  const root = document.documentElement;

  /* ---------- TEMA HITAM / PUTIH ---------- */
  const toggle = document.getElementById('themeToggle');

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
  }

  // Pastikan tema awal konsisten dengan head script
  try {
    const saved = localStorage.getItem('theme');
    if (!saved) setTheme('light');
  } catch (e) {
    setTheme('light');
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(current);
    });
  }

  /* ---------- NAVBAR SCROLL + ACTIVE LINK ---------- */
  const navbar = document.querySelector('.navbar');
  const navLinks = [...document.querySelectorAll('.navlinks a')];

  function onScroll() {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 8);

    let activeIndex = 0;
    navLinks.forEach((a, i) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target && target.getBoundingClientRect().top <= 140) activeIndex = i;
    });
    navLinks.forEach((a, i) => a.classList.toggle('active', i === activeIndex));
  }

  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- REVEAL ON SCROLL ---------- */
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('[data-animate]').forEach((el) => {
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll('[data-animate]').forEach((el) => el.classList.add('in'));
  }

  /* ---------- PROGRESS BAR ANIMATION ---------- */
  if ('IntersectionObserver' in window) {
    const progressObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.querySelectorAll('.progress-fill').forEach((fill) => {
          const target = fill.style.width || '0%';
          fill.style.width = '0%';
          requestAnimationFrame(() => {
            fill.style.width = target;
          });
        });

        progressObserver.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('.info-card, .proj-card, .proj-progress').forEach((el) => {
      progressObserver.observe(el);
    });
  }

  /* ---------- FILTER PROYEK ---------- */
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.proj-card');

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      projectCards.forEach((card) => {
        const tags = (card.dataset.tags || '').split(/\s+/);
        const show = filter === 'all' || tags.includes(filter);
        card.classList.toggle('filter-hide', !show);
      });
    });
  });

  /* ---------- CURSOR GLOW ---------- */
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  const finePointer = matchMedia('(pointer:fine)').matches;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (finePointer && !reducedMotion) {
    let targetX = innerWidth / 2;
    let targetY = innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    addEventListener('pointermove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      glow.classList.add('active');
    });

    addEventListener('pointerleave', () => {
      glow.classList.remove('active');
    });

    (function animateGlow() {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      glow.style.transform =
        `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateGlow);
    })();
  }

  /* ---------- MAGNETIC BUTTONS ---------- */
  if (!reducedMotion) {
    document.querySelectorAll('.btn, .proj-link').forEach((el) => {
      el.classList.add('magnetic');

      el.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.15}px, ${y * 0.2}px)`;
      });

      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
      });
    });
  }
})();
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('cvModal');
  const btn = document.getElementById('openCvBtn');
  const closeBtn = document.getElementById('closeCvBtn');

  // Buka popup saat tombol diklik
  if (btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      modal.classList.add('show');
      document.body.style.overflow = 'hidden'; // Kunci scroll layar belakang
    });
  }

  // Tutup popup saat tombol X diklik
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      modal.classList.remove('show');
      document.body.style.overflow = ''; // Kembalikan scroll
    });
  }

  // Tutup popup jika area luar (backdrop gelap) diklik
  window.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  });
  
  // Tutup popup jika tombol Escape (Esc) ditekan
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  });
});
/* =========================================================
   MUSIC PLAYER — Cover album + play/pause overlay
   ========================================================= */
(function initMusicPlayer(){
  const player = document.querySelector('.music-player');
  const audio  = document.getElementById('favAudio');
  const btn    = document.getElementById('coverPlay');
  const label  = document.getElementById('nowLabel');
  if (!player || !audio) return;

  const setState = (playing) => {
    player.classList.toggle('is-playing', playing);
    if (label) label.textContent = playing ? 'Now Playing' : 'Siap diputar';
  };

  audio.addEventListener('play',  () => setState(true));
  audio.addEventListener('pause', () => setState(false));
  audio.addEventListener('ended', () => {
    setState(false);
    audio.currentTime = 0;
  });

  // Klik overlay di cover → toggle play/pause
  if (btn){
    btn.addEventListener('click', () => {
      if (audio.paused) audio.play().catch(() => {});
      else              audio.pause();
    });
  }
})();
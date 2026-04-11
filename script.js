'use strict';

/* ═══════════════════════════════════════════════════════════════
   DEVILS DECTET — script.js
   Modular JS · GSAP + ScrollTrigger · Canvas Waves · VanillaTilt
═══════════════════════════════════════════════════════════════ */

/* ── Data ────────────────────────────────────────────────────── */
const musiciansData = [
  {
    name: 'Isaiah Shin',
    instrument: 'Viola',
    imageLink: 'images/IMG_5968.jpg',
    role: 'Founder',
    bio: 'Hi there! My name is Isaiah Shin. Outside of orchestra, I play football and compete in triathlons. I am also the head play-by-play announcer for the Hinsdale Central Basketball Team. Additionally, I go on yearly mission trips to El Salvador and play on the school\'s varsity 7v7 football program in the spring.'
  },
  {
    name: 'Jason Liu',
    instrument: 'Cello',
    imageLink: 'images/IMG_5587.PNG',
    role: 'Founder',
    bio: "Hey, I'm Jason! When I'm not playing music with my friends, you'll find me in a studio singing or at my desk building my next website. To me, music is sound, code is logic, and somewhere in between feels like home."
  },
  {
    name: 'Anthony Barakat',
    instrument: 'Cello',
    imageLink: 'images/IMG_5582.JPG',
    bio: "Hello, my name is Anthony! Outside of orchestra I play tennis and love doing things outdoors like camping. I also enjoy public speaking through clubs like Debate and Model UN."
  },
  {
    name: 'Lorenzo Dasilva',
    instrument: 'Cello',
    imageLink: 'images/IMG1.jpg',
    bio: "I'm part of the Hinsdale Community rowing team and enjoy playing soccer."
  },
  {
    name: 'Advaith Balakrishnan',
    instrument: 'Cello',
    imageLink: 'images/IMG_5580.JPG',
    bio: "I'm Advaith Balakrishnan, a current junior at Hinsdale Central High School. I have played cello since 5th grade. Outside of orchestra, I enjoy playing piano and singing Indian classical music. Additionally I am a part of my school's track and field team and I am a starter on the Hinsdale Central Boys Varsity Soccer team."
  },
  {
    name: 'Vincent Lan',
    instrument: 'Violin',
    imageLink: 'images/IMG_5578.JPG',
    bio: 'I am a young violinist, violist, and composer. I have received numerous accolades since I began learning to play at the age of 4. These include placing first in the Granquist Music Competition and IMA State Contest multiple times. I have also been a member of the Chicago Youth Symphony Orchestras, and am the concertmaster of Hinsdale Central High School\'s Philharmonic Orchestra.'
  },
  {
    name: 'Steven Zhao',
    instrument: 'Violin',
    imageLink: 'images/IMG_5579.JPG',
    bio: 'Hello, my name is Steven Zhao and I play the violin. Outside of orchestra, I participate in Robotics, Scholastic Bowl, Model UN, and Math Team. I also enjoy playing video games and hanging out with friends.'
  },
  {
    name: 'Max Zheng',
    instrument: 'Violin',
    imageLink: 'images/IMG_5584.PNG',
    bio: "Hello, I'm Max, a junior at Hinsdale Central. I have been playing violin for almost 3 years, and piano for 11. I am super passionate about music. I love listening to and playing classical music, and I love playing music with friends. My favorite composers are Rachmaninoff, Stravinsky, and Shostakovich. Along with music, I am also passionate about mathematics."
  },
  {
    name: 'Brandon Kim',
    instrument: 'Violin',
    imageLink: 'images/IMG_5604.JPG',
    bio: "I'm Brandon Kim, a junior at Hinsdale Central High School. I started playing the violin when I was eleven years old, and have fallen in love ever since, and have represented the school in ILMEA District and All-State Orchestras. When I am not playing the violin, I enjoy running on our school's varsity track team, and cooking different types of foods with my mother."
  },
  {
    name: 'Oliver Clary',
    instrument: 'Bass',
    imageLink: 'images/IMG_5576.JPG',
    bio: 'As a student at Hinsdale Central, I participate in Football in the fall and Shotput in the spring. Outside of sports I like playing cards and fishing.'
  }
];

/* ═══════════════════════════════════════════════════════════════
   MODULE: Hero Canvas (Animated Sound Waves)
═══════════════════════════════════════════════════════════════ */
const HeroCanvas = {
  canvas: null,
  ctx: null,
  raf: null,
  W: 0,
  H: 0,
  mouse: { x: 0.5, y: 0.5 }, // normalised 0–1

  // Wave definitions: amp, freq, phase, speed, color, yBias
  waves: [
    { amp: 38,  freq: 0.0070, phase: 0,   speed: 0.013, alpha: 0.16, hue: 'crimson', yBias: 0   },
    { amp: 22,  freq: 0.0110, phase: 1.5, speed: 0.020, alpha: 0.10, hue: 'gold',    yBias: 38  },
    { amp: 52,  freq: 0.0042, phase: 3.1, speed: 0.007, alpha: 0.08, hue: 'crimson', yBias: -22 },
    { amp: 14,  freq: 0.0170, phase: 5.0, speed: 0.028, alpha: 0.05, hue: 'cream',   yBias: 16  },
  ],

  _color(hue, alpha) {
    const map = {
      crimson: `rgba(185, 28, 60, ${alpha})`,
      gold:    `rgba(201, 150, 63, ${alpha})`,
      cream:   `rgba(242, 237, 228, ${alpha})`,
    };
    return map[hue] || `rgba(255,255,255,${alpha})`;
  },

  resize() {
    this.W = this.canvas.width  = window.innerWidth;
    this.H = this.canvas.height = window.innerHeight;
  },

  draw() {
    const { ctx, W, H, waves, mouse } = this;
    ctx.clearRect(0, 0, W, H);

    // Centre Y sits in the lower-middle of the hero for elegance
    const cy = H * 0.64;
    const mx = mouse.x - 0.5; // -0.5 → +0.5 normalised mouse offset

    waves.forEach(w => {
      w.phase += w.speed;

      // Gradient fade at edges for seamless blending
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      const col  = this._color(w.hue, w.alpha);
      grad.addColorStop(0,    'transparent');
      grad.addColorStop(0.12, col);
      grad.addColorStop(0.88, col);
      grad.addColorStop(1,    'transparent');

      ctx.beginPath();
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 1.4;

      for (let x = 0; x <= W; x += 2) {
        // Subtle mouse influence: wave shifts slightly with horizontal mouse
        const mouseNudge = Math.sin(x / W * Math.PI) * mx * 18;
        const y = cy + w.yBias + Math.sin(x * w.freq + w.phase) * w.amp + mouseNudge;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  },

  animate() {
    this.draw();
    this.raf = requestAnimationFrame(() => this.animate());
  },

  init() {
    this.canvas = document.getElementById('heroCanvas');
    if (!this.canvas) return;

    // Skip heavy canvas if reduced motion preferred
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.canvas.style.display = 'none';
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.resize();

    window.addEventListener('resize', () => this.resize(), { passive: true });
    window.addEventListener('mousemove', e => {
      this.mouse.x = e.clientX / window.innerWidth;
      this.mouse.y = e.clientY / window.innerHeight;
    }, { passive: true });

    this.animate();
  },

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
  }
};

/* ═══════════════════════════════════════════════════════════════
   MODULE: Members — render + bio modal
═══════════════════════════════════════════════════════════════ */
const Members = {
  render() {
    const grid = document.getElementById('membersGrid');
    if (!grid) return;

    grid.innerHTML = musiciansData.map((m, i) => {
      const isFounder = m.role === 'Founder';
      const imgMarkup = m.imageLink
        ? `<img src="${m.imageLink}" alt="Photo of ${m.name}" loading="lazy">`
        : '';
      const badgeHTML = isFounder ? `<span class="role-badge">Founder</span>` : '';

      return `
        <div class="member-card" role="listitem" tabindex="0"
             data-member-index="${i}"
             aria-label="View bio for ${m.name}, ${m.instrument}">
          <div class="member-photo">
            ${imgMarkup}
            ${badgeHTML}
            <div class="member-hover-hint" aria-hidden="true">
              <span class="member-hint-text">View Bio</span>
            </div>
          </div>
          <div class="member-info">
            <h3>${m.name}</h3>
            <p>${m.instrument}</p>
          </div>
        </div>
      `.trim();
    }).join('');
  },

  setupModal() {
    // Inject modal HTML once
    document.body.insertAdjacentHTML('beforeend', `
      <div class="bio-modal" role="dialog" aria-modal="true" aria-labelledby="bioModalName" id="bioModal">
        <div class="bio-modal-overlay"></div>
        <div class="bio-modal-content">
          <button class="bio-modal-close" aria-label="Close biography">&times;</button>
          <div class="bio-img-side" id="bioImgSide">
            <img id="bioModalImage" src="" alt="">
          </div>
          <div class="bio-text-side">
            <h2 class="bio-name" id="bioModalName"></h2>
            <p class="bio-instrument" id="bioModalInstrument"></p>
            <p class="bio-role-tag" id="bioModalRole" hidden></p>
            <div class="bio-rule"></div>
            <p class="bio-text" id="bioModalBio"></p>
          </div>
        </div>
      </div>
    `);

    const modal       = document.getElementById('bioModal');
    const imgEl       = document.getElementById('bioModalImage');
    const imgSide     = document.getElementById('bioImgSide');
    const nameEl      = document.getElementById('bioModalName');
    const instrEl     = document.getElementById('bioModalInstrument');
    const roleEl      = document.getElementById('bioModalRole');
    const bioEl       = document.getElementById('bioModalBio');
    const closeBtn    = modal.querySelector('.bio-modal-close');
    const overlay     = modal.querySelector('.bio-modal-overlay');
    let prevFocus     = null;

    const open = (member) => {
      prevFocus = document.activeElement;
      nameEl.textContent  = member.name;
      instrEl.textContent = member.instrument;
      bioEl.textContent   = member.bio || 'Biography coming soon…';

      if (member.role) {
        roleEl.textContent = member.role;
        roleEl.hidden = false;
      } else {
        roleEl.hidden = true;
      }

      // Load image with probe
      if (member.imageLink) {
        const probe = new Image();
        probe.onload  = () => { imgEl.src = member.imageLink; imgEl.alt = `Photo of ${member.name}`; imgSide.style.display = ''; };
        probe.onerror = () => { imgSide.style.display = 'none'; };
        probe.src = member.imageLink;
      } else {
        imgSide.style.display = 'none';
      }

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    };

    const close = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => {
        imgEl.src = '';
        imgEl.alt = '';
        imgSide.style.display = '';
      }, 380);
      if (prevFocus) prevFocus.focus();
    };

    // Delegated click on member cards
    document.addEventListener('click', e => {
      const card = e.target.closest('.member-card');
      if (!card) return;
      const idx = parseInt(card.dataset.memberIndex, 10);
      if (!isNaN(idx) && musiciansData[idx]) open(musiciansData[idx]);
    });

    // Keyboard: Enter / Space
    document.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('member-card')) {
        e.preventDefault();
        const idx = parseInt(e.target.dataset.memberIndex, 10);
        if (!isNaN(idx) && musiciansData[idx]) open(musiciansData[idx]);
      }
      if (e.key === 'Escape' && modal.classList.contains('active')) close();
    });

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
  },

  initTilt() {
    // VanillaTilt 3D tilt on member cards — graceful degradation if lib absent
    if (typeof VanillaTilt === 'undefined') return;
    VanillaTilt.init(document.querySelectorAll('.member-card'), {
      max: 7,
      speed: 500,
      glare: true,
      'max-glare': 0.06,
      scale: 1.02,
      perspective: 800,
    });
  }
};

/* ═══════════════════════════════════════════════════════════════
   MODULE: Navigation
═══════════════════════════════════════════════════════════════ */
const Navigation = {
  header: null,
  lastY: 0,
  ticking: false,

  init() {
    this.header = document.getElementById('site-header');
    if (!this.header) return;

    this._setupScroll();
    this._setupMobileNav();
    this._setupActiveHighlight();
    this._setupSmoothScroll();
  },

  _setupScroll() {
    window.addEventListener('scroll', () => {
      if (!this.ticking) {
        requestAnimationFrame(() => this._onScroll());
        this.ticking = true;
      }
    }, { passive: true });
  },

  _onScroll() {
    const y = window.scrollY;
    if (y > 60) {
      this.header.classList.add('scrolled');
      if (y > this.lastY + 3 && !this.header.classList.contains('nav-open')) {
        this.header.classList.add('hidden');
      } else if (y < this.lastY - 3) {
        this.header.classList.remove('hidden');
      }
    } else {
      this.header.classList.remove('scrolled', 'hidden');
    }
    this.lastY = y;
    this.ticking = false;
  },

  _setupMobileNav() {
    const toggle   = this.header.querySelector('.menu-toggle');
    const navLinks = this.header.querySelectorAll('nav ul li a');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const open = this.header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open);
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.header.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  },

  _setupActiveHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const links    = document.querySelectorAll('nav ul li a');

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          links.forEach(l => {
            l.classList.toggle('active', l.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { threshold: 0.3 });

    sections.forEach(s => obs.observe(s));
  },

  _setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const offset = this.header ? this.header.offsetHeight : 72;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }
};

/* ═══════════════════════════════════════════════════════════════
   MODULE: GSAP Animations
═══════════════════════════════════════════════════════════════ */
const Animations = {
  init() {
    gsap.registerPlugin(ScrollTrigger);

    this._heroTimeline();
    this._sectionHeaders();
    this._memberCards();
    this._videoCards();
    this._galleryItems();
    this._contactCards();
    this._featuredSection();
    this._heroParallax();
    this._scrollHint();
  },

  /* ── Hero entrance (runs after preloader) ─────────────────── */
  _heroTimeline() {
    const tl = gsap.timeline({ delay: 0.2 });

    tl.fromTo('.hero-eyebrow',
      { y: 22, opacity: 0 },
      { y: 0,  opacity: 1, duration: 0.85, ease: 'power3.out' }
    )
    .fromTo('.word',
      { y: '110%', opacity: 0 },
      { y: '0%',   opacity: 1, stagger: 0.14, duration: 1.1, ease: 'power4.out' },
      '-=0.45'
    )
    .fromTo('.hero-ornament',
      { opacity: 0, scaleX: 0.6 },
      { opacity: 1, scaleX: 1,   duration: 0.7, ease: 'power2.out' },
      '-=0.3'
    )
    .fromTo('.hero-sub',
      { y: 24, opacity: 0 },
      { y: 0,  opacity: 1, duration: 0.9, ease: 'power3.out' },
      '-=0.4'
    )
    .fromTo('.hero-cta',
      { y: 20, opacity: 0 },
      { y: 0,  opacity: 1, duration: 0.7, ease: 'power3.out' },
      '-=0.5'
    );

    return tl;
  },

  /* ── Scroll hint pulse ────────────────────────────────────── */
  _scrollHint() {
    gsap.fromTo('.scroll-hint',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.8, delay: 2.2, ease: 'power2.out' }
    );

    // Fade out as user scrolls
    ScrollTrigger.create({
      trigger: '.hero-section',
      start: 'top top',
      end: '30% top',
      onUpdate: self => {
        gsap.set('.scroll-hint', { opacity: 1 - self.progress * 2 });
      }
    });
  },

  /* ── Section headers stagger in ──────────────────────────── */
  _sectionHeaders() {
    document.querySelectorAll('.section-header').forEach(header => {
      const children = header.querySelectorAll('.section-eyebrow, .section-title, .section-subtitle');
      gsap.fromTo(children,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1,
          stagger: 0.14,
          duration: 1.0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: header,
            start: 'top 82%',
          }
        }
      );
    });
  },

  /* ── Member cards staggered reveal ───────────────────────── */
  _memberCards() {
    gsap.fromTo('.member-card',
      { y: 60, opacity: 0, scale: 0.96 },
      {
        y: 0, opacity: 1, scale: 1,
        stagger: { each: 0.07, from: 'start' },
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '#membersGrid',
          start: 'top 85%',
        }
      }
    );
  },

  /* ── Video cards ─────────────────────────────────────────── */
  _videoCards() {
    gsap.fromTo('.video-card',
      { y: 50, opacity: 0 },
      {
        y: 0, opacity: 1,
        stagger: 0.12,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.videos-grid',
          start: 'top 82%',
        }
      }
    );

    gsap.fromTo('.yt-cta-wrap',
      { y: 24, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.yt-cta-wrap',
          start: 'top 90%',
        }
      }
    );
  },

  /* ── Gallery items ───────────────────────────────────────── */
  _galleryItems() {
    gsap.fromTo('.gallery-item',
      { y: 40, opacity: 0, scale: 0.97 },
      {
        y: 0, opacity: 1, scale: 1,
        stagger: { each: 0.06, from: 'random' },
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.gallery-grid',
          start: 'top 82%',
        }
      }
    );
  },

  /* ── Contact cards ───────────────────────────────────────── */
  _contactCards() {
    gsap.fromTo('.contact-intro',
      { y: 30, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.contact-intro', start: 'top 85%' }
      }
    );

    gsap.fromTo('.contact-card',
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1,
        stagger: 0.14,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.contact-cards', start: 'top 85%' }
      }
    );
  },

  /* ── Featured section ─────────────────────────────────────── */
  _featuredSection() {
    gsap.fromTo('.featured-wrap',
      { y: 50, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.featured-wrap', start: 'top 82%' }
      }
    );
  },

  /* ── Hero background parallax ─────────────────────────────── */
  _heroParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.to('.hero-bg', {
      yPercent: 28,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      }
    });
  }
};

/* ═══════════════════════════════════════════════════════════════
   MODULE: Magnetic Buttons
═══════════════════════════════════════════════════════════════ */
const MagneticButtons = {
  init() {
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect   = btn.getBoundingClientRect();
        const cx     = rect.left + rect.width  / 2;
        const cy     = rect.top  + rect.height / 2;
        const dx     = e.clientX - cx;
        const dy     = e.clientY - cy;
        gsap.to(btn, {
          x: dx * 0.28,
          y: dy * 0.28,
          duration: 0.4,
          ease: 'power3.out'
        });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }
};

/* ═══════════════════════════════════════════════════════════════
   MODULE: YouTube Thumbnails
═══════════════════════════════════════════════════════════════ */
const YouTubeThumbs = {
  init() {
    document.querySelectorAll('.video-thumb[data-youtube-id]').forEach(el => {
      const id = el.getAttribute('data-youtube-id').split('&')[0].trim();
      if (!id) return;
      el.style.backgroundImage    = `url('https://img.youtube.com/vi/${id}/hqdefault.jpg')`;
      el.style.backgroundSize     = 'cover';
      el.style.backgroundPosition = 'center';
    });
  }
};

/* ═══════════════════════════════════════════════════════════════
   MODULE: Gallery Lightbox
═══════════════════════════════════════════════════════════════ */
const Gallery = {
  init() {
    document.addEventListener('click', e => {
      const item = e.target.closest('.gallery-item');
      if (!item || item.classList.contains('gallery-item--soon')) return;

      const photo = item.querySelector('.gallery-photo');
      const bgImg = window.getComputedStyle(photo).backgroundImage;
      const match = bgImg.match(/url\(["']?([^"')]+)["']?\)/);
      if (!match) return;

      const box = document.createElement('div');
      box.className = 'lightbox';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', 'Gallery image');
      box.innerHTML = `
        <div class="lightbox-content">
          <img src="${match[1]}" alt="Gallery photo enlarged">
        </div>
      `;
      document.body.appendChild(box);
      document.body.style.overflow = 'hidden';
      // box.querySelector('.lightbox-close').focus();

      const close = () => {
        gsap.to(box, {
          opacity: 0, duration: 0.22,
          onComplete: () => {
            document.body.removeChild(box);
            document.body.style.overflow = '';
          }
        });
      };

      // box.querySelector('.lightbox-close').addEventListener('click', close);
      box.addEventListener('click', e => { if (e.target === box) close(); });

      const keyHandler = e => {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', keyHandler); }
      };
      document.addEventListener('keydown', keyHandler);
    });
  }
};

/* ═══════════════════════════════════════════════════════════════
   INIT — orchestrate all modules
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // 2. Start canvas — independent of page load
  HeroCanvas.init();

  // 3. Render members, set up modal + 3D tilt
  Members.render();
  Members.setupModal();

  // 4. YouTube thumbnails (no network wait needed for bg-image)
  YouTubeThumbs.init();

  // 5. Gallery lightbox
  Gallery.init();

  // 7. Navigation
  Navigation.init();

  // When everything is loaded, complete preloader then kick off GSAP
    window.addEventListener('load', () => {
    Animations.init();
    Members.initTilt();
    MagneticButtons.init();
  });

  // Fallback: if 'load' already fired
  if (document.readyState === 'complete') {
    Animations.init();
    Members.initTilt();
    MagneticButtons.init();
  }

  console.log('%cDevils Dectet ♪', 'color:#B91C3C;font-size:16px;font-weight:bold;font-family:Georgia,serif;');
});
'use strict';

/* ═══════════════════════════════════════════════════════════════
   DEVILS DECTET — script.js
   Members + bio modal · Gallery lightbox · Navigation · GSAP reveals
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
   Scroll lock. Hiding overflow removes the scrollbar, which pulls the
   whole page sideways; reserving its width keeps everything still.
═══════════════════════════════════════════════════════════════ */
const ScrollLock = {
  depth: 0,
  on() {
    if (this.depth++ > 0) return;
    const bar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (bar > 0) {
      document.body.style.paddingRight = bar + 'px';
      document.documentElement.style.setProperty('--sbw', bar + 'px');
    }
  },
  off() {
    this.depth = Math.max(0, this.depth - 1);
    if (this.depth > 0) return;
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    document.documentElement.style.removeProperty('--sbw');
  }
};

/* ═══════════════════════════════════════════════════════════════
   MODULE: Members — render + bio modal
═══════════════════════════════════════════════════════════════ */
const Members = {
  render() {
    const grid = document.getElementById('membersGrid');
    if (!grid) return;

    // Rendered in the order musiciansData lists them — the ensemble's own
    // order. The index is the modal's key, so it must stay 1:1 with the data.
    const cards = musiciansData.map((m, i) => {
      const isFounder = m.role === 'Founder';
      const imgMarkup = m.imageLink
        ? `<img src="${m.imageLink}" alt="Photo of ${m.name}" loading="lazy">`
        : '';
      const label = `View bio for ${m.name}, ${m.instrument}${isFounder ? ', founder' : ''}`;
      const detail = isFounder
        ? `${m.instrument}<span class="sep">&middot;</span><span class="member-role">Founder</span>`
        : m.instrument;

      return `
        <div class="member-card" role="listitem" tabindex="0"
             data-member-index="${i}"
             aria-label="${label}">
          <div class="member-photo">${imgMarkup}</div>
          <div class="member-info">
            <h3>${m.name}</h3>
            <p>${detail}</p>
          </div>
        </div>
      `.trim();
    }).join('');

    grid.innerHTML = `<div class="roster-grid" role="list">${cards}</div>`;
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
      ScrollLock.on();
      closeBtn.focus();
    };

    const close = () => {
      modal.classList.remove('active');
      ScrollLock.off();
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

    // Focus stays in the dialog until it closes
    document.addEventListener('keydown', e => {
      if (e.key !== 'Tab' || !modal.classList.contains('active')) return;
      const f = modal.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
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

    // Everything below fades content in from opacity 0. If the reader has
    // asked for reduced motion, put it on the page instead of animating it.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this._settle();
      return;
    }

    this._heroTimeline();
    this._statement();
    this._sectionHeaders();
    this._memberCards();
    this._videoCards();
    this._galleryItems();
    this._contactCards();
    this._featuredSection();
    this._heroParallax();
  },

  /* ── Reduced motion: final state, no tweens, no triggers ──── */
  _settle() {
    gsap.set('.hero-cta, .hero-place', { opacity: 1, y: 0 });
    gsap.set('.word', { opacity: 1, yPercent: 0 });
    gsap.set('.hero-bg', { scale: 1 });
  },

  /* ── Hero entrance ────────────────────────────────────────── */
  _heroTimeline() {
    const tl = gsap.timeline({ delay: 0.1 });

    // The photograph settles out of a push-in over the whole entrance —
    // slow enough that you register it as the room, not as an effect.
    tl.fromTo('.hero-bg',
      { scale: 1.07 },
      { scale: 1, duration: 2.2, ease: 'expo.out' },
      0
    )
    // Opacity stays at 1: the mask does the revealing, not a fade.
    .fromTo('.word',
      { yPercent: 112, opacity: 1 },
      { yPercent: 0,   opacity: 1, stagger: 0.13, duration: 1.35, ease: 'expo.out' },
      0.1
    )
    .fromTo('.hero-cta, .hero-place',
      { y: 12, opacity: 0 },
      { y: 0,  opacity: 1, stagger: 0.08, duration: 0.9, ease: 'expo.out' },
      0.95
    );

    return tl;
  },

  /* Reveals below are deliberately short. Content lifts about a line of
     text and settles — enough to feel alive, not enough to be a show. */
  REVEAL: { y: 26, duration: 1.15, ease: 'expo.out' },

  _reveal(targets, opts = {}) {
    const { y, duration, ease } = this.REVEAL;
    gsap.fromTo(targets,
      { y, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration, ease,
        stagger: opts.stagger || 0,
        scrollTrigger: { trigger: opts.trigger, start: opts.start || 'top 86%' }
      }
    );
  },

  /* ── The statement — arrives on its own, well after it enters view ── */
  _statement() {
    if (!document.querySelector('.statement-text')) return;
    gsap.fromTo('.statement-text',
      { y: 34, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 1.5,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.statement', start: 'top 72%' }
      }
    );
  },

  /* ── Section heads ───────────────────────────────────────── */
  _sectionHeaders() {
    document.querySelectorAll('.section-header').forEach(header => {
      const children = header.querySelectorAll('.section-title, .section-subtitle');
      if (!children.length) return;
      this._reveal(children, { trigger: header, stagger: 0.1 });
    });
  },

  /* ── Personnel ───────────────────────────────────────────── */
  _memberCards() {
    this._reveal('.member-card', { trigger: '#membersGrid', stagger: 0.06 });
  },

  /* ── Performances ────────────────────────────────────────── */
  _videoCards() {
    document.querySelectorAll('.video-card').forEach(card => {
      this._reveal(card, { trigger: card });
    });
    if (document.querySelector('.yt-cta-wrap')) {
      this._reveal('.yt-cta-wrap', { trigger: '.yt-cta-wrap', start: 'top 92%' });
    }
  },

  /* ── Photographs — plates settle row by row ──────────────── */
  _galleryItems() {
    this._reveal('.gallery-item', { trigger: '.gallery-grid', stagger: 0.07 });
  },

  /* ── Contact ─────────────────────────────────────────────── */
  _contactCards() {
    this._reveal('.contact-intro', { trigger: '.contact-wrap' });
    this._reveal('.contact-value', { trigger: '.contact-wrap' });
  },

  /* ── Press ───────────────────────────────────────────────── */
  _featuredSection() {
    this._reveal('.featured-wrap', { trigger: '.featured-wrap' });
  },

  /* ── Hero background parallax ─────────────────────────────── */
  _heroParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.to('.hero-bg', {
      yPercent: 9,
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
   MODULE: Gallery Lightbox — opens on a plate, then moves between them
═══════════════════════════════════════════════════════════════ */
const CHEVRON = '<svg viewBox="0 0 10 18" aria-hidden="true" focusable="false"><path d="M9 1 1.5 9 9 17" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';

const Gallery = {
  items: [],
  index: 0,
  box: null,

  init() {
    this.items = Array.from(document.querySelectorAll('.gallery-item:not(.gallery-item--soon)'));
    if (!this.items.length) return;

    this.items.forEach((item, i) => {
      item.addEventListener('click', () => this.open(i));
      // the plates are focusable, so Enter and Space have to open them too
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.open(i); }
      });
    });

    document.addEventListener('keydown', e => {
      if (!this.box) return;
      if (e.key === 'Escape')          this.close();
      else if (e.key === 'ArrowRight') this.step(1);
      else if (e.key === 'ArrowLeft')  this.step(-1);
    });
  },

  // Prefers the <img>; falls back to a background-image if one is ever used
  _src(item) {
    const img = item.querySelector('.gallery-photo img');
    if (img) return img.currentSrc || img.src;
    const photo = item.querySelector('.gallery-photo');
    const match = photo && window.getComputedStyle(photo).backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
    return match ? match[1] : '';
  },

  _venue(item) {
    const el = item.querySelector('.gallery-venue');
    return el ? el.textContent.trim() : '';
  },

  open(i) {
    if (this.box) return;
    this.index = i;

    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Gallery photograph');
    box.innerHTML = `
      <button class="lightbox-close" aria-label="Close">&times;</button>
      <button class="lightbox-nav lightbox-nav--prev" aria-label="Previous photograph">${CHEVRON}</button>
      <div class="lightbox-content"><img src="" alt=""></div>
      <button class="lightbox-nav lightbox-nav--next" aria-label="Next photograph">${CHEVRON}</button>
      <p class="lightbox-caption">
        <span class="lightbox-venue"></span><span class="lightbox-count"></span>
      </p>
    `;
    document.body.appendChild(box);
    this.box = box;
    ScrollLock.on();
    this.render(false);

    // only the backdrop closes — the image and the arrows are live
    box.addEventListener('click', e => { if (e.target === box) this.close(); });
    box.querySelector('.lightbox-close').addEventListener('click', () => this.close());
    box.querySelector('.lightbox-nav--prev').addEventListener('click', e => { e.stopPropagation(); this.step(-1); });
    box.querySelector('.lightbox-nav--next').addEventListener('click', e => { e.stopPropagation(); this.step(1); });
    box.querySelector('.lightbox-close').focus();
  },

  render(fade) {
    const item  = this.items[this.index];
    const img   = this.box.querySelector('.lightbox-content img');
    const venue = this._venue(item);

    img.src = this._src(item);
    img.alt = venue ? `Devils Dectet at ${venue}` : 'Gallery photograph';
    this.box.querySelector('.lightbox-venue').textContent = venue;
    this.box.querySelector('.lightbox-count').textContent = `${this.index + 1} / ${this.items.length}`;

    if (fade && typeof gsap !== 'undefined') {
      gsap.fromTo(img, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    }
  },

  step(dir) {
    if (!this.box) return;
    this.index = (this.index + dir + this.items.length) % this.items.length;
    this.render(true);
  },

  close() {
    if (!this.box) return;
    const box  = this.box;
    const item = this.items[this.index];
    this.box = null;

    const remove = () => {
      if (box.parentNode) box.parentNode.removeChild(box);
      ScrollLock.off();
      if (item && item.focus) item.focus();   // return focus to the plate you opened
    };
    // GSAP is a CDN script — the lightbox still has to close without it
    if (typeof gsap === 'undefined') { remove(); return; }
    gsap.to(box, { opacity: 0, duration: 0.28, ease: 'power2.out', onComplete: remove });
  }
};

/* ═══════════════════════════════════════════════════════════════
   INIT — orchestrate all modules
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // Several elements start at opacity 0 for GSAP to reveal. If GSAP never
  // arrives, this class hands them back rather than leaving a blank hero.
  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (!hasGSAP) document.documentElement.classList.add('no-motion');

  Members.render();
  Members.setupModal();
  YouTubeThumbs.init();
  Gallery.init();
  Navigation.init();

  // Reveals wait for load so ScrollTrigger measures a settled page
  if (hasGSAP) {
    window.addEventListener('load', () => Animations.init());
    if (document.readyState === 'complete') Animations.init();
  }

  console.log('%cDevils Dectet ♪', 'color:#9E1B32;font-size:16px;font-weight:bold;font-family:Georgia,serif;');
});
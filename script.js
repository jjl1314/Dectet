'use strict';

/* ═══════════════════════════════════════════════════════════════
   DEVILS DECTET — script.js
   Members + bio modal · Recordings player · Gallery lightbox · Navigation
   The scroll-scrubbed film that wraps all of it lives in reel.js.
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
    bio: "I'm Advaith Balakrishnan, a current senior at Hinsdale Central High School. I have played cello since 5th grade. Outside of orchestra, I enjoy playing piano and singing Indian classical music. Additionally I am a part of my school's track and field team and I am a starter on the Hinsdale Central Boys Varsity Soccer team."
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
    bio: "Hello, I'm Max, a senior at Hinsdale Central. I have been playing violin for almost 3 years, and piano for 11. I am super passionate about music. I love listening to and playing classical music, and I love playing music with friends. My favorite composers are Rachmaninoff, Stravinsky, and Shostakovich. Along with music, I am also passionate about mathematics."
  },
  {
    name: 'Brandon Kim',
    instrument: 'Violin',
    imageLink: 'images/IMG_5604.JPG',
    bio: "I'm Brandon Kim, a senior at Hinsdale Central High School. I started playing the violin when I was eleven years old, and have fallen in love ever since, and have represented the school in ILMEA District and All-State Orchestras. When I am not playing the violin, I enjoy running on our school's varsity track team, and cooking different types of foods with my mother."
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
   Motion. Overlays open out of whatever you touched and close back
   into it, on a critically damped spring: no overshoot, because
   nothing was thrown. The spring is sampled into a CSS linear() curve
   so the browser runs it on the compositor; where linear() is not
   understood, a curve of the same shape stands in.
═══════════════════════════════════════════════════════════════ */
const Motion = {
  ok() {
    return typeof Element.prototype.animate === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  spring(response = 0.42) {
    this.cache = this.cache || {};
    if (this.cache[response]) return this.cache[response];
    const w = 2 * Math.PI / response, T = 7.4 / w, N = 30;
    const end = 1 - (1 + w * T) * Math.exp(-w * T);
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = T * i / N;
      pts.push(((1 - (1 + w * t) * Math.exp(-w * t)) / end).toFixed(4));
    }
    const curve = `linear(${pts.join(', ')})`;
    const native = !!(window.CSS && CSS.supports && CSS.supports('transition-timing-function', curve));
    return (this.cache[response] = { easing: native ? curve : 'cubic-bezier(0.3, 0.9, 0.3, 1)', duration: Math.round(T * 1000) });
  },

  // The transform that lays box b exactly over box a (same proportions)
  from(a, b) {
    const dx = a.left + a.width / 2 - (b.left + b.width / 2);
    const dy = a.top + a.height / 2 - (b.top + b.height / 2);
    return `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${(a.width / b.width).toFixed(4)})`;
  },

  seen(r) {
    return r.width > 1 && r.height > 1 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
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
      // Cards use the sized copy in images/reel; the bio keeps the original.
      // A portrait added without a sized copy falls back to its original.
      const imgMarkup = m.imageLink
        ? `<img src="${Members.cardSrc(m.imageLink)}" data-original="${m.imageLink}" alt="Photo of ${m.name}" loading="lazy" decoding="async">`
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
    grid.querySelectorAll('img[data-original]').forEach(img => {
      img.addEventListener('error', () => {
        if (img.src.indexOf(img.dataset.original) === -1) img.src = img.dataset.original;
      }, { once: true });
    });
  },

  cardSrc(link) {
    const file = link.split('/').pop().replace(/\.[^.]+$/, '');
    return `images/reel/${file}.webp`;
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
    const content     = modal.querySelector('.bio-modal-content');
    let prevFocus     = null;

    const open = (member, card) => {
      prevFocus = document.activeElement;
      // the bio grows out of the portrait that was chosen, and goes back
      // into it (offsets are layout positions, untouched by the scale)
      if (card) {
        const r = (card.querySelector('.member-photo') || card).getBoundingClientRect();
        const ox = r.left + r.width / 2 - content.offsetLeft;
        const oy = r.top + r.height / 2 - content.offsetTop;
        content.style.transformOrigin = `${ox.toFixed(1)}px ${oy.toFixed(1)}px`;
      }
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
      if (!isNaN(idx) && musiciansData[idx]) open(musiciansData[idx], card);
    });

    // Keyboard: Enter / Space
    document.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('member-card')) {
        e.preventDefault();
        const idx = parseInt(e.target.dataset.memberIndex, 10);
        if (!isNaN(idx) && musiciansData[idx]) open(musiciansData[idx], e.target);
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
  lastY: 0,          // where the reader's scrolling was last read for a direction
  ticking: false,
  jumping: false,    // a jump the navigation asked for is under way (static page)
  landing: null,     // the heading focus goes to once the jump lands

  init() {
    this.header = document.getElementById('site-header');
    if (!this.header) return;

    this._setupScroll();
    this._setupMobileNav();
    this._setupMark();
    this._setupActiveHighlight();
    this._setupSmoothScroll();
  },

  // One accent rule under the link of the section you are in. When that
  // changes, the rule travels to the new link on a critically damped
  // spring (adapted from the tubelight / travelling-dot navigation on
  // 21st.dev), retargeting from wherever it is if it changes again
  // mid-flight. It follows the `active` class, whoever sets it.
  _setupMark() {
    const nav = this.header.querySelector('nav');
    if (!nav || !nav.querySelector('ul li a')) return;
    const mark = document.createElement('span');
    mark.className = 'nav-mark';
    mark.setAttribute('aria-hidden', 'true');
    nav.appendChild(mark);
    nav.classList.add('has-mark');

    const w0 = 2 * Math.PI / 0.36;          // response 0.36 s, damping 1
    const S = { x: 0, w: 0, vx: 0, vw: 0, tx: 0, tw: 0, shown: false, raf: 0, last: 0 };
    // The rule is drawn at its true length, never a one-pixel line stretched
    // out: stretched, its ends are left to the GPU to blur, and at a zoom
    // that is not a whole number it falls visibly short of the label.
    const paint = () => {
      mark.style.width = `${Math.max(0, S.w).toFixed(2)}px`;
      mark.style.transform = `translateX(${S.x.toFixed(2)}px)`;
    };
    // the label's own extent, to the fraction of a pixel (offsetLeft and
    // offsetWidth are whole pixels, which can leave the last letter short)
    const extent = a => {
      const r = document.createRange();
      r.selectNodeContents(a);
      const t = r.getBoundingClientRect(), n = nav.getBoundingClientRect();
      return { x: t.left - n.left - nav.clientLeft, w: t.width };
    };
    const step = now => {
      const dt = Math.min(0.032, Math.max(0.001, (now - S.last) / 1000));
      S.last = now;
      S.vx += (-w0 * w0 * (S.x - S.tx) - 2 * w0 * S.vx) * dt; S.x += S.vx * dt;
      S.vw += (-w0 * w0 * (S.w - S.tw) - 2 * w0 * S.vw) * dt; S.w += S.vw * dt;
      if (Math.abs(S.x - S.tx) < 0.05 && Math.abs(S.w - S.tw) < 0.05 && Math.abs(S.vx) + Math.abs(S.vw) < 2) {
        S.x = S.tx; S.w = S.tw; S.vx = S.vw = 0; paint(); S.raf = 0; return;
      }
      paint();
      S.raf = requestAnimationFrame(step);
    };
    const update = instant => {
      const a = nav.querySelector('ul li a.active');
      if (!a || !a.offsetWidth) { mark.style.opacity = '0'; S.shown = false; return; }
      const e = extent(a);
      S.tx = e.x; S.tw = e.w;
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (instant || !S.shown || calm) {
        if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
        S.x = S.tx; S.w = S.tw; S.vx = S.vw = 0; paint();
        mark.style.opacity = '1'; S.shown = true;
        return;
      }
      if (!S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(step); }
    };
    new MutationObserver(() => update(false)).observe(nav, { attributes: true, attributeFilter: ['class'], subtree: true });
    window.addEventListener('resize', () => update(true));
    // a label changes width when its typeface arrives, or the page is zoomed
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => { if (!S.raf) update(true); });
      nav.querySelectorAll('ul li a').forEach(a => ro.observe(a));
    }
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(() => update(true));
      if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => update(true));
    }
    update(true);
  },

  /* The header hides while you read on and comes back the moment you
     turn back. Direction is measured from where it was last decided, so
     slow scrolling adds up instead of slipping under a per-frame threshold.
     A jump the navigation makes is not the reader scrolling: it is never
     read as a direction, and every jump lands with the header put away
     (except at the top of the page, where it is part of the title card). */
  _setupScroll() {
    this.lastY = Math.max(0, window.scrollY);
    // (a page reloaded part-way down shows the bar on its ground)
    if (this.lastY > 60) this.header.classList.add('scrolled');
    window.addEventListener('scroll', () => {
      if (!this.ticking) {
        requestAnimationFrame(() => this._onScroll());
        this.ticking = true;
      }
    }, { passive: true });
    // the film reports its jumps: where it lands is a fresh start
    document.addEventListener('reel:jump', () => this.landed());
    document.addEventListener('reel:landed', () => this._focusLanding());
    // (the film re-laid out for a new window size: not a direction either)
    document.addEventListener('reel:moved', () => { this.lastY = Math.max(0, window.scrollY); });
    // a keyboard reaching into the hidden bar brings it back
    this.header.addEventListener('focusin', e => {
      if (Navigation.keyed(e.target)) this.reveal();
    });
  },

  // The bar takes its light ground only when it is shown over the page: on
  // its way out from the title card it leaves as it was, without flashing
  // a pale strip over the photograph.
  _onScroll() {
    this.ticking = false;
    const y = Math.max(0, window.scrollY);
    const h = this.header;
    if (y <= 60) {
      h.classList.remove('scrolled');
      if (!this.jumping) { h.classList.remove('hidden'); this.lastY = y; }
      return;
    }
    if (this.jumping) return;
    const dy = y - this.lastY;
    if (Math.abs(dy) < 6) return;
    if (dy > 0) { if (!h.classList.contains('nav-open')) h.classList.add('hidden'); }
    else h.classList.remove('hidden');
    if (!h.classList.contains('hidden')) h.classList.add('scrolled');
    this.lastY = y;
  },

  // A jump has landed: the header is put away and direction starts again
  // from here. Nothing is held over, so the next scroll either way is read
  // as it would be anywhere else.
  landed() {
    const y = Math.max(0, window.scrollY);
    const h = this.header;
    this.jumping = false;
    this.lastY = y;
    if (y <= 60) h.classList.remove('scrolled', 'hidden');
    else h.classList.add('hidden');
  },

  reveal() {
    const y = Math.max(0, window.scrollY);
    this.header.classList.remove('hidden');
    if (y > 60) this.header.classList.add('scrolled');
    this.lastY = y;
  },

  // Focus follows the reader to the section they chose, as an in-page link
  // would take it, so it is never left behind in the bar that has just
  // been put away. (Programmatic focus after a click shows no ring.)
  _focusLanding() {
    const el = this.landing;
    this.landing = null;
    if (!el || !el.isConnected) return;
    const from = document.activeElement;
    // only if the reader has not gone on to something else meanwhile
    if (from && from !== document.body && !this.header.contains(from) && !from.closest('.hero-foot')) return;
    // (and the film is not to take this as the reader asking to see the
    // heading: if they have scrolled on since, it stays where they are)
    const R = window.Reel;
    if (R) R.quiet = true;
    try { el.focus({ preventScroll: true }); } finally { if (R) R.quiet = false; }
  },

  // Whether focus arrived from the keyboard
  keyed(el) {
    try { return el.matches(':focus-visible'); } catch (e) { return false; }
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
    // In the reel every section shares one frame, so "in view" means
    // nothing; reel.js marks the link from the timecode instead.
    if (Navigation.reelActive()) return;

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
        const hash = anchor.getAttribute('href');
        const target = document.querySelector(hash);
        if (!target) return;
        e.preventDefault();
        this.landing = Navigation.headingOf(target);
        // In the reel a section is a moment in the film, not a place on
        // the page: the film cuts to it, and reports where it lands.
        if (Navigation.reelActive()) {
          if (!window.Reel.go(hash.slice(1))) this.landing = null;
          return;
        }
        // The header is put away when the jump lands, so the section is
        // brought to the top of the window rather than under the bar.
        const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY);
        const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.jumping = true;
        // (it is going anyway: it goes now, rather than ride the scroll)
        if (top > 60) this.header.classList.add('hidden');
        window.scrollTo({ top, behavior: calm ? 'auto' : 'smooth' });
        this._awaitLanding();
      });
    });
    // a hand on the controls mid-jump takes over from it, there and then
    const takeOver = () => { if (this.jumping) { this.jumping = false; this.lastY = Math.max(0, window.scrollY); } };
    window.addEventListener('wheel', takeOver, { passive: true });
    window.addEventListener('touchstart', takeOver, { passive: true });
  },

  // The static page's smooth scroll: landed once the window has stopped
  _awaitLanding() {
    let last = NaN, still = 0;
    const done = () => {
      if (!this.jumping) return;
      this.landed();
      this._focusLanding();
    };
    if ('onscrollend' in window) window.addEventListener('scrollend', done, { once: true });
    const check = () => {
      if (!this.jumping) return;
      const y = window.scrollY;
      still = Math.abs(y - last) < 0.5 ? still + 1 : 0;
      last = y;
      if (still >= 8) done(); else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  },

  headingOf(section) {
    const h = section.querySelector('h1, h2');
    if (h && !h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
    return h;
  },

  reelActive() {
    return !!(window.Reel && window.Reel.active);
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
      if (e.key === 'Tab') {
        const controls = this.box.querySelectorAll('.lightbox-close, .lightbox-nav');
        const first = controls[0], last = controls[controls.length - 1];
        if (!this.box.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.key === 'Escape')     this.close();
      else if (e.key === 'ArrowRight') this.step(1);
      else if (e.key === 'ArrowLeft')  this.step(-1);
    });
    window.addEventListener('resize', () => { if (this.box) this._size(); });
  },

  // Enlarged plates show the full-resolution original; the page itself
  // shows a sized copy. Falls back to a background-image if one is ever used.
  _src(item) {
    const img = item.querySelector('.gallery-photo img');
    if (img) return img.dataset.full || img.currentSrc || img.src;
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
      <div class="lightbox-scrim"></div>
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
    box.addEventListener('click', e => { if (e.target === box || e.target.classList.contains('lightbox-scrim')) this.close(); });
    box.querySelector('.lightbox-close').addEventListener('click', () => this.close());
    box.querySelector('.lightbox-nav--prev').addEventListener('click', e => { e.stopPropagation(); this.step(-1); });
    box.querySelector('.lightbox-nav--next').addEventListener('click', e => { e.stopPropagation(); this.step(1); });
    box.querySelector('.lightbox-close').focus();
    if (Motion.ok()) this._zoom(box, this.items[i], true);
  },

  // The picture is given its plate's proportions at the size it will be
  // shown, so the full original can load into it without anything moving
  _size() {
    const item = this.items[this.index];
    const img = this.box.querySelector('.lightbox-content img');
    const plate = item.querySelector('.gallery-photo img');
    let ar = plate && plate.naturalWidth ? plate.naturalWidth / plate.naturalHeight : 0;
    if (!ar) {
      const v = (item.style.getPropertyValue('--ar') || '3/2').split('/');
      ar = parseFloat(v[0]) / parseFloat(v[1]) || 1.5;
    }
    const maxW = Math.min(window.innerWidth * 0.78, 1200), maxH = window.innerHeight * 0.78;
    let w = maxW, h = w / ar;
    if (h > maxH) { h = maxH; w = h * ar; }
    img.style.width = `${Math.round(w)}px`;
    img.style.height = `${Math.round(h)}px`;
  },

  render(fade) {
    const item  = this.items[this.index];
    const img   = this.box.querySelector('.lightbox-content img');
    const plate = item.querySelector('.gallery-photo img');
    const venue = this._venue(item);

    this._size();
    // the copy already on the page shows at once; the original takes its
    // place as soon as it has loaded
    const full = this._src(item);
    const quick = plate ? (plate.currentSrc || plate.src) : full;
    img.src = quick || full;
    if (full && full !== quick) {
      const pre = new Image();
      pre.onload = () => { if (this.box && this.items[this.index] === item) img.src = full; };
      pre.src = full;
    }
    img.alt = venue ? `Devils Dectet at ${venue}` : 'Gallery photograph';
    this.box.querySelector('.lightbox-venue').textContent = venue;
    this.box.querySelector('.lightbox-count').textContent = `${this.index + 1} / ${this.items.length}`;

    if (fade && Motion.ok()) {
      img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    }
  },

  // Opening, the photograph travels from its plate to the middle of the
  // screen as the room darkens around it; closing, it goes back to the
  // plate it is showing now (the one you stepped to), or simply fades if
  // that plate is out of view.
  _zoom(box, item, opening, done) {
    const img = box.querySelector('.lightbox-content img');
    const scrim = box.querySelector('.lightbox-scrim');
    const chrome = Array.from(box.querySelectorAll('.lightbox-close, .lightbox-nav, .lightbox-caption'));
    const plate = item.querySelector('.gallery-photo');
    const pImg = plate && plate.querySelector('img');
    const a = plate ? plate.getBoundingClientRect() : { width: 0, height: 0 };
    const there = Motion.seen(a) ? Motion.from(a, img.getBoundingClientRect()) : null;
    const away = { transform: there || 'scale(0.96)', opacity: there ? 1 : 0 };
    const home = { transform: 'none', opacity: 1 };
    const sp = Motion.spring(0.42);
    const fill = opening ? 'backwards' : 'forwards';
    // the plate steps aside while its picture is in flight
    if (there && pImg) pImg.style.visibility = 'hidden';
    const fly = img.animate(opening ? [away, home] : [home, away], { duration: sp.duration, easing: sp.easing, fill });
    scrim.animate(opening ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
      { duration: opening ? 300 : 320, delay: opening ? 0 : sp.duration * 0.25, easing: 'cubic-bezier(0.33, 1, 0.68, 1)', fill });
    chrome.forEach(el => {
      const o = getComputedStyle(el).opacity;
      el.animate(opening ? [{ opacity: 0 }, { opacity: o }] : [{ opacity: o }, { opacity: 0 }],
        { duration: opening ? 260 : 120, delay: opening ? sp.duration * 0.5 : 0, easing: 'ease-out', fill });
    });
    fly.onfinish = () => {
      if (pImg) pImg.style.visibility = '';
      if (done) done();
    };
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
      // The reader may have cut to another scene while the closing zoom
      // finishes. Only return focus when this plate still belongs on screen.
      if (item && item.focus && (!window.Reel || !window.Reel.active || window.Reel.holding('gallery')))
        item.focus({ preventScroll: true });
    };
    if (!Motion.ok()) { remove(); return; }
    this._zoom(box, item, false, remove);
  }
};

/* ═══════════════════════════════════════════════════════════════
   MODULE: Player — a recording plays here, on the page. Its thumbnail
   grows into the player as the room darkens (adapted from Magic UI's
   Hero Video Dialog, via 21st.dev, MIT). Scroll on, or click outside
   it, and it moves aside into the corner and keeps playing, the way a
   picture-in-picture player does, until it is brought back or closed.
   The embed never moves in the page, so nothing ever restarts it. A
   modified click still opens the recording on YouTube, and without
   JavaScript the link does just that.
═══════════════════════════════════════════════════════════════ */
const ICON = {
  play:   '<svg viewBox="0 0 12 14" aria-hidden="true" focusable="false"><path d="M12 7 0 14V0Z" /></svg>',
  min:    '<svg viewBox="0 0 18 18" aria-hidden="true" focusable="false"><rect x="1.5" y="3.5" width="15" height="11" /><rect x="9" y="9" width="5" height="3.5" fill="currentColor" stroke="none" /></svg>',
  expand: '<svg viewBox="0 0 18 18" aria-hidden="true" focusable="false"><path d="M2 7V2h5M11 2h5v5M16 11v5h-5M7 16H2v-5" /></svg>',
  close:  '<svg viewBox="0 0 18 18" aria-hidden="true" focusable="false"><path d="M3.5 3.5l11 11M14.5 3.5l-11 11" /></svg>',
};

const Player = {
  el: null,
  E: null,
  link: null,
  frame: null,
  state: 'closed',          // closed · open (large, over the page) · docked (in the corner)
  y0: 0,

  init() {
    const links = Array.from(document.querySelectorAll('.video-link'));
    if (!links.length) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="player" id="player" role="dialog" aria-modal="false" aria-labelledby="playerTitle" hidden>
        <div class="player-scrim"></div>
        <div class="player-box">
          <div class="player-frame">
            <img class="player-poster" alt="">
            <div class="player-veil"></div>
          </div>
          <div class="player-bar">
            <div class="player-text">
              <h2 class="player-title" id="playerTitle"></h2>
              <p class="player-venue"></p>
            </div>
            <button class="player-btn player-min" type="button" aria-label="Minimise video">${ICON.min}</button>
            <button class="player-btn player-expand" type="button" aria-label="Enlarge video">${ICON.expand}</button>
            <button class="player-btn player-close" type="button" aria-label="Close video">${ICON.close}</button>
          </div>
        </div>
        <div class="player-play" aria-hidden="true">${ICON.play}</div>
      </div>
    `);
    const el = this.el = document.getElementById('player');
    const q = s => el.querySelector(s);
    this.E = {
      scrim: q('.player-scrim'), box: q('.player-box'), frame: q('.player-frame'),
      poster: q('.player-poster'), veil: q('.player-veil'), bar: q('.player-bar'),
      title: q('.player-title'), venue: q('.player-venue'), play: q('.player-play'),
      min: q('.player-min'), expand: q('.player-expand'), close: q('.player-close'),
    };
    const E = this.E;

    links.forEach(a => a.addEventListener('click', e => {
      // a new tab or window is the reader's call: the link still does that
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const thumb = a.querySelector('[data-youtube-id]');
      if (!thumb || !thumb.dataset.youtubeId) return;
      e.preventDefault();
      this.open(a, thumb.dataset.youtubeId);
    }));

    // Clicking away, or the minimise button, moves it aside; only the
    // close button (or Escape) stops the music
    E.scrim.addEventListener('click', () => this.dock());
    E.min.addEventListener('click', () => this.dock());
    E.expand.addEventListener('click', () => this.expand());
    E.close.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape' || this.state === 'closed') return;
      if (this.state === 'open' || el.contains(document.activeElement)) { e.preventDefault(); this.close(); }
    });
    // Scrolling on never stops a recording: it moves it into the corner
    window.addEventListener('scroll', () => {
      if (this.state === 'open' && Math.abs(window.scrollY - this.y0) > 48) this.dock();
    }, { passive: true });
  },

  // Where the frame stands now, as laid out (whatever it is animating)
  frameBox() {
    const b = this.E.box.getBoundingClientRect();
    const h = b.width * 9 / 16;
    return { left: b.left, top: b.top, width: b.width, height: h, right: b.right, bottom: b.top + h };
  },

  // Move the frame from where it was to where its state now puts it
  glide(from, sp) {
    const E = this.E;
    const to = this.frameBox();
    for (const a of E.frame.getAnimations()) a.cancel();
    E.frame.animate([{ transform: Motion.from(from, to) }, { transform: 'none' }], { duration: sp.duration, easing: sp.easing });
    E.bar.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: sp.duration * 0.6, easing: 'ease-out', fill: 'backwards' });
  },

  open(link, id) {
    const E = this.E;
    if (this.state !== 'closed') this.unload();
    this.link = link;
    const still = link.querySelector('.video-thumb-img');
    const title = link.querySelector('.video-title');
    const venue = link.querySelector('.video-venue');
    E.poster.src = still ? (still.currentSrc || still.src) : '';
    E.title.textContent = title ? title.textContent.trim() : '';
    E.venue.innerHTML = venue ? venue.innerHTML : '';
    E.frame.classList.remove('is-playing');

    // The player starts loading at once, under the still, and the still
    // lifts off it once it is ready
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1`;
    f.title = `${E.title.textContent} — Devils Dectet`;
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.setAttribute('allowfullscreen', '');
    f.addEventListener('load', () => {
      setTimeout(() => { if (this.frame === f) E.frame.classList.add('is-playing'); }, 300);
    }, { once: true });
    E.frame.insertBefore(f, E.poster);
    this.frame = f;

    this.el.classList.remove('is-docked');
    this.el.hidden = false;
    this.state = 'open';
    this.y0 = window.scrollY;
    E.close.focus({ preventScroll: true });
    if (!Motion.ok()) return;

    const thumb = link.querySelector('.video-thumb').getBoundingClientRect();
    const btn = link.querySelector('.play-btn');
    const box = this.frameBox();
    const sp = Motion.spring(0.44);
    E.frame.animate([{ transform: Motion.from(thumb, box) }, { transform: 'none' }], { duration: sp.duration, easing: sp.easing });
    E.veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: sp.duration * 0.7, easing: 'ease-out' });
    E.scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' });
    E.bar.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
      { duration: 300, delay: sp.duration * 0.55, easing: 'cubic-bezier(0.33, 1, 0.68, 1)', fill: 'backwards' });
    if (btn) this.carry(btn.getBoundingClientRect(), box, true, sp);
  },

  // The thumbnail's play mark rides along to the middle of the frame and
  // is let go as the picture comes up to size; on the way back it returns
  // to its button. So the button never simply blinks out, or in.
  carry(btn, box, opening, sp) {
    const P = this.E.play;
    P.style.width = P.style.height = `${btn.width.toFixed(1)}px`;
    const atBtn = `translate(${btn.left.toFixed(1)}px, ${btn.top.toFixed(1)}px)`;
    const atMid = `translate(${(box.left + box.width / 2 - btn.width / 2).toFixed(1)}px, ${(box.top + box.height / 2 - btn.height / 2).toFixed(1)}px)`;
    P.animate(opening ? [{ transform: atBtn }, { transform: atMid }] : [{ transform: atMid }, { transform: atBtn }],
      { duration: sp.duration, easing: sp.easing, fill: 'both' });
    P.animate(opening ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }],
      { duration: sp.duration * 0.45, delay: opening ? 0 : sp.duration * 0.55, easing: 'ease-out', fill: opening ? 'forwards' : 'both' });
  },

  // Into the corner, still playing
  dock() {
    if (this.state !== 'open') return;
    const from = this.frameBox();
    this.el.classList.add('is-docked');
    this.state = 'docked';
    if (Motion.ok()) this.glide(from, Motion.spring(0.42));
  },

  // Back out of the corner, over the page
  expand() {
    if (this.state !== 'docked') return;
    const from = this.frameBox();
    this.el.classList.remove('is-docked');
    this.state = 'open';
    this.y0 = window.scrollY;
    this.E.close.focus({ preventScroll: true });
    if (Motion.ok()) this.glide(from, Motion.spring(0.44));
  },

  close() {
    if (this.state === 'closed') return;
    const E = this.E;
    const wasOpen = this.state === 'open';
    this.state = 'closing';
    // the still comes back over the picture at once, and the recording
    // stops under it
    E.poster.style.transition = 'none';
    E.frame.classList.remove('is-playing');
    if (this.frame) { this.frame.remove(); this.frame = null; }
    const done = () => this.unload(wasOpen);
    if (!Motion.ok()) { done(); return; }

    // from wherever it is now, even mid-flight: back into its card if the
    // card is in view, otherwise it simply goes
    const now = getComputedStyle(E.frame).transform;
    for (const a of E.frame.getAnimations()) a.cancel();
    const thumb = this.link && this.link.querySelector('.video-thumb').getBoundingClientRect();
    const box = this.frameBox();
    const there = wasOpen && thumb && Motion.seen(thumb) ? Motion.from(thumb, box) : null;
    const sp = Motion.spring(0.4);
    const back = E.frame.animate([
      { transform: now && now !== 'none' ? now : 'none', opacity: 1 },
      { transform: there || 'scale(0.94)', opacity: there ? 1 : 0 },
    ], { duration: there ? sp.duration : 260, easing: there ? sp.easing : 'ease-in', fill: 'forwards' });
    if (there) E.veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: sp.duration * 0.6, delay: sp.duration * 0.4, fill: 'forwards' });
    E.scrim.animate([{ opacity: getComputedStyle(E.scrim).opacity }, { opacity: 0 }], { duration: 300, delay: there ? sp.duration * 0.25 : 0, easing: 'ease-in-out', fill: 'forwards' });
    E.bar.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' });
    const btn = this.link && this.link.querySelector('.play-btn');
    if (there && btn) this.carry(btn.getBoundingClientRect(), box, false, sp);
    back.onfinish = done;
  },

  // Put everything away. Focus goes back to the recording's own card only
  // if the card is on screen to receive it.
  unload(refocus) {
    const E = this.E;
    if (this.frame) { this.frame.remove(); this.frame = null; }
    for (const a of this.el.getAnimations({ subtree: true })) a.cancel();
    E.frame.classList.remove('is-playing');
    E.poster.style.transition = '';
    this.el.hidden = true;
    this.el.classList.remove('is-docked');
    this.state = 'closed';
    // A closing player may finish after the reader has already scrolled or
    // cut to another scene. Returning focus to its old card would pull the
    // reel back to Performances just as the new scene arrives.
    if (refocus && this.link && (!window.Reel || !window.Reel.active || window.Reel.holding('performances'))) {
      const r = this.link.getBoundingClientRect();
      if (Motion.seen(r)) this.link.focus({ preventScroll: true });
    }
  }
};

/* ═══════════════════════════════════════════════════════════════
   INIT — orchestrate all modules
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  Members.render();
  Members.setupModal();
  Gallery.init();
  Player.init();

  // The film claims the page before navigation wires itself up, so the
  // links know whether a section is a place on the page or a moment in it.
  if (window.Reel) window.Reel.init();
  Navigation.init();

  // If the film ever steps aside, the page scrolls as a page again
  document.addEventListener('reel:off', () => Navigation._setupActiveHighlight(), { once: true });

  console.log('%cDevils Dectet ♪', 'color:#9E1B32;font-size:16px;font-weight:bold;font-family:Georgia,serif;');
});

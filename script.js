'use strict';

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

/* ── Render Members ──────────────────────────────────────────── */
function renderMusicians() {
  const grid = document.getElementById('membersGrid');
  if (!grid) return;

  grid.innerHTML = musiciansData.map((m, i) => {
    // Check if member has Founder role (Isaiah or Jason)
    const isFounder = m.role === 'Founder';
    
    const imgMarkup = m.imageLink
      ? `<img src="${m.imageLink}" alt="Photo of ${m.name}" loading="lazy">`
      : '';

    // Only generate role badge HTML if isFounder is true
    const roleBadgeHTML = isFounder ? '<span class="role-badge">FOUNDER</span>' : '';

    return `
      <div class="member-card reveal" role="listitem" tabindex="0"
           data-member-index="${i}" ${isFounder ? `data-role="founder"` : ''}
           aria-label="View bio for ${m.name}, ${m.instrument}"
           style="--reveal-delay:${i * 0.06}s">
        <div class="member-photo">
          ${imgMarkup}
          ${roleBadgeHTML}
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

  // Stagger the card reveals
  grid.querySelectorAll('.member-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.06}s`;
  });
}

/* ── Bio Modal ───────────────────────────────────────────────── */
function setupMemberBiographies() {
  // Inject modal HTML
  document.body.insertAdjacentHTML('beforeend', `
    <div class="bio-modal" role="dialog" aria-modal="true" aria-labelledby="bio-modal-name" id="bioModal">
      <div class="bio-modal-overlay"></div>
      <div class="bio-modal-content">
        <button class="bio-modal-close" aria-label="Close biography">&times;</button>
        <div class="bio-img-side" id="bioImgSide">
          <img id="bioModalImage" src="" alt="">
          <div class="bio-img-fade"></div>
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

  const modal           = document.getElementById('bioModal');
  const imgEl           = document.getElementById('bioModalImage');
  const imgSide         = document.getElementById('bioImgSide');
  const nameEl          = document.getElementById('bioModalName');
  const instrumentEl    = document.getElementById('bioModalInstrument');
  const roleEl          = document.getElementById('bioModalRole');
  const bioEl           = document.getElementById('bioModalBio');
  const closeBtn        = modal.querySelector('.bio-modal-close');
  const overlay         = modal.querySelector('.bio-modal-overlay');
  let previousFocus     = null;

  function openModal(member) {
    previousFocus = document.activeElement;
    nameEl.textContent       = member.name;
    instrumentEl.textContent = member.instrument;
    bioEl.textContent        = member.bio || 'Biography coming soon…';

    if (member.role) {
      roleEl.textContent = member.role;
      roleEl.hidden = false;
    } else {
      roleEl.hidden = true;
    }

    // Load image
    if (member.imageLink) {
      const probe = new Image();
      probe.onload = () => {
        imgEl.src = member.imageLink;
        imgEl.alt = `Photo of ${member.name}`;
        imgSide.style.display = '';
      };
      probe.onerror = () => { imgSide.style.display = 'none'; };
      probe.src = member.imageLink;
    } else {
      imgSide.style.display = 'none';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
      imgEl.src = '';
      imgEl.alt = '';
      imgSide.style.display = '';
    }, 350);
    if (previousFocus) previousFocus.focus();
  }

  // Attach click events (delegated, runs after cards render)
  document.addEventListener('click', e => {
    const card = e.target.closest('.member-card');
    if (card) {
      const idx = parseInt(card.dataset.memberIndex, 10);
      if (!isNaN(idx) && musiciansData[idx]) openModal(musiciansData[idx]);
    }
  });

  // Keyboard: Enter / Space on card
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('member-card')) {
      e.preventDefault();
      const idx = parseInt(e.target.dataset.memberIndex, 10);
      if (!isNaN(idx) && musiciansData[idx]) openModal(musiciansData[idx]);
    }
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
}

/* ── Header scroll / hide ────────────────────────────────────── */
function setupHeader() {
  const header = document.getElementById('site-header');
  let lastY = 0;
  let ticking = false;

  function update() {
    const y = window.scrollY;

    if (y > 60) {
      header.classList.add('scrolled');
      if (y > lastY + 2 && !header.classList.contains('nav-open')) {
        header.classList.add('hidden');
      } else if (y < lastY - 2) {
        header.classList.remove('hidden');
      }
    } else {
      header.classList.remove('scrolled', 'hidden');
    }

    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
}

/* ── Mobile nav ──────────────────────────────────────────────── */
function setupMobileNav() {
  const header    = document.getElementById('site-header');
  const toggle    = header.querySelector('.menu-toggle');
  const navLinks  = header.querySelectorAll('nav ul li a');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', open);
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      header.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ── Active nav highlight ────────────────────────────────────── */
function setupActiveNav() {
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
  }, { threshold: 0.35 });

  sections.forEach(s => obs.observe(s));
}

/* ── Smooth scroll ───────────────────────────────────────────── */
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = document.getElementById('site-header').offsetHeight;
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ── Scroll-reveal (Intersection Observer) ───────────────────── */
function setupScrollReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -48px 0px' });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ── Hero parallax ───────────────────────────────────────────── */
function setupHeroParallax() {
  const bg = document.querySelector('.hero-bg');
  if (!bg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight * 1.5) {
          bg.style.transform = `translateY(${y * 0.28}px)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ── YouTube thumbnails ──────────────────────────────────────── */
function setupYouTubeThumbnails() {
  document.querySelectorAll('.video-thumb[data-youtube-id]').forEach(el => {
    const id = el.getAttribute('data-youtube-id').split('&')[0].trim();
    if (!id) return;
    const url = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    el.style.backgroundImage    = `url('${url}')`;
    el.style.backgroundSize     = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.backgroundRepeat   = 'no-repeat';
  });
}

/* ── Gallery lightbox ────────────────────────────────────────── */
function setupGalleryLightbox() {
  document.addEventListener('click', e => {
    const item = e.target.closest('.gallery-item');
    if (!item) return;

    const photo = item.querySelector('.gallery-photo');
    const bgImg = window.getComputedStyle(photo).backgroundImage;
    const match = bgImg.match(/url\(["']?([^"')]+)["']?\)/);
    if (!match) return;

    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Gallery photo');
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <img src="${match[1]}" alt="Gallery photo enlarged">
        <button class="lightbox-close" aria-label="Close photo">&times;</button>
      </div>
    `;
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('.lightbox-close').focus();

    const close = () => {
      document.body.removeChild(lightbox);
      document.body.style.overflow = '';
    };

    lightbox.querySelector('.lightbox-close').addEventListener('click', close);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handler); }
    });
  });
}

/* ── Stagger reveal for member cards ─────────────────────────── */
function setupMemberStagger() {
  // After cards render, re-observe them
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

  document.querySelectorAll('.member-card').forEach(el => obs.observe(el));
}

/* ── Init ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderMusicians();
  setupMemberBiographies();
  setupHeader();
  setupMobileNav();
  setupActiveNav();
  setupSmoothScroll();
  setupScrollReveal();
  setupHeroParallax();
  setupYouTubeThumbnails();
  setupGalleryLightbox();
  setupMemberStagger();

  // Kick reveal for elements already in view on load
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 48) el.classList.add('visible');
    });
  }, 120);

  console.log('%cDevils Dectet ♪', 'color:#B91C3C;font-size:14px;font-weight:bold;');
});
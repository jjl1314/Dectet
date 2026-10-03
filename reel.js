'use strict';

/* ═══════════════════════════════════════════════════════════════
   DEVILS DECTET — reel.js

   The site, cut as one continuous film and played by the scroll bar.

   Scroll position → progress (0–1) → timecode. Every element's state is
   a pure function of that timecode: nothing is triggered, nothing plays
   on its own, and nothing is carried from one frame to the next. Any
   scroll position always shows the same picture, however you arrived at
   it, and scrolling back runs the film backwards exactly.

   The cut is written in beats: 128 BPM, a little over seven bars of 4/4.
   It ends on the frame where the last page is complete, so the bottom of
   the page is that frame: there is no scrolling past it.

     Before     While it gets ready, one string is tuned across the dark
                frame; on the downbeat the name rises out of it and the
                house lights come up (Tuning, below).
     Bar 1      The stage, and the name across it. The photograph washes
                into the curtain; "Devils" fades as it passes behind, and
                "Dectet" travels on its own into "Ten students. One
                Dectet."
     Bar 2      The statement lifts and fades, then the empty curtain parts.
     Bar 3      Behind it the stage breaks into ten, and each piece
                turns over into one of the players. The heading gathers
                with them.
     Bar 4      The roster parts like a curtain on the screening room;
                the three recordings open out of the dark, and their
                heading is projected.
     Bar 5      The camera goes on past them, and the photographs come
                towards it out of the depth of the frame; the light that
                comes up behind them finds their heading.
     Bar 6      They gather into one pile, and the newspaper photograph
                lands on top of it. The page prints round it.
     Bar 7–8    Ink washes up over the page, and the last page is written
                in it.

   No two headings arrive the same way: each comes the way its scene does.

   Structure: easing · tracks · the film · stage · layout · measure ·
   the cut · scroll map · playhead · tuning.
═══════════════════════════════════════════════════════════════ */
window.__reelBooted = true;

(function () {

  const BPM   = 128;
  const BEAT  = 60 / BPM;          // seconds per beat
  const BEATS = 31.0;              // to the frame where the last page is complete
  const LAG   = 0.06;              // s — how quickly the picture catches the playhead
  const CUT_COVER  = 180;          // ms — the colour comes up
  const CUT_REVEAL = 380;          // ms — and lifts off the new frame
  // A dip peaks just short of opaque: under a fully opaque pane the browser
  // stops rasterising what is beneath it, and would do all that work on the
  // first frame of the reveal instead. At 98.5% nothing shows through.
  const PEAK = 0.985;
  // Every cut lands a touch close and settles back onto its mark. Only ever
  // larger than the frame, so its edges never show.
  const SETTLE = 0.02;
  // (kept in one place so the cut can be tuned from the console)
  const Tune = { fade: 'inOutSine', ease: 'inOutCubic', settle: SETTLE, stable: 3 };
  const DEG   = Math.PI / 180;

  const PAPER  = [243, 241, 235, 1];
  const STONE  = [230, 226, 215, 1];
  const INK    = [28, 24, 19, 1];
  const VELVET = [42, 9, 22, 1];       // the curtain, in shadow
  const LIGHT  = [243, 241, 235, 1];   // the name on the title card
  const GOLD   = [241, 205, 150, 1];   // "One dectet." on the curtain

  // Moments more than one part of the film has to agree on
  const K = {
    lift:   0.3,     // the house lights begin to go down
    fly:    0.55,    // "Dectet" leaves the title...
    land:   3.85,    // ...and lands in the statement
    part:   7.5,     // the curtain parts
    roster: 11.45,   // the ten are in the roster
    split:  14.0,    // the roster parts on the screening room
    pass:   18.2,    // the camera goes on past the recordings
    gather: 22.8,    // the photographs gather into a pile
    press:  24.8,    // the newspaper photograph takes their place
    wash:   29.2,    // ink washes up over the page
  };
  // The curtain's wash down over the photograph: when it starts, how long
  const WASH = [0.5, 2.9];

  // The stretch of a scene that holds to be read. It is never quite still:
  // it drifts a little with the scroll, the way a page would. Where a scene
  // is taller than the frame, the camera travels down it here instead.
  const HOLD = {
    members:      [11.95, 13.9],
    performances: [15.9, 18.1],
    gallery:      [20.6, 22.7],
    featured:     [27.1, 29.1],
  };

  const root = document.documentElement;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ── Easing ──────────────────────────────────────────────────
     Expo curves are normalised so they meet 0 and 1 exactly; a curve
     that stops a hair short leaves a one-pixel jump at the end of a
     scrubbed move. */
  const X10 = 1 - Math.pow(2, -10);
  const E = {
    linear:     x => x,
    inQuad:     x => x * x,
    outQuad:    x => 1 - (1 - x) * (1 - x),
    inOutQuad:  x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2,
    inCubic:    x => x * x * x,
    outCubic:   x => 1 - Math.pow(1 - x, 3),
    inOutCubic: x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
    outQuart:   x => 1 - Math.pow(1 - x, 4),
    inOutQuart: x => x < 0.5 ? 8 * Math.pow(x, 4) : 1 - Math.pow(-2 * x + 2, 4) / 2,
    outQuint:   x => 1 - Math.pow(1 - x, 5),
    inExpo:     x => (Math.pow(2, 10 * x) - 1) / 1023,
    outExpo:    x => (1 - Math.pow(2, -10 * x)) / X10,
    inOutExpo:  x => x < 0.5
      ? (Math.pow(2, 20 * x - 10) - Math.pow(2, -10)) / (2 * X10)
      : 1 - (Math.pow(2, -20 * x + 10) - Math.pow(2, -10)) / (2 * X10),
    inOutSine:  x => -(Math.cos(Math.PI * x) - 1) / 2,
    outSine:    x => Math.sin(x * Math.PI / 2),
  };

  const clamp  = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
  const lerp   = (a, b, u) => a + (b - a) * u;
  const span   = (t, t0, d) => clamp((t - t0) / d);          // 0 → 1 across [t0, t0 + d]
  const mix    = (a, b, u) => typeof a === 'number' ? a + (b - a) * u : a.map((x, i) => x + (b[i] - x) * u);
  const r2 = v => Math.round(v * 100) / 100;
  const r3 = v => Math.round(v * 1000) / 1000;
  const r4 = v => Math.round(v * 10000) / 10000;
  const rgba = c => `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${r3(c[3])})`;

  // Repeatable scatter: the same "random" every build, so every frame is too
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ── Paint ───────────────────────────────────────────────────
     Every style the film writes goes through here. A value is only
     written when it changes, and everything written can be taken back,
     so a rebuild or a hand-back to the static page leaves nothing behind. */
  const Paint = {
    cache: new Map(),
    set(el, prop, value) {
      let c = this.cache.get(el);
      if (!c) this.cache.set(el, c = {});
      if (c[prop] === value) return;
      c[prop] = value;
      if (prop.charCodeAt(0) === 45) el.style.setProperty(prop, value);
      else el.style[prop] = value;
    },
    clear() {
      this.cache.forEach((props, el) => {
        for (const p in props) {
          if (p.charCodeAt(0) === 45) el.style.removeProperty(p);
          else el.style[p] = '';
        }
      });
      this.cache.clear();
    }
  };

  /* ── Tracks ──────────────────────────────────────────────────
     A track is a list of keyframes [beat, value, easing]. The easing
     belongs to the segment that ends on that keyframe. Before the first
     key and after the last, the value holds. */
  function track(frames) {
    return frames.map(([t, v, e]) => ({ t, v, e: E[e || 'linear'] }));
  }
  function sample(k, t) {
    const n = k.length;
    if (t <= k[0].t) return k[0].v;
    if (t >= k[n - 1].t) return k[n - 1].v;
    let i = 1;
    while (k[i].t < t) i++;
    const a = k[i - 1], b = k[i];
    if (b.t === a.t) return b.v;
    return mix(a.v, b.v, b.e((t - a.t) / (b.t - a.t)));
  }

  /* ── The film ────────────────────────────────────────────────
     One timeline. Each element owns a set of channels; rigs are small
     pure functions of the timecode for moves that are easier to state as
     geometry than as keyframes. Rendering the film at a timecode writes
     every element's state for that timecode, nothing more. */
  const MOVE = { x: 1, y: 1, z: 1, xp: 1, yp: 1, s: 1, sx: 1, sy: 1, r: 1, rx: 1, ry: 1 };

  class Film {
    constructor() { this.nodes = []; this.byEl = new Map(); this.rigs = []; this.flats = new Set(); }

    // Something small that only fades (a word in a line) is better
    // repainted than given a layer of its own: a sentence of layers costs
    // more to composite than its words cost to paint.
    flat(el) { this.flats.add(el); }

    key(el, prop, frames) {
      if (!el) return;
      let n = this.byEl.get(el);
      if (!n) { n = { el, ch: {} }; this.byEl.set(el, n); this.nodes.push(n); }
      const k = track(frames);
      n.ch[prop] = n.ch[prop] ? n.ch[prop].concat(k).sort((a, b) => a.t - b.t) : k;
    }

    // A rig only moves inside its window; outside it, it holds the state of
    // the nearest edge. It never simply stops, because an element left where
    // the last frame put it would make the picture depend on how you got there.
    rig(from, to, fn) {
      let last = NaN;
      this.rigs.push(t => {
        const at = clamp(t, from, to);
        if (at === last) return;
        last = at;
        fn(at, t);
      });
    }

    // Anything that moves or fades gets a 3D transform, which gives it its
    // own compositor layer, and is marked will-change so the browser keeps
    // its raster instead of re-rendering it at every sub-pixel offset.
    // Changing it then never repaints anything.
    seal() {
      for (const n of this.nodes) {
        const keys = Object.keys(n.ch);
        n.moves = keys.some(k => MOVE[k]) || (!!n.ch.o && !this.flats.has(n.el));
        n.vars = keys.filter(k => k.charCodeAt(0) === 45);
        if (n.moves) Paint.set(n.el, 'willChange', 'transform');
      }
    }

    render(t) {
      for (const n of this.nodes) {
        const c = n.ch, v = {};
        for (const p in c) v[p] = sample(c[p], t);
        if (n.moves) Paint.set(n.el, 'transform', transform(v));
        if (c.o) Paint.set(n.el, 'opacity', String(r3(v.o)));
        if (c.color) Paint.set(n.el, 'color', rgba(v.color));
        if (c.bg) Paint.set(n.el, 'backgroundColor', rgba(v.bg));
        for (const p of n.vars) Paint.set(n.el, p, String(r4(v[p])));
      }
      for (const fn of this.rigs) fn(t);
    }
  }

  function transform(v) {
    let s = `translate3d(${r2(v.x || 0)}px, ${r2(v.y || 0)}px, ${r2(v.z || 0)}px)`;
    if (v.xp || v.yp) s += ` translate(${r2(v.xp || 0)}%, ${r2(v.yp || 0)}%)`;
    if (v.rx) s += ` rotateX(${r2(v.rx)}deg)`;
    if (v.ry) s += ` rotateY(${r2(v.ry)}deg)`;
    if (v.r)  s += ` rotate(${r2(v.r)}deg)`;
    const k = v.s === undefined ? 1 : v.s;
    const sx = (v.sx === undefined ? 1 : v.sx) * k;
    const sy = (v.sy === undefined ? 1 : v.sy) * k;
    if (sx !== 1 || sy !== 1) s += ` scale(${r4(sx)}, ${r4(sy)})`;
    return s;
  }

  /* ═══════════════════════════════════════════════════════════════
     STAGE — the few extra layers the film needs. All decorative, all
     hidden from assistive technology; the page's own content is left
     where it is and simply staged. Everything added or rewritten here
     is put back by teardown().
  ═══════════════════════════════════════════════════════════════ */
  const hidden = () => ({ 'aria-hidden': 'true' });

  const Stage = {
    saved: [],
    added: [],
    unwrap: [],

    make(tag, cls, parent, attrs) {
      const el = document.createElement(tag);
      if (cls) el.className = cls;
      if (attrs) for (const a in attrs) el.setAttribute(a, attrs[a]);
      if (parent) parent.appendChild(el);
      this.added.push(el);
      return el;
    },

    // remember an element's markup before the film rewrites it
    keep(el) { if (el && !this.saved.some(s => s[0] === el)) this.saved.push([el, el.innerHTML]); },

    build() {
      const stage = this.el = $('.reel-stage');
      this.footer = $('footer');
      this.ground = this.make('div', 'reel-ground', stage, hidden());

      this.buildStatement();
      this.buildHero();
      this.buildEnsemble();
      this.buildRoster();
      this.buildGallery();
      this.buildContact();

      // While the film moves, a clear pane sits over it: the cursor stays still
      // while the picture slides beneath it, and it should not set off every
      // hover effect it passes. The pane lifts the moment the film stops.
      this.shield = this.make('div', 'reel-shield', document.body, hidden());
      // The pane a navigation cut dips into (see Play.cutTo)
      this.cut = this.make('div', 'reel-cut', document.body, hidden());

      this.titles = {};
      for (const h of $$('.reel-stage .section-title')) this.titles[h.closest('section').id] = riser(h);
      this.headline = riser($('.featured-headline'));
      this.email = riser($('.contact-value'));
    },

    // The title's own word travels into the message. It remains the same
    // visible element until the entire message leaves the curtain.
    buildHero() {
      const [dev, dec] = $$('.hero-title .word');
      this.heroWords = { dev, dec };
      this.fly = { el: dec };
    },

    // The statement is set on the house curtain, and the curtain parts down
    // the middle. So there are two of it: the page's own, showing its left
    // half, and a copy for the right half, hidden from assistive technology.
    buildStatement() {
      const sec = $('.statement');
      const box = $('.container', sec);
      const p = $('.statement-text', box);
      this.keep(p);
      // the house lights going down on the photograph, ahead of the curtain
      this.dim = this.make('div', 'st-dim', null, hidden());
      sec.insertBefore(this.dim, sec.firstChild);
      const em = $('em', p);
      if (em) {
        const lead = document.createElement('span');
        const l1 = document.createElement('span');
        const l2 = document.createElement('span');
        const body = document.createElement('span');
        lead.className = 'st-lead';
        l1.className = l2.className = 'st-l';
        body.className = 'st-body';
        let seen = false;
        for (const n of Array.from(p.childNodes)) {
          if (n === em) { seen = true; l2.appendChild(n); }
          else (seen ? body : l1).appendChild(n);
        }
        // line one rises as one
        const r1 = document.createElement('span');
        r1.className = 'st-r';
        r1.textContent = l1.textContent.trim();
        l1.textContent = '';
        l1.appendChild(r1);
        // line two: its first word rises, "Dectet" is where the title's word
        // lands, and the full stop drops in once it has. (The space goes with
        // the word, so nothing selectable is left between unseen words.)
        const m = em.textContent.match(/^(\s*)(.*?)(\s+)(\S*?)(\W*)$/);
        if (m && m[4]) {
          em.textContent = '';
          const one = document.createElement('span');
          one.className = 'st-r st-one';
          one.textContent = m[2];
          const word = document.createElement('span');
          word.className = 'st-word';
          word.textContent = ' ' + m[4];
          const stop = document.createElement('span');
          stop.className = 'st-r st-stop';
          stop.textContent = m[5];
          em.append(one, word, stop);
        }
        const first = body.firstChild;
        if (first && first.nodeType === 3) first.nodeValue = first.nodeValue.replace(/^\s+/, '');
        lead.append(l1, document.createTextNode(' '), l2);
        p.textContent = '';
        p.append(lead, document.createTextNode(' '), body);
        splitWords(body, 'st-w');
      }
      // the curtain, behind a soft edge that washes down over the photograph
      const wash = this.make('div', 'st-wash', null, hidden());
      // (drawn straight into the frame: an image would first have to be
      // encoded, which costs more than making the curtain does)
      this.make('canvas', 'st-curtain', wash);
      box.insertBefore(wash, box.firstChild);
      const copy = box.cloneNode(true);
      copy.classList.add('st-copy');
      copy.setAttribute('aria-hidden', 'true');
      $$('[id]', copy).forEach(n => n.removeAttribute('id'));
      sec.appendChild(copy);
      this.added.push(copy);
      this.st = [box, copy].map(c => ({
        box: c,
        text: $('.statement-text', c),
        wash: $('.st-wash', c),
        curtain: $('.st-curtain', c),
        rises: $$('.st-r', c),
        word: $('.st-word', c),
        words: $$('.st-w', c),
      }));
    },

    // The ten pieces of the photograph, each with a player on its back
    buildEnsemble() {
      const sec = $('#members');
      this.ens = this.make('div', 'ens', sec, hidden());
      this.ensRig = this.make('div', 'ens-rig', this.ens);
      this.ensPhoto = this.make('img', 'ens-photo', this.ensRig, { alt: '', src: 'images/holiday.jpg' });
      this.ensCards = $$('.member-card').map(card => {
        const el = this.make('div', 'ens-card', this.ensRig);
        const front = this.make('div', 'ens-face ens-front', el);
        const fimg = this.make('img', null, front, { alt: '', src: 'images/holiday.jpg' });
        const back = this.make('div', 'ens-face ens-back', el);
        const src = $('.member-photo img', card);
        const bimg = this.make('img', null, back, { alt: '', src: src ? src.getAttribute('src') : '' });
        return { el, front, fimg, back, bimg };
      });
    },

    // The roster's page, in two halves, so it can part like a curtain
    buildRoster() {
      const sec = $('#members');
      this.halfTop = this.make('div', 'm-half m-half--top', null, hidden());
      this.halfBottom = this.make('div', 'm-half m-half--bottom', null, hidden());
      sec.insertBefore(this.halfBottom, sec.firstChild);
      sec.insertBefore(this.halfTop, sec.firstChild);
    },

    // The light that comes up in the room as the photographs arrive: a
    // small soft disc, scaled out from behind them until it fills the frame
    buildGallery() {
      const sec = $('#gallery');
      this.light = this.make('div', 'g-light', null, hidden());
      sec.insertBefore(this.light, sec.firstChild);
    },

    // The ink that washes up over the newspaper, and the mask the last
    // page's words are written in as it rises. (The mask holds the page's
    // own content, so it is not hidden from anyone; teardown takes the
    // content back out of it.)
    buildContact() {
      const sec = $('#contact');
      this.cWash = this.make('div', 'c-wash', null, hidden());
      sec.insertBefore(this.cWash, sec.firstChild);
      const box = $('.container', sec);
      const ink = this.cInk = document.createElement('div');
      ink.className = 'c-ink';
      sec.insertBefore(ink, box);
      ink.appendChild(box);
      this.unwrap.push(() => { sec.insertBefore(box, ink); ink.remove(); });
    },

    teardown() {
      for (const u of this.unwrap) u();
      this.unwrap = [];
      for (const el of this.added) if (el.parentNode) el.parentNode.removeChild(el);
      this.added = [];
      for (const [el, html] of this.saved) el.innerHTML = html;
      this.saved = [];
    }
  };

  // Words that move on their own, each in its own box
  function splitWords(el, cls) {
    const out = [];
    if (!el) return out;
    Stage.keep(el);
    const walk = node => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          let prev = null;
          for (const part of child.textContent.split(/(\s+)/)) {
            if (!part) continue;
            if (/^\s+$/.test(part)) {
              // a space goes with the word before it, so it is only ever
              // seen (or selected) along with that word
              if (prev) prev.textContent += ' ';
              else frag.appendChild(document.createTextNode(' '));
              continue;
            }
            const s = document.createElement('span');
            s.className = cls;
            s.textContent = part;
            frag.appendChild(s);
            out.push(s);
            prev = s;
          }
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      }
    };
    walk(el);
    return out;
  }

  // A heading (or a line) that rises into place from behind its own
  // baseline, the way the name did on the original title card. The words
  // are not split, so it reads exactly as it did.
  function riser(h) {
    if (!h) return null;
    Stage.keep(h);
    const s = document.createElement('span');
    s.className = 'rise';
    while (h.firstChild) s.appendChild(h.firstChild);
    h.appendChild(s);
    return { h, el: s };
  }

  /* ═══════════════════════════════════════════════════════════════
     PICTURES — made once, from the photograph already on the page
  ═══════════════════════════════════════════════════════════════ */

  // The house grade (--grade in styles.css), for the curtain made from it
  const GRADE = { sat: 0.76, con: 1.04, sep: 0.06, bri: 0.94 };
  function gradeRGB(r, g, b) {
    const s = GRADE.sat;
    let R = (0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b;
    let G = (0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b;
    let B = (0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b;
    const k = GRADE.con, o = 0.5 * (1 - k);
    R = clamp(R * k + o); G = clamp(G * k + o); B = clamp(B * k + o);
    const a = GRADE.sep, n = 1 - a;
    const R2 = clamp((0.393 + 0.607 * n) * R + (0.769 - 0.769 * n) * G + (0.189 - 0.189 * n) * B);
    const G2 = clamp((0.349 - 0.349 * n) * R + (0.686 + 0.314 * n) * G + (0.168 - 0.168 * n) * B);
    const B2 = clamp((0.272 - 0.272 * n) * R + (0.534 - 0.534 * n) * G + (0.131 + 0.869 * n) * B);
    return [R2 * GRADE.bri, G2 * GRADE.bri, B2 * GRADE.bri];
  }

  // The house curtain, taken from the photograph itself: the folds above
  // the players, averaged down their length so only the velvet is left,
  // then drawn out to fill the frame and lit from above.
  async function curtainFrom(img) {
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const sx = Math.round(iw * 0.41), sw = Math.round(iw * 0.36), sh = Math.round(ih * 0.18);
    const src = document.createElement('canvas');
    src.width = sw; src.height = sh;
    const sc = src.getContext('2d', { willReadFrequently: true });
    sc.drawImage(img, sx, 0, sw, sh, 0, 0, sw, sh);
    let px;
    try { px = sc.getImageData(0, 0, sw, sh).data; } catch (e) { return null; }
    const band = (y0, y1) => {
      const out = new Float32Array(sw * 3);
      for (let x = 0; x < sw; x++) {
        let r = 0, g = 0, b = 0;
        for (let y = y0; y < y1; y++) { const i = (y * sw + x) * 4; r += px[i]; g += px[i + 1]; b += px[i + 2]; }
        const n = (y1 - y0) * 255;
        out[x * 3] = r / n; out[x * 3 + 1] = g / n; out[x * 3 + 2] = b / n;
      }
      return out;
    };
    const top = band(0, sh >> 1), bot = band(sh >> 1, sh);
    const W = 1600, H = 1000;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    // Each column's colour at the top and foot of the folds, graded once
    // (the grade is all but linear over the velvet's colours, so grading
    // the two ends and blending between them is the same picture, at a
    // fraction of the work: the curtain is then made in a few milliseconds)
    const cols = new Float32Array(W * 6);
    for (let X = 0; X < W; X++) {
      const f = X / (W - 1) * (sw - 1), i = Math.floor(f), k = f - i, j = Math.min(sw - 1, i + 1);
      for (let e = 0; e < 2; e++) {
        const p = e ? bot : top;
        const g = gradeRGB(p[i * 3] * (1 - k) + p[j * 3] * k, p[i * 3 + 1] * (1 - k) + p[j * 3 + 1] * k, p[i * 3 + 2] * (1 - k) + p[j * 3 + 2] * k);
        cols[X * 6 + e * 3] = g[0]; cols[X * 6 + e * 3 + 1] = g[1]; cols[X * 6 + e * 3 + 2] = g[2];
      }
    }
    // the folds' shading, deepened a little: the photograph is lit flat
    const pic = x.createImageData(W, H), d = pic.data;
    for (let y = 0; y < H; y++) {
      const v = y / (H - 1), dy = (y + H * 0.2) / (H * 1.3);
      for (let X = 0, o = y * W * 4; X < W; X++, o += 4) {
        const dx = (X - W / 2) / (W * 0.8);
        const lit = clamp(1.28 - 0.8 * Math.sqrt(dx * dx + dy * dy), 0.3, 1.25);
        const q = X * 6;
        d[o] = clamp((cols[q] + (cols[q + 3] - cols[q]) * v) * lit * 1.12) * 255;
        d[o + 1] = clamp((cols[q + 1] + (cols[q + 4] - cols[q + 1]) * v) * lit) * 255;
        d[o + 2] = clamp((cols[q + 2] + (cols[q + 5] - cols[q + 2]) * v) * lit * 1.02) * 255;
        d[o + 3] = 255;
      }
    }
    x.putImageData(pic, 0, 0);
    return c;
  }

  /* ═══════════════════════════════════════════════════════════════
     LAYOUT — the rest positions. Each scene is composed to sit inside
     one frame; where the original section is taller than the frame, the
     scene is fitted, and where fitting would make it too small, the
     camera travels down it instead, while it holds.
  ═══════════════════════════════════════════════════════════════ */
  function px(v) { return parseFloat(v) || 0; }

  function frameOf() {
    const stage = Stage.el;
    const W = stage.clientWidth, H = stage.clientHeight;
    // the part of the frame a phone's toolbar can never cover
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;top:0;left:0;width:0;height:100vh;height:100svh;visibility:hidden';
    stage.appendChild(probe);
    const Hs = Math.min(H, probe.offsetHeight || H);
    stage.removeChild(probe);
    // a scene's padding already carries the header clearance, the bottom
    // margin and the toolbar allowance, resolved to pixels
    const cs = getComputedStyle($('#members'));
    return {
      W, H, Hs,
      top: px(cs.paddingTop),
      bottom: H - px(cs.paddingBottom),
      narrow: W <= 780,
      tall: W < H * 0.9,
    };
  }

  // A scene that fits is set in the middle of the band of the frame it is
  // seen in: never nearer the top than the header's clearance, never past
  // `limit`. A scene that drifts while it holds is centred on the middle
  // of its drift. (A scene too tall to fit is left where it starts: the
  // camera travels down it instead.)
  function centre(F, box, band, limit, drift) {
    Paint.set(box, '--drop', '0px');
    const r = box.getBoundingClientRect();
    const want = Math.max(F.top, band[0] + (band[1] - band[0] - r.height) / 2 + (drift || 0) / 2);
    const drop = clamp(want - r.top, 0, Math.max(0, limit - r.bottom));
    Paint.set(box, '--drop', `${r2(drop)}px`);
    return drop;
  }

  // Shrink a scene's container until its content fits above `limit`, but
  // never below `minWidth`. Past that point the scene keeps that size and
  // the camera travels down it instead.
  function fitWidth(box, content, limit, minWidth) {
    const pad = px(getComputedStyle(box).paddingLeft) + px(getComputedStyle(box).paddingRight);
    const natural = box.clientWidth - pad;
    const floor = Math.min(natural, Math.round(minWidth));
    let w = natural;
    for (let i = 0; i < 6; i++) {
      const r = content.getBoundingClientRect();
      if (r.bottom <= limit + 0.5) return { fits: true };
      const next = Math.max(floor, Math.floor(w * (limit - r.top) / r.height * 0.995));
      if (next === w) break;
      w = next;
      Paint.set(box, '--fit-w', `${w + pad}px`);
    }
    return { fits: content.getBoundingClientRect().bottom <= limit + 0.5 };
  }

  function layout(F) {
    // Members: the roster as the original lays it out, fitted to the frame
    // while every portrait stays at least 140px wide (on a phone, never
    // shrunk at all)
    const mBox = $('#members .container');
    const roster = $('#members .roster-grid');
    const rcs = getComputedStyle(roster);
    const cols = rcs.gridTemplateColumns.split(' ').filter(Boolean).length;
    const minW = F.narrow ? Infinity : cols * 140 + (cols - 1) * px(rcs.columnGap);
    F.membersFit = fitWidth(mBox, roster, F.bottom, minW).fits;
    F.membersTravel = F.membersFit ? 0 : Math.max(0, roster.getBoundingClientRect().bottom - F.bottom);

    layPerf(F);
    layGallery(F);
    layFeatured(F);
    layStatement(F);
    layContact(F);

    // The photograph as the opening frames it (cover, 38% down)
    const nat = Stage.photoSize || { w: 730, h: 456 };
    const sc = Math.max(F.W / nat.w, F.H / nat.h);
    F.photo = { w: nat.w * sc, h: nat.h * sc };
    F.photo.x = (F.W - F.photo.w) / 2;
    F.photo.y = (F.H - F.photo.h) * 0.38;
  }

  // The three recordings, all in view at once: side by side on a wide
  // frame, one under another on a tall one (styles.css decides which).
  function layPerf(F) {
    const box = $('#performances .container');
    const grid = $('#performances .videos-grid');
    const gcs = getComputedStyle(grid);
    const cols = gcs.gridTemplateColumns.split(' ').filter(Boolean).length;
    const minW = cols > 1 ? cols * 240 + (cols - 1) * px(gcs.columnGap) : Infinity;
    F.perfCols = cols;
    F.perfFit = fitWidth(box, box, F.bottom, minW).fits;
    F.perfTravel = F.perfFit ? 0 : Math.max(0, box.getBoundingClientRect().bottom - F.bottom);
    // the heading, the three and their captions, as one composition in the
    // middle of the room (it drifts up a little while it holds)
    if (!F.perfTravel) centre(F, box, [0, F.Hs], F.bottom, F.H * 0.025);
  }

  function layGallery(F) {
    const box = $('#gallery .container');
    const grid = $('#gallery .gallery-grid');
    const rowsEl = $$('.gallery-row', grid);
    const items = $$('.gallery-item', grid);
    const ar = items.map(it => {
      const v = it.style.getPropertyValue('--ar').split('/');
      return parseFloat(v[0]) / parseFloat(v[1]);
    });
    // wide frames take two rows of four; squarer ones the original 3-2-3;
    // phones two across
    const plan = F.W > 1000 || (F.W > 620 && F.W / F.H > 1.3) ? [4, 4] : F.W > 620 ? [3, 2, 3] : [2, 2, 2, 2];
    const colGap = px(getComputedStyle(rowsEl[0]).columnGap) || 16;
    const rowGap = px(getComputedStyle(grid).rowGap) || 24;
    const pad = px(getComputedStyle(box).paddingLeft) * 2;

    const place = cw => {
      let k = 0, y = 0;
      const rows = [];
      for (const n of plan) {
        const idx = items.slice(k, k + n).map((_, j) => k + j);
        const sum = idx.reduce((a, i) => a + ar[i], 0);
        const h = (cw - colGap * (n - 1)) / sum;
        let x = 0;
        for (const i of idx) {
          const w = ar[i] * h;
          Paint.set(items[i], 'left', `${r2(x)}px`);
          Paint.set(items[i], 'width', `${r2(w)}px`);
          x += w + colGap;
        }
        rows.push(idx);
        k += n;
      }
      // captions can wrap, so each row is as tall as its tallest plate
      for (const idx of rows) {
        let tall = 0;
        for (const i of idx) { Paint.set(items[i], 'top', `${r2(y)}px`); tall = Math.max(tall, items[i].offsetHeight); }
        y += tall + rowGap;
      }
      const h = Math.max(0, y - rowGap);
      Paint.set(grid, '--grid-h', `${r2(h)}px`);
      return h;
    };

    // Fit the plates to the frame, down to a floor; below it (a phone) they
    // keep a size a caption can sit under, and the camera travels instead.
    Paint.set(box, '--fit-w', '');
    const natural = box.clientWidth - pad;
    const floor = natural * (F.narrow || F.H < 560 ? 0.9 : 0.5);
    let cw = natural;
    for (let i = 0; i < 5; i++) {
      place(cw);
      const r = grid.getBoundingClientRect();
      if (r.bottom <= F.bottom + 0.5) break;
      const next = Math.max(floor, Math.floor(cw * (F.bottom - r.top) / r.height * 0.995));
      if (next === cw) break;
      cw = next;
      Paint.set(box, '--fit-w', `${cw + pad}px`);
    }
    place(cw);
    F.galleryTravel = Math.max(0, grid.getBoundingClientRect().bottom - F.bottom);
    if (!F.galleryTravel) centre(F, box, [0, F.Hs], F.bottom, 0);
  }

  // The newspaper page: fitted to the frame (only ever a short one needs
  // it), and set in the middle of it
  function layFeatured(F) {
    const box = $('#featured .container');
    const fit = fitWidth(box, box, F.bottom, F.narrow ? Infinity : Math.min(560, box.clientWidth)).fits;
    if (fit) centre(F, box, [0, F.Hs], F.bottom, F.H * 0.02);
  }

  // The curtain behind its wash: drawn a little larger than the frame, in a
  // box that reaches a soft edge's length further down. The edge is a mask
  // that only ever moves with the box (the curtain is moved back against
  // it), so the wash costs no painting at all.
  function layStatement(F) {
    const { W, H } = F;
    const edge = Math.round(H * 0.65);
    F.washEdge = edge;
    const ch = r2(H * 1.24);
    const mask = `linear-gradient(to bottom, #000 0px, #000 ${ch}px, rgba(0, 0, 0, 0) ${r2(ch + edge)}px)`;
    for (const h of Stage.st) {
      for (const [k, v] of [['left', -W * 0.12], ['top', -H * 0.12], ['width', W * 1.24], ['height', H * 1.24 + edge]]) Paint.set(h.wash, k, `${r2(v)}px`);
      Paint.set(h.wash, 'maskImage', mask);
      Paint.set(h.wash, 'webkitMaskImage', mask);
      Paint.set(h.curtain, 'width', `${r2(W * 1.24)}px`);
      Paint.set(h.curtain, 'height', `${ch}px`);
      // Each line of the lead is a mask its words rise into, and it ends
      // just under the line's baseline: a word rises from behind its own
      // line, and the line above never reaches down into the one below,
      // where the travelling word is coming in to land. (The lead has no
      // descenders to leave room for.)
      for (const l of $$('.st-l', h.box)) {
        const r = l.getBoundingClientRect(), size = px(getComputedStyle(l).fontSize);
        Paint.set(l, 'clipPath', `inset(-0.35em -0.6em ${r2(r.bottom - (baseline(l) + size * 0.05))}px -0.6em)`);
      }
    }
  }

  // The last page: the heading, the invitation and the address, set in the
  // middle of what the frame shows above the footer's rule (which is fixed
  // to the foot of it), with as much ink below them as above
  function layContact(F) {
    const box = $('#contact .container');
    const foot = Stage.footer.getBoundingClientRect().top;
    F.contactDrop = centre(F, box, [0, foot], foot - Math.max(20, F.H * 0.035), 0);
    // and the ink's soft edge, which the words are written in too
    const edge = Math.round(F.H * 0.55);
    F.inkEdge = edge;
    Paint.set(Stage.cWash, 'height', `${r2(F.H + edge * 1.12)}px`);
    Paint.set(Stage.cWash, 'backgroundImage', `linear-gradient(to bottom, rgba(28, 24, 19, 0) 0px, rgb(28, 24, 19) ${edge}px)`);
    // (the words come only where the ink is all but solid behind them, so
    // they never read over the page it is covering)
    const mask = `linear-gradient(to bottom, rgba(0, 0, 0, 0) ${r2(edge * 0.78)}px, #000 ${r2(edge * 1.04)}px)`;
    Paint.set(Stage.cInk, 'height', `${r2(F.H + edge * 1.12)}px`);
    Paint.set(Stage.cInk, 'maskImage', mask);
    Paint.set(Stage.cInk, 'webkitMaskImage', mask);
  }

  /* ═══════════════════════════════════════════════════════════════
     MEASURE — rest positions, read with every film transform cleared
  ═══════════════════════════════════════════════════════════════ */
  function rect(el) { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2, b: r.bottom, r: r.right }; }

  // The y of an element's first baseline: a zero-size inline-block sits on it
  function baseline(el) {
    const probe = document.createElement('span');
    probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline;';
    el.insertBefore(probe, el.firstChild);
    const y = probe.getBoundingClientRect().top;
    el.removeChild(probe);
    return y;
  }

  // About where a line's letters stand: from the height of its capitals to
  // just under its baseline (the box a browser gives a line is far taller)
  function glyphBox(el) {
    const y = baseline(el), size = px(getComputedStyle(el).fontSize);
    return { top: y - size * 0.7, bottom: y + size * 0.04 };
  }

  // Each letter's position as the page itself set it, kerning and all
  function glyphs(el) {
    const cs = getComputedStyle(el);
    const y = baseline(el);
    const out = [];
    const range = document.createRange();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      for (let i = 0; i < node.data.length; i++) {
        const ch = node.data[i];
        if (/\s/.test(ch)) continue;
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const r = range.getBoundingClientRect();
        out.push({ ch, x: r.left, top: r.top, w: r.width });
      }
    }
    return { list: out, size: px(cs.fontSize), ls: (parseFloat(cs.letterSpacing) || 0) / px(cs.fontSize), y };
  }

  /* ═══════════════════════════════════════════════════════════════
     THE CUT
  ═══════════════════════════════════════════════════════════════ */

  // Where each section lives on the timeline. `live` is when it takes the
  // pointer; `at` is where the navigation lands; `from` lights its link.
  const SCENES = [
    { id: 'home',         live: [0, 0.3],                    at: 0,     from: 0 },
    { id: 'members',      live: [K.roster + 0.15, K.split],   at: 11.95, from: K.part },
    { id: 'performances', live: [15.9, K.pass],               at: 16.1,  from: K.split + 0.6 },
    { id: 'gallery',      live: [20.6, K.gather],             at: 20.8,  from: K.pass + 1.1 },
    { id: 'featured',     live: [K.press + 0.93, K.wash],     at: 27.2,  from: K.press + 0.93 },
    { id: 'contact',      live: [K.wash + 1.2, BEATS + 0.01], at: BEATS, from: K.wash + 0.8 },
  ];
  SCENES.forEach(s => { s.at0 = s.at; });

  function cut(F) {
    const f = new Film();
    const { W, H } = F;
    const M = { rides: {} };          // what the playhead needs later

    /* ── Ground: under the photograph, then under each page in turn. A
       change of colour always happens beneath something covering it, or
       slowly, as the camera passes through. ──────────────────────── */
    f.key(Stage.ground, 'bg', [
      [0, INK], [K.part - 0.2, INK], [K.part - 0.19, PAPER],          // behind the curtain, before it parts
      [K.split - 0.01, PAPER], [K.split, INK],                        // behind the two halves of the roster
      [K.pass + 2.19, INK], [K.pass + 2.2, PAPER],                    // under the light, once it fills the frame
      [K.gather + 0.3, PAPER], [K.gather + 1.0, STONE, 'inOutSine'],  // while the photographs gather
      [K.wash + 1.5, STONE], [K.wash + 1.51, INK],                    // under the ink, once it is up
    ]);

    // A heading rises into place from behind its own baseline, and if it is
    // given a time to leave, it sinks back behind it, the way it came. (Out
    // of the top, the clip that leaves room for its ascenders would leave
    // the foot of it showing.) Waiting below, it stands far enough down that
    // even the box a selection paints round it is under the clip.
    const rise = (T, t0, d, out) => {
      if (!T) return;
      const drop = r2(T.h.getBoundingClientRect().height * 1.5);
      const keys = [[t0, drop], [t0 + d, 0, 'outCubic']];
      if (out) keys.push([out, 0], [out + 0.5, drop, 'inCubic']);
      f.key(T.el, 'y', keys);
    };
    // ...or only sinks away, having arrived some other way
    const sink = (T, out) => {
      if (!T) return;
      const drop = r2(T.h.getBoundingClientRect().height * 1.5);
      f.key(T.el, 'y', [[out, 0], [out + 0.5, drop, 'inCubic']]);
    };

    // The hold: the camera travels down a scene taller than the frame, as
    // far as the finger does (the scroll map gives it the scroll for that);
    // a scene that fits drifts a little, so the page never feels stuck.
    const ride = (id, box, travel, drift) => {
      const [a, b] = HOLD[id];
      const move = travel + drift;
      const hold = [[a, 0], [b, -move]];
      if (move > 0) f.key(box, 'y', hold);
      M.rides[id] = { travel, move, box, hold };
    };

    /* ── 1 · The name, and the word that leaves it ──────────── */
    // The foot of the title card steps aside for the first move
    [$('.hero-cta'), $('.hero-place')].forEach((el, i) => {
      f.key(el, 'o', [[0.05 + i * 0.05, 1], [0.45 + i * 0.05, 0, 'inQuad']]);
      f.key(el, 'y', [[0.05 + i * 0.05, 0], [0.5 + i * 0.05, 10, 'inQuad']]);
    });
    const hw = Stage.heroWords;

    // The curtain comes down over the photograph behind a soft edge (§2).
    // "Devils" stays where it is and fades as that edge passes behind it:
    // from when the edge's clear side reaches the top of the word until its
    // opaque side has gone past the foot of it. The curtain takes the word.
    const T0 = -(H * 1.12 + F.washEdge);
    const washT = t => lerp(T0, 0, E.inOutSine(span(t, WASH[0], WASH[1])));
    const opaqueAt = y => {                 // when the curtain's opaque edge is at y
      let a = WASH[0], b = WASH[0] + WASH[1];
      for (let i = 0; i < 32; i++) { const m = (a + b) / 2; if (H * 1.12 + washT(m) < y) a = m; else b = m; }
      return (a + b) / 2;
    };
    const fly = Stage.fly;
    const from = glyphs(hw.dec);
    const target = Stage.st[0].word;
    const to = target ? glyphs(target) : null;
    const P0 = { x: from.list[0].x, y: from.y, size: from.size, ls: from.ls };
    const P1 = to ? { x: to.list[0].x, y: to.y, size: to.size, ls: to.ls } : P0;
    // where the travelling word is at a timecode: its path is set out below
    const last = from.list[from.list.length - 1];
    const W0 = last.x + last.w - P0.x;
    const wordAt = t => {
      const a = E.inOutCubic(span(t, K.fly, K.land - K.fly));
      const s = lerp(P0.size, P1.size, a), x = lerp(P0.x, P1.x, a), y = lerp(P0.y, P1.y, a);
      return { l: x, r: x + W0 * s / P0.size, t: y - s * 0.7, b: y + s * 0.04 };
    };

    const dv = glyphBox(hw.dev);
    let fadeA = opaqueAt(dv.top - F.washEdge), fadeB = Math.max(fadeA + 0.7, opaqueAt(dv.bottom));
    // ...and it is gone before the travelling word could pass through it
    // (on a tall frame the word rises past where it stood)
    // (with room for the italic's lean and the serifs)
    const dvx = rect(hw.dev), gap = P0.size * 0.08;
    for (let t = K.fly; t < fadeB; t += 0.01) {
      const w = wordAt(t);
      if (w.l - gap < dvx.r && w.r + gap > dvx.x && w.t - gap < dv.bottom && w.b + gap > dv.top) {
        fadeB = Math.max(K.lift + 0.5, t - 0.1);
        fadeA = Math.max(K.lift, Math.min(fadeA, fadeB - 0.7));
        break;
      }
    }
    f.key(hw.dev, 'o', [[fadeA, 1], [fadeB, 0, 'inOutSine']]);
    M.devils = [fadeA, fadeB];
    const home = rect(fly.el);
    const inkX = P0.x - home.x, baseY = P0.y - home.y;
    Paint.set(fly.el.parentNode, 'width', `${r2(rect(fly.el.parentNode).w)}px`);
    Paint.set(fly.el, 'transformOrigin', '0 0');
    Paint.set(fly.el, 'willChange', 'transform, opacity');
    M.fly = { from: P0, to: P1 };
    // The word never changes elements. Its first glyph and baseline trace
    // one curve into the message, then it leaves with the rest of the text.
    const exitStart = K.part - 1.2, exitLength = 1.05;
    const messageOut = t => E.inOutSine(span(t, exitStart, exitLength));
    f.rig(0, K.part, t => {
      const a = E.inOutCubic(span(t, K.fly, K.land - K.fly));
      const size = lerp(P0.size, P1.size, a);
      const spacing = lerp(P0.ls, P1.ls, a);
      const x = lerp(P0.x, P1.x, a), yb = lerp(P0.y, P1.y, a);
      const k = size / P0.size, out = messageOut(t);
      Paint.set(fly.el, 'visibility', out < 1 ? '' : 'hidden');
      Paint.set(fly.el, 'opacity', String(r3(1 - out)));
      Paint.set(fly.el, 'letterSpacing', `${r4(spacing)}em`);
      Paint.set(fly.el, 'color', rgba(mix(LIGHT, GOLD, E.inOutSine(span(t, K.land - 1.25, 1.25)))));
      Paint.set(fly.el, 'transform', `translate(${r2(x - home.x - k * inkX)}px, ${r2(yb - home.y - k * baseY - H * 0.022 * out)}px) scale(${r4(k)})`);
    });

    /* ── 2 · The wash, and the statement on the curtain ─────── */
    const halves = Stage.st;
    f.rig(0, K.part, t => {
      const out = messageOut(t), rise = r2(-H * 0.022 * out);
      for (const h of halves) {
        Paint.set(h.text, 'opacity', String(r3(1 - out)));
        Paint.set(h.text, 'transform', `translate(-50%, -53%) translate3d(0, ${rise}px, 0)`);
      }
    });
    // the house lights go down on the stage, ahead of the curtain
    f.key(Stage.dim, 'o', [[K.lift, 0], [2.4, 0.32, 'inOutSine'], [3.6, 0.32], [3.61, 0]]);
    f.key($('.hero-bg'), 'o', [[3.59, 1], [3.6, 0]]);
    // the curtain comes down over the photograph behind a soft edge
    // ...and while the statement holds, the velvet drifts slowly behind the
    // lettering, which stands still: the words are in front of it
    f.rig(0, K.part, t => {
      const T = washT(t), drift = -H * 0.028 * E.inOutSine(span(t, WASH[0] + WASH[1], K.part - WASH[0] - WASH[1]));
      for (const h of halves) {
        Paint.set(h.wash, 'transform', `translate3d(0, ${r2(T)}px, 0)`);
        Paint.set(h.curtain, 'transform', `translate3d(0, ${r2(drift - T)}px, 0)`);
      }
    });
    // Then it parts down the middle: each half slides out and swings a
    // little back into the stage on its outer edge.
    f.rig(0, K.part + 1.6, t => {
      const u = E.inOutCubic(span(t, K.part, 1.5));
      halves.forEach((h, i) => {
        const d = i ? 1 : -1;
        Paint.set(h.box, 'transform', `translate3d(${r2(d * W * 0.6 * u)}px, 0, 0) rotateY(${r2(-d * 10 * u)}deg)`);
        // Until it parts, the curtain is one piece. Its two halves are cut
        // only after the message has cleared the frame.
        if (i === 0) Paint.set(h.box, 'clipPath', t < K.part - 0.1 ? 'none' : '');
        else Paint.set(h.box, 'visibility', t < K.part - 0.1 ? 'hidden' : '');
      });
    });
    // Ten students. One — and the word lands — Dectet, and its full stop.
    // (Each waits low enough that its selection box is under the clip too.)
    halves.forEach(h => {
      const [r1, one, stop] = h.rises;
      if (r1) f.key(r1, 'yp', [[2.9, 145], [3.9, 0, 'outCubic']]);
      if (one) f.key(one, 'yp', [[3.1, 145], [K.land, 0, 'outCubic']]);
      if (stop) f.key(stop, 'yp', [[K.land - 0.05, 145], [K.land + 0.55, 0, 'outCubic']]);
      if (h.word) { f.key(h.word, 'o', [[0, 0], [BEATS, 0]]); f.flat(h.word); }
    });
    // The rest comes up line by line, lit from the left, the way a follow
    // spot finds a row
    const words = halves[0].words;
    let line = -1, lastTop = -1e9;
    const lineOf = words.map(w => {
      const top = Math.round(w.getBoundingClientRect().top);
      if (top > lastTop + 4) { line++; lastTop = top; }
      return line;
    });
    const perLine = Math.min(0.3, 1.2 / Math.max(1, line));
    const bodyR = words.length ? rect(words[0].parentNode) : { x: 0, w: 1 };
    words.forEach((w, i) => {
      const r = rect(w);
      const t0 = 3.95 + perLine * lineOf[i] + 0.4 * clamp((r.x - bodyR.x) / bodyR.w);
      for (const h of halves) { f.key(h.words[i], 'o', [[t0, 0], [t0 + 0.5, 1, 'inOutSine']]); f.flat(h.words[i]); }
    });
    f.key($('.statement'), 'o', [[K.part + 1.5, 1], [K.part + 1.51, 0]]);

    /* ── 3 · The stage breaks into the ten ──────────────────── */
    const mSec = $('#members');
    const mBox = $('.container', mSec);
    const mHead = $('.section-header', mSec);
    const cards = $$('.member-card').map((el, i) => ({
      el, i,
      photo: $('.member-photo', el),
      name: $('.member-info h3', el),
      meta: $('.member-info p', el),
    }));
    cards.forEach(c => { c.r = rect(c.photo); c.box = rect(c.el); });
    const lefts = [...new Set(cards.map(c => Math.round(c.r.x)))].sort((a, b) => a - b);
    cards.forEach(c => { c.col = lefts.findIndex(l => Math.abs(l - Math.round(c.r.x)) < 2); });
    const byCol = cards.slice().sort((a, b) => a.col - b.col || a.r.y - b.r.y);

    // The photograph behind the curtain, framed as the opening framed it,
    // then cut into ten: five by two on a wide frame, two by five on a tall one
    const P = F.photo;
    const bc = F.tall ? 2 : 5, br = F.tall ? 5 : 2;
    for (const [k, v] of [['left', P.x], ['top', P.y], ['width', P.w], ['height', P.h]]) Paint.set(Stage.ensPhoto, k, `${r2(v)}px`);
    // they turn from the middle outward, like a chord opening, so the
    // picture stays balanced while it changes
    const mid = (bc - 1) / 2, midR = (br - 1) / 2;
    const order = byCol.map((c, k) => k).sort((a, b) => {
      const da = Math.abs(Math.floor(a / br) - mid) * 2 + Math.abs(a % br - midR) * 0.5;
      const db = Math.abs(Math.floor(b / br) - mid) * 2 + Math.abs(b % br - midR) * 0.5;
      return da - db || a - b;
    });
    const T1 = K.part + 1.55;
    const pieces = byCol.map((c, k) => {
      const col = Math.floor(k / br), row = k % br;
      const x0 = Math.round(col * W / bc), x1 = Math.round((col + 1) * W / bc);
      const y0 = Math.round(row * H / br), y1 = Math.round((row + 1) * H / br);
      const cell = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      const e = Stage.ensCards[c.i];
      const face = (el, w, h) => {
        Paint.set(el, 'width', `${r2(w)}px`); Paint.set(el, 'height', `${r2(h)}px`);
        Paint.set(el, 'left', `${r2(-w / 2)}px`); Paint.set(el, 'top', `${r2(-h / 2)}px`);
      };
      // A player turns out of a piece at about the piece's size, and shrinks
      // to the roster's on the way to his place: the portrait is made that
      // much larger, and the whole card is scaled down as it travels.
      const kb2 = Math.max(1, cell.h * 0.8 / c.r.h);
      face(e.front, cell.w, cell.h);
      face(e.back, c.r.w * kb2, c.r.h * kb2);
      for (const [k2, v] of [['left', P.x - cell.x], ['top', P.y - cell.y], ['width', P.w], ['height', P.h]]) Paint.set(e.fimg, k2, `${r2(v)}px`);
      return { e, k, kb: kb2, cx: cell.x + cell.w / 2, cy: cell.y + cell.h / 2, tx: c.r.cx, ty: c.r.cy, tau: T1 + 0.07 * order.indexOf(k) };
    });
    // Crack, turn, land. Each piece turns over once, lifting a little as it
    // goes, on its way to its place; the picture never tilts as a whole.
    f.rig(K.part - 0.1, K.roster + 0.1, t => {
      Paint.set(Stage.ensPhoto, 'opacity', String(r3(1 - E.inOutSine(span(t, K.part + 1.05, 0.5)))));
      const gap = lerp(1, 0.955, E.inOutCubic(span(t, K.part + 0.95, 0.6)));
      for (const p of pieces) {
        const a = E.inOutCubic(span(t, p.tau, 1.75));
        const turn = E.inOutCubic(span(t, p.tau, 1.05));
        const x = lerp(p.cx, p.tx, a), y = lerp(p.cy, p.ty, a);
        Paint.set(p.e.el, 'transform',
          `translate3d(${r2(x)}px, ${r2(y)}px, ${r2(70 * Math.sin(Math.PI * turn))}px) ` +
          `rotateY(${r2(180 * turn)}deg) scale(${r4(lerp(gap, 1 / p.kb, a))})`);
      }
      Paint.set(Stage.ens, 'visibility', t < K.roster ? 'visible' : 'hidden');
    });

    /* ── 4 · The roster ─────────────────────────────────────── */
    cards.forEach(c => {
      f.key(c.photo, 'o', [[K.roster - 0.001, 0], [K.roster, 1]]);
      const t0 = K.roster - 0.3 + 0.04 * c.i;
      f.key(c.name, 'o', [[t0, 0], [t0 + 0.5, 1, 'outQuad']]);
      f.key(c.name, 'y', [[t0, 10], [t0 + 0.8, 0, 'outCubic']]);
      f.key(c.meta, 'o', [[t0 + 0.08, 0], [t0 + 0.58, 1, 'outQuad']]);
      f.key(c.meta, 'y', [[t0 + 0.08, 10], [t0 + 0.88, 0, 'outCubic']]);
    });
    // The heading gathers as the players do: set wide and loose, it draws
    // in to the face's own narrow width as the ten land in their places
    // (its width is the typeface's, not a stretch, so the letters stay true;
    // the heading keeps the room it will end in, so nothing beside it moves)
    const mT = Stage.titles.members;
    if (mT) {
      Paint.set(mT.h, 'width', `${r2(mT.h.getBoundingClientRect().width)}px`);
      f.key(mT.el, 'o', [[K.roster - 1.05, 0], [K.roster - 0.5, 1, 'outQuad']]);
      f.key(mT.el, '--wdth', [[K.roster - 1.05, 100], [K.roster + 0.05, 70, 'inOutCubic']]);
      f.key(mT.el, '--track', [[K.roster - 1.05, 0.07], [K.roster + 0.05, -0.012, 'inOutCubic']]);
    }
    f.key($('.section-subtitle', mSec), 'o', [[K.roster - 0.1, 0], [K.roster + 0.5, 1, 'outQuad']]);
    const mTravel = F.membersTravel || 0, mDrift = mTravel > 0 ? 0 : H * 0.02;
    ride('members', mBox, mTravel, mDrift);

    /* ── 5 · The roster parts like a curtain ────────────────── */
    // Everything above the line rises with the top half of the page,
    // everything below falls with the bottom half, and the screening room
    // is behind them. The line runs through the gap between the rows as
    // they stand at the end of the hold.
    const atEnd = y => y - (mTravel + mDrift);
    const tops = cards.filter(c => atEnd(c.box.cy) < H / 2);
    const bots = cards.filter(c => atEnd(c.box.cy) >= H / 2);
    const lowTop = Math.max(atEnd(rect(mHead).b), ...tops.map(c => atEnd(c.box.b)));
    const highBot = bots.length ? Math.min(...bots.map(c => atEnd(c.box.y))) : H;
    const split = clamp((lowTop + highBot) / 2, H * 0.2, H * 0.8);
    Paint.set(Stage.halfTop, 'height', `${r2(split)}px`);
    Paint.set(Stage.halfBottom, 'top', `${r2(split)}px`);
    const s0 = K.split, s1 = K.split + 1.25;
    const upBy = -(split + H * 0.04), downBy = H - split + H * 0.04;
    f.key(Stage.halfTop, 'y', [[s0, 0], [s1, upBy, 'inOutExpo']]);
    f.key(Stage.halfBottom, 'y', [[s0, 0], [s1, downBy, 'inOutExpo']]);
    for (const half of [Stage.halfTop, Stage.halfBottom]) f.key(half, 'o', [[K.roster - 0.01, 0], [K.roster, 1], [s1 + 0.05, 1], [s1 + 0.06, 0]]);
    f.key(mHead, 'y', [[s0, 0], [s1, upBy, 'inOutExpo']]);
    tops.forEach(c => f.key(c.el, 'y', [[s0, 0], [s1, upBy, 'inOutExpo']]));
    bots.forEach(c => f.key(c.el, 'y', [[s0, 0], [s1, downBy, 'inOutExpo']]));
    f.key(mSec, 'o', [[K.part - 0.01, 0], [K.part, 1], [s1 + 0.05, 1], [s1 + 0.06, 0]]);

    /* ── 6 · The recordings ─────────────────────────────────── */
    const pSec = $('#performances');
    const pBox = $('.container', pSec);
    const pHead = $('.section-header', pSec);
    const cta = $('.yt-cta-wrap', pSec);
    const pTravel = F.perfTravel || 0, pDrift = pTravel > 0 ? 0 : H * 0.025;
    f.key(pSec, 'o', [[K.split - 0.01, 0], [K.split, 1], [K.pass + 1.45, 1], [K.pass + 1.46, 0]]);
    // The heading is projected: a beam crosses the row from the left as
    // the screens come up, and finds the channel at the end of it
    const beam = (el, t0, d) => { if (el) f.key(el, '--beam', [[t0, 0], [t0 + d, 1, 'inOutSine']]); };
    beam(Stage.titles.performances && Stage.titles.performances.el, K.split + 0.4, 0.85);
    // The heading and the channel step back first, before the frames grow
    // into the room they stand in
    beam(cta, K.split + 0.85, 0.6);
    f.key(cta, 'o', [[K.pass - 0.15, 1], [K.pass + 0.25, 0, 'inQuad']]);
    f.key(pHead, 'y', [[K.pass - 0.15, 0], [K.pass + 0.4, -H * 0.05, 'inCubic']]);
    f.key(pHead, 'o', [[K.pass - 0.15, 1], [K.pass + 0.3, 0, 'inQuad']]);
    ride('performances', pBox, pTravel, pDrift);
    // the point the camera travels towards, which the photographs then
    // come out of (§7)
    const V = { x: W / 2, y: F.Hs * 0.5 };
    const pCards = $$('.video-card', pSec).map((el, i) => {
      const r = rect(el);
      return {
        el, i, cx: r.cx, cy: r.cy - pDrift,
        thumb: $('.video-thumb', el), frame: $('.video-thumb-frame', el),
        meta: $('.video-meta', el), play: $('.play-btn', el),
        th: rect($('.video-thumb', el)).h,
      };
    });
    // they go nearest the middle first, then outward, like a chord opening
    pCards.slice().sort((a, b) => Math.hypot(a.cx - V.x, a.cy - V.y) - Math.hypot(b.cx - V.x, b.cy - V.y) || a.i - b.i)
      .forEach((c, r) => { c.rank = r; });
    for (const c of pCards) for (const el of [c.el, c.thumb, c.frame, c.meta, c.play]) Paint.set(el, 'willChange', 'transform, opacity');
    const [h0, h1] = HOLD.performances;
    f.rig(K.split - 0.1, K.pass + 1.5, t => {
      const hold = span(t, h0, h1 - h0);
      // The camera goes on past them in the dark. All three come towards it
      // together, as one picture, scaled about the one point: so they spread
      // apart as they grow and can never cross, or cover one another's
      // captions. Their captions and play marks are let go before they are
      // large; then the frames go, the middle first and then outward.
      const g = 1 + 1.8 * E.inQuad(span(t, K.pass, 1.25));
      const away = E.outQuad(span(t, K.pass - 0.1, 0.4));
      for (const c of pCards) {
        // Each window opens from its centre as the room is revealed. The
        // window is scaled and the still inside it is scaled back, so the
        // still never distorts; it drifts a little inside its window while
        // the room holds.
        const k = E.outCubic(span(t, K.split + 0.35 + 0.16 * c.i, 1.1));
        const open = lerp(0.6, 1, k);
        Paint.set(c.thumb, 'transform', `translate3d(0, 0, 0) scale(${r4(open)}, 1)`);
        Paint.set(c.thumb, 'opacity', String(r3(clamp(k * 3))));
        Paint.set(c.frame, 'transform', `translate3d(0, ${r2(lerp(1, -1, hold) * c.th * 0.04)}px, 0) scale(${r4(1.1 / open)}, 1.1)`);
        Paint.set(c.meta, 'transform', `translate3d(0, ${r2(14 * (1 - k))}px, 0)`);
        Paint.set(c.meta, 'opacity', String(r3(clamp(k * 1.4 - 0.3) * (1 - away))));
        const pop = E.outCubic(span(t, K.split + 0.8 + 0.16 * c.i, 0.7));
        Paint.set(c.play, 'transform', `translate(-50%, -50%) scale(${r4(lerp(0.5, 1, pop) / open)}, ${r4(lerp(0.5, 1, pop))})`);
        Paint.set(c.play, 'opacity', String(r3(clamp(pop * 2) * (1 - away))));
        Paint.set(c.el, 'transform', `translate3d(${r2((c.cx - V.x) * (g - 1))}px, ${r2((c.cy - V.y) * (g - 1))}px, 0) scale(${r4(g)})`);
        Paint.set(c.el, 'opacity', String(r3(1 - E.inOutSine(span(t, K.pass + 0.4 + 0.14 * c.rank, 0.55)))));
      }
    });

    /* ── 7 · The photographs, out of depth ──────────────────── */
    const gSec = $('#gallery');
    const gBox = $('.container', gSec);
    const gItems = $$('.gallery-item', gSec);
    const fImg = $('.featured-img-link');
    const fR = rect(fImg);
    const gTravel = F.galleryTravel || 0;
    ride('gallery', gBox, gTravel, 0);
    f.key(gSec, 'o', [[K.pass + 0.69, 0], [K.pass + 0.7, 1], [K.press + 0.9, 1], [K.press + 0.91, 0]]);
    // The heading sinks away just before the photographs gather, and is
    // gone well before the newspaper's comes down on them
    // The heading has no entrance of its own: it is ink, in the dark room,
    // and the light coming up from behind the photographs finds it. It
    // sinks away behind its baseline just before they gather.
    sink(Stage.titles.gallery, K.gather - 0.15);
    // The lights come up from behind the photographs as they arrive, a
    // soft disc of paper opening out from where they come from
    const LD = 512, reach = 2 * Math.hypot(Math.max(V.x, W - V.x), Math.max(V.y, H - V.y)) / 0.56 / LD;
    Paint.set(Stage.light, 'left', `${r2(V.x - LD / 2)}px`);
    Paint.set(Stage.light, 'top', `${r2(V.y - LD / 2)}px`);
    f.key(Stage.light, 's', [[K.pass + 1.1, 0.04], [K.pass + 2.2, reach, 'inOutSine']]);
    f.key(Stage.light, 'o', [[K.pass + 1.09, 0], [K.pass + 1.1, 1], [K.pass + 2.2, 1], [K.pass + 2.21, 0]]);
    const rand = rng(10);
    const plates = gItems.map((el, k) => {
      const photo = $('.gallery-photo', el);
      const r = rect(photo);
      Paint.set(photo, 'transformOrigin', `${r2(V.x - r.x)}px ${r2(V.y - r.y)}px`);
      Paint.set(photo, 'willChange', 'transform, opacity');
      return {
        photo, venue: $('.gallery-venue', el), k,
        cx: r.cx, cy: r.cy,
        // where it lies in the pile: about as large as the newspaper's
        // photograph, squared up to within a few degrees
        ts: fR.w * lerp(0.82, 0.95, rand()) / r.w,
        tr: lerp(-4, 4, rand()),
        tx: fR.cx + lerp(-0.03, 0.03, rand()) * fR.w,
        // (a phone's camera has travelled down the plates by then)
        ty: fR.cy + lerp(-0.035, 0.035, rand()) * fR.h + gTravel,
        t0: K.pass + 0.75 + 0.07 * k,
      };
    });
    const [g0, g1] = HOLD.gallery;
    f.rig(K.pass + 0.7, K.press + 0.91, t => {
      // while they hold, the wall of photographs is slowly pushed into
      const push = gTravel ? 1 : lerp(1, 1.03, E.inOutSine(span(t, g0, g1 - g0)));
      for (const p of plates) {
        const fly = span(t, p.t0, 1.1);
        const z = lerp(-2600, 0, E.outExpo(fly));
        const col = E.inOutCubic(span(t, K.gather + 0.05 * p.k, K.press - K.gather - 0.35));
        const sc = lerp(push, p.ts, col), rot = lerp(0, p.tr, col);
        const cx = lerp(V.x + (p.cx - V.x) * push, p.tx, col), cy = lerp(V.y + (p.cy - V.y) * push, p.ty, col);
        const vx = (p.cx - V.x) * sc, vy = (p.cy - V.y) * sc;
        const cs = Math.cos(rot * DEG), sn = Math.sin(rot * DEG);
        const dx = cx - V.x - (vx * cs - vy * sn);
        const dy = cy - V.y - (vx * sn + vy * cs);
        Paint.set(p.photo, 'transform',
          `perspective(1200px) translate3d(${r2(dx)}px, ${r2(dy)}px, ${r2(z)}px) rotate(${r2(rot)}deg) scale(${r4(sc)})`);
        // The cover lands over the gathered photographs; then they dissolve.
        Paint.set(p.photo, 'opacity', String(r3(clamp(fly * 5) * (1 - E.inOutSine(span(t, K.press + 0.5, 0.4))))));
      }
    });
    // the captions are let go with it, before their photographs move
    plates.forEach(p => {
      const t0 = p.t0 + 0.95;
      f.key(p.venue, 'o', [[t0, 0], [t0 + 0.5, 1, 'outQuad'], [K.gather - 0.15, 1], [K.gather + 0.15, 0, 'inQuad']]);
      f.key(p.venue, 'y', [[t0, 10], [t0 + 0.7, 0, 'outCubic']]);
    });

    /* ── 8 · The newspaper photograph lands on top ──────────── */
    const fSec = $('#featured');
    const fBox = $('.container', fSec);
    const fMast = $('.featured-masthead', fSec);
    f.key(fSec, 'o', [[K.press - 0.01, 0], [K.press, 1], [K.wash + 1.55, 1], [K.wash + 1.56, 0]]);
    f.key(fImg, 'o', [[K.press, 0], [K.press + 0.45, 1, 'outQuad']]);
    f.key(fImg, 's', [[K.press, 1.12], [K.press + 0.95, 1, 'outExpo']]);
    f.key(fImg, 'r', [[K.press, 2.5], [K.press + 0.95, 0, 'outExpo']]);
    f.key(fImg, 'y', [[K.press, -H * 0.04], [K.press + 0.95, 0, 'outExpo']]);
    // The page is printed. The heading is pressed onto it as the
    // photograph lands, the masthead runs across in one pass, and the
    // headline comes off the roller, from the top line down.
    const fT = Stage.titles.featured;
    if (fT) {
      Paint.set(fT.el, 'transformOrigin', '0 60%');
      f.key(fT.el, 'o', [[K.press + 0.93, 0], [K.press + 1.18, 1, 'outQuad']]);
      f.key(fT.el, 's', [[K.press + 0.93, 1.16], [K.press + 1.25, 1, 'outCubic']]);
    }
    // the masthead and its rules are printed across the page in one pass
    // (before the pass begins it is not there at all: a clip left a sliver
    // of its rules standing at the left edge)
    const t0w = K.press + 1.16, dw = 0.7;
    f.rig(t0w, t0w + dw, t => {
      const u = E.inOutCubic(span(t, t0w, dw));
      Paint.set(fMast, 'visibility', u > 0 ? '' : 'hidden');
      Paint.set(fMast, 'clipPath', u >= 1 ? 'none' : `inset(-12% ${r2((1 - u) * 100)}% -12% -2%)`);
    });
    const hl = Stage.headline;
    if (hl) {
      const t0r = K.press + 1.31, dr = 0.85;
      f.rig(t0r, t0r + dr, t => {
        const u = E.inOutSine(span(t, t0r, dr));
        Paint.set(hl.el, 'visibility', u > 0 ? '' : 'hidden');
        Paint.set(hl.el, 'clipPath', u >= 1 ? 'none' : `inset(-12% -6% ${r2((1 - u) * 112)}% -6%)`);
      });
    }
    // the page drifts as it holds, and lifts away under the ink
    const [f0, f1] = HOLD.featured;
    f.key(fBox, 'y', [[f0, 0], [f1, -H * 0.02], [K.wash + 1.4, -H * 0.08, 'inCubic']]);

    /* ── 9 · Ink washes up; the address ─────────────────────── */
    const cSec = $('#contact');
    const footer = Stage.footer;
    f.key(cSec, 'o', [[K.wash - 0.01, 0], [K.wash, 1]]);
    // The last page is written in the ink as it rises: its words are there
    // wherever the ink has reached, the address first and the heading last
    // (the page's own words, in a mask that moves with the ink; the words
    // are moved back against it, so they stand still while it passes)
    const ink = [[K.wash, H], [K.wash + 1.5, -F.inkEdge * 1.08, 'inOutSine']];
    f.key(Stage.cWash, 'y', ink);
    f.key(Stage.cInk, 'y', ink);
    f.key($('.container', cSec), 'y', ink.map(([t, v, e]) => [t, -v, e]));
    // and the footer's rule comes up under it all, on the film's last beat
    f.key(footer, 'o', [[K.wash + 1.05, 0], [K.wash + 1.65, 1, 'outQuad']]);
    f.key(footer, 'y', [[K.wash + 1.05, 10], [BEATS, 0, 'outCubic']]);

    f.seal();
    return { film: f, M };
  }

  // The ground a cut dips into: the colour that fills the frame it lands on
  function dipColor(t) {
    return rgba(
      t < 3.5 ? INK :
      t < K.part ? VELVET :
      t < K.split + 0.6 ? PAPER :
      t < K.pass + 1.0 ? INK :
      t < K.gather + 0.6 ? PAPER :
      t < K.wash + 0.9 ? STONE : INK);
  }

  /* ═══════════════════════════════════════════════════════════════
     SCROLL MAP — how far the page scrolls for each beat. A beat is the
     same stretch of scroll everywhere, except where the camera travels
     down a scene taller than the frame: there the stretch is longer, so
     the scene moves exactly with the finger instead of outrunning it,
     and the rest of the film is no longer for it.
  ═══════════════════════════════════════════════════════════════ */
  const Scroll = {
    segs: [{ t0: 0, t1: BEATS, y0: 0, k: 1 }],
    total: BEATS,

    build(ppb, rides) {
      const holds = Object.values(rides).filter(r => r.travel > 0).map(r => {
        const a = r.hold[0][0], b = r.hold[r.hold.length - 1][0];
        return { a, b, k: Math.max(ppb, r.move / (b - a)) };
      }).sort((x, y) => x.a - y.a);
      const segs = [];
      let t = 0, y = 0;
      const run = (t1, k) => { if (t1 > t) { segs.push({ t0: t, t1, y0: y, k }); y += (t1 - t) * k; t = t1; } };
      for (const h of holds) { run(h.a, ppb); run(h.b, h.k); }
      run(BEATS, ppb);
      this.segs = segs;
      this.total = y;
    },

    // beats → scroll position, and back
    y(t) {
      t = clamp(t, 0, BEATS);
      for (const s of this.segs) if (t <= s.t1) return s.y0 + (t - s.t0) * s.k;
      return this.total;
    },
    t(y) {
      if (y <= 0) return 0;
      for (const s of this.segs) { const y1 = s.y0 + (s.t1 - s.t0) * s.k; if (y <= y1) return s.t0 + (y - s.y0) / s.k; }
      return BEATS;
    }
  };

  /* ═══════════════════════════════════════════════════════════════
     PLAYHEAD — scroll position in, timecode out
  ═══════════════════════════════════════════════════════════════ */
  // The page around the film hears about its jumps: the header is put away
  // when one lands (script.js), and focus follows it there
  const tell = name => document.dispatchEvent(new CustomEvent(name));

  const Play = {
    t: 0, target: 0, ppb: 1, pageH: Infinity, running: false, last: 0, lastInput: 0, cut: null,
    film: null, M: null, F: null, scene: null,
    seekAnim: null, suspendedAt: 0,

    suspend() {
      if (!this.suspendedAt) this.suspendedAt = performance.now();
    },

    resume() {
      if (!this.suspendedAt) return;
      const now = performance.now(), paused = now - this.suspendedAt;
      this.suspendedAt = 0;
      this.last = this.lastInput = now;
      if (this.cut) {
        this.cut.start += paused;
        if (this.cut.jumped) this.cut.jumped += paused;
        if (this.cut.reveal) this.cut.reveal += paused;
        this.cut.prev = now;
        this.cut.stable = 0;
      }
    },

    // Scroll positions are whole pixels, so the bottom of the page is taken
    // to mean the last frame exactly, never a hair before it.
    readTarget() {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      if (y >= this.pageH - window.innerHeight - 1) return BEATS;
      return clamp(Scroll.t(y), 0, BEATS);
    },

    wake() {
      if (!Reel.active) return;
      this.lastInput = performance.now();
      if (this.running) return;
      this.running = true;
      this.last = performance.now();
      root.classList.add('is-scrubbing');
      requestAnimationFrame(this.tick);
    },

    tick(now) {
      const P = Play;
      if (!Reel.active) { P.running = false; return; }
      if (P.suspendedAt || document.hidden) { requestAnimationFrame(P.tick); return; }
      const dt = clamp((now - P.last) / 1000, 0, 0.05);
      P.last = now;
      P.target = P.readTarget();
      let t = P.t;
      const d = P.target - t;
      if (Math.abs(d) < 0.0015) t = P.target;
      else t += d * (1 - Math.exp(-dt / LAG));
      if (t !== P.t) { P.t = t; P.draw(t); }
      if (t === P.target && now - P.lastInput > 150) {
        P.running = false;
        root.classList.remove('is-scrubbing');
        return;
      }
      requestAnimationFrame(P.tick);
    },

    draw(t) {
      const t0 = Play.stats ? performance.now() : 0;
      Play.film.render(t);
      Play.chrome(t);
      if (Play.stats) Play.stats.push(performance.now() - t0);
      if (Play.tlog) Play.tlog.push(t);
    },

    // Everything around the picture: which scene takes the pointer, which
    // link is lit
    chrome(t) {
      for (const s of SCENES) {
        const live = t >= s.live[0] && t <= s.live[1];
        if (s.isLive !== live) {
          s.isLive = live;
          s.el.classList.toggle('is-live', live);
          if (s.id === 'contact') Stage.footer.classList.toggle('is-live', live);
        }
      }
      // during a cut, the link lit is the one it is going to, from the start
      const at = this.cut ? this.cut.to : t;
      let cur = SCENES[0];
      for (const s of SCENES) if (at >= s.from - 1e-6) cur = s;
      if (cur !== this.scene) {
        this.scene = cur;
        $$('nav ul li a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${cur.id}`));
      }
    },

    // Where a link, the logo or the keyboard sends the playhead. Every jump,
    // however short, is the same cut: racing the film through everything in
    // between would be noise, and a jump without one would be a jolt.
    // A link always cuts, even to where the film already is (`force`): it
    // was asked for, and it lands like any other. Focus moving within the
    // frame only cuts when it has somewhere to go.
    go(beats, force) {
      const to = clamp(beats, 0, BEATS);
      const c = this.cut;
      if (c) {                                // a cut is already under way
        if (!c.jumped) { c.to = to; c.dir = to >= c.from ? 1 : -1; Stage.cut.style.backgroundColor = dipColor(to); this.chrome(this.t); }
        else c.next = to;
        return;
      }
      if (!force && Math.abs(to - this.target) < 0.001 && !this.running) return;
      this.cutTo(to);
    },

    // Scrub the playhead there (tests and the console only; navigation cuts)
    seek(beats, instant) {
      const y = Scroll.y(beats);
      this.cancelSeek();
      if (instant) { window.scrollTo(0, y); return; }
      const y0 = window.scrollY, dist = Math.abs(beats - this.target);
      const dur = clamp(520 + dist * 34, 600, 1500);
      const t0 = performance.now();
      const step = now => {
        const u = clamp((now - t0) / dur);
        window.scrollTo(0, y0 + (y - y0) * E.inOutCubic(u));
        this.seekAnim = u < 1 ? requestAnimationFrame(step) : null;
      };
      this.seekAnim = requestAnimationFrame(step);
    },

    cancelSeek() {
      if (this.seekAnim) cancelAnimationFrame(this.seekAnim);
      this.seekAnim = null;
    },

    /* The cut. The frame dips into the colour of the ground it is cutting
       to (pushing on a little if the camera is going forward); under cover,
       the playhead goes straight to its mark and waits until that frame is
       painted; then the colour lifts and the new frame settles onto its
       mark from a touch too close. The film never runs in between, so you
       land on exactly the frame the scroll bar would show there. */
    cutTo(to) {
      this.cancelSeek();
      const now = performance.now();
      this.cut = { to, from: this.t, dir: to >= this.t ? 1 : -1, k: 0, start: now, prev: now, jumped: 0, reveal: 0 };
      const pane = Stage.cut;
      pane.style.backgroundColor = dipColor(to);
      pane.style.opacity = '0';
      pane.style.visibility = 'visible';
      pane.style.pointerEvents = 'auto';
      this.chrome(this.t);
      requestAnimationFrame(this.cutFrame);
    },

    cutFrame(now) {
      const P = Play, c = P.cut;
      if (!c) return;
      if (P.suspendedAt || document.hidden) { requestAnimationFrame(P.cutFrame); return; }
      let gap = Math.max(0, now - c.prev);
      // A browser can suspend animation frames without delivering blur or
      // visibility events. Treat that missing time as a pause, not progress
      // through the dip: otherwise returning to the tab flashes the cover.
      if (gap > 80) {
        const paused = gap - 16;
        c.start += paused;
        if (c.jumped) c.jumped += paused;
        if (c.reveal) c.reveal += paused;
        c.stable = 0;
        gap = 16;
      }
      c.prev = now;
      if (!c.jumped) {
        // cover: the colour comes up, the old frame keeps travelling
        const u = clamp((now - c.start) / CUT_COVER);
        c.k = E.inOutSine(u);
        Stage.cut.style.opacity = String(r3(c.k * PEAK));
        P.lean(1 + (c.dir > 0 ? 0.025 : 0.01) * E.inQuad(u));
        if (u >= 1) {
          window.scrollTo(0, Scroll.y(c.to));
          P.t = P.target = c.to === BEATS ? BEATS : P.readTarget();
          P.draw(P.t);
          P.lean(1 + Tune.settle);
          c.jumped = now;
          tell('reel:jump');
        }
      } else if (!c.reveal && !(c.stable >= Tune.stable || now - c.jumped > 260)) {
        // Under cover until the browser is keeping time again: three frames in
        // a row on schedule means the new frame is painted and rasterised,
        // so nothing heavy is left to happen while it is being revealed.
        c.stable = gap < 22 ? (c.stable || 0) + 1 : 0;
      } else {
        // reveal: the colour lifts and the new frame settles onto its mark
        if (!c.reveal) { c.reveal = now; P.lastCut = { hold: Math.round(now - c.jumped), capped: !(c.stable >= Tune.stable) }; }
        const u = clamp((now - c.reveal) / CUT_REVEAL);
        // both curves start gently, so the first frames of the reveal (the
        // ones most likely to be late) have almost nothing to show
        Stage.cut.style.opacity = String(r3(PEAK * (1 - E[Tune.fade](u))));
        P.lean(1 + Tune.settle * (1 - E[Tune.ease](u)));
        if (u >= 1) { P.endCut(); return; }
      }
      requestAnimationFrame(P.cutFrame);
    },

    endCut() {
      const c = this.cut;
      if (!c) return;
      this.cut = null;
      Stage.cut.style.opacity = '0';
      Stage.cut.style.visibility = '';
      Stage.cut.style.pointerEvents = '';
      this.lean(1);
      if (!c.jumped) { window.scrollTo(0, Scroll.y(c.to)); this.t = this.target = this.readTarget(); this.draw(this.t); tell('reel:jump'); }
      if (c.next !== undefined) this.go(c.next, true);
      else tell('reel:landed');
    },

    // The whole frame (and the footer, which sits outside it) scaled about
    // the centre of the screen
    lean(s) {
      const v = Math.abs(s - 1) < 1e-4 ? '' : String(r4(s));
      Stage.el.style.scale = v;
      Stage.footer.style.scale = v;
    },

    // When an element is in view, for the keyboard: scenes the camera
    // travels down are searched for the moment it crosses mid-frame.
    timeFor(el) {
      const sec = el.closest('.reel-stage > section, footer');
      if (!sec) return null;
      const s = SCENES.find(x => x.el === sec) || (sec.tagName === 'FOOTER' ? SCENES[SCENES.length - 1] : null);
      if (!s) return null;
      const ride = this.M.rides[s.id];
      if (!ride || !(ride.travel > 0)) return s.at;
      const saved = ride.box.style.transform;
      ride.box.style.transform = 'none';
      const r = el.getBoundingClientRect();
      ride.box.style.transform = saved;
      const cy = r.top + r.height / 2;
      const k = track(ride.hold);
      let a = ride.hold[0][0], b = ride.hold[ride.hold.length - 1][0];
      const want = this.F.H * 0.48;
      for (let i = 0; i < 30; i++) {
        const m = (a + b) / 2;
        if (cy + sample(k, m) > want) a = m; else b = m;
      }
      return clamp((a + b) / 2, s.live[0] + 0.05, s.live[1] - 0.05);
    },

    // Whether an element can be seen and used where the film has it now
    showing(el) {
      const sec = el.closest('.reel-stage > section, footer');
      const s = sec && (SCENES.find(x => x.el === sec) || (sec.tagName === 'FOOTER' ? SCENES[SCENES.length - 1] : null));
      if (!s || this.target < s.live[0] || this.target > s.live[1] || this.cut) return false;
      const r = el.getBoundingClientRect(), F = this.F;
      return r.width > 0 && r.left >= -1 && r.right <= F.W + 1 && r.top >= F.top * 0.5 && r.bottom <= F.H - 4;
    }
  };
  Play.tick = Play.tick.bind(Play);
  Play.cutFrame = Play.cutFrame.bind(Play);

  /* ═══════════════════════════════════════════════════════════════
     BUILD — measure the frame, compose the cut, size the scroll
  ═══════════════════════════════════════════════════════════════ */
  function build() {
    Paint.clear();
    const F = frameOf();
    layout(F);
    const { film, M } = cut(F);

    // Scroll per beat: a fifth of a frame (the scroll map lengthens only the
    // stretches where the camera travels down a scene)
    const ppb = clamp(F.H * 0.2, 150, 230);
    Scroll.build(ppb, M.rides);
    // a scene the camera travels down is arrived at from its top
    for (const s of SCENES) {
      const r = M.rides[s.id];
      s.at = r && r.travel > 0 ? r.hold[0][0] + 0.02 : s.at0;
    }

    Play.film = film;
    Play.M = M;
    Play.F = F;
    Play.ppb = ppb;
    Play.scene = null;
    SCENES.forEach(s => { s.isLive = null; });
    // the footer sits outside the frame, so it leans about the screen's centre too
    Paint.set(Stage.footer, 'willChange', 'transform, scale');
    Paint.set(Stage.footer, 'transformOrigin', `${r2(F.W / 2)}px ${r2(F.H / 2 - (window.innerHeight - Stage.footer.offsetHeight))}px`);
    Play.pageH = Math.ceil(Scroll.total + F.H);
    document.body.style.height = `${Play.pageH}px`;
    Reel.size = { W: F.W, H: F.H };
  }

  function rebuild(keepT) {
    // a resize in the middle of a cut lands the cut first
    const cutting = !!Play.cut;
    if (cutting) { keepT = Play.cut.to; Play.cut.jumped = Play.cut.jumped || 1; Play.endCut(); }
    const t = keepT === undefined ? Play.t : keepT;
    build();
    Play.t = Play.target = t;
    window.scrollTo(0, Scroll.y(t));
    Play.draw(t);
    // the same frame at a new scroll position: not the reader scrolling
    if (Reel.ready) tell(cutting ? 'reel:jump' : 'reel:moved');
  }

  // How long each part of getting ready took (for the curious, and tests)
  const Timings = {};

  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const faces = ['300 100px "Noto Serif Display"', 'italic 300 100px "Noto Serif Display"', '400 100px "Noto Serif Display"', '400 16px "Libre Franklin"', '500 16px "Libre Franklin"'];
    const all = Promise.all(faces.map(f => document.fonts.load(f).catch(() => null)));
    return Promise.race([all, new Promise(r => setTimeout(r, 2500))]);
  }

  // The opening photograph: its proportions, and the curtain taken from it
  function photoReady() {
    return new Promise(resolve => {
      const img = new Image();
      let done = false;
      const finish = async () => {
        if (done) return;
        done = true;
        if (img.naturalWidth) {
          Stage.photoSize = { w: img.naturalWidth, h: img.naturalHeight };
          let curtain = null;
          const t0 = performance.now();
          try { curtain = await curtainFrom(img); } catch (e) { /* no curtain: velvet */ }
          Timings.curtain = Math.round(performance.now() - t0);
          Stage.curtain = curtain;
        }
        resolve();
      };
      img.onload = finish;
      img.onerror = finish;
      img.src = 'images/holiday.jpg';
      setTimeout(finish, 2500);
    });
  }

  // Everything the film will show is fetched and decoded up front, so no
  // frame ever waits on the network.
  function preload() {
    for (const img of $$('.reel-stage img')) {
      if (img.loading === 'lazy') { img.loading = 'eager'; img.dataset.reelLazy = ''; }
      if (img.decode) img.decode().catch(() => {});
    }
  }

  function imagesReady(limit) {
    const pending = $$('.reel-stage img').filter(i => i.src && !i.complete);
    Tuning.expect(pending.length);
    const all = Promise.all(pending.map(i => new Promise(r => {
      const done = () => { Tuning.arrived(); r(); };
      i.addEventListener('load', done, { once: true });
      i.addEventListener('error', done, { once: true });
    })));
    return Promise.race([all, new Promise(r => setTimeout(r, limit))]);
  }

  // The cover is the first thing revealed after the Gallery photographs
  // clear. Decode it before the reel opens so that handoff never exposes an
  // empty image, even when the other gallery images hit their loading cap.
  function coverReady() {
    const img = $('.featured-img');
    if (!img) return Promise.resolve();
    if (img.decode) return img.decode().catch(() => {});
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  }

  function frames(n) {
    return new Promise(resolve => {
      let k = 0;
      const step = () => { if (++k >= n) resolve(); else requestAnimationFrame(step); };
      requestAnimationFrame(step);
      setTimeout(resolve, 50 * n + 50);           // a background tab has no frames
    });
  }

  // One frame of every scene, rendered at half a percent over the opening
  // frame before the film takes over, so the browser has decoded and
  // rasterised every layer before anyone scrubs to it. Without this, each
  // scene's first appearance costs a stall. (The title card is held as it
  // is meanwhile: see html.reel:not(.reel-ready) in styles.css.)
  const WARM = [0.8, 1.6, 2.4, 3.2, 4.4, 5.6, 7.9, 8.6, 9.3, 10.0, 10.8, 12.5, 14.4, 14.9, 15.6, 17.0, 18.5, 18.9,
                19.4, 19.9, 21.4, 22.9, 23.6, 24.3, 24.9, 25.3, 25.8, 26.5, 27.2, 28.3, 29.4, 30.1, 30.6, 31.0];
  async function warm() {
    const t0 = performance.now();
    root.classList.add('reel-warming');
    Tuning.expect(WARM.length);
    for (const t of WARM) {
      Play.film.render(t);
      // Two painted frames are enough to establish each scene's layers;
      // a third pass only lengthens the opening on fast connections.
      await frames(2);
      Tuning.arrived();
    }
    root.classList.remove('reel-warming');
    Timings.warm = Math.round(performance.now() - t0);
  }

  /* ═══════════════════════════════════════════════════════════════
     TUNING — four parallel strings respond to the actual loading work.
     Each arrival plucks a different voice, which settles before the name
     enters. There is no text behind the strings during the preloader.
     On the downbeat the house lights come up. Nothing here is waited for:
     it lasts as long as the loading, and a hand on the scroll ends it.
  ═══════════════════════════════════════════════════════════════ */
  const Tuning = {
    el: null, cv: null, g: null, raf: 0, last: 0, clock: 0,
    amp: 0, voices: [0, 0, 0, 0], damp: 1.5, y: NaN, ty: NaN, W: 0, H: 0, dpr: 1,
    done: 0, total: 1, settled: null,

    start() {
      const el = $('.tuning');
      if (!el || this.cv) return;
      this.el = el;
      this.cv = document.createElement('canvas');
      el.appendChild(this.cv);
      this.g = this.cv.getContext('2d');
      this.size();
      addEventListener('resize', this.size);
      el.classList.add('is-live');
      this.voices = [0.42, 0.85, 1, 0.58].map(k => this.H * 0.01 * k);
      this.amp = Math.max(...this.voices);
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    },

    size() {
      const T = Tuning;
      if (!T.cv) return;
      T.W = innerWidth; T.H = innerHeight;
      T.dpr = Math.min(2, window.devicePixelRatio || 1);
      T.cv.width = Math.round(T.W * T.dpr);
      T.cv.height = Math.round(T.H * T.dpr);
      if (!(T.ty >= 0)) T.ty = T.H / 2;
      if (!(T.y >= 0)) T.y = T.ty;
    },

    expect(n) { this.total += n; },
    arrived() {
      this.done++;
      this.pluck(clamp(1 - this.done / this.total));
    },
    // Real load events touch alternating strings with decreasing force.
    pluck(left) {
      const cap = this.H * 0.014 * (0.2 + 0.8 * left);
      const n = (this.done - 1) % 4;
      this.voices[n] = Math.min(Math.max(this.voices[n], cap * 0.6), cap);
      this.voices[(n + 1) % 4] = Math.min(cap * 0.38, this.voices[(n + 1) % 4] + cap * 0.1);
      this.amp = Math.max(...this.voices);
    },

    frame(now) {
      const T = Tuning;
      if (!T.g) return;
      const dt = clamp((now - T.last) / 1000, 0, 0.05);
      T.last = now;
      T.clock += dt;
      T.voices = T.voices.map((a, i) => a * Math.exp(-dt * T.damp * (1 + i * 0.08)));
      T.amp = Math.max(...T.voices);
      T.y += (T.ty - T.y) * (1 - Math.exp(-dt * 5));
      if (T.settled && T.amp < 0.15 && Math.abs(T.ty - T.y) < 0.3) {
        T.voices = [0, 0, 0, 0]; T.amp = 0; T.y = T.ty;
        const done = T.settled; T.settled = null; done();
      }
      T.draw();
      T.raf = requestAnimationFrame(T.frame);
    },

    // Four standing waves held at the edges, spaced like instrument strings.
    draw() {
      const { g, W, H, dpr, voices, y, clock } = this;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      const spacing = Math.min(25, Math.max(18, H * 0.028));
      const strength = [0.36, 0.6, 0.66, 0.4];
      const n = Math.max(48, Math.round(W / 6));
      for (let string = 0; string < 4; string++) {
        g.beginPath();
        const base = y + (string - 1.5) * spacing;
        const w = 2 * Math.PI * (1.4 + string * 0.18);
        for (let i = 0; i <= n; i++) {
          const u = i / n;
          const d = voices[string] * (Math.sin(Math.PI * u) * Math.cos(w * clock + string * 0.43)
            + 0.22 * Math.sin(2 * Math.PI * u) * Math.cos(2 * w * clock + string * 0.61));
          if (i) g.lineTo(u * W, base + d); else g.moveTo(0, base + d);
        }
        g.lineWidth = 1;
        g.strokeStyle = `rgba(243, 241, 235, ${strength[string]})`;
        g.stroke();
      }
    },

    // In tune: it is damped quickly and rests on its line
    settle(y) {
      if (!this.g) return Promise.resolve();
      if (y >= 0) this.ty = y;
      this.damp = 8;
      return new Promise(r => {
        this.settled = r;
        setTimeout(() => { this.settled = null; r(); }, 220);
      });
    },

    stop() {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      removeEventListener('resize', this.size);
      if (this.cv) this.cv.remove();
      this.cv = this.g = null;
      if (this.el) this.el.classList.remove('is-live');
    },

    /* The downbeat. The line the name stands on rises from behind the
       string (on a narrow frame, where the name is set in two lines, the
       second hangs from it); the house lights come up on the stage, and
       the foot of the card and the bar come in last. */
    reveal() {
      const anims = [];
      const run = (el, frames, o) => { if (el) anims.push(el.animate(frames, Object.assign({ fill: 'backwards' }, o))); };
      const out = 'cubic-bezier(0.16, 1, 0.3, 1)';     // the house style: arrive, don't slide
      const sine = 'cubic-bezier(0.37, 0, 0.63, 1)';
      root.classList.add('reel-overture');
      // the name first, in the dark; then the lights come up round it, and
      // the camera settles on the stage
      run(this.el, [{ opacity: 1 }, { opacity: 0 }], { duration: 560, delay: 170, easing: sine, fill: 'forwards' });
      run($('.hero-bg'), [{ transform: 'scale(1.04)' }, { transform: 'none' }], { duration: 720, delay: 60, easing: out });
      const ys = this.y;
      [Stage.heroWords.dev, Stage.heroWords.dec].forEach((word, i) => {
        const line = word.parentNode, r = line.getBoundingClientRect();
        const size = px(getComputedStyle(word).fontSize), base = baseline(word);
        // (the clip reaches well clear of the letters everywhere but at the
        // string; each word starts just out of sight on its side of it)
        const rises = base <= ys + 1;
        const clip = rises
          ? `inset(-60% -30% ${r2(r.bottom - ys)}px -30%)`
          : `inset(${r2(ys - r.top)}px -30% -60% -30%)`;
        const from = rises ? ys - (base - size * 0.84) : -(base + size * 0.06 - ys);
        const delay = i * 80;
        run(line, [{ clipPath: clip }, { clipPath: clip }], { duration: delay + 620 });
        run(word, [{ transform: `translateY(${r2(from)}px)` }, { transform: 'none' }], { duration: 620, delay, easing: 'cubic-bezier(0.2, 0.85, 0.25, 1)' });
      });
      for (const el of [$('.hero-cta'), $('.hero-place')]) run(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 280, delay: 420, easing: sine });
      run($('#site-header'), [{ opacity: 0 }, { opacity: 1 }], { duration: 280, delay: 450, easing: sine, fill: 'forwards' });

      return new Promise(resolve => {
        let over = false;
        const hands = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
        const end = () => {
          if (over) return;
          over = true;
          hands.forEach(h => removeEventListener(h, cut, true));
          root.classList.add('reel-tuned');
          for (const a of anims) a.cancel();      // the film's own frame takes over
          this.stop();
          resolve();
        };
        const cut = () => { for (const a of anims) a.finish(); end(); };
        hands.forEach(h => addEventListener(h, cut, { capture: true, passive: true }));
        Promise.all(anims.map(a => a.finished.catch(() => {}))).then(end);
      });
    }
  };

  /* ═══════════════════════════════════════════════════════════════
     REEL — public face
  ═══════════════════════════════════════════════════════════════ */
  const Reel = window.Reel = {
    active: false,
    ready: false,
    quiet: false,         // set while the page moves focus itself (script.js)
    size: null,

    async init() {
      if (!root.classList.contains('reel')) return;
      this.active = true;
      try {
        Stage.build();
        SCENES.forEach(s => { s.el = document.getElementById(s.id); });
        Tuning.expect(2);
        Timings.init = Math.round(performance.now());
        await Promise.all([fontsReady().then(() => { Timings.fonts = Math.round(performance.now()); Tuning.arrived(); }), photoReady().then(() => { Timings.photo = Math.round(performance.now()); Tuning.arrived(); })]);
        if (!root.classList.contains('reel')) { this.teardown(); return; }
        for (const c of Stage.st) {
          const src = Stage.curtain;
          if (src) {
            c.curtain.width = src.width;
            c.curtain.height = src.height;
            c.curtain.getContext('2d').drawImage(src, 0, 0);
          } else c.curtain.style.background = rgba(VELVET);
        }
        Stage.curtain = null;
        preload();

        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        const hash = location.hash.slice(1);
        const scene = SCENES.find(s => s.id === hash);
        let start = scene ? scene.at : 0;
        // A reload always starts with the opening frame. Direct links to a
        // scene still work on a new visit, but no prior scroll is restored.
        root.classList.add('reel-on');
        rebuild(0);
        // the string finds the line the name will stand on
        Tuning.ty = baseline(Stage.heroWords.dev);
        Timings.built = Math.round(performance.now());
        await Promise.all([imagesReady(2500), coverReady()]);
        Timings.images = Math.round(performance.now());
        await warm();
        Timings.ready = Math.round(performance.now());
        if (!root.classList.contains('reel')) { this.teardown(); return; }
        Play.t = Play.target = 0;
        Play.draw(0);
        this.listen();
        this.ready = true;
        root.classList.add('reel-ready');
        tell('reel:moved');
        // a link chosen while the film was still getting ready goes now
        if (this.queued !== undefined) start = this.queued;
        this.queued = undefined;
        await Tuning.settle();
        if (start > 0.01) {
          // further in: the dark frame is cut straight to that frame
          Play.go(start, true);
          await new Promise(r => setTimeout(r, CUT_COVER + 60));
          root.classList.add('reel-overture', 'reel-tuned');
          Tuning.stop();
        } else {
          await Tuning.reveal();
        }
        Timings.tuned = Math.round(performance.now());
      } catch (err) {
        console.error('Reel could not start; showing the page instead.', err);
        this.teardown();
      }
    },

    listen() {
      const wake = () => Play.wake();
      addEventListener('scroll', wake, { passive: true });

      // Switching tabs or windows pauses an in-flight cut at its current
      // composition. It resumes on the next visible frame at the same phase.
      // An embedded video can blur the top frame while the document still
      // has focus. That is not a window switch and must not freeze scrolling.
      addEventListener('blur', () => { if (!document.hasFocus()) Play.suspend(); });
      addEventListener('focus', () => { if (!document.hidden) Play.resume(); });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) Play.suspend(); else Play.resume();
      });

      // any hand on the controls takes over from a seek in progress
      const takeOver = () => Play.cancelSeek();
      addEventListener('wheel', takeOver, { passive: true });
      addEventListener('touchstart', takeOver, { passive: true });
      addEventListener('keydown', e => { if (!e.metaKey && !e.ctrlKey) takeOver(); });

      let pending = false, lastW = Reel.size.W, lastH = Reel.size.H;
      const onResize = () => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          if (!Reel.active) return;
          const W = Stage.el.clientWidth, H = Stage.el.clientHeight;
          if (W === lastW && H === lastH) return;
          lastW = W; lastH = H;
          rebuild(Play.target);
        });
      };
      addEventListener('resize', onResize);
      if (document.fonts && document.fonts.addEventListener) {
        document.fonts.addEventListener('loadingdone', () => { if (Reel.active) rebuild(Play.target); });
      }

      // Focus makes the browser bring an element into view, and it will
      // scroll even a frame that hides its overflow to do it. The film
      // decides what is in view, so the frame is put straight back.
      const unscroll = el => {
        for (let n = el; n && n !== document.body; n = n.parentElement) {
          if (n.scrollTop) n.scrollTop = 0;
          if (n.scrollLeft) n.scrollLeft = 0;
          if (n === Stage.el) break;
        }
      };
      Stage.el.addEventListener('scroll', e => unscroll(e.target), true);

      // Keyboard focus finds its scene: tabbing onto something the film is
      // not showing cuts to the moment it is.
      let tabFocus = false;
      document.addEventListener('keydown', e => { tabFocus = e.key === 'Tab' && !e.metaKey && !e.ctrlKey && !e.altKey; }, true);
      document.addEventListener('pointerdown', () => { tabFocus = false; }, true);
      addEventListener('blur', () => { tabFocus = false; });
      document.addEventListener('visibilitychange', () => { if (document.hidden) tabFocus = false; });
      document.addEventListener('focusin', e => {
        if (!Reel.active || !Reel.ready) return;
        const fromTab = tabFocus;
        tabFocus = false;
        const el = e.target;
        if (!el.closest || el.closest('header, .bio-modal, .lightbox, .player')) return;
        unscroll(el);
        // A returning window may restore focus to an offscreen performance
        // card. Only a new Tab press asks the film to follow keyboard focus.
        if (Reel.quiet || !fromTab) return;
        const at = Play.timeFor(el);
        if (at === null || Play.showing(el)) return;
        Play.go(at);
      });

      addEventListener('hashchange', () => {
        const s = SCENES.find(x => x.id === location.hash.slice(1));
        if (s) Play.go(s.at);
      });
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
      const onCalm = e => { if (e.matches) Reel.teardown(); };
      if (calm.addEventListener) calm.addEventListener('change', onCalm);
      else if (calm.addListener) calm.addListener(onCalm);
    },

    // A link's way in. Says whether the film took it.
    go(id) {
      const s = SCENES.find(x => x.id === id);
      if (!s || !this.active) return false;
      if (!this.ready) { this.queued = s.at; return true; }
      Play.go(s.at, true);
      return true;
    },

    // Whether a scene is the one on screen now, and holding (the player
    // asks, to know when the reader has moved on)
    holding(id) {
      const s = SCENES.find(x => x.id === id);
      return !!(s && this.ready && !Play.cut && Play.target >= s.live[0] && Play.target <= s.live[1]);
    },

    // Hand the page back as the static site
    teardown() {
      if (!this.active && !root.classList.contains('reel')) return;
      this.active = false;
      this.ready = false;
      Play.cancelSeek();
      Play.endCut();
      Paint.clear();
      Stage.teardown();
      document.body.style.height = '';
      for (const img of $$('img[data-reel-lazy]')) { img.loading = 'lazy'; delete img.dataset.reelLazy; }
      Tuning.stop();
      root.classList.remove('reel', 'reel-type', 'reel-on', 'reel-ready', 'reel-warming', 'reel-overture', 'reel-tuned', 'is-scrubbing');
      $$('.is-live').forEach(el => el.classList.remove('is-live'));
      window.scrollTo(0, 0);
      document.dispatchEvent(new CustomEvent('reel:off'));
    },

    // For tests and for the curious: render a timecode directly
    debug: {
      beats: BEATS, beat: BEAT, K,
      state: () => ({ t: Play.t, target: Play.target, ppb: Play.ppb, running: Play.running, seeking: !!Play.seekAnim, cutting: !!Play.cut,
        phase: Play.cut ? (Play.cut.jumped ? (Play.cut.reveal ? 'reveal' : 'hold') : 'cover') : null }),
      render: t => { Play.t = Play.target = t; Play.draw(t); },
      seek: (b, instant) => Play.seek(b, instant),
      y: b => Scroll.y(b),
      t: y => Scroll.t(y),
      length: () => Play.pageH,
      scenes: () => SCENES.map(s => ({ id: s.id, at: s.at, live: s.live, from: s.from })),
      holds: () => JSON.parse(JSON.stringify(HOLD)),
      fly: () => Play.M && Play.M.fly,
      devils: () => Play.M && Play.M.devils,
      profile: on => { const s = Play.stats; Play.stats = on ? [] : null; return s; },
      trace: on => { const s = Play.tlog; Play.tlog = on ? [] : null; return s; },
      lastCut: () => Play.lastCut,
      tune: t => Object.assign(Tune, t || {}),
      plan: () => ({ travel: Play.M && Object.fromEntries(Object.entries(Play.M.rides).map(([k, v]) => [k, v.travel])) }),
      timings: () => Object.assign({ sinceStart: Math.round(performance.now()) }, Timings),
      tuning: () => ({ amp: Tuning.amp, y: Tuning.y, ty: Tuning.ty, done: Tuning.done, total: Tuning.total, live: !!Tuning.g }),
    }
  };

  // The string is tuned from the first frame the script can draw
  if (root.classList.contains('reel')) Tuning.start();
})();

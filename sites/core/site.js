/* Client-site runtime.
 *
 * Responsibilities, in order:
 *   1. read the client's config
 *   2. resolve the trade preset and apply it as design tokens
 *   3. scale motion by the preset's intensity, and honour reduced-motion
 *   4. wire the interactions
 *   5. hold the line on what this build will and will not do
 *
 * The important constraint lives in section 5. This is a pitch mock-up: the
 * recipient should be able to feel what the finished site would feel like, and
 * should not be able to walk away with a working one. So nothing here opens a
 * network connection, nothing stores anything, and the contact form is a
 * performance of a form rather than a form.
 */
(() => {
  'use strict';

  document.documentElement.classList.add('js');

  const root = document.documentElement;
  const cfg = window.SITE_CONFIG || {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* A page declares which of the two contracts it is holding to. `mockup` is a
     pitch artifact: unpublishable, unable to reach the network, with invented
     content marked as invented. `studio` is a real site -- indexable, allowed to
     link outward -- and none of the mock-up guards apply to it. Everything below
     that differs between the two branches reads `kind` rather than assuming. */
  const kind = cfg.kind === 'studio' ? 'studio' : 'mockup';
  root.dataset.kind = kind;

  /* ---- 1. trade preset ------------------------------------------------- */
  // Presets are plain CSS files of token overrides. Fetching them means a new
  // trade is one small file, not a new branch.
  const THEME_FILES = {
    plumbing: '../themes/plumbing.css',
    'plumbing-paper': '../themes/plumbing-paper.css',
    roofing: '../themes/roofing.css',
    photography: '../themes/photography.css',
    hvac: '../themes/hvac.css',
    // Gunmetal + caliper red, for the trade none of the others are. Registering
    // it here as well as <link>ing it in the markup is required, not tidy: an
    // unregistered name falls through to THEME_FILES.plumbing below, so the page
    // would ship automotive.css and then have this function inject plumbing.css
    // on top of it half a second later.
    automotive: '../themes/automotive.css',
    // The studio preset is a full theme rather than a trade, so it is not
    // offered in the switcher -- that picker exists to answer "would you make it
    // look like my business", and a designer's own site is not an answer to it.
    studio: '../themes/studio.css',
  };

  let activeTheme = cfg.industry || 'plumbing';

  // A page ships its own theme as a real <link> in the markup, so the first
  // paint is already correct. This function only has to inject when the theme is
  // genuinely absent -- which, before this, was every page load.
  //
  // The first version always built a <link> and awaited it, which meant the page
  // rendered with whatever tokens.css defaults to and then swapped. On a mock-up
  // whose config says `plumbing` that is invisible, because the default *is*
  // plumbing. On the studio page it was not: tokens.css defaults to a dark navy
  // and copper, so every visitor got a dark page with copper buttons that turned
  // cream and black a frame later, and computed styles on already-painted
  // elements kept resolving the old --c-accent well after :root had the new one.
  function applyTheme(name) {
    const file = THEME_FILES[name] || THEME_FILES.plumbing;
    activeTheme = name;
    root.dataset.trade = name;

    const wanted = file.split('/').pop();
    const present = [...document.querySelectorAll('link[data-theme]')].some(
      (l) => (l.getAttribute('href') || '').endsWith(wanted)
    );
    if (present) return Promise.resolve();

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = file;
    link.dataset.theme = name;
    document.head.appendChild(link);
    return new Promise((res) => {
      link.addEventListener('load', res, { once: true });
      link.addEventListener('error', res, { once: true });
    });
  }

  /* ---- 2. motion ------------------------------------------------------- */
  // Read the intensity the preset asked for and bake it into a single scale
  // variable. Every duration in site.css is multiplied by that, so "restrained"
  // is a number in a file rather than a reviewer's opinion.
  function applyMotion() {
    const raw = parseFloat(
      getComputedStyle(root).getPropertyValue('--motion-intensity')
    );
    const intensity = Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 0.6;
    // Reduced motion does not just shorten animations; it removes the ambient
    // loops too, which is where motion hurts people who get motion sick.
    const scale = reduced.matches ? 0.001 : 0.35 + intensity * 1.15;
    root.style.setProperty('--motion-scale', String(scale));
    root.dataset.motion = reduced.matches ? 'off' : intensity.toFixed(2);
    document.querySelectorAll('[data-ambient]').forEach((el) => {
      el.style.animationPlayState = reduced.matches ? 'paused' : 'running';
    });
  }
  reduced.addEventListener?.('change', () => {
    applyMotion();
    io.disconnect();
    observeReveals();
  });

  /* ---- 3. reveal on scroll --------------------------------------------- */
  let io;
  function observeReveals() {
    const els = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window) || reduced.matches) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          io.unobserve(e.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
  }

  // Stagger siblings so a grid arrives as a sequence rather than a slab. The
  // delay is capped, because a twelve-item grid at 80ms each is a 1s wait.
  function stagger(selector, step) {
    document.querySelectorAll(selector).forEach((group) => {
      [...group.children].forEach((child, i) => {
        child.style.setProperty('--d', `${Math.min(i * step, 480)}ms`);
      });
    });
  }

  /* ---- 4. count up ----------------------------------------------------- */
  // Counts from zero once, when first seen. requestAnimationFrame, and it
  // respects reduced motion by writing the final value immediately.
  //
  // Values round throughout rather than only at the end. A plumber's site
  // saying "22.4 HOURS" for a second while the number spins looks broken, and
  // this is exactly the sort of detail that gives away that the animation is
  // decoration sitting on top of the content rather than part of it.
  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    if (!Number.isFinite(target)) return;
    // dataset values are always strings, so this has to test the parsed number.
    // Testing the string directly is always false, which is how "15" ended up
    // rendered as "14.2" while the counter was still running.
    const decimals = Number.isInteger(target) ? 0 : 1;
    const write = (n) => { el.textContent = n.toFixed(decimals); };
    if (reduced.matches) { write(target); return; }
    const dur = 1100;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      write(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
      else write(target); // land exactly, never on a rounded-off near-miss
    };
    requestAnimationFrame(tick);
  }

  function observeCounts() {
    const els = document.querySelectorAll('[data-count]');
    if (!('IntersectionObserver' in window)) {
      els.forEach(countUp);
      return;
    }
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          countUp(e.target);
          cio.unobserve(e.target);
        });
      },
      { threshold: 0.5 }
    );
    els.forEach((el) => cio.observe(el));
  }

  /* ---- 5. the demo line ------------------------------------------------ */
  // The form is the whole point of the guard. It validates, it animates, it
  // confirms -- and it does none of that to anything. There is no endpoint, no
  // fetch, no storage, no analytics. If this file is ever given a real action,
  // the build stops being a mock-up and starts being an unpaid website.
  function wireForm() {
    const form = document.querySelector('[data-demo-form]');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      form.classList.add('sent');
      const done = form.querySelector('.form-done');
      if (done) {
        done.setAttribute('role', 'status');
        // Focus moves so a screen reader user is told what happened.
        done.focus?.();
      }
    });
  }

  /* ---- 6. header, chips, big number ----------------------------------- */
  function wireHeader() {
    const header = document.querySelector('.header');
    if (!header) return;
    const onScroll = () => header.classList.toggle('stuck', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Tel links are real hrefs so the mock-up behaves like the finished site on a
  // phone. The demo bar is what keeps that honest.
  function wireCalls() {
    document.querySelectorAll('[data-call]').forEach((el) => {
      el.addEventListener('click', () => {
        el.dataset.tapped = 'true';
      });
    });
  }

  /* ---- 7. theme switcher (the adaptability demo) ----------------------- */
  // This is the part that answers "would you actually make it look like my
  // business". Same markup, same script, different feel -- in front of them.
  //
  // It is a mock-up affordance and is gated on cfg.mockup for that reason: a
  // client's real site should not ship with a trade switcher in the corner,
  // because that is a demo of the system rather than a feature of their site.
  function wireSwitcher() {
    const demobar = document.querySelector('.demobar');
    if (!demobar || !cfg.mockup) return;
    // Built here rather than sitting in the markup, so a prospect's link cannot
    // show them a row of buttons for four other trades. See the note in the
    // page markup for why that matters more than the feature is worth.
    let bar = demobar.querySelector('.picker');
    if (!bar && cfg.showTradeSwitcher) {
      bar = document.createElement('span');
      bar.className = 'picker';
      bar.setAttribute('role', 'group');
      bar.setAttribute('aria-label', "Preview another trade's styling");
      bar.innerHTML = Object.keys(THEME_FILES)
        .filter((k) => k !== 'studio')
        .map((k) => {
          const label = k.charAt(0).toUpperCase() + k.slice(1);
          return `<button type="button" data-theme="${k}" aria-pressed="${
            k === activeTheme
          }">${label}</button>`;
        })
        .join('');
      demobar.appendChild(bar);
    }
    if (!bar) return;
    bar.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-theme]');
      if (!btn) return;
      document.querySelectorAll('.demobar button[data-theme]').forEach((b) =>
        b.setAttribute('aria-pressed', String(b === btn))
      );
      document.querySelectorAll('link[data-theme]').forEach((l) => l.remove());
      await applyTheme(btn.dataset.theme);
      applyMotion();
    });
  }

  /* ---- 8. content from config ------------------------------------------ */
  // The brand and the copy come from site.config.js, never from the markup.
  // The earlier version hardcoded the name and the tel: href in four places,
  // which made the config look like the per-client delta when editing a new
  // business meant editing the template anyway.
  //
  // Facts render as plain text. Sample content renders through a marked path,
  // and a value we do not have renders as a blank rather than a plausible
  // guess. See core/sample.css for why that distinction is load-bearing.
  function renderContent() {
    const f = cfg.facts || {};
    const s = cfg.sample || {};

    const setText = (sel, value) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (value != null && value !== '') el.textContent = value;
      });
    };
    const setAttr = (sel, name, value) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (value != null && value !== '') el.setAttribute(name, value);
      });
    };
    const setHTML = (sel, value) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (value != null && value !== '') el.innerHTML = value;
      });
    };

    // -- facts
    setText('[data-fact="name"]', f.name);
    setText('[data-fact="address"]', f.address);
    // Three more that exist as bound markup on the auto page. Without these the
    // markup carries a literal value that looks bound and is not, which is the
    // drift the config is supposed to prevent — edit the address in one place
    // and leave the other two behind.
    setText('[data-fact="locality"]', f.locality);
    setText('[data-fact="phone"]', f.phone);
    setText('[data-fact="hours"]', f.hours);
    setText('[data-fact="observedTitle"]', f.observedTitle);
    setText('[data-fact="observedDetail"]', f.observedDetail);
    setText('[data-fact="headline"]', s.headline);
    setText('[data-fact="headlineAccent"]', s.headlineAccent);
    setText('[data-fact="subhead"]', s.subhead);
    setAttr('[data-fact="phoneLink"]', 'href', f.phoneHref);
    setHTML('[data-fact="phoneLink"]', f.phone ? `Call ${f.phone}` : '');
    setAttr('[data-fact="emailLink"]', 'href', f.emailHref);
    setAttr('[data-fact="portfolioLink"]', 'href', f.portfolioHref);
    setAttr('[data-fact="siteLink"]', 'href', f.siteHref);
    setText('[data-fact="email"]', f.email);
    setText('[data-fact="who"]', f.who);
    setText('[data-fact="city"]', f.city);
    setText('[data-fact="portfolio"]', f.portfolio);
    setText('[data-fact="site"]', f.site);
    setText('[data-fact="area"]', f.area);
    setText('[data-fact="areaShort"]', f.areaShort);
    // The one number on the studio page, formatted from the config rather than
    // typed into the markup so the published price and the quoted price are the
    // same value and cannot drift apart.
    if (f.launchPrice != null) {
      setText('[data-fact="launchPrice"]', '$' + Number(f.launchPrice).toLocaleString('en-US'));
    }
    if (f.title) document.title = f.title;
    if (f.description) {
      const m = document.querySelector('meta[name="description"]');
      if (m) m.setAttribute('content', f.description);
    }
    document.documentElement.lang = f.lang || 'en';

    // -- sample: lists built from config so a new client is a data change
    // Everything below reaches innerHTML, so everything below is escaped first.
    // The config is hand-authored today and the exposure is theoretical, but this
    // page is public and indexable where a client mock-up never is, and the cost
    // of being wrong here is a stranger's browser executing a string out of a
    // JSON-shaped file. Cheaper to just not concatenate untrusted text.
    const esc = (s) =>
      String(s).replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
      );

    /* Screenshots ship with the page. They used to be hotlinked from the
       pwn4g3 portfolio, whose origin sends
       `cross-origin-resource-policy: same-origin`, which blocks them on every
       other origin -- including this one. curl reports 200 and the browser
       still refuses to decode, so the section rendered as seven broken-image
       icons with nothing in the network tab to explain it. Bundled, the output
       keeps the property build-standalone.mjs promises: no reference to
       anything outside its own directory, and nothing to break when some other
       project moves or hardens its headers.
       avif + webp only, 296KB for all seven instead of 1.4MB of png; webp has
       been universal since Safari 14 (2020) and avif is the fallback upgrade. */
    const SHOTS = 'shots';
    const shot = (name, ext) => `${SHOTS}/${name}.${ext}`;

    /* width/height are 1000x625 because every source is 1440x900 (ar 1.6),
       the same ratio the CSS asks for -- so the row reserves its space instead
       of jumping when the shot lands, and object-fit: cover crops nothing. */
    const shotTag = (im, title, eager) => `
      <picture class="work-row__pic">
        <source type="image/avif" srcset="${esc(shot(im.src, 'avif'))}">
        <img class="work-row__shot" src="${esc(shot(im.src, 'webp'))}"
             alt="${esc(im.alt || title)}" width="1000" height="625"
             loading="${eager ? 'eager' : 'lazy'}" decoding="async">
      </picture>`;

    const buildList = (sel, items, tpl) => {
      document.querySelectorAll(sel).forEach((host) => {
        if (!items || !items.length) return;
        host.innerHTML = items
          .map((item, i) => tpl(item, i))
          .join('');
      });
    };

    // Ruled rows, not cards. Kept as a separate template from the studio's
    // service rows because this one is for a trade audience reading quickly:
    // a list of six services in three columns of boxes makes the reader compare
    // boxes, and a ruled list just reads down to the job they need.
    buildList('[data-sample="services"]', s.services, (svc, i) => `
      <div class="ruled-row" data-reveal style="--d:${Math.min(i * 55, 380)}ms">
        <span class="ruled-row__n">${String(i + 1).padStart(2, '0')}</span>
        <h3 class="ruled-row__title">${esc(svc.title)}</h3>
        <p class="ruled-row__body">${esc(svc.blurb)}</p>
      </div>`);

    buildList('[data-sample="steps"]', s.steps, (step, i) => `
      <div class="step-paper">
        <span class="step-paper__n">${String(i + 1).padStart(2, '0')}</span>
        <h3>${esc(step.title)}</h3>
        <p>${esc(step.body)}</p>
      </div>`);

    buildList('[data-sample="areas"]', s.serviceArea, (area, i) => `
      <span class="area" data-reveal style="--d:${Math.min(i * 40, 320)}ms">${esc(area)}</span>`);

    buildList('[data-sample="badges"]', s.trustBadges, (badge) => `
      <span class="chip">${esc(badge)}</span>`);

    /* Where the business already exists, rendered from facts rather than the
       markup because it is the list the pitch argument hangs on. It sits after
       `esc` rather than up with the other facts for the same reason the list
       builders do: it reaches innerHTML. */
    buildList('[data-fact="channels"]', f.channels, (c) => `
      <span class="chan">${esc(c)}</span>`);

    /* ---- studio pages: the service rows and the work rows --------------- */
    // Built from config for the same reason the mock-up's lists are: so the
    // services this page sells and the scopes estimator.js quotes are rendered
    // from one list. Change the taxonomy in one place, not two.
    buildList('[data-services]', cfg.services, (svc, i) => `
      <article class="svc-row" data-reveal style="--d:${Math.min(i * 70, 350)}ms">
        <div class="svc-row__n"><span>${String(i + 1).padStart(2, '0')}</span></div>
        <div>
          <p class="svc-row__label">${esc(svc.label)}</p>
          <h3>${esc(svc.title)}</h3>
          <p class="svc-row__body">${esc(svc.body)}</p>
        </div>
        <div class="svc-row__outcome">
          <b>Result</b>
          <span>${esc(svc.outcome)}</span>
        </div>
      </article>`);

    buildList('[data-work]', cfg.work, (w, i) => `
      <article class="work-row" data-reveal style="--d:${Math.min(i * 70, 350)}ms">
        ${w.images && w.images.length
          ? `<div class="work-row__shots">
               ${w.images.map((im, j) => shotTag(im, w.title, i === 0 && j === 0)).join('')}
             </div>`
          : ''}
        <div class="work-row__text">
          <h3>${esc(w.title)}</h3>
          <p>${esc(w.body)}</p>
          <p class="work-row__link">
            ${w.href
              ? `<a href="${esc(w.href)}">${esc(w.linkText)}</a>`
              : `<span class="muted">${esc(w.linkText)}</span>`}
          </p>
        </div>
      </article>`);

    /* Service area, two shapes.
     *
     * A flat list is what a client mock-up wants: one wrapping row of towns, no
     * commentary. A studio page wants them grouped, because the range is the
     * point -- "Warrenton" and "Belleville" are not obviously the same market,
     * and a single flat list quietly implies they are. Saying "West of
     * St. Louis" and "Metro East Illinois" as headings is what makes claiming
     * that distance credible instead of sloppy.
     *
     * Both are rendered from the same config value, which is a dict for the
     * studio and a list for a mock-up. The shape decides the rendering, so a
     * new client cannot accidentally get grouped output with no headings.
     */
    const area = f.serviceArea;
    if (Array.isArray(area)) {
      buildList('[data-areas]', area, (town, i) => `
        <span class="area" data-reveal style="--d:${Math.min(i * 40, 320)}ms">${esc(town)}</span>`);
    } else if (area && typeof area === 'object') {
      buildList('[data-areas]', Object.entries(area), ([group, towns], gi) => `
        <div class="area-group" data-reveal style="--d:${Math.min(gi * 70, 280)}ms">
          <p class="area-group__label">${esc(group)}</p>
          <div class="areas">
            ${towns.map((t) => `<span class="area">${esc(t)}</span>`).join('')}
          </div>
        </div>`);
    }

    // -- numbers we do not have stay visibly empty
    // "98% same-day" on a plumber's own mock-up is a claim about his business
    // that nobody verified. A blank is honest and, usefully, it is a thing the
    // client fills in -- which is a better outcome than a guess that ships.
    document.querySelectorAll('[data-blank]').forEach((el) => {
      const value = s[el.dataset.blank];
      if (value == null || value === '') {
        el.classList.add('blank');
        el.textContent = el.dataset.blankLabel || '—';
        el.setAttribute('aria-label', 'not yet known');
        return;
      }
      el.textContent = value;
    });

    // Mark every section whose contents are invented, with a real element in
    // normal flow. Positioned markers are the wrong tool: they overlap the thing
    // they describe and no screen reader announces them.
    if (cfg.mockup) {
      document.querySelectorAll('[data-sample-label]').forEach((el) => {
        if (el.dataset.flagged === 'done') return;
        const flag = document.createElement('span');
        flag.className = 'sample-flag';
        flag.textContent = el.dataset.sampleLabel;
        el.dataset.flagged = 'done';
        if (el.classList.contains('sample-inline')) {
          el.appendChild(flag);            // last item, margin-left:auto
        } else {
          el.parentNode.insertBefore(flag, el);  // sibling above the group
        }
      });
    }
  }

  /* ---- 9. no outbound anything ----------------------------------------- */
  // Belt and braces, and the reason it is unconditional for a mock-up: that
  // build references no external origin, and this makes it impossible to add
  // one by accident.
  //
  // It is skipped entirely for a studio page. A real site is *supposed* to link
  // out -- to a case study, to a write-up, to a booking provider -- and running
  // the seal over one would quietly strip the href off every one of those links
  // and leave the page looking broken for reasons nobody could find.
  function seal() {
    if (kind === 'studio') return;
    const here = location.origin + location.pathname;
    document.querySelectorAll('a[href^="http"]').forEach((a) => {
      if (a.href !== here) {
        a.removeAttribute('href');
        a.setAttribute('aria-disabled', 'true');
        a.title = 'Disabled in this mock-up';
      }
    });
  }

  /* ---- go -------------------------------------------------------------- */
  async function boot() {
    renderContent();
    await applyTheme(activeTheme);
    applyMotion();
    observeReveals();
    observeCounts();
    stagger('[data-stagger] > *', 70);
    wireHeader();
    wireCalls();
    wireForm();
    wireSwitcher();
    seal();
    root.classList.add('ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();

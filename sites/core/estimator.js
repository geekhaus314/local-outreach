/* Project estimator.
 *
 * The original prototype had a section headed "PROJECT ESTIMATOR" and nothing
 * underneath it. This is that section, built.
 *
 * What it is allowed to do, and why
 * ---------------------------------
 * It estimates *work*, because work is the thing this repo can actually quote.
 * Every other page in this project refuses to invent a number it cannot defend:
 * `sample.css` exists to keep invented stats off client mock-ups, and
 * `parse_leads.py` refuses to estimate how many calls a prospect is losing. An
 * estimator that told someone "this site will make you $4,100/mo" would be
 * exactly that failure wearing a calculator, and it would be the first number
 * in the project nobody could show the source of.
 *
 * So the output is a scope, a band, and a duration -- all three of which follow
 * from the answers given. Where a figure genuinely cannot be derived (custom
 * integrations, booking systems that talk to a third party) the answer is "needs
 * a conversation", which is a real answer and the only honest one.
 *
 * Two deliberate restraints:
 *
 *   * Bands, not point estimates. "$1,200" is a real published price and is shown
 *     as one. A rebuild is quoted as a range because the range is the honest
 *     shape of the thing, and a single figure there would be precision invented
 *     to look decisive.
 *   * No revenue, traffic or conversion output at all. Not softened, not
 *     caveated -- absent. The visitor's revenue is not knowable from six
 *     questions and a stranger's estimate of it is worthless to them.
 *
 * No network, no storage, nothing persisted. The estimate is in the DOM and dies
 * with the page, which is also the only privacy posture that survives someone
 * pasting their real business URL into a form on a public site.
 */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- the four service lines ------------------------------------------- */
  // The taxonomy is the one from the services page, and each line owns the
  // questions that decide its weight. Keeping them together is what stops the
  // estimator and the services copy drifting into describing different work.
  const LINES = {
    rehab: {
      label: 'A site that works',
      eyebrow: 'Fix',
      result: 'A site you are not embarrassed to text a customer.',
    },
    launch: {
      label: 'A new site',
      eyebrow: 'New',
      result: 'A first impression that gets you the call.',
    },
    visibility: {
      label: 'Showing up when people search',
      eyebrow: 'Found',
      result: 'People searching your trade find you.',
    },
    systems: {
      label: 'Bookings, quotes and payments',
      eyebrow: 'Work',
      result: 'Work comes in without you chasing it.',
    },

    /* The answer nobody wants to hear, and the only correct one.
     *
     * Every question here has a "that is fine" option, and it is entirely
     * possible to answer all of them that way. The first version of this file
     * then fell through its line ordering and quoted a visitor who had just
     * said their site works, that they get found, and that enquiries already
     * reach them -- for a $1,200 new build. Which is precisely the failure this
     * project exists to avoid: a number the visitor never asked for, attached to
     * a confident-sounding answer, in a tool whose entire argument is that the
     * other numbers were measured.
     *
     * So the empty case is a real outcome with its own copy, and it says the
     * useful thing: you do not need me. That costs nothing here and it is worth
     * a great deal later -- the owner who is told "your site is fine" is far
     * likelier to reply than one handed an invoice-shaped number for work they
     * declined in a form. */
    none: {
      label: 'Nothing to fix',
      eyebrow: 'No job',
      result: 'Your website is doing its job.',
    },
  };

  /* ---- the questions -----------------------------------------------------
   * Four, in the words an owner-operator uses. The previous five included
   * "Can customers find you when they search your trade locally?" and "How does
   * a new enquiry reach you right now?" -- both of which are questions about
   * the trade's own vocabulary, and a plumber who has never thought about
   * either answers them wrong.
   *
   * `line` is what the guard in check-mockup.mjs keys off, so the scenarios
   * there survive this list being reordered or shortened. It is not decorative.
   *
   * `weight` is added to its line when that option is chosen. Deliberately
   * coarse: the output is a band, so a question that shifted a result by three
   * points would be pretending to a resolution the answer does not have. */
  const QUESTIONS = [
    {
      id: 'have',
      line: null,
      ask: 'Do you have a website?',
      options: [
        { label: 'Yes, and it is mine', weight: {} },
        { label: 'Yes, but it is not really mine', weight: { rehab: 3 } },
        { label: 'There is one somewhere, I think', weight: { rehab: 2 } },
        { label: 'No', weight: { launch: 3 } },
      ],
    },
    {
      id: 'working',
      line: 'rehab',
      ask: 'When someone looks you up, can they do anything from the site?',
      help: 'Call, book, or send you a message. Any of those count.',
      options: [
        { label: 'It takes people somewhere else entirely', weight: { rehab: 3 } },
        { label: 'They cannot call or book from it', weight: { rehab: 2 } },
        { label: 'It works, it just looks old', weight: { rehab: 1 } },
        { label: 'It does its job', weight: {} },
      ],
    },
    {
      id: 'found',
      line: 'visibility',
      ask: 'When people search for your trade near you, do you come up?',
      options: [
        { label: 'No, or I have honestly no idea', weight: { visibility: 3 } },
        { label: 'Only from people who already know me', weight: { visibility: 2 } },
        { label: 'I come up, but a long way down', weight: { visibility: 1 } },
        { label: 'Yes, I get found', weight: {} },
      ],
    },
    {
      id: 'taking-work',
      line: 'systems',
      ask: 'Do you want the site to be taking work for you?',
      help: 'Bookings, quotes, or card payments — while you are busy, not after.',
      options: [
        { label: 'Yes — bookings and quotes', weight: { systems: 3 } },
        { label: 'Yes — taking card payments', weight: { systems: 3 } },
        { label: 'No, it just needs to look right', weight: {} },
      ],
    },
  ];

  /* ---- pricing ------------------------------------------------------------
   * Bands, with the reasoning left in the comments so the next person to touch
   * this can see which numbers are measured and which are judgement.
   *
   * launch  $1,200 fixed. This is a published price, not an estimate, so it is
   *         shown as a single figure and quoted as fixed.
   * rehab   $900-$1,600. The floor is a near-total replacement; the ceiling is
   *         the same build plus content work. Which end you land on is decided
   *         by how much of the old site is worth keeping, which is the one thing
   *         the visitor genuinely cannot answer and has to be shown.
   * systems Not priced. It ranges from wiring a form to an existing inbox to
   *         connecting to a booking system he already pays for, and the
   *         difference is a conversation rather than a number. Putting a figure
   *         on it would be the one place on the page a prospect could check and
   *         find wrong.
   */
  const PRICE = {
    launch: { low: 1200, high: 1200, fixed: true },
    rehab: { low: 900, high: 1600, fixed: false },
    systems: null, // quoted after we have looked at what it talks to
  };

  const COPY = {
    launch: { days: '1-2', note: 'Most of that is me waiting on your details, not me working.' },
    rehab: { days: '3-6', note: 'Longer if the old site was built somewhere that has since shut.' },
    none: { days: null, note: 'Send me the address anyway. I would rather tell you it is fine than take money for it.' },
  };

  /* ---- scoring ----------------------------------------------------------- */
  function score(answers) {
    const totals = { rehab: 0, launch: 0, visibility: 0, systems: 0 };
    QUESTIONS.forEach((q) => {
      const chosen = q.options.find((o) => o.label === answers[q.id]);
      if (!chosen) return;
      Object.entries(chosen.weight).forEach(([k, v]) => {
        totals[k] = (totals[k] || 0) + v;
      });
    });
    return totals;
  }

  // Which line is the job actually about? The largest weight wins, with launch
  // and rehab mutually exclusive by construction -- the first question puts all
  // of its weight on one or the other, so a visitor who owns a working site can
  // never end up quoted for a new build.
  //
  // An all-zero score is its own answer, not a tie to be broken. Falling through
  // to order[0] here is what quoted a new $1,200 build to a visitor who had just
  // ticked "it works fine" five times.
  function primaryLine(totals) {
    const scored = Object.values(totals).reduce((a, b) => a + b, 0);
    if (scored === 0) return 'none';
    const hasSite = totals.rehab > 0;
    const order = hasSite
      ? ['rehab', 'systems', 'visibility']
      : ['launch', 'systems', 'visibility'];
    return order.reduce((best, k) => (totals[k] > totals[best] ? k : best), order[0]);
  }

  /* ---- rendering --------------------------------------------------------- */
  const money = (n) => '$' + n.toLocaleString('en-US');

  function priceLine(key) {
    const p = PRICE[key];
    if (!p) return null;
    return p.fixed
      ? `${money(p.low)} fixed`
      : `${money(p.low)}&ndash;${money(p.high)}`;
  }

  function included(totals, primary) {
    // Nothing to include when there is nothing to build. Listing a line item
    // here would be the same false claim in a different font.
    if (primary === 'none') return [];

    const items = [];
    const line = LINES[primary];
    items.push({ title: line.label, note: line.result });

    // Local presence rides along with every build rather than being a separate
    // upsell. Charging for the thing that makes a site findable turns the
    // cheapest part of the job into an argument.
    items.push({
      title: LINES.visibility.label,
      note: 'Included with anything I build. The pages and listings that make ' +
        'you come up for your trade nearby.',
    });

    if (totals.systems > 0) {
      items.push({
        title: LINES.systems.label,
        note: 'Quoted separately, because it depends what you already use. I ' +
          'will not put a number on it until I have seen it.',
        talk: true,
      });
    }
    return items;
  }

  function render(out, totals, primary) {
    const line = LINES[primary];
    const copy = COPY[primary];
    const price = priceLine(primary);
    const needsTalk = totals.systems > 0;

    // The empty case gets its own panel rather than a scope with a struck-out
    // price. There is nothing to quote, and showing a figure next to a big
    // empty line would invite the reader to supply one themselves.
    if (primary === 'none') {
      out.innerHTML = `
        <div class="est__head">
          <p class="eyebrow">Where you land</p>
          <h3 class="h3" id="est-scope">${line.eyebrow} &mdash; ${line.label}</h3>
          <p class="muted">${line.result}</p>
        </div>
        <dl class="est__figures">
          <div><dt>Cost</dt><dd>Nothing to do</dd></div>
          <div><dt>How long</dt><dd>&mdash;</dd></div>
        </dl>
        <p class="est__caveat">${copy ? copy.note : ''}</p>
      `;
      return;
    }

    out.innerHTML = `
      <div class="est__head">
        <p class="eyebrow">Where you land</p>
        <h3 class="h3" id="est-scope">${line.eyebrow} &mdash; ${line.label}</h3>
        <p class="muted">${line.result}</p>
      </div>

      <dl class="est__figures">
        <div>
          <dt>Cost</dt>
          <dd>${price ? price + (needsTalk ? ' <span class="est__plus">+ bookings</span>' : '') : 'Depends — ask me'}</dd>
        </div>
        <div>
          <dt>How long</dt>
          <dd>${copy && copy.days ? copy.days + ' days' : '&mdash;'}</dd>
        </div>
      </dl>

      <ul class="est__list">
        ${included(totals, primary)
          .map(
            (i) => `<li class="est__item${i.talk ? ' est__item--talk' : ''}">
              <strong>${i.title}</strong>
              <span>${i.note}</span>
            </li>`
          )
          .join('')}
      </ul>

      <p class="est__caveat">
        Roughly, from four answers. The real number is after I have looked at
        your site &mdash; and it will not go up.${copy ? ' ' + copy.note : ''}
      </p>
    `;
  }

  /* ---- wiring ------------------------------------------------------------ */
  function build(host) {
    const form = host.querySelector('[data-est-form]');
    const out = host.querySelector('[data-est-out]');
    // Questions go into their own container. Writing to form.innerHTML would
    // take the tally and the submit button with it, because they are children
    // of the form too -- which is exactly what happened the first time.
    const qs = host.querySelector('[data-est-questions]');
    if (!form || !out || !qs) return;

    // Questions are rendered from the list above rather than written into the
    // markup, so the estimator and the services page cannot disagree about what
    // the four lines are.
    //
    // Nothing is pre-checked. The first version defaulted every radio to its
    // first option, which meant all five questions counted as answered before
    // anyone had touched the form and a scope was sitting there waiting -- one
    // derived from five defaults the visitor had not chosen. Same failure as
    // quoting a build to someone who said they did not need one, wearing a
    // smaller hat. An unstarted form now shows nothing.
    qs.innerHTML = QUESTIONS.map(
      (q, i) => `
      <fieldset class="est__q">
        <legend><span class="est__n">${String(i + 1).padStart(2, '0')}</span>${q.ask}</legend>
        ${q.help ? `<p class="est__help">${q.help}</p>` : ''}
        <div class="est__opts">
          ${q.options
            .map(
              (o) => `
            <label class="est__opt">
              <input type="radio" name="${q.id}" value="${o.label}">
              <span>${o.label}</span>
            </label>`
            )
            .join('')}
        </div>
      </fieldset>`
    ).join('');

    const submit = form.querySelector('[data-est-go]');
    const tally = host.querySelector('[data-est-tally]');

    const update = () => {
      const data = new FormData(form);
      const answers = {};
      QUESTIONS.forEach((q) => {
        const v = data.get(q.id);
        if (v) answers[q.id] = v;
      });
      const answered = Object.keys(answers).length;
      if (tally) {
        tally.textContent =
          answered === QUESTIONS.length
            ? ''
            : `${answered} of ${QUESTIONS.length} answered`;
      }
      if (answered < QUESTIONS.length) {
        // Nothing is shown until every answer is in. A half-answered scope is a
        // number the visitor will remember and quote back, and it is the number
        // least supported by anything.
        out.hidden = true;
        if (tally) {
          tally.textContent = `${answered} of ${QUESTIONS.length} answered`;
        }
        return;
      }
      if (tally) tally.textContent = '';
      const totals = score(answers);
      render(out, totals, primaryLine(totals));
      out.hidden = false;
    };

    form.addEventListener('change', update);

    submit?.addEventListener('click', (e) => {
      e.preventDefault();
      if (out.hidden) return;
      out.focus?.();
      if (!reduced.matches) {
        out.animate?.(
          [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
          { duration: 320, easing: 'cubic-bezier(0.16,1,0.3,1)' }
        );
      }
    });

    update();
  }

  function boot() {
    document.querySelectorAll('[data-estimator]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  // Exposed so check-mockup.mjs can assert the restraint that matters: that the
  // estimator has no revenue output to soften or remove.
  window.__ESTIMATOR__ = { LINES, QUESTIONS, PRICE, score, primaryLine };
})();

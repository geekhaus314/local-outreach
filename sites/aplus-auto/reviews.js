/**
 * Live reviews from the shop's own Google listing.
 *
 * Contract with /api/reviews, in one line: it either returns real reviews or it
 * returns { ok: false }. There is no third case and no fallback data, because
 * the one thing this page must never contain is a review that nobody wrote.
 *
 * So every failure path here ends the same way -- the frames stay empty and the
 * caption says the feed is not connected. An empty honest box is recoverable. A
 * plausible-looking wrong quote in front of a real business is not.
 *
 * Kept out of index.html on purpose: the mock-up guard forbids network calls in
 * the markup, and it should keep forbidding them.
 */

(function () {
  'use strict';

  var mount = document.querySelector('[data-reviews]');
  if (!mount) return;

  var list = mount.querySelector('[data-reviews-list]');
  var summary = mount.querySelector('[data-reviews-summary]');
  var link = mount.querySelector('[data-reviews-link]');
  var caption = mount.querySelector('[data-reviews-caption]');

  function stars(n) {
    // A real number between 1 and 5 becomes a filled/empty row. Anything else
    // renders nothing rather than a guess.
    if (typeof n !== 'number' || n < 1 || n > 5) return '';
    var out = '<span class="rv__stars" aria-hidden="true">';
    for (var i = 1; i <= 5; i++) {
      out += '<i class="' + (i <= Math.round(n) ? 'is-on' : 'is-off') + '"></i>';
    }
    return out + '</span>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function when(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  }

  function idle() {
    // The honest end state, whatever the reason was. No spinner left running,
    // no "loading" that never resolves.
    mount.setAttribute('data-reviews-state', 'idle');
    if (caption) {
      caption.textContent =
        'This space pulls your real reviews from your Google listing. ' +
        'It is not connected in this preview, so it stays empty rather than ' +
        'showing anything invented.';
    }
  }

  function render(data) {
    if (!data || data.ok !== true || !data.reviews || !data.reviews.length) {
      idle();
      return;
    }

    if (summary) {
      var bits = [];
      if (data.rating) bits.push(data.rating.toFixed(1) + ' out of 5');
      if (data.reviewCount) bits.push(data.reviewCount + ' reviews');
      if (bits.length) {
        summary.innerHTML =
          stars(data.rating) +
          '<span class="rv__score">' +
          esc(bits.join(' \u00b7 ')) +
          '</span>';
        summary.hidden = false;
      }
    }

    list.innerHTML = data.reviews
      .map(function (r) {
        return (
          '<figure class="rv">' +
          '<blockquote class="rv__text">' +
          esc(r.text) +
          '</blockquote>' +
          '<figcaption class="rv__by">' +
          esc(r.author) +
          (r.published ? ' \u00b7 ' + esc(when(r.published)) : '') +
          '</figcaption>' +
          '</figure>'
        );
      })
      .join('');

    // Google's terms require the source be visible and linked. The uri is only
    // set if Google returned one, so the link is built here rather than shipped
    // in the markup -- which also keeps the mock-up guard's no-external-origins
    // rule true of the page source.
    var uri = data.attribution && data.attribution.mapsUri;
    if (uri) link.setAttribute('href', uri);

    if (caption) {
      var n = data.reviewCount;
      caption.textContent =
        'Straight from your Google listing' +
        (n ? ', newest first. ' : '. ') +
        'Nothing on this page is written by anyone but your customers.';
    }

    mount.setAttribute('data-reviews-state', 'live');
  }

  if (!window.fetch) {
    idle();
    return;
  }

  fetch('/api/reviews', { headers: { accept: 'application/json' } })
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(render)
    .catch(idle);
})();

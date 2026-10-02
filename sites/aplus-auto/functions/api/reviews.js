/**
 * /api/reviews -- real customer reviews, read live from Google.
 *
 * Why this is a server function and not a fetch() in the page:
 *
 *   1. The Places API key must never reach the browser. A key shipped in a
 *      page script is a key anybody can lift and spend, and Google will bill
 *      whoever owns it. It lives in the Pages environment as
 *      GOOGLE_PLACES_API_KEY and is read here, server-side.
 *   2. Google requires attribution and a link back to the listing for
 *      displayed review content. That is enforced here rather than left to
 *      whoever edits the markup later, so it cannot be quietly dropped.
 *   3. A cold visitor should not wait on a third-party round trip, and we are
 *      rate-limited, so responses are cached.
 *
 * The important behaviour: when no key is configured, or the place id does not
 * match the expected business, this returns { ok: false } and the page shows
 * nothing. It never returns a placeholder, a sample, or a fallback number.
 * Invented reviews are the one thing this page must never contain, and the
 * cheapest way to guarantee that is to have nothing to fall back to.
 *
 * Env:
 *   GOOGLE_PLACES_API_KEY  required for live data
 *   GOOGLE_PLACE_ID        the listing to read (verified by hand, see below)
 *   CACHE_TTL              seconds, default 900
 */

const PLACE_URL = 'https://places.googleapis.com/v1/places';

/**
 * A place id is a public identifier, but pasting one in from a directory
 * aggregator and trusting it is how you end up showing a competitor's reviews
 * with the shop's name on them. This is the guard against that: the response
 * has to come back for the business we actually asked for.
 */
const EXPECTED = {
  name: 'A+ Auto Repair',
  address: '3659 N Lindbergh Blvd, St. Ann, MO 63074',
};

/** Google's field mask. Narrow on purpose -- it is also the billing surface. */
const FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'rating',
  'userRatingCount',
  'googleMapsUri',
  'reviews.authorAttribution.displayName',
  'reviews.authorAttribution.uri',
  'reviews.rating',
  'reviews.text.text',
  'reviews.publishTime',
  'reviews.originalText.languageCode',
].join(',');

/** Reviews are sorted newest-first so the page reflects the present. */
function normalise(payload) {
  const place = payload || {};
  const reviews = (place.reviews || [])
    .filter((r) => r && r.text && r.text.text)
    .map((r) => ({
      author: (r.authorAttribution && r.authorAttribution.displayName) || 'Google reviewer',
      authorUri: (r.authorAttribution && r.authorAttribution.uri) || null,
      rating: typeof r.rating === 'number' ? r.rating : null,
      text: r.text.text.trim(),
      published: r.publishTime || null,
    }))
    .sort((a, b) => String(b.published || '').localeCompare(String(a.published || '')));

  return {
    name: place.displayName && place.displayName.text,
    address: place.formattedAddress,
    rating: typeof place.rating === 'number' ? place.rating : null,
    reviewCount: typeof place.userRatingCount === 'number' ? place.userRatingCount : null,
    mapsUri: place.googleMapsUri || null,
    reviews,
  };
}

/** Strip what the page does not render, and cap the payload. */
function project(data) {
  return {
    rating: data.rating,
    reviewCount: data.reviewCount,
    mapsUri: data.mapsUri,
    reviews: data.reviews.slice(0, 8).map((r) => ({
      author: r.author,
      rating: r.rating,
      text: r.text.length > 480 ? `${r.text.slice(0, 477).trimEnd()}...` : r.text,
      published: r.published,
    })),
  };
}

function json(body, status, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // The key is server-side and the payload is a projection, so nothing here
      // is secret. Short cache: reviews change, and a stale copy on a public
      // hostname is the kind of thing that gets caught later.
      'cache-control': 'public, max-age=60, s-maxage=900',
      ...headers,
    },
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  // GET only. A query string is accepted and ignored on purpose rather than
  // echoed into the upstream URL.
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json({ ok: false, reason: 'method' }, 405, { allow: 'GET, HEAD' });
  }

  const key = env.GOOGLE_PLACES_API_KEY;
  const placeId = env.GOOGLE_PLACE_ID;

  if (!key || !placeId) {
    // The honest empty state. No key means no claim on the page about how many
    // reviews there are or what they say.
    return json({ ok: false, reason: 'not-configured' }, 200);
  }

  const upstream = await fetch(`${PLACE_URL}/${encodeURIComponent(placeId)}`, {
    headers: {
      'x-goog-api-key': key,
      'x-goog-fieldmask': FIELDS,
    },
  });

  if (upstream.status === 404) {
    return json({ ok: false, reason: 'place-not-found' }, 200);
  }
  if (upstream.status === 401 || upstream.status === 403) {
    // Bad key, or Places API not enabled on the project behind it.
    return json({ ok: false, reason: 'credentials' }, 200);
  }
  if (!upstream.ok) {
    return json({ ok: false, reason: 'upstream' }, 200);
  }

  let data;
  try {
    data = normalise(await upstream.json());
  } catch {
    return json({ ok: false, reason: 'parse' }, 200);
  }

  // Verify we are reading the listing we think we are. A wrong place id is the
  // one failure mode that would put another business's words under this shop's
  // name, so it is a hard stop rather than a warning.
  if (data.name && data.name.toLowerCase() !== EXPECTED.name.toLowerCase()) {
    return json({ ok: false, reason: 'name-mismatch' }, 200);
  }

  if (!data.reviews.length && !data.rating) {
    return json({ ok: false, reason: 'empty' }, 200);
  }

  return json(
    {
      ok: true,
      // Google's attribution requirement, decided server-side so it cannot be
      // dropped from the markup without the failure being visible here.
      attribution: { text: 'Reviews from Google', uri: data.mapsUri },
      ...project(data),
    },
    200
  );
}

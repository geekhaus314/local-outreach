<script lang="ts">
  import BookingForm from '$lib/components/BookingForm.svelte';
  import type { SiteContent } from '$lib/content/types';
  import styles from './SalonVertical.module.css';

  let { content }: { content: SiteContent } = $props();

  const business = $derived(content.business);
  const location = $derived(business.locations[0] ?? null);
  const phone = $derived(business.phone);
  const email = $derived(business.email);
  const services = $derived(content.offerings);
</script>

<div class={styles.page}>
  <section class={styles.hero}>
    <div class="shell">
      <div class={styles.heroGrid}>
        <div class={styles.heroCopy}>
          <p class={styles.kicker}>{content.hero.eyebrow}</p>
          <h1>{content.hero.headline}</h1>
          <p class={styles.lede}>{content.hero.subhead}</p>

          <div class={styles.actions}>
            <a class="button" href="#booking">{content.hero.primaryCta}</a>
            {#if phone}
              <a class={styles.callLink} href={phone.dial}>Call {phone.display}</a>
            {/if}
          </div>

          {#if content.hero.trust.length > 0}
            <ul class={styles.trust}>
              {#each content.hero.trust as item}
                <li>{item}</li>
              {/each}
            </ul>
          {/if}
        </div>

        <div class={styles.heroSide}>
          <figure class={styles.heroFigure}>
            <img
              src={content.hero.image}
              alt={content.hero.imageAlt}
              width="960"
              height="1200"
              fetchpriority="high"
            />
          </figure>

          <div class={styles.chairNote}>
            <p class={styles.chairLabel}>The chair</p>
            <p>{business.descriptor} in {location?.city || 'the neighborhood'}.</p>
            {#if location}
              <a class={styles.directions} href={location.directionsUrl} target="_blank" rel="noreferrer">
                {location.streetAddress || 'Get directions'}
              </a>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class={styles.menu} id="treatments">
    <div class="shell">
      <header class={styles.sectionHead}>
        <p class={styles.kicker}>Service menu</p>
        <h2>Choose the appointment, not a package.</h2>
        <p class={styles.sectionNote}>
          Every service opens to what is included and how to request it. Prices are quoted by the shop, never invented here.
        </p>
      </header>

      {#if services.length === 0}
        <p class={styles.empty} role="status">
          The service menu for this preview has not been published yet. Call the shop for current services.
        </p>
      {:else}
        <ol class={styles.menuList}>
          {#each services as service, index}
            <li class={styles.menuRow}>
              <span class={styles.menuNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div class={styles.menuBody}>
                <div class={styles.menuTitle}>
                  <h3><a href={`/services/${service.id}`}>{service.name}</a></h3>
                  <span class={styles.menuDuration}>{service.duration}</span>
                </div>
                <p>{service.summary}</p>
                <ul class={styles.menuFeatures}>
                  {#each service.features.slice(0, 3) as feature}
                    <li>{feature}</li>
                  {/each}
                </ul>
              </div>
              <a class={styles.menuLink} href={`/services/${service.id}`} aria-label={`View ${service.name}`}>
                View
              </a>
            </li>
          {/each}
        </ol>
      {/if}
    </div>
  </section>

  <section class={styles.room} id="approach">
    <div class="shell">
      <div class={styles.roomGrid}>
        <div>
          <p class={styles.kicker}>How the visit runs</p>
          <h2>{business.shortName} keeps the appointment simple.</h2>
          {#if phone}
            <p class={styles.roomNote}>
              Questions before you book? Call <a href={phone.dial}>{phone.display}</a>.
            </p>
          {/if}
        </div>

        <ol class={styles.process}>
          {#each content.process as step, index}
            <li>
              <span class={styles.processNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          {/each}
        </ol>
      </div>
    </div>
  </section>

  {#if content.proof}
    <section class={styles.proof} id="reviews">
      <div class="shell">
        <div class={styles.proofInner}>
          <div>
            <p class={styles.kicker}>Public signal</p>
            <h2>Reviews, quoted by the number.</h2>
            <p class={styles.sectionNote}>
              This preview uses the rating and review count from the public listing. It does not invent client quotes or names.
            </p>
          </div>
          <div class={styles.rating}>
            <strong>{content.proof.rating.toFixed(1)}</strong>
            <span class={styles.stars} aria-hidden="true">★★★★★</span>
            <small>
              {content.proof.reviewCount === null
                ? content.proof.source
                : `${content.proof.reviewCount} ${content.proof.source}`}
            </small>
          </div>
        </div>
      </div>
    </section>
  {/if}

  <section class={styles.faq} id="faq">
    <div class="shell">
      <div class={styles.faqGrid}>
        <div>
          <p class={styles.kicker}>Before you sit down</p>
          <h2>Answers the shop already gives.</h2>
          {#if phone}
            <p class={styles.roomNote}>Prefer to talk? Call <a href={phone.dial}>{phone.display}</a>.</p>
          {/if}
        </div>

        <div class={styles.faqList}>
          {#each content.faq as item, index}
            <details open={index === 0}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <section class={styles.booking} id="booking">
    <div class="shell">
      <div class={styles.bookingGrid}>
        <div class={styles.bookingCopy}>
          <p class={styles.kicker}>{content.hero.primaryCta}</p>
          <h2>Tell the shop what you want.</h2>
          <p class={styles.sectionNote}>
            Share the shape, color, or occasion and {business.shortName} will follow up using the contact details you provide.
          </p>

          <dl class={styles.contact}>
            {#if phone}
              <div><dt>Phone</dt><dd><a href={phone.dial}>{phone.display}</a></dd></div>
            {/if}
            {#if email}
              <div><dt>Email</dt><dd><a href={`mailto:${email}`}>{email}</a></dd></div>
            {/if}
            {#if location}
              <div>
                <dt>Shop</dt>
                <dd>{[location.streetAddress, location.city, location.region].filter(Boolean).join(', ')}</dd>
              </div>
            {/if}
          </dl>
        </div>

        <div class={styles.formPanel}>
          <BookingForm booking={content.booking} {phone} businessName={business.name} />
        </div>
      </div>
    </div>
  </section>
</div>

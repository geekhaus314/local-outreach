<script lang="ts">
  import BookingForm from '$lib/components/BookingForm.svelte';
  import type { SiteContent } from '$lib/content/types';
  import styles from './MenuTemplate.module.css';

  let { content }: { content: SiteContent } = $props();

  const business = $derived(content.business);
  const location = $derived(business.locations[0] ?? null);
  const phone = $derived(business.phone);
</script>

<div class={styles.page}>
  <section class={styles.hero}>
    <div class="shell">
      <div class={styles.heroTop}>
        <p class="eyebrow">{content.hero.eyebrow}</p>
        {#if content.proof}
          <p class={styles.rating}>
            <span aria-hidden="true">★</span>
            {content.proof.rating.toFixed(1)} · {content.proof.reviewCount ?? content.proof.source}
          </p>
        {/if}
      </div>

      <h1>{content.hero.headline}</h1>
      <p class={styles.subhead}>{content.hero.subhead}</p>

      <div class={styles.heroFoot}>
        <div class={styles.heroActions}>
          <a class="button button--accent" href={content.hero.primaryHref}>{content.hero.primaryCta}</a>
          <a class={styles.textLink} href={content.hero.secondaryHref}>{content.hero.secondaryCta}</a>
        </div>

        <div class={styles.visitCard}>
          {#if location}
            <p class={styles.cardLabel}>Find us</p>
            <address>
              {[location.streetAddress, location.city, location.region].filter(Boolean).join(', ')}
            </address>
          {/if}
          {#if phone}
            <p class={styles.cardLabel}>Call</p>
            <a href={phone.dial}>{phone.display}</a>
          {/if}
          {#if business.hours.length > 0}
            <p class={styles.cardLabel}>Hours</p>
            <ul>
              {#each business.hours as entry}
                <li><span>{entry.days.join(', ')}</span><span>{entry.opens}–{entry.closes}</span></li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    </div>
  </section>

  <div class={styles.rule} aria-hidden="true"></div>

  <section class="section" id="treatments">
    <div class="shell">
      <div class={styles.menuHead}>
        <p class="eyebrow">The menu</p>
        <h2>What {business.shortName} is known for.</h2>
        <p>Each item links to a page with the full description and a reservation request.</p>
      </div>

      <div class={styles.menuGrid}>
        {#each content.offerings as offering}
          <article class={styles.menuItem}>
            <div class={styles.itemTop}>
              <span>{offering.category}</span>
              {#if offering.priceFrom}
                <span>{offering.priceFrom}</span>
              {:else}
                <span>{offering.duration}</span>
              {/if}
            </div>
            <h3><a href={`/services/${offering.id}`}>{offering.name}</a></h3>
            <p>{offering.summary}</p>
            <ul>
              {#each offering.features as feature}
                <li>{feature}</li>
              {/each}
            </ul>
          </article>
        {/each}
      </div>
    </div>
  </section>

  <section class={styles.visitSection} id="visit">
    <div class="shell">
      <div class={styles.visitGrid}>
        <div>
          <p class="eyebrow">Visit</p>
          <h2>Come in, call ahead, or book a table.</h2>
          <p>{content.hero.trust.join(' · ')}</p>
        </div>
        <div class={styles.visitDetails}>
          {#if location}
            <div>
              <p class={styles.detailLabel}>Address</p>
              <address>
                {[location.streetAddress, location.city, location.region, location.postalCode].filter(Boolean).join(', ')}
              </address>
              {#if location.directionsUrl}
                <a href={location.directionsUrl} target="_blank" rel="noreferrer">Get directions</a>
              {/if}
            </div>
          {/if}
          {#if phone}
            <div>
              <p class={styles.detailLabel}>Phone</p>
              <a class={styles.bigLink} href={phone.dial}>{phone.display}</a>
            </div>
          {/if}
          {#if business.hours.length > 0}
            <div>
              <p class={styles.detailLabel}>Hours</p>
              <ul class={styles.hours}>
                {#each business.hours as entry}
                  <li><span>{entry.days.join(', ')}</span><span>{entry.opens}–{entry.closes}</span></li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="approach">
    <div class="shell">
      <div class={styles.processGrid}>
        <div>
          <p class="eyebrow">What to expect</p>
          <h2>Simple from the first visit.</h2>
        </div>
        <ol>
          {#each content.process as step, index}
            <li>
              <span>{String(index + 1).padStart(2, '0')}</span>
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

  <section class="section" id="faq">
    <div class="shell">
      <div class={styles.faqGrid}>
        <div>
          <p class="eyebrow">Good to know</p>
          <h2>Questions before you visit.</h2>
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

  <section class={styles.bookingSection} id="booking">
    <div class="shell">
      <div class={styles.bookingGrid}>
        <div>
          <p class="eyebrow">Reservations</p>
          <h2>Request a table.</h2>
          <p>Send a request and {business.shortName} will confirm availability directly.</p>
          {#if phone}
            <p class={styles.callNote}>Prefer to call? <a href={phone.dial}>{phone.display}</a></p>
          {/if}
        </div>
        <div class={styles.formPanel}>
          <BookingForm booking={content.booking} {phone} />
        </div>
      </div>
    </div>
  </section>
</div>

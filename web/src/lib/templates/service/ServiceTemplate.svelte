<script lang="ts">
  import BookingForm from '$lib/components/BookingForm.svelte';
  import type { SiteContent } from '$lib/content/types';
  import styles from './ServiceTemplate.module.css';

  let { content }: { content: SiteContent } = $props();

  const business = $derived(content.business);
  const location = $derived(business.locations[0] ?? null);
  const phone = $derived(business.phone);
</script>

<div class={styles.page}>
  <section class={styles.hero}>
    <div class="shell">
      <div class={styles.heroInner}>
        <div class={styles.heroCopy}>
          <p class={styles.kicker}>{content.hero.eyebrow}</p>
          <h1>{content.hero.headline}</h1>
          <p class={styles.subhead}>{content.hero.subhead}</p>
          <div class={styles.actions}>
            <a class="button button--accent" href={content.hero.primaryHref}>{content.hero.primaryCta}</a>
            {#if phone}
              <a class={styles.phoneCta} href={phone.dial}>
                <span>Call directly</span>
                <strong>{phone.display}</strong>
              </a>
            {/if}
          </div>
        </div>

        <div class={styles.heroPanel}>
          <p class={styles.panelLabel}>Service area</p>
          {#if location}
            <p class={styles.panelValue}>{location.city}{location.region ? `, ${location.region}` : ''}</p>
          {/if}
          <p class={styles.panelLabel}>Response</p>
          <p class={styles.panelValue}>Requests are reviewed by the business during normal hours.</p>
          {#if content.hero.trust.length > 0}
            <ul>
              {#each content.hero.trust as item}
                <li>{item}</li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="treatments">
    <div class="shell">
      <div class={styles.sectionHead}>
        <p class="eyebrow">Capabilities</p>
        <h2>Work scoped around the actual problem.</h2>
        <p>Every service below links to a detail page with scope, expectations, and a request form.</p>
      </div>

      <div class={styles.grid}>
        {#each content.offerings as offering, index}
          <article class={styles.card}>
            <span class={styles.cardNumber}>{String(index + 1).padStart(2, '0')}</span>
            <p class={styles.cardCategory}>{offering.category}</p>
            <h3><a href={`/services/${offering.id}`}>{offering.name}</a></h3>
            <p>{offering.summary}</p>
            <ul>
              {#each offering.features as feature}
                <li>{feature}</li>
              {/each}
            </ul>
            <div class={styles.cardFoot}>
              <span>{offering.duration}</span>
              <a href={`/services/${offering.id}`}>Details</a>
            </div>
          </article>
        {/each}
      </div>
    </div>
  </section>

  <section class={styles.processSection} id="approach">
    <div class="shell">
      <div class={styles.processGrid}>
        <div class={styles.processCopy}>
          <p class="eyebrow">How it works</p>
          <h2>No mystery steps. No surprise scope.</h2>
          <p>Clear expectations before the work starts, and a direct line if something changes.</p>
        </div>
        <ol class={styles.steps}>
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

  {#if content.proof}
    <section class={styles.proof} id="reviews">
      <div class="shell">
        <div class={styles.proofInner}>
          <div class={styles.proofCopy}>
            <p class="eyebrow">Track record</p>
            <h2>Reputation from the source, not a stock testimonial.</h2>
            <p>Only public rating data from the prospect record appears here.</p>
          </div>
          <div class={styles.proofScore}>
            <strong>{content.proof.rating.toFixed(1)}</strong>
            <div>
              <span aria-hidden="true">★★★★★</span>
              <small>{content.proof.reviewCount ?? 'Published'} / {content.proof.source}</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  {/if}

  <section class="section" id="faq">
    <div class="shell">
      <div class={styles.faqGrid}>
        <div>
          <p class="eyebrow">Before you request</p>
          <h2>Common questions.</h2>
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
      <div class={styles.bookingPanel}>
        <div class={styles.bookingCopy}>
          <p class="eyebrow">Next step</p>
          <h2>Request a service call.</h2>
          <p>Tell {business.shortName} what is going on. The business will follow up to confirm scope and timing.</p>
          {#if phone}
            <a class={styles.phoneLink} href={phone.dial}>{phone.display}</a>
          {/if}
          {#if location}
            <address>
              {[location.streetAddress, location.city, location.region, location.postalCode].filter(Boolean).join(', ')}
            </address>
          {/if}
        </div>
        <div class={styles.formPanel}>
          <BookingForm booking={content.booking} {phone} />
        </div>
      </div>
    </div>
  </section>
</div>

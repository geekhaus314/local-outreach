<script lang="ts">
  import BookingForm from '$lib/components/BookingForm.svelte';
  import type { SiteContent } from '$lib/content/types';
  import styles from './HvacSite.module.css';

  let { content }: { content: SiteContent } = $props();

  const business = $derived(content.business);
  const location = $derived(business.locations[0] ?? null);
  const phone = $derived(business.phone);
  const proof = $derived(content.proof);
  const systemCount = $derived(content.offerings.length);
  const cityLabel = $derived(
    location ? [location.city, location.region].filter(Boolean).join(', ') : 'your area'
  );
</script>

<div class={styles.page}>
  <section class={styles.hero}>
    <div class={styles.heroGrid}>
      <div class={styles.heroCopy}>
        <p class={styles.kicker}>{content.hero.eyebrow}</p>
        <h1>{content.hero.headline}</h1>
        <p class={styles.lede}>{content.hero.subhead}</p>
        <div class={styles.actions}>
          <a class={styles.primary} href={content.hero.primaryHref}>{content.hero.primaryCta}</a>
          <a class={styles.ghost} href={content.hero.secondaryHref}>{content.hero.secondaryCta}</a>
        </div>
        {#if content.hero.trust.length > 0}
          <ul class={styles.trust}>
            {#each content.hero.trust as item}
              <li>{item}</li>
            {/each}
          </ul>
        {/if}
      </div>

      <aside class={styles.gauge} aria-label="System snapshot">
        <p class={styles.gaugeTop}>
          <span class={styles.gaugeDot}></span>
          Service snapshot
        </p>
        <dl class={styles.gaugeList}>
          <div>
            <dt>Systems covered</dt>
            <dd>{systemCount}</dd>
          </div>
          <div>
            <dt>Serving</dt>
            <dd>{cityLabel}</dd>
          </div>
          <div>
            <dt>Approach</dt>
            <dd>Diagnose before replace</dd>
          </div>
          <div>
            <dt>Quoting</dt>
            <dd>Written, before work</dd>
          </div>
        </dl>
      </aside>
    </div>
  </section>

  <section class={styles.systems} id="systems">
    <div class="shell">
      <div class={styles.sectionHead}>
        <p class={styles.kicker}>What we service</p>
        <h2>Systems, repairs, and the air in between</h2>
        <p>
          The list below is the typical scope for this trade. {business.shortName} confirms which of
          these it actually offers before launch.
        </p>
      </div>

      <div class={styles.systemGrid}>
        {#each content.offerings as offering, index}
          <article class={styles.system}>
            <div class={styles.systemTop}>
              <span class={styles.systemIndex}>{String(index + 1).padStart(2, '0')}</span>
              <span class={styles.systemCategory}>{offering.category}</span>
            </div>
            <h3><a href={`/services/${offering.id}`}>{offering.name}</a></h3>
            <p class={styles.systemSummary}>{offering.summary}</p>
            <ul class={styles.systemFeatures}>
              {#each offering.features as feature}
                <li>{feature}</li>
              {/each}
            </ul>
            <p class={styles.systemDuration}>{offering.duration}</p>
          </article>
        {/each}
      </div>
    </div>
  </section>

  <section class={styles.process} id="process">
    <div class="shell">
      <div class={styles.processHead}>
        <p class={styles.kicker}>The visit</p>
        <h2>Measured first, then fixed</h2>
      </div>
      <ol class={styles.timeline}>
        {#each content.process as step, index}
          <li class={styles.timelineItem}>
            <span class={styles.timelineStep}>{index + 1}</span>
            <div class={styles.timelineBody}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          </li>
        {/each}
      </ol>
    </div>
  </section>

  {#if proof}
    <section class={styles.reviews} id="reviews">
      <div class="shell">
        <div class={styles.reviewsInner}>
          <div class={styles.reviewsScore}>
            <strong>{proof.rating.toFixed(1)}</strong>
            <span>{proof.reviewCount ? `${proof.reviewCount} reviews` : 'reviews'}</span>
          </div>
          <p class={styles.reviewsNote}>
            Published on {proof.source} for {business.name}. Shown exactly as it is listed.
          </p>
        </div>
      </div>
    </section>
  {/if}

  <section class={styles.faq} id="faq">
    <div class="shell">
      <div class={styles.sectionHead}>
        <p class={styles.kicker}>Before you book</p>
        <h2>Common questions</h2>
      </div>
      <div class={styles.faqList}>
        {#each content.faq as item, index}
          <details class={styles.faqItem} open={index === 0}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        {/each}
      </div>
    </div>
  </section>

  <section class={styles.booking} id="booking">
    <div class="shell">
      <div class={styles.bookingGrid}>
        <div class={styles.bookingCopy}>
          <p class={styles.kicker}>Request service</p>
          <h2>Tell us what the system is doing</h2>
          <p>
            Send the symptom, the age of the equipment if you know it, and the timing that works.
            {business.shortName} reviews the request and replies with next steps.
          </p>
          {#if phone}
            <p class={styles.bookingPhone}>Prefer to talk? <a href={phone.dial}>{phone.display}</a></p>
          {/if}
        </div>
        <div class={styles.bookingForm}>
          <BookingForm booking={content.booking} phone={phone} businessName={business.name} />
        </div>
      </div>
    </div>
  </section>
</div>

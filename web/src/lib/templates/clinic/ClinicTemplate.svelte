<script lang="ts">
  import BookingForm from '$lib/components/BookingForm.svelte';
  import type { SiteContent } from '$lib/content/types';
  import styles from './ClinicTemplate.module.css';

  let { content }: { content: SiteContent } = $props();

  const business = $derived(content.business);
  const location = $derived(business.locations[0] ?? null);
  const phone = $derived(business.phone);
  const email = $derived(business.email);
</script>

<div class={styles.page}>
  <section class={styles.hero}>
    <div class="shell">
      <div class={styles.heroGrid}>
        <div class={styles.heroCopy}>
          <p class="eyebrow">{content.hero.eyebrow}</p>
          <h1>{content.hero.headline}</h1>
          <p class={styles.subhead}>{content.hero.subhead}</p>
          <div class={styles.actions}>
            <a class="button button--accent" href={content.hero.primaryHref}>{content.hero.primaryCta}</a>
            <a class="button button--ghost" href={content.hero.secondaryHref}>{content.hero.secondaryCta}</a>
          </div>

          {#if content.hero.trust.length > 0}
            <ul class={styles.trust}>
              {#each content.hero.trust as item}
                <li>{item}</li>
              {/each}
            </ul>
          {/if}
        </div>

        <div class={styles.heroMedia}>
          <img src={content.hero.image} alt={content.hero.imageAlt} width="1200" height="1200" fetchpriority="high" />
          {#if content.proof}
            <div class={styles.proofCard}>
              <strong>{content.proof.rating.toFixed(1)}</strong>
              <span aria-hidden="true">★★★★★</span>
              <small>{content.proof.reviewCount ?? 'Public'} {content.proof.source}</small>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="treatments">
    <div class="shell">
      <div class={styles.sectionHead}>
        <p class="eyebrow">Care options</p>
        <h2>Start with the right assessment.</h2>
        <p>Every option opens to a detail page with candidacy, expectations, and next steps.</p>
      </div>

      <div class={styles.grid}>
        {#each content.offerings as offering}
          <article class={styles.card}>
            <span class={styles.chip}>{offering.category}</span>
            <h3><a href={`/services/${offering.id}`}>{offering.name}</a></h3>
            <p>{offering.summary}</p>
            <dl>
              <div>
                <dt>Best for</dt>
                <dd>{offering.audience}</dd>
              </div>
              <div>
                <dt>Visit</dt>
                <dd>{offering.duration}</dd>
              </div>
            </dl>
            <a class={styles.cardLink} href={`/services/${offering.id}`}>Read the details</a>
          </article>
        {/each}
      </div>
    </div>
  </section>

  <section class={styles.approach} id="approach">
    <div class="shell">
      <div class={styles.approachGrid}>
        <div>
          <p class="eyebrow">Your visit</p>
          <h2>Measured care, explained plainly.</h2>
          <p>No pressure to decide before you understand the options, the tradeoffs, and the cost.</p>
          {#if phone}
            <a class={styles.phoneLink} href={phone.dial}>{phone.display}</a>
          {/if}
        </div>
        <ol class={styles.timeline}>
          {#each content.process as step, index}
            <li>
              <span aria-hidden="true"></span>
              <div>
                <p class={styles.stepLabel}>Step {index + 1}</p>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          {/each}
        </ol>
      </div>
    </div>
  </section>

  <section class={styles.proof} id="reviews">
    <div class="shell">
      <div class={styles.proofInner}>
        <div>
          <p class="eyebrow">Patient feedback</p>
          <h2>Public ratings, kept in context.</h2>
          <p>This preview shows only the published rating and count from the prospect record. It does not invent patient quotes.</p>
        </div>
        {#if content.proof}
          <div class={styles.proofScore}>
            <strong>{content.proof.rating.toFixed(1)}</strong>
            <span aria-hidden="true">★★★★★</span>
            <small>{content.proof.reviewCount ?? 'Published'} {content.proof.source}</small>
          </div>
        {/if}
      </div>
    </div>
  </section>

  <section class="section" id="faq">
    <div class="shell">
      <div class={styles.faqGrid}>
        <div>
          <p class="eyebrow">Questions</p>
          <h2>What to know before booking.</h2>
          {#if phone}
            <p>Call <a href={phone.dial}>{phone.display}</a> if your question is not answered here.</p>
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
          <p class="eyebrow">Consultation</p>
          <h2>Request a consultation.</h2>
          <p>Share your details and {business.shortName} will contact you to schedule.</p>

          <dl>
            {#if phone}
              <div><dt>Phone</dt><dd><a href={phone.dial}>{phone.display}</a></dd></div>
            {/if}
            {#if email}
              <div><dt>Email</dt><dd><a href={`mailto:${email}`}>{email}</a></dd></div>
            {/if}
            {#if location}
              <div><dt>Location</dt><dd>{[location.streetAddress, location.city, location.region].filter(Boolean).join(', ')}</dd></div>
            {/if}
          </dl>
        </div>
        <div class={styles.formPanel}>
          <BookingForm booking={content.booking} {phone} />
        </div>
      </div>
    </div>
  </section>
</div>

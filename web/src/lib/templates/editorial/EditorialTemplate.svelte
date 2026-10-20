<script lang="ts">
  import BookingForm from '$lib/components/BookingForm.svelte';
  import type { SiteContent } from '$lib/content/types';
  import styles from './EditorialTemplate.module.css';

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

        <figure class={styles.heroMedia}>
          <img src={content.hero.image} alt={content.hero.imageAlt} width="1200" height="1400" fetchpriority="high" />
          {#if location}
            <figcaption>
              <span>{business.descriptor}</span>
              <span>{[location.city, location.region].filter(Boolean).join(', ')}</span>
            </figcaption>
          {/if}
        </figure>
      </div>
    </div>
  </section>

  <section class="section" id="treatments">
    <div class="shell">
      <div class={styles.sectionHead}>
        <div>
          <p class="eyebrow">Services</p>
          <h2>Choose the service that fits the job.</h2>
        </div>
        <p>Each service opens to a detail page with what is included and a direct way to request an appointment.</p>
      </div>

      <div class={styles.offeringList}>
        {#each content.offerings as offering, index}
          <article class={styles.offering}>
            <span class={styles.offeringNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <div class={styles.offeringMeta}>
              <span>{offering.category}</span>
              <span>{offering.duration}</span>
            </div>
            <div class={styles.offeringBody}>
              <h3><a href={`/services/${offering.id}`}>{offering.name}</a></h3>
              <p>{offering.summary}</p>
              <ul>
                {#each offering.features as feature}
                  <li>{feature}</li>
                {/each}
              </ul>
            </div>
            <a class={styles.offeringLink} href={`/services/${offering.id}`} aria-label={`View ${offering.name}`}>View →</a>
          </article>
        {/each}
      </div>
    </div>
  </section>

  <section class="section" id="approach">
    <div class="shell">
      <div class={styles.processHead}>
        <p class="eyebrow">The process</p>
        <h2>A clear process from the first conversation.</h2>
        {#if phone}
          <a class={styles.textLink} href={phone.dial}>Call {phone.display}</a>
        {/if}
      </div>

      <ol class={styles.processGrid}>
        {#each content.process as step, index}
          <li>
            <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>
        {/each}
      </ol>
    </div>
  </section>

  {#if content.proof}
    <section class={styles.proof} id="reviews">
      <div class="shell">
        <div class={styles.proofInner}>
          <div>
            <p class="eyebrow">Reputation</p>
            <h2>Public review signals, not invented testimonials.</h2>
            <p>This preview uses the rating and review count from the prospect record. It does not fabricate quotes or client names.</p>
          </div>
          <div class={styles.ratingCard}>
            <strong>{content.proof.rating.toFixed(1)}</strong>
            <span aria-hidden="true">★★★★★</span>
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

  <section class="section" id="faq">
    <div class="shell">
      <div class={styles.faqGrid}>
        <div>
          <p class="eyebrow">Questions</p>
          <h2>What customers ask before they book.</h2>
          {#if phone}
            <p class={styles.faqNote}>Prefer to talk? Call <a href={phone.dial}>{phone.display}</a>.</p>
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

  <section class="section" id="booking">
    <div class="shell">
      <div class={styles.bookingGrid}>
        <div class={styles.bookingCopy}>
          <p class="eyebrow">Appointment</p>
          <h2>Request an appointment.</h2>
          <p>Share a few details and {business.shortName} will follow up using the contact information you provide.</p>

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

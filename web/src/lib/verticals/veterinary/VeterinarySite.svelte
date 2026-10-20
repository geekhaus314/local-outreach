<script lang="ts">
  import BookingForm from '$lib/components/BookingForm.svelte';
  import type { SiteContent } from '$lib/content/types';
  import styles from './VeterinarySite.module.css';

  let { content }: { content: SiteContent } = $props();

  const business = $derived(content.business);
  const location = $derived(business.locations[0] ?? null);
  const phone = $derived(business.phone);
  const email = $derived(business.email);
  const offerings = $derived(content.offerings);
</script>

<div class={styles.page}>
  <section class={styles.hero}>
    <div class="shell">
      <div class={styles.heroGrid}>
        <div>
          <p class={styles.eyebrow}>{content.hero.eyebrow}</p>
          <h1>{content.hero.headline}</h1>
          <p class={styles.subhead}>{content.hero.subhead}</p>

          <div class={styles.actions}>
            <a class={styles.primary} href={content.hero.primaryHref}>{content.hero.primaryCta}</a>
            <a class={styles.secondary} href={content.hero.secondaryHref}>{content.hero.secondaryCta}</a>
          </div>

          {#if content.hero.trust.length > 0}
            <ul class={styles.trust}>
              {#each content.hero.trust as item}
                <li>{item}</li>
              {/each}
            </ul>
          {/if}
        </div>

        <aside class={styles.visitPanel} aria-label="Contact and urgent care">
          <p class={styles.panelLabel}>Request or call</p>
          <p class={styles.panelHeadline}>{phone ? phone.display : 'Call the practice'}</p>
          {#if location}
            <p class={styles.panelAddress}>
              {[location.streetAddress, location.city, location.region].filter(Boolean).join(', ')}
            </p>
          {/if}
          <div class={styles.urgent}>
            <strong>Urgent?</strong>
            <span>Call before using the form. Breathing trouble, bleeding, poisoning, or collapse should not wait for a reply.</span>
          </div>
          {#if phone}
            <a class={styles.panelCall} href={phone.dial}>Call {phone.display}</a>
          {/if}
        </aside>
      </div>
    </div>
  </section>

  <section class={styles.care} id="care">
    <div class="shell">
      <header class={styles.sectionHead}>
        <p class={styles.eyebrow}>Visit types</p>
        <h2>What kind of visit is this?</h2>
        <p>The practice confirms what it can treat. This preview does not promise a service the team has not listed.</p>
      </header>

      {#if offerings.length === 0}
        <p class={styles.empty} role="status">Visit types have not been published for this preview. Call the practice.</p>
      {:else}
        <div class={styles.cards}>
          {#each offerings as item, index}
            <article class={styles.card}>
              <div class={styles.cardTop}>
                <span class={styles.cardIndex} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span class={styles.cardCategory}>{item.category}</span>
              </div>
              <h3><a href={`/services/${item.id}`}>{item.name}</a></h3>
              <p>{item.summary}</p>
              <ul>
                {#each item.features as feature}
                  <li>{feature}</li>
                {/each}
              </ul>
              <div class={styles.cardFoot}>
                <span>{item.duration}</span>
                <a href={`/services/${item.id}`} aria-label={`More about ${item.name}`}>Details</a>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </div>
  </section>

  <section class={styles.process} id="process">
    <div class="shell">
      <div class={styles.processHead}>
        <p class={styles.eyebrow}>What to expect</p>
        <h2>Tell us, triage, then visit.</h2>
      </div>
      <ol class={styles.steps}>
        {#each content.process as step, index}
          <li>
            <span class={styles.stepNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
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
            <p class={styles.eyebrow}>Public signal</p>
            <h2>What pet owners see on the listing.</h2>
            <p>
              The rating and review count come from the public record. No client quotes or pet
              stories are invented here.
            </p>
          </div>
          <div class={styles.rating}>
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

  <section class={styles.faq} id="faq">
    <div class="shell">
      <div class={styles.faqGrid}>
        <div>
          <p class={styles.eyebrow}>Before you book</p>
          <h2>Questions to settle first.</h2>
          {#if phone}
            <p class={styles.note}>Call <a href={phone.dial}>{phone.display}</a> for anything urgent.</p>
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
        <div>
          <p class={styles.eyebrow}>{content.hero.primaryCta}</p>
          <h2>Request a non-urgent visit.</h2>
          <p class={styles.note}>
            {business.shortName} will follow up using the details you provide. A request is not a
            confirmed appointment.
          </p>

          <div class={styles.urgentInline}>
            <strong>For an emergency, call.</strong>
            {#if phone}
              <a href={phone.dial}>{phone.display}</a>
            {:else}
              <span>Use the practice’s listed number.</span>
            {/if}
          </div>

          <dl class={styles.contact}>
            {#if email}
              <div><dt>Email</dt><dd><a href={`mailto:${email}`}>{email}</a></dd></div>
            {/if}
            {#if location}
              <div>
                <dt>Practice</dt>
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

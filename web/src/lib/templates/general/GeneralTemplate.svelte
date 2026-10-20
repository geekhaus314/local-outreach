<script lang="ts">
  import BookingForm from '$lib/components/BookingForm.svelte';
  import type { SiteContent } from '$lib/content/types';
  import styles from './GeneralTemplate.module.css';

  let { content }: { content: SiteContent } = $props();

  const business = $derived(content.business);
  const location = $derived(business.locations[0] ?? null);
  const phone = $derived(business.phone);
  const email = $derived(business.email);
</script>

<div class={styles.page}>
  <section class={styles.hero}>
    <div class="shell">
      <div class={styles.heroCard}>
        <div class={styles.heroCopy}>
          <p class="eyebrow">{content.hero.eyebrow}</p>
          <h1>{content.hero.headline}</h1>
          <p class={styles.subhead}>{content.hero.subhead}</p>
          <div class={styles.actions}>
            <a class="button button--accent" href={content.hero.primaryHref}>{content.hero.primaryCta}</a>
            <a class="button button--ghost" href={content.hero.secondaryHref}>{content.hero.secondaryCta}</a>
          </div>
        </div>
        <div class={styles.heroImage}>
          <img src={content.hero.image} alt={content.hero.imageAlt} width="1200" height="1000" fetchpriority="high" />
        </div>
        <div class={styles.heroAside}>
          {#if phone}
            <p class={styles.asideLabel}>Call</p>
            <a class={styles.asideValue} href={phone.dial}>{phone.display}</a>
          {/if}
          {#if location}
            <p class={styles.asideLabel}>Visit</p>
            <p class={styles.asideText}>{[location.streetAddress, location.city, location.region].filter(Boolean).join(', ')}</p>
          {/if}
          {#if email}
            <p class={styles.asideLabel}>Email</p>
            <a class={styles.asideText} href={`mailto:${email}`}>{email}</a>
          {/if}
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="treatments">
    <div class="shell">
      <div class={styles.sectionHead}>
        <div>
          <p class="eyebrow">Services</p>
          <h2>Practical help, clearly described.</h2>
        </div>
        <p>Every service links to a detail page with what is included and a request form.</p>
      </div>

      <div class={styles.grid}>
        {#each content.offerings as offering, index}
          <article class={styles.card}>
            <div class={styles.cardTop}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <span>{offering.category}</span>
            </div>
            <h3><a href={`/services/${offering.id}`}>{offering.name}</a></h3>
            <p>{offering.summary}</p>
            <ul>
              {#each offering.features as feature}
                <li>{feature}</li>
              {/each}
            </ul>
            <div class={styles.cardFoot}>
              <span>{offering.duration}</span>
              <a href={`/services/${offering.id}`}>Learn more</a>
            </div>
          </article>
        {/each}
      </div>
    </div>
  </section>

  <section class={styles.process} id="approach">
    <div class="shell">
      <div class={styles.sectionHead}>
        <div>
          <p class="eyebrow">How it works</p>
          <h2>Keep it simple.</h2>
        </div>
        <p>Clear steps, direct communication, and no surprise handoffs.</p>
      </div>

      <ol class={styles.steps}>
        {#each content.process as step, index}
          <li>
            <span>{String(index + 1).padStart(2, '0')}</span>
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
            <h2>What the public record says.</h2>
            <p>Rating and review count come from the prospect record. No invented quotes.</p>
          </div>
          <div class={styles.proofScore}>
            <strong>{content.proof.rating.toFixed(1)}</strong>
            <span aria-hidden="true">★★★★★</span>
            <small>{content.proof.reviewCount ?? 'Published'} {content.proof.source}</small>
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
          <h2>Good to know.</h2>
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
      <div class={styles.bookingCard}>
        <div class={styles.bookingCopy}>
          <p class="eyebrow">Contact</p>
          <h2>Send a request.</h2>
          <p>{business.shortName} will follow up using the contact details you provide.</p>
          {#if phone}
            <a class={styles.phoneLink} href={phone.dial}>{phone.display}</a>
          {/if}
        </div>
        <div class={styles.formPanel}>
          <BookingForm booking={content.booking} {phone} />
        </div>
      </div>
    </div>
  </section>
</div>

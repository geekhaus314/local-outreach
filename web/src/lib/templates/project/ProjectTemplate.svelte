<script lang="ts">
  import BookingForm from '$lib/components/BookingForm.svelte';
  import type { SiteContent } from '$lib/content/types';
  import styles from './ProjectTemplate.module.css';

  let { content }: { content: SiteContent } = $props();

  const business = $derived(content.business);
  const location = $derived(business.locations[0] ?? null);
  const phone = $derived(business.phone);
</script>

<div class={styles.page}>
  <section class={styles.hero}>
    <div class="shell">
      <div class={styles.heroFrame}>
        <img src={content.hero.image} alt={content.hero.imageAlt} width="1800" height="1100" fetchpriority="high" />
        <div class={styles.heroOverlay}>
          <p class={styles.heroLabel}>{content.hero.eyebrow}</p>
          <h1>{content.hero.headline}</h1>
          <p>{content.hero.subhead}</p>
          <div class={styles.actions}>
            <a class="button button--accent" href={content.hero.primaryHref}>{content.hero.primaryCta}</a>
            <a class={styles.ghostLink} href={content.hero.secondaryHref}>{content.hero.secondaryCta}</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class={styles.intro}>
    <div class="shell">
      <div class={styles.introGrid}>
        <p class={styles.introText}>{content.hero.trust.join(' · ')}</p>
        {#if location}
          <p class={styles.introMeta}>
            Serving {location.city}{location.region ? `, ${location.region}` : ''}
            {#if phone} · <a href={phone.dial}>{phone.display}</a>{/if}
          </p>
        {/if}
      </div>
    </div>
  </section>

  <section class="section" id="treatments">
    <div class="shell">
      <div class={styles.sectionHead}>
        <p class="eyebrow">What we do</p>
        <h2>Built around the property, not a package.</h2>
        <p>Each service page explains the work, the timing, and what the business needs from you.</p>
      </div>

      <div class={styles.projectList}>
        {#each content.offerings as offering, index}
          <article class={styles.project}>
            <div class={styles.projectImage}>
              <img src={offering.image} alt={offering.imageAlt} width="900" height="700" loading="lazy" />
            </div>
            <div class={styles.projectBody}>
              <p class={styles.projectMeta}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span>{offering.category}</span>
              </p>
              <h3><a href={`/services/${offering.id}`}>{offering.name}</a></h3>
              <p>{offering.summary}</p>
              <ul>
                {#each offering.features as feature}
                  <li>{feature}</li>
                {/each}
              </ul>
              <div class={styles.projectFoot}>
                <span>{offering.duration}</span>
                <a href={`/services/${offering.id}`}>See the scope →</a>
              </div>
            </div>
          </article>
        {/each}
      </div>
    </div>
  </section>

  <section class={styles.process} id="approach">
    <div class="shell">
      <div class={styles.processGrid}>
        <div>
          <p class="eyebrow">The build</p>
          <h2>One crew, one plan, one point of contact.</h2>
          <p>The process is designed to keep the scope visible from the first walkthrough to the final cleanup.</p>
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

  {#if content.proof}
    <section class={styles.proof} id="reviews">
      <div class="shell">
        <div class={styles.proofInner}>
          <div>
            <p class="eyebrow">Local reputation</p>
            <h2>Reviewed by neighbors.</h2>
            <p>Rating and review count come from the public prospect record. No stock testimonials.</p>
          </div>
          <div class={styles.proofScore}>
            <strong>{content.proof.rating.toFixed(1)}</strong>
            <div>
              <span aria-hidden="true">★★★★★</span>
              <small>{content.proof.reviewCount ?? 'Published'} {content.proof.source}</small>
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
          <p class="eyebrow">Before the estimate</p>
          <h2>Straight answers.</h2>
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
          <p class="eyebrow">Estimate</p>
          <h2>Request a walkthrough.</h2>
          <p>Tell {business.shortName} what you are planning. The business will follow up to schedule an on-site estimate.</p>
          {#if phone}
            <a class={styles.phoneLink} href={phone.dial}>{phone.display}</a>
          {/if}
          {#if location}
            <p class={styles.area}>{[location.city, location.region].filter(Boolean).join(', ')}</p>
          {/if}
        </div>
        <div class={styles.formPanel}>
          <BookingForm booking={content.booking} {phone} />
        </div>
      </div>
    </div>
  </section>
</div>

<script lang="ts">
  import BookingForm from '$lib/components/BookingForm.svelte';
  import type { SiteContent } from '$lib/content/types';
  import styles from './RestaurantSite.module.css';

  let { content }: { content: SiteContent } = $props();

  const business = $derived(content.business);
  const location = $derived(business.locations[0] ?? null);
  const phone = $derived(business.phone);
  const email = $derived(business.email);
  const offerings = $derived(content.offerings);

  function areaLine(): string {
    if (!location) return 'Ask for the current location';
    return [location.streetAddress, location.city, location.region].filter(Boolean).join(', ');
  }
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

        <aside class={styles.visitCard}>
          <figure class={styles.heroFigure}>
            <img src={content.hero.image} alt={content.hero.imageAlt} width="1200" height="900" fetchpriority="high" />
          </figure>
          <div class={styles.visitBody}>
            <p class={styles.cardLabel}>Before you go</p>
            <p class={styles.visitLine}>{areaLine()}</p>
            <dl class={styles.visitList}>
              <div>
                <dt>Hours</dt>
                <dd>Call for the current schedule</dd>
              </div>
              <div>
                <dt>Menu</dt>
                <dd>Ask what is on today</dd>
              </div>
              <div>
                <dt>Tables</dt>
                <dd>Confirmed by the restaurant</dd>
              </div>
            </dl>
            {#if phone}
              <a class={styles.visitCall} href={phone.dial}>Call {phone.display}</a>
            {/if}
          </div>
        </aside>
      </div>
    </div>
  </section>

  <section class={styles.menu} id="menu">
    <div class="shell">
      <header class={styles.sectionHead}>
        <p class={styles.eyebrow}>The table</p>
        <h2>What you can ask about.</h2>
        <p>
          These are the ways to visit, not a printed menu. Dishes, prices, and hours come from the
          restaurant, never from this preview.
        </p>
      </header>

      {#if offerings.length === 0}
        <p class={styles.empty} role="status">The service list has not been published for this preview. Call the restaurant.</p>
      {:else}
        <div class={styles.bill}>
          {#each offerings as item, index}
            <article class={styles.billItem}>
              <span class={styles.billNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div class={styles.billBody}>
                <div class={styles.billTitle}>
                  <h3><a href={`/services/${item.id}`}>{item.name}</a></h3>
                  <span class={styles.leader} aria-hidden="true"></span>
                  <span class={styles.billMeta}>{item.category}</span>
                </div>
                <p>{item.summary}</p>
                <ul class={styles.billFeatures}>
                  {#each item.features as feature}
                    <li>{feature}</li>
                  {/each}
                </ul>
                <a class={styles.billLink} href={`/services/${item.id}`} aria-label={`More about ${item.name}`}>Details</a>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </div>
  </section>

  <section class={styles.process} id="process">
    <div class="shell">
      <div class={styles.processGrid}>
        <div>
          <p class={styles.eyebrow}>How it works</p>
          <h2>Check, ask, then confirm.</h2>
          {#if phone}
            <p class={styles.note}>Prefer to call? <a href={phone.dial}>{phone.display}</a></p>
          {/if}
        </div>
        <ol class={styles.steps}>
          {#each content.process as step, index}
            <li>
              <span class={styles.stepNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
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
            <p class={styles.proofLabel}>Public signal</p>
            <h2>What the review count says.</h2>
            <p>
              The rating comes from the public listing. No quotes, names, or dishes are invented for
              this preview.
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
          <p class={styles.eyebrow}>Before you ask</p>
          <h2>Questions worth settling by phone.</h2>
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
          <h2>Send the details. Let the restaurant confirm.</h2>
          <p class={styles.note}>
            {business.shortName} will follow up using the contact details you provide. A request is
            not a confirmed table.
          </p>

          <dl class={styles.contact}>
            {#if phone}
              <div><dt>Phone</dt><dd><a href={phone.dial}>{phone.display}</a></dd></div>
            {/if}
            {#if email}
              <div><dt>Email</dt><dd><a href={`mailto:${email}`}>{email}</a></dd></div>
            {/if}
            {#if location}
              <div><dt>Address</dt><dd>{areaLine()}</dd></div>
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

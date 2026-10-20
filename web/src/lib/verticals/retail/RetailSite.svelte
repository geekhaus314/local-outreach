<script lang="ts">
  import BookingForm from '$lib/components/BookingForm.svelte';
  import type { SiteContent } from '$lib/content/types';
  import styles from './RetailSite.module.css';

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
        <div class={styles.heroCopy}>
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

        <div class={styles.heroMedia}>
          <img src={content.hero.image} alt={content.hero.imageAlt} width="800" height="600" fetchpriority="high" />
          <div class={styles.heroTicket}>
            <p class={styles.ticketLabel}>Before you drive</p>
            <dl>
              <div><dt>Stock</dt><dd>Confirmed by the store</dd></div>
              <div><dt>Hours</dt><dd>Call for the current schedule</dd></div>
              {#if location}
                <div>
                  <dt>Find us</dt>
                  <dd>{[location.streetAddress, location.city].filter(Boolean).join(', ')}</dd>
                </div>
              {/if}
            </dl>
            {#if phone}
              <a class={styles.ticketCall} href={phone.dial}>Call {phone.display}</a>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class={styles.departments} id="departments">
    <div class="shell">
      <header class={styles.sectionHead}>
        <p class={styles.eyebrow}>The floor</p>
        <h2>Departments and counter services.</h2>
        <p>This is how the store can help, not a live inventory. Ask about the exact model, size, or brand before you travel.</p>
      </header>

      {#if offerings.length === 0}
        <p class={styles.empty} role="status">The department list has not been published for this preview. Call the store.</p>
      {:else}
        <div class={styles.grid}>
          {#each offerings as item, index}
            <article class={styles.tile}>
              <span class={styles.tileIndex} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <p class={styles.tileCategory}>{item.category}</p>
              <h3><a href={`/services/${item.id}`}>{item.name}</a></h3>
              <p>{item.summary}</p>
              <ul>
                {#each item.features as feature}
                  <li>{feature}</li>
                {/each}
              </ul>
              <div class={styles.tileFoot}>
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
      <div class={styles.processGrid}>
        <div>
          <p class={styles.eyebrow}>At the counter</p>
          <h2>Check, reserve, collect.</h2>
          {#if phone}
            <p class={styles.note}>Call <a href={phone.dial}>{phone.display}</a> for a stock question.</p>
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
            <h2>Shoppers rate the store.</h2>
            <p>The rating and count come from the public listing. No customer quotes or product claims are invented here.</p>
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
          <p class={styles.eyebrow}>Before you buy</p>
          <h2>Policy questions to ask first.</h2>
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
          <h2>Send the item. Get a real answer.</h2>
          <p class={styles.note}>
            {business.shortName} will follow up using the details you provide. A request does not
            reserve stock until the store confirms it.
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
                <dt>Store</dt>
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

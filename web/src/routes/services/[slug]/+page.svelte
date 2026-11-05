<script lang="ts">
  import type { PageData } from './$types';
  import AgencyChrome from '$lib/components/agency/AgencyChrome.svelte';
  import styles from '$lib/components/agency/AgencyContent.module.css';
  import {
    AGENCY_CONTACT,
    agencyServices,
    serviceJsonLd
  } from '$lib/data/agency-content';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  {#if data.mode === 'tenant'}
    <title>{data.treatment.name} | {data.tenant.business.name}</title>
    <meta name="description" content={data.treatment.summary} />
  {:else}
    <title>{data.service.name} — Web Rehab STL</title>
    <meta name="description" content={data.service.summary} />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href={`${AGENCY_CONTACT.url}/services/${data.service.slug}`} />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={`${data.service.name} — Web Rehab STL`} />
    <meta property="og:description" content={data.service.summary} />
    <meta property="og:url" content={`${AGENCY_CONTACT.url}/services/${data.service.slug}`} />
    <script type="application/ld+json">
      {JSON.stringify(serviceJsonLd(data.service))}
    </script>
  {/if}
</svelte:head>

{#if data.mode === 'tenant'}
  {@const tenant = data.tenant}
  {@const treatment = data.treatment}
  {@const phone = tenant.business.phone}
  {@const related = tenant.offerings.filter((item) => item.id !== treatment.id).slice(0, 2)}

  <section class="detail">
    <div class="shell detailGrid">
      <div class="detailCopy">
        <a class="back" href="/#treatments">← All services</a>
        <p class="eyebrow">{treatment.category}</p>
        <h1>{treatment.name}</h1>
        <p class="summary">{treatment.summary}</p>
        <p class="description">{treatment.description}</p>

        <ul class="features">
          {#each treatment.features as feature}
            <li>{feature}</li>
          {/each}
        </ul>

        <dl>
          <div>
            <dt>Who it is for</dt>
            <dd>{treatment.audience}</dd>
          </div>
          <div>
            <dt>Time commitment</dt>
            <dd>{treatment.duration}</dd>
          </div>
          {#if treatment.priceFrom}
            <div>
              <dt>Starting price</dt>
              <dd>{treatment.priceFrom}</dd>
            </div>
          {/if}
        </dl>

        {#if treatment.pricing && treatment.pricing.length > 0}
          <div class="pricing">
            <h2>Pricing bands</h2>
            {#each treatment.pricing as tier}
              <div class="priceRow">
                <span>{tier.label}</span>
                <span>{tier.price}</span>
                {#if tier.note}
                  <small>{tier.note}</small>
                {/if}
              </div>
            {/each}
          </div>
        {/if}

        <div class="actions">
          <a class="button button--accent" href="/#booking">Request a consultation</a>
          {#if phone}
            <a class="button button--ghost" href={phone.dial}>Call {phone.display}</a>
          {/if}
        </div>
      </div>

      <aside class="detailMedia">
        <img src={treatment.image} alt={treatment.imageAlt} width="800" height="600" />
      </aside>
    </div>
  </section>

  {#if related.length > 0}
    <section class="section related">
      <div class="shell">
        <p class="eyebrow">Other services</p>
        <h2>Compare the next option.</h2>
        <div class="relatedGrid">
          {#each related as item}
            <a class="relatedCard" href={`/services/${item.id}`}>
              <span>{item.category}</span>
              <strong>{item.name}</strong>
              <span>{item.summary}</span>
            </a>
          {/each}
        </div>
      </div>
    </section>
  {/if}
{:else}
  {@const service = data.service}
  {@const related = agencyServices.filter((item) => item.slug !== service.slug).slice(0, 3)}

  <AgencyChrome current="/services">
    <section class={styles.hero}>
      <div class={styles.heroGrid} aria-hidden="true"></div>
      <div class={styles.shell}>
        <div class={styles.heroInner}>
          <a class={styles.breadcrumb} href="/services">← All services</a>
          <p class={styles.eyebrow}>{service.shortName}</p>
          <h1 class={styles.title}>{service.name}</h1>
          <p class={styles.lede}>{service.summary}</p>
          <div class={styles.actions}>
            <a class={styles.button} href="/#checkup">Get the free checkup</a>
            <a class={styles.buttonGhost} href={`tel:${AGENCY_CONTACT.phone}`}>
              Call {AGENCY_CONTACT.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class={styles.section}>
      <div class={styles.shell}>
        <div class={styles.split}>
          <div>
            <h2 class={styles.sectionTitle}>What this covers</h2>
            <p class={styles.prose}>{service.description}</p>
            <h3 class={styles.cardTitle}>Who it is for</h3>
            <p class={styles.prose}>{service.audience}</p>
            <h3 class={styles.cardTitle}>What you get</h3>
            <ul class={styles.cardList}>
              {#each service.deliverables as item}
                <li>{item}</li>
              {/each}
            </ul>
          </div>
          <aside class={styles.sideCard}>
            <h2>Outcome</h2>
            <ul>
              {#each service.outcomes as outcome}
                <li>{outcome}</li>
              {/each}
            </ul>
            <h2 style="margin-top: 1.4rem;">Start here</h2>
            <ul>
              <li><a href="/#checkup">Free 38-point checkup</a></li>
              <li><a href={`tel:${AGENCY_CONTACT.phone}`}>{AGENCY_CONTACT.phoneDisplay}</a></li>
              <li><a href={`mailto:${AGENCY_CONTACT.email}`}>{AGENCY_CONTACT.email}</a></li>
            </ul>
          </aside>
        </div>
      </div>
    </section>

    <section class={`${styles.section} ${styles.sectionAlt}`}>
      <div class={styles.shell}>
        <h2 class={styles.sectionTitle}>Other services</h2>
        <div class={styles.grid3}>
          {#each related as item (item.slug)}
            <a class={`${styles.card} ${styles.cardLink}`} href={`/services/${item.slug}`}>
              <p class={styles.cardLabel}>{item.shortName}</p>
              <h3 class={styles.cardTitle}>{item.name}</h3>
              <p class={styles.cardText}>{item.summary}</p>
              <div class={styles.cardSpacer}></div>
              <p class={styles.cardFoot}>Read the details →</p>
            </a>
          {/each}
        </div>
      </div>
    </section>

    <section class={styles.section}>
      <div class={styles.shell}>
        <div class={styles.contactBand}>
          <div>
            <h2>Not sure this is the right service?</h2>
            <p>The free checkup tells you what the site actually needs.</p>
          </div>
          <div class={styles.actions}>
            <a class={styles.button} href="/#checkup">Request the free checkup</a>
          </div>
        </div>
      </div>
    </section>
  </AgencyChrome>
{/if}

<style>
  .detail {
    padding-block: clamp(2.5rem, 6vw, 5rem);
  }

  .detailGrid {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: clamp(2rem, 6vw, 5rem);
    align-items: start;
  }

  .back {
    display: inline-block;
    margin-bottom: 1.75rem;
    color: var(--color-text-muted);
    font-size: 0.82rem;
    text-decoration: none;
  }

  .back:hover {
    color: var(--color-text);
  }

  h1 {
    max-width: 13ch;
    font-size: clamp(2.5rem, 5vw, 4rem);
    letter-spacing: -0.03em;
  }

  .summary {
    max-width: 38rem;
    margin-top: 1.25rem;
    font-size: 1.15rem;
  }

  .description {
    max-width: 40rem;
    margin-top: 1rem;
    color: var(--color-text-muted);
  }

  .features {
    display: grid;
    gap: 0.6rem;
    margin: 2rem 0 0;
    padding: 0;
    list-style: none;
  }

  .features li {
    position: relative;
    padding-left: 1.2rem;
    color: var(--color-text-muted);
  }

  .features li::before {
    position: absolute;
    top: 0.62em;
    left: 0;
    width: 0.42rem;
    height: 0.42rem;
    border-radius: 999px;
    background: var(--color-accent);
    content: '';
  }

  dl {
    display: grid;
    gap: 1rem;
    margin: 2rem 0 0;
  }

  dt {
    color: var(--color-text-muted);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  dd {
    margin: 0.15rem 0 0;
  }

  .pricing {
    display: grid;
    gap: 0.4rem;
    margin-top: 2rem;
    padding: 1.25rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
  }

  .pricing h2 {
    margin-bottom: 0.5rem;
    font-family: var(--font-body);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .priceRow {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.2rem 1rem;
    padding-block: 0.5rem;
    border-top: 1px solid var(--color-border);
  }

  .priceRow small {
    grid-column: 1 / -1;
    color: var(--color-text-muted);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    margin-top: 2rem;
  }

  .detailMedia img {
    width: 100%;
    border-radius: var(--radius);
    box-shadow: var(--shadow-card);
  }

  .related {
    border-top: 1px solid var(--color-border);
    background: var(--color-bg-alt);
  }

  .related h2 {
    max-width: 16ch;
    font-size: clamp(1.8rem, 3.5vw, 2.8rem);
  }

  .relatedGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 2rem;
  }

  .relatedCard {
    display: grid;
    gap: 0.35rem;
    padding: 1.25rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    text-decoration: none;
  }

  .relatedCard span:first-child {
    color: var(--color-accent);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .relatedCard span:last-child {
    color: var(--color-text-muted);
    font-size: 0.88rem;
  }

  @media (max-width: 900px) {
    .detailGrid,
    .relatedGrid {
      grid-template-columns: 1fr;
    }
  }
</style>

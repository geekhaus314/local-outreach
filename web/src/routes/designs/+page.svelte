<script lang="ts">
  import AgencyChrome from '$lib/components/agency/AgencyChrome.svelte';
  import QuoteForm from '$lib/components/agency/QuoteForm.svelte';
  import styles from '$lib/components/agency/AgencyContent.module.css';
  import {
    AGENCY_CONTACT,
    agencyDesigns,
    agencyJsonLd,
    agencyPackages
  } from '$lib/data/agency-content';
</script>

<svelte:head>
  <title>Designs and packages — Web Rehab STL</title>
  <meta
    name="description"
    content="Design directions and package tiers for St. Louis small-business websites: checkup and repair, a new site, booking or store, and custom apps. Request a fixed quote."
  />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href={`${AGENCY_CONTACT.url}/designs`} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Designs and packages — Web Rehab STL" />
  <meta
    property="og:description"
    content="Design directions and package tiers for St. Louis small-business websites."
  />
  <meta property="og:url" content={`${AGENCY_CONTACT.url}/designs`} />
  <script type="application/ld+json">
    {JSON.stringify(agencyJsonLd())}
  </script>
</svelte:head>

<AgencyChrome current="/designs">
  <section class={styles.hero}>
    <div class={styles.heroGrid} aria-hidden="true"></div>
    <div class={styles.shell}>
      <div class={styles.heroInner}>
        <p class={styles.eyebrow}>Designs and packages</p>
        <h1 class={styles.title}>Pick a direction. I will scope the work.</h1>
        <p class={styles.lede}>
          Every project starts from the same place: what the business does, who
          it serves, and what a customer should be able to do on the site. The
          design direction changes the look; the package changes the machinery.
        </p>
        <div class={styles.actions}>
          <a class={styles.button} href="#quote">Request a quote</a>
          <a class={styles.buttonGhost} href="/#checkup">Start with the free checkup</a>
        </div>
      </div>
    </div>
  </section>

  <section class={styles.section}>
    <div class={styles.shell}>
      <div class={styles.head}>
        <h2 class={styles.sectionTitle}>Four design directions</h2>
        <p class={styles.sectionNote}>
          These are starting points, not a template menu. The final design is
          built around your business and your customers.
        </p>
      </div>
      <div class={styles.grid2}>
        {#each agencyDesigns as design (design.id)}
          <article class={styles.card}>
            <p class={styles.cardLabel}>{design.name}</p>
            <h3 class={styles.cardTitle}>{design.summary}</h3>
            <ul class={styles.cardList}>
              {#each design.traits as trait}
                <li>{trait}</li>
              {/each}
            </ul>
            <div class={styles.swatches} aria-label={`${design.name} colour direction`}>
              {#each design.swatches as swatch}
                <span class={styles.swatch} style={`background: ${swatch}`}></span>
              {/each}
            </div>
          </article>
        {/each}
      </div>
    </div>
  </section>

  <section class={`${styles.section} ${styles.sectionAlt}`}>
    <div class={styles.shell}>
      <div class={styles.head}>
        <h2 class={styles.sectionTitle}>Package tiers</h2>
        <p class={styles.sectionNote}>
          The checkup comes first, then a fixed quote. No published price list
          because a brochure site and a booking system are not the same job.
        </p>
      </div>
      <div class={styles.grid2}>
        {#each agencyPackages as item (item.id)}
          <article class={styles.card}>
            <p class={styles.cardLabel}>Package</p>
            <h3 class={styles.cardTitle}>{item.name}</h3>
            <p class={styles.cardText}>{item.bestFor}</p>
            <ul class={styles.cardList}>
              {#each item.includes as line}
                <li>{line}</li>
              {/each}
            </ul>
            <div class={styles.cardSpacer}></div>
            <p class={styles.cardFoot}>Scoped after the checkup</p>
          </article>
        {/each}
      </div>
    </div>
  </section>

  <section class={styles.section} id="quote">
    <div class={styles.shell}>
      <div class={styles.split}>
        <div>
          <p class={styles.eyebrow}>Next step</p>
          <h2 class={styles.sectionTitle}>Tell me what you need.</h2>
          <p class={styles.sectionNote}>
            A short description is enough. I will reply with the scope, the
            fixed number, and the next available start date. If a free checkup
            would answer it faster, I will say so.
          </p>
          <dl class={styles.meta}>
            <div>
              <dt>Reply window</dt>
              <dd>Usually within two business days.</dd>
            </div>
            <div>
              <dt>What to include</dt>
              <dd>Your current site, the work you want the site to do, and any deadline.</dd>
            </div>
            <div>
              <dt>Prefer to talk?</dt>
              <dd>
                Call <a href={`tel:${AGENCY_CONTACT.phone}`}>{AGENCY_CONTACT.phoneDisplay}</a>
                or email <a href={`mailto:${AGENCY_CONTACT.email}`}>{AGENCY_CONTACT.email}</a>.
              </dd>
            </div>
          </dl>
        </div>
        <div>
          <QuoteForm />
        </div>
      </div>
    </div>
  </section>
</AgencyChrome>

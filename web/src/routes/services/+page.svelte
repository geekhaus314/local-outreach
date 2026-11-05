<script lang="ts">
  import AgencyChrome from '$lib/components/agency/AgencyChrome.svelte';
  import styles from '$lib/components/agency/AgencyContent.module.css';
  import { AGENCY_CONTACT, agencyJsonLd, agencyServices } from '$lib/data/agency-content';
</script>

<svelte:head>
  <title>Services — Web Rehab STL</title>
  <meta
    name="description"
    content="Website audits, repairs, rebuilds, local-search setup, booking and payment flows, and custom web apps for St. Louis small businesses."
  />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href={`${AGENCY_CONTACT.url}/services`} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Services — Web Rehab STL" />
  <meta
    property="og:description"
    content="Audit, repair, rebuild, local search, booking, and custom apps for St. Louis businesses."
  />
  <meta property="og:url" content={`${AGENCY_CONTACT.url}/services`} />
  <script type="application/ld+json">
    {JSON.stringify(agencyJsonLd())}
  </script>
</svelte:head>

<AgencyChrome current="/services">
  <section class={styles.hero}>
    <div class={styles.heroGrid} aria-hidden="true"></div>
    <div class={styles.shell}>
      <div class={styles.heroInner}>
        <p class={styles.eyebrow}>Services</p>
        <h1 class={styles.title}>Fix the site, or build the one you should have had.</h1>
        <p class={styles.lede}>
          Start with a measured checkup, then choose the smallest job that
          actually solves the problem. Repair before rebuild, rebuild before
          custom software.
        </p>
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
      <div class={styles.grid2}>
        {#each agencyServices as service (service.slug)}
          <a class={`${styles.card} ${styles.cardLink}`} href={`/services/${service.slug}`}>
            <p class={styles.cardLabel}>{service.shortName}</p>
            <h2 class={styles.cardTitle}>{service.name}</h2>
            <p class={styles.cardText}>{service.summary}</p>
            <p class={styles.cardText}><strong>Who it is for:</strong> {service.audience}</p>
            <div class={styles.cardSpacer}></div>
            <p class={styles.cardFoot}>Read the details →</p>
          </a>
        {/each}
      </div>
    </div>
  </section>

  <section class={`${styles.section} ${styles.sectionAlt}`}>
    <div class={styles.shell}>
      <div class={styles.contactBand}>
        <div>
          <h2>Not sure which one you need?</h2>
          <p>The free checkup tells you, without a sales call first.</p>
        </div>
        <div class={styles.actions}>
          <a class={styles.button} href="/#checkup">Request the free checkup</a>
          <a class={styles.buttonGhost} href={`mailto:${AGENCY_CONTACT.email}`}>
            {AGENCY_CONTACT.email}
          </a>
        </div>
      </div>
    </div>
  </section>
</AgencyChrome>

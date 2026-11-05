<script lang="ts">
  import AgencyChrome from '$lib/components/agency/AgencyChrome.svelte';
  import styles from '$lib/components/agency/AgencyContent.module.css';
  import { AGENCY_CONTACT, agencyJsonLd, agencyWork } from '$lib/data/agency-content';
</script>

<svelte:head>
  <title>Recent work — Web Rehab STL</title>
  <meta
    name="description"
    content="Live client work from Web Rehab STL: a hair-restoration clinic, a wildlife photography portfolio, and a multi-tenant wholesale storefront."
  />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href={`${AGENCY_CONTACT.url}/work`} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Recent work — Web Rehab STL" />
  <meta
    property="og:description"
    content="Live client work: clinic, photography portfolio, and wholesale storefront."
  />
  <meta property="og:url" content={`${AGENCY_CONTACT.url}/work`} />
  <script type="application/ld+json">
    {JSON.stringify(agencyJsonLd())}
  </script>
</svelte:head>

<AgencyChrome current="/work">
  <section class={styles.hero}>
    <div class={styles.heroGrid} aria-hidden="true"></div>
    <div class={styles.shell}>
      <div class={styles.heroInner}>
        <p class={styles.eyebrow}>Selected work</p>
        <h1 class={styles.title}>Sites that are live, maintained, and doing a job.</h1>
        <p class={styles.lede}>
          These are production projects, not mockups. Each one is built around a
          real business, deployed on a real domain or host, and still maintained
          after launch.
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
      <div class={styles.head}>
        <h2 class={styles.sectionTitle}>Client projects</h2>
        <p class={styles.sectionNote}>
          Different industries, same rule: the site has to explain the business,
          load on a phone, and give the customer a way to act.
        </p>
      </div>

      <div class={styles.workGrid}>
        {#each agencyWork as project (project.slug)}
          <a
            class={styles.workCard}
            href={project.url}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`Visit ${project.name} (opens in a new tab)`}
          >
            <div class={styles.workMedia}>
              <img
                src={project.image}
                alt={project.imageAlt}
                width="720"
                height="480"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div class={styles.workBody}>
              <p class={styles.cardLabel}>{project.sector}</p>
              <h2>{project.name}</h2>
              <p>{project.summary}</p>
              <ul>
                {#each project.detail as line}
                  <li>{line}</li>
                {/each}
              </ul>
              <ul class={styles.tagList} aria-label={`${project.name} stack`}>
                {#each project.stack as tech}
                  <li class={styles.tag}>{tech}</li>
                {/each}
              </ul>
              <p class={styles.cardFoot}>Visit {project.url.replace('https://', '')} ↗</p>
            </div>
          </a>
        {/each}
      </div>
    </div>
  </section>

  <section class={`${styles.section} ${styles.sectionAlt}`}>
    <div class={styles.shell}>
      <div class={styles.contactBand}>
        <div>
          <h2>Want your site on this page?</h2>
          <p>Start with the free checkup. The findings are yours either way.</p>
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

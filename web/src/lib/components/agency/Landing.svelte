<script lang="ts">
  import styles from './Landing.module.css';
  import CheckupForm from './CheckupForm.svelte';

  const checkupCovers = [
    'Whether your domain still works — or is parked, broken, or pointing somewhere else',
    'Whether your pages actually work on a phone',
    'HTTPS: whether customers get the secure warning screen',
    'How findable your contact information is: phone, email, working forms',
    'Whether anyone can actually book or request an appointment online',
    'Whether your titles and search descriptions describe the right business',
    'Whether your site still advertises a dead, for-sale, or stale page',
    'How long your pages take to appear',
    'Whether leftover placeholder or under-construction pages are still online',
    'Whether anyone can count how well your site performs (analytics)',
    'Whether your platform is abandoned and needs an update',
    'Whether your copyright year stopped being honest years ago'
  ];
</script>

<div class={styles.page}>
  <header class={styles.header}>
    <div class={styles.shell}>
      <span class={styles.brand}>
        <span class={styles.brandMark} aria-hidden="true">WR</span>
        <span class={styles.brandText}>
          <span class={styles.brandDescriptor}>St. Louis, Missouri</span>
          <span class={styles.brandName}>Web Rehab STL</span>
        </span>
      </span>
      <a class={styles.headerCta} href="#checkup">Get the free checkup</a>
    </div>
  </header>

  <section class={styles.hero}>
    <div class={styles.shell}>
      <p class={styles.eyebrow}>For St. Louis small businesses</p>
      <h1 class={styles.headline}>
        Your website should bring you work — not quietly cost you jobs.
      </h1>
      <p class={styles.lede}>
        We audit St. Louis small-business websites and show you exactly what we
        find, listing every specific issue by name: parked domains, pages that
        do not work on a phone, sites still advertising a copyright from five
        years ago. You get the full report first. No sales call to hear it.
      </p>
      <div class={styles.heroActions}>
        <a class={styles.cta} href="#checkup">Request a free checkup</a>
        <a class={styles.ctaGhost} href="#process">How it works</a>
      </div>
      <dl class={styles.heroFacts}>
        <div>
          <dt>20-point audit</dt>
          <dd>Every finding is a checked fact about your pages, not an opinion.</dd>
        </div>
        <div>
          <dt>Report first</dt>
          <dd>You see the findings before any conversation about work.</dd>
        </div>
        <div>
          <dt>No pressure</dt>
          <dd>The report is yours either way, whether you hire us or not.</dd>
        </div>
      </dl>
    </div>
  </section>

  <section class={styles.covers}>
    <div class={styles.shell}>
      <h2 class={styles.sectionTitle} id="process">How it works</h2>
      <ol class={styles.processList}>
        <li>
          <h3>1. Tell us your address</h3>
          <p>Send us your website address and business name. It takes a minute.</p>
        </li>
        <li>
          <h3>2. We audit the site</h3>
          <p>We run the same checkup we would run for any client — the results are recorded facts, not impressions.</p>
        </li>
        <li>
          <h3>3. You get the report</h3>
          <p>We email what we found, in plain language, with the exact facts pulled from your pages. If you want it fixed, we'll rehab it. If you don't, the report is yours to keep.</p>
        </li>
      </ol>
    </div>
  </section>

  <section class={styles.covers}>
    <div class={styles.shell}>
      <h2 class={styles.sectionTitle}>What the checkup covers</h2>
      <ul class={styles.coversList}>
        {#each checkupCovers as item}
          <li>{item}</li>
        {/each}
      </ul>
    </div>
  </section>

  <section class={styles.checkupSection} id="checkup">
    <div class={styles.shell}>
      <h2 class={styles.sectionTitle}>Request your free checkup</h2>
      <p class={styles.sectionNote}>
        One checkup per business. We answer with the report itself, not a pitch.
      </p>
      <CheckupForm />
    </div>
  </section>

  <footer class={styles.footer}>
    <div class={styles.shell}>
      <div class={styles.footerGrid}>
        <div>
          <p class={styles.footerName}>Web Rehab STL</p>
          <p class={styles.footerNote}>
            Website audit and rehab for small businesses in St. Louis County.
            Every claim we make about your site is checked, in writing, against
            your pages.
          </p>
        </div>
        <div>
          <h2 class={styles.footerHeading}>Contact</h2>
          <a class={styles.footerLink} href="mailto:hello@webrehabstl.com">hello@webrehabstl.com</a>
        </div>
        <div>
          <h2 class={styles.footerHeading}>Legal</h2>
          <a class={styles.footerLink} href="/privacy">Privacy notice</a>
        </div>
      </div>
      <div class={styles.footerBase}>
        <p>© {new Date().getFullYear()} Web Rehab STL, St. Louis, Missouri</p>
      </div>
    </div>
  </footer>
</div>

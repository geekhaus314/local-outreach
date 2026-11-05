<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import styles from './AgencyChrome.module.css';
  import { AGENCY_CONTACT } from '$lib/data/agency-content';

  let { children, current = '/' }: { children: Snippet; current?: string } = $props();

  const PALETTE_KEY = 'webrehabstl.palette';
  let palette = $state<'dark' | 'light'>('dark');

  const nav = [
    { href: '/services', label: 'Services' },
    { href: '/work', label: 'Work' },
    { href: '/designs', label: 'Designs' },
    { href: '/#checkup', label: 'Free checkup' }
  ];

  onMount(() => {
    try {
      const saved = window.localStorage.getItem(PALETTE_KEY);
      if (saved === 'light' || saved === 'dark') palette = saved;
    } catch {
      /* storage unavailable — the default palette is the right answer */
    }
  });

  function togglePalette(): void {
    palette = palette === 'dark' ? 'light' : 'dark';
    try {
      window.localStorage.setItem(PALETTE_KEY, palette);
    } catch {
      /* storage unavailable — the toggle still works for this page view */
    }
  }
</script>

<div class={styles.agency} data-palette={palette}>
  <a class={styles.skip} href="#main">Skip to content</a>

  <header class={styles.header}>
    <div class={styles.shell}>
      <a class={styles.brand} href="/" aria-label="Web Rehab STL home">
        <span class={styles.brandMark} aria-hidden="true">WR</span>
        <span class={styles.brandText}>
          <span class={styles.brandDescriptor}>St. Louis, Missouri</span>
          <span class={styles.brandName}>Web Rehab STL</span>
        </span>
      </a>

      <nav class={styles.nav} aria-label="Primary">
        {#each nav as item}
          <a href={item.href} aria-current={current === item.href ? 'page' : undefined}>{item.label}</a>
        {/each}
      </nav>

      <div class={styles.actions}>
        <a class={styles.phone} href={`tel:${AGENCY_CONTACT.phone}`}>{AGENCY_CONTACT.phoneDisplay}</a>
        <button
          type="button"
          class={styles.palette}
          onclick={togglePalette}
          aria-label={`Switch to ${palette === 'dark' ? 'light' : 'dark'} palette`}
        >
          {palette === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>
    </div>
  </header>

  <main id="main">
    {@render children()}
  </main>

  <footer class={styles.footer}>
    <div class={styles.shell}>
      <div class={styles.footerGrid}>
        <div>
          <p class={styles.footerBrand}>Web Rehab STL</p>
          <p>
            Website audits, repairs, rebuilds, and local-search setup for St. Louis
            small businesses. Measured first, fixed second.
          </p>
        </div>
        <div>
          <h2>Contact</h2>
          <a href={`tel:${AGENCY_CONTACT.phone}`}>{AGENCY_CONTACT.phoneDisplay}</a>
          <a href={`mailto:${AGENCY_CONTACT.email}`}>{AGENCY_CONTACT.email}</a>
          <p>Based in {AGENCY_CONTACT.city}, {AGENCY_CONTACT.region}. Working across the metro.</p>
        </div>
        <div>
          <h2>Explore</h2>
          {#each nav as item}
            <a href={item.href}>{item.label}</a>
          {/each}
          <a href="/privacy">Privacy</a>
        </div>
      </div>
      <div class={styles.footerBase}>
        <p>© {new Date().getFullYear()} Web Rehab STL · St. Louis, Missouri</p>
        <a href="/privacy">Privacy notice</a>
      </div>
    </div>
  </footer>
</div>

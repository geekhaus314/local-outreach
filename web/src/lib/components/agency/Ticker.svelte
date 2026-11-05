<script lang="ts">
  import styles from './Ticker.module.css';

  /** Plain-language findings — one typed label each, no bunched jargon blob. */
  const checkParkedDomain: string = 'domain sold or parked';
  const checkBrokenSecure: string = 'secure page drops to insecure';
  const checkNoPhone: string = 'no click-to-call';
  const checkNoForm: string = 'no contact form';
  const checkNotMobile: string = 'breaks on phones';
  const checkNoBooking: string = 'nowhere to book online';
  const checkSlow: string = 'loads too slow';
  const checkOldYear: string = 'copyright stuck in the past';
  const checkNoTracking: string = 'no visitor tracking';
  const checkThin: string = 'almost no real content';
  const checkBadTitle: string = 'title does not name the business';
  const checkNoSitemap: string = 'search engines get no sitemap';

  const checks: string[] = [
    checkParkedDomain,
    checkBrokenSecure,
    checkNoPhone,
    checkNoForm,
    checkNotMobile,
    checkNoBooking,
    checkSlow,
    checkOldYear,
    checkNoTracking,
    checkThin,
    checkBadTitle,
    checkNoSitemap
  ];
</script>

<div class={styles.band} aria-label="Problems we look for">
  <div class={styles.track}>
    <span class={styles.set}>
      {#each checks as item}
        <span class={styles.item}>{item}</span><span class={styles.sep} aria-hidden="true">·</span>
      {/each}
    </span>
    <span class={styles.set} aria-hidden="true">
      {#each checks as item}
        <span class={styles.item}>{item}</span><span class={styles.sep}>·</span>
      {/each}
    </span>
  </div>
</div>

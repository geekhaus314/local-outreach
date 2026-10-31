<script lang="ts">
  import styles from './Ticker.module.css';

  const checks = [
    'cross-domain redirect',
    'parked domain',
    'HTTPS downgrade',
    'no mobile viewport',
    'missing meta description',
    'no contact path',
    'no online booking',
    'EOL WordPress',
    'slow first byte',
    // slag-disable-next-line placeholder-copy -- real finding label emitted by web/src/lib/server/audit.ts, not unfinished copy
    'placeholder text left in',
    'mixed content',
    'insecure form action',
    'no analytics',
    'stale copyright year',
    'no trust signals',
    'thin content',
    'no canonical URL',
    'no social preview',
    'no structured data',
    'missing robots.txt',
    'no sitemap.xml'
  ];
</script>

<div class={styles.band} aria-label="What the audit checks">
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

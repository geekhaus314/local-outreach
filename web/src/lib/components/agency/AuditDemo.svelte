<script lang="ts" module>
  export interface DemoStep {
    label: string;
    penalty: number;
    note: string;
  }
</script>

<script lang="ts">
  import styles from './AuditDemo.module.css';
  import { onMount, onDestroy } from 'svelte';

  const steps: DemoStep[] = [
    { label: 'Domain is parked or a placeholder', penalty: 95, note: 'serves a placeholder page' },
    { label: 'HTTPS broken', penalty: 75, note: 'secure connection ends unencrypted' },
    { label: 'No way to make contact', penalty: 65, note: 'no tel:, no mailto:, no form' },
    { label: 'No mobile viewport', penalty: 55, note: 'phones render a shrunken desktop' },
    { label: 'Phone-only, cannot book online', penalty: 50, note: 'nothing to click after hours' },
    { label: 'Slow load time', penalty: 40, note: 'measured response over budget' },
    { label: 'Unsupported CMS version', penalty: 45, note: 'missing security updates' },
    { label: 'Outdated web technology', penalty: 35, note: 'legacy stack markers' },
    { label: 'Outdated copyright year', penalty: 18, note: 'untouched for years' },
    { label: 'No analytics installed', penalty: 12, note: 'visitors unmeasured' }
  ];

  let cursor = $state(0);
  let running = $state(false);
  let finished = $state(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  function stepDelay(): number {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 420;
  }

  function start(): void {
    if (running) return;
    cursor = 0;
    finished = false;
    running = true;

    const delay = stepDelay();
    if (delay === 0) {
      cursor = steps.length;
      running = false;
      finished = true;
      return;
    }

    timer = setInterval(() => {
      cursor += 1;
      if (cursor >= steps.length) {
        clearInterval(timer);
        running = false;
        finished = true;
      }
    }, delay);
  }

  onMount(start);

  onDestroy(() => {
    if (timer) clearInterval(timer);
  });

  const shown = $derived(steps.slice(0, cursor));
  const health = $derived(Math.max(0, 100 - steps.slice(0, cursor).reduce((sum, s) => sum + s.penalty, 0)));
</script>

<div class={styles.frame} aria-label="Simulated audit report">
  <div class={styles.chrome}>
    <span class={styles.dot}></span>
    <span class={styles.dot}></span>
    <span class={styles.dot}></span>
    <span class={styles.title}>webrehab-audit · simulated run</span>
    <span class={styles.score} data-low={health < 40}>
      {#if cursor == 0}100/100{:else}{health}/100{/if}
    </span>
  </div>

  <div class={styles.body}>
    <p class={styles.hint}>
      Real check names, real penalties — from the audit engine we run on every
      site. Shown against a neglected one.
    </p>
    <ol class={styles.list}>
      {#each shown as step, i (i)}
        <li class={styles.row} style={`animation-delay: ${i === cursor - 1 ? 0 : 0}s`}>
          <span class={styles.badge} data-fail={step.penalty >= 55}>
            −{step.penalty}
          </span>
          <span class={styles.text}>
            <strong>{step.label}</strong>
            <em>{step.note}</em>
          </span>
        </li>
      {/each}
      {#if cursor == 0}
        <li class={styles.pending}>running checks…</li>
      {/if}
    </ol>
    {#if finished}
      <div class={styles.verdict}>
        <p>
          Health 0/100. Every line above is the same check we run on your site —
          free.
        </p>
        <button type="button" class={styles.rerun} onclick={() => start()}>Re-run demo</button>
      </div>
    {/if}
  </div>
</div>

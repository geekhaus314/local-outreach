<script lang="ts">
  import { onMount } from 'svelte';

  let {
    signals
  }: {
    signals: Array<{ label: string; value: string | number }>;
  } = $props();

  let index = $state(0);
  let ticker: ReturnType<typeof setInterval> | null = null;

  onMount(() => {
    if (typeof window === 'undefined' || !signals.length) return;
    ticker = setInterval(() => {
      index = (index + 1) % signals.length;
    }, 3200);
    return () => {
      if (ticker) clearInterval(ticker);
    };
  });

  const current = $derived(signals[index] ?? null);
</script>

<section class="trustTicker">
  <div class="track" role="region" aria-label="Trust signals" aria-live="polite">
    {#each signals as signal, i}
      <div class={`chip ${i === index ? 'active' : ''}`}>
        <span class="signalLabel">{signal.label}</span>
        <span class="signalValue">{signal.value}</span>
      </div>
    {/each}
  </div>
</section>

<style>
  .trustTicker {
    padding-block: clamp(2rem, 5vw, 3.5rem);
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
  }

  .track {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.85rem 1.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.88rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    opacity: 0.55;
    transform: scale(0.94);
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
  }

  .chip.active {
    opacity: 1;
    transform: scale(1);
    border-color: var(--color-accent);
    color: var(--color-accent);
    box-shadow: var(--color-shadow);
  }

  .signalLabel {
    font-size: 0.7rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    display: block;
  }

  .chip.active .signalLabel {
    color: var(--color-accent);
  }

  .signalValue {
    font-family: var(--font-display);
    font-size: 1.5rem;
    line-height: 1;
  }

  .chip.active .signalValue {
    color: var(--color-accent-contrast);
  }
</style>

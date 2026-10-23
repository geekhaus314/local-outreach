<script lang="ts">
  import { onMount } from 'svelte';

  let {
    eyebrow,
    headline,
    subhead,
    primaryCta,
    primaryHref,
    secondaryCta,
    secondaryHref
  }: {
    eyebrow: string;
    headline: string;
    subhead: string;
    primaryCta: string;
    primaryHref: string;
    secondaryCta?: string;
    secondaryHref?: string;
  } = $props();

  let reveal = $state(0);

  onMount(() => {
    if (typeof window === 'undefined') return;
    const tl = window.requestAnimationFrame(() => {
      reveal = 1;
    });
  });
</script>

<section class="heroReveal" data-reveal={reveal}>
  <div class="eyebrow">
    {#each eyebrow.split('') as char, i}
      <span style="--i: {i}">{char === ' ' ? '&nbsp;' : char}</span>
    {/each}
  </div>
  <h1 class="headline">
    {#each headline.split('') as char, i}
      <span style="--i: {i}">{char === ' ' ? '&nbsp;' : char}</span>
    {/each}
  </h1>
  <p class="subhead">{subhead}</p>
  <div class="actions">
    <a class="button accent" href={primaryHref}>{primaryCta}</a>
    {#if secondaryCta && secondaryHref}
      <a class="button ghost" href={secondaryHref}>{secondaryCta}</a>
    {/if}
  </div>
</section>

<style>
  .heroReveal {
    position: relative;
    overflow: hidden;
    padding-block: clamp(4rem, 10vw, 7rem);
  }

  .eyebrow {
    display: inline-flex;
    gap: 0.08em;
    font-size: 0.7rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--color-accent);
    font-weight: 600;
    font-family: var(--font-body);
    margin-bottom: 1rem;
    opacity: 0;
    transform: translateY(1rem);
    animation: revealUp 0.6s ease forwards;
  }

  .eyebrow span {
    display: inline-block;
    animation: charReveal 0.5s ease forwards;
    animation-delay: calc(var(--i) * 0.04s);
    opacity: 0;
  }

  .headline {
    font-family: var(--font-display);
    font-size: clamp(2.2rem, 8vw, 4.5rem);
    line-height: 1.05;
    color: var(--color-brand);
    margin: 0 0 1.5rem 0;
    font-weight: 700;
    letter-spacing: -0.03em;
    opacity: 0;
    transform: translateY(1rem);
    animation: revealUp 0.7s ease forwards 0.1s;
  }

  .headline span {
    display: inline-block;
    animation: charPop 0.55s ease forwards;
    animation-delay: calc(var(--i) * 0.03s);
    opacity: 0;
  }

  .subhead {
    font-size: clamp(1rem, 2vw, 1.3rem);
    color: var(--color-text-muted);
    max-width: 42rem;
    margin: 0 0 2rem 0;
    opacity: 0;
    transform: translateY(1rem);
    animation: revealUp 0.6s ease forwards 0.2s;
    line-height: 1.7;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.85rem;
    opacity: 0;
    transform: translateY(1rem);
    animation: revealUp 0.6s ease forwards 0.3s;
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 3rem;
    padding: 0 1.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    text-decoration: none;
  }

  .button.accent {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-accent-contrast);
  }

  .button.accent:hover {
    filter: brightness(0.92);
  }

  .button.ghost {
    border-color: var(--color-border);
    color: var(--color-text);
  }

  .button.ghost:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  @keyframes revealUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes charPop {
    0% {
      opacity: 0;
      transform: translateY(0.4rem) scale(0.92);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>

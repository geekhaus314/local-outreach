<script lang="ts">
  import { onMount } from 'svelte';

  let {
    phone,
    primaryHref = '#booking',
    primaryLabel = 'Request consultation'
  }: {
    phone?: { display: string; dial: string } | null;
    primaryHref?: string;
    primaryLabel?: string;
  } = $props();

  let visible = $state(false);

  onMount(() => {
    if (typeof window === 'undefined') return;
    let lastY = window.scrollY;
    const handler = () => {
      const y = window.scrollY;
      visible = y > 300 && y > lastY ? false : y > 300;
      lastY = y;
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  });
</script>

{#if visible && phone}
  <div class="stickyCTA" role="region" aria-label="Quick contact">
    <a class="cta" href={phone.dial}>
      <span class="ctaIcon">📞</span>
      <span class="ctaLabel">Call {phone.display}</span>
    </a>
    <a class="cta accent" href={primaryHref}>{primaryLabel}</a>
  </div>
{/if}

<style>
  .stickyCTA {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    box-shadow: var(--color-shadow);
    z-index: 90;
    backdrop-filter: blur(8px);
    animation: slideUp 0.4s ease forwards;
  }

  .cta {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 3rem;
    padding: 0 1rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-bg);
    color: var(--color-text);
    font: inherit;
    font-weight: 600;
    font-size: 0.9rem;
    text-decoration: none;
  }

  .cta.accent {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-accent-contrast);
  }

  .ctaIcon {
    font-size: 1.2rem;
  }

  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @media (min-width: 760px) {
    .stickyCTA { display: none; }
  }
</style>

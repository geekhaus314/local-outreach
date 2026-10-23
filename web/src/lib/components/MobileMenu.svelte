<script lang="ts">
  import { onMount } from 'svelte';

  let { tenant }: { tenant: { name: string; nav: Array<{ label: string; href: string }> } } = $props();

  let open = $state(false);

  function toggle(): void {
    open = !open;
  }

  function close(): void {
    open = false;
  }

  onMount(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });
</script>

<div class="mobileMenu">
  <button
    class="menuButton"
    type="button"
    aria-expanded={open}
    aria-controls="mobile-menu"
    aria-label={open ? 'Close menu' : 'Open menu'}
    onclick={toggle}
  >
    <span aria-hidden="true">{open ? '✕' : '☰'}</span>
  </button>

  <nav id="mobile-menu" class={open ? '' : 'hidden'} aria-label="Primary navigation">
    <a class="closeButton" type="button" onclick={close} aria-hidden="true">✕</a>
    <p class="menuKicker">{tenant?.name ?? 'Business'}</p>
    {#each tenant?.nav ?? [] as item}
      <a class="menuLink" href={item.href} onclick={close}>{item.label}</a>
    {/each}
  </nav>
</div>

<style>
  .mobileMenu {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 1rem;
    margin-left: auto;
  }

  .menuButton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.6rem;
    height: 2.6rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
  }

  .menuButton:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .closeButton {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.25rem;
  }

  .closeButton:hover {
    color: var(--color-text);
  }

  .menuKicker {
    margin: 1rem 1rem 0.5rem 1rem;
    font-size: 0.66rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .menuLink {
    display: block;
    padding: 0.85rem 1rem;
    color: var(--color-text);
    text-decoration: none;
    border-bottom: 1px solid var(--color-border);
    font-weight: 500;
  }

  .menuLink:hover {
    color: var(--color-accent);
    background: color-mix(in srgb, var(--color-accent) 6%, transparent);
  }

  .hidden {
    display: none;
  }

  @media (min-width: 900px) {
    .mobileMenu {
      display: none;
    }
  }
</style>

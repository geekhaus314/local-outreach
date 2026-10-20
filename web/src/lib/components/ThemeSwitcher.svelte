<script lang="ts">
  import { themeList } from '$lib/data/themes';
  import { getTheme } from '$lib/stores/theme.svelte';

  const themeState = getTheme();
</script>

<div class="theme" role="group" aria-label="Color theme">
  <span class="label" aria-hidden="true">Theme</span>
  {#each themeList as option}
    <button
      type="button"
      class="swatch"
      class:active={themeState.theme === option.name}
      aria-pressed={themeState.theme === option.name}
      aria-label={`Use ${option.label} theme`}
      title={option.label}
      onclick={() => themeState.set(option.name)}
      style={`--swatch-bg:${option.tokens.background};--swatch-brand:${option.tokens.brand};--swatch-accent:${option.tokens.accent}`}
    >
      <span class="dot" aria-hidden="true"></span>
    </button>
  {/each}
</div>

<style>
  .theme {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem;
    border: 1px solid var(--color-border);
    border-radius: 999px;
  }

  .label {
    padding-inline: 0.45rem 0.15rem;
    color: var(--color-text-muted);
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .swatch {
    display: grid;
    place-items: center;
    width: 1.85rem;
    height: 1.85rem;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 999px;
    background: transparent;
  }

  .swatch:hover {
    border-color: var(--color-border);
  }

  .swatch.active {
    border-color: var(--color-accent);
  }

  .dot {
    display: block;
    width: 1.1rem;
    height: 1.1rem;
    border: 1px solid var(--swatch-brand);
    border-radius: 999px;
    background: linear-gradient(135deg, var(--swatch-brand) 50%, var(--swatch-accent) 50%);
  }

  @media (max-width: 520px) {
    .label {
      display: none;
    }
  }
</style>

<script lang="ts">
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>{$page.status} | Preview unavailable</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<section class="errorPage">
  <div class="shell errorCard">
    <p class="eyebrow">Preview</p>
    <h1>{$page.status}</h1>
    <p>{$page.error?.message ?? 'This preview page is not available.'}</p>
    <p class="hint">
      If you followed a preview link, ask the sender for the current host or request a fresh preview.
    </p>
    <button class="button" type="button" onclick={() => history.back()}>Go back</button>
  </div>
</section>

<style>
  .errorPage {
    display: grid;
    min-height: 70vh;
    place-items: center;
    padding: 3rem 0;
  }

  .errorCard {
    max-width: 38rem;
    padding: clamp(1.5rem, 4vw, 2.5rem);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }

  h1 {
    font-size: clamp(3rem, 8vw, 5rem);
    line-height: 1;
  }

  p {
    margin-top: 1rem;
    color: var(--color-text-muted);
  }

  .hint {
    font-size: 0.88rem;
  }

  .button {
    margin-top: 1.5rem;
  }
</style>

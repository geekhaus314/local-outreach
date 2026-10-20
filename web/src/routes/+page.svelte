<script lang="ts">
  import { loadVerticalComponent } from '$lib/verticals/registry';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const vertical = $derived(data.tenant.vertical);
</script>

<svelte:head>
  <title>{data.tenant.seo.title}</title>
</svelte:head>

{#await loadVerticalComponent(vertical)}
  <div class="shell loadState">
    <p>Loading the {vertical} experience…</p>
  </div>
{:then Vertical}
  <Vertical content={data.tenant} />
{:catch}
  <div class="shell loadState">
    <h1>This preview could not be rendered.</h1>
    <p>The vertical component for {vertical} failed to load. Check the server logs for details.</p>
  </div>
{/await}

<style>
  .loadState {
    padding-block: clamp(3rem, 8vw, 6rem);
  }

  .loadState h1 {
    font-size: clamp(1.6rem, 3vw, 2.2rem);
  }

  .loadState p {
    margin-top: 0.75rem;
    color: var(--color-text-muted);
  }
</style>

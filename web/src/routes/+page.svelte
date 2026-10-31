<script lang="ts">
  import { loadVerticalComponent } from '$lib/verticals/registry';
  import Landing from '$lib/components/agency/Landing.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Redirect to /admin is handled by +page.server.ts when no tenant and not the
  // agency host; the guards here satisfy TypeScript's null checks.
  const vertical = $derived(data.tenant?.vertical);
  const showLanding = $derived(!data.tenant && data.isAgency);
</script>

<svelte:head>
  {#if data.tenant}
    <title>{data.tenant.seo.title}</title>
  {:else if showLanding}
    <title>Web Rehab STL — Free website checkup for St. Louis small businesses</title>
    <meta
      name="description"
      content="Web Rehab STL audits St. Louis small-business websites — dead domains, broken mobile layouts, stale pages — and rebuilds what costs you customers. Start with a free, fact-based checkup."
    />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://webrehabstl.com/" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Web Rehab STL" />
    <meta property="og:description" content="A free, fact-based website checkup for St. Louis small businesses." />
    <meta property="og:url" content="https://webrehabstl.com/" />
    <script type="application/ld+json">
      {JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        name: 'Web Rehab STL',
        url: 'https://webrehabstl.com/',
        email: 'hello@webrehabstl.com',
        description:
          'Website audits and rebuilds for St. Louis small businesses: edge-hosted pages, measured performance checks, and a free 38-point checkup.',
        areaServed: {
          '@type': 'City',
          name: 'St. Louis',
          containedInPlace: { '@type': 'State', name: 'Missouri' }
        },
        knowsAbout: ['website audit', 'web performance', 'small business websites', 'search visibility']
      })}
    </script>
  {/if}
</svelte:head>

{#if data.tenant}
  {#await loadVerticalComponent(data.tenant.vertical)}
    <div class="loadState">
      <p>Loading the {vertical} experience…</p>
    </div>
  {:then Vertical}
    <Vertical content={data.tenant} />
  {:catch}
    <div class="loadState">
      <h1>This preview could not be rendered.</h1>
      <p>The vertical component for {vertical} failed to load. Check the server logs for details.</p>
    </div>
  {/await}
{:else if showLanding}
  <Landing />
{/if}

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

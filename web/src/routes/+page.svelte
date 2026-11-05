<script lang="ts">
  import { loadVerticalComponent } from '$lib/verticals/registry';
  import Landing from '$lib/components/agency/Landing.svelte';
  import { AGENCY_CONTACT, FAQ_JSON_LD, agencyJsonLd } from '$lib/data/agency-content';
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
    <title>Website checkup and repair in St. Louis | Web Rehab STL</title>
    <meta
      name="description"
      content="Free website checkup for St. Louis contractors and small businesses. Plain report, fixed quotes, and a phone number that reaches a person."
    />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href={`${AGENCY_CONTACT.url}/`} />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Web Rehab STL" />
    <meta property="og:title" content="Website checkup and repair in St. Louis | Web Rehab STL" />
    <meta
      property="og:description"
      content="Send your site. Get a plain report. Fix it with us or keep the findings. Built for owners, not tech recruiters."
    />
    <meta property="og:url" content={`${AGENCY_CONTACT.url}/`} />
    <meta property="og:image" content={`${AGENCY_CONTACT.url}/og.png`} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Website checkup and repair in St. Louis | Web Rehab STL" />
    <meta
      name="twitter:description"
      content="Free website checkup for St. Louis contractors and small businesses."
    />
    <meta name="twitter:image" content={`${AGENCY_CONTACT.url}/og.png`} />
    <meta name="geo.region" content="US-MO" />
    <meta name="geo.placename" content="St. Louis" />
    <script type="application/ld+json">
      {JSON.stringify(agencyJsonLd())}
    </script>
    <script type="application/ld+json">
      {JSON.stringify(FAQ_JSON_LD)}
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

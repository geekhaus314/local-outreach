<script lang="ts">
  import '../app.css';
  import { onMount, type Snippet } from 'svelte';
  import { browser } from '$app/environment';
  import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
  import { THEME_STORAGE_KEY, resolveTheme } from '$lib/data/themes';
  import { setThemeContext } from '$lib/stores/theme.svelte';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  // svelte-ignore state_referenced_locally
  const themeState = setThemeContext(data.theme);

  onMount(() => {
    if (!browser) return;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      stored = null;
    }
    const initial = resolveTheme(stored, data.theme);
    if (initial !== themeState.theme) themeState.set(initial);
  });

  const tenant = $derived(data.tenant);
  const location = $derived(tenant?.business.locations[0] ?? null);
  const jsonLd = $derived(
    tenant
      ? JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: tenant.business.name,
          url: tenant.siteUrl,
          description: tenant.seo.description,
          ...(tenant.business.phone ? { telephone: tenant.business.phone.dial } : {}),
          ...(tenant.business.email ? { email: tenant.business.email } : {}),
          ...(location
            ? {
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: location.streetAddress,
                  addressLocality: location.city,
                  addressRegion: location.region,
                  postalCode: location.postalCode,
                  addressCountry: location.country
                }
              }
            : {}),
          ...(tenant.proof
            ? {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: tenant.proof.rating,
                  reviewCount: tenant.proof.reviewCount ?? undefined
                }
              }
            : {})
        })
      : ''
  );
</script>

<svelte:head>
  {#if tenant}
    <title>{tenant.seo.title}</title>
    <meta name="description" content={tenant.seo.description} />
    <meta name="robots" content={tenant.seo.noindex ? 'noindex, nofollow' : 'index, follow'} />
    <link rel="canonical" href={tenant.siteUrl} />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={tenant.seo.title} />
    <meta property="og:description" content={tenant.seo.description} />
    <meta property="og:url" content={tenant.siteUrl} />
    <meta property="og:image" content={`${tenant.siteUrl}${tenant.hero.image}`} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={tenant.seo.title} />
    <meta name="twitter:description" content={tenant.seo.description} />
    <script type="application/ld+json">
      {jsonLd}
    </script>
  {/if}
</svelte:head>

<a class="skip" href="#main">Skip to content</a>

{#if tenant}
  <header class="header">
    <div class="shell headerInner">
      <a class="brand" href="/" aria-label={`${tenant.business.name} home`}>
        <span class="brandMark" aria-hidden="true">{tenant.business.shortName.slice(0, 2).toUpperCase()}</span>
        <span class="brandText">
          <span class="brandDescriptor">{tenant.business.descriptor}</span>
          <span class="brandName">{tenant.business.name}</span>
        </span>
      </a>

      <nav class="nav" aria-label="Primary">
        {#each tenant.nav as item}
          <a href={item.href}>{item.label}</a>
        {/each}
      </nav>

      <div class="headerActions">
        {#if tenant.business.phone}
          <a class="phone" href={tenant.business.phone.dial}>{tenant.business.phone.display}</a>
        {/if}
        <ThemeSwitcher />
      </div>
    </div>
  </header>
{/if}

<main id="main">
  {@render children()}
</main>

{#if tenant}
  <footer class="footer">
    <div class="shell footerGrid">
      <div class="footerBrand">
        <p class="footerName">{tenant.business.name}</p>
        <p>{tenant.business.tagline}</p>
        {#if tenant.business.phone || tenant.business.email}
          <p class="footerContact">
            {#if tenant.business.phone}
              <a href={tenant.business.phone.dial}>{tenant.business.phone.display}</a>
            {/if}
            {#if tenant.business.email}
              <a href={`mailto:${tenant.business.email}`}>{tenant.business.email}</a>
            {/if}
          </p>
        {/if}
      </div>

      {#if location}
        <div>
          <h2>Visit</h2>
          <address>
            {#if location.streetAddress}
              {location.streetAddress}<br />
            {/if}
            {#if location.city || location.region}
              {[location.city, location.region].filter(Boolean).join(', ')}
            {:else}
              Contact for location details
            {/if}
          </address>
          <a class="footerLink" href={location.directionsUrl} target="_blank" rel="noreferrer">Get directions</a>
        </div>
      {/if}

      {#if tenant.business.hours.length > 0}
        <div>
          <h2>Hours</h2>
          {#each tenant.business.hours as hours}
            <p>{hours.days.join(', ')}</p>
            <p class="muted">{hours.opens}–{hours.closes}</p>
          {/each}
        </div>
      {/if}

      <div>
        <h2>Explore</h2>
        {#each tenant.nav as item}
          <a class="footerLink" href={item.href}>{item.label}</a>
        {/each}
        <a class="footerLink" href="/privacy">Privacy</a>
      </div>
    </div>

    <div class="shell footerBase">
      <p>© {new Date().getFullYear()} {tenant.business.legalName}. All rights reserved.</p>
      <p>Preview generated from public business data.</p>
    </div>
  </footer>
{/if}

<style>
  .skip {
    position: absolute;
    top: -4rem;
    left: 1rem;
    z-index: 100;
    padding: 0.75rem 1rem;
    background: var(--color-brand);
    color: var(--color-brand-contrast);
    border-radius: var(--radius-sm);
  }

  .skip:focus {
    top: 1rem;
  }

  .header {
    position: sticky;
    top: 0;
    z-index: 20;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
    background: color-mix(in srgb, var(--color-bg) 88%, transparent);
    backdrop-filter: blur(14px);
  }

  .headerInner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem 1.75rem;
    padding-block: 1rem;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    margin-right: auto;
    text-decoration: none;
  }

  .brandMark {
    display: grid;
    place-items: center;
    width: 2.75rem;
    height: 2.75rem;
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-sm);
    color: var(--color-accent);
    font-family: var(--font-display);
    font-size: 0.95rem;
    letter-spacing: 0.08em;
  }

  .brandText {
    display: grid;
    gap: 0.15rem;
  }

  .brandDescriptor {
    color: var(--color-accent);
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .brandName {
    font-family: var(--font-display);
    font-size: clamp(1rem, 2vw, 1.3rem);
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.05;
  }

  .nav {
    display: flex;
    flex: 1 1 100%;
    order: 3;
    gap: 1.5rem;
    overflow-x: auto;
    padding-block: 0.25rem;
    white-space: nowrap;
    scrollbar-width: none;
  }

  .nav::-webkit-scrollbar {
    display: none;
  }

  .nav a {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    font-weight: 500;
    text-decoration: none;
  }

  .nav a:hover {
    color: var(--color-text);
  }

  .headerActions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .phone {
    color: var(--color-text);
    font-weight: 600;
    text-decoration: none;
  }

  .footer {
    padding-top: 4rem;
    border-top: 1px solid var(--color-border);
    background: var(--color-bg-alt);
  }

  .footerGrid {
    display: grid;
    grid-template-columns: 1.5fr repeat(3, 1fr);
    gap: 2.5rem;
    padding-bottom: 3rem;
  }

  .footerBrand p {
    max-width: 28rem;
  }

  .footerName {
    margin-bottom: 0.75rem;
    font-family: var(--font-display);
    font-size: 1.35rem;
  }

  .footerContact {
    display: grid;
    gap: 0.35rem;
    margin-top: 1rem;
  }

  .footerContact a,
  .footerLink {
    display: block;
    color: var(--color-text-muted);
    text-decoration: none;
  }

  .footerContact a:hover,
  .footerLink:hover {
    color: var(--color-text);
  }

  .footer h2 {
    margin-bottom: 0.75rem;
    font-family: var(--font-body);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .footer address {
    margin-bottom: 0.75rem;
    color: var(--color-text-muted);
    font-style: normal;
  }

  .muted {
    color: var(--color-text-muted);
  }

  .footerBase {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.75rem;
    padding-block: 1.5rem;
    border-top: 1px solid var(--color-border);
    color: var(--color-text-muted);
    font-size: 0.82rem;
  }

  @media (min-width: 900px) {
    .headerInner {
      flex-wrap: nowrap;
    }

    .nav {
      flex: 0 1 auto;
      order: 0;
      justify-content: center;
    }
  }

  @media (max-width: 760px) {
    .footerGrid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 520px) {
    .footerGrid {
      grid-template-columns: 1fr;
    }

    .headerActions .phone {
      display: none;
    }
  }
</style>

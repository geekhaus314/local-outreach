<script lang="ts">
  import BookingForm from '$lib/components/BookingForm.svelte';
  import type { SiteContent } from '$lib/content/types';
  import styles from './GeneralBusinessSite.module.css';

  let { content }: { content: SiteContent } = $props();

  const business = $derived(content.business);
  const location = $derived(business.locations[0] ?? null);
  const phone = $derived(business.phone);
  const proof = $derived(content.proof);
  const nav = $derived(content.nav);
  const year = new Date().getFullYear();
</script>

<div class={`theme-scope ${styles.page}`}>
  <header class={styles.header}>
    <div class="shell">
      <div class={styles.headerInner}>
        <a class={styles.wordmark} href="/">{business.shortName}</a>
        <nav class={styles.nav} aria-label="Sections">
          {#each nav as item}
            <a href={item.href}>{item.label}</a>
          {/each}
        </nav>
      </div>
    </div>
  </header>

  <section class={styles.hero}>
    <div class="shell">
      <div class={styles.heroGrid}>
        <div class={styles.heroCopy}>
          <p class={styles.kicker}>{content.hero.eyebrow}</p>
          <h1>{content.hero.headline}</h1>
          <p class={styles.lede}>{content.hero.subhead}</p>
          <div class={styles.actions}>
            <a class={styles.primary} href={content.hero.primaryHref}>{content.hero.primaryCta}</a>
            <a class={styles.secondary} href={content.hero.secondaryHref}>{content.hero.secondaryCta}</a>
          </div>
        </div>

        <dl class={styles.listing}>
          <div>
            <dt>Listed as</dt>
            <dd>{business.industry}</dd>
          </div>
          <div>
            <dt>Area</dt>
            <dd>{location ? `${location.city}${location.region ? `, ${location.region}` : ''}` : 'Local'}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>
              {#if phone}<a href={phone.dial}>{phone.display}</a>{:else}Not listed{/if}
            </dd>
          </div>
          <div>
            <dt>Reputation</dt>
            <dd>
              {#if proof}{proof.rating.toFixed(1)}★ {#if proof.reviewCount}· {proof.reviewCount} reviews{/if}{:else}Not listed{/if}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </section>

  <section class={styles.details} id="details">
    <div class="shell">
      <div class={styles.sectionHead}>
        <p class={styles.kicker}>At a glance</p>
        <h2>What is confirmed so far</h2>
        <p>
          Everything below comes from the public listing. Services, hours and pricing are added by the
          business before launch.
        </p>
      </div>

      <div class={styles.cardGrid}>
        {#each content.offerings as offering}
          <article class={styles.card}>
            <p class={styles.cardTag}>{offering.category}</p>
            <h3>{offering.name}</h3>
            <p>{offering.summary}</p>
            <ul>
              {#each offering.features as feature}
                <li>{feature}</li>
              {/each}
            </ul>
            <p class={styles.cardMeta}>{offering.duration}</p>
          </article>
        {/each}
      </div>
    </div>
  </section>

  {#if proof}
    <section class={styles.reputation} id="reputation">
      <div class="shell">
        <div class={styles.reputationInner}>
          <div class={styles.reputationScore}>
            <strong>{proof.rating.toFixed(1)}</strong>
            <span>{proof.reviewCount ? `${proof.reviewCount} reviews` : 'reviews'}</span>
          </div>
          <p>
            Sourced from {proof.source} for {business.name}. Ratings are shown exactly as published — nothing
            is adjusted.
          </p>
        </div>
      </div>
    </section>
  {/if}

  <section class={styles.faq} id="faq">
    <div class="shell">
      <div class={styles.sectionHead}>
        <p class={styles.kicker}>Questions</p>
        <h2>Good to know</h2>
      </div>
      <ul class={styles.faqList}>
        {#each content.faq as item}
          <li>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </li>
        {/each}
      </ul>
    </div>
  </section>

  <section class={styles.booking} id="booking">
    <div class="shell">
      <div class={styles.bookingGrid}>
        <div class={styles.bookingCopy}>
          <p class={styles.kicker}>Contact</p>
          <h2>Send a request to {business.shortName}</h2>
          <p>Tell them what you need and the best way to reach you.</p>
          {#if phone}
            <p class={styles.bookingPhone}>Or call <a href={phone.dial}>{phone.display}</a></p>
          {/if}
        </div>
        <div class={styles.bookingForm}>
          <BookingForm booking={content.booking} phone={phone} businessName={business.name} />
        </div>
      </div>
    </div>
  </section>

  <footer class={styles.footer}>
    <div class="shell">
      <div class={styles.footerInner}>
        <p>© {year} {business.name}</p>
        <nav class={styles.footerNav} aria-label="Footer">
          {#if location}
            <a href={location.directionsUrl}>Directions</a>
          {/if}
          <a href="/privacy">Privacy</a>
        </nav>
      </div>
    </div>
  </footer>
</div>

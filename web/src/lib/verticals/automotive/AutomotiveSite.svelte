<script lang="ts">
  import BookingForm from '$lib/components/BookingForm.svelte';
  import type { SiteContent } from '$lib/content/types';
  import styles from './AutomotiveSite.module.css';

  let { content }: { content: SiteContent } = $props();

  const business = $derived(content.business);
  const location = $derived(business.locations[0] ?? null);
  const phone = $derived(business.phone);
  const proof = $derived(content.proof);
  const nav = $derived(content.nav);
  const year = new Date().getFullYear();
</script>

<div class={`theme-scope ${styles.shop}`}>
  <header class={styles.bar}>
    <div class="shell">
      <div class={styles.barInner}>
        <a class={styles.mark} href="/">
          <span class={styles.markBolt} aria-hidden="true"></span>
          {business.shortName}
        </a>
        <nav class={styles.nav} aria-label="Sections">
          {#each nav as item}
            <a href={item.href}>{item.label}</a>
          {/each}
        </nav>
        {#if phone}
          <a class={styles.callBtn} href={phone.dial}>{phone.display}</a>
        {/if}
      </div>
    </div>
  </header>

  <section class={styles.hero}>
    <div class="shell">
      <div class={styles.heroGrid}>
        <div class={styles.heroCopy}>
          <p class={styles.eyebrow}>{content.hero.eyebrow}</p>
          <h1>{content.hero.headline}</h1>
          <p class={styles.subhead}>{content.hero.subhead}</p>
          <div class={styles.actions}>
            <a class={styles.primary} href={content.hero.primaryHref}>
              {content.hero.primaryCta}
            </a>
            <a class={styles.secondary} href={content.hero.secondaryHref}>
              {content.hero.secondaryCta}
            </a>
          </div>
          {#if content.hero.trust.length > 0}
            <ul class={styles.trust}>
              {#each content.hero.trust as item}
                <li>{item}</li>
              {/each}
            </ul>
          {/if}
        </div>

        <aside class={styles.ticket} aria-label="Service area">
          <p class={styles.ticketLabel}>Service bay</p>
          <p class={styles.ticketValue}>
            {location ? `${location.city}${location.region ? `, ${location.region}` : ''}` : 'Local shop'}
          </p>
          <dl class={styles.ticketList}>
            <div>
              <dt>Approach</dt>
              <dd>Diagnose, quote, then repair</dd>
            </div>
            <div>
              <dt>Estimate</dt>
              <dd>Written, approved before work</dd>
            </div>
            <div>
              <dt>Hours</dt>
              <dd>Requests reviewed during shop hours</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  </section>

  <section class={styles.capabilities} id="capabilities">
    <div class="shell">
      <div class={styles.sectionHead}>
        <p class={styles.eyebrow}>On the lifts</p>
        <h2>What we work on</h2>
        <p>
          A typical independent shop menu. Your actual services are set by the business, not by this
          preview.
        </p>
      </div>

      <ol class={styles.rail}>
        {#each content.offerings as offering, index}
          <li class={styles.railItem}>
            <span class={styles.railNumber}>{String(index + 1).padStart(2, '0')}</span>
            <div class={styles.railBody}>
              <p class={styles.railCategory}>{offering.category}</p>
              <h3><a href={`/services/${offering.id}`}>{offering.name}</a></h3>
              <p>{offering.summary}</p>
              <ul class={styles.railFeatures}>
                {#each offering.features as feature}
                  <li>{feature}</li>
                {/each}
              </ul>
            </div>
            <span class={styles.railDuration}>{offering.duration}</span>
          </li>
        {/each}
      </ol>
    </div>
  </section>

  <section class={styles.process} id="process">
    <div class="shell">
      <div class={styles.processGrid}>
        <div class={styles.processCopy}>
          <p class={styles.eyebrow}>The work order</p>
          <h2>No guesswork, no surprise line items</h2>
          <p>Four steps, in order, every time.</p>
        </div>
        <ol class={styles.steps}>
          {#each content.process as step, index}
            <li class={styles.step}>
              <span class={styles.stepNumber}>{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          {/each}
        </ol>
      </div>
    </div>
  </section>

  {#if proof}
    <section class={styles.reviews} id="reviews">
      <div class="shell">
        <div class={styles.reviewInner}>
          <div>
            <p class={styles.reviewScore}>{proof.rating.toFixed(1)}</p>
            <p class={styles.reviewLabel}>
              {proof.reviewCount ? `${proof.reviewCount} reviews on ${proof.source}` : `Rated on ${proof.source}`}
            </p>
          </div>
          <p class={styles.reviewNote}>
            Reputation pulled from {proof.source} for {business.name}. Nothing here is invented.
          </p>
        </div>
      </div>
    </section>
  {/if}

  <section class={styles.faq} id="faq">
    <div class="shell">
      <div class={styles.sectionHead}>
        <p class={styles.eyebrow}>Before you book</p>
        <h2>Common questions</h2>
      </div>
      <div class={styles.faqList}>
        {#each content.faq as item, index}
          <details class={styles.faqItem} open={index === 0}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        {/each}
      </div>
    </div>
  </section>

  <section class={styles.booking} id="booking">
    <div class="shell">
      <div class={styles.bookingGrid}>
        <div class={styles.bookingCopy}>
          <p class={styles.eyebrow}>Request service</p>
          <h2>Tell us what it is doing</h2>
          <p>
            Send the symptom and your contact details. {business.shortName} reviews the request and
            replies with next steps.
          </p>
          {#if phone}
            <p class={styles.bookingPhone}>
              Prefer to talk? <a href={phone.dial}>{phone.display}</a>
            </p>
          {/if}
        </div>
        <div class={styles.bookingForm}>
          <BookingForm booking={content.booking} phone={phone} businessName={business.name} />
        </div>
      </div>
    </div>
  </section>

  <footer class={styles.foot}>
    <div class="shell">
      <div class={styles.footInner}>
        <p>© {year} {business.name}</p>
        <nav class={styles.footNav} aria-label="Footer">
          <a href="/privacy">Privacy</a>
          {#if phone}
            <a href={phone.dial}>{phone.display}</a>
          {/if}
        </nav>
      </div>
    </div>
  </footer>
</div>

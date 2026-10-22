<script lang="ts">
  import BookingForm from '$lib/components/BookingForm.svelte';
  import type { SiteContent } from '$lib/content/types';
  import styles from './RoofingSite.module.css';

  let { content }: { content: SiteContent } = $props();

  const business = $derived(content.business);
  const location = $derived(business.locations[0] ?? null);
  const phone = $derived(business.phone);
  const proof = $derived(content.proof);
</script>

<div class={styles.page}>
  <section class={styles.hero}>
    <div class={styles.stormRail}>
      <div class="shell">
        <p class={styles.stormText}>Storm damage? Inspections scheduled this week.</p>
      </div>
    </div>
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

        <aside class={styles.checklist} aria-label="Inspection checklist">
          <p class={styles.checklistTitle}>What an inspection covers</p>
          <ul>
            <li>Shingle and tile condition</li>
            <li>Flashing and penetrations</li>
            <li>Deck and underlayment</li>
            <li>Gutters and drainage</li>
            <li>Photo documentation</li>
          </ul>
          {#if location}
            <p class={styles.checklistArea}>
              Serving {location.city}{location.region ? `, ${location.region}` : ''}
            </p>
          {/if}
        </aside>
      </div>
    </div>
  </section>

  <section class={styles.inspect} id="inspect">
    <div class="shell">
      <div class={styles.sectionHead}>
        <p class={styles.kicker}>Roof work</p>
        <h2>Repair what is broken, replace what is finished</h2>
        <p>
          The list below is the typical scope for this trade. The business confirms which of these it
          actually offers before launch.
        </p>
      </div>

      <div class={styles.grid}>
        {#each content.offerings as offering, index}
          <article class={styles.card}>
            <div class={styles.cardTop}>
              <span class={styles.cardNumber}>{String(index + 1).padStart(2, '0')}</span>
              <p class={styles.cardCategory}>{offering.category}</p>
            </div>
            <h3><a href={`/services/${offering.id}`}>{offering.name}</a></h3>
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

  <section class={styles.process} id="process">
    <div class="shell">
      <div class={styles.processHead}>
        <p class={styles.kicker}>Simple sequence</p>
        <h2>Four steps, no surprises</h2>
      </div>
      <ol class={styles.timeline}>
        {#each content.process as step, index}
          <li class={styles.timelineItem}>
            <span class={styles.timelineDot}>{index + 1}</span>
            <div class={styles.timelineBody}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          </li>
        {/each}
      </ol>
    </div>
  </section>

  {#if proof}
    <section class={styles.reviews} id="reviews">
      <div class="shell">
        <div class={styles.reviewInner}>
          <div class={styles.reviewScore}>
            <strong>{proof.rating.toFixed(1)}</strong>
            <span>{proof.reviewCount ? `${proof.reviewCount} reviews` : 'reviews'}</span>
          </div>
          <p class={styles.reviewNote}>
            Published on {proof.source} for {business.name}. Shown exactly as it is listed.
          </p>
        </div>
      </div>
    </section>
  {/if}

  <section class={styles.faq} id="faq">
    <div class="shell">
      <div class={styles.sectionHead}>
        <p class={styles.kicker}>Straight answers</p>
        <h2>Common questions</h2>
      </div>
      <div class={styles.faqGrid}>
        {#each content.faq as item}
          <div class={styles.faqItem}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section class={styles.booking} id="booking">
    <div class="shell">
      <div class={styles.bookingGrid}>
        <div class={styles.bookingCopy}>
          <p class={styles.kicker}>Book an inspection</p>
          <h2>Get eyes on the roof</h2>
          <p>
            Tell {business.shortName} about the storm, the leak or the age of the roof. You get a
            documented opinion, not a sales pitch.
          </p>
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
</div>

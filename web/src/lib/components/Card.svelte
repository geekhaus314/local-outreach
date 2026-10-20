<script lang="ts">
  import styles from './Card.module.css';
  import type { Treatment } from '$lib/data/clinicContent';

  let {
    treatment,
    featured = false
  }: {
    treatment: Treatment;
    featured?: boolean;
  } = $props();
</script>

<article class={`${styles.card} ${featured ? styles.featured : ''}`}>
  <div class={styles.media}>
    <img src={treatment.image} alt={treatment.imageAlt} width="800" height="600" loading="lazy" decoding="async" />
  </div>

  <div class={styles.body}>
    <p class={styles.category}>{treatment.category}</p>
    <h3>{treatment.name}</h3>
    <p class={styles.summary}>{treatment.summary}</p>

    <ul class={styles.features}>
      {#each treatment.features as feature}
        <li>{feature}</li>
      {/each}
    </ul>

    <div class={styles.meta}>
      <span>{treatment.duration}</span>
      {#if treatment.priceFrom}
        <span>From {treatment.priceFrom}</span>
      {/if}
    </div>

    <a class={styles.link} href={`/services/${treatment.id}`} aria-label={`Read more about ${treatment.name}`}>
      View service details <span aria-hidden="true">→</span>
    </a>
  </div>
</article>

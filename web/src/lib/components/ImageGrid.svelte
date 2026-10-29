<script lang="ts">
  import { onMount } from 'svelte';

  let {
    images,
    label = 'Business photos'
  }: {
    images: Array<{ src: string; alt: string; caption?: string }>;
    label?: string;
  } = $props();

  let open = $state(false);
  let current = $state(0);

  function openLightbox(index = 0): void {
    current = index;
    open = true;
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox(): void {
    open = false;
    document.body.style.overflow = '';
  }

  function next(): void {
    current = (current + 1) % images.length;
  }

  function prev(): void {
    current = (current - 1 + images.length) % images.length;
  }

  function onLightboxKeydown(event: KeyboardEvent): void {
    if (!open) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowRight') next();
    if (event.key === 'ArrowLeft') prev();
  }

  onMount(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });
</script>

<section class="photoGrid">
  <div class="gridHead">
    <h2>{label}</h2>
    <p class="count">{images.length} images</p>
  </div>

  <div class="track">
    {#each images as image, index}
      <figure class="card">
        <button class="cardOpen" type="button" onclick={() => openLightbox(index)} aria-label={`Open ${image.alt}`}>
          <div class="imageWrap">
            <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
            <div class="imageOverlay"></div>
          </div>
        </button>
        {#if image.caption}
          <figcaption>{image.caption}</figcaption>
        {/if}
      </figure>
    {/each}
  </div>

  {#if open}
    <div
      class="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      tabindex={-1}
      onkeydown={onLightboxKeydown}
    >
      <button class="lightboxClose" onclick={closeLightbox} aria-label="Close">✕</button>
      <button class="lightboxNav prev" onclick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous">‹</button>
      <figure class="lightboxFigure">
        <img src={images[current].src} alt={images[current].alt} />
        {#if images[current].caption}
          <figcaption>{images[current].caption}</figcaption>
        {/if}
        <p class="lightboxCounter">{current + 1} / {images.length}</p>
      </figure>
      <button class="lightboxNav next" onclick={(e) => { e.stopPropagation(); next(); }} aria-label="Next">›</button>
    </div>
  {/if}
</section>

<style>
  .photoGrid {
    padding-block: clamp(3rem, 8vw, 5rem);
    background: var(--color-bg-alt);
  }

  .gridHead {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .gridHead h2 {
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 3vw, 2rem);
    margin: 0;
    color: var(--color-brand);
  }

  .count {
    font-size: 0.78rem;
    color: var(--color-text-muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .track {
    display: flex;
    gap: 1rem;
    overflow-x: auto;
    padding-bottom: 1rem;
    scrollbar-width: thin;
  }

  .card {
    flex: 0 0 auto;
    width: min(260px, 90vw);
    aspect-ratio: 4 / 5;
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    cursor: pointer;
  }

  .card:hover {
    border-color: var(--color-accent);
    transform: translateY(-0.25rem);
    box-shadow: var(--color-shadow);
  }

  .cardOpen {
    display: block;
    width: 100%;
    padding: 0;
    margin: 0;
    border: none;
    background: none;
    cursor: pointer;
  }

  .cardOpen:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .imageWrap {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .imageWrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }

  .card:hover .imageWrap img {
    transform: scale(1.06);
  }

  .imageOverlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.45), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .card:hover .imageOverlay {
    opacity: 1;
  }

  figcaption {
    font-size: 0.78rem;
    color: var(--color-text-muted);
    margin-top: 0.5rem;
    line-height: 1.4;
  }

  /* Lightbox */
  .lightbox {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    padding: 2rem;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(6px);
  }

  .lightboxClose {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.4);
    background: rgba(0,0,0,0.3);
    color: #fff;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    display: grid;
    place-items: center;
  }

  .lightboxClose:hover {
    background: rgba(0,0,0,0.5);
  }

  .lightboxNav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.3);
    background: rgba(0,0,0,0.3);
    color: #fff;
    font-size: 1.5rem;
    cursor: pointer;
    display: grid;
    place-items: center;
    user-select: none;
  }

  .lightboxNav.prev { left: 1.5rem; }
  .lightboxNav.next { right: 1.5rem; }
  .lightboxNav:hover { background: rgba(0,0,0,0.5); }

  .lightboxFigure {
    margin: 0;
    text-align: center;
    max-width: 70vw;
    max-height: 70vh;
  }

  .lightboxFigure img {
    max-width: 100%;
    max-height: 60vh;
    object-fit: contain;
    display: block;
    margin: 0 auto;
    border-radius: var(--radius-sm);
    box-shadow: var(--color-shadow-strong);
  }

  .lightboxFigure figcaption {
    margin-top: 1rem;
    color: #fff;
    font-size: 1rem;
  }

  .lightboxCounter {
    margin-top: 0.5rem;
    color: rgba(255,255,255,0.6);
    font-size: 0.85rem;
    font-family: var(--font-mono, monospace);
  }
</style>

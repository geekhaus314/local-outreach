<script lang="ts">
  import { onMount } from 'svelte';

  let {
    beforeImage,
    afterImage,
    beforeLabel = 'Before',
    afterLabel = 'After'
  }: {
    beforeImage: string;
    afterImage: string;
    beforeLabel?: string;
    afterLabel?: string;
  } = $props();

  let position = $state(50);
  let dragging = $state(false);

  function setPosition(x: number, containerWidth: number): void {
    const pct = Math.max(0, Math.min(100, (x / containerWidth) * 100));
    position = pct;
  }

  onMount(() => {
    if (typeof window === 'undefined') return;
    const move = (event: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setPosition(clientX - rect.left, rect.width);
    };
    const up = () => { dragging = false; };

    const container = document.querySelector('.beforeAfter');
    if (!container) return;

    container.addEventListener('mousedown', () => { dragging = true; });
    container.addEventListener('touchstart', () => { dragging = true; }, { passive: true });
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
    };
  });

  const dividerStyle = $derived(`left: ${position}%;`);
  const afterClip = $derived(`clip-path: polygon(${position}% 0, 100% 0, 100% 100%, ${position}% 100%);`);
</script>

<section class="beforeAfter">
  <div class="controls">
    <button class="chip active" onclick={() => (position = 0)}>0%</button>
    <button class="chip" onclick={() => (position = 50)}>50%</button>
    <button class="chip" onclick={() => (position = 100)}>100%</button>
  </div>

  <div class="stage">
    <div class="before">
      <img src={beforeImage} alt={beforeLabel} />
      <div class="label">{beforeLabel}</div>
    </div>
    <div class="after" style={afterClip}>
      <img src={afterImage} alt={afterLabel} />
      <div class="label">{afterLabel}</div>
    </div>
    <div class="divider" style={dividerStyle}>
      <span class="handle">◀ ▶</span>
    </div>
  </div>

  <p class="hint">Drag the divider to compare</p>
</section>

<style>
  .beforeAfter {
    padding-block: clamp(3rem, 8vw, 5rem);
    background: var(--color-bg-alt);
  }

  .controls {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .chip {
    padding: 0.45rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    color: var(--color-text-muted);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .chip.active {
    border-color: var(--color-accent);
    color: var(--color-accent);
    background: color-mix(in srgb, var(--color-accent) 8%, transparent);
  }

  .stage {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    cursor: ew-resize;
  }

  .before,
  .after {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .before img,
  .after img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .after {
    clip-path: var(--after-clip, polygon(50% 0, 100% 0, 100% 100%, 50% 100%));
  }

  .divider {
    position: absolute;
    top: 0;
    bottom: 0;
    left: var(--divider-left, 50%);
    width: 4px;
    background: var(--color-accent);
    cursor: ew-resize;
    z-index: 5;
  }

  .handle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    border: 3px solid var(--color-accent);
    background: #fff;
    display: grid;
    place-items: center;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--color-accent);
    box-shadow: var(--color-shadow);
    user-select: none;
  }

  .label {
    position: absolute;
    top: 1rem;
    padding: 0.45rem 1rem;
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.85);
    color: var(--color-brand);
    font-weight: 700;
    font-size: 0.85rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: var(--color-shadow);
  }

  .before .label { left: 1rem; }
  .after .label { right: 1rem; }

  .hint {
    margin-top: 1rem;
    text-align: center;
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  @media (max-width: 600px) {
    .stage { aspect-ratio: 1 / 1; }
  }
</style>

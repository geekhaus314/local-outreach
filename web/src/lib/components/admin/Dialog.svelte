<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import styles from './admin.module.css';

  let {
    title,
    onClose,
    wide = false,
    children,
    actions
  }: {
    title: string;
    onClose: () => void;
    wide?: boolean;
    children: Snippet;
    actions?: Snippet;
  } = $props();

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') onClose();
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<div
  class={styles.backdrop}
  role="presentation"
  onclick={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}
>
  <div
    class={`${styles.dialog} ${wide ? styles.dialogWide : ''}`}
    role="dialog"
    aria-modal="true"
    aria-label={title}
  >
    <div class={styles.dialogHead}>
      <h2 class={styles.dialogTitle}>{title}</h2>
      <button class={`${styles.button} ${styles.buttonGhost}`} type="button" onclick={onClose} aria-label="Close dialog">
        Close
      </button>
    </div>

    <div class={styles.dialogBody}>
      {@render children()}
    </div>

    {#if actions}
      <div class={styles.dialogActions}>
        {@render actions()}
      </div>
    {/if}
  </div>
</div>

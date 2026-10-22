<script lang="ts">
  import styles from './admin.module.css';

  let {
    loading = false,
    error = null,
    empty = false,
    title = '',
    message = '',
    onRetry
  }: {
    loading?: boolean;
    error?: string | null;
    empty?: boolean;
    title?: string;
    message?: string;
    onRetry?: () => void;
  } = $props();
</script>

{#if loading}
  <div class={styles.state}>
    <div class={styles.skeleton} style="width: 42%"></div>
    <div class={styles.skeleton} style="width: 78%"></div>
    <div class={styles.skeleton} style="width: 64%"></div>
  </div>
{:else if error}
  <div class={styles.state}>
    <p class={styles.stateTitle}>Could not load this data</p>
    <p>{error}</p>
    {#if onRetry}
      <button class={styles.button} type="button" onclick={onRetry}>Try again</button>
    {/if}
  </div>
{:else if empty}
  <div class={styles.state}>
    {#if title}<p class={styles.stateTitle}>{title}</p>{/if}
    {#if message}<p>{message}</p>{/if}
  </div>
{/if}

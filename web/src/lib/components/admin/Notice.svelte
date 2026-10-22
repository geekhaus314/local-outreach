<script lang="ts">
  import styles from './admin.module.css';

  let {
    kind,
    message,
    onDismiss
  }: {
    kind: 'success' | 'error';
    message: string;
    onDismiss: () => void;
  } = $props();
</script>

<div
  class={`${styles.toast} ${kind === 'error' ? styles.toastError : styles.toastSuccess}`}
  role={kind === 'error' ? 'alert' : 'status'}
>
  <span>{message}</span>
  <button class={`${styles.button} ${styles.buttonGhost}`} type="button" onclick={onDismiss} aria-label="Dismiss">
    Dismiss
  </button>
</div>

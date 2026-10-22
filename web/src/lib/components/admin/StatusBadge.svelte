<script lang="ts">
  import styles from './admin.module.css';
  import { badgeTone } from '$lib/admin/collection.svelte.ts';

  type Tone = 'info' | 'success' | 'warning' | 'danger' | 'accent' | 'neutral';

  let { label, tone }: { label: string; tone?: Tone } = $props();

  const toneClass: Record<Tone, string> = {
    info: styles.badgeInfo,
    success: styles.badgeSuccess,
    warning: styles.badgeWarning,
    danger: styles.badgeDanger,
    accent: styles.badgeAccent,
    neutral: ''
  };

  const resolved = $derived(tone ?? badgeTone(label));
  const className = $derived([styles.badge, toneClass[resolved]].filter(Boolean).join(' '));
</script>

<span class={className}>{label.replace(/_/g, ' ')}</span>

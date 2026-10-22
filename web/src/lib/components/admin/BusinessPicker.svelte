<script lang="ts">
  import { onMount } from 'svelte';
  import { adminApi, type AdminProspectSummary } from '$lib/admin/api.ts';
  import Dialog from './Dialog.svelte';
  import StateBlock from './StateBlock.svelte';
  import StatusBadge from './StatusBadge.svelte';
  import styles from './admin.module.css';

  let {
    title,
    actionLabel,
    onClose,
    onPick
  }: {
    title: string;
    actionLabel: string;
    onClose: () => void;
    onPick: (prospect: AdminProspectSummary) => void;
  } = $props();

  let prospects = $state<AdminProspectSummary[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let search = $state('');

  async function load(): Promise<void> {
    loading = true;
    error = null;
    try {
      const data = await adminApi.listProspects();
      prospects = data.prospects;
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Failed to load prospects.';
    } finally {
      loading = false;
    }
  }

  onMount(load);

  const filtered = $derived(
    prospects.filter((prospect) => {
      const needle = search.trim().toLowerCase();
      if (!needle) return true;
      return (
        prospect.name.toLowerCase().includes(needle) ||
        prospect.industry.toLowerCase().includes(needle) ||
        prospect.slug.toLowerCase().includes(needle)
      );
    })
  );
</script>

<Dialog {title} {onClose} wide>
  <div class={styles.field}>
    <label class={styles.fieldLabel} for="picker-search">Search prospects</label>
    <input
      id="picker-search"
      class={styles.input}
      type="search"
      placeholder="Name, industry or slug"
      bind:value={search}
    />
  </div>

  {#if loading}
    <StateBlock {loading} />
  {:else if error}
    <StateBlock {error} title="Could not load prospects" onRetry={load} />
  {:else if filtered.length === 0}
    <StateBlock empty title="No prospects match" message="Adjust the search, or create a prospect first." />
  {:else}
    <div class={styles.tableWrap}>
      <table class={styles.table}>
        <thead>
          <tr>
            <th>Business</th>
            <th>Industry</th>
            <th>Vertical</th>
            <th>Opportunity</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as prospect (prospect.slug)}
            <tr>
              <td class={styles.cellStrong}>{prospect.name}</td>
              <td class={styles.cellMuted}>{prospect.industry}</td>
              <td><StatusBadge label={prospect.vertical} tone="accent" /></td>
              <td>{prospect.opportunity}</td>
              <td class={styles.actions}>
                <button class={`${styles.button} ${styles.buttonPrimary}`} type="button" onclick={() => onPick(prospect)}>
                  {actionLabel}
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</Dialog>

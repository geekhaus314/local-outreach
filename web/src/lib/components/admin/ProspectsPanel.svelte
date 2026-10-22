<script lang="ts">
  import { adminApi, type AdminProspectDetail, type AdminProspectSummary } from '$lib/admin/api.ts';
  import { createAdminCollection } from '$lib/admin/collection.svelte.ts';
  import { VERTICAL_METAS } from '$lib/verticals/meta.ts';
  import Dialog from './Dialog.svelte';
  import Notice from './Notice.svelte';
  import ProspectDetail from './ProspectDetail.svelte';
  import ProspectForm from './ProspectForm.svelte';
  import StateBlock from './StateBlock.svelte';
  import StatusBadge from './StatusBadge.svelte';
  import styles from './admin.module.css';

  let search = $state('');
  let debouncedSearch = $state('');
  let vertical = $state('');
  let notice = $state<{ kind: 'success' | 'error'; message: string } | null>(null);
  let formOpen = $state(false);
  let editing = $state<AdminProspectDetail | null>(null);
  let detailSlug = $state<string | null>(null);
  let deleting = $state<AdminProspectSummary | null>(null);
  let busySlug = $state<string | null>(null);

  const collection = createAdminCollection<AdminProspectSummary>('prospects', () =>
    adminApi.listProspects({ q: debouncedSearch || undefined, vertical: vertical || undefined })
  );

  $effect(() => {
    const value = search;
    const timer = setTimeout(() => {
      debouncedSearch = value;
    }, 250);
    return () => clearTimeout(timer);
  });

  $effect(() => {
    void debouncedSearch;
    void vertical;
    collection.refresh();
  });

  function showNotice(kind: 'success' | 'error', message: string): void {
    notice = { kind, message };
  }

  async function regenerate(prospect: AdminProspectSummary): Promise<void> {
    busySlug = prospect.slug;
    notice = null;
    try {
      await adminApi.regenerate(prospect.slug, 'all');
      showNotice('success', `Regenerated the pipeline for ${prospect.name}.`);
      await collection.refresh();
    } catch (cause) {
      showNotice('error', cause instanceof Error ? cause.message : 'Regeneration failed.');
    } finally {
      busySlug = null;
    }
  }

  async function confirmDelete(): Promise<void> {
    if (!deleting) return;
    const target = deleting;
    try {
      await adminApi.deleteProspect(target.slug);
      showNotice('success', `Deleted ${target.name}.`);
      deleting = null;
      await collection.refresh();
    } catch (cause) {
      showNotice('error', cause instanceof Error ? cause.message : 'Could not delete the prospect.');
    }
  }

  function openEdit(prospect: AdminProspectSummary | AdminProspectDetail): void {
    editing = prospect as AdminProspectDetail;
    detailSlug = null;
    formOpen = true;
  }
</script>

<section class={styles.panel}>
  <div class={styles.panelHead}>
    <div>
      <h2 class={styles.panelTitle}>Prospects</h2>
      <p class={styles.panelMeta}>{collection.items.length} shown</p>
    </div>
    <div class={styles.toolbar}>
      <input
        class={styles.input}
        type="search"
        placeholder="Search name, industry or slug"
        bind:value={search}
        aria-label="Search prospects"
      />
      <select class={styles.select} bind:value={vertical} aria-label="Filter by vertical">
        <option value="">All verticals</option>
        {#each VERTICAL_METAS as meta (meta.id)}
          <option value={meta.id}>{meta.label}</option>
        {/each}
      </select>
      <button class={`${styles.button} ${styles.buttonPrimary}`} type="button" onclick={() => { editing = null; formOpen = true; }}>
        New prospect
      </button>
    </div>
  </div>

  {#if collection.loading}
    <StateBlock loading />
  {:else if collection.error}
    <StateBlock error={collection.error} title="Could not load prospects" onRetry={collection.refresh} />
  {:else if collection.items.length === 0}
    <StateBlock
      empty
      title="No prospects found"
      message="Create a prospect or adjust the search and filters."
    />
  {:else}
    <div class={styles.tableWrap}>
      <table class={styles.table}>
        <thead>
          <tr>
            <th>Business</th>
            <th>Industry</th>
            <th>Vertical</th>
            <th>Opportunity</th>
            <th>Classification</th>
            <th>Rating</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each collection.items as prospect (prospect.slug)}
            <tr>
              <td class={styles.cellStrong}>{prospect.name}</td>
              <td class={styles.cellMuted}>{prospect.industry || '—'}</td>
              <td><StatusBadge label={prospect.vertical} tone="accent" /></td>
              <td>{prospect.opportunity}</td>
              <td><StatusBadge label={prospect.classification} /></td>
              <td>
                {#if prospect.rating === null}
                  —
                {:else}
                  {prospect.rating.toFixed(1)} ({prospect.reviewCount ?? 0})
                {/if}
              </td>
              <td><StatusBadge label={prospect.status} /></td>
              <td class={styles.actions}>
                <button class={styles.button} type="button" onclick={() => (detailSlug = prospect.slug)}>View</button>
                <button class={styles.button} type="button" onclick={() => openEdit(prospect)}>Edit</button>
                <button
                  class={styles.button}
                  type="button"
                  disabled={busySlug === prospect.slug}
                  onclick={() => regenerate(prospect)}
                >
                  {busySlug === prospect.slug ? 'Running…' : 'Regenerate'}
                </button>
                <button class={`${styles.button} ${styles.buttonDanger}`} type="button" onclick={() => (deleting = prospect)}>
                  Delete
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>

{#if formOpen}
  <ProspectForm
    mode={editing ? 'edit' : 'create'}
    prospect={editing}
    onClose={() => (formOpen = false)}
    onSaved={() => {
      formOpen = false;
      showNotice('success', editing ? 'Prospect updated.' : 'Prospect created.');
      collection.refresh();
    }}
  />
{/if}

{#if detailSlug}
  <ProspectDetail
    slug={detailSlug}
    onClose={() => (detailSlug = null)}
    onEdit={openEdit}
    onChanged={() => collection.refresh()}
  />
{/if}

{#if deleting}
  <Dialog title={`Delete ${deleting.name}?`} onClose={() => (deleting = null)}>
    <p class={styles.cellMuted}>
      This removes the prospect along with its audits, pitches and previews. Booking history is kept.
    </p>
    {#snippet actions()}
      <button class={styles.button} type="button" onclick={() => (deleting = null)}>Cancel</button>
      <button class={`${styles.button} ${styles.buttonDanger}`} type="button" onclick={confirmDelete}>Delete</button>
    {/snippet}
  </Dialog>
{/if}

{#if notice}
  <Notice kind={notice.kind} message={notice.message} onDismiss={() => (notice = null)} />
{/if}

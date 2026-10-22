<script lang="ts">
  import { onMount } from 'svelte';
  import { adminApi, type AdminProspectDetail, type ProspectDetail } from '$lib/admin/api.ts';
  import { formatDate } from '$lib/admin/collection.svelte.ts';
  import Dialog from './Dialog.svelte';
  import Notice from './Notice.svelte';
  import StatusBadge from './StatusBadge.svelte';
  import StateBlock from './StateBlock.svelte';
  import styles from './admin.module.css';

  let {
    slug,
    onEdit,
    onChanged,
    onClose
  }: {
    slug: string;
    onEdit: (prospect: AdminProspectDetail) => void;
    onChanged: () => void;
    onClose: () => void;
  } = $props();

  let detail = $state<ProspectDetail | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let busy = $state<string | null>(null);
  let notice = $state<{ kind: 'success' | 'error'; message: string } | null>(null);

  async function load(): Promise<void> {
    loading = true;
    error = null;
    try {
      detail = await adminApi.getProspect(slug);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not load this prospect.';
    } finally {
      loading = false;
    }
  }

  onMount(load);

  async function regenerate(kind: 'audit' | 'pitch' | 'mockup' | 'all'): Promise<void> {
    busy = kind;
    notice = null;
    try {
      const result = await adminApi.regenerate(slug, kind);
      notice = { kind: 'success', message: `${kind === 'all' ? 'Pipeline' : kind} regenerated.` };
      await load();
      onChanged();
      void result;
    } catch (cause) {
      notice = { kind: 'error', message: cause instanceof Error ? cause.message : 'Regeneration failed.' };
    } finally {
      busy = null;
    }
  }

  async function markPitchSent(id: string): Promise<void> {
    notice = null;
    try {
      await adminApi.updatePitch(id, { status: 'sent' });
      notice = { kind: 'success', message: 'Pitch marked as sent.' };
      await load();
      onChanged();
    } catch (cause) {
      notice = { kind: 'error', message: cause instanceof Error ? cause.message : 'Could not update the pitch.' };
    }
  }

  function parseFindings(raw: string): string[] {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }
</script>

<Dialog title={detail?.prospect.name ?? 'Prospect'} {onClose} wide>
  {#if loading}
    <StateBlock {loading} />
  {:else if error}
    <StateBlock {error} title="Could not load this prospect" onRetry={load} />
  {:else if detail}
    <div class={styles.toolbar}>
      <div class={styles.toolbar}>
        <button class={`${styles.button} ${styles.buttonPrimary}`} type="button" disabled={busy !== null} onclick={() => regenerate('all')}>
          {busy === 'all' ? 'Running…' : 'Regenerate all'}
        </button>
        <button class={styles.button} type="button" disabled={busy !== null} onclick={() => regenerate('audit')}>
          {busy === 'audit' ? 'Running…' : 'Audit'}
        </button>
        <button class={styles.button} type="button" disabled={busy !== null} onclick={() => regenerate('pitch')}>
          {busy === 'pitch' ? 'Running…' : 'Pitch'}
        </button>
        <button class={styles.button} type="button" disabled={busy !== null} onclick={() => regenerate('mockup')}>
          {busy === 'mockup' ? 'Running…' : 'Mockup'}
        </button>
      </div>
      <div class={styles.toolbarSpacer}></div>
      <button class={styles.button} type="button" onclick={() => detail && onEdit(detail.prospect)}>Edit</button>
    </div>

    <div class={styles.detailGrid}>
      <div class={styles.detailItem}>
        <span class={styles.detailLabel}>Industry</span>
        <span class={styles.detailValue}>{detail.prospect.industry || '—'}</span>
      </div>
      <div class={styles.detailItem}>
        <span class={styles.detailLabel}>Vertical</span>
        <span class={styles.detailValue}><StatusBadge label={detail.prospect.vertical} tone="accent" /></span>
      </div>
      <div class={styles.detailItem}>
        <span class={styles.detailLabel}>Opportunity</span>
        <span class={styles.detailValue}>{detail.prospect.opportunity}</span>
      </div>
      <div class={styles.detailItem}>
        <span class={styles.detailLabel}>Classification</span>
        <span class={styles.detailValue}><StatusBadge label={detail.prospect.classification} /></span>
      </div>
      <div class={styles.detailItem}>
        <span class={styles.detailLabel}>Website</span>
        <span class={styles.detailValue}>
          {#if detail.prospect.website}
            <a href={detail.prospect.website} target="_blank" rel="noreferrer">{detail.prospect.website}</a>
          {:else}
            —
          {/if}
        </span>
      </div>
      <div class={styles.detailItem}>
        <span class={styles.detailLabel}>Audit summary</span>
        <span class={styles.detailValue}>{detail.prospect.auditSummary || 'Not audited'}</span>
      </div>
      <div class={styles.detailItem}>
        <span class={styles.detailLabel}>Site health</span>
        <span class={styles.detailValue}>{detail.prospect.siteHealth === null ? '—' : detail.prospect.siteHealth}</span>
      </div>
      <div class={styles.detailItem}>
        <span class={styles.detailLabel}>Rating</span>
        <span class={styles.detailValue}>
          {detail.prospect.rating === null ? '—' : `${detail.prospect.rating.toFixed(1)} (${detail.prospect.reviewCount ?? 0})`}
        </span>
      </div>
    </div>

    <hr class={styles.sectionDivider} />

    <h3 class={styles.panelTitle}>Audits ({detail.audits.length})</h3>
    {#if detail.audits.length === 0}
      <p class={styles.cellMuted}>No audits recorded yet.</p>
    {:else}
      <div class={styles.tableWrap}>
        <table class={styles.table}>
          <thead><tr><th>Date</th><th>Summary</th><th>Findings</th><th>Health</th></tr></thead>
          <tbody>
            {#each detail.audits as audit (audit.id)}
              <tr>
                <td class={styles.cellMuted}>{formatDate(audit.created_at)}</td>
                <td>{audit.summary}</td>
                <td>{parseFindings(audit.findings).length}</td>
                <td><StatusBadge label={audit.site_health === null ? 'unknown' : String(audit.site_health)} /></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    <hr class={styles.sectionDivider} />

    <h3 class={styles.panelTitle}>Pitches ({detail.pitches.length})</h3>
    {#if detail.pitches.length === 0}
      <p class={styles.cellMuted}>No pitches generated yet.</p>
    {:else}
      <div class={styles.tableWrap}>
        <table class={styles.table}>
          <thead><tr><th>Channel</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>
            {#each detail.pitches as pitch (pitch.id)}
              <tr>
                <td>{pitch.channel}</td>
                <td><StatusBadge label={pitch.status} /></td>
                <td class={styles.cellMuted}>{formatDate(pitch.created_at)}</td>
                <td class={styles.actions}>
                  {#if pitch.status !== 'sent'}
                    <button class={styles.button} type="button" onclick={() => markPitchSent(pitch.id)}>Mark sent</button>
                  {/if}
                </td>
              </tr>
              <tr>
                <td colspan="4"><div class={styles.pitchBody}>{pitch.body}</div></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    <hr class={styles.sectionDivider} />

    <h3 class={styles.panelTitle}>Previews ({detail.mockups.length})</h3>
    {#if detail.mockups.length === 0}
      <p class={styles.cellMuted}>No previews generated yet.</p>
    {:else}
      <div class={styles.tableWrap}>
        <table class={styles.table}>
          <thead><tr><th>Version</th><th>Template</th><th>Theme</th><th>Preview</th><th>Indexed</th></tr></thead>
          <tbody>
            {#each detail.mockups as mockup (mockup.id)}
              <tr>
                <td>{mockup.content_version}</td>
                <td>{mockup.template}</td>
                <td>{mockup.theme}</td>
                <td><a href={mockup.preview_host} target="_blank" rel="noreferrer">Open</a></td>
                <td><StatusBadge label={mockup.is_indexable ? 'indexed' : 'noindex'} /></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    <hr class={styles.sectionDivider} />

    <h3 class={styles.panelTitle}>Bookings ({detail.bookings.length})</h3>
    {#if detail.bookings.length === 0}
      <p class={styles.cellMuted}>No booking requests for this prospect.</p>
    {:else}
      <div class={styles.tableWrap}>
        <table class={styles.table}>
          <thead><tr><th>Name</th><th>Service</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {#each detail.bookings as booking (booking.id)}
              <tr>
                <td>{booking.name}</td>
                <td>{booking.service || '—'}</td>
                <td><StatusBadge label={booking.status} /></td>
                <td class={styles.cellMuted}>{formatDate(booking.created_at)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}

  {#snippet actions()}
    <button class={styles.button} type="button" onclick={onClose}>Close</button>
  {/snippet}
</Dialog>

{#if notice}
  <Notice kind={notice.kind} message={notice.message} onDismiss={() => (notice = null)} />
{/if}

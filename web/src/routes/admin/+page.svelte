<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import { adminApi, type AdminAudit, type AdminMockup, type AdminPitch, type AdminProspectSummary } from '$lib/admin/api.ts';
  import { createAdminCollection } from '$lib/admin/collection.svelte.ts';
  import { formatDate } from '$lib/admin/collection.svelte.ts';
  import ProspectForm from '$lib/components/admin/ProspectForm.svelte';
  import ProspectDetail from '$lib/components/admin/ProspectDetail.svelte';
  import Notice from '$lib/components/admin/Notice.svelte';
  import StateBlock from '$lib/components/admin/StateBlock.svelte';
  import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
  import styles from '$lib/components/admin/admin.module.css';

  let { data }: { data: PageData } = $props();

  let activeTab = $state<'pipeline' | 'prospects' | 'audits' | 'pitches' | 'mockups' | 'bookings' | 'job-runs'>(
    'pipeline'
  );

  let search = $state('');
  let formOpen = $state(false);
  let editing = $state<AdminProspectSummary | null>(null);
  let editingDetail = $state<{ prospect: import('$lib/admin/api.ts').AdminProspectDetail } | null>(null);
  let formBusy = $state(false);
  let detailSlug = $state<string | null>(null);
  let notice = $state<{ kind: 'success' | 'error'; message: string } | null>(null);
  let importing = $state(false);
  let importResult = $state<{ imported: number; skipped: number; total: number; errors: string[] } | null>(null);

  const prospects = createAdminCollection<AdminProspectSummary>('prospects', () =>
    adminApi.listProspects({ q: search || undefined })
  );
  const audits = createAdminCollection<AdminAudit>('audits', () => adminApi.listAudits());
  const pitches = createAdminCollection<AdminPitch>('pitches', () => adminApi.listPitches());
  const mockups = createAdminCollection<AdminMockup>('mockups', () => adminApi.listMockups());
  const bookings = createAdminCollection<{ id: string; business_id: string | null; business_slug: string; name: string; email: string; phone: string; service: string; message: string; consent: number; status: string; idempotency_key: string; created_at: string }>('bookings', () =>
    adminApi.listBookings()
  );
  const jobRuns = createAdminCollection<{ id: string; kind: string; status: string; attempts: number; payload: string; error: string; created_at: string; updated_at: string }>('jobRuns', () =>
    adminApi.listJobRuns()
  );

  async function refreshAll(): Promise<void> {
    await Promise.all([
      prospects.refresh(),
      audits.refresh(),
      pitches.refresh(),
      mockups.refresh(),
      bookings.refresh(),
      jobRuns.refresh()
    ]);
  }

  onMount(refreshAll);

  function showNotice(kind: 'success' | 'error', message: string): void {
    notice = { kind, message };
    setTimeout(() => (notice = null), 5000);
  }

  async function createProspect(): Promise<void> {
    editing = null;
    editingDetail = null;
    formOpen = true;
  }

  async function editProspect(prospect: AdminProspectSummary): Promise<void> {
    formBusy = true;
    try {
      editingDetail = await adminApi.getProspect(prospect.slug);
      editing = prospect;
      formOpen = true;
    } catch (cause) {
      showNotice('error', cause instanceof Error ? cause.message : 'Could not load the prospect.');
    } finally {
      formBusy = false;
    }
  }

  async function deleteProspect(prospect: AdminProspectSummary): Promise<void> {
    if (!confirm(`Delete ${prospect.name} and all its audits, pitches and previews?`)) return;
    try {
      await adminApi.deleteProspect(prospect.slug);
      showNotice('success', `Deleted ${prospect.name}.`);
      await refreshAll();
    } catch (cause) {
      showNotice('error', cause instanceof Error ? cause.message : 'Could not delete the prospect.');
    }
  }

  async function regenerateAll(kind: 'audit' | 'pitch' | 'mockup' | 'all'): Promise<void> {
    for (const p of prospects.items) {
      try {
        await adminApi.regenerate(p.slug, kind);
      } catch {
        // individual failures are surfaced per-prospect in the detail view
      }
    }
    showNotice('success', `Queued ${kind} regeneration for ${prospects.items.length} prospects.`);
    await refreshAll();
  }

  async function importLeads(): Promise<void> {
    importing = true;
    importResult = null;
    try {
      const response = await fetch('/api/admin/import-leads', { method: 'POST' });
      const result = await response.json() as { error?: string; imported: number; skipped: number; total: number; errors: string[] };
      if (!response.ok) {
        showNotice('error', result.error || 'Import failed.');
      } else {
        importResult = result;
        showNotice('success', `Imported ${result.imported} of ${result.total} leads (${result.skipped} skipped).`);
        await refreshAll();
      }
    } catch (cause) {
      showNotice('error', cause instanceof Error ? cause.message : 'Import failed.');
    } finally {
      importing = false;
    }
  }

  function selectTab(tab: string): void {
    activeTab = tab as typeof activeTab;
  }

  function tabLabel(tab: string): string {
    const labels: Record<string, string> = {
      pipeline: 'Pipeline',
      prospects: 'Prospects',
      audits: 'Audits',
      pitches: 'Pitches',
      mockups: 'Previews',
      bookings: 'Bookings',
      'job-runs': 'Job Runs'
    };
    return labels[tab] ?? tab;
  }

  function countFor(tab: string): number {
    switch (tab) {
      case 'prospects': return prospects.items.length;
      case 'audits': return audits.items.length;
      case 'pitches': return pitches.items.length;
      case 'mockups': return mockups.items.length;
      case 'bookings': return bookings.items.length;
      case 'job-runs': return jobRuns.items.length;
      default: return 0;
    }
  }

  const tabs = ['pipeline', 'prospects', 'audits', 'pitches', 'mockups', 'bookings', 'job-runs'] as const;
</script>

{#if !data.configured}
  <div class={styles.panel}>
    <h2>Database not bound</h2>
    <p>
      The admin console needs the D1 binding. Run
      <code>npm run db:migrate:local</code>
      to create the local database, then restart <code>npm run dev</code>.
    </p>
  </div>
{:else}
  <section class={styles.stats} aria-label="Pipeline summary">
    <div class={styles.stat}>
      <p class={styles.statValue}>{prospects.items.length}</p>
      <p class={styles.statLabel}>Prospects</p>
    </div>
    <div class={styles.stat}>
      <p class={styles.statValue}>{audits.items.length}</p>
      <p class={styles.statLabel}>Audits</p>
    </div>
    <div class={styles.stat}>
      <p class={styles.statValue}>{pitches.items.length}</p>
      <p class={styles.statLabel}>Pitches</p>
    </div>
    <div class={styles.stat}>
      <p class={styles.statValue}>{mockups.items.length}</p>
      <p class={styles.statLabel}>Previews</p>
    </div>
    <div class={styles.stat}>
      <p class={styles.statValue}>{bookings.items.length}</p>
      <p class={styles.statLabel}>Bookings</p>
    </div>
    <div class={styles.stat}>
      <p class={styles.statValue}>{jobRuns.items.length}</p>
      <p class={styles.statLabel}>Job runs</p>
    </div>
  </section>

  <div class={styles.tabs} role="tablist" aria-label="Pipeline tables">
    {#each tabs as tab (tab)}
      <button
        class={`${styles.tab}${activeTab === tab ? ` ${styles.tabActive}` : ''}`}
        type="button"
        role="tab"
        aria-selected={activeTab === tab}
        onclick={() => selectTab(tab)}
      >
        {tabLabel(tab)}
        <span class={styles.tabCount}>{countFor(tab)}</span>
      </button>
    {/each}
  </div>

  {#if activeTab === 'pipeline'}
    <div class={styles.panel}>
      <div class={styles.panelHead}>
        <div>
          <h2 class={styles.panelTitle}>Quick actions</h2>
          <p class={styles.panelMeta}>Start here. Import leads, generate pitches and previews, or create a prospect by hand.</p>
        </div>
        <div class={styles.actions}>
          <button class={styles.button} type="button" onclick={createProspect}>New prospect</button>
          <button class={styles.button} type="button" disabled={importing} onclick={importLeads}>
            {importing ? 'Importing…' : 'Import leads from CSV'}
          </button>
          <button class={styles.button} type="button" onclick={() => regenerateAll('all')}>Regenerate all</button>
        </div>
      </div>

      <div class={`${styles.sectionDivider} ${styles.actions}`}>
        <button class={styles.button} type="button" disabled={prospects.items.length === 0} onclick={() => regenerateAll('audit')}>
          Audit all prospects
        </button>
        <button class={styles.button} type="button" disabled={prospects.items.length === 0} onclick={() => regenerateAll('pitch')}>
          Generate pitches
        </button>
        <button class={styles.button} type="button" disabled={prospects.items.length === 0} onclick={() => regenerateAll('mockup')}>
          Generate previews
        </button>
      </div>

      {#if prospects.items.length === 0}
        <StateBlock empty title="No prospects yet" message="Import leads from leads.csv, run the scraper, or create a prospect by hand to start the pipeline." />
      {:else}
        <div class={`${styles.sectionDivider} ${styles.panelHead}`}>
          <h3 class={styles.panelTitle}>Top prospects</h3>
          <p class={styles.panelMeta}>{prospects.items.length} total · sorted by opportunity score</p>
        </div>
        <div class={styles.tableWrap}>
          <table class={styles.table}>
            <thead>
              <tr>
                {#each ['Business', 'Industry', 'Vertical', 'Opportunity', 'Classification', 'Status', ''] as col (col)}
                  <th>{col}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each prospects.items.slice(0, 10) as prospect (prospect.slug)}
                <tr>
                  <td class={styles.cellStrong}>{prospect.name}</td>
                  <td class={styles.cellMuted}>{prospect.industry || '—'}</td>
                  <td><StatusBadge label={prospect.vertical} tone="accent" /></td>
                  <td class={styles.cellStrong}>{prospect.opportunity}</td>
                  <td><StatusBadge label={prospect.classification} /></td>
                  <td><StatusBadge label={prospect.status} /></td>
                  <td>
                    <div class={styles.actions}>
                      <button class={styles.button} type="button" onclick={() => (detailSlug = prospect.slug)}>View</button>
                      <button class={styles.button} type="button" disabled={formBusy} onclick={() => editProspect(prospect)}>Edit</button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

  {:else if activeTab === 'prospects'}
    <div class={styles.panel}>
      <div class={styles.toolbar}>
        <h2 class={styles.panelTitle}>Prospects <span class={styles.panelMeta}>{prospects.items.length} records</span></h2>
        <div class={styles.toolbarSpacer}></div>
        <input class={styles.input} type="search" placeholder="Search business, industry, slug…" bind:value={search} aria-label="Search prospects" />
        <button class={styles.button} type="button" onclick={createProspect}>New prospect</button>
      </div>

      {#if prospects.loading}
        <StateBlock loading={prospects.loading} />
      {:else if prospects.error}
        <StateBlock error={prospects.error} title="Could not load prospects" onRetry={refreshAll} />
      {:else if prospects.items.length === 0}
        <StateBlock empty title="No prospects yet" message="Create a prospect or import leads from leads.csv." />
      {:else}
        <div class={styles.tableWrap}>
          <table class={styles.table}>
            <thead>
              <tr>
                {#each ['Business', 'Industry', 'Vertical', 'Opportunity', 'Classification', 'Rating', 'Status', ''] as col (col)}
                  <th>{col}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each prospects.items as prospect (prospect.slug)}
                <tr>
                  <td class={styles.cellStrong}>{prospect.name}</td>
                  <td class={styles.cellMuted}>{prospect.industry || '—'}</td>
                  <td><StatusBadge label={prospect.vertical} tone="accent" /></td>
                  <td class={styles.cellStrong}>{prospect.opportunity}</td>
                  <td><StatusBadge label={prospect.classification} /></td>
                  <td>
                    {prospect.rating === null ? '—' : `${prospect.rating.toFixed(1)} (${prospect.reviewCount ?? 0})`}
                  </td>
                  <td><StatusBadge label={prospect.status} /></td>
                  <td>
                    <div class={styles.actions}>
                      <button class={styles.button} type="button" onclick={() => (detailSlug = prospect.slug)}>View</button>
                      <button class={styles.button} type="button" disabled={formBusy} onclick={() => editProspect(prospect)}>Edit</button>
                      <button class={styles.buttonDanger} type="button" onclick={() => deleteProspect(prospect)}>Delete</button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

  {:else if activeTab === 'audits'}
    <div class={styles.panel}>
      <div class={styles.panelHead}>
        <h2 class={styles.panelTitle}>Audits <span class={styles.panelMeta}>{audits.items.length} recorded</span></h2>
      </div>

      {#if audits.loading}
        <StateBlock loading={audits.loading} />
      {:else if audits.error}
        <StateBlock error={audits.error} title="Could not load audits" onRetry={refreshAll} />
      {:else if audits.items.length === 0}
        <StateBlock empty title="No audits yet" message="Run an audit on a prospect to record its site health and findings." />
      {:else}
        <div class={styles.tableWrap}>
          <table class={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Business</th>
                <th>Summary</th>
                <th>Findings</th>
                <th>Health</th>
              </tr>
            </thead>
            <tbody>
              {#each audits.items as audit (audit.id)}
                <tr>
                  <td class={styles.cellMuted}>{formatDate(audit.created_at)}</td>
                  <td>{audit.business_name ?? audit.business_id}</td>
                  <td>{audit.summary}</td>
                  <td class={styles.cellMuted}>{JSON.parse(audit.findings || '[]').length}</td>
                  <td><StatusBadge label={audit.site_health === null ? 'unknown' : String(audit.site_health)} /></td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

  {:else if activeTab === 'pitches'}
    <div class={styles.panel}>
      <div class={styles.panelHead}>
        <h2 class={styles.panelTitle}>Pitches <span class={styles.panelMeta}>{pitches.items.length} generated</span></h2>
      </div>

      {#if pitches.loading}
        <StateBlock loading={pitches.loading} />
      {:else if pitches.error}
        <StateBlock error={pitches.error} title="Could not load pitches" onRetry={refreshAll} />
      {:else if pitches.items.length === 0}
        <StateBlock empty title="No pitches yet" message="Generate a pitch from a prospect detail view or in bulk from the Pipeline tab." />
      {:else}
        <div class={styles.tableWrap}>
          <table class={styles.table}>
            <thead>
              <tr>
                <th>Business</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Date</th>
                <th>Preview</th>
              </tr>
            </thead>
            <tbody>
              {#each pitches.items as pitch (pitch.id)}
                <tr>
                  <td>{pitch.business_name ?? pitch.business_id}</td>
                  <td>{pitch.channel}</td>
                  <td><StatusBadge label={pitch.status} /></td>
                  <td class={styles.cellMuted}>{formatDate(pitch.created_at)}</td>
                  <td><span class={styles.pitchBody}>{pitch.body.slice(0, 80)}…</span></td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

  {:else if activeTab === 'mockups'}
    <div class={styles.panel}>
      <div class={styles.panelHead}>
        <h2 class={styles.panelTitle}>Previews (mockups) <span class={styles.panelMeta}>{mockups.items.length} generated</span></h2>
      </div>

      {#if mockups.loading}
        <StateBlock loading={mockups.loading} />
      {:else if mockups.error}
        <StateBlock error={mockups.error} title="Could not load previews" onRetry={refreshAll} />
      {:else if mockups.items.length === 0}
        <StateBlock empty title="No previews yet" message="Generate a preview from a prospect detail view or in bulk from the Pipeline tab." />
      {:else}
        <div class={styles.tableWrap}>
          <table class={styles.table}>
            <thead>
              <tr>
                <th>Business</th>
                <th>Version</th>
                <th>Template</th>
                <th>Theme</th>
                <th>Preview</th>
                <th>Indexed</th>
              </tr>
            </thead>
            <tbody>
              {#each mockups.items as mockup (mockup.id)}
                <tr>
                  <td>{mockup.business_name ?? mockup.business_id}</td>
                  <td>{mockup.content_version}</td>
                  <td>{mockup.template}</td>
                  <td>{mockup.theme}</td>
                  <td>
                    {#if mockup.preview_host}
                      <a href={mockup.preview_host} target="_blank" rel="noreferrer" class={styles.detailLink}>Open</a>
                    {:else}
                      <span class={styles.cellMuted}>—</span>
                    {/if}
                  </td>
                  <td><StatusBadge label={mockup.is_indexable ? 'indexed' : 'noindex'} /></td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

  {:else if activeTab === 'bookings'}
    <div class={styles.panel}>
      <div class={styles.panelHead}>
        <h2 class={styles.panelTitle}>Booking requests <span class={styles.panelMeta}>{bookings.items.length} received</span></h2>
      </div>

      {#if bookings.loading}
        <StateBlock loading={bookings.loading} />
      {:else if bookings.error}
        <StateBlock error={bookings.error} title="Could not load bookings" onRetry={refreshAll} />
      {:else if bookings.items.length === 0}
        <StateBlock empty title="No bookings yet" message="Booking requests come in through the preview site booking form." />
      {:else}
        <div class={styles.tableWrap}>
          <table class={styles.table}>
            <thead>
              <tr>
                <th>Received</th>
                <th>Business</th>
                <th>Name</th>
                <th>Service</th>
                <th>Contact</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {#each bookings.items as booking (booking.id)}
                <tr>
                  <td class={styles.cellMuted}>{formatDate(booking.created_at)}</td>
                  <td>{booking.business_slug}</td>
                  <td class={styles.cellStrong}>{booking.name}</td>
                  <td>{booking.service || '—'}</td>
                  <td>{booking.email}</td>
                  <td><StatusBadge label={booking.status} /></td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

  {:else if activeTab === 'job-runs'}
    <div class={styles.panel}>
      <div class={styles.panelHead}>
        <h2 class={styles.panelTitle}>Job runs <span class={styles.panelMeta}>{jobRuns.items.length} logged</span></h2>
      </div>

      {#if jobRuns.loading}
        <StateBlock loading={jobRuns.loading} />
      {:else if jobRuns.error}
        <StateBlock error={jobRuns.error} title="Could not load job runs" onRetry={refreshAll} />
      {:else if jobRuns.items.length === 0}
        <StateBlock empty title="No job runs yet" message="Background jobs (cron, queue) appear here." />
      {:else}
        <div class={styles.tableWrap}>
          <table class={styles.table}>
            <thead>
              <tr>
                <th>Started</th>
                <th>Kind</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {#each jobRuns.items as run (run.id)}
                <tr>
                  <td class={styles.cellMuted}>{formatDate(run.created_at)}</td>
                  <td>{run.kind}</td>
                  <td><StatusBadge label={run.status} /></td>
                  <td>{run.attempts}</td>
                  <td class={styles.cellMuted}>{run.error || '—'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}

  {#if formOpen}
    <ProspectForm
      mode={editing ? 'edit' : 'create'}
      prospect={editingDetail?.prospect ?? null}
      onClose={() => (formOpen = false)}
      onSaved={() => {
        formOpen = false;
        showNotice('success', editing ? 'Prospect updated.' : 'Prospect created.');
        refreshAll();
      }}
    />
  {/if}

  {#if detailSlug}
    <ProspectDetail
      slug={detailSlug}
      onClose={() => (detailSlug = null)}
      onEdit={(detail) => {
        editingDetail = { prospect: detail };
        editing = detail;
        formOpen = true;
      }}
      onChanged={refreshAll}
    />
  {/if}
{/if}

{#if notice}
  <Notice kind={notice.kind} message={notice.message} onDismiss={() => (notice = null)} />
{/if}

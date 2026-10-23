<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import { adminApi, type AdminProspectSummary } from '$lib/admin/api.ts';
  import { createAdminCollection } from '$lib/admin/collection.svelte.ts';
  import { formatDate } from '$lib/admin/collection.svelte.ts';
  import ProspectForm from '$lib/components/admin/ProspectForm.svelte';
  import ProspectDetail from '$lib/components/admin/ProspectDetail.svelte';
  import Dialog from '$lib/components/admin/Dialog.svelte';
  import Notice from '$lib/components/admin/Notice.svelte';
  import StateBlock from '$lib/components/admin/StateBlock.svelte';
  import StatusBadge from '$lib/components/admin/StatusBadge.svelte';

  let { data }: { data: PageData } = $props();

  let activeTab = $state<'pipeline' | 'prospects' | 'audits' | 'pitches' | 'mockups' | 'bookings' | 'job-runs'>(
    'pipeline'
  );

  let search = $state('');
  let formOpen = $state(false);
  let editing = $state<AdminProspectSummary | null>(null);
  let detailSlug = $state<string | null>(null);
  let notice = $state<{ kind: 'success' | 'error'; message: string } | null>(null);
  let importing = $state(false);
  let importResult = $state<{ imported: number; skipped: number; total: number; errors: string[] } | null>(null);

  const prospects = createAdminCollection<AdminProspectSummary>('prospects', () =>
    adminApi.listProspects({ q: search || undefined })
  );
  const audits = createAdminCollection<{ id: string; business_id: string; summary: string; findings: string; site_health: number | null; created_at: string }>('audits', () =>
    adminApi.listAudits()
  );
  const pitches = createAdminCollection<{ id: string; business_id: string; channel: string; body: string; status: string; created_at: string }>('pitches', () =>
    adminApi.listPitches()
  );
  const mockups = createAdminCollection<{ id: string; business_id: string; template: string; theme: string; content_version: number; preview_host: string; is_indexable: number; created_at: string }>('mockups', () =>
    adminApi.listMockups()
  );
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
    formOpen = true;
  }

  async function editProspect(prospect: AdminProspectSummary): Promise<void> {
    editing = prospect;
    formOpen = true;
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
      const result = await response.json();
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

<svelte:head>
  <title>Pipeline admin</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<link rel="stylesheet" href="/styles/admin-tailwind.css" />

<div class="min-h-screen bg-adm-bg text-adm-text font-body">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <p class="text-xs font-mono tracking-widest uppercase text-adm-muted">Internal · Pipeline admin</p>
        <h1 class="font-display text-2xl tracking-tight">Freelance machine</h1>
      </div>
      <div class="flex items-center gap-3 text-sm text-adm-muted">
        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-adm-accent-soft text-adm-accent font-mono text-xs">
          {data.adminEmail?.slice(0, 2).toUpperCase() ?? '??'}
        </div>
        <span>Signed in as {data.adminEmail}</span>
      </div>
    </div>

    {/* Pipeline summary cards */}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="rounded-adm border border-adm-border bg-adm-surface p-4">
        <p class="text-xs font-mono tracking-widest uppercase text-adm-muted">Prospects</p>
        <p class="font-display text-xl tracking-tight">{prospects.items.length}</p>
      </div>
      <div class="rounded-adm border border-adm-border bg-adm-surface p-4">
        <p class="text-xs font-mono tracking-widest uppercase text-adm-muted">Audits</p>
        <p class="font-display text-xl tracking-tight">{audits.items.length}</p>
      </div>
      <div class="rounded-adm border border-adm-border bg-adm-surface p-4">
        <p class="text-xs font-mono tracking-widest uppercase text-adm-muted">Pitches</p>
        <p class="font-display text-xl tracking-tight">{pitches.items.length}</p>
      </div>
      <div class="rounded-adm border border-adm-border bg-adm-surface p-4">
        <p class="text-xs font-mono tracking-widest uppercase text-adm-muted">Previews</p>
        <p class="font-display text-xl tracking-tight">{mockups.items.length}</p>
      </div>
      <div class="rounded-adm border border-adm-border bg-adm-surface p-4">
        <p class="text-xs font-mono tracking-widest uppercase text-adm-muted">Bookings</p>
        <p class="font-display text-xl tracking-tight">{bookings.items.length}</p>
      </div>
      <div class="rounded-adm border border-adm-border bg-adm-surface p-4">
        <p class="text-xs font-mono tracking-widest uppercase text-adm-muted">Job runs</p>
        <p class="font-display text-xl tracking-tight">{jobRuns.items.length}</p>
      </div>
    </div>

    {/* Tabs */}
    <div class="flex flex-wrap gap-1 border-b border-adm-border mb-6">
      {#each tabs as tab}
        <button
          class="inline-flex items-center gap-2 px-3 py-2 border-b-2 border-transparent mb-[-1px] bg-transparent text-adm-muted font-semibold text-sm hover:text-adm-text transition-colors"
          class:active={activeTab === tab}
          class:text-adm-accent={activeTab === tab}
          class:border-adm-accent={activeTab === tab}
          class:bg-adm-accent-soft={activeTab === tab}
          onclick={() => selectTab(tab)}
        >
          {tabLabel(tab)}
          <span class="inline-grid place-items-center min-w-[1.5rem] h-[1.35rem] px-1 rounded-full bg-adm-surface-2 text-adm-muted font-mono text-[0.68rem]">
            {countFor(tab)}
          </span>
        </button>
      {/each}
    </div>

    {/* Pipeline */}
    {#if activeTab === 'pipeline'}
      <div class="rounded-adm border border-adm-border bg-adm-surface p-5 mb-6">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="font-display text-lg">Quick actions</h2>
            <p class="text-sm text-adm-muted">Start here. Import leads, generate pitches and previews, or create a prospect by hand.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button class="inline-flex items-center gap-2 rounded-adm-sm border border-adm-border bg-adm-surface px-3 py-1.5 text-sm font-semibold text-adm-text cursor-pointer hover:border-adm-accent hover:text-adm-accent transition-colors" type="button" onclick={createProspect}>
              New prospect
            </button>
            <button class="inline-flex items-center gap-2 rounded-adm-sm border border-adm-border bg-adm-surface px-3 py-1.5 text-sm font-semibold text-adm-text cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed transition-colors" type="button" disabled={importing} onclick={importLeads}>
              {importing ? 'Importing…' : 'Import leads from CSV'}
            </button>
            <button class="inline-flex items-center gap-2 rounded-adm-sm border border-adm-border bg-adm-surface px-3 py-1.5 text-sm font-semibold text-adm-text cursor-pointer hover:border-adm-accent hover:text-adm-accent transition-colors" type="button" onclick={() => regenerateAll('all')}>
              Regenerate all
            </button>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 pt-4">
          <button class="inline-flex items-center gap-2 rounded-adm-sm border border-adm-border bg-adm-surface px-3 py-1.5 text-sm font-semibold text-adm-text cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed transition-colors" disabled={prospects.items.length === 0} onclick={() => regenerateAll('audit')}>
            Audit all prospects
          </button>
          <button class="inline-flex items-center gap-2 rounded-adm-sm border border-adm-border bg-adm-surface px-3 py-1.5 text-sm font-semibold text-adm-text cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed transition-colors" disabled={prospects.items.length === 0} onclick={() => regenerateAll('pitch')}>
            Generate pitches
          </button>
          <button class="inline-flex items-center gap-2 rounded-adm-sm border border-adm-border bg-adm-surface px-3 py-1.5 text-sm font-semibold text-adm-text cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed transition-colors" disabled={prospects.items.length === 0} onclick={() => regenerateAll('mockup')}>
            Generate previews
          </button>
        </div>

        {#if prospects.items.length === 0}
          <div class="mt-6 rounded-adm border border-adm-border bg-adm-surface p-6 text-center">
            <p class="text-adm-muted">No prospects yet</p>
            <p class="text-sm text-adm-muted">Import leads from leads.csv, run the scraper, or create a prospect by hand to start the pipeline.</p>
          </div>
        {:else}
          <div class="mt-6">
            <div class="flex items-center justify-between gap-3 mb-3">
              <h3 class="font-display text-lg">Top prospects</h3>
              <p class="text-xs font-mono tracking-widest uppercase text-adm-muted">{prospects.items.length} total · sorted by opportunity score</p>
            </div>
            <div class="overflow-x-auto rounded-adm-sm border border-adm-border">
              <table class="w-full text-left text-sm border-collapse">
                <thead>
                  <tr class="bg-adm-surface-2 border-b border-adm-border">
                    {#each ['Business', 'Industry', 'Vertical', 'Opportunity', 'Classification', 'Status', ''] as col}
                      <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">{col}</th>
                    {/each}
                  </tr>
                </thead>
                <tbody>
                  {#each prospects.items.slice(0, 10) as prospect (prospect.slug)}
                    <tr class="border-b border-adm-border hover:bg-color-mix(in srgb, var(--color-accent) 5%, transparent) transition-colors">
                      <td class="px-3 py-3 font-semibold">{prospect.name}</td>
                      <td class="px-3 py-3 text-adm-muted">{prospect.industry || '—'}</td>
                      <td class="px-3 py-3"><StatusBadge label={prospect.vertical} tone="accent" /></td>
                      <td class="px-3 py-3 font-semibold">{prospect.opportunity}</td>
                      <td class="px-3 py-3"><StatusBadge label={prospect.classification} /></td>
                      <td class="px-3 py-3"><StatusBadge label={prospect.status} /></td>
                      <td class="px-3 py-3">
                        <button class="inline-flex items-center gap-1 rounded-adm-sm border border-adm-border bg-adm-surface px-2.5 py-1 text-xs font-medium text-adm-text cursor-pointer hover:border-adm-accent hover:text-adm-accent transition-colors" type="button" onclick={() => (detailSlug = prospect.slug)}>
                          View
                        </button>
                        <button class="inline-flex items-center gap-1 rounded-adm-sm border border-adm-border bg-adm-surface px-2.5 py-1 text-xs font-medium text-adm-text cursor-pointer hover:border-adm-accent hover:text-adm-accent transition-colors ml-1" type="button" onclick={() => editProspect(prospect)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
      </div>

    {/* Prospects */}
    {:else if activeTab === 'prospects'}
      <div class="rounded-adm border border-adm-border bg-adm-surface p-5">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="font-display text-lg">Prospects</h2>
            <p class="text-sm text-adm-muted">{prospects.items.length} records</p>
          </div>
          <div class="flex items-center gap-2">
            <input
              id="prospect-search"
              class="rounded-adm-sm border border-adm-border bg-adm-surface px-3 py-1.5 text-sm text-adm-text focus:outline-none focus:ring-1 focus:ring-adm-accent transition-colors"
              type="search"
              placeholder="Search business, industry, slug…"
              bind:value={search}
            />
            <button class="inline-flex items-center gap-2 rounded-adm-sm border border-adm-border bg-adm-surface px-3 py-1.5 text-sm font-semibold text-adm-text cursor-pointer hover:border-adm-accent hover:text-adm-accent transition-colors" type="button" onclick={createProspect}>
              New prospect
            </button>
          </div>
        </div>

        {#if prospects.loading}
          <StateBlock {loading} />
        {:else if prospects.error}
          <StateBlock error={prospects.error} title="Could not load prospects" onRetry={refreshAll} />
        {:else if prospects.items.length === 0}
          <StateBlock empty title="No prospects yet" message="Create a prospect or import leads from leads.csv." />
        {:else}
          <div class="overflow-x-auto rounded-adm-sm border border-adm-border">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-adm-surface-2 border-b border-adm-border">
                  {#each ['Business', 'Industry', 'Vertical', 'Opportunity', 'Classification', 'Rating', 'Status', ''] as col}
                    <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">{col}</th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each prospects.items as prospect (prospect.slug)}
                  <tr class="border-b border-adm-border hover:bg-color-mix(in srgb, var(--color-accent) 5%, transparent) transition-colors">
                    <td class="px-3 py-3 font-semibold">{prospect.name}</td>
                    <td class="px-3 py-3 text-adm-muted">{prospect.industry || '—'}</td>
                    <td class="px-3 py-3"><StatusBadge label={prospect.vertical} tone="accent" /></td>
                    <td class="px-3 py-3 font-semibold">{prospect.opportunity}</td>
                    <td class="px-3 py-3"><StatusBadge label={prospect.classification} /></td>
                    <td class="px-3 py-3">
                      {prospect.rating === null ? '—' : `${prospect.rating.toFixed(1)} (${prospect.reviewCount ?? 0})`}
                    </td>
                    <td class="px-3 py-3"><StatusBadge label={prospect.status} /></td>
                    <td class="px-3 py-3">
                      <button class="inline-flex items-center gap-1 rounded-adm-sm border border-adm-border bg-adm-surface px-2.5 py-1 text-xs font-medium text-adm-text cursor-pointer hover:border-adm-accent hover:text-adm-accent transition-colors" type="button" onclick={() => (detailSlug = prospect.slug)}>
                        View
                      </button>
                      <button class="inline-flex items-center gap-1 rounded-adm-sm border border-adm-border bg-adm-surface px-2.5 py-1 text-xs font-medium text-adm-text cursor-pointer hover:border-adm-accent hover:text-adm-accent transition-colors ml-1" type="button" onclick={() => editProspect(prospect)}>
                        Edit
                      </button>
                      <button class="inline-flex items-center gap-1 rounded-adm-sm border border-adm-border bg-adm-surface px-2.5 py-1 text-xs font-medium text-adm-danger cursor-pointer hover:border-adm-danger hover:text-adm-danger transition-colors ml-1" type="button" onclick={() => deleteProspect(prospect)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>

    {/* Audits */}
    {:else if activeTab === 'audits'}
      <div class="rounded-adm border border-adm-border bg-adm-surface p-5">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="font-display text-lg">Audits</h2>
            <p class="text-sm text-adm-muted">{audits.items.length} recorded</p>
          </div>
        </div>

        {#if audits.loading}
          <StateBlock {loading} />
        {:else if audits.error}
          <StateBlock error={audits.error} title="Could not load audits" onRetry={refreshAll} />
        {:else if audits.items.length === 0}
          <StateBlock empty title="No audits yet" message="Run an audit on a prospect to record its site health and findings." />
        {:else}
          <div class="overflow-x-auto rounded-adm-sm border border-adm-border">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-adm-surface-2 border-b border-adm-border">
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Date</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Business</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Summary</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Findings</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Health</th>
                </tr>
              </thead>
              <tbody>
                {#each audits.items as audit (audit.id)}
                  <tr class="border-b border-adm-border">
                    <td class="px-3 py-3 text-adm-muted">{formatDate(audit.created_at)}</td>
                    <td class="px-3 py-3">{audit.business_id}</td>
                    <td class="px-3 py-3">{audit.summary}</td>
                    <td class="px-3 py-3 font-mono">{JSON.parse(audit.findings || '[]').length}</td>
                    <td class="px-3 py-3"><StatusBadge label={audit.site_health === null ? 'unknown' : String(audit.site_health)} /></td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>

    {/* Pitches */}
    {:else if activeTab === 'pitches'}
      <div class="rounded-adm border border-adm-border bg-adm-surface p-5">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="font-display text-lg">Pitches</h2>
            <p class="text-sm text-adm-muted">{pitches.items.length} generated</p>
          </div>
        </div>

        {#if pitches.loading}
          <StateBlock {loading} />
        {:else if pitches.error}
          <StateBlock error={pitches.error} title="Could not load pitches" onRetry={refreshAll} />
        {:else if pitches.items.length === 0}
          <StateBlock empty title="No pitches yet" message="Generate a pitch from a prospect detail view or in bulk from the Pipeline tab." />
        {:else}
          <div class="overflow-x-auto rounded-adm-sm border border-adm-border">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-adm-surface-2 border-b border-adm-border">
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Business</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Channel</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Status</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Date</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Preview</th>
                </tr>
              </thead>
              <tbody>
                {#each pitches.items as pitch (pitch.id)}
                  <tr class="border-b border-adm-border">
                    <td class="px-3 py-3">{pitch.business_id}</td>
                    <td class="px-3 py-3">{pitch.channel}</td>
                    <td class="px-3 py-3"><StatusBadge label={pitch.status} /></td>
                    <td class="px-3 py-3 text-adm-muted">{formatDate(pitch.created_at)}</td>
                    <td class="px-3 py-3">
                      <button class="inline-flex items-center gap-1 rounded-adm-sm border border-adm-border bg-adm-surface px-2.5 py-1 text-xs font-medium text-adm-text cursor-pointer hover:border-adm-accent hover:text-adm-accent transition-colors" type="button">
                        {pitch.body.slice(0, 80)}…
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>

    {/* Mockups */}
    {:else if activeTab === 'mockups'}
      <div class="rounded-adm border border-adm-border bg-adm-surface p-5">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="font-display text-lg">Previews (mockups)</h2>
            <p class="text-sm text-adm-muted">{mockups.items.length} generated</p>
          </div>
        </div>

        {#if mockups.loading}
          <StateBlock {loading} />
        {:else if mockups.error}
          <StateBlock error={mockups.error} title="Could not load previews" onRetry={refreshAll} />
        {:else if mockups.items.length === 0}
          <StateBlock empty title="No previews yet" message="Generate a preview from a prospect detail view or in bulk from the Pipeline tab." />
        {:else}
          <div class="overflow-x-auto rounded-adm-sm border border-adm-border">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-adm-surface-2 border-b border-adm-border">
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Business</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Version</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Template</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Theme</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Preview</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Indexed</th>
                </tr>
              </thead>
              <tbody>
                {#each mockups.items as mockup (mockup.id)}
                  <tr class="border-b border-adm-border">
                    <td class="px-3 py-3">{mockup.business_id}</td>
                    <td class="px-3 py-3">{mockup.content_version}</td>
                    <td class="px-3 py-3">{mockup.template}</td>
                    <td class="px-3 py-3">{mockup.theme}</td>
                    <td class="px-3 py-3"><a href={mockup.preview_host} target="_blank" rel="noreferrer" class="text-adm-accent hover:underline">Open</a></td>
                    <td class="px-3 py-3"><StatusBadge label={mockup.is_indexable ? 'indexed' : 'noindex'} /></td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>

    {/* Bookings */}
    {:else if activeTab === 'bookings'}
      <div class="rounded-adm border border-adm-border bg-adm-surface p-5">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="font-display text-lg">Booking requests</h2>
            <p class="text-sm text-adm-muted">{bookings.items.length} received</p>
          </div>
        </div>

        {#if bookings.loading}
          <StateBlock {loading} />
        {:else if bookings.error}
          <StateBlock error={bookings.error} title="Could not load bookings" onRetry={refreshAll} />
        {:else if bookings.items.length === 0}
          <StateBlock empty title="No bookings yet" message="Booking requests come in through the preview site booking form." />
        {:else}
          <div class="overflow-x-auto rounded-adm-sm border border-adm-border">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-adm-surface-2 border-b border-adm-border">
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Received</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Business</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Name</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Service</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Contact</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {#each bookings.items as booking (booking.id)}
                  <tr class="border-b border-adm-border">
                    <td class="px-3 py-3 text-adm-muted">{formatDate(booking.created_at)}</td>
                    <td class="px-3 py-3">{booking.business_slug}</td>
                    <td class="px-3 py-3">{booking.name}</td>
                    <td class="px-3 py-3">{booking.service || '—'}</td>
                    <td class="px-3 py-3">{booking.email}</td>
                    <td class="px-3 py-3"><StatusBadge label={booking.status} /></td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>

    {/* Job runs */}
    {:else if activeTab === 'job-runs'}
      <div class="rounded-adm border border-adm-border bg-adm-surface p-5">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="font-display text-lg">Job runs</h2>
            <p class="text-sm text-adm-muted">{jobRuns.items.length} logged</p>
          </div>
        </div>

        {#if jobRuns.loading}
          <StateBlock {loading} />
        {:else if jobRuns.error}
          <StateBlock error={jobRuns.error} title="Could not load job runs" onRetry={refreshAll} />
        {:else if jobRuns.items.length === 0}
          <StateBlock empty title="No job runs yet" message="Background jobs (cron, queue) appear here." />
        {:else}
          <div class="overflow-x-auto rounded-adm-sm border border-adm-border">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-adm-surface-2 border-b border-adm-border">
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Started</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Kind</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Status</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Attempts</th>
                  <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Error</th>
                </tr>
              </thead>
              <tbody>
                {#each jobRuns.items as run (run.id)}
                  <tr class="border-b border-adm-border">
                    <td class="px-3 py-3 text-adm-muted">{formatDate(run.created_at)}</td>
                    <td class="px-3 py-3">{run.kind}</td>
                    <td class="px-3 py-3"><StatusBadge label={run.status} /></td>
                    <td class="px-3 py-3">{run.attempts}</td>
                    <td class="px-3 py-3 text-adm-muted">{run.error || '—'}</td>
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
        prospect={editing as any}
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
        onEdit={editProspect}
        onChanged={refreshAll}
      />
    {/if}

    {#if notice}
      <Notice kind={notice.kind} message={notice.message} onDismiss={() => (notice = null)} />
    {/if}

    {#if importResult}
      <div class="rounded-adm border border-adm-border bg-adm-surface p-5 mt-6">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="font-display text-lg">Import results</h2>
            <p class="text-sm text-adm-muted">{importResult.imported} of {importResult.total} leads imported</p>
          </div>
        </div>
        <div class="overflow-x-auto rounded-adm-sm border border-adm-border">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="bg-adm-surface-2 border-b border-adm-border">
                <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Imported</th>
                <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Skipped</th>
                <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-adm-muted">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-adm-border">
                <td class="px-3 py-3">{importResult.imported}</td>
                <td class="px-3 py-3">{importResult.skipped}</td>
                <td class="px-3 py-3">{importResult.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {#if importResult.errors.length > 0}
          <h3 class="font-display text-lg mt-4">Errors</h3>
          <ul class="list-disc pl-5 text-sm text-adm-muted">
            {#each importResult.errors as error (error)}
              <li>{error}</li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
  </div>
</div>

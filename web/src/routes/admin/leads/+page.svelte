<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import {
    adminCommsApi,
    adminLeadsApi,
    LEAD_LIFECYCLE_STATUSES,
    type AdminCommunication,
    type AdminLead,
    type LeadDetail
  } from '$lib/admin/api.ts';
  import { formatDate } from '$lib/admin/collection.svelte.ts';
  import Notice from '$lib/components/admin/Notice.svelte';
  import StateBlock from '$lib/components/admin/StateBlock.svelte';
  import Dialog from '$lib/components/admin/Dialog.svelte';
  import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
  import styles from '$lib/components/admin/admin.module.css';

  let { data }: { data: PageData } = $props();

  let leads = $state<AdminLead[]>([]);
  let loading = $state(false);
  let listError = $state<string | null>(null);
  let search = $state('');
  let lifecycleFilter = $state('all');
  let notice = $state<{ kind: 'success' | 'error'; message: string } | null>(null);
  let busySlug = $state<string | null>(null);

  let detail = $state<LeadDetail | null>(null);
  let detailLoading = $state(false);
  let detailError = $state<string | null>(null);

  let commsBusy = $state(false);
  let commsDirection = $state<'outbound' | 'inbound'>('outbound');
  let commsChannel = $state('sms');
  let commsSubject = $state('');
  let commsBody = $state('');
  let commsOccurredAt = $state('');
  let commsResponseTo = $state('');
  let commsOutcome = $state('');
  let commsError = $state<string | null>(null);

  const channels = ['sms', 'call', 'voicemail', 'email', 'form', 'in_person', 'letter'];

  onMount(() => {
    leads = data.leads;
    if (!data.dbConfigured) return;
    void refresh();
  });

  function showNotice(kind: 'success' | 'error', message: string): void {
    notice = { kind, message };
    setTimeout(() => (notice = null), 5000);
  }

  async function refresh(): Promise<void> {
    loading = true;
    listError = null;
    try {
      const result = await adminLeadsApi.listLeads({
        q: search || undefined,
        lifecycle: lifecycleFilter === 'all' ? undefined : lifecycleFilter
      });
      leads = result.leads;
    } catch (cause) {
      listError = cause instanceof Error ? cause.message : 'Could not load leads.';
    } finally {
      loading = false;
    }
  }

  let debounceTimer: ReturnType<typeof setTimeout>;
  function onSearchInput(): void {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void refresh(), 250);
  }

  async function openDetail(slug: string): Promise<void> {
    detailLoading = true;
    detailError = null;
    detail = null;
    try {
      detail = await adminLeadsApi.getLead(slug);
      resetCommsForm();
    } catch (cause) {
      detailError = cause instanceof Error ? cause.message : 'Could not load the lead.';
    } finally {
      detailLoading = false;
    }
  }

  async function setLifecycle(lead: AdminLead, to: string): Promise<void> {
    busySlug = lead.slug;
    try {
      await adminLeadsApi.transitionLifecycle(lead.slug, to);
      lead.lifecycle_status = to;
      if (detail?.prospect.slug === lead.slug) {
        detail.prospect.lifecycle_status = to;
        detail = { ...detail };
      }
      showNotice('success', `${lead.name} moved to ${to.replace('_', ' ')}.`);
    } catch (cause) {
      showNotice('error', cause instanceof Error ? cause.message : 'Lifecycle update failed.');
    } finally {
      busySlug = null;
    }
  }

  async function deleteLead(lead: AdminLead): Promise<void> {
    if (!confirm(`Delete ${lead.name} plus its audits, pitches, messages and previews?`)) return;
    busySlug = lead.slug;
    try {
      await adminLeadsApi.deleteLead(lead.slug);
      leads = leads.filter((l) => l.slug !== lead.slug);
      showNotice('success', `Deleted ${lead.name}.`);
    } catch (cause) {
      showNotice('error', cause instanceof Error ? cause.message : 'Delete failed.');
    } finally {
      busySlug = null;
    }
  }

  function resetCommsForm(): void {
    commsDirection = 'outbound';
    commsChannel = 'sms';
    commsSubject = '';
    commsBody = '';
    commsOccurredAt = '';
    commsResponseTo = '';
    commsOutcome = '';
    commsError = null;
  }

  async function addCommunication(): Promise<void> {
    if (!detail) return;
    commsBusy = true;
    commsError = null;
    try {
      const created = await adminCommsApi.create({
        business_id: detail.prospect.id,
        direction: commsDirection,
        channel: commsChannel,
        subject: commsSubject,
        body: commsBody,
        occurred_at: commsOccurredAt ? new Date(commsOccurredAt).toISOString() : null,
        response_to: commsResponseTo || null,
        outcome: commsOutcome
      });
      detail.communications = [created.communication, ...detail.communications].sort(
        (a, b) => String(b.occurred_at ?? b.created_at).localeCompare(String(a.occurred_at ?? a.created_at))
      );
      detail = { ...detail };
      resetCommsForm();
      showNotice('success', 'Message logged.');
    } catch (cause) {
      commsError = cause instanceof Error ? cause.message : 'Could not log the message.';
    } finally {
      commsBusy = false;
    }
  }

  async function removeCommunication(comm: AdminCommunication): Promise<void> {
    if (!detail) return;
    commsBusy = true;
    try {
      await adminCommsApi.remove(comm.id);
      detail.communications = detail.communications.filter((c) => c.id !== comm.id);
      detail = { ...detail };
    } catch (cause) {
      commsError = cause instanceof Error ? cause.message : 'Delete failed.';
    } finally {
      commsBusy = false;
    }
  }

  function labelFor(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
</script>

<div class={styles.toolbar}>
  <h2 class={styles.panelTitle}>
    Leads <span class={styles.panelMeta}>{leads.length} shown · full lifecycle tracking</span>
  </h2>
  <div class={styles.toolbarSpacer}></div>
  <input
    class={styles.input}
    type="search"
    placeholder="Search name, industry, phone…"
    bind:value={search}
    oninput={onSearchInput}
    aria-label="Search leads"
  />
  <select class={styles.select} bind:value={lifecycleFilter} onchange={() => void refresh()} aria-label="Filter by lifecycle stage">
    <option value="all">All stages</option>
    {#each LEAD_LIFECYCLE_STATUSES as status (status)}
      <option value={status}>{labelFor(status)}</option>
    {/each}
  </select>
  <button class={styles.button} type="button" onclick={() => void refresh()}>Refresh</button>
</div>

{#if !data.dbConfigured}
  <div class={styles.panel}>
    <h2 class={styles.panelTitle}>Database not bound</h2>
    <p>Run <code>npm run db:migrate:local</code>, then restart <code>npm run dev</code>.</p>
  </div>
{:else if loading}
  <StateBlock {loading} />
{:else if listError}
  <StateBlock error={listError} title="Could not load leads" onRetry={refresh} />
{:else if leads.length === 0}
  <StateBlock empty title="No leads in this view" message="Adjust the filters, or import leads from leads.csv in the Pipeline tab." />
{:else}
  <div class={styles.tableWrap}>
    <table class={styles.table}>
      <thead>
        <tr>
          <th>Business</th>
          <th>Industry</th>
          <th>Opportunity</th>
          <th>Site health</th>
          <th>Stage</th>
          <th>Contact</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each leads as lead (lead.slug)}
          <tr>
            <td>
              <button class={styles.linkButton} type="button" onclick={() => void openDetail(lead.slug)}>
                {lead.name}
              </button>
              <div class={styles.cellMuted}>{lead.website || 'no site listed'}</div>
            </td>
            <td class={styles.cellMuted}>{lead.industry || '—'}</td>
            <td class={styles.cellStrong}>{lead.opportunity}</td>
            <td><StatusBadge label={lead.site_health === null ? 'unknown' : String(lead.site_health)} /></td>
            <td>
              <select
                class={`${styles.select} ${styles.lifecycleSelect}`}
                value={lead.lifecycle_status}
                disabled={busySlug === lead.slug}
                onchange={(event) => void setLifecycle(lead, event.currentTarget.value)}
                aria-label={`Lifecycle stage for ${lead.name}`}
              >
                {#each LEAD_LIFECYCLE_STATUSES as status (status)}
                  <option value={status}>{labelFor(status)}</option>
                {/each}
              </select>
            </td>
            <td class={styles.cellMuted}>
              {lead.phone || lead.email || '—'}
              <div>{formatDate(lead.last_audited)}</div>
            </td>
            <td>
              <div class={styles.actions}>
                <button class={styles.button} type="button" onclick={() => void openDetail(lead.slug)} disabled={busySlug === lead.slug}>Open</button>
                {#if data.user?.role !== 'viewer'}
                  <button class={styles.buttonDanger} type="button" onclick={() => void deleteLead(lead)} disabled={busySlug === lead.slug}>Delete</button>
                {/if}
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

{#if detailLoading}
  <StateBlock {loading} />
{:else if detailError}
  <StateBlock error={detailError} title="Could not load lead" onRetry={() => detail = null} />
{:else if detail}
  <Dialog title={detail.prospect.name} onClose={() => (detail = null)} wide>
    <p class={styles.panelMeta}>
      {detail.prospect.industry} · opportunity {detail.prospect.opportunity} · stage {detail.prospect.lifecycle_status}
    </p>
    <div class={styles.detailGrid}>
      <div>
        <div class={styles.detailItem}>
          <p class={styles.detailLabel}>Contact</p>
          <p class={styles.detailValue}>{detail.prospect.phone || '—'} · {detail.prospect.email || 'no email'}</p>
        </div>
        <div class={styles.detailItem}>
          <p class={styles.detailLabel}>Address</p>
          <p class={styles.detailValue}>{detail.prospect.address || '—'}</p>
        </div>
        <div class={styles.detailItem}>
          <p class={styles.detailLabel}>Website</p>
          <p class={styles.detailValue}>
            {#if detail.prospect.website}
              <a href={detail.prospect.website} target="_blank" rel="noreferrer">{detail.prospect.website}</a>
            {:else}
              none listed
            {/if}
          </p>
        </div>
        <div class={styles.detailItem}>
          <p class={styles.detailLabel}>Lifecycle history</p>
          <ul class={styles.timeline}>
            {#each detail.lifecycleEvents.slice(0, 8) as event (event.id)}
              <li>
                <strong>{event.from_status || 'start'} → {event.to_status}</strong>
                <span class={styles.cellMuted}>{formatDate(event.created_at)}</span>
                {#if event.note}<div class={styles.cellMuted}>{event.note}</div>{/if}
              </li>
            {:else}
              <li class={styles.cellMuted}>No transitions recorded yet.</li>
            {/each}
          </ul>
        </div>
      </div>

      <div>
        <p class={styles.detailLabel}>Communication log</p>
        <ul class={styles.commsList}>
          {#each detail.communications as comm (comm.id)}
            <li class={comm.direction === 'inbound' ? styles.commsIn : styles.commsOut}>
              <div class={styles.commsMeta}>
                <span class={styles.commsBadge}>{comm.direction === 'inbound' ? '↤ they said' : '↦ we said'}</span>
                <span>{comm.channel}</span>
                <span>{comm.occurred_at ? formatDate(comm.occurred_at) : 'no date'}</span>
                {#if comm.response_to}<span>· reply</span>{/if}
                {#if comm.outcome}<span>· outcome: {comm.outcome}</span>{/if}
              </div>
              {#if comm.subject}<div class={styles.cellStrong}>{comm.subject}</div>{/if}
              <p class={styles.commsBody}>{comm.body}</p>
              {#if data.user?.role !== 'viewer'}
                <button class={styles.buttonGhostSmall} type="button" onclick={() => void removeCommunication(comm)} disabled={commsBusy}>
                  Delete message
                </button>
              {/if}
            </li>
          {:else}
            <li class={styles.cellMuted}>No messages logged for this lead yet.</li>
          {/each}
        </ul>

        {#if data.user?.role === 'viewer'}
          <p class={styles.panelMeta}>Viewers can read the log but not add messages.</p>
        {:else}
          {#if commsError}
            <p class={styles.fieldError} role="alert">{commsError}</p>
          {/if}
          <form onsubmit={(event) => {
            event.preventDefault();
            void addCommunication();
          }}>
            <div class={styles.fieldRow}>
              <div class={styles.field}>
                <label class={styles.fieldLabel} for="comms-direction">Direction</label>
                <select class={styles.select} id="comms-direction" bind:value={commsDirection}>
                  <option value="outbound">We sent</option>
                  <option value="inbound">They replied</option>
                </select>
              </div>
              <div class={styles.field}>
                <label class={styles.fieldLabel} for="comms-channel">Channel</label>
                <select class={styles.select} id="comms-channel" bind:value={commsChannel}>
                  {#each channels as channel (channel)}
                    <option value={channel}>{channel}</option>
                  {/each}
                </select>
              </div>
            </div>
            <div class={styles.fieldRow}>
              <div class={styles.field}>
                <label class={styles.fieldLabel} for="comms-subject">Subject (optional)</label>
                <input class={styles.input} id="comms-subject" type="text" bind:value={commsSubject} />
              </div>
              <div class={styles.field}>
                <label class={styles.fieldLabel} for="comms-occurred">Happened at (optional)</label>
                <input class={styles.input} id="comms-occurred" type="datetime-local" bind:value={commsOccurredAt} />
              </div>
            </div>
            <div class={styles.fieldRow}>
              <div class={styles.field}>
                <label class={styles.fieldLabel} for="comms-response-to">Reply to (optional)</label>
                <select class={styles.select} id="comms-response-to" bind:value={commsResponseTo}>
                  <option value="">not a reply</option>
                  {#each detail.communications as comm (comm.id)}
                    <option value={comm.id}>{comm.direction} · {comm.occurred_at ? formatDate(comm.occurred_at) : 'no date'} · {comm.channel}</option>
                  {/each}
                </select>
              </div>
              <div class={styles.field}>
                <label class={styles.fieldLabel} for="comms-outcome">Outcome</label>
                <select class={styles.select} id="comms-outcome" bind:value={commsOutcome}>
                  <option value="">none yet</option>
                  <option value="replied">replied</option>
                  <option value="meeting_booked">meeting booked</option>
                  <option value="declined">declined</option>
                  <option value="gatekeeper">gatekeeper</option>
                  <option value="wrong_number">wrong number</option>
                </select>
              </div>
            </div>
            <div class={styles.field}>
              <label class={styles.fieldLabel} for="comms-body">Message</label>
              <textarea class={styles.input} id="comms-body" rows={4} required bind:value={commsBody}></textarea>
            </div>
            <button class={`${styles.button} ${styles.buttonPrimary}`} type="submit" disabled={commsBusy}>
              {commsBusy ? 'Saving…' : 'Log message'}
            </button>
          </form>
        {/if}
      </div>
    </div>

    {#snippet actions()}
      <button class={styles.button} type="button" onclick={() => (detail = null)}>Close</button>
    {/snippet}
  </Dialog>
{/if}

{#if notice}
  <Notice kind={notice.kind} message={notice.message} onDismiss={() => (notice = null)} />
{/if}

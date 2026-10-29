<script lang="ts">
  import type { PageData } from './$types';
  import StateBlock from '$lib/components/admin/StateBlock.svelte';
  import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
  import styles from '$lib/components/admin/admin.module.css';
  import portal from './portal.module.css';

  let { data }: { data: PageData } = $props();

  function labelFor(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const fmtMoney = (value: number): string =>
    value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const fmtPct = (value: number): string => `${(value * 100).toFixed(1)}%`;

  const maxFunnel = $derived(Math.max(1, ...(data.analytics?.funnel.map((s) => s.count) ?? [1])));
</script>

{#if !data.configured || !data.analytics}
  <StateBlock empty title="Analytics unavailable" message="The D1 binding is missing. Run npm run db:migrate:local, then restart npm run dev." />
{:else}
  <section class={styles.stats} aria-label="Pipeline conversion summary">
    <div class={styles.stat}>
      <p class={styles.statValue}>{data.analytics.leads}</p>
      <p class={styles.statLabel}>Tracked leads</p>
    </div>
    <div class={styles.stat}>
      <p class={styles.statValue}>{fmtPct(data.analytics.conversionRate)}</p>
      <p class={styles.statLabel}>Conversion rate · {data.analytics.convertedCount} converted</p>
    </div>
    <div class={styles.stat}>
      <p class={styles.statValue}>{data.analytics.proposalsSent}</p>
      <p class={styles.statLabel}>Proposals out</p>
    </div>
    <div class={styles.stat}>
      <p class={styles.statValue}>{fmtPct(data.analytics.responseRate)}</p>
      <p class={styles.statLabel}>Response rate · {data.analytics.inboundResponses}/{data.analytics.outboundMessages}</p>
    </div>
    <div class={styles.stat}>
      <p class={styles.statValue}>{fmtMoney(data.analytics.funnel.reduce((sum, s) => sum + s.estimatedValue, 0))}</p>
      <p class={styles.statLabel}>Estimated pipeline value @{data.launchPriceEstimate.toLocaleString('en-US')}/site</p>
    </div>
    <div class={styles.stat}>
      <p class={styles.statValue}>{data.analytics.staleContacts}</p>
      <p class={styles.statLabel}>Contacted 14+ days ago · no reply</p>
    </div>
  </section>

  <section class={styles.panel}>
    <div class={styles.panelHead}>
      <h2 class={styles.panelTitle}>Lifecycle funnel</h2>
      <p class={styles.panelMeta}>Counts come from the live businesses table; the value line is an estimate at the published launch price, not booked revenue.</p>
    </div>
    <div class={portal.funnel}>
      {#each data.analytics.funnel as stage (stage.lifecycle)}
        <div class={styles.funnelRow}>
          <div class={styles.funnelStage}>{labelFor(stage.lifecycle)}</div>
          <div class={styles.funnelTrack}>
            <div
              class={styles.funnelBar}
              style={`width: ${Math.max(2, Math.round((stage.count / maxFunnel) * 100))}%`}
              role="img"
              aria-label={`${stage.count} leads in ${labelFor(stage.lifecycle)}`}
            ></div>
            <span class={styles.funnelCount}>{stage.count}</span>
            {#if stage.estimatedValue > 0}
              <span class={styles.funnelValue}>≈ {fmtMoney(stage.estimatedValue)}</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </section>

  <div class={portal.gridTwo}>
    <section class={styles.panel}>
      <div class={styles.panelHead}>
        <h2 class={styles.panelTitle}>Monthly ranking performance</h2>
        <p class={styles.panelMeta}>Leads contacted per month, plus stage events that are not first contact.</p>
      </div>
      {#if data.analytics.monthlyOutreach.length === 0}
        <StateBlock empty title="No activity yet" message="Log your first outreach from the Leads tab to start the monthly rows." />
      {:else}
        <div class={styles.tableWrap}>
          <table class={styles.table}>
            <thead>
              <tr><th>Month</th><th>Contacted</th><th>Other moves</th></tr>
            </thead>
            <tbody>
              {#each data.analytics.monthlyOutreach as row (row.month)}
                <tr>
                  <td class={styles.cellStrong}>{row.month}</td>
                  <td>{row.outbound}</td>
                  <td>{row.events}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>

    <section class={styles.panel}>
      <div class={styles.panelHead}>
        <h2 class={styles.panelTitle}>Contact submissions</h2>
        <p class={styles.panelMeta}>Booking forms that came in through preview and production sites.</p>
      </div>
      {#if data.analytics.monthlyBookings.length === 0}
        <StateBlock empty title="No submissions yet" message="Booking requests appear here by month once the booking form is used." />
      {:else}
        <div class={styles.tableWrap}>
          <table class={styles.table}>
            <thead>
              <tr><th>Month</th><th>Submissions</th></tr>
            </thead>
            <tbody>
              {#each data.analytics.monthlyBookings as row (row.month)}
                <tr>
                  <td class={styles.cellStrong}>{row.month}</td>
                  <td>{row.count}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
  </div>

  <section class={styles.panel}>
    <div class={styles.panelHead}>
      <h2 class={styles.panelTitle}>Top opportunities</h2>
      <p class={styles.panelMeta}>{data.analytics.deadSiteCount} dead sites · {data.analytics.noPresenceCount} unclaimed · average health {data.analytics.averageSiteHealth ?? '—'}</p>
    </div>
    <div class={styles.tableWrap}>
      <table class={styles.table}>
        <thead>
          <tr>
            <th>Business</th>
            <th>Industry</th>
            <th>Opportunity</th>
            <th>Stage</th>
            <th>Site</th>
          </tr>
        </thead>
        <tbody>
          {#each data.analytics.topOpportunities as lead (lead.slug)}
            <tr>
              <td class={styles.cellStrong}>
                <a class={styles.detailLink} href={`/admin/leads?focus=${lead.slug}`}>{lead.name}</a>
              </td>
              <td>{lead.industry}</td>
              <td>{lead.opportunity}</td>
              <td><StatusBadge label={lead.lifecycle_status} /></td>
              <td>
                {#if lead.website}
                  <a class={styles.detailLink} href={lead.website} target="_blank" rel="noreferrer">open</a>
                {:else}
                  <span class={styles.cellMuted}>none</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
{/if}

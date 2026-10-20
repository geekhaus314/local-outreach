<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Pipeline admin</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="shell admin">
  <header class="adminHead">
    <p class="eyebrow">Internal</p>
    <h1>Pipeline admin</h1>
    <p>Signed in as {data.adminEmail}.</p>
  </header>

  {#if !data.configured}
    <section class="notice">
      <h2>Database binding missing</h2>
      <p>Add the D1 binding named DB to the Cloudflare project before this dashboard can show pipeline data.</p>
    </section>
  {:else}
    <section class="panel">
      <div class="panelHead">
        <h2>Prospects</h2>
        <p>{data.prospects.length} records</p>
      </div>

      {#if data.prospects.length === 0}
        <p class="empty">No prospects yet. POST a normalized lead to <code>/api/admin/prospects</code> to add one.</p>
      {:else}
        <div class="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Business</th>
                <th>Industry</th>
                <th>Kind</th>
                <th>Opportunity</th>
                <th>Classification</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {#each data.prospects as prospect}
                <tr>
                  <td>{prospect.name}</td>
                  <td>{prospect.industry}</td>
                  <td>{prospect.industryKind}</td>
                  <td>{prospect.opportunity}</td>
                  <td>{prospect.classification}</td>
                  <td>
                    {#if prospect.rating === null}
                      —
                    {:else}
                      {prospect.rating.toFixed(1)} ({prospect.reviewCount ?? 0})
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>

    <section class="panel">
      <div class="panelHead">
        <h2>Recent booking requests</h2>
        <p>{data.bookings.length} shown</p>
      </div>

      {#if data.bookings.length === 0}
        <p class="empty">No booking requests recorded yet.</p>
      {:else}
        <div class="tableWrap">
          <table>
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
              {#each data.bookings as booking}
                <tr>
                  <td>{booking.createdAt}</td>
                  <td>{booking.businessSlug}</td>
                  <td>{booking.name}</td>
                  <td>{booking.service}</td>
                  <td>{booking.email}</td>
                  <td>{booking.status}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .admin {
    padding-block: clamp(2rem, 5vw, 4rem);
  }

  .adminHead {
    margin-bottom: 2.5rem;
  }

  .adminHead h1 {
    font-size: clamp(2rem, 4vw, 3rem);
  }

  .adminHead p:last-child {
    margin-top: 0.5rem;
    color: var(--color-text-muted);
  }

  .notice,
  .panel {
    padding: clamp(1.25rem, 3vw, 2rem);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-surface);
  }

  .panel + .panel {
    margin-top: 1.5rem;
  }

  .notice h2 {
    font-size: 1.4rem;
  }

  .notice p {
    margin-top: 0.5rem;
    color: var(--color-text-muted);
  }

  .panelHead {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }

  .panelHead h2 {
    font-size: 1.4rem;
  }

  .panelHead p {
    color: var(--color-text-muted);
    font-size: 0.82rem;
  }

  .empty {
    margin-top: 1rem;
    color: var(--color-text-muted);
  }

  code {
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    background: var(--color-bg-alt);
    font-size: 0.85em;
  }

  .tableWrap {
    margin-top: 1.25rem;
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.86rem;
  }

  th,
  td {
    padding: 0.7rem 0.75rem;
    border-bottom: 1px solid var(--color-border);
    text-align: left;
    white-space: nowrap;
  }

  th {
    color: var(--color-text-muted);
    font-size: 0.66rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
</style>

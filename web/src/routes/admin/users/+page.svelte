<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import { adminUsersApi, type AdminUser } from '$lib/admin/api.ts';
  import { formatDate } from '$lib/admin/collection.svelte.ts';
  import Notice from '$lib/components/admin/Notice.svelte';
  import StateBlock from '$lib/components/admin/StateBlock.svelte';
  import styles from '$lib/components/admin/admin.module.css';

  let { data }: { data: PageData } = $props();

  let users = $state<AdminUser[]>([]);
  let notice = $state<{ kind: 'success' | 'error'; message: string } | null>(null);
  let busyId = $state<string | null>(null);
  let error = $state<string | null>(null);

  // New user form
  let creating = $state(false);
  let newEmail = $state('');
  let newName = $state('');
  let newPassword = $state('');
  let newRole = $state('viewer');

  function showNotice(kind: 'success' | 'error', message: string): void {
    notice = { kind, message };
    setTimeout(() => (notice = null), 5000);
  }

  async function refresh(): Promise<void> {
    try {
      users = (await adminUsersApi.list()).users;
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not load users.';
    }
  }

  onMount(() => {
    users = data.users;
    if (data.role === 'owner' && data.configured) void refresh();
  });


  async function createUser(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    creating = true;
    error = null;
    try {
      const response = await adminUsersApi.create({
        email: newEmail,
        name: newName,
        password: newPassword,
        role: newRole
      });
      users = [...users, response.user];
      newEmail = '';
      newName = '';
      newPassword = '';
      newRole = 'viewer';
      showNotice('success', `Invitation credentials for ${response.user.email} are live.`);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not create the user.';
    } finally {
      creating = false;
    }
  }

  async function setRole(user: AdminUser, role: string): Promise<void> {
    busyId = user.id;
    try {
      const response = await adminUsersApi.update(user.id, { role });
      users = users.map((u) => (u.id === user.id ? { ...u, role: response.user.role } : u));
      showNotice('success', `${user.email} is now ${response.user.role}.`);
    } catch (cause) {
      showNotice('error', cause instanceof Error ? cause.message : 'Role change failed.');
    } finally {
      busyId = null;
    }
  }

  async function toggleDisabled(user: AdminUser): Promise<void> {
    busyId = user.id;
    try {
      const response = await adminUsersApi.update(user.id, { disabled: !user.disabled });
      users = users.map((u) =>
        u.id === user.id ? { ...u, disabled: response.user.disabled } : u
      );
      showNotice('success', `${user.email} ${response.user.disabled ? 'disabled' : 're-enabled'}.`);
    } catch (cause) {
      showNotice('error', cause instanceof Error ? cause.message : 'Change failed.');
    } finally {
      busyId = null;
    }
  }

  async function resetPassword(user: AdminUser): Promise<void> {
    const next = prompt(`New password for ${user.email} (min 10 chars):`) ?? '';
    if (!next) return;
    busyId = user.id;
    try {
      await adminUsersApi.update(user.id, { password: next });
      showNotice('success', `Password updated for ${user.email}.`);
    } catch (cause) {
      showNotice('error', cause instanceof Error ? cause.message : 'Password update failed.');
    } finally {
      busyId = null;
    }
  }

  async function removeUser(user: AdminUser): Promise<void> {
    if (!confirm(`Delete ${user.email} and revoke all their sessions?`)) return;
    busyId = user.id;
    try {
      await adminUsersApi.remove(user.id);
      users = users.filter((u) => u.id !== user.id);
      showNotice('success', `Deleted ${user.email}.`);
    } catch (cause) {
      showNotice('error', cause instanceof Error ? cause.message : 'Delete failed.');
    } finally {
      busyId = null;
    }
  }
</script>

{#if data.role !== 'owner'}
  <StateBlock empty title="Owner only" message="User management is restricted to the owner role." />
{:else if !data.configured}
  <StateBlock empty title="Database not bound" message="Run npm run db:migrate:local, then restart npm run dev." />
{:else}
  <div class={styles.toolbar}>
    <h2 class={styles.panelTitle}>
      Users <span class={styles.panelMeta}>{users.length} accounts · roles enforce RBAC server-side</span>
    </h2>
  </div>

  {#if users.length === 0}
    <StateBlock empty title="No users yet" message="Create the team accounts below. Roles: viewer (read-only), admin (pipeline CRUD), owner (users + pipeline)." />
  {:else}
    <div class={styles.tableWrap}>
      <table class={styles.table}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <th>State</th>
            <th>Created</th>
            <th>Last seen</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each users as user (user.id)}
            <tr>
              <td class={styles.cellStrong}>{user.email}</td>
              <td>{user.name || '—'}</td>
              <td>
                <select
                  class={styles.select}
                  value={user.role}
                  disabled={busyId === user.id}
                  onchange={(event) => void setRole(user, event.currentTarget.value)}
                  aria-label={`Role for ${user.email}`}
                >
                  <option value="owner">owner</option>
                  <option value="admin">admin</option>
                  <option value="viewer">viewer</option>
                </select>
              </td>
              <td>
                {#if typeof user.disabled === 'boolean' ? user.disabled : user.disabled === 1}
                  <span class={styles.cellMuted}>disabled</span>
                {:else}
                  active
                {/if}
              </td>
              <td class={styles.cellMuted}>{formatDate(user.created_at)}</td>
              <td class={styles.cellMuted}>{user.last_seen_at ? formatDate(user.last_seen_at) : '—'}</td>
              <td>
                <div class={styles.actions}>
                  <button class={styles.button} type="button" disabled={busyId === user.id} onclick={() => void toggleDisabled(user)}>
                    {typeof user.disabled === 'boolean' ? (user.disabled ? 'Enable' : 'Disable') : user.disabled === 1 ? 'Enable' : 'Disable'}
                  </button>
                  <button class={styles.button} type="button" disabled={busyId === user.id} onclick={() => void resetPassword(user)}>
                    Reset password
                  </button>
                  <button class={styles.buttonDanger} type="button" disabled={busyId === user.id} onclick={() => void removeUser(user)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <div class={styles.panel}>
    <div class={styles.panelHead}>
      <h2 class={styles.panelTitle}>Add a user</h2>
      <p class={styles.panelMeta}>Passwords are hashed with PBKDF2-SHA256 (210k iterations); sessions live 14 days.</p>
    </div>
    {#if error}
      <p class={styles.fieldError} role="alert">{error}</p>
    {/if}
    <form onsubmit={createUser}>
      <div class={styles.fieldRow}>
        <div class={styles.field}>
          <label class={styles.fieldLabel} for="new-user-email">Email</label>
          <input class={styles.input} id="new-user-email" type="email" required bind:value={newEmail} />
        </div>
        <div class={styles.field}>
          <label class={styles.fieldLabel} for="new-user-name">Name (optional)</label>
          <input class={styles.input} id="new-user-name" type="text" bind:value={newName} />
        </div>
        <div class={styles.field}>
          <label class={styles.fieldLabel} for="new-user-password">Password</label>
          <input class={styles.input} id="new-user-password" type="text" minlength={10} required bind:value={newPassword} />
        </div>
        <div class={styles.field}>
          <label class={styles.fieldLabel} for="new-user-role">Role</label>
          <select class={styles.select} id="new-user-role" bind:value={newRole}>
            <option value="viewer">viewer</option>
            <option value="admin">admin</option>
            <option value="owner">owner</option>
          </select>
        </div>
      </div>
      <button class={`${styles.button} ${styles.buttonPrimary}`} type="submit" disabled={creating}>
        {creating ? 'Creating…' : 'Create user'}
      </button>
    </form>
  </div>
{/if}

{#if notice}
  <Notice kind={notice.kind} message={notice.message} onDismiss={() => (notice = null)} />
{/if}

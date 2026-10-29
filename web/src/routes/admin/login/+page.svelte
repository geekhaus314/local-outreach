<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import styles from '$lib/components/admin/admin.module.css';

  let { data }: { data: PageData } = $props();

  let mode = $derived(data.needsSetup ? 'setup' : 'login');
  let email = $state('');
  let name = $state('');
  let password = $state('');
  let busy = $state(false);
  let error = $state<string | null>(null);

  $effect.pre(() => {
    if (data.user) {
      goto('/admin');
    }
  });

  async function submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    busy = true;
    error = null;
    try {
      const endpoint = mode === 'setup' ? '/api/auth/setup' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'setup' ? { email, name, password } : { email, password })
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        error = payload?.error ?? `Request failed with status ${response.status}.`;
        return;
      }
      goto('/admin');
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Network request failed.';
    } finally {
      busy = false;
    }
  }
</script>

<div class={styles.notice}>
  <h2>{mode === 'setup' ? 'Create the owner account' : 'Pipeline admin sign-in'}</h2>
  <p>
    {mode === 'setup'
      ? 'The users table is empty, so whoever completes this form becomes the owner. This form stops existing once an owner exists.'
      : 'Sign in with your pipeline account. Sessions last 14 days.'}
  </p>
</div>

{#if !data.configured}
  <div class={styles.panel}>
    <h2 class={styles.panelTitle}>Database not bound</h2>
    <p>
      Authentication needs the D1 binding. Run <code>npm run db:migrate:local</code> to create the
      local database with the seeded leads, then restart <code>npm run dev</code>.
    </p>
  </div>
{:else}
  {#if error}
    <p class={styles.fieldError} role="alert">{error}</p>
  {/if}

  <form class={styles.panel} onsubmit={submit} aria-label={mode === 'setup' ? 'Create owner account' : 'Sign in'}>
    <div class={styles.field}>
      <label class={styles.fieldLabel} for="login-email">Email</label>
      <input
        class={styles.input}
        id="login-email"
        name="email"
        type="email"
        autocomplete="username"
        required
        bind:value={email}
      />
    </div>

    {#if mode === 'setup'}
      <div class={styles.field}>
        <label class={styles.fieldLabel} for="login-name">Name (optional)</label>
        <input class={styles.input} id="login-name" name="name" type="text" autocomplete="name" bind:value={name} />
      </div>
    {/if}

    <div class={styles.field}>
      <label class={styles.fieldLabel} for="login-password">Password</label>
      <input
        class={styles.input}
        id="login-password"
        name="password"
        type="password"
        autocomplete={mode === 'setup' ? 'new-password' : 'current-password'}
        minlength={mode === 'setup' ? 10 : undefined}
        required
        bind:value={password}
      />
      {#if mode === 'setup'}
        <p class={styles.fieldHint}>At least 10 characters. Stored as PBKDF2-SHA256, 210k iterations.</p>
      {/if}
    </div>

    <div class={styles.dialogActions}>
      <button class={`${styles.button} ${styles.buttonPrimary}`} type="submit" disabled={busy}>
        {busy ? 'Working…' : mode === 'setup' ? 'Create owner account' : 'Sign in'}
      </button>
      {#if mode === 'setup'}
        <span class={styles.fieldMeta}>Setup closes permanently once an owner exists.</span>
      {/if}
    </div>
  </form>
{/if}

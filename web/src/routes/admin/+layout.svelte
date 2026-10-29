<script lang="ts">
  import type { LayoutData } from './$types';
  import styles from '$lib/components/admin/admin.module.css';

  let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

  let signingOut = $state(false);

  async function signOut(): Promise<void> {
    signingOut = true;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } finally {
      signingOut = false;
    }
  }

  const links: Array<{ href: string; label: string }> = [
    { href: '/admin', label: 'Pipeline' },
    { href: '/admin/dashboard', label: 'Analytics' },
    { href: '/admin/leads', label: 'Leads' },
    { href: '/admin/users', label: 'Users' }
  ];
</script>

<svelte:head>
  <title>Freelance machine · admin</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class={styles.root}>
  {#if data.user}
    <header class={styles.topbar}>
      <div class={styles.brand}>
        <p class={styles.brandKicker}>Internal · pipeline admin</p>
        <h1>Freelance machine</h1>
      </div>
      <nav class={styles.tabs} aria-label="Admin sections">
        {#each links as link (link.href)}
          <a
            class={`${styles.tab}${link.href === data.currentPath ? ` ${styles.tabActive}` : ''}`}
            href={link.href}
            aria-current={link.href === data.currentPath ? 'page' : undefined}
          >
            {link.label}
          </a>
        {/each}
      </nav>
      <div class={styles.identity}>
        <span class={styles.avatar}>{data.user.email.slice(0, 2).toUpperCase()}</span>
        <span>
          {data.user.email}
          <span class={styles.userRole}>{data.user.role}</span>
        </span>
        <button class={`${styles.button} ${styles.buttonGhost}`} type="button" onclick={signOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </header>
    {@render children()}
  {:else}
    {@render children()}
  {/if}
</div>

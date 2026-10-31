<script lang="ts">
  import styles from './CheckupForm.module.css';

  type Status = 'idle' | 'submitting' | 'success' | 'error' | 'unavailable';

  let status = $state<Status>('idle');
  let message = $state('');
  let consent = $state(false);
  let name = $state('');
  let email = $state('');
  let website = $state('');
  let notes = $state('');
  let company = $state('');

  const isSubmitting = $derived(status === 'submitting');

  function reset(): void {
    status = 'idle';
    message = '';
    consent = false;
    name = '';
    email = '';
    website = '';
    notes = '';
  }

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (status === 'submitting') return;

    if (!consent) {
      status = 'error';
      message = 'Please confirm that we may email you the checkup report.';
      return;
    }

    status = 'submitting';
    message = '';

    try {
      const response = await fetch('/api/checkup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          website,
          message: notes,
          company,
          consent
        })
      });

      const body = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;

      if (response.status === 503) {
        status = 'unavailable';
        message = body?.error ?? 'The checkup service is temporarily unavailable. Please try again later.';
        return;
      }

      if (!response.ok) {
        status = 'error';
        message = body?.error ?? 'Something went wrong. Please try again.';
        return;
      }

      status = 'success';
      message = body?.message ?? 'Your checkup request is in. We will email the report when it is ready.';
    } catch (error) {
      console.error('Checkup submission failed', error);
      status = 'error';
      message = 'Something went wrong. Please try again.';
    }
  }
</script>

{#if status === 'success'}
  <div class={styles.state} role="status">
    <p class={styles.stateEyebrow}>Request received</p>
    <h3>Checkup requested for {website ?? 'your site'}.</h3>
    <p>{message}</p>
    <button type="button" class={styles.stateButton} onclick={reset}>Request another checkup</button>
  </div>
{:else}
  <form class={styles.form} onsubmit={handleSubmit}>
    <div class={styles.row}>
      <div class={styles.field}>
        <label for="checkup-name">Your name *</label>
        <input id="checkup-name" name="name" type="text" required autocomplete="name" bind:value={name} />
      </div>
      <div class={styles.field}>
        <label for="checkup-email">Email *</label>
        <input id="checkup-email" name="email" type="email" required autocomplete="email" placeholder="you@yourbusiness.com" bind:value={email} />
      </div>
    </div>

    <div class={styles.field}>
      <label for="checkup-website">Your website address *</label>
      <input
        id="checkup-website"
        name="website"
        type="text"
        required
        placeholder="yourbusiness.com — the one that needs rehabbing"
        bind:value={website}
      />
    </div>

    <div class={styles.field}>
      <label for="checkup-notes">Anything we should know? (optional)</label>
      <textarea
        id="checkup-notes"
        name="message"
        rows="4"
        placeholder="What the site is for, what has gone wrong, deadlines…"
        bind:value={notes}
      ></textarea>
    </div>

    <div class={styles.honeypot} aria-hidden="true">
      <label for="checkup-company">Company</label>
      <input id="checkup-company" name="company" type="text" tabindex="-1" autocomplete="off" bind:value={company} />
    </div>

    <label class={styles.consent}>
      <input type="checkbox" bind:checked={consent} required />
      <span>Web Rehab STL may email the checkup report to me. No newsletter, no drip campaign.</span>
    </label>

    {#if status === 'error' || status === 'unavailable'}
      <p class={styles.error} role="alert">
        {message}
        {#if status === 'unavailable'}
          <a href="mailto:hello@webrehabstl.com">Email hello@webrehabstl.com</a>
        {/if}
      </p>
    {/if}

    <div class={styles.actions}>
      <button class={styles.submit} type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Request the free checkup'}
      </button>
      <p class={styles.privacy}>By submitting, you agree to our <a href="/privacy">privacy notice</a>.</p>
    </div>
  </form>
{/if}

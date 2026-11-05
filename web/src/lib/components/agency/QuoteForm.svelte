<script lang="ts">
  import styles from './QuoteForm.module.css';
  import { AGENCY_CONTACT, agencyPackages } from '$lib/data/agency-content';

  type Status = 'idle' | 'submitting' | 'success' | 'error';

  let status = $state<Status>('idle');
  let message = $state('');
  let consent = $state(false);
  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let packageId = $state(agencyPackages[1].id);
  let notes = $state('');
  let company = $state('');

  const isSubmitting = $derived(status === 'submitting');

  function reset(): void {
    status = 'idle';
    message = '';
    consent = false;
    name = '';
    email = '';
    phone = '';
    packageId = agencyPackages[1].id;
    notes = '';
    company = '';
  }

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (status === 'submitting') return;

    if (!consent) {
      status = 'error';
      message = 'Please confirm that we may contact you about this request.';
      return;
    }

    status = 'submitting';
    message = '';

    const chosen = agencyPackages.find((item) => item.id === packageId) ?? agencyPackages[0];
    const params = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search);

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          package: chosen.name,
          message: notes,
          consent,
          company,
          source: params?.get('utm_source') ?? '',
          page: typeof window === 'undefined' ? '/designs' : window.location.href
        })
      });

      const body = (await response.json().catch(() => null)) as
        | { message?: string; error?: string; saved?: boolean }
        | null;

      if (!response.ok) {
        status = 'error';
        message = body?.error ?? 'Something went wrong. Please try again.';
        return;
      }

      status = 'success';
      message =
        body?.message ??
        'Your quote request is in. I will reply with a scope and a fixed number.';
    } catch (error) {
      console.error('Quote request failed', error);
      status = 'error';
      message = 'Something went wrong. Please try again.';
    }
  }
</script>

{#if status === 'success'}
  <div class={styles.state} role="status">
    <p class={styles.stateEyebrow}>Request received</p>
    <h3>Thanks — the quote request is in.</h3>
    <p>{message}</p>
    <p>
      If you do not hear back within two business days, email
      <a href={`mailto:${AGENCY_CONTACT.email}`}>{AGENCY_CONTACT.email}</a>.
    </p>
    <button type="button" class={styles.stateButton} onclick={reset}>Send another request</button>
  </div>
{:else}
  <form class={styles.form} onsubmit={handleSubmit}>
    <div class={styles.row}>
      <div class={styles.field}>
        <label for="quote-name">Your name *</label>
        <input id="quote-name" name="name" type="text" required autocomplete="name" bind:value={name} />
      </div>
      <div class={styles.field}>
        <label for="quote-email">Email *</label>
        <input
          id="quote-email"
          name="email"
          type="email"
          required
          autocomplete="email"
          placeholder="you@yourbusiness.com"
          bind:value={email}
        />
      </div>
    </div>

    <div class={styles.row}>
      <div class={styles.field}>
        <label for="quote-phone">Phone (optional)</label>
        <input id="quote-phone" name="phone" type="tel" autocomplete="tel" bind:value={phone} />
      </div>
      <div class={styles.field}>
        <label for="quote-package">What do you need? *</label>
        <select id="quote-package" name="package" bind:value={packageId}>
          {#each agencyPackages as item (item.id)}
            <option value={item.id}>{item.name}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class={styles.field}>
      <label for="quote-notes">What should I know?</label>
      <textarea
        id="quote-notes"
        name="message"
        rows="4"
        placeholder="Your business, your current site, the deadline, what is not working…"
        bind:value={notes}
      ></textarea>
    </div>

    <div class={styles.honeypot} aria-hidden="true">
      <label for="quote-company">Company</label>
      <input id="quote-company" name="company" type="text" tabindex="-1" autocomplete="off" bind:value={company} />
    </div>

    <label class={styles.consent}>
      <input type="checkbox" bind:checked={consent} required />
      <span>Web Rehab STL may contact me about this request. No newsletter, no drip campaign.</span>
    </label>

    {#if status === 'error'}
      <p class={styles.error} role="alert">
        {message}
        <a href={`mailto:${AGENCY_CONTACT.email}`}>Email {AGENCY_CONTACT.email}</a>
      </p>
    {/if}

    <div class={styles.actions}>
      <button class={styles.submit} type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Request a quote'}
      </button>
      <p class={styles.privacy}>By submitting, you agree to our <a href="/privacy">privacy notice</a>.</p>
    </div>
  </form>
{/if}

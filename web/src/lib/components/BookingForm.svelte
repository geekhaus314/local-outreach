<script lang="ts">
  import styles from './BookingForm.module.css';
  import type { BookingConfig, PhoneRoute } from '$lib/content/types';

  let {
    booking,
    phone,
    businessName = null
  }: {
    booking: BookingConfig;
    phone: PhoneRoute | null;
    businessName?: string | null;
  } = $props();

  type Status = 'idle' | 'submitting' | 'success' | 'error' | 'unavailable';

  let status = $state<Status>('idle');
  let message = $state('');
  let consent = $state(false);
  let values = $state<Record<string, string>>({});

  const isSubmitting = $derived(status === 'submitting');

  function update(name: string, value: string): void {
    values = { ...values, [name]: value };
  }

  function readValue(event: Event): string {
    const target = event.currentTarget as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    return target.value;
  }

  function reset(): void {
    status = 'idle';
    message = '';
    consent = false;
    values = Object.fromEntries(booking.fields.map((field) => [field.name, '']));
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

    try {
      const response = await fetch(booking.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          consent,
          page: window.location.pathname
        })
      });

      const body = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;

      if (response.status === 503) {
        status = 'unavailable';
        message = body?.error ?? booking.unavailableMessage;
        return;
      }

      if (!response.ok) {
        status = 'error';
        message = body?.error ?? booking.errorMessage;
        return;
      }

      status = 'success';
      message = body?.message ?? booking.successMessage;
      values = Object.fromEntries(booking.fields.map((field) => [field.name, '']));
      consent = false;
    } catch (error) {
      console.error('Booking submission failed', error);
      status = 'error';
      message = booking.errorMessage;
    }
  }
</script>

{#if status === 'success'}
  <div class={styles.state} role="status">
    <p class="eyebrow">Request received</p>
    <h3>Thank you — your details are with {businessName ?? 'the team'}.</h3>
    <p>{message}</p>
    <button type="button" class="button reset" onclick={reset}>Send another request</button>
  </div>
{:else}
  <form class={styles.form} onsubmit={handleSubmit}>
    {#each booking.fields as field}
      <div class={`${styles.field} ${field.type === 'textarea' ? styles.full : ''}`}>
        <label for={`booking-${field.name}`}>{field.label}{field.required ? ' *' : ''}</label>

        {#if field.type === 'textarea'}
          <textarea
            id={`booking-${field.name}`}
            name={field.name}
            required={field.required}
            placeholder={field.placeholder}
            value={values[field.name] ?? ''}
            oninput={(event) => update(field.name, readValue(event))}
          ></textarea>
        {:else if field.type === 'select'}
          <select
            id={`booking-${field.name}`}
            name={field.name}
            required={field.required}
            value={values[field.name] ?? ''}
            onchange={(event) => update(field.name, readValue(event))}
          >
            <option value="">Choose one</option>
            {#each field.options ?? [] as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        {:else}
          <input
            id={`booking-${field.name}`}
            name={field.name}
            type={field.type}
            required={field.required}
            autocomplete={field.autocomplete}
            placeholder={field.placeholder}
            value={values[field.name] ?? ''}
            oninput={(event) => update(field.name, readValue(event))}
          />
        {/if}
      </div>
    {/each}

    <label class={styles.consent}>
      <input type="checkbox" bind:checked={consent} required />
      <span>{booking.consentLabel}</span>
    </label>

    {#if status === 'error' || status === 'unavailable'}
      <p class={styles.error} role="alert">
        {message}
        {#if status === 'unavailable' && phone}
          <a href={phone.dial}>Call {phone.display}</a>
        {/if}
      </p>
    {/if}

    <div class={styles.actions}>
      <button class="button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Request consultation'}
      </button>
      <p class={styles.privacy}>
        By submitting, you agree to our <a href={booking.privacyHref}>privacy notice</a>.
      </p>
    </div>
  </form>
{/if}

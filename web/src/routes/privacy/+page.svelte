<script lang="ts">
  import type { PageData } from './$types';
  import AgencyChrome from '$lib/components/agency/AgencyChrome.svelte';
  import contentStyles from '$lib/components/agency/AgencyContent.module.css';
  import { AGENCY_CONTACT } from '$lib/data/agency-content';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  {#if data.mode === 'tenant'}
    <title>Privacy notice | {data.tenant.business.name}</title>
    <meta
      name="description"
      content={`How ${data.tenant.business.name} handles consultation requests and personal data.`}
    />
  {:else}
    <title>Privacy notice | Web Rehab STL</title>
    <meta
      name="description"
      content="How Web Rehab STL handles checkup and quote requests, including what is stored, why, and how to ask for deletion."
    />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href={`${AGENCY_CONTACT.url}/privacy`} />
  {/if}
</svelte:head>

{#if data.mode === 'tenant'}
  {@const tenant = data.tenant}

  <section class="section">
    <div class="shell prose">
      <p class="eyebrow">Privacy</p>
      <h1>Privacy notice</h1>
      <p class="lede">
        This notice explains what happens to the details you submit through the consultation form on
        {tenant.siteUrl}.
      </p>

      <h2>What we collect</h2>
      <p>
        We collect the name, email address, phone number, service interest, and message you enter in the
        consultation form, along with the time of submission and the page you submitted from. We also record
        that you agreed to be contacted.
      </p>

      <h2>Why we collect it</h2>
      <p>
        We use the information only to respond to your request, discuss services, and arrange an appointment.
        We do not sell it or use it for unrelated marketing.
      </p>

      <h2>How it is stored</h2>
      <p>
        The form sends your request to a private notification endpoint used by {tenant.business.legalName}. Access
        is limited to the people who need it to respond to you. The site itself does not keep a public copy of
        your submission.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Consultation requests are kept only as long as needed to respond and maintain appointment records. You
        can ask us to remove your request at any time.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask to see, correct, or delete the information you submitted. Use the consultation form to
        make the request, or use the contact details published on the main page.
      </p>

      <h2>Cookies and local storage</h2>
      <p>
        The site stores your color-theme choice in a cookie and in browser local storage. That choice is used
        only to remember the theme you selected. It is not used for advertising or cross-site tracking.
      </p>
    </div>
  </section>
{:else}
  <AgencyChrome current="/privacy">
    <section class={contentStyles.section}>
      <div class={contentStyles.shell}>
        <p class={contentStyles.eyebrow}>Privacy</p>
        <h1 class={contentStyles.title}>Privacy notice</h1>
        <p class={contentStyles.lede}>
          This notice explains what happens to the details you submit through the
          free checkup or the design quote form on webrehabstl.com.
        </p>

        <div class={contentStyles.prose}>
          <h2>What we collect</h2>
          <p>
            The checkup and quote forms collect your name, email address, the
            website address you want checked, and anything you write in the
            message field. The quote form also accepts an optional phone number
            and the package you selected. We record the page and campaign
            source you submitted from, and that you agreed to be contacted.
          </p>

          <h2>Why we collect it</h2>
          <p>
            The information is used to run the checkup, prepare the report or
            quote, and reply to you. It is not sold, and it is not used for an
            unrelated newsletter or drip campaign.
          </p>

          <h2>How it is stored</h2>
          <p>
            Requests are stored in a private Cloudflare D1 database and sent to
            {' '}
            <a href={`mailto:${AGENCY_CONTACT.email}`}>{AGENCY_CONTACT.email}</a>
            {' '}
            through Resend so the request is not missed. Access is limited to the
            person responding to you. The site does not publish your submission.
          </p>

          <h2>How long we keep it</h2>
          <p>
            Requests are kept only as long as needed to respond and keep a
            record of the work discussed. You can ask for your request to be
            deleted at any time.
          </p>

          <h2>Your choices</h2>
          <p>
            You can ask to see, correct, or delete the information you submitted.
            Email
            {' '}
            <a href={`mailto:${AGENCY_CONTACT.email}`}>{AGENCY_CONTACT.email}</a>
            {' '}
            or call
            {' '}
            <a href={`tel:${AGENCY_CONTACT.phone}`}>{AGENCY_CONTACT.phoneDisplay}</a>.
          </p>

          <h2>Cookies and local storage</h2>
          <p>
            The site stores your dark or light palette choice in browser local
            storage. That choice is used only to remember the palette you
            selected. It is not used for advertising or cross-site tracking.
          </p>

          <h2>Vulnerability disclosure</h2>
          <p>
            Security researchers: report vulnerabilities to
            <a href={`mailto:${AGENCY_CONTACT.email}`}>{AGENCY_CONTACT.email}</a>.
            The machine-readable policy lives at
            <a href="/.well-known/security.txt"><code>/.well-known/security.txt</code></a>
            (RFC 9116).
          </p>
          <pre class="vdp" aria-label="security.txt contents">Contact: mailto:{AGENCY_CONTACT.email}
Expires: 2027-10-31T00:00:00Z
Preferred-Languages: en
Canonical: {AGENCY_CONTACT.url}/.well-known/security.txt
Policy: {AGENCY_CONTACT.url}/privacy</pre>

          <p><em>Last updated: November 5, 2026.</em></p>
        </div>
      </div>
    </section>
  </AgencyChrome>
{/if}

<style>
  .section {
    padding-block: clamp(2.5rem, 6vw, 5rem);
  }

  .shell {
    width: min(1080px, calc(100% - 2.5rem));
    margin-inline: auto;
  }

  .prose {
    max-width: 48rem;
  }

  h1 {
    font-size: clamp(2.2rem, 5vw, 3.6rem);
  }

  .lede {
    margin-top: 1.25rem;
    color: var(--color-text-muted);
    font-size: 1.1rem;
  }

  h2 {
    margin-top: 2.25rem;
    margin-bottom: 0.6rem;
    font-size: 1.15rem;
  }

  p {
    color: var(--color-text-muted);
    line-height: 1.7;
  }

  a {
    color: var(--color-accent, var(--color-text));
  }

  code {
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 0.9em;
  }

  .vdp {
    margin-top: 1rem;
    padding: 1rem 1.15rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 6px);
    background: var(--color-bg-alt, var(--color-bg));
    color: var(--color-text-muted);
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 0.82rem;
    line-height: 1.55;
    white-space: pre-wrap;
    overflow-x: auto;
  }
</style>

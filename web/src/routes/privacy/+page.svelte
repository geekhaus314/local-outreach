<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const isAgency = $derived(data.isAgency);
  const tenant = $derived(data.tenant);

  const businessName = $derived(
    isAgency ? 'Web Rehab STL' : (tenant?.business.name ?? 'this site')
  );
  const legalName = $derived(
    isAgency ? 'Web Rehab STL' : (tenant?.business.legalName ?? businessName)
  );
  const siteUrl = $derived(
    isAgency ? 'https://webrehabstl.com' : (tenant?.siteUrl ?? 'this site')
  );
  const contactEmail = $derived(
    isAgency ? 'hello@webrehabstl.com' : (tenant?.business.email ?? null)
  );
</script>

<svelte:head>
  <title>Privacy notice | {businessName}</title>
  <meta
    name="description"
    content={`How ${businessName} handles requests and personal data.`}
  />
  {#if isAgency}
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://webrehabstl.com/privacy" />
  {/if}
</svelte:head>

<section class="section">
  <div class="shell prose">
    <p class="eyebrow">Privacy</p>
    <h1>Privacy notice</h1>
    <p class="lede">
      {#if isAgency}
        This notice explains what happens to the details you submit through the free checkup form on
        {siteUrl}.
      {:else}
        This notice explains what happens to the details you submit through the consultation form on
        {siteUrl}.
      {/if}
    </p>

    <h2>What we collect</h2>
    <p>
      {#if isAgency}
        We collect the name, email address, business name, website URL, and any notes you enter in the
        checkup form, along with the time of submission and the page you submitted from.
      {:else}
        We collect the name, email address, phone number, service interest, and message you enter in the
        consultation form, along with the time of submission and the page you submitted from. We also record
        that you agreed to be contacted.
      {/if}
    </p>

    <h2>Why we collect it</h2>
    <p>
      {#if isAgency}
        We use the information only to run the requested website checkup, email you the findings, and —
        if you ask — discuss repair work. We do not sell it or use it for unrelated marketing.
      {:else}
        We use the information only to respond to your request, discuss services, and arrange an appointment.
        We do not sell it or use it for unrelated marketing.
      {/if}
    </p>

    <h2>How it is stored</h2>
    <p>
      The form sends your request to a private notification endpoint used by {legalName}. Access
      is limited to the people who need it to respond to you. The site itself does not keep a public copy of
      your submission.
    </p>

    <h2>How long we keep it</h2>
    <p>
      {#if isAgency}
        Checkup requests are kept only as long as needed to deliver the report and follow up if you ask.
        You can ask us to remove your request at any time.
      {:else}
        Consultation requests are kept only as long as needed to respond and maintain appointment records. You
        can ask us to remove your request at any time.
      {/if}
    </p>

    <h2>Your choices</h2>
    <p>
      You can ask to see, correct, or delete the information you submitted.
      {#if contactEmail}
        Email <a href={`mailto:${contactEmail}`}>{contactEmail}</a>, or use the contact details published on the main page.
      {:else}
        Use the form on the main page, or the contact details published there.
      {/if}
    </p>

    <h2>Cookies and local storage</h2>
    <p>
      The site stores your color-theme choice in a cookie and in browser local storage. That choice is used
      only to remember the theme you selected. It is not used for advertising or cross-site tracking.
    </p>

    {#if isAgency}
      <h2>Vulnerability disclosure</h2>
      <p>
        Security researchers: report vulnerabilities to
        <a href="mailto:hello@webrehabstl.com">hello@webrehabstl.com</a>.
        The machine-readable policy lives at
        <a href="/.well-known/security.txt"><code>/.well-known/security.txt</code></a>
        (RFC 9116).
      </p>
      <pre class="vdp" aria-label="security.txt contents">Contact: mailto:hello@webrehabstl.com
Expires: 2027-10-31T00:00:00Z
Preferred-Languages: en
Canonical: https://webrehabstl.com/.well-known/security.txt
Policy: https://webrehabstl.com/privacy</pre>
    {/if}
  </div>
</section>

<style>
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
    font-size: 1.35rem;
  }

  p {
    color: var(--color-text-muted);
  }

  a {
    color: var(--color-text);
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

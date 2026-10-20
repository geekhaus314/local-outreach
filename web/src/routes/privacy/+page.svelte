<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const tenant = $derived(data.tenant);
</script>

<svelte:head>
  <title>Privacy notice | {tenant.business.name}</title>
  <meta name="description" content={`How ${tenant.business.name} handles consultation requests and personal data.`} />
</svelte:head>

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

</style>

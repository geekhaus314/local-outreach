<script lang="ts">
  import styles from './Landing.module.css';
  import contentStyles from './AgencyContent.module.css';
  import AgencyChrome from './AgencyChrome.svelte';
  import CheckupForm from './CheckupForm.svelte';
  import Ticker from './Ticker.svelte';
  import { reveal } from './reveal';
  import {
    AGENCY_CONTACT,
    agencyFaqs,
    workAngieViefhaus,
    workBrianIvie,
    workUnitedDistribution,
    type AgencyFaq,
    type AgencyWork
  } from '$lib/data/agency-content';

  interface HeroBrand {
    name: string;
    place: string;
  }

  interface HeroHeadline {
    text: string;
  }

  interface HeroSupport {
    text: string;
  }

  interface HeroPrimaryCta {
    href: string;
    label: string;
  }

  interface HeroSecondaryCta {
    href: string;
    label: string;
  }

  interface HeroProofLine {
    text: string;
  }

  interface ProcessStep {
    number: string;
    title: string;
    body: string;
  }

  interface WorkStripHeading {
    title: string;
    note: string;
  }

  interface WorkStripLink {
    href: string;
    label: string;
  }

  interface FaqHeading {
    title: string;
    note: string;
  }

  interface ContactAside {
    title: string;
    phoneHref: string;
    phoneLabel: string;
    emailHref: string;
    emailLabel: string;
    place: string;
    honesty: string;
  }

  const heroBrand: HeroBrand = {
    name: 'Web Rehab STL',
    place: 'St. Louis'
  };

  const heroHeadline: HeroHeadline = {
    text: 'We’ll tell you what’s wrong with your website — free.'
  };

  const heroSupport: HeroSupport = {
    text: 'Send the address. Get a plain report. Fix it with us, or keep the report and go. No jargon, no sales drip.'
  };

  const heroPrimaryCta: HeroPrimaryCta = {
    href: '#checkup',
    label: 'Get the free checkup'
  };

  const heroSecondaryCta: HeroSecondaryCta = {
    href: '/work',
    label: 'See recent work'
  };

  const heroProofLine: HeroProofLine = {
    text: 'Built for owners who need the phone to ring — not a stack lecture.'
  };

  const processStepSend: ProcessStep = {
    number: '1',
    title: 'Send the address',
    body: 'Your site URL, your name, done.'
  };

  const processStepMeasure: ProcessStep = {
    number: '2',
    title: 'We check it',
    body: 'Same checklist every time. Facts, not opinions.'
  };

  const processStepReport: ProcessStep = {
    number: '3',
    title: 'You get the report',
    body: 'Plain English. Yours to keep either way.'
  };

  const workStripHeading: WorkStripHeading = {
    title: 'Recent work',
    note: 'Live sites, not demos. They load on a phone and give the customer a way to act.'
  };

  const workStripLink: WorkStripLink = {
    href: '/work',
    label: 'See all recent work'
  };

  const workProjectClinic: AgencyWork = workBrianIvie;
  const workProjectPortfolio: AgencyWork = workAngieViefhaus;
  const workProjectWholesale: AgencyWork = workUnitedDistribution;

  const faqHeading: FaqHeading = {
    title: 'Questions before you send the site',
    note: 'Straight answers. No quiz.'
  };

  const faqItems: AgencyFaq[] = agencyFaqs;

  const contactAside: ContactAside = {
    title: 'Talk to a person',
    phoneHref: `tel:${AGENCY_CONTACT.phone}`,
    phoneLabel: AGENCY_CONTACT.phoneDisplay,
    emailHref: `mailto:${AGENCY_CONTACT.email}`,
    emailLabel: AGENCY_CONTACT.email,
    place: `${AGENCY_CONTACT.city}, ${AGENCY_CONTACT.region} — working across the metro.`,
    honesty: 'If the site is not the problem, I will say so.'
  };
</script>

<AgencyChrome current="/">
  <section class={styles.hero}>
    <div class={styles.heroGrid} aria-hidden="true"></div>
    <div class={`${styles.shell} ${styles.heroSplit}`}>
      <div class={styles.heroCopy}>
        <p class={styles.brandSignal} use:reveal>
          <span class={styles.brandSignalName}>{heroBrand.name}</span>
          <span class={styles.brandSignalPlace}>{heroBrand.place}</span>
        </p>
        <h1 class={styles.headline} use:reveal={{ delay: 60 }}>{heroHeadline.text}</h1>
        <p class={styles.subhead} use:reveal={{ delay: 120 }}>{heroSupport.text}</p>
        <div class={styles.heroActions} use:reveal={{ delay: 180 }}>
          <a class={styles.cta} href={heroPrimaryCta.href}>{heroPrimaryCta.label}</a>
          <a class={styles.ctaGhost} href={heroSecondaryCta.href}>{heroSecondaryCta.label}</a>
        </div>
        <p class={styles.heroProof} use:reveal={{ delay: 220 }}>{heroProofLine.text}</p>
      </div>

      <div class={styles.heroForm} id="checkup" use:reveal={{ delay: 100 }}>
        <div class={styles.formCard}>
          <p class={styles.formEyebrow}>Free website checkup</p>
          <h2 class={styles.formTitle}>Send your site</h2>
          <p class={styles.formNote}>Takes about a minute. Report in plain language.</p>
          <CheckupForm />
        </div>
      </div>
    </div>
  </section>

  <Ticker />

  <section class={styles.workStrip}>
    <div class={styles.shell}>
      <div class={styles.workHead}>
        <h2 class={styles.sectionTitle} use:reveal>{workStripHeading.title}</h2>
        <p class={styles.sectionNote} use:reveal>{workStripHeading.note}</p>
      </div>
      <div class={styles.proofGrid}>
        <a
          class={styles.proofCard}
          href="/work"
          use:reveal
          aria-label={`See the ${workProjectClinic.name} project`}
        >
          <img
            class={styles.proofImage}
            src={workProjectClinic.image}
            alt={workProjectClinic.imageAlt}
            width="480"
            height="300"
            loading="lazy"
            decoding="async"
          />
          <div class={styles.proofBody}>
            <p class={styles.proofSector}>{workProjectClinic.sector}</p>
            <h3 class={styles.proofName}>{workProjectClinic.name}</h3>
            <p class={styles.proofText}>{workProjectClinic.summary}</p>
          </div>
        </a>

        <a
          class={styles.proofCard}
          href="/work"
          use:reveal={{ delay: 70 }}
          aria-label={`See the ${workProjectPortfolio.name} project`}
        >
          <img
            class={styles.proofImage}
            src={workProjectPortfolio.image}
            alt={workProjectPortfolio.imageAlt}
            width="480"
            height="300"
            loading="lazy"
            decoding="async"
          />
          <div class={styles.proofBody}>
            <p class={styles.proofSector}>{workProjectPortfolio.sector}</p>
            <h3 class={styles.proofName}>{workProjectPortfolio.name}</h3>
            <p class={styles.proofText}>{workProjectPortfolio.summary}</p>
          </div>
        </a>

        <a
          class={styles.proofCard}
          href="/work"
          use:reveal={{ delay: 140 }}
          aria-label={`See the ${workProjectWholesale.name} project`}
        >
          <img
            class={styles.proofImage}
            src={workProjectWholesale.image}
            alt={workProjectWholesale.imageAlt}
            width="480"
            height="300"
            loading="lazy"
            decoding="async"
          />
          <div class={styles.proofBody}>
            <p class={styles.proofSector}>{workProjectWholesale.sector}</p>
            <h3 class={styles.proofName}>{workProjectWholesale.name}</h3>
            <p class={styles.proofText}>{workProjectWholesale.summary}</p>
          </div>
        </a>
      </div>
      <div class={styles.workActions}>
        <a class={styles.ctaGhost} href={workStripLink.href}>{workStripLink.label}</a>
      </div>
    </div>
  </section>

  <section class={styles.process}>
    <div class={styles.shell}>
      <h2 class={styles.sectionTitle} use:reveal>How it works</h2>
      <ol class={styles.processList}>
        <li use:reveal>
          <span class={styles.stepChip}>{processStepSend.number}</span>
          <div>
            <h3>{processStepSend.title}</h3>
            <p>{processStepSend.body}</p>
          </div>
        </li>
        <li use:reveal={{ delay: 70 }}>
          <span class={styles.stepChip}>{processStepMeasure.number}</span>
          <div>
            <h3>{processStepMeasure.title}</h3>
            <p>{processStepMeasure.body}</p>
          </div>
        </li>
        <li use:reveal={{ delay: 140 }}>
          <span class={styles.stepChip}>{processStepReport.number}</span>
          <div>
            <h3>{processStepReport.title}</h3>
            <p>{processStepReport.body}</p>
          </div>
        </li>
      </ol>
    </div>
  </section>

  <section class={`${contentStyles.section} ${contentStyles.sectionAlt}`}>
    <div class={contentStyles.shell}>
      <div class={contentStyles.split}>
        <div>
          <p class={contentStyles.eyebrow}>About</p>
          <h2 class={contentStyles.sectionTitle} use:reveal>
            One person in St. Louis. You talk to the one doing the work.
          </h2>
          <p class={contentStyles.prose} use:reveal>
            No account manager. No handoff. If something breaks, you know who
            answers the phone.
          </p>
          <div class={contentStyles.actions}>
            <a class={contentStyles.buttonGhost} href="/work">See the work</a>
            <a class={contentStyles.buttonGhost} href="/services">See the services</a>
          </div>
        </div>
        <aside class={contentStyles.sideCard} use:reveal={{ delay: 90 }}>
          <h2>{contactAside.title}</h2>
          <ul>
            <li><a href={contactAside.phoneHref}>{contactAside.phoneLabel}</a></li>
            <li><a href={contactAside.emailHref}>{contactAside.emailLabel}</a></li>
            <li>{contactAside.place}</li>
            <li>{contactAside.honesty}</li>
          </ul>
        </aside>
      </div>
    </div>
  </section>

  <section class={contentStyles.section}>
    <div class={contentStyles.shell}>
      <div class={contentStyles.head}>
        <h2 class={contentStyles.sectionTitle} use:reveal>{faqHeading.title}</h2>
        <p class={contentStyles.sectionNote} use:reveal>{faqHeading.note}</p>
      </div>
      <div class={contentStyles.faq}>
        {#each faqItems as faq (faq.question)}
          <details class={contentStyles.faqItem}>
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        {/each}
      </div>
    </div>
  </section>
</AgencyChrome>

<script lang="ts">
  import styles from './Landing.module.css';
  import contentStyles from './AgencyContent.module.css';
  import AgencyChrome from './AgencyChrome.svelte';
  import CheckupForm from './CheckupForm.svelte';
  import Ticker from './Ticker.svelte';
  import AuditDemo from './AuditDemo.svelte';
  import { reveal } from './reveal';
  import {
    AGENCY_CONTACT,
    AUDIT_HIGHLIGHTS,
    agencyFaqs,
    agencyWork
  } from '$lib/data/agency-content';

  const problems = [
    {
      id: 'lost',
      title: 'Domain sold out from under you',
      body: 'Someone else runs the page your customers type in. We find it; you get it back.'
    },
    {
      id: 'phone',
      title: 'Unusable on phones',
      body: 'Most local searches happen on one. A desktop-only page refuses every one of them.'
    },
    {
      id: 'gate',
      title: 'No door in',
      body: 'No phone link, no form, no booking. A visitor who wants to hire you just leaves.'
    },
    {
      id: 'clock',
      title: 'Frozen in time',
      body: 'The copyright says 2018 and the stack says older. Customers notice.'
    },
    {
      id: 'blind',
      title: 'Flying blind',
      body: 'No analytics means you cannot answer the one question that matters: did anyone visit?'
    },
    {
      id: 'search',
      title: 'Invisible to search',
      body: 'No title that names you, no description, no proof. Google has nothing to show.'
    }
  ];
</script>

<AgencyChrome current="/">
  <section class={styles.hero}>
    <div class={styles.heroGrid} aria-hidden="true"></div>
    <div class={styles.shell} class:heroShell={true}>
      <p class={styles.eyebrow} use:reveal>A 38-point website audit</p>
      <h1 class={styles.headline} use:reveal={{ delay: 70 }}>
        Fix the site that is quietly costing you jobs.
      </h1>
      <p class={styles.subhead} use:reveal={{ delay: 140 }}>
        Free, measured, exact. You see the findings before any talk of money.
      </p>
      <div class={styles.heroActions} use:reveal={{ delay: 200 }}>
        <a class={styles.cta} href="#checkup">Get the free checkup</a>
        <a class={styles.ctaGhost} href="/work">See recent work</a>
      </div>
    </div>
  </section>

  <Ticker />

  <section class={styles.demoSection}>
    <div class={styles.shell}>
      <h2 class={styles.sectionTitle} use:reveal>Sixty seconds, then you decide</h2>
      <p class={styles.sectionNote} use:reveal>
        This is the report, not our word for it.
      </p>
      <div class={styles.demoMount} use:reveal={{ delay: 90 }}>
        <AuditDemo />
      </div>
    </div>
  </section>

  <section class={styles.stats}>
    <div class={styles.shell}>
      <dl class={styles.statsGrid}>
        <div class={styles.stat} use:reveal>
          <dt>Checks per site</dt>
          <dd><span class={styles.statNumber}>38</span></dd>
        </div>
        <div class={styles.stat} use:reveal={{ delay: 80 }}>
          <dt>Local sites measured</dt>
          <dd><span class={styles.statNumber}>458</span></dd>
        </div>
        <div class={styles.stat} use:reveal={{ delay: 160 }}>
          <dt>Seconds of your time to start</dt>
          <dd><span class={styles.statNumber}>30</span></dd>
        </div>
      </dl>
    </div>
  </section>

  <section class={`${contentStyles.section} ${contentStyles.sectionAlt}`}>
    <div class={contentStyles.shell}>
      <div class={contentStyles.head}>
        <h2 class={contentStyles.sectionTitle} use:reveal>Recent work</h2>
        <p class={contentStyles.sectionNote} use:reveal>
          Live client projects, not demos. Different industries, same rule: the
          site has to explain the business, load on a phone, and give the
          customer a way to act.
        </p>
      </div>
      <div class={styles.proofGrid}>
        {#each agencyWork as project, index (project.slug)}
          <a
            class={styles.proofCard}
            href="/work"
            use:reveal={{ delay: (index % 3) * 70 }}
            aria-label={`See the ${project.name} project`}
          >
            <img
              class={styles.proofImage}
              src={project.image}
              alt={project.imageAlt}
              width="480"
              height="300"
              loading="lazy"
              decoding="async"
            />
            <div class={styles.proofBody}>
              <p class={styles.proofSector}>{project.sector}</p>
              <h3 class={styles.proofName}>{project.name}</h3>
              <p class={styles.proofText}>{project.summary}</p>
              <p class={styles.proofMore}>Read the project →</p>
            </div>
          </a>
        {/each}
      </div>
      <div class={contentStyles.actions}>
        <a class={contentStyles.buttonGhost} href="/work">See all recent work</a>
      </div>
    </div>
  </section>

  <section class={styles.process}>
    <div class={styles.shell}>
      <h2 class={styles.sectionTitle} use:reveal>How it works</h2>
      <ol class={styles.processList}>
        <li use:reveal>
          <span class={styles.stepChip}>1</span>
          <div>
            <h3>Send the address</h3>
            <p>Your site, your name, done.</p>
          </div>
        </li>
        <li use:reveal={{ delay: 90 }}>
          <span class={styles.stepChip}>2</span>
          <div>
            <h3>We measure it</h3>
            <p>The same engine, every client, no opinions.</p>
          </div>
        </li>
        <li use:reveal={{ delay: 180 }}>
          <span class={styles.stepChip}>3</span>
          <div>
            <h3>You get the report</h3>
            <p>Plain language. Yours to keep either way.</p>
          </div>
        </li>
      </ol>
    </div>
  </section>

  <section class={styles.gallery}>
    <div class={styles.shell}>
      <h2 class={styles.sectionTitle} use:reveal>What kills a small-business site</h2>
      <div class={styles.galleryGrid}>
        {#each problems as problem, i}
          <article class={styles.card} use:reveal={{ delay: (i % 3) * 80 }}>
            <h3>{problem.title}</h3>
            <p>{problem.body}</p>
          </article>
        {/each}
      </div>
    </div>
  </section>

  <section class={contentStyles.section}>
    <div class={contentStyles.shell}>
      <div class={contentStyles.head}>
        <h2 class={contentStyles.sectionTitle} use:reveal>What the 38 checks look for</h2>
        <p class={contentStyles.sectionNote} use:reveal>
          A sample of the failures the engine flags. The full report covers all
          38 checks, in priority order, with the fix written out.
        </p>
      </div>
      <ul class={contentStyles.checkGrid}>
        {#each AUDIT_HIGHLIGHTS as item, index (item.label)}
          <li class={contentStyles.checkItem} use:reveal={{ delay: (index % 4) * 50 }}>
            <span class={contentStyles.checkMark} aria-hidden="true">×</span>
            <div>
              <strong>{item.label}</strong>
              <span>{item.note}</span>
            </div>
          </li>
        {/each}
      </ul>
      <div class={contentStyles.actions}>
        <a class={contentStyles.button} href="#checkup">Run the free checkup</a>
        <a class={contentStyles.buttonGhost} href="/services">See the services</a>
      </div>
    </div>
  </section>

  <section class={styles.compare}>
    <div class={styles.shell}>
      <h2 class={styles.sectionTitle} use:reveal>What gets replaced</h2>
      <p class={styles.sectionNote} use:reveal>
        Same business, different machinery underneath.
      </p>
      <div class={styles.compareTableWrap} use:reveal={{ delay: 80 }}>
        <table class={styles.compareTable}>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">A template build</th>
              <th scope="col">What we ship</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Architecture</th>
              <td>Page builder plus a stack of plugins</td>
              <td>Static pages with edge functions where needed</td>
            </tr>
            <tr>
              <th scope="row">What loads</th>
              <td>Every plugin bundle, on every page</td>
              <td>Only the assets that page actually uses</td>
            </tr>
            <tr>
              <th scope="row">Maintenance</th>
              <td>Recurring plugin and theme patching</td>
              <td>Rebuild and deploy; no patch queue</td>
            </tr>
            <tr>
              <th scope="row">Phones</th>
              <td>Desktop layout squeezed to fit</td>
              <td>Built mobile-first, then widened</td>
            </tr>
            <tr>
              <th scope="row">Proof</th>
              <td>Whatever the sales call claims</td>
              <td>The 38 checks this site publishes</td>
            </tr>
            <tr>
              <th scope="row">Ownership</th>
              <td>The builder account owns the page</td>
              <td>Your domain, your content, exportable</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <section class={`${contentStyles.section} ${contentStyles.sectionAlt}`}>
    <div class={contentStyles.shell}>
      <div class={contentStyles.split}>
        <div>
          <p class={contentStyles.eyebrow}>About</p>
          <h2 class={contentStyles.sectionTitle} use:reveal>
            Built in St. Louis, run by the person doing the work.
          </h2>
          <p class={contentStyles.prose} use:reveal>
            Web Rehab STL is a one-person studio. You talk to the person who
            audits the site, writes the pages, and ships the build. No account
            manager, no handoff, no mystery about who is responsible when
            something breaks.
          </p>
          <p class={contentStyles.prose} use:reveal>
            The work is deliberately narrow: small-business websites, the
            repairs they need, and the local-search setup that helps nearby
            customers find them.
          </p>
          <div class={contentStyles.actions}>
            <a class={contentStyles.buttonGhost} href="/work">See the work</a>
            <a class={contentStyles.buttonGhost} href="/services">See the services</a>
          </div>
        </div>
        <aside class={contentStyles.sideCard} use:reveal={{ delay: 110 }}>
          <h2>Talk to a person</h2>
          <ul>
            <li><a href={`tel:${AGENCY_CONTACT.phone}`}>{AGENCY_CONTACT.phoneDisplay}</a></li>
            <li><a href={`mailto:${AGENCY_CONTACT.email}`}>{AGENCY_CONTACT.email}</a></li>
            <li>{AGENCY_CONTACT.city}, {AGENCY_CONTACT.region} — working across the metro.</li>
            <li>If the site is not the problem, I will say so.</li>
          </ul>
        </aside>
      </div>
    </div>
  </section>

  <section class={contentStyles.section}>
    <div class={contentStyles.shell}>
      <div class={contentStyles.head}>
        <h2 class={contentStyles.sectionTitle} use:reveal>Questions before you send the site</h2>
        <p class={contentStyles.sectionNote} use:reveal>
          The honest answers, before you fill in a form.
        </p>
      </div>
      <div class={contentStyles.faq}>
        {#each agencyFaqs as faq, index (faq.question)}
          <details class={contentStyles.faqItem} open={index === 0}>
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        {/each}
      </div>
    </div>
  </section>

  <section class={styles.checkupSection} id="checkup">
    <div class={styles.shell}>
      <div class={styles.checkupSplit}>
        <div class={styles.checkupIntro}>
          <h2 class={styles.sectionTitle}>Request your free checkup</h2>
          <ul class={styles.timeline}>
            <li use:reveal>
              <span class={styles.timelineDot} aria-hidden="true"></span>
              <div>
                <strong>Right away</strong>
                <span>Your site goes through the full audit.</span>
              </div>
            </li>
            <li use:reveal={{ delay: 90 }}>
              <span class={styles.timelineDot} aria-hidden="true"></span>
              <div>
                <strong>Within a day</strong>
                <span>The findings land in your inbox, in plain language.</span>
              </div>
            </li>
            <li use:reveal={{ delay: 180 }}>
              <span class={styles.timelineDot} aria-hidden="true"></span>
              <div>
                <strong>Your call</strong>
                <span>Hire us to fix it, or keep the report and go. Both are fine.</span>
              </div>
            </li>
          </ul>
          <p class={styles.checkupContact}>
            Prefer to talk? Call
            <a href={`tel:${AGENCY_CONTACT.phone}`}>{AGENCY_CONTACT.phoneDisplay}</a>
            or email <a href={`mailto:${AGENCY_CONTACT.email}`}>{AGENCY_CONTACT.email}</a>.
          </p>
        </div>
        <div class={styles.checkupFormMount}>
          <CheckupForm />
        </div>
      </div>
    </div>
  </section>
</AgencyChrome>

<script lang="ts">
  import styles from './Landing.module.css';
  import CheckupForm from './CheckupForm.svelte';
  import Ticker from './Ticker.svelte';
  import AuditDemo from './AuditDemo.svelte';
  import { reveal } from './reveal';

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

<div class={styles.page}>
  <header class={styles.header}>
    <div class={styles.shell}>
      <span class={styles.brand}>
        <span class={styles.brandMark} aria-hidden="true">WR</span>
        <span class={styles.brandText}>
          <span class={styles.brandDescriptor}>St. Louis, Missouri</span>
          <span class={styles.brandName}>Web Rehab STL</span>
        </span>
      </span>
      <a class={styles.headerCta} href="#checkup">Free checkup</a>
    </div>
  </header>

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
        </div>
        <div class={styles.checkupFormMount}>
          <CheckupForm />
        </div>
      </div>
    </div>
  </section>

  <footer class={styles.footer}>
    <div class={styles.shell}>
      <span class={styles.footerBrand}>Web Rehab STL</span>
      <a class={styles.footerLink} href="mailto:hello@webrehabstl.com">hello@webrehabstl.com</a>
      <a class={styles.footerLink} href="/privacy">Privacy</a>
      <span class={styles.footerBase}>© {new Date().getFullYear()} · St. Louis, Missouri</span>
    </div>
  </footer>
</div>

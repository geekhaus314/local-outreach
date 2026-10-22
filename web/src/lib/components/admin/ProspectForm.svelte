<script lang="ts">
  import { adminApi, type AdminProspectDetail } from '$lib/admin/api.ts';
  import { TEMPLATE_IDS } from '$lib/content/types';
  import { themeList } from '$lib/data/themes';
  import { VERTICAL_METAS } from '$lib/verticals/meta.ts';
  import { VERTICAL_IDS } from '$lib/verticals/types.ts';
  import Dialog from './Dialog.svelte';
  import styles from './admin.module.css';

  let {
    mode,
    prospect = null,
    onClose,
    onSaved
  }: {
    mode: 'create' | 'edit';
    prospect?: AdminProspectDetail | null;
    onClose: () => void;
    onSaved: () => void;
  } = $props();

  interface FormValues {
    name: string;
    industry: string;
    phone: string;
    address: string;
    website: string;
    email: string;
    rating: string;
    reviewCount: string;
    pitchFacts: string;
    hostnames: string;
    vertical: string;
    template: string;
    theme: string;
    indexable: boolean;
  }

  function emptyValues(): FormValues {
    return {
      name: '',
      industry: '',
      phone: '',
      address: '',
      website: '',
      email: '',
      rating: '',
      reviewCount: '',
      pitchFacts: '',
      hostnames: '',
      vertical: '',
      template: '',
      theme: '',
      indexable: false
    };
  }

  function valuesFrom(prospect: AdminProspectDetail): FormValues {
    return {
      name: prospect.name,
      industry: prospect.industry,
      phone: prospect.phone,
      address: prospect.address,
      website: prospect.website,
      email: prospect.email,
      rating: prospect.rating === null ? '' : String(prospect.rating),
      reviewCount: prospect.reviewCount === null ? '' : String(prospect.reviewCount),
      pitchFacts: '',
      hostnames: prospect.hostnames.join(', '),
      vertical: prospect.vertical,
      template: prospect.template,
      theme: prospect.theme,
      indexable: prospect.indexable
    };
  }

  let values = $state<FormValues>(emptyValues());

  $effect(() => {
    if (prospect) values = valuesFrom(prospect);
  });
  let submitting = $state(false);
  let formError = $state<string | null>(null);
  let nameError = $state('');

  function parseList(raw: string): string[] {
    return raw
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function buildProspect(v: FormValues, pitchFacts: string[]) {
    return {
      name: v.name.trim(),
      industry: v.industry.trim(),
      phone: v.phone.trim(),
      address: v.address.trim(),
      website: v.website.trim(),
      email: v.email.trim(),
      traffic_tier: 'Unknown',
      decision_maker: 'Owner/Operator',
      classification: 'NEEDS_REHAB',
      opportunity: 50,
      need_score: 50,
      value_score: 50,
      site_health: null,
      rating: v.rating === '' ? null : Number(v.rating),
      review_count: v.reviewCount === '' ? null : Number(v.reviewCount),
      audit_summary: '',
      pitch_facts: pitchFacts,
      sources: [],
      source_ids: '',
      low_confidence: false,
      maps_url: '',
      last_audited: '',
      persona: ''
    };
  }

  async function save(): Promise<void> {
    formError = null;
    if (!values.name.trim()) {
      nameError = 'A business name is required.';
      return;
    }
    nameError = '';
    submitting = true;
    try {
      const pitchFacts = parseList(values.pitchFacts);
      const hostnames = parseList(values.hostnames);
      if (mode === 'create') {
        await adminApi.createProspect({
          prospect: buildProspect(values, pitchFacts),
          vertical: values.vertical || undefined,
          template: values.template || undefined,
          theme: values.theme || undefined,
          hostnames,
          indexable: values.indexable
        });
      } else if (prospect) {
        await adminApi.updateProspect(prospect.slug, {
          name: values.name.trim(),
          industry: values.industry.trim(),
          phone: values.phone.trim(),
          address: values.address.trim(),
          website: values.website.trim(),
          email: values.email.trim(),
          rating: values.rating === '' ? null : Number(values.rating),
          review_count: values.reviewCount === '' ? null : Number(values.reviewCount),
          pitch_facts: pitchFacts,
          vertical: values.vertical,
          template: values.template,
          theme: values.theme,
          hostnames,
          indexable: values.indexable
        });
      }
      onSaved();
    } catch (cause) {
      formError = cause instanceof Error ? cause.message : 'Could not save the prospect.';
    } finally {
      submitting = false;
    }
  }
</script>

<Dialog
  title={mode === 'create' ? 'New prospect' : `Edit ${prospect?.name ?? 'prospect'}`}
  {onClose}
  wide
  actions={formActions}
>
  <div class={styles.detailGrid}>
    <div class={styles.field}>
      <label class={styles.fieldLabel} for="pf-name">Business name *</label>
      <input id="pf-name" class={styles.input} bind:value={values.name} />
      {#if nameError}<p class={styles.fieldError}>{nameError}</p>{/if}
    </div>

    <div class={styles.field}>
      <label class={styles.fieldLabel} for="pf-industry">Industry</label>
      <input id="pf-industry" class={styles.input} bind:value={values.industry} placeholder="HVAC" />
    </div>

    <div class={styles.field}>
      <label class={styles.fieldLabel} for="pf-phone">Phone</label>
      <input id="pf-phone" class={styles.input} bind:value={values.phone} />
    </div>

    <div class={styles.field}>
      <label class={styles.fieldLabel} for="pf-website">Website</label>
      <input id="pf-website" class={styles.input} bind:value={values.website} placeholder="https://example.com" />
    </div>

    <div class={styles.field}>
      <label class={styles.fieldLabel} for="pf-email">Email</label>
      <input id="pf-email" class={styles.input} bind:value={values.email} />
    </div>

    <div class={styles.field}>
      <label class={styles.fieldLabel} for="pf-address">Address</label>
      <input id="pf-address" class={styles.input} bind:value={values.address} />
    </div>

    <div class={styles.field}>
      <label class={styles.fieldLabel} for="pf-rating">Rating</label>
      <input id="pf-rating" class={styles.input} type="number" step="0.1" min="0" max="5" bind:value={values.rating} />
    </div>

    <div class={styles.field}>
      <label class={styles.fieldLabel} for="pf-reviews">Review count</label>
      <input id="pf-reviews" class={styles.input} type="number" min="0" bind:value={values.reviewCount} />
    </div>

    <div class={styles.field}>
      <label class={styles.fieldLabel} for="pf-vertical">Vertical</label>
      <select id="pf-vertical" class={styles.select} bind:value={values.vertical}>
        <option value="">Auto-match</option>
        {#each VERTICAL_IDS as id}
          <option value={id}>{VERTICAL_METAS.find((meta) => meta.id === id)?.label ?? id}</option>
        {/each}
      </select>
    </div>

    <div class={styles.field}>
      <label class={styles.fieldLabel} for="pf-template">Template</label>
      <select id="pf-template" class={styles.select} bind:value={values.template}>
        <option value="">Recommended</option>
        {#each TEMPLATE_IDS as id}
          <option value={id}>{id}</option>
        {/each}
      </select>
    </div>

    <div class={styles.field}>
      <label class={styles.fieldLabel} for="pf-theme">Theme</label>
      <select id="pf-theme" class={styles.select} bind:value={values.theme}>
        <option value="">Recommended</option>
        {#each themeList as theme}
          <option value={theme.name}>{theme.label}</option>
        {/each}
      </select>
    </div>

    <div class={styles.field}>
      <label class={styles.fieldLabel} for="pf-hostnames">Preview hostnames</label>
      <input id="pf-hostnames" class={styles.input} bind:value={values.hostnames} placeholder="slug.preview.example.com" />
      <p class={styles.fieldHint}>Comma separated. Leave empty to derive from the name.</p>
    </div>
  </div>

  <div class={styles.field}>
    <label class={styles.fieldLabel} for="pf-facts">Pitch facts</label>
    <textarea
      id="pf-facts"
      class={styles.input}
      rows="4"
      bind:value={values.pitchFacts}
      placeholder="One verifiable fact per line. These become the pitch."
    ></textarea>
    <p class={styles.fieldHint}>Only statements you can stand behind. Never invent prices or services.</p>
  </div>

  <label class={styles.field}>
    <input type="checkbox" bind:checked={values.indexable} />
    <span>Allow search engines to index this preview</span>
  </label>

  {#if formError}
    <p class={styles.fieldError} role="alert">{formError}</p>
  {/if}
</Dialog>

{#snippet formActions()}
  <button class={styles.button} type="button" onclick={onClose} disabled={submitting}>Cancel</button>
  <button class={`${styles.button} ${styles.buttonPrimary}`} type="button" onclick={save} disabled={submitting}>
    {submitting ? 'Saving…' : mode === 'create' ? 'Create prospect' : 'Save changes'}
  </button>
{/snippet}

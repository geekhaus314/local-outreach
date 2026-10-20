import type { Component } from 'svelte';
import type { SiteContent, TemplateId } from '$lib/content/types';
import ClinicTemplate from './clinic/ClinicTemplate.svelte';
import EditorialTemplate from './editorial/EditorialTemplate.svelte';
import GeneralTemplate from './general/GeneralTemplate.svelte';
import MenuTemplate from './menu/MenuTemplate.svelte';
import ProjectTemplate from './project/ProjectTemplate.svelte';
import ServiceTemplate from './service/ServiceTemplate.svelte';

export type TemplateComponent = Component<{ content: SiteContent }>;

export function getTemplateComponent(id: TemplateId): TemplateComponent {
  switch (id) {
    case 'editorial':
      return EditorialTemplate;
    case 'service':
      return ServiceTemplate;
    case 'menu':
      return MenuTemplate;
    case 'clinic':
      return ClinicTemplate;
    case 'project':
      return ProjectTemplate;
    case 'general':
      return GeneralTemplate;
    default: {
      const unreachable: never = id;
      return unreachable;
    }
  }
}

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({
  tenant: locals.tenant,
  theme: locals.theme,
  themeColor: locals.themeColor
});

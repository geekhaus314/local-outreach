import { adminApi, AdminApiError } from './api.ts';

export interface AdminCollection<T> {
  readonly items: T[];
  readonly loading: boolean;
  readonly error: string | null;
  refresh(): Promise<void>;
}

export function createAdminCollection<T>(
  key: string,
  request: () => Promise<Record<string, T[]>>
): AdminCollection<T> {
  let items = $state<T[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);

  async function refresh(): Promise<void> {
    loading = true;
    error = null;
    try {
      const data = await request();
      items = data[key] ?? [];
    } catch (cause) {
      error =
        cause instanceof AdminApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Failed to load data.';
    } finally {
      loading = false;
    }
  }

  return {
    get items() {
      return items;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
    refresh
  };
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function badgeTone(value: string): 'info' | 'success' | 'warning' | 'danger' | 'accent' | 'neutral' {
  const normalized = value.toLowerCase();
  if (['sent', 'booked', 'confirmed', 'completed', 'succeeded', 'active', 'indexed', 'success'].includes(normalized)) {
    return 'success';
  }
  if (['failed', 'error', 'dead_site', 'needs_rehab', 'deleted', 'bounced', 'spam'].includes(normalized)) {
    return 'danger';
  }
  if (['queued', 'running', 'in_progress', 'pending', 'draft', 'received'].includes(normalized)) {
    return 'warning';
  }
  if (['no_presence', 'social_only', 'marketplace_only', 'new'].includes(normalized)) {
    return 'info';
  }
  return 'accent';
}

export { adminApi };

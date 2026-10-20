import type { D1Database } from '@cloudflare/workers-types';
import type { SiteContent } from '$lib/content/types';
import type { ThemeName } from '$lib/data/themes';

declare global {
  namespace App {
    interface Locals {
      tenant: SiteContent | null;
      theme: ThemeName;
      themeColor: string;
      adminEmail: string | null;
    }

    interface Platform {
      env: {
        DB?: D1Database;
        BOOKING_WEBHOOK_URL?: string;
        BOOKING_API_KEY?: string;
        BOOKING_FROM_EMAIL?: string;
        ADMIN_EMAILS?: string;
      };
    }
  }
}

export {};

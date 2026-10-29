import type { D1Database } from '@cloudflare/workers-types';
import type { SiteContent } from '$lib/content/types';
import type { ThemeName } from '$lib/data/themes';
import type { SessionUser } from '$lib/server/auth';

declare global {
  namespace App {
    interface Locals {
      tenant: SiteContent | null;
      theme: ThemeName;
      themeColor: string;
      /** Resolved DB session user (RBAC roles: owner, admin, viewer) or null. */
      user: SessionUser | null;
      /** Set for the auth endpoints so they can revoke by hash. */
      sessionCookieToken: string | null;
    }

    interface Platform {
      env: {
        DB?: D1Database;
        BOOKING_WEBHOOK_URL?: string;
        BOOKING_API_KEY?: string;
        BOOKING_FROM_EMAIL?: string;
      };
    }
  }
}

export {};

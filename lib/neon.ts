"use client";

import { createClient } from "@neondatabase/neon-js";
import { createAuthClient } from "@neondatabase/neon-js/auth/next";

// The Next.js auth handler runs at /api/auth on this application's own origin.
// This avoids third-party session cookies being blocked on iOS/Safari.
export const authClient = createAuthClient();

// Database access keeps the same Neon database and user-specific RLS rules.
// The API receives short-lived JWTs for the signed-in user's session.
export const neon = createClient({
  dataApi: {
    url: process.env.NEXT_PUBLIC_NEON_DATA_API_URL!,
    getToken: async () => await authClient.getJWTToken(),
  },
});

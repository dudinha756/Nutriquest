"use client";

import { createClient } from "@neondatabase/neon-js";
import { createAuthClient } from "@neondatabase/neon-js/auth/next";

// The built-in Next.js proxy keeps authentication cookies on our own domain.
export const authClient = createAuthClient();

// Neon Data API requires a signed JWT, not a Better Auth session cookie.
// Retrieve it through the authenticated, same-origin auth proxy.
export const neon = createClient({
  dataApi: {
    url: process.env.NEXT_PUBLIC_NEON_DATA_API_URL!,
    getToken: async () => {
      const response = await fetch("/api/auth/token", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Não foi possível autenticar o acesso aos seus dados.");
      }
      const body: unknown = await response.json();
      if (
        typeof body === "object" &&
        body !== null &&
        "token" in body &&
        typeof body.token === "string"
      ) {
        return body.token;
      }
      throw new Error("O servidor não retornou uma credencial válida.");
    },
  },
});

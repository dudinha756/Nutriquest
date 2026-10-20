"use client";

import { createAuthClient } from "@neondatabase/neon-js/auth/next";

// Sign-in, sign-out and sessions use our own /api/auth/* Next.js route.
export const authClient = createAuthClient();

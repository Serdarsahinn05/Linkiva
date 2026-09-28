"use client";

import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Same origin as the app, so no baseURL is needed. The sign-in form handles the two-step prompt itself
// (signIn.email returns twoFactorRedirect), so the plugin gets no redirect option.
export const authClient = createAuthClient({ plugins: [twoFactorClient()] });

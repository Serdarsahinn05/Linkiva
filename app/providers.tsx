"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            themes={['light', 'dark', 'midnight']} // Burası çok önemli
        >
            <SessionProvider>{children}</SessionProvider>
        </NextThemesProvider>
    );
}
"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {/* LazyMotion loads only the small animation feature set (~5kb vs ~30kb+),
            and reducedMotion="user" honors the OS "reduce motion" setting. */}
        <MotionConfig reducedMotion="user">
          <LazyMotion features={domAnimation} strict>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "#18181b",
                  color: "#fff",
                  borderRadius: "12px",
                },
              }}
            />
          </LazyMotion>
        </MotionConfig>
      </ThemeProvider>
    </SessionProvider>
  );
}

"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {/* Light (print) is the identity; dark stays one toggle away. */}
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {/* LazyMotion loads only the small animation feature set (~5kb vs ~30kb+),
            and reducedMotion="user" honors the OS "reduce motion" setting. */}
        <MotionConfig reducedMotion="user">
          <LazyMotion features={domAnimation} strict>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "#0f2a5c",
                  color: "#f5efe0",
                  borderRadius: "8px",
                  fontSize: "14px",
                },
              }}
            />
          </LazyMotion>
        </MotionConfig>
      </ThemeProvider>
    </SessionProvider>
  );
}

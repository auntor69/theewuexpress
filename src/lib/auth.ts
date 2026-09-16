import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

/**
 * Lightweight in-memory throttle for credential stuffing / brute force.
 * Per-instance on serverless, but it still removes the easy "hammer the
 * login endpoint" path, and it never locks out a legitimate admin for long.
 */
const MAX_FAILED_ATTEMPTS = 8;
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; firstAt: number }>();

function isThrottled(key: string): boolean {
  const entry = failedAttempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > ATTEMPT_WINDOW_MS) {
    failedAttempts.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailure(key: string): void {
  const entry = failedAttempts.get(key);
  if (!entry || Date.now() - entry.firstAt > ATTEMPT_WINDOW_MS) {
    failedAttempts.set(key, { count: 1, firstAt: Date.now() });
    return;
  }
  entry.count += 1;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).trim().toLowerCase();
        const attemptKey = `login:${email}`;

        if (isThrottled(attemptKey)) {
          console.warn(`Login throttled for ${email} after repeated failures.`);
          return null;
        }

        const user = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.email, email))
          .get();

        // Compare against a dummy hash when the user doesn't exist so the
        // response time doesn't reveal which emails are registered.
        const hash = user?.password ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
        const isValid = await bcrypt.compare(String(credentials.password), hash);

        if (!user || !isValid) {
          recordFailure(attemptKey);
          return null;
        }

        failedAttempts.delete(attemptKey);

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

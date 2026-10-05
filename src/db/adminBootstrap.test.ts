import { describe, expect, it } from "vitest";
import {
  DEFAULT_ADMIN_EMAIL,
  LOCAL_DEV_ADMIN_PASSWORD,
  REMOTE_ADMIN_SKIP_WARNING,
  planAdminBootstrap,
} from "./adminBootstrap";

describe("planAdminBootstrap", () => {
  it("skips the admin on a remote database when no password is configured", () => {
    expect(planAdminBootstrap({ isRemote: true })).toEqual({
      action: "skip",
      email: DEFAULT_ADMIN_EMAIL,
    });
  });

  it("falls back to the weak default only on a local database", () => {
    expect(planAdminBootstrap({ isRemote: false })).toEqual({
      action: "create",
      email: DEFAULT_ADMIN_EMAIL,
      password: LOCAL_DEV_ADMIN_PASSWORD,
      printPassword: true,
    });
  });

  it("uses an explicitly configured password on a remote database without echoing it", () => {
    expect(
      planAdminBootstrap({ password: "correct-horse-battery", isRemote: true })
    ).toEqual({
      action: "create",
      email: DEFAULT_ADMIN_EMAIL,
      password: "correct-horse-battery",
      printPassword: false,
    });
  });

  it("uses an explicitly configured password on a local database without echoing it", () => {
    expect(
      planAdminBootstrap({ password: "correct-horse-battery", isRemote: false })
    ).toEqual({
      action: "create",
      email: DEFAULT_ADMIN_EMAIL,
      password: "correct-horse-battery",
      printPassword: false,
    });
  });

  it("treats a whitespace-only password as not configured", () => {
    expect(planAdminBootstrap({ password: "   ", isRemote: true })).toEqual({
      action: "skip",
      email: DEFAULT_ADMIN_EMAIL,
    });
    expect(planAdminBootstrap({ password: "   ", isRemote: false })).toEqual({
      action: "create",
      email: DEFAULT_ADMIN_EMAIL,
      password: LOCAL_DEV_ADMIN_PASSWORD,
      printPassword: true,
    });
  });

  it("honours ADMIN_EMAIL and falls back to the default", () => {
    expect(
      planAdminBootstrap({ email: "editor@ewuexpress.com", isRemote: true })
    ).toMatchObject({ email: "editor@ewuexpress.com" });
    expect(planAdminBootstrap({ isRemote: true })).toMatchObject({
      email: "admin@ewuexpress.com",
    });
  });

  it("tells the user exactly how to set a real password when it skips", () => {
    expect(REMOTE_ADMIN_SKIP_WARNING).toContain(
      "ADMIN_PASSWORD='<strong-password>' npm run db:password"
    );
  });
});

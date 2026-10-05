# Security Policy

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security problems.**

Report vulnerabilities privately to the repository owner:

- **GitHub:** [@auntor69](https://github.com/auntor69) — use
  [private security advisories](https://github.com/auntor69/theewuexpress/security/advisories/new)
  on this repository, or contact the owner directly.

Include what you found, how to reproduce it, and (if possible) a suggested
fix. Please give the owner a reasonable window to patch before any public
disclosure.

## Scope

The following areas are in scope:

- **Authentication** — admin login, session handling, password reset paths,
  and the login/password throttles.
- **Admin dashboard** — authorization of every admin API route and the
  post/category/settings management flows.
- **Newsletter** — subscription, double opt-in confirmation, unsubscribe and
  token handling, and the email sending pipeline.
- **Database** — access controls around the Turso/libSQL database, migration
  and seed scripts, and anything that could expose subscriber or reader data.

## What Is in Scope for a Fix

Confirmed issues in the areas above will be triaged and patched, with fixes
deployed to [theewuexpress.vercel.app](https://theewuexpress.vercel.app) as
soon as practical.

## Response Expectations

- **Acknowledgement:** within a few days of a report.
- **Triage & fix:** best-effort, sized by severity — critical issues (auth
  bypass, data exposure) are treated as urgent.

## Out of Scope

- Automated scanner output without a demonstrated, reproducible issue.
- Missing security headers or best-practice hardening suggestions that do not
  create a concrete vulnerability.
- Anything requiring access the reporter is not authorized to have (e.g. the
  Turso database, Vercel account, or the Gmail account used for sending).

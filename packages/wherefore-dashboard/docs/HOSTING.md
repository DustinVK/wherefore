# Hosting and privacy

The dashboard builds to a folder of static files, so hosting it is just hosting static
files, and keeping it private is a host setting, not a dashboard feature. wherefore-dashboard
itself has no login, no accounts, and no auth code. That is on purpose: a static site
cannot enforce real auth on its own, so the privacy layer belongs to your host, which
does it properly at the edge.

This guide covers deploying to Cloudflare Pages and, if you want it private, the two
ways to gate it.

## Deploy to Cloudflare Pages

You connect Cloudflare to the repo where your `wherefore/` directory lives, your own project
repo. The dashboard is not a separate thing you deploy; it is a build tool that Cloudflare
runs against the `wherefore/` already in that repo. The tool is pulled from npm at build time,
so nothing of the dashboard's source lives in your repo. Code, log, and the build command
that turns the log into a site all sit in one repo, which is what makes the auto-rebuild
below work with no extra wiring.

1. Commit your project repo (the one containing `wherefore/`) to a Git host Cloudflare can read.
2. In Cloudflare Pages, create a project connected to that repo.
3. Set the build settings:
    - **Build command:** `npx @dustinvk/wherefore-dashboard build`
    - **Build output directory:** `dist`
    - **Root directory:** your repo root (or the subfolder holding the tool config)
4. Deploy. Cloudflare rebuilds automatically on every push to that repo, so logging a
   decision and committing it republishes the dashboard with no manual step.

By default the site is **public**. If your decisions are not meant for the open web, gate
it with one of the options below before you share the URL.

## Make it private -- option A: Cloudflare Access (recommended)

Cloudflare Access puts a real login in front of your Pages site. Visitors authenticate
(email one-time code, Google, GitHub, or your identity provider) before they can see
anything. It is free at small team sizes, and unlike a shared password it supports
per-person access, revoking one person, and an access log of who viewed the site.

Nothing in wherefore-dashboard changes. You configure this entirely in Cloudflare:

1. In the Cloudflare dashboard, go to **Zero Trust** (one-time free setup if you have not
   used it before).
2. Go to **Access -> Applications -> Add an application -> Self-hosted**.
3. Set the application domain to your Pages URL (e.g. `wherefore.yourdomain.com`, or the
   `*.pages.dev` hostname).
4. Add a policy:
    - Action: **Allow**
    - Rule: choose how people prove who they are, e.g. **Emails** (list specific
      addresses) or **Emails ending in** (your company domain).
5. Save. Now anyone hitting the site is sent to a login first, and only people matching
   your policy get in.

Use this when the dashboard holds anything you would not put on a public page: internal,
team, or client decisions.

## Make it private -- option B: shared password (Basic Auth)

A simpler option if you just want one shared password and do not need per-person control.
This uses a small Cloudflare Pages Function. It runs on Cloudflare's edge, not in the
dashboard, and your password lives as a Cloudflare secret, never in your code.

Trade-off to know: it is a single shared credential. You cannot revoke one person, there
is no access log, and the password is only as private as everyone you share it with. For
anything sensitive, prefer Access (option A).

### Setup

1. In your repo, create a `functions/` folder next to where the build output goes, and
   add `functions/_middleware.js` with the snippet below. (Pages Functions live in
   `functions/` at the project root and run in front of your static files.)

2. Paste this into `functions/_middleware.js`:

   ```js
   export async function onRequest(context) {
     const { request, env, next } = context;

     const USER = env.DASH_USER || 'wherefore';
     const PASS = env.DASH_PASSWORD;

     // If no password is configured, do not lock anything (fail open, not closed).
     if (!PASS) return next();

     const header = request.headers.get('Authorization') || '';
     const expected = 'Basic ' + btoa(`${USER}:${PASS}`);

     // Constant-ish comparison to avoid trivial timing leaks.
     if (header.length === expected.length && header === expected) {
       return next();
     }

     return new Response('Authentication required.', {
       status: 401,
       headers: { 'WWW-Authenticate': 'Basic realm="wherefore", charset="UTF-8"' },
     });
   }
   ```

3. In Cloudflare Pages, go to your project -> **Settings -> Environment variables** and
   add:
    - `DASH_PASSWORD` = the password you want (mark it **encrypted / secret**).
    - `DASH_USER` = optional; defaults to `wherefore` if you skip it.

4. Redeploy. The browser now prompts for the username and password before showing the
   dashboard.

To turn the lock off again, delete the `DASH_PASSWORD` variable (the middleware lets
everyone through when no password is set) or remove the `functions/` folder.

## Which should I use?

- **Public dashboard** (open-source project, nothing sensitive): deploy, share the URL,
  done.
- **Private, one shared password, low stakes:** option B (Basic Auth).
- **Private, real access control** (team, client, internal, anything you would not want
  leaked by a pasted password): option A (Cloudflare Access). This is the right default
  for anything sensitive.

## A note on what stays out of the dashboard

wherefore-dashboard deliberately has no built-in auth. Any "password protection" written into
a static site in JavaScript is not real protection, the files are still downloadable
directly. Real gating has to happen at the host, in front of the files, which is exactly
what both options above do. Keeping auth out of the tool is what lets it stay a simple,
trustworthy static generator.

# Homefood Happiness

Homefood Happiness is a planned static-first business manager for a small home food operation. The first version is designed to run on GitHub Pages without a backend server, database server, server sessions, API routes, or server actions.

The v1 app will help track raw materials, purchases, expenses, product recipes, production batches, finished inventory, sales, simple reports, and local backups.

## Architecture Direction

- Framework: Next.js with static export support.
- Language: TypeScript.
- Styling: Tailwind CSS.
- Hosting: GitHub Pages project site.
- Persistence: IndexedDB in the user's browser.
- Auth model: local app lock using a password or passcode hash stored in browser storage.
- Data access: repository interfaces, so local storage can later be replaced by Supabase, Firebase, Postgres, or another hosted backend.

See [Architecture](docs/ARCHITECTURE.md) and [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) for the full v1 plan.

## GitHub Pages Limitations

GitHub Pages is static hosting. The v1 app must not depend on:

- Next.js server actions for production behavior.
- API routes hosted on GitHub Pages.
- Prisma running directly from GitHub Pages.
- Server-side sessions or middleware.
- A backend database running inside GitHub Pages.

All core v1 behavior must work in the browser after static export.

## V1 Security Model

V1 authentication is a local device privacy lock, not real hosted authentication.

The app will require a local password or passcode before showing business data. The password itself must not be stored. A salted hash should be stored locally using the Web Crypto API. This protects casual access on the same browser profile, but it does not protect against a technical user who can inspect or modify browser storage and JavaScript.

For real account authentication and cross-device sync, a later version should move to Supabase Auth, Firebase Auth, Clerk, Auth0, or a custom backend.

## Local Data and Backups

Business data will be stored locally in the browser, primarily in IndexedDB. Browser storage can be cleared by the user, browser cleanup tools, or profile resets.

V1 must include export and import of all business data as JSON. Import must validate the payload before replacing local data and must warn the user that the operation replaces current browser data.

## Future Development Commands

The first implementation commit should add the app scaffold and these commands:

```bash
npm install
npm run dev
npm run build
```

The production build must generate a static export that can be served from GitHub Pages.


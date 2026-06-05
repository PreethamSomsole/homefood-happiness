# Architecture

## Goal

Build Homefood Happiness as a static-capable client-side app for a home food business. V1 must run from GitHub Pages and preserve a clean migration path to real hosted authentication and database storage later.

## Runtime Shape

- Next.js app using static export.
- TypeScript for all app, domain, storage, and auth code.
- Tailwind CSS for styling.
- Client-side routing that works under a GitHub Pages project path such as `/homefood-happiness`.
- No production dependency on server actions, API routes, Prisma, server sessions, middleware, or backend runtime.

Recommended future `next.config.mjs` shape:

```ts
const repoName = 'homefood-happiness'
const isPages = process.env.GITHUB_PAGES === 'true'

const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: isPages ? `/${repoName}` : '',
  assetPrefix: isPages ? `/${repoName}/` : '',
}

export default nextConfig
```

## Application Layers

The app should be organized around replaceable boundaries:

- UI layer: React components and routes.
- Domain layer: TypeScript types and pure calculations.
- Repository layer: business operations such as creating purchases, recording sales, and computing inventory movements.
- Storage layer: IndexedDB implementation behind a storage interface.
- Auth layer: local lock implementation behind an `AuthProvider` interface.
- Import/export layer: JSON backup and restore with Zod validation.

The UI must call repositories rather than IndexedDB or localStorage directly.

## Storage

IndexedDB is the primary v1 persistence mechanism because the app will store inventory, sales, production batches, and reports. A small amount of auth metadata may be stored in localStorage if it keeps unlock/session state simpler, but business data should remain in IndexedDB.

Recommended storage implementations:

- `indexeddb-storage`: production browser storage.
- `memory-storage`: tests and story-like development scenarios.
- `localstorage-storage`: optional fallback only for small settings or emergency compatibility.

Storage responsibilities:

- Read and write typed records by collection.
- Support schema versioning and migrations.
- Provide full backup export.
- Replace all data only after validated import and explicit confirmation.

## Authentication

V1 uses a local app lock, not real hosted authentication.

The local auth provider should support:

- First-run password setup.
- Unlock with password.
- Lock/sign out.
- Password change with old password verification.
- Reset app data after explicit confirmation.

Password handling:

- Never store the raw password.
- Generate a random salt per local profile.
- Use Web Crypto API with PBKDF2 or a comparable browser-supported derivation.
- Store the derived hash, salt, algorithm, iterations, and version in local browser storage.

Limitations must be shown in documentation and settings copy: this prevents casual access in the same browser profile, but it is not server-enforced authentication.

## Data Privacy

If practical during v1 implementation, encrypt business data at rest in IndexedDB with a key derived from the local password. If encryption adds too much complexity for v1, the app must explicitly document that data is stored locally in browser storage and may be visible to someone with access to the browser profile.

Do not claim enterprise-grade security.

## Future Hosted Architecture

Keep the interfaces replaceable so a future version can use:

- Vercel + Supabase Auth + Supabase Postgres with row-level security.
- Firebase Hosting + Firebase Auth + Firestore.
- Next.js hosted runtime + API routes + Prisma + PostgreSQL + Auth.js or Clerk.

Do not implement those hosted options in v1.


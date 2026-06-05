# Implementation Plan

## Phase 0: Planning Repository

Status: this repository starts with planning docs only.

Deliverables:

- README with product direction, GitHub Pages limits, storage model, and auth warning.
- Architecture, data model, auth/security, deployment, and implementation planning docs.
- Private GitHub repository owned by `PreethamSomsole`.

## Phase 1: Static App Scaffold

Create the app scaffold:

- Next.js with TypeScript.
- Tailwind CSS.
- ESLint and basic formatting setup.
- Static export configuration for GitHub Pages.
- Project path support for `/homefood-happiness`.
- A GitHub Actions workflow that builds and deploys the static export to Pages.

Acceptance:

- `npm run dev` starts locally.
- `npm run build` creates a static export.
- No server actions, API routes, Prisma, or server-only dependencies are introduced.

## Phase 2: Local Auth Lock

Build auth behind an interface:

```ts
export interface AuthProvider {
  getStatus(): Promise<AuthStatus>
  setupPassword(password: string): Promise<void>
  signIn(password: string): Promise<void>
  signOut(): Promise<void>
  changePassword(oldPassword: string, newPassword: string): Promise<void>
  resetLocalApp(confirmText: string): Promise<void>
}
```

Core behavior:

- First-time user sees password setup before app data.
- Returning user sees unlock screen.
- Locked state hides business data.
- User can lock the app from settings or navigation.
- User can change password only after verifying the old password.
- Reset requires an explicit destructive confirmation.

Acceptance:

- Raw password is never persisted.
- Hash metadata includes salt, algorithm, iterations, and version.
- README and settings explain this is local browser protection only.

## Phase 3: Storage and Domain Foundation

Implement storage and repository interfaces before building feature-heavy UI.

Core storage:

```ts
export interface AppStorage {
  get<T>(collection: CollectionName, id: string): Promise<T | null>
  list<T>(collection: CollectionName): Promise<T[]>
  put<T extends { id: string }>(collection: CollectionName, record: T): Promise<void>
  delete(collection: CollectionName, id: string): Promise<void>
  exportAll(): Promise<AppBackup>
  replaceAll(backup: AppBackup): Promise<void>
}
```

Repositories:

- Raw materials.
- Purchases and purchase line items.
- Expenses.
- Products and recipes.
- Production batches.
- Finished inventory.
- Sales and sale line items.
- Business settings.

Acceptance:

- UI and feature code do not call IndexedDB or localStorage directly.
- Memory storage can run repository tests without a browser database.
- IDs use UUIDs.
- Money is represented in integer cents.
- Weight is represented in grams.
- Count quantities use decimal numbers.

## Phase 4: Core Business Workflows

Build workflows in this order:

1. Business settings and units.
2. Raw material catalog.
3. Purchases and material inventory adjustments.
4. Product catalog and recipes.
5. Production batches that consume materials and create finished inventory.
6. Sales that reduce finished inventory and record revenue.
7. Expenses.
8. Reports for sales, costs, gross margin, and inventory value.

Acceptance:

- Inventory movements are traceable to purchases, adjustments, production batches, or sales.
- Reports derive from stored records rather than duplicate manually maintained totals.
- Empty states and validation errors are clear enough for a non-technical owner.

## Phase 5: Import and Export

Implement local backup:

- Export all data as versioned JSON.
- Import JSON through a validation step.
- Show a replace-data warning before import.
- Reject unknown or incompatible backup versions unless a migration exists.

Acceptance:

- Export/import round trip preserves all business records.
- Invalid JSON is rejected with a useful error.
- Import does not partially replace data if validation fails.


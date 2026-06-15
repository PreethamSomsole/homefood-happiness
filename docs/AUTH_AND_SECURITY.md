# Auth and Security

## V1 Auth Position

Homefood Happiness v1 uses a local-only app lock. It is not real hosted authentication.

This model is acceptable for a GitHub Pages static app because there is no trusted server on GitHub Pages that can enforce sessions, protect API routes, or validate credentials securely.

## Required User Messaging

The README, setup screen, and settings screen should make this clear:

- The username and password protect data from casual viewing in this browser profile.
- The app stores business data locally in the browser.
- A technical user with access to the browser profile can inspect or modify local storage.
- Clearing browser data can delete app data unless the user exports a backup.
- Real authentication requires a hosted auth provider or backend.

## Local Auth Design

Use an auth abstraction:

```ts
export type AuthStatus =
  | { state: 'needs_setup' }
  | { state: 'locked' }
  | { state: 'unlocked' }

export interface AuthProvider {
  getStatus(): Promise<AuthStatus>
  setupPassword(username: string, password: string): Promise<void>
  signIn(username: string, password: string): Promise<void>
  signOut(): Promise<void>
  changePassword(oldPassword: string, newPassword: string): Promise<void>
  resetLocalApp(confirmText: string): Promise<void>
}
```

The UI should depend only on `AuthProvider`, not directly on local storage, IndexedDB, or crypto details.

## Password Hashing

Use the browser Web Crypto API.

Recommended v1 defaults:

- Algorithm: PBKDF2.
- Hash: SHA-256.
- Salt: cryptographically random bytes per local profile.
- Iterations: at least 310,000 unless performance on target devices is poor.
- Stored fields: derived hash, salt, algorithm, iterations, version, createdAt, updatedAt.

Do not store raw passwords.

## Session State

Unlock state may be stored only in memory for stronger privacy. If this makes the app too inconvenient, sessionStorage may be used so refreshes stay unlocked within the same tab session. Do not persist unlocked state to localStorage.

## Optional Data Encryption

If feasible, encrypt business data at rest in IndexedDB:

- Derive an encryption key from the local password.
- Use AES-GCM with a unique IV per encrypted payload.
- Keep metadata versioned for future migration.

If encryption is deferred, the implementation must document that business data is stored locally without encryption.

## Reset Behavior

Resetting the app should:

- Require the app to be unlocked, or require password confirmation.
- Require explicit confirmation text such as `DELETE`.
- Clear auth settings and business data.
- Return the app to first-run setup.

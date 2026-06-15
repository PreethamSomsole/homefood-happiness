const AUTH_KEY = 'homefood-happiness.local-auth'
const SESSION_KEY = 'homefood-happiness.session'
const ITERATIONS = 310_000

export type AuthStatus =
  | { state: 'needs_setup' }
  | { state: 'locked'; username: string }
  | { state: 'unlocked'; username: string }

interface LocalAuthRecord {
  username: string
  passwordHash: string
  salt: string
  algorithm: 'PBKDF2'
  iterations: number
  version: number
  createdAt: string
  updatedAt: string
}

function assertBrowser(): void {
  if (typeof window === 'undefined') throw new Error('Authentication is only available in the browser.')
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function readAuthRecord(): LocalAuthRecord | null {
  assertBrowser()
  const raw = window.localStorage.getItem(AUTH_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as LocalAuthRecord
    if (!parsed.username || !parsed.passwordHash || !parsed.salt) return null
    return parsed
  } catch {
    return null
  }
}

function setUnlocked(username: string): void {
  window.sessionStorage.setItem(SESSION_KEY, username)
}

function clearUnlocked(): void {
  window.sessionStorage.removeItem(SESSION_KEY)
}

function readUnlockedUsername(): string | null {
  return window.sessionStorage.getItem(SESSION_KEY)
}

async function derivePasswordHash(password: string, salt: string, iterations: number): Promise<string> {
  const saltBytes = base64ToBytes(salt)
  const saltBuffer = new ArrayBuffer(saltBytes.byteLength)
  new Uint8Array(saltBuffer).set(saltBytes)

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )

  return bytesToBase64(new Uint8Array(derivedBits))
}

function validateUsername(username: string): string {
  const trimmed = username.trim()
  if (trimmed.length < 3) throw new Error('Username must be at least 3 characters.')
  return trimmed
}

function validatePassword(password: string): void {
  if (password.length < 8) throw new Error('Password must be at least 8 characters.')
}

export async function getAuthStatus(): Promise<AuthStatus> {
  assertBrowser()
  const record = readAuthRecord()
  if (!record) return { state: 'needs_setup' }

  const unlockedUsername = readUnlockedUsername()
  if (unlockedUsername === record.username) return { state: 'unlocked', username: record.username }
  return { state: 'locked', username: record.username }
}

export async function setupAuth(username: string, password: string): Promise<{ username: string }> {
  assertBrowser()
  const normalizedUsername = validateUsername(username)
  validatePassword(password)

  const now = new Date().toISOString()
  const salt = bytesToBase64(window.crypto.getRandomValues(new Uint8Array(16)))
  const passwordHash = await derivePasswordHash(password, salt, ITERATIONS)
  const record: LocalAuthRecord = {
    username: normalizedUsername,
    passwordHash,
    salt,
    algorithm: 'PBKDF2',
    iterations: ITERATIONS,
    version: 1,
    createdAt: now,
    updatedAt: now,
  }

  window.localStorage.setItem(AUTH_KEY, JSON.stringify(record))
  setUnlocked(normalizedUsername)
  return { username: normalizedUsername }
}

export async function signIn(username: string, password: string): Promise<{ username: string }> {
  assertBrowser()
  const record = readAuthRecord()
  if (!record) throw new Error('No local login is configured yet.')

  if (validateUsername(username) !== record.username) throw new Error('Username or password is incorrect.')
  const passwordHash = await derivePasswordHash(password, record.salt, record.iterations)
  if (passwordHash !== record.passwordHash) throw new Error('Username or password is incorrect.')

  setUnlocked(record.username)
  return { username: record.username }
}

export async function signOut(): Promise<void> {
  assertBrowser()
  clearUnlocked()
}

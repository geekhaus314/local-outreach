import type { D1Database } from '@cloudflare/workers-types';

// Session cookie name shared by hooks.server.ts, the auth endpoints and the
// client-side login form fallback (documented in /admin/login copy).
export const SESSION_COOKIE = 'clinic_session';
export const SESSION_TTL_DAYS = 14;
export const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;

const PBKDF2_ITERATIONS = 210_000;
const PBKDF2_KEY_LENGTH = 32;

export type Role = 'owner' | 'admin' | 'viewer';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

function formatSqlNow(date: Date): string {
  // D1 uses datetime('now') strings ("YYYY-MM-DD HH:MM:SS"); keep comparisons
  // lexicographically valid by storing the same shape.
  const pad = (n: number): string => String(n).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
    ` ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
  );
}

export function sessionExpiresAt(issued: Date = new Date()): string {
  const expiry = new Date(issued.getTime() + SESSION_TTL_SECONDS * 1000);
  return formatSqlNow(expiry);
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

function textBytes(value: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(value) as Uint8Array<ArrayBuffer>;
}

/** PBKDF2-SHA256 via WebCrypto; available in Workers and Node 22+. */
export async function hashPassword(password: string): Promise<string> {
  const salt: Uint8Array<ArrayBuffer> = crypto.getRandomValues(new Uint8Array(16));
  const digest = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(digest)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 100_000) return false;
  const salt = fromBase64(parts[2]);
  const expected = fromBase64(parts[3]);
  const actual = await pbkdf2(password, salt, iterations);
  return constantTimeEquals(actual, expected);
}

async function pbkdf2(
  password: string,
  salt: BufferSource,
  iterations: number
): Promise<Uint8Array<ArrayBuffer>> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password) as Uint8Array<ArrayBuffer>,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    keyMaterial,
    PBKDF2_KEY_LENGTH * 8
  );
  return new Uint8Array(bits);
}

function constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}

export function roleIsValid(value: string): value is Role {
  return value === 'owner' || value === 'admin' || value === 'viewer';
}

export interface StoredUserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: string;
  disabled: number;
}

function toSessionUser(row: StoredUserRow, roleOverride?: Role): SessionUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: roleOverride ?? (roleIsValid(row.role) ? row.role : 'viewer')
  };
}

export interface CreateSessionInput {
  db: D1Database;
  userId: string;
  userAgent: string;
}

export interface CreatedSession {
  /** Opaque token: only ever sent to the client in the HttpOnly cookie. */
  token: string;
  expiresAt: string;
}

export async function createSession(input: CreateSessionInput): Promise<CreatedSession> {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = toBase64(tokenBytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const tokenHash = toHex(await crypto.subtle.digest('SHA-256', textBytes(token)));
  const expiresAt = sessionExpiresAt();
  const id = `sess-${crypto.randomUUID()}`;

  await input.db
    .prepare(
      'INSERT INTO sessions (id, user_id, token_hash, expires_at, user_agent) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(id, input.userId, tokenHash, expiresAt, input.userAgent)
    .run();

  return { token, expiresAt };
}

/** Resolve the current user from the session cookie; null when absent/expired. */
export async function resolveSession(
  db: D1Database,
  token: string | undefined,
  now: Date = new Date()
): Promise<SessionUser | null> {
  if (!token) return null;
  const tokenHash = toHex(await crypto.subtle.digest('SHA-256', textBytes(token)));
  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.disabled
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`
    )
    .bind(tokenHash, formatSqlNow(now))
    .first<{ id: string; email: string; name: string; role: string; disabled: number }>();
  if (!row || row.disabled === 1) return null;
  if (!roleIsValid(row.role)) return null;
  const user: SessionUser = { id: row.id, email: row.email, name: row.name, role: row.role };
  return user;
}

/** Touch last_seen fields so the comms/analytics views can show active users. */
export async function touchSessionAndUser(db: D1Database, user: SessionUser, token: string | undefined, now: Date = new Date()): Promise<void> {
  if (!token) return;
  const tokenHash = toHex(await crypto.subtle.digest('SHA-256', textBytes(token)));
  const nowSql = formatSqlNow(now);
  await db.batch([
    db.prepare("UPDATE users SET last_seen_at = ? WHERE id = ?").bind(nowSql, user.id),
    db.prepare("UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?").bind(nowSql, tokenHash)
  ]);
}

export async function revokeSession(db: D1Database, token: string): Promise<void> {
  const tokenHash = toHex(await crypto.subtle.digest('SHA-256', textBytes(token)));
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
}

export async function countUsers(db: D1Database): Promise<number> {
  const row = await db.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>();
  return row?.n ?? 0;
}

export async function findUserByEmail(db: D1Database, email: string): Promise<StoredUserRow | null> {
  return db
    .prepare('SELECT id, email, name, password_hash, role, disabled FROM users WHERE email = ?')
    .bind(email.trim().toLowerCase())
    .first<StoredUserRow>();
}

export interface CreateUserInput {
  db: D1Database;
  email: string;
  name: string;
  password: string;
  role: Role;
  passwordHash?: string;
}

export async function insertUser(input: CreateUserInput): Promise<StoredUserRow> {
  const db = input.db;
  const id = `usr-${crypto.randomUUID()}`;
  const hash = input.passwordHash ?? (await hashPassword(input.password));
  await db
    .prepare('INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)')
    .bind(id, input.email.trim().toLowerCase(), input.name.trim(), hash, input.role)
    .run();
  const row = await db
    .prepare('SELECT id, email, name, password_hash, role, disabled FROM users WHERE id = ?')
    .bind(id)
    .first<StoredUserRow>();
  if (!row) throw new Error('User row vanished after insert.');
  return row;
}

export function loginResultFor(row: StoredUserRow | null, passwordOk: boolean): SessionUser | null {
  if (!row || row.disabled === 1) return null;
  if (!roleIsValid(row.role)) return null;
  if (!passwordOk) return null;
  return toSessionUser(row);
}

export function sessionCookieOptions(secure: boolean): { httpOnly: boolean; secure: boolean; sameSite: 'lax'; path: '/'; maxAge: number } {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  };
}

export { formatSqlNow };

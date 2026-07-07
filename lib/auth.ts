import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { isDbConfigured, getDb, schema } from './db';
import { eq } from 'drizzle-orm';

export const isAuthConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: object }[]) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — middleware refresh handles it.
          }
        },
      },
    }
  );
}

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'moderator' | 'admin';
  trustLevel: 'new' | 'trusted' | 'banned';
}

/**
 * Resolve the signed-in user, provisioning an app row on first login.
 * Emails in ADMIN_EMAILS are bootstrapped as admins.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  // LOCAL MODE: no database → this is a single-user personal install.
  // You're always signed in as the owner (DECISIONS.md #21).
  if (!isDbConfigured()) {
    const { LOCAL_USER } = await import('./local/store');
    return LOCAL_USER;
  }
  if (!isAuthConfigured()) return null;
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  if (!isDbConfigured()) {
    const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map((s) => s.trim().toLowerCase());
    return {
      id: user.id,
      email: user.email,
      username: user.email.split('@')[0],
      role: admins.includes(user.email.toLowerCase()) ? 'admin' : 'user',
      trustLevel: 'new',
    };
  }

  const db = getDb();
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, user.email)).limit(1);
  if (existing[0]) {
    const u = existing[0];
    return { id: u.id, email: u.email, username: u.username, role: u.role, trustLevel: u.trustLevel };
  }

  const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map((s) => s.trim().toLowerCase());
  const base = user.email.split('@')[0].replace(/[^a-z0-9_]/gi, '').slice(0, 24) || 'hunter';
  const username = `${base}_${Math.random().toString(36).slice(2, 6)}`;
  const [created] = await db
    .insert(schema.users)
    .values({
      email: user.email,
      username,
      role: admins.includes(user.email.toLowerCase()) ? 'admin' : 'user',
    })
    .returning();
  return {
    id: created.id,
    email: created.email,
    username: created.username,
    role: created.role,
    trustLevel: created.trustLevel,
  };
}

export async function requireRole(role: 'moderator' | 'admin'): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError(401, 'Sign in required');
  const ok = user.role === 'admin' || (role === 'moderator' && user.role === 'moderator');
  if (!ok) throw new AuthError(403, 'Insufficient permissions');
  return user;
}

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function timeAgo(date: Date | string | number): string {
  const t = new Date(date).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }).format(t);
}

export function formatDate(date: Date | string | number): string {
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function siteUrl(path = ''): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    // Vercel injects the deployment host automatically (no protocol).
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path}`;
}

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

const PROFANITY = ['fuck', 'shit', 'bitch', 'asshole', 'cunt'];
export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return PROFANITY.some((w) => lower.includes(w));
}

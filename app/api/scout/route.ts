import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addScout, updateScout, deleteScout } from '@/lib/local/store';

/**
 * Scout tracker CRUD. Scout entries are personal hunting notes, so they live
 * in the local store in every mode (DECISIONS.md #23).
 */
const CreateSchema = z.object({
  upc: z.string().max(14).optional(),
  name: z.string().min(2).max(200),
  retailerSlug: z.string().min(1).max(120),
  storeLabel: z.string().min(2).max(160),
  taggedPrice: z.number().min(0.01).max(100_000),
  clearanceDate: z.string().date().or(z.string().datetime()),
  note: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid entry' }, { status: 400 });
  }
  const scout = addScout({
    upc: parsed.data.upc || null,
    name: parsed.data.name,
    retailerSlug: parsed.data.retailerSlug,
    storeLabel: parsed.data.storeLabel,
    taggedPrice: parsed.data.taggedPrice,
    clearanceDate: new Date(parsed.data.clearanceDate).toISOString().slice(0, 10),
    note: parsed.data.note ?? null,
  });
  revalidatePath('/scout');
  return NextResponse.json({ ok: true, id: scout.id });
}

const PatchSchema = z.object({
  id: z.string().min(1),
  action: z.enum(['checked', 'done', 'reopen']),
});

export async function PATCH(req: NextRequest) {
  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  const { id, action } = parsed.data;
  if (action === 'checked') updateScout(id, { lastCheckedAt: new Date().toISOString() });
  if (action === 'done') updateScout(id, { done: true });
  if (action === 'reopen') updateScout(id, { done: false });
  revalidatePath('/scout');
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  deleteScout(id);
  revalidatePath('/scout');
  return NextResponse.json({ ok: true });
}

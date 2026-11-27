/**
 * Where the user's adjustments are saved.
 * - In the published catalog (claude.ai artifact) they go to the artifact's shared database, so Claude can read them
 *   and turn them into a new version of the model.
 * - Anywhere else (local dev, Hostinger) they fall back to this browser's storage.
 */
export interface Saved { model: string; base: string; params: Record<string, number | boolean | string>; nota: string; guardado: string; n: number }

type Doc = { exists: boolean; data(): Record<string, unknown> | undefined; id: string };
interface DbLike {
  collection(p: string): { get(): Promise<{ docs: Doc[] }>; doc(id: string): { set(d: Record<string, unknown>): Promise<void> } };
}
declare global { interface Window { claude?: { use(name: string): Promise<unknown> } } }

const LOCAL = 'bajoquito-ajustes';
let db: DbLike | null = null;
export let where: 'nube' | 'navegador' = 'navegador';

export async function loadAll(): Promise<Map<string, Saved>> {
  const out = new Map<string, Saved>();
  try { const raw = JSON.parse(localStorage.getItem(LOCAL) || '{}'); for (const k in raw) out.set(k, raw[k]); } catch { /* ignore */ }
  try {
    if (window.claude?.use) {
      const got = await Promise.race([window.claude.use('db'), new Promise(r => setTimeout(() => r(null), 10000))]);
      db = got as DbLike | null;
      if (db) {
        where = 'nube';
        const snap = await db.collection('ajustes').get();
        for (const d of snap.docs) { const v = d.data(); if (v) out.set(d.id, v as unknown as Saved); }
      }
    }
  } catch { db = null; where = 'navegador'; }
  return out;
}

export async function save(s: Saved) {
  try { const raw = JSON.parse(localStorage.getItem(LOCAL) || '{}'); raw[s.model] = s; localStorage.setItem(LOCAL, JSON.stringify(raw)); } catch { /* ignore */ }
  if (!db) return 'navegador' as const;
  await db.collection('ajustes').doc(s.model).set({ ...s });
  await db.collection('historial').doc(`${s.model}-${Date.now()}`).set({ ...s });
  return 'nube' as const;
}

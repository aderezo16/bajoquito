import { Geo, Rng } from '../engine/geo';
import { Params, Version } from './registry';

/**
 * Pieces added from the catalog chat ("agrega un toldo", "pon antenas en el techo").
 * They are stored with the model's settings (p.__extras), so the game draws them too once the version is approved.
 * Coordinates are relative to the model: x from its left edge, y from the ground, z from its back (front = +z).
 */
export type Forma = 'caja' | 'caja_redondeada' | 'cilindro' | 'esfera' | 'cono' | 'rueda' | 'panel_frente' | 'panel_lado' | 'luz';
export interface Extra {
  nombre: string; forma: Forma;
  x: number; y: number; z: number;
  ancho?: number; alto?: number; fondo?: number; radio?: number;
  color: string;
  repetir?: { veces: number; dx?: number; dy?: number; dz?: number };
}
export const FORMAS: Forma[] = ['caja', 'caja_redondeada', 'cilindro', 'esfera', 'cono', 'rueda', 'panel_frente', 'panel_lado', 'luz'];

export function parseList<T>(v: unknown): T[] {
  if (typeof v !== 'string' || !v) return [];
  try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch { return []; }
}
const fin = (n: unknown, d = 0) => (typeof n === 'number' && Number.isFinite(n) ? n : d);
const clampSize = (n: number) => Math.max(0.005, Math.min(8, Math.abs(n)));
const hex = (c: string) => parseInt(String(c).replace('#', ''), 16) || 0x999999;

/** Builds a model version with its hidden parts and its added pieces. The game and the catalog both use this. */
export function buildModel(v: Version, g: Geo, r: Rng, p: Params) {
  g.hidden = new Set(parseList<string>(p.__ocultar));
  const start = g.count();   // the game writes many models into one Geo: measure only this one
  v.build(g, r, p);
  g.tag(null); g.hidden = new Set();
  const extras = parseList<Extra>(p.__extras);
  if (!extras.length) return;
  const b = g.bounds(start);
  const ox = Number.isFinite(b.min.x) ? b.min.x : p.x, oz = Number.isFinite(b.min.z) ? b.min.z : p.z;
  for (const e of extras) addExtra(g, e, ox, oz);
}

export function addExtra(g: Geo, e: Extra, ox: number, oz: number) {
  const n = Math.max(1, Math.min(60, Math.round(fin(e.repetir?.veces, 1))));
  g.tag('agregado:' + e.nombre);
  for (let i = 0; i < n; i++) {
    const x = ox + fin(e.x) + i * fin(e.repetir?.dx), y = fin(e.y) + i * fin(e.repetir?.dy), z = oz + fin(e.z) + i * fin(e.repetir?.dz);
    const w = clampSize(fin(e.ancho, 0.2)), h = clampSize(fin(e.alto, 0.2)), d = clampSize(fin(e.fondo, 0.2)), rr = clampSize(fin(e.radio, 0.1));
    const c = hex(e.color);
    switch (e.forma) {
      case 'caja': g.box(x, y, z, w, h, d, c); break;
      case 'caja_redondeada': g.roundBox(x, y, z, w, h, d, c, Math.min(w, h, d) * 0.25); break;
      case 'cilindro': g.cyl(x, y, z, rr, h, c, 16); break;
      case 'esfera': g.blob(x, y, z, rr, c); break;
      case 'cono': g.cone(x, y, z, rr, h, c, 12); break;
      case 'rueda': g.wheel(x, y, z, rr, d, c); break;
      case 'panel_frente': g.panelZ(x, y, z, w, h, c); break;
      case 'panel_lado': g.panelX(x, y, z, d, h, c); break;
      case 'luz': g.blob(x, y, z, rr, c, 1, 12, true); break;
    }
  }
  g.tag(null);
}

/** Readable list of a model's parts for the chat (and the "parts" toggles). */
export function partsOf(g: Geo, ox: number, oz: number) {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const parts = [...g.partBounds.entries()].filter(([k]) => !k.startsWith('agregado:')).map(([k, b]) => ({ parte: k, desde: [r2(b.min.x - ox), r2(b.min.y), r2(b.min.z - oz)], hasta: [r2(b.max.x - ox), r2(b.max.y), r2(b.max.z - oz)] }));
  const marks = g.marks.slice(0, 48).map(m => ({ tipo: m.kind, centro: [r2((m.box.min.x + m.box.max.x) / 2 - ox), r2((m.box.min.y + m.box.max.y) / 2), r2((m.box.min.z + m.box.max.z) / 2 - oz)], tamaño: [r2(m.box.max.x - m.box.min.x), r2(m.box.max.y - m.box.min.y), r2(m.box.max.z - m.box.min.z)] }));
  return { parts, marks };
}

import { Geo, Rng } from '../engine/geo';

/**
 * Model registry: the single source of truth for every 3D element.
 * - The catalog shows all versions (approved and in review).
 * - The game only ever uses the APPROVED version.
 * To approve a version, change `approved` (and clear `review`).
 */
export type Params = { x: number; z: number; [k: string]: number | boolean | string };
export type Look = 'flat' | 'smooth' | 'toon';

export interface Version {
  /** Writes the model into `g` with its minimum corner at (p.x, 0, p.z). */
  build: (g: Geo, r: Rng, p: Params) => void;
  /** Default size/options used by the catalog. */
  defaults: Omit<Params, 'x' | 'z'>;
  /** What changed in this version (shown in the catalog). */
  notes: string;
  date: string;
  look?: Look;
}
export type Group = 'Estilo' | 'Barrios' | 'Estaciones' | 'Transporte' | 'Personas' | 'Protagonistas';
export interface ModelDef {
  id: string; name: string; group: Group;
  versions: Record<string, Version>;
  approved: string;
  review?: string;
  /** Only in the catalog (e.g. style studies). */
  catalogOnly?: boolean;
}

const REG = new Map<string, ModelDef>();
export function register(def: ModelDef) {
  if (!def.versions[def.approved]) throw new Error(`${def.id}: approved version ${def.approved} missing`);
  if (def.review && !def.versions[def.review]) throw new Error(`${def.id}: review version ${def.review} missing`);
  REG.set(def.id, def);
}
export function models() { return [...REG.values()]; }
export function model(id: string) { const m = REG.get(id); if (!m) throw new Error(`unknown model ${id}`); return m; }
/** The builder the GAME uses: always the approved version. */
export function approved(id: string) { const m = model(id); return m.versions[m.approved]; }
export function status(m: ModelDef): 'aprobado' | 'en revisión' { return m.review ? 'en revisión' : 'aprobado'; }

import * as THREE from 'three';
import { Geo, Rng } from '../engine/geo';
import { PALETTE } from '../world/config';
import { register, Params } from './registry';

const D = '2026-11-27';

/** Bus along x, minimum corner at (p.x, 0, p.z). */
export function busV1(g: Geo, _r: Rng, p: Params) {
  const L = 1.6, Wd = 0.56, H = 0.58, cx = p.x + L / 2, cz = p.z + Wd / 2, color = (p.color as number) ?? PALETTE.bus[0];
  g.box(cx - L / 2, 0.08, cz - Wd / 2, L, H - 0.08, Wd, color);
  g.box(cx - L / 2 + 0.02, H, cz - Wd / 2 + 0.03, L - 0.04, 0.03, Wd - 0.06, 0xe8ecf6);
  for (let k = 0; k < 4; k++) g.box(cx - L / 2 + 0.25 + k * 0.32, 0.3, cz - Wd / 2 - 0.006, 0.24, 0.18, Wd + 0.012, 0xfff0c8, true);
  g.panelX(cx + L / 2 + 0.005, 0.26, cz - Wd / 2 + 0.04, Wd - 0.08, 0.24, 0x9fd3ff, true);
  g.panelX(cx + L / 2 + 0.006, 0.12, cz - Wd / 2 + 0.06, 0.08, 0.06, 0xfff3c4, true);
  g.panelX(cx + L / 2 + 0.006, 0.12, cz + Wd / 2 - 0.14, 0.08, 0.06, 0xfff3c4, true);
  for (const wx of [-L / 2 + 0.3, L / 2 - 0.35]) for (const wz of [-Wd / 2 - 0.01, Wd / 2 - 0.05]) g.box(cx + wx, 0, cz + wz, 0.18, 0.16, 0.06, 0x0b1020);
}

/** Person: body + head. The game draws thousands of these with instancing, so it needs the two parts separately. */
export interface PersonParts { body: THREE.BufferGeometry; head: THREE.BufferGeometry }
export function personPartsV1(): PersonParts {
  const body = new THREE.CapsuleGeometry(0.06, 0.13, 3, 8); body.translate(0, 0.125, 0);
  const head = new THREE.SphereGeometry(0.054, 8, 6); head.translate(0, 0.29, 0);
  return { body, head };
}
export function personV1(g: Geo, _r: Rng, p: Params) {
  const c = (p.color as number) ?? PALETTE.people[0];
  g.capsule(p.x + 0.06, 0, p.z + 0.06, 0.06, 0.13, c);
  g.sphere(p.x + 0.06, 0.29, p.z + 0.06, 0.054, 0xe8b896, 8);
}
export const PERSON_PARTS: Record<string, () => PersonParts> = { v1: personPartsV1 };

register({ id: 'bus', name: 'Bus', group: 'Transporte', approved: 'v1',
  versions: { v1: { build: busV1, defaults: { color: PALETTE.bus[0] }, notes: 'Primera versión: carrocería, ventanas iluminadas, parabrisas, faros y ruedas.', date: D } } });
register({ id: 'persona', name: 'Persona', group: 'Personas', approved: 'v1',
  versions: { v1: { build: personV1, defaults: { color: PALETTE.people[2] }, notes: 'Primera versión: cuerpo de cápsula y cabeza. El ánimo se muestra con una carita encima (de cerca).', date: D } } });

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
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
export interface PersonParts { body: THREE.BufferGeometry; head: THREE.BufferGeometry; vertexColors?: boolean }
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
/** Paints a geometry with one gray level (multiplied by each person's color in the game). */
function shade(g: THREE.BufferGeometry, v: number) {
  const n = g.getAttribute('position').count, c = new Float32Array(n * 3).fill(v);
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
}
/** Same shapes as the clay «persona» (v2) at its default size: legs darker than the clothes, hair darker than the skin. */
export function personPartsV2(): PersonParts {
  const s = 0.3 / 0.32, hd = 0.055;
  const cap = (x: number, y: number, r: number, len: number) => { const g = new THREE.CapsuleGeometry(r, len, 3, 8); g.translate(x, y + len / 2 + r, 0); return g; };
  const body = mergeGeometries([
    shade(cap(-0.025 * s, 0, 0.022 * s, 0.07 * s), 0.42), shade(cap(0.025 * s, 0, 0.022 * s, 0.07 * s), 0.42),
    shade(cap(0, 0.08 * s, 0.058 * s, 0.07 * s), 1),
  ])!;
  const hy = 0.08 * s + 0.07 * s + 0.116 * s + hd * 0.8;
  const face = new THREE.SphereGeometry(hd, 12, 8); face.translate(0, hy, 0);
  const hair = new THREE.SphereGeometry(hd * 1.1, 12, 8); hair.scale(1, 0.62, 1); hair.translate(0, hy + hd * 0.34, -hd * 0.2);
  const head = mergeGeometries([shade(face, 1), shade(hair, 0.28)])!;
  return { body, head, vertexColors: true };
}
export const PERSON_PARTS: Record<string, () => PersonParts> = { v1: personPartsV1, v2: personPartsV2 };

register({ id: 'bus', name: 'Bus', group: 'Transporte', approved: 'v1',
  versions: { v1: { build: busV1, defaults: { color: PALETTE.bus[0] }, notes: 'Primera versión: carrocería, ventanas iluminadas, parabrisas, faros y ruedas.', date: D } } });
register({ id: 'persona', name: 'Persona', group: 'Personas', approved: 'v1',
  versions: { v1: { build: personV1, defaults: { color: PALETTE.people[2] }, notes: 'Primera versión: cuerpo de cápsula y cabeza. El ánimo se muestra con una carita encima (de cerca).', date: D } } });

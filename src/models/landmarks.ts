import { Geo, Rng } from '../engine/geo';
import { register, Params } from './registry';
import { windows } from './city';

const n = (p: Params, k: string) => p[k] as number;
const D = '2026-11-27';

export function municipioV1(g: Geo, r: Rng, p: Params) {
  const { x, z } = p, w = n(p, 'w'), d = n(p, 'd');
  const h = 1.45, wall = 0xefe7d8;
  g.box(x, 0, z, w, h, d, wall);
  g.box(x - 0.05, h, z - 0.05, w + 0.1, 0.08, d + 0.1, 0xffffff);
  const k9 = 9;
  for (let k = 0; k < k9; k++) g.arch(x + 0.25 + k * ((w - 0.5) / (k9 - 1)) - 0.12, 0, z + d + 0.01, 0.24, 0.5, 0xffd58a, true);
  g.box(x, 0.62, z + d, w, 0.05, 0.1, 0xd8ccb2);
  windows(g, r, x + 0.15, z, w - 0.3, d, 0.7, 0.7, 1, 0.55, 0.42);
  const cx = x + w / 2;
  g.box(cx - 0.9, 0, z + 0.3, 1.8, h + 0.45, d - 0.25, 0xf6f0e4);
  g.roof(cx - 0.95, h + 0.45, z + 0.25, 1.9, d - 0.15, 0.4, 0xe6dcc8, 'x', 0.02);
  g.cyl(cx, h + 0.8, z + 0.8, 0.018, 1.1, 0xc9d5f2, 5);
  g.box(cx, h + 1.65, z + 0.8, 0.38, 0.22, 0.02, 0xffc857);
}
export function concejoV1(g: Geo, r: Rng, p: Params) {
  const { x, z } = p, w = n(p, 'w'), d = n(p, 'd');
  const h = 1.2;
  g.box(x, 0, z, w, h, d, 0x3a4c80);
  windows(g, r, x, z, w, d, 0, h, 2, 0.5, 0.6);
  for (let k = 0; k < 6; k++) g.cyl(x + 0.45 + k * ((w - 0.9) / 5), 0, z + d + 0.2, 0.06, h * 0.92, 0xf2eadb, 10);
  g.box(x + 0.2, h * 0.92, z + d - 0.05, w - 0.4, 0.12, 0.38, 0xf2eadb);
  g.cyl(x + w / 2, h, z + d / 2, 0.55, 0.18, 0x344578, 16);
  g.dome(x + w / 2, h + 0.18, z + d / 2, 0.55, 0x3e8c78);
  g.cyl(x + w / 2, h + 0.7, z + d / 2, 0.04, 0.25, 0xc9d5f2, 6);
}
export function catedralV1(g: Geo, r: Rng, p: Params) {
  const { x, z } = p, w = n(p, 'w'), d = n(p, 'd');
  g.box(x, 0, z, w, 1.0, d, 0xe9e3d6);
  g.roof(x, 1.0, z, w, d, 0.45, 0x8e5644, 'z');
  for (const tx of [x, x + w - 0.75]) {
    g.box(tx, 0, z + d - 0.75, 0.75, 2.0, 0.75, 0xf2ede2);
    windows(g, r, tx, z + d - 0.75, 0.75, 0.75, 1.2, 0.6, 1, 0.6, 0.7);
    g.cone(tx + 0.375, 2.0, z + d - 0.375, 0.5, 0.75, 0x6e8f7e, 4);
  }
  g.arch(x + w / 2 - 0.18, 0, z + d + 0.01, 0.36, 0.6, 0x3b2f44);
  g.sphere(x + w / 2, 0.82, z + d + 0.01, 0.12, 0xffd58a, 10, true);
}
/** Underground warehouse, cut open. p.y = floor level. */
export function bodegaV1(g: Geo, r: Rng, p: Params) {
  const { x: bx0, z: bz0 } = p, w = n(p, 'w'), d = n(p, 'd'), Y = n(p, 'y');
  const bx1 = bx0 + w, bz1 = bz0 + d;
  g.plane(bx0, Y + 0.01, bz0, w, d, 0x252c5e);
  g.box(bx0, Y, bz0 - 0.1, w, 1.1, 0.1, 0x2c356e);
  g.box(bx0 - 0.1, Y, bz0, 0.1, 1.1, d, 0x262f64);
  g.box(bx0, Y, bz1 - 0.1, w, 0.28, 0.1, 0x2c356e);
  g.box(bx1 - 0.1, Y, bz0, 0.1, 0.28, d, 0x2c356e);
  for (let row = 0; row < 3; row++) {
    const zz = bz0 + 0.6 + row * 1.35;
    for (const lv of [0.1, 0.72, 1.34]) {
      g.box(bx0 + 0.5, Y + lv, zz, w - 1.2, 0.04, 0.62, 0x4a5582);
      for (let k = 0; k < Math.floor((w - 1.4) / 0.6); k++) if (r.chance(0.8)) g.box(bx0 + 0.6 + k * 0.6, Y + lv + 0.04, zz + 0.06, 0.48, 0.38, 0.5, r.pick([0x9c7f68, 0x8e735f, 0xa88a70]));
    }
    for (const px of [bx0 + 0.45, bx1 - 0.72]) g.box(px, Y, zz + 0.55, 0.06, 1.7, 0.06, 0x5d6a9c);
  }
  g.box(bx1 - 1.9, Y, bz1 - 0.95, 0.6, 0.42, 0.45, 0xc9a24e);
  g.box(bx1 - 1.95, Y, bz1 - 0.95, 0.06, 1.05, 0.45, 0x7f8fb8);
}

register({ id: 'municipio', name: 'Municipio', group: 'Protagonistas', approved: 'v1',
  versions: { v1: { build: municipioV1, defaults: { w: 4.3, d: 2.8 }, notes: 'Primera versión: dos pisos, arcos iluminados, frontón central y bandera.', date: D } } });
register({ id: 'concejo', name: 'Concejo Metropolitano', group: 'Protagonistas', approved: 'v1',
  versions: { v1: { build: concejoV1, defaults: { w: 4.0, d: 2.75 }, notes: 'Primera versión: columnata blanca y cúpula verde.', date: D } } });
register({ id: 'catedral', name: 'Catedral', group: 'Protagonistas', approved: 'v1',
  versions: { v1: { build: catedralV1, defaults: { w: 3.9, d: 2.85 }, notes: 'Primera versión: nave con teja, dos torres con chapitel verde y rosetón.', date: D } } });
register({ id: 'bodega', name: 'Bodega (bajo tierra)', group: 'Protagonistas', approved: 'v1',
  versions: { v1: { build: bodegaV1, defaults: { w: 10.2, d: 4.5, y: 0 }, notes: 'Primera versión: sala abierta con estanterías, cajas y montacargas.', date: D } } });

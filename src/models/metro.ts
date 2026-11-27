import { Geo, Rng } from '../engine/geo';
import { PALETTE } from '../world/config';
import { register, Params } from './registry';

const n = (p: Params, k: string) => p[k] as number;
const D = '2026-11-27';

/** Surface station centred on x (p.x is the centre here), stairs centred on p.zc. */
export function stationSurfaceV1(g: Geo, _r: Rng, p: Params) {
  const x = p.x + 1.55, zc = n(p, 'zc') ?? 0.8, broken = !!p.broken, z0 = p.z;
  g.plane(x - 1.55, 0.012, z0, 3.1, 2.1, 0x33427e);
  g.plane(x - 0.55, 0.02, zc - 0.4, 1.1, 0.8, 0x070a1c);
  for (let k = 0; k < 4; k++) g.box(x - 0.5, -0.05 - k * 0.08, zc - 0.35 + k * 0.18, 1.0, 0.04, 0.18, 0x2c3770);
  for (const [px, pz] of [[-0.62, -0.45], [0.55, -0.45], [-0.62, 0.42], [0.55, 0.42]]) g.box(x + px, 0, zc + pz, 0.06, 0.85, 0.06, 0x9aa6c4);
  g.box(x - 0.72, 0.85, zc - 0.55, 1.44, 0.06, 1.05, broken ? 0xe5484d : 0xbfe0ff);
  g.box(x + 1.0, 0, zc + 0.45, 0.12, 1.2, 0.12, 0x2f79e0);
  g.cyl(x + 1.06, 1.27, zc + 0.51, 0.13, 0.04, 0x2f79e0, 16, true);
  if (broken) for (let k = 0; k < 6; k++) g.box(x - 0.65 + k * 0.23, 0.38, zc - 0.5, 0.12, 0.05, 0.02, k % 2 ? 0x1b2340 : 0xffc857);
}
/** Underground station module, centred on x = p.x + 2.6; p.y = tunnel floor. Platforms at z ±(1.4..2.7). */
export function stationUndergroundV1(g: Geo, _r: Rng, p: Params) {
  const x = p.x + 2.6, Y = n(p, 'y'), broken = !!p.broken;
  g.box(x - 2.6, Y, -4.4, 4.7, 3.0, 0.1, 0x1a2154);
  g.box(x - 2.5, Y + 2.8, -4.29, 4.5, 0.06, 0.02, 0xcfe0ff, true);
  g.box(x + 2.1, Y, -4.4, 0.1, 3.0, 3.0, 0x151b48);
  g.box(x - 2.6, Y + 1.9, -4.3, 3.2, 0.14, 1.65, 0x2a3474);
  for (let k = 0; k < 3; k++) g.box(x - 2.4 + k * 1.2, Y + 2.04, -2.7, 0.04, 0.36, 0.04, 0x9aa6c4);
  g.box(x - 2.6, Y + 2.38, -2.7, 3.2, 0.03, 0.03, 0x9aa6c4);
  g.beam(x - 2.0, Y + 1.95, x - 0.8, Y + 0.24, -2.4, 0.45, 0.06, broken ? 0xe5484d : 0x3e4c8c);
  for (const [z0, z1] of [[-2.7, -1.4], [1.4, 2.7]]) {
    g.box(x - 2.0, Y, z0, 4.0, 0.22, z1 - z0, 0x36437f);
    g.box(x - 2.0, Y + 0.221, z0 < 0 ? z1 - 0.06 : z0, 4.0, 0.005, 0.06, 0xffc857, true);
  }
  for (const bx of [x - 1.4, x + 1.0]) g.box(bx, Y + 0.22, -2.55, 0.5, 0.1, 0.16, 0x6b4a2e);
  if (p.withTrack) {                      // catalog only: a piece of tunnel to show the module in context
    g.plane(x - 2.6, Y, -1.4, 4.8, 2.8, 0x1a1f4c);
    for (const tz of [-0.55, 0.55]) for (const dz of [-0.2, 0.2]) g.box(x - 2.6, Y + 0.035, tz + dz - 0.015, 4.8, 0.035, 0.03, 0x8090c0);
  }
}
/** Two-car metro train along x, centred on (0,0,0) — p.x/p.z are ignored offsets for the catalog. */
export function trainV1(g: Geo, _r: Rng, p: Params) {
  const car = 1.72, W = 0.6, H = 0.62, ox = p.x + car + 0.04, oz = p.z + W / 2;
  for (const off of [-car / 2 - 0.02, car / 2 + 0.02]) {
    const x0 = ox + off - car / 2;
    g.box(x0, 0.12, oz - W / 2, car, H, W, 0xf3f6fc);
    g.box(x0, 0.2, oz + W / 2, car, 0.06, 0.005, 0xff6b2c);
    g.box(x0, 0.2, oz - W / 2 - 0.005, car, 0.06, 0.005, 0xff6b2c);
    g.box(x0 + 0.12, 0.38, oz - W / 2 - 0.006, car - 0.24, 0.24, W + 0.012, 0xfff0c8, true);
    for (let k = 0; k < 6; k++) {
      const px = x0 + 0.2 + k * 0.25 + ((k * 7) % 3) * 0.02;
      for (const side of [1, -1]) {
        const zz = oz + side * (W / 2 + 0.014) - (side < 0 ? 0.004 : 0);
        g.box(px - 0.035, 0.46, zz, 0.07, 0.08, 0.004, 0x1b2340);
        g.box(px - 0.06, 0.38, zz, 0.12, 0.08, 0.004, PALETTE.people[(k * 3 + (side > 0 ? 0 : 1)) % 7]);
      }
    }
  }
  g.panelX(ox + car + 0.04, 0.34, oz - W / 2 + 0.06, W - 0.12, 0.26, 0x9fd3ff, true);
}

register({ id: 'estacion-superficie', name: 'Estación (acceso en la calle)', group: 'Estaciones', approved: 'v1',
  versions: { v1: { build: stationSurfaceV1, defaults: { zc: 0.8, broken: false }, notes: 'Primera versión: escalera bajo techo de vidrio y tótem M.', date: D } } });
register({ id: 'estacion-subterranea', name: 'Estación (bajo tierra)', group: 'Estaciones', approved: 'v1',
  versions: { v1: { build: stationUndergroundV1, defaults: { y: 0, broken: false, withTrack: true }, notes: 'Primera versión: pared con nombre, mezzanine, escalera eléctrica, dos andenes con línea amarilla y bancas.', date: D } } });
register({ id: 'tren', name: 'Tren del metro', group: 'Transporte', approved: 'v1',
  versions: { v1: { build: trainV1, defaults: {}, notes: 'Primera versión: dos coches, franja naranja, ventanas iluminadas con siluetas de pasajeros.', date: D } } });

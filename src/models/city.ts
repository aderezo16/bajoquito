import { Geo, Rng } from '../engine/geo';
import { PALETTE } from '../world/config';
import { register, Params } from './registry';

/** Darken/lighten a hex colour. */
export function tint(c: number, f: number) {
  let r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  if (f >= 1) { r += (255 - r) * (f - 1); g += (255 - g) * (f - 1); b += (255 - b) * (f - 1); }
  else { r *= f; g *= f; b *= f; }
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}
const n = (p: Params, k: string) => p[k] as number;

/** Rows of windows on the front (+z) face and on the right (+x) face of a box. */
export function windows(g: Geo, r: Rng, x: number, z: number, w: number, d: number, y0: number, h: number, floors: number, lit = 0.25, step = 0.5) {
  const fh = h / floors;
  const nx = Math.max(1, Math.floor((w - 0.15) / step));
  const nz = Math.max(1, Math.floor((d - 0.15) / step));
  for (let f = 0; f < floors; f++) {
    const wy = y0 + f * fh + fh * 0.35;
    for (let k = 0; k < nx; k++) {
      const cx = x + (k + 0.5) * (w / nx);
      const on = r.chance(lit);
      g.panelZ(cx - 0.09, wy, z + d + 0.006, 0.18, fh * 0.42, on ? PALETTE.window : PALETTE.windowDark, on);
    }
    for (let k = 0; k < nz; k++) {
      const cz = z + (k + 0.5) * (d / nz);
      const on = r.chance(lit * 0.7);
      g.panelX(x + w + 0.006, wy, cz - 0.08, 0.16, fh * 0.42, on ? PALETTE.window : PALETTE.windowDark, on);
    }
  }
}

// ---------------- v1 builders (the ones in the 3D test) ----------------
export function houseV1(g: Geo, r: Rng, p: Params) {
  const { x, z } = p, w = n(p, 'w'), d = n(p, 'd'), h = n(p, 'h'), wall = n(p, 'wall'), roof = n(p, 'roof');
  g.box(x, 0, z, w, h, d, wall);
  windows(g, r, x, z, w, d, 0, h, Math.max(1, Math.round(h / 0.42)), 0.22, 0.55);
  if (p.door !== false) g.panelZ(x + w * 0.5 - 0.08, 0, z + d + 0.008, 0.16, 0.28, tint(roof, 0.45));
  g.roof(x, h, z, w, d, Math.min(d * 0.32, 0.42), roof, w >= d ? 'x' : 'z');
}
export function colonialV1(g: Geo, r: Rng, p: Params) {
  const { x, z } = p, w = n(p, 'w'), d = n(p, 'd'), h = n(p, 'h'), lit = n(p, 'lit');
  const t = 0.85, wall = PALETTE.wallColonial, roof = PALETTE.roofColonial;
  const wing = (wx: number, wz: number, ww: number, wd: number, axis: 'x' | 'z') => { g.box(wx, 0, wz, ww, h, wd, wall); g.roof(wx, h, wz, ww, wd, 0.32, roof, axis); };
  wing(x, z, w, t, 'x'); wing(x, z + t, t, d - 2 * t, 'z'); wing(x + w - t, z + t, t, d - 2 * t, 'z'); wing(x, z + d - t, w, t, 'x');
  windows(g, r, x, z + d - t, w, t, 0, h, 2, lit, 0.6);
  windows(g, r, x + w - t, z, t, d - t, 0, h, 2, lit * 0.6, 0.7);
  for (let bx = x + 0.3; bx < x + w - 0.45; bx += 0.6) g.box(bx, h * 0.52, z + d, 0.36, 0.05, 0.12, 0x5a3e26);
  g.arch(x + w / 2 - 0.13, 0, z + d + 0.01, 0.26, 0.36, 0x3b2f44);
  g.plane(x + t, 0.01, z + t, w - 2 * t, d - 2 * t, 0x24584a);
  treeV1(g, r, { x: x + w / 2, z: z + d / 2, k: 0.9 });
}
export function treeV1(g: Geo, r: Rng, p: Params) {
  const { x, z } = p, k = n(p, 'k');
  g.cyl(x, 0, z, 0.04 * k, 0.32 * k, 0x4a3420, 5);
  const c = r.pick([0x1f5645, 0x23604c, 0x2a6e57]);
  g.sphere(x, 0.42 * k, z, 0.2 * k, c, 7);
  g.sphere(x + 0.08 * k, 0.55 * k, z + 0.04 * k, 0.13 * k, tint(c, 1.15), 6);
}
export function lampV1(g: Geo, _r: Rng, p: Params) {
  const { x, z } = p;
  g.cyl(x, 0, z, 0.02, 0.85, 0x7f8fb8, 5);
  g.box(x - 0.02, 0.82, z - 0.02, 0.18, 0.03, 0.04, 0x7f8fb8);
  g.sphere(x + 0.15, 0.79, z, 0.045, 0xffe3a0, 6, true);
}
export function trafficPoleV1(g: Geo, _r: Rng, p: Params) {
  const { x, z } = p;
  g.cyl(x, 0, z, 0.018, 0.62, 0x7f8fb8, 5);
  g.box(x - 0.04, 0.5, z - 0.03, 0.08, 0.2, 0.06, 0x101633);
}

const D = '2026-11-27';
register({ id: 'casa', name: 'Casa de barrio', group: 'Barrios', approved: 'v1',
  versions: { v1: { build: houseV1, defaults: { w: 1.4, d: 1.1, h: 0.55, wall: PALETTE.wallSouth[0], roof: PALETTE.roofSouth[0], door: true }, notes: 'Primera versión: caja con techo a dos aguas, ventanas y puerta.', date: D } } });
register({ id: 'manzana-colonial', name: 'Manzana colonial', group: 'Barrios', approved: 'v1',
  versions: { v1: { build: colonialV1, defaults: { w: 4.9, d: 3.65, h: 0.75, lit: 0.22 }, notes: 'Primera versión: cuatro alas con teja, patio con árbol, balcones y portón.', date: D } } });
register({ id: 'arbol', name: 'Árbol', group: 'Barrios', approved: 'v1',
  versions: { v1: { build: treeV1, defaults: { k: 1.4 }, notes: 'Primera versión: tronco y dos copas esféricas.', date: D } } });
register({ id: 'farol', name: 'Farol', group: 'Barrios', approved: 'v1',
  versions: { v1: { build: lampV1, defaults: {}, notes: 'Primera versión: poste, brazo y luz cálida.', date: D } } });
register({ id: 'semaforo', name: 'Semáforo', group: 'Estaciones', approved: 'v1',
  versions: { v1: { build: trafficPoleV1, defaults: {}, notes: 'Primera versión: poste con caja de luces (las luces se encienden en el juego).', date: D } } });

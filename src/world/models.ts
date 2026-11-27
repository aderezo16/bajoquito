import { Geo, Rng } from '../engine/geo';
import { PALETTE } from './config';

/** Darken/lighten a hex colour. */
export function tint(c: number, f: number) {
  let r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  if (f >= 1) { r += (255 - r) * (f - 1); g += (255 - g) * (f - 1); b += (255 - b) * (f - 1); }
  else { r *= f; g *= f; b *= f; }
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}

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

export function house(g: Geo, r: Rng, x: number, z: number, w: number, d: number, h: number, wall: number, roof: number, door = true) {
  g.box(x, 0, z, w, h, d, wall);
  windows(g, r, x, z, w, d, 0, h, Math.max(1, Math.round(h / 0.42)), 0.22, 0.55);
  if (door) g.panelZ(x + w * 0.5 - 0.08, 0, z + d + 0.008, 0.16, 0.28, tint(roof, 0.45));
  g.roof(x, h, z, w, d, Math.min(d * 0.32, 0.42), roof, w >= d ? 'x' : 'z');
}

/** Colonial perimeter block: four wings with tile roofs around a courtyard with a tree. */
export function colonialBlock(g: Geo, r: Rng, x: number, z: number, w: number, d: number, h = 0.75, lit = 0.22) {
  const t = 0.85, wall = PALETTE.wallColonial, roof = PALETTE.roofColonial;
  const wing = (wx: number, wz: number, ww: number, wd: number, axis: 'x' | 'z') => {
    g.box(wx, 0, wz, ww, h, wd, wall);
    g.roof(wx, h, wz, ww, wd, 0.32, roof, axis);
  };
  wing(x, z, w, t, 'x');
  wing(x, z + t, t, d - 2 * t, 'z');
  wing(x + w - t, z + t, t, d - 2 * t, 'z');
  wing(x, z + d - t, w, t, 'x');
  windows(g, r, x, z + d - t, w, t, 0, h, 2, lit, 0.6);
  windows(g, r, x + w - t, z, t, d - t, 0, h, 2, lit * 0.6, 0.7);
  // wooden balconies and a big door on the street
  for (let bx = x + 0.3; bx < x + w - 0.45; bx += 0.6) g.box(bx, h * 0.52, z + d, 0.36, 0.05, 0.12, 0x5a3e26);
  g.arch(x + w / 2 - 0.13, 0, z + d + 0.01, 0.26, 0.36, 0x3b2f44);
  g.plane(x + t, 0.01, z + t, w - 2 * t, d - 2 * t, 0x24584a);
  tree(g, r, x + w / 2, z + d / 2, 0.9);
}

export function tree(g: Geo, r: Rng, x: number, z: number, k = 1) {
  g.cyl(x, 0, z, 0.04 * k, 0.32 * k, 0x4a3420, 5);
  const c = r.pick([0x1f5645, 0x23604c, 0x2a6e57]);
  g.sphere(x, 0.42 * k, z, 0.2 * k, c, 7);
  g.sphere(x + 0.08 * k, 0.55 * k, z + 0.04 * k, 0.13 * k, tint(c, 1.15), 6);
}

export function lamp(g: Geo, x: number, z: number) {
  g.cyl(x, 0, z, 0.02, 0.85, 0x7f8fb8, 5);
  g.box(x - 0.02, 0.82, z - 0.02, 0.18, 0.03, 0.04, 0x7f8fb8);
  g.sphere(x + 0.15, 0.79, z, 0.045, 0xffe3a0, 6, true);
}

export function municipio(g: Geo, r: Rng, x: number, z: number, w: number, d: number) {
  const h = 1.45, wall = 0xefe7d8;
  g.box(x, 0, z, w, h, d, wall);
  g.box(x - 0.05, h, z - 0.05, w + 0.1, 0.08, d + 0.1, 0xffffff);
  // ground-floor arcade: arches lit from inside
  const n = 9;
  for (let k = 0; k < n; k++) {
    const ax = x + 0.25 + k * ((w - 0.5) / (n - 1)) - 0.12;
    g.arch(ax, 0, z + d + 0.01, 0.24, 0.5, 0xffd58a, true);
  }
  g.box(x, 0.62, z + d, w, 0.05, 0.1, 0xd8ccb2);
  windows(g, r, x + 0.15, z, w - 0.3, d, 0.7, 0.7, 1, 0.55, 0.42);
  // central pavilion with pediment and flag
  const cx = x + w / 2;
  g.box(cx - 0.9, 0, z + 0.3, 1.8, h + 0.45, d - 0.25, 0xf6f0e4);
  g.roof(cx - 0.95, h + 0.45, z + 0.25, 1.9, d - 0.15, 0.4, 0xe6dcc8, 'x', 0.02);
  g.cyl(cx, h + 0.8, z + 0.8, 0.018, 1.1, 0xc9d5f2, 5);
  g.box(cx, h + 1.65, z + 0.8, 0.38, 0.22, 0.02, 0xffc857);
}

export function concejo(g: Geo, r: Rng, x: number, z: number, w: number, d: number) {
  const h = 1.2;
  g.box(x, 0, z, w, h, d, 0x3a4c80);
  windows(g, r, x, z, w, d, 0, h, 2, 0.5, 0.6);
  for (let k = 0; k < 6; k++) g.cyl(x + 0.45 + k * ((w - 0.9) / 5), 0, z + d + 0.2, 0.06, h * 0.92, 0xf2eadb, 10);
  g.box(x + 0.2, h * 0.92, z + d - 0.05, w - 0.4, 0.12, 0.38, 0xf2eadb);
  g.cyl(x + w / 2, h, z + d / 2, 0.55, 0.18, 0x344578, 16);
  g.dome(x + w / 2, h + 0.18, z + d / 2, 0.55, 0x3e8c78);
  g.cyl(x + w / 2, h + 0.7, z + d / 2, 0.04, 0.25, 0xc9d5f2, 6);
}

export function catedral(g: Geo, r: Rng, x: number, z: number, w: number, d: number) {
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

/** Surface station: stairs into the ground under a glass canopy, plus the M totem. */
export function stationPavilion(g: Geo, x: number, zc: number, broken = false) {
  g.plane(x - 1.55, 0.012, 1.35, 3.1, 2.1, 0x33427e);
  g.plane(x - 0.55, 0.02, zc - 0.4, 1.1, 0.8, 0x070a1c);
  for (let k = 0; k < 4; k++) g.box(x - 0.5, -0.05 - k * 0.08, zc - 0.35 + k * 0.18, 1.0, 0.04, 0.18, 0x2c3770);
  for (const [px, pz] of [[-0.62, -0.45], [0.55, -0.45], [-0.62, 0.42], [0.55, 0.42]]) g.box(x + px, 0, zc + pz, 0.06, 0.85, 0.06, 0x9aa6c4);
  g.box(x - 0.72, 0.85, zc - 0.55, 1.44, 0.06, 1.05, broken ? 0xe5484d : 0xbfe0ff);
  g.box(x + 1.0, 0, zc + 0.45, 0.12, 1.2, 0.12, 0x2f79e0);
  g.cyl(x + 1.06, 1.27, zc + 0.51, 0.13, 0.04, 0x2f79e0, 16, true);
  if (broken) {
    for (let k = 0; k < 6; k++) g.box(x - 0.65 + k * 0.23, 0.38, zc - 0.5, 0.12, 0.05, 0.02, k % 2 ? 0x1b2340 : 0xffc857);
  }
}

export function trafficPole(g: Geo, x: number, z: number) {
  g.cyl(x, 0, z, 0.018, 0.62, 0x7f8fb8, 5);
  g.box(x - 0.04, 0.5, z - 0.03, 0.08, 0.2, 0.06, 0x101633);
}

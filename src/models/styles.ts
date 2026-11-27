import { Geo, Rng } from '../engine/geo';
import { register, Params } from './registry';
import { tint } from './city';

/**
 * Style study: the same street corner (colonial block, house, metro entrance, bus, people, trees, lamp)
 * drawn three ways. Only for choosing the art direction; nothing here is used by the game.
 */
interface Kit {
  ground: number; walk: number; avenue: number; zebra: number;
  wall: number; wall2: number; roof: number; door: number; trim: number;
  leaf: number[]; trunk: number; people: number[]; bus: number;
  glass: number; win: number; winDark: number;
  box: (g: Geo, x: number, y: number, z: number, w: number, h: number, d: number, c: number) => void;
  roofH: number;
  personScale: { body: number; head: number };
}

function corner(g: Geo, r: Rng, ox: number, oz: number, k: Kit, detail: 'soft' | 'rich' | 'toy') {
  const B = (x: number, y: number, z: number, w: number, h: number, d: number, c: number) => k.box(g, ox + x, y, oz + z, w, h, d, c);
  const W = 8, D = 6.6;
  // base tile (the scale-model board)
  B(0, -0.25, 0, W, 0.25, D, tint(k.ground, 0.75));
  g.plane(ox, 0.002, oz, W, D, k.ground);
  g.plane(ox, 0.004, oz + 3.45, W, 0.75, k.walk);
  g.plane(ox, 0.004, oz + 5.65, W, 0.95, k.walk);
  g.plane(ox, 0.006, oz + 4.2, W, 1.45, k.avenue);
  for (let i = 0; i < 6; i++) g.plane(ox + 6.55, 0.01, oz + 4.3 + i * 0.24, 0.6, 0.12, k.zebra);
  for (let x = 0.3; x < 6; x += 1.2) g.plane(ox + x, 0.01, oz + 4.9, 0.55, 0.05, k.zebra);
  if (detail !== 'soft') { B(0, 0, 4.15, W, 0.06, 0.06, tint(k.walk, 1.25)); B(0, 0, 5.62, W, 0.06, 0.06, tint(k.walk, 1.25)); }

  // ---------- colonial block (front wing + side wings, courtyard hidden) ----------
  const bx = 0.4, bz = 0.4, bw = 4.6, bd = 2.9, h = detail === 'toy' ? 0.95 : 0.8, t = 0.9;
  B(bx, 0, bz, bw, h, t, k.wall);
  B(bx, 0, bz + t, t, h, bd - 2 * t, k.wall);
  B(bx + bw - t, 0, bz + t, t, h, bd - 2 * t, k.wall);
  B(bx, 0, bz + bd - t, bw, h, t, k.wall);
  g.plane(ox + bx + t, 0.01, oz + bz + t, bw - 2 * t, bd - 2 * t, tint(k.leaf[0], 0.8));
  const roofs: [number, number, number, number, 'x' | 'z'][] = [[bx, bz, bw, t, 'x'], [bx, bz + t, t, bd - 2 * t, 'z'], [bx + bw - t, bz + t, t, bd - 2 * t, 'z'], [bx, bz + bd - t, bw, t, 'x']];
  for (const [x, z, w, d, a] of roofs) g.roof(ox + x, h, oz + z, w, d, k.roofH, k.roof, a, detail === 'rich' ? 0.08 : 0.04);
  const fz = oz + bz + bd + 0.006;                   // street facade
  const nWin = detail === 'toy' ? 4 : 6;
  for (let i = 0; i < nWin; i++) {
    const wx = ox + bx + 0.35 + i * ((bw - 0.7) / (nWin - 1)) - (detail === 'toy' ? 0.16 : 0.11);
    const ww = detail === 'toy' ? 0.32 : 0.22, wh = detail === 'toy' ? 0.3 : 0.24;
    const lit = r.chance(0.4);
    if (i === Math.floor(nWin / 2)) {                // main door
      if (detail === 'soft') g.roundBox(wx - 0.04, 0, fz - 0.02, ww + 0.08, 0.46, 0.04, k.door, 0.02);
      else { g.arch(wx - 0.04, 0, fz, ww + 0.08, 0.5, k.door); if (detail === 'rich') g.box(wx - 0.08, 0, fz - 0.005, ww + 0.16, 0.56, 0.02, k.trim); }
      continue;
    }
    for (const fy of [0.12, h * 0.56]) {
      if (detail === 'rich') g.box(wx - 0.03, fy - 0.03, fz - 0.005, ww + 0.06, wh + 0.06, 0.02, k.trim);
      g.panelZ(wx, fy, fz + 0.012, ww, wh, lit && fy > 0.2 ? k.win : k.winDark, lit && fy > 0.2);
      if (detail === 'rich') { g.box(wx - 0.07, fy, fz, 0.05, wh, 0.02, k.door); g.box(wx + ww + 0.02, fy, fz, 0.05, wh, 0.02, k.door); }
      if (detail === 'toy') g.box(wx - 0.02, fy - 0.04, fz, ww + 0.04, 0.04, 0.06, k.trim);
    }
    if (detail !== 'soft') {                         // wooden balcony
      g.box(wx - 0.06, h * 0.52, fz, ww + 0.12, 0.04, 0.16, k.trim);
      if (detail === 'rich') for (let q = 0; q < 4; q++) g.box(wx - 0.05 + q * (ww + 0.1) / 3, h * 0.52, fz + 0.14, 0.015, 0.16, 0.015, k.trim);
    }
  }
  if (detail === 'rich') {                           // plinth and cornice
    g.box(ox + bx - 0.02, 0, fz - 0.02, bw + 0.04, 0.1, 0.05, tint(k.wall, 0.78));
    g.box(ox + bx - 0.03, h - 0.05, fz - 0.02, bw + 0.06, 0.06, 0.06, tint(k.wall, 1.08));
  }

  // ---------- small house on the right ----------
  const hx = 5.5, hz = 1.1, hw = 1.9, hd = 1.5, hh = detail === 'toy' ? 0.75 : 0.6;
  B(hx, 0, hz, hw, hh, hd, k.wall2);
  g.roof(ox + hx, hh, oz + hz, hw, hd, k.roofH * 0.9, tint(k.roof, 0.9), 'x', 0.06);
  g.panelZ(ox + hx + 0.3, 0.18, oz + hz + hd + 0.008, 0.3, 0.24, r.chance(0.5) ? k.win : k.winDark, true);
  if (detail === 'soft') g.roundBox(ox + hx + 1.2, 0, oz + hz + hd - 0.02, 0.26, 0.42, 0.04, k.door, 0.02);
  else g.panelZ(ox + hx + 1.2, 0, oz + hz + hd + 0.008, 0.26, 0.42, k.door);

  // ---------- trees and lamp ----------
  const tree = (x: number, z: number, s = 1) => {
    if (detail === 'soft') { g.cyl(ox + x, 0, oz + z, 0.05 * s, 0.35 * s, k.trunk, 8); g.sphere(ox + x, 0.6 * s, oz + z, 0.32 * s, k.leaf[0], 16); }
    else if (detail === 'rich') {
      g.cyl(ox + x, 0, oz + z, 0.05 * s, 0.45 * s, k.trunk, 5);
      g.ico(ox + x, 0.58 * s, oz + z, 0.26 * s, k.leaf[0], 0, 0.9);
      g.ico(ox + x + 0.12 * s, 0.76 * s, oz + z + 0.05, 0.18 * s, k.leaf[1], 0, 0.9);
      g.ico(ox + x - 0.12 * s, 0.7 * s, oz + z - 0.04, 0.16 * s, k.leaf[2], 0);
    } else { g.cyl(ox + x, 0, oz + z, 0.08 * s, 0.32 * s, k.trunk, 8); g.sphere(ox + x, 0.62 * s, oz + z, 0.38 * s, k.leaf[0], 10); g.sphere(ox + x + 0.14 * s, 0.86 * s, oz + z, 0.2 * s, k.leaf[1], 10); }
  };
  tree(5.3, 3.75, 1.1); tree(7.6, 3.8, 0.95); tree(0.5, 6.15, 0.9); tree(7.9, 0.6, 1.2);
  const lx = ox + 2.6, lz = oz + 3.75;
  g.cyl(lx, 0, lz, 0.025, detail === 'toy' ? 0.75 : 0.9, k.trim, 8);
  g.sphere(lx, detail === 'toy' ? 0.82 : 0.95, lz, detail === 'toy' ? 0.09 : 0.06, 0xffe3a0, 10, true);

  // ---------- metro entrance ----------
  const sx = ox + 6.2, sz = oz + 5.95;
  g.plane(sx - 0.55, 0.02, sz - 0.25, 1.1, 0.55, 0x070a1c);
  if (detail === 'soft') {
    g.roundBox(sx - 0.7, 0.7, sz - 0.4, 1.4, 0.08, 0.8, k.glass, 0.04);
    for (const px of [-0.6, 0.55]) g.roundBox(sx + px, 0, sz - 0.3, 0.06, 0.72, 0.06, k.trim, 0.02);
    g.roundBox(sx + 0.85, 0, sz + 0.2, 0.14, 1.0, 0.14, 0x4a90e2, 0.05);
    g.sphere(sx + 0.92, 1.1, sz + 0.27, 0.12, 0x4a90e2, 16, true);
  } else if (detail === 'rich') {
    for (const px of [-0.62, 0.56]) for (const pz of [-0.35, 0.3]) g.box(sx + px, 0, sz + pz, 0.05, 0.8, 0.05, k.trim);
    g.box(sx - 0.72, 0.8, sz - 0.45, 1.44, 0.05, 0.9, k.glass);
    g.box(sx - 0.72, 0.85, sz - 0.45, 1.44, 0.02, 0.04, k.trim);
    for (let q = 0; q < 4; q++) g.box(sx - 0.5, -0.04 - q * 0.06, sz - 0.2 + q * 0.12, 1.0, 0.03, 0.12, 0x2c3770);
    g.box(sx + 0.9, 0, sz + 0.25, 0.1, 1.15, 0.1, 0x2f79e0);
    g.cyl(sx + 0.95, 1.2, sz + 0.3, 0.12, 0.035, 0x2f79e0, 16, true);
    g.box(sx - 0.68, 0, sz + 0.32, 0.06, 0.32, 0.25, k.trim);
  } else {
    g.box(sx - 0.75, 0.75, sz - 0.45, 1.5, 0.14, 0.9, k.glass);
    for (const px of [-0.65, 0.55]) g.box(sx + px, 0, sz - 0.35, 0.1, 0.76, 0.1, k.trim);
    g.cyl(sx + 0.95, 0, sz + 0.25, 0.08, 1.0, 0x2b7bb9, 10);
    g.sphere(sx + 0.95, 1.12, sz + 0.25, 0.17, 0x2b7bb9, 14, true);
  }

  // ---------- bus ----------
  const busX = ox + 1.0, busZ = oz + 4.32, L = detail === 'toy' ? 1.7 : 1.6, Wd = detail === 'toy' ? 0.62 : 0.56, H = detail === 'toy' ? 0.66 : 0.58;
  if (detail === 'soft') g.roundBox(busX, 0.1, busZ, L, H - 0.1, Wd, k.bus, 0.12);
  else g.box(busX, 0.1, busZ, L, H - 0.1, Wd, k.bus);
  for (let q = 0; q < 4; q++) g.box(busX + 0.22 + q * 0.32, 0.3, busZ - 0.006, 0.24, 0.18, Wd + 0.012, k.win, true);
  g.panelX(busX + L + 0.006, 0.28, busZ + 0.05, Wd - 0.1, 0.24, 0x9fd3ff, true);
  for (const wx of [0.3, L - 0.35]) for (const wz of [-0.01, Wd - 0.05]) {
    if (detail === 'toy') g.cyl(busX + wx + 0.09, 0, busZ + wz + 0.03, 0.12, 0.08, 0x1b2340, 12);
    else g.box(busX + wx, 0, busZ + wz, 0.18, 0.16, 0.06, 0x0b1020);
  }
  if (detail === 'rich') { g.box(busX - 0.02, 0.1, busZ - 0.01, 0.04, 0.12, Wd + 0.02, 0x9aa6c4); g.box(busX + 0.2, H, busZ + 0.1, 0.5, 0.06, Wd - 0.2, 0xc9d5f2); }

  // ---------- people ----------
  const ps = k.personScale;
  const person = (x: number, z: number, c: number) => {
    if (detail === 'rich') {
      g.box(ox + x - 0.04, 0, oz + z - 0.025, 0.03, 0.1, 0.05, 0x2a3156);
      g.box(ox + x + 0.01, 0, oz + z - 0.025, 0.03, 0.1, 0.05, 0x2a3156);
      g.box(ox + x - 0.055, 0.1, oz + z - 0.035, 0.11, 0.14 * ps.body, 0.07, c);
      g.sphere(ox + x, 0.1 + 0.14 * ps.body + 0.05 * ps.head, oz + z, 0.05 * ps.head, 0xe8b896, 8);
    } else {
      g.capsule(ox + x, 0, oz + z, 0.06 * ps.body, 0.12 * ps.body, c);
      g.sphere(ox + x, 0.12 * ps.body + 0.12 * ps.body + 0.06 * ps.head, oz + z, 0.06 * ps.head, 0xe8b896, 12);
    }
  };
  [[1.4, 3.8], [1.65, 3.9], [3.5, 3.7], [5.6, 6.1], [6.9, 6.2], [7.2, 3.9]].forEach(([x, z], i) => person(x, z, k.people[i % k.people.length]));
}

const STUDY = '2026-11-27';
const A: Kit = {
  ground: 0x9fb89a, walk: 0xd9d2c5, avenue: 0x7d8aa8, zebra: 0xf4f1ea,
  wall: 0xf3e9da, wall2: 0xe9d8e6, roof: 0xe8a88a, door: 0x7aa5c9, trim: 0xd9d2c5,
  leaf: [0x8cc49a, 0x9fd1a9, 0x7ab489], trunk: 0xa58a6e, people: [0xf6c07a, 0x9bc4e8, 0xe89bb0, 0xb9a6e0, 0x8fd1b8, 0xf2a37f], bus: 0x7fc8a9,
  glass: 0xcfe6f7, win: 0xffe3b0, winDark: 0x8fa0c0, roofH: 0.34, personScale: { body: 1, head: 1.05 },
  box: (g, x, y, z, w, h, d, c) => g.roundBox(x, y, z, w, h, d, c, 0.06),
};
const B: Kit = {
  ground: 0x3f5a3e, walk: 0x8c8a86, avenue: 0x3b3f52, zebra: 0xe9e4d8,
  wall: 0xeadbc2, wall2: 0xd8c3a0, roof: 0xa65a3c, door: 0x2f5f86, trim: 0x6b4a2e,
  leaf: [0x2f6b46, 0x3c7d52, 0x285c3c], trunk: 0x5a3e26, people: [0xd9a441, 0x3f78b5, 0xc0504d, 0x6b5b95, 0x4e9a7a, 0xe07b39], bus: 0x2e9d6f,
  glass: 0xa9d3f0, win: 0xffd58a, winDark: 0x2a3550, roofH: 0.38, personScale: { body: 1, head: 1 },
  box: (g, x, y, z, w, h, d, c) => g.box(x, y, z, w, h, d, c),
};
const C: Kit = {
  ground: 0x6cc08b, walk: 0xf1e3c8, avenue: 0x4a5da8, zebra: 0xffffff,
  wall: 0xfff1d6, wall2: 0xffd6a5, roof: 0xe2583e, door: 0x2b7bb9, trim: 0x6b3f22,
  leaf: [0x3fae6a, 0x5cc983, 0x34985b], trunk: 0x7a4a26, people: [0xffc93c, 0x3b8beb, 0xff6b6b, 0x9b6bff, 0x2ec4b6, 0xff9f43], bus: 0xffc93c,
  glass: 0xbde3ff, win: 0xffe08a, winDark: 0x4a5da8, roofH: 0.42, personScale: { body: 0.85, head: 1.6 },
  box: (g, x, y, z, w, h, d, c) => g.box(x, y, z, w, h, d, c),
};

register({ id: 'estilo-a', name: 'A · Maqueta suave', group: 'Estilo', approved: 'v1', catalogOnly: true,
  versions: { v1: { build: (g, r, p: Params) => corner(g, r, p.x, p.z, A, 'soft'), defaults: {}, look: 'smooth', date: STUDY,
    notes: 'Formas redondeadas, colores pastel y planos, poco detalle. Se lee muy limpio desde lejos; de cerca es más sencillo.' } } });
register({ id: 'estilo-b', name: 'B · Low-poly con detalle', group: 'Estilo', approved: 'v1', catalogOnly: true,
  versions: { v1: { build: (g, r, p: Params) => corner(g, r, p.x, p.z, B, 'rich'), defaults: {}, look: 'flat', date: STUDY,
    notes: 'Facetas visibles y más arquitectura: zócalo, cornisa, marcos y contraventanas, balcones con barandas, árboles facetados, colores más ricos. Más cercano a la Quito colonial.' } } });
register({ id: 'estilo-c', name: 'C · Diorama de juguete', group: 'Estilo', approved: 'v1', catalogOnly: true,
  versions: { v1: { build: (g, r, p: Params) => corner(g, r, p.x, p.z, C, 'toy'), defaults: {}, look: 'toon', date: STUDY,
    notes: 'Proporciones exageradas (gente con cabeza grande, ventanas grandes), colores saturados y contorno de dibujo. Muy amable y legible; más «juego» que «ciudad».' } } });

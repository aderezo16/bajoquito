import * as THREE from 'three';
import { Geo, rng } from '../engine/geo';
import { AV, F1, F2, LANES, PALETTE, R1, R2, SIDEWALK, SLAB, SLICE, SLICE_X0, SLICE_X1, STATIONS, stationX, streetX, zoneOf } from './config';
import { approved, buildModel } from '../models';
import { Geo as G, Rng } from '../engine/geo';

/** The game always uses the APPROVED version of each model (see src/models). */
const use = (id: string) => (g: G, r: Rng, p: Record<string, number | boolean>) => buildModel(approved(id), g, r, fit(id, p) as never);

/**
 * The game gives each model a lot (x, z, w, d …). Models designed in the workshop keep their own look
 * (colors, parts, added pieces); here they only adapt their size to the lot, within the limits of their settings.
 * A model with added pieces keeps the exact size it was designed at and is centered in its lot.
 */
const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
function fit(id: string, p: Record<string, number | boolean>) {
  const v = approved(id), out: Record<string, number | boolean | string> = { x: 0, z: 0, ...v.defaults, ...p };
  if (!v.settings) return out;
  const range = (k: string) => v.settings!.find(s => s.k === k && s.t === 'num') as { min: number; max: number } | undefined;
  const clampTo = (k: string, val: number) => { const s = range(k); return s ? Math.max(s.min, Math.min(s.max, val)) : undefined; };
  const sized = (wKey: string, dKey: string) => {
    const w = p.w as number | undefined, d = p.d as number | undefined;
    if (w === undefined || d === undefined) return;
    const fixed = typeof v.defaults.__extras === 'string' && v.defaults.__extras.length > 2;
    const nw = fixed ? (v.defaults[wKey] as number) : clampTo(wKey, w), nd = fixed ? (v.defaults[dKey] as number) : clampTo(dKey, d);
    if (nw !== undefined) { out[wKey] = nw; out.x = (p.x as number) + Math.max(0, (w - nw) / 2); }
    if (nd !== undefined) { out[dKey] = nd; out.z = (p.z as number) + Math.max(0, (d - nd) / 2); }
  };
  switch (id) {
    case 'casa': sized('ancho', 'fondo'); if (typeof p.h === 'number') out.alto = clampTo('alto', p.h + 0.12) ?? out.alto; if (typeof p.roof === 'number') out.techo = hex(p.roof); break;
    case 'manzana-colonial': case 'municipio': case 'concejo': case 'catedral': sized('ancho', 'fondo'); break;
    case 'arbol': { const k = (p.k as number) ?? 1; out.altura = (v.defaults.altura as number) * k; out.copa = (v.defaults.copa as number) * k; break; }
  }
  return out;
}
const catedral = (g: G, r: Rng, x: number, z: number, w: number, d: number) => use('catedral')(g, r, { x, z, w, d });
const colonialBlock = (g: G, r: Rng, x: number, z: number, w: number, d: number, h = 0.75, lit = 0.22) => use('manzana-colonial')(g, r, { x, z, w, d, h, lit });
const concejo = (g: G, r: Rng, x: number, z: number, w: number, d: number) => use('concejo')(g, r, { x, z, w, d });
const municipio = (g: G, r: Rng, x: number, z: number, w: number, d: number) => use('municipio')(g, r, { x, z, w, d });
const house = (g: G, r: Rng, x: number, z: number, w: number, d: number, h: number, wall: number, roof: number) => use('casa')(g, r, { x, z, w, d, h, wall, roof });
const tree = (g: G, r: Rng, x: number, z: number, k = 1) => use('arbol')(g, r, { x, z, k });
/** A mid-rise building from the workshop model «Edificio», sized for its lot. */
const tower = (g: G, r: Rng, x: number, z: number, colsFrente: number, colsLado: number, pisos: number, pared: string) =>
  buildModel(approved('edificio'), g, r, { ...approved('edificio').defaults, x, z, colsFrente, colsLado, pisos: Math.min(10, pisos), pared, iluminadas: 0.35 } as never);
const lamp = (g: G, x: number, z: number) => use('farol')(g, rng(1), { x, z });
const trafficPole = (g: G, x: number, z: number) => use('semaforo')(g, rng(1), { x, z });
const stationPavilion = (g: G, x: number, zc: number, broken = false) => use('estacion-superficie')(g, rng(1), { x: x - 1.55, z: 1.35, zc, broken });

export interface Place {
  id: string; name: string; kind: 'station' | 'building'; view: 'sup' | 'sub'; group: THREE.Object3D; anchor: THREE.Vector3; hit: THREE.Object3D[];
  /** Builds the place again with game-driven settings (crates in the warehouse, workers in the yard…). */
  rebuild?: (extra: Record<string, unknown>) => void;
}

export interface Crossing { x: number; heads: { car: THREE.Mesh[]; ped: THREE.Mesh[] }; offset: number }

export const MAT = {
  solid: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0, flatShading: true }),
  glow: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, color: new THREE.Color(1.12, 1.12, 1.12) }),
  hit: new THREE.MeshBasicMaterial({ visible: false }),
  red: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.35, 0.32, 0.32), toneMapped: false }),
  green: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.32, 1.3, 0.7), toneMapped: false }),
  off: new THREE.MeshBasicMaterial({ color: 0x1b2244 }),
};

/** Interactive pieces get their own material so they can light up on hover. */
function placeMats() {
  return { solid: MAT.solid.clone(), glow: MAT.glow };
}
function hitBox(x: number, y: number, z: number, w: number, h: number, d: number) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), MAT.hit);
  m.position.set(x + w / 2, y + h / 2, z + d / 2);
  return m;
}

export function buildSurface() {
  const root = new THREE.Group(); root.name = 'surface';
  const places: Place[] = [];
  const crossings: Crossing[] = [];
  const r = rng(7);
  const g = new Geo();
  const X0 = SLICE_X0, X1 = SLICE_X1, W = X1 - X0;

  // ---------- ground ----------
  g.box(X0, -0.06, SLAB.z0, W, 0.06, SLAB.z1 - SLAB.z0, PALETTE.ground);
  g.plane(X0, 0.004, R1.z0 - 0.8, W, 0.8, PALETTE.street);
  g.plane(X0, 0.004, F1.z1, W, F2.z0 - F1.z1, PALETTE.street);
  for (let i = SLICE.from; i <= SLICE.to + 1; i++) g.plane(streetX(i) - 0.32, 0.005, SLAB.z0, 0.64, SLAB.z1 - SLAB.z0, PALETTE.street);
  g.plane(X0, 0.006, R1.z1, W, AV.z0 - R1.z1, PALETTE.walk);
  g.plane(X0, 0.006, AV.z1, W, F1.z0 - AV.z1, PALETTE.walk);
  g.plane(X0, 0.007, AV.z0, W, AV.z1 - AV.z0, PALETTE.avenue);
  for (let x = X0 + 0.2; x < X1 - 0.6; x += 1.4) g.plane(x, 0.012, -0.03, 0.6, 0.06, 0x5a6aa8);
  // the line runs under the avenue: a soft blue glow strip
  g.plane(X0, 0.011, 0.5, W, 0.1, 0x3d8bff, true);
  for (let i = SLICE.from; i <= SLICE.to + 1; i++) {
    const x = streetX(i);
    for (let k = 0; k < 7; k++) g.plane(x - 0.3, 0.013, AV.z0 + 0.12 + k * 0.36, 0.6, 0.18, 0xc9d5f2);
  }

  // ---------- blocks ----------
  // Each station has its own neighbourhood: low houses in the south, the colonial centre, towers in the north.
  const lot = (i: number) => [streetX(i) + 0.42, streetX(i + 1) - 0.42] as const;
  const housesRow = (x0: number, x1: number, z0: number, z1: number, skipNear = -1) => {
    let xs = x0;
    while (xs < x1 - 0.6) {
      const ww = r.pick([1.2, 1.5, 1.8]);
      const xe = Math.min(x1, xs + ww);
      if (skipNear >= 0 && Math.abs((xs + xe) / 2 - stationX(skipNear)) < 1.8) { tree(g, r, (xs + xe) / 2, z0 + 0.8, 0.8); xs = xe; continue; }
      if (xe - xs > 0.8) house(g, r, xs, z0 + 0.3, xe - xs - 0.18, z1 - z0 - 0.55, 0.32 + r.next() * 0.14, r.pick(PALETTE.wallSouth), r.pick(PALETTE.roofSouth));
      xs = xe;
    }
  };
  const towersRow = (x0: number, x1: number, z0: number, z1: number, fl: [number, number], n = 2) => {
    const w = (x1 - x0) / n;
    for (let k = 0; k < n; k++) {
      const cf = Math.max(2, Math.min(5, Math.floor((w - 0.5) / 0.42))), cs = Math.max(2, Math.min(5, Math.floor((z1 - z0 - 0.6) / 0.42)));
      const bw = cf * 0.42 + 0.16, bd = cs * 0.42 + 0.16;
      const bx = x0 + k * w + (w - bw) / 2, bz = z1 - bd - 0.25;
      tower(g, r, bx, bz, cf, cs, Math.round(fl[0] + r.next() * (fl[1] - fl[0])), r.pick(PALETTE.towers));
    }
  };
  const park = (x0: number, w: number, z0: number, z1: number, n = 16, path = true) => {
    g.plane(x0, 0.01, z0, w, z1 - z0, 0x1c4a3e);
    if (path) g.plane(x0 + w / 2 - 0.2, 0.014, z0, 0.4, z1 - z0, 0x3a4c78);
    for (let k = 0; k < n; k++) {
      const tx = x0 + 0.35 + r.next() * (w - 0.7), tz = z0 + 0.35 + r.next() * (z1 - z0 - 0.7);
      if (path && Math.abs(tx - (x0 + w / 2)) < 0.45) continue;
      if (tz > F1.z1 - 0.2 && tz < F2.z0 + 0.2) continue;
      tree(g, r, tx, tz, 0.75 + r.next() * 0.3);
    }
  };
  for (let i = SLICE.from; i <= SLICE.to; i++) {
    const [x0, x1] = lot(i);
    const w = x1 - x0, z = zoneOf(i);
    // back rows
    if (i === 0) {
      housesRow(x0, x1, R2.z0, R2.z1);                       // terminal goes in R1 (interactive, below)
    } else if (z === 'sur') {
      housesRow(x0, x1, R1.z0, R1.z1); housesRow(x0, x1, R2.z0, R2.z1);
      if (i === 4) towersRow(x0, x1, R2.z0, R2.z1, [2, 3], 1);
    } else if (i === 5) {
      catedral(g, r, x0 + 0.5, R1.z0 + 0.5, w - 1.0, R1.z1 - R1.z0 - 0.8);
      colonialBlock(g, r, x0, R2.z0, w, R2.z1 - R2.z0, 0.8, 0.12);
    } else if (i === 6) {
      // Plaza Grande
      g.plane(x0, 0.01, R1.z0, w, R1.z1 - R1.z0, 0x2c3a78);
      g.plane(x0 + 0.6, 0.016, R1.z0 + 0.6, w - 1.2, R1.z1 - R1.z0 - 1.2, 0x22584a);
      g.cyl(x0 + w / 2, 0, (R1.z0 + R1.z1) / 2, 0.7, 0.08, 0x9aa6c4, 20);
      g.cyl(x0 + w / 2, 0.02, (R1.z0 + R1.z1) / 2, 0.6, 0.07, 0x6fb7ff, 20, true);
      g.cyl(x0 + w / 2, 0, (R1.z0 + R1.z1) / 2, 0.12, 1.1, 0xe6e0d2, 8);
      g.sphere(x0 + w / 2, 1.18, (R1.z0 + R1.z1) / 2, 0.11, 0xffc857, 8);
      for (const [tx, tz] of [[0.9, 0.9], [w - 0.9, 0.9], [0.9, R1.z1 - R1.z0 - 0.9], [w - 0.9, R1.z1 - R1.z0 - 0.9]]) tree(g, r, x0 + tx, R1.z0 + tz, 0.85);
      for (let k = 0; k < 4; k++) g.box(x0 + 1.2 + k * 0.9, 0, R1.z1 - 0.5, 0.45, 0.12, 0.14, 0x6b4a2e);
    } else if (z === 'centro') {
      // at Alameda the back row belongs to the Concejo (built as an interactive place below)
      if (i !== 7) colonialBlock(g, r, x0, R1.z0, w, R1.z1 - R1.z0, 0.75, 0.22);
      colonialBlock(g, r, x0, R2.z0, w, R2.z1 - R2.z0, 0.8, 0.12);
    } else {
      const tall: [number, number] = i === 12 || i === 13 ? [7, 10] : i === 9 ? [3, 5] : [4, 8];
      if (i !== 11) towersRow(x0, x1, R1.z0, R1.z1, tall); else towersRow(x0 + w * 0.5, x1, R1.z0, R1.z1, tall, 1);
      towersRow(x0, x1, R2.z0, R2.z1, [tall[0] + 1, tall[1] + 1]);
    }
    // front rows (kept low so the avenue stays visible)
    if (i === 7 || i === 8 || i === 11) park(x0, w, F1.z0, F2.z1, i === 11 ? 22 : 16, i !== 11);
    else if (z === 'norte' && i !== 14) { towersRow(x0, x1, F1.z0, F1.z1, [2, 3]); housesRow(x0, x1, F2.z0, F2.z1); }
    else { housesRow(x0, x1, F1.z0, F1.z1, i); housesRow(x0, x1, F2.z0, F2.z1); }
    // sidewalk trees and lamps (never in front of the plaza)
    if (i !== 6) for (const tx of [x0 + 0.6, x1 - 0.6]) tree(g, r, tx, SIDEWALK.back - 0.25, 0.85);
    lamp(g, x0 + 0.3, SIDEWALK.front + 0.6);
    lamp(g, x1 - 0.3, SIDEWALK.back + 0.35);
  }
  const decor = g.build(MAT.solid, MAT.glow, 'decor');
  root.add(decor);

  // ---------- interactive buildings ----------
  const addPlace = (id: string, name: string, kind: Place['kind'], build: (pg: Geo, extra: Record<string, unknown>) => void, hit: THREE.Mesh[], anchor: THREE.Vector3) => {
    const m = placeMats();
    const grp = new THREE.Group(); grp.name = id;
    const fill = (extra: Record<string, unknown>) => {
      for (const c of [...grp.children]) if (!hit.includes(c as THREE.Mesh)) { grp.remove(c); c.traverse(o => (o as THREE.Mesh).geometry?.dispose()); }
      const pg = new Geo(); build(pg, extra);
      const built = pg.build(m.solid, m.glow, id);
      for (const c of [...built.children]) grp.add(c);
    };
    fill({});
    hit.forEach(h => { h.userData.place = id; grp.add(h); });
    grp.userData.place = id;
    root.add(grp);
    places.push({ id, name, kind, view: 'sup', group: grp, anchor, hit, rebuild: fill });
  };
  {
    const [x0, x1] = lot(6);
    const mx0 = x0 + 0.3, mx1 = x1 - 0.3, mz0 = R2.z0 + 1.0, mz1 = R2.z1 - 0.2;
    addPlace('municipio', 'Municipio', 'building', pg => municipio(pg, rng(3), mx0, mz0, mx1 - mx0, mz1 - mz0), [hitBox(mx0, 0, mz0, mx1 - mx0, 2.0, mz1 - mz0)], new THREE.Vector3((mx0 + mx1) / 2, 3.0, (mz0 + mz1) / 2));
  }
  {
    const [x0, x1] = lot(7);
    const kx0 = x0 + 0.3, kx1 = x1 - 0.6, kz0 = R1.z0 + 0.3, kz1 = R1.z1 - 0.6;
    addPlace('concejo', 'Concejo Metropolitano', 'building', pg => concejo(pg, rng(4), kx0, kz0, kx1 - kx0, kz1 - kz0), [hitBox(kx0, 0, kz0, kx1 - kx0, 1.9, kz1 - kz0 + 0.3)], new THREE.Vector3((kx0 + kx1) / 2, 2.4, (kz0 + kz1) / 2));
  }
  {
    // Medios: the TV tower next to Parque La Carolina
    const [x0, x1] = lot(11);
    const v = approved('medios'), w = v.defaults.ancho as number, d = v.defaults.fondo as number, h = (v.defaults.pisos as number) * 0.4 + 0.2;
    const mx = x0 + ((x1 - x0) / 2 - w) / 2, mz = R1.z1 - d - 0.45;
    addPlace('medios', 'Medios', 'building', (pg, e) => use('medios')(pg, rng(6), { x: mx, z: mz, ...(e as Record<string, number>) }), [hitBox(mx - 0.1, 0, mz - 0.1, w + 0.2, h, d + 0.5)], new THREE.Vector3(mx + w / 2, h + 1.2, mz + d / 2));
  }
  {
    // Terminal de buses at Quitumbe, the south end of the line
    const [x0, x1] = lot(0);
    const v = approved('terminal'), w = v.defaults.ancho as number, d = v.defaults.fondo as number;
    const tx = x0 + (x1 - x0 - w) / 2, tz = R1.z0 + (R1.z1 - R1.z0 - d) / 2;
    addPlace('terminal', 'Terminal de buses', 'building', (pg, e) => use('terminal')(pg, rng(8), { x: tx, z: tz, ...(e as Record<string, number>) }), [hitBox(tx, 0, tz, w, 1.5, d)], new THREE.Vector3(tx + w / 2, 2.0, tz + d / 2));
  }
  for (let i = SLICE.from; i <= SLICE.to; i++) {
    const x = stationX(i);
    addPlace(`st${i}`, STATIONS[i], 'station', (pg, e) => stationPavilion(pg, x, 2.15, !!e.broken), [hitBox(x - 1.55, 0, AV.z1, 3.1, 1.4, 2.2)], new THREE.Vector3(x, 1.45, 2.15));
  }

  // ---------- traffic lights (live) ----------
  const headGeo = new THREE.SphereGeometry(0.035, 8, 6);
  for (let i = SLICE.from; i <= SLICE.to + 1; i++) {
    const x = streetX(i);
    const cg = new Geo();
    const heads = { car: [] as THREE.Mesh[], ped: [] as THREE.Mesh[] };
    for (const [px, pz] of [[-0.42, AV.z0 - 0.15], [0.42, AV.z1 + 0.15]]) {
      trafficPole(cg, x + px, pz);
      const car = new THREE.Mesh(headGeo, MAT.green); car.position.set(x + px, 0.64, pz + 0.035);
      const ped = new THREE.Mesh(headGeo, MAT.red); ped.position.set(x + px, 0.55, pz + 0.035);
      root.add(car, ped); heads.car.push(car); heads.ped.push(ped);
    }
    root.add(cg.build(MAT.solid, MAT.glow, 'signals'));
    crossings.push({ x, heads, offset: (i * 5.3) % 16 });
  }

  // lane markers exported for the bus system
  root.userData.lanes = LANES;
  return { root, places, crossings, decor };
}


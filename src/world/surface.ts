import * as THREE from 'three';
import { Geo, rng } from '../engine/geo';
import { AV, F1, F2, LANES, PALETTE, R1, R2, SIDEWALK, SLAB, SLICE, SLICE_X0, SLICE_X1, STATIONS, stationX, streetX } from './config';
import { catedral, colonialBlock, concejo, house, lamp, municipio, stationPavilion, trafficPole, tree } from './models';

export interface Place { id: string; name: string; kind: 'station' | 'building'; view: 'sup' | 'sub'; group: THREE.Object3D; anchor: THREE.Vector3; hit: THREE.Object3D[] }

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
  const lot = (i: number) => [streetX(i) + 0.42, streetX(i + 1) - 0.42] as const;
  for (let i = SLICE.from; i <= SLICE.to; i++) {
    const [x0, x1] = lot(i);
    const w = x1 - x0;
    // back rows
    if (i === 5) {
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
    } else {
      colonialBlock(g, r, x0, R1.z0, w, R1.z1 - R1.z0, 0.75, 0.22);
      colonialBlock(g, r, x0, R2.z0, w, R2.z1 - R2.z0, 0.8, 0.12);
    }
    // front rows: low houses (never taller than the avenue needs)
    if (i === 7) {
      // Alameda park
      g.plane(x0, 0.01, F1.z0, w, F2.z1 - F1.z0, 0x1c4a3e);
      g.plane(x0 + w / 2 - 0.2, 0.014, F1.z0, 0.4, F2.z1 - F1.z0, 0x3a4c78);
      for (let k = 0; k < 16; k++) {
        const tx = x0 + 0.35 + r.next() * (w - 0.7), tz = F1.z0 + 0.35 + r.next() * (F2.z1 - F1.z0 - 0.7);
        if (Math.abs(tx - (x0 + w / 2)) < 0.45 || (tz > F1.z1 - 0.2 && tz < F2.z0 + 0.2)) continue;
        tree(g, r, tx, tz, 0.75 + r.next() * 0.3);
      }
    } else {
      for (const [z0, z1] of [[F1.z0, F1.z1], [F2.z0, F2.z1]] as const) {
        let xs = x0;
        while (xs < x1 - 0.6) {
          const ww = r.pick([1.2, 1.5, 1.8]);
          const xe = Math.min(x1, xs + ww);
          if (z0 === F1.z0 && Math.abs((xs + xe) / 2 - stationX(i)) < 1.8) { tree(g, r, (xs + xe) / 2, z0 + 0.8, 0.8); xs = xe; continue; }
          house(g, r, xs, z0 + 0.3, xe - xs - 0.18, z1 - z0 - 0.55, 0.38, PALETTE.wallColonial, r.pick(PALETTE.roofSouth));
          xs = xe;
        }
      }
    }
    // sidewalk trees and lamps (never in front of the plaza)
    if (i !== 6) for (const tx of [x0 + 0.6, x1 - 0.6]) tree(g, r, tx, SIDEWALK.back - 0.25, 0.85);
    lamp(g, x0 + 0.3, SIDEWALK.front + 0.6);
    lamp(g, x1 - 0.3, SIDEWALK.back + 0.35);
  }

  const decor = g.build(MAT.solid, MAT.glow, 'decor');
  root.add(decor);

  // ---------- interactive buildings ----------
  const addPlace = (id: string, name: string, kind: Place['kind'], build: (pg: Geo) => void, hit: THREE.Mesh[], anchor: THREE.Vector3) => {
    const pg = new Geo(); build(pg);
    const m = placeMats();
    const grp = pg.build(m.solid, m.glow, id);
    hit.forEach(h => { h.userData.place = id; grp.add(h); });
    grp.userData.place = id;
    root.add(grp);
    places.push({ id, name, kind, view: 'sup', group: grp, anchor, hit });
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
  for (let i = SLICE.from; i <= SLICE.to; i++) {
    const x = stationX(i);
    addPlace(`st${i}`, STATIONS[i], 'station', pg => stationPavilion(pg, x, 2.15), [hitBox(x - 1.55, 0, AV.z1, 3.1, 1.4, 2.2)], new THREE.Vector3(x, 1.45, 2.15));
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


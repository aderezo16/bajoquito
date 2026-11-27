import * as THREE from 'three';
import { Geo, rng } from '../engine/geo';
import { SLAB, SLICE, SLICE_X0, SLICE_X1, STATIONS, TRACKS, TUNNEL_Y, stationX, streetX } from './config';
import { MAT, Place } from './surface';
import { approved } from '../models';

const Y = TUNNEL_Y;
/** Own materials so the surface can fade out without touching the underground. */
export const SUBMAT = { solid: MAT.solid.clone(), glow: MAT.glow.clone() };

function label(text: string, w: number, h: number, bg = '#173E86', fg = '#E4ECFF') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = Math.round(512 * h / w);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = fg; ctx.font = `700 ${Math.round(c.height * 0.5)}px Sora, Inter, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), c.width / 2, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
}

export function buildUnderground() {
  const root = new THREE.Group(); root.name = 'underground';
  const places: Place[] = [];
  const g = new Geo();
  const r = rng(5);
  const X0 = SLICE_X0, X1 = SLICE_X1, W = X1 - X0;
  const D = SLAB.depth;

  // ---------- earth: cut faces of the slab (front and right) with strata ----------
  const strata: [number, number, number][] = [[0, 0.45, 0x5a4a6e], [0.45, 1.3, 0x4a3b62], [1.3, 2.4, 0x5b4660], [2.4, D, 0x342a4e]];
  for (const [a, b, c] of strata) g.box(X0, -b, SLAB.z1 - 0.02, W, b - a, 0.04, c);
  // right face with the tunnel opening
  for (const [a, b, c] of strata) {
    const s = new THREE.Shape();
    s.moveTo(SLAB.z0, -b); s.lineTo(SLAB.z1, -b); s.lineTo(SLAB.z1, -a); s.lineTo(SLAB.z0, -a); s.closePath();
    const hole = new THREE.Path();
    const t0 = -1.45, t1 = 1.45, y0 = Y, y1 = Y + 1.5;
    if (-b < y1 && -a > y0) {
      hole.moveTo(t0, Math.max(y0, -b)); hole.lineTo(t0, Math.min(y1, -a)); hole.lineTo(t1, Math.min(y1, -a)); hole.lineTo(t1, Math.max(y0, -b)); hole.closePath();
      s.holes.push(hole);
    }
    const geo = new THREE.ShapeGeometry(s);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: c, roughness: 1, side: THREE.DoubleSide }));
    m.rotation.y = Math.PI / 2; m.position.x = X1;
    // ShapeGeometry lies in x–y; after rotation its x becomes −z, so mirror it
    m.scale.x = -1;
    root.add(m);
  }
  g.box(X0, -D - 0.05, SLAB.z0, W, 0.05, SLAB.z1 - SLAB.z0, 0x0d0b20);           // bottom
  g.plane(X0, Y - 0.005, SLAB.z0 + 1.5, W, SLAB.z1 - SLAB.z0 - 1.6, 0x110f27);     // dug floor
  for (let k = 0; k < 120; k++) g.box(X0 + r.next() * W, Y, SLAB.z0 + 2 + r.next() * (SLAB.z1 - SLAB.z0 - 3), 0.05 + r.next() * 0.1, 0.02, 0.04 + r.next() * 0.08, 0x3a3158);

  // ---------- tunnel ----------
  g.plane(X0, Y, -1.4, W, 2.8, 0x1a1f4c);
  g.box(X0, Y, -1.5, W, 1.45, 0.1, 0x171c46);
  for (let x = X0 + 0.3; x < X1; x += 0.8) g.sphere(x, Y + 1.1, -1.38, 0.025, 0xffe3a0, 5, true);
  for (const tz of [TRACKS.east, TRACKS.west]) {
    for (let x = X0 + 0.1; x < X1; x += 0.42) g.box(x, Y + 0.005, tz - 0.32, 0.12, 0.03, 0.64, 0x2f3770);
    for (const dz of [-0.2, 0.2]) g.box(X0, Y + 0.035, tz + dz - 0.015, W, 0.035, 0.03, 0x8090c0);
  }
  g.plane(X0, Y + 0.006, -0.04, W, 0.08, 0x3d8bff, true);

  const decor = g.build(SUBMAT.solid, SUBMAT.glow, 'tunnel');
  root.add(decor);

  // ---------- stations ----------
  for (let i = SLICE.from; i <= SLICE.to; i++) {
    const x = stationX(i);
    const pg = new Geo();
    approved('estacion-subterranea').build(pg, rng(i), { x: x - 2.6, z: 0, y: Y, broken: i === 2, withTrack: false });
    const grp = pg.build(SUBMAT.solid.clone(), SUBMAT.glow, `st${i}-sub`);
    const sign = label(STATIONS[i], 2.4, 0.42);
    sign.position.set(x - 0.1, Y + 2.45, -4.28);
    grp.add(sign);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.0, 7.2), MAT.hit);
    hit.position.set(x - 0.25, Y + 1.5, -0.8); hit.userData.place = `st${i}`;
    grp.add(hit); grp.userData.place = `st${i}`;
    root.add(grp);
    places.push({ id: `st${i}`, name: STATIONS[i], kind: 'station', view: 'sub', group: grp, anchor: new THREE.Vector3(x - 0.2, Y + 3.25, -4.3), hit: [hit] });
    const lamp = new THREE.PointLight(0xffd9a0, 6, 6, 1.6);
    lamp.position.set(x, Y + 1.6, -1.6); root.add(lamp);
  }

  // ---------- bodega (warehouse) in the front zone ----------
  {
    const bx0 = streetX(SLICE.from) + 0.6, bx1 = streetX(SLICE.from + 2) - 0.4, bz0 = 4.9, bz1 = 9.4;
    const pg = new Geo();
    approved('bodega').build(pg, rng(2), { x: bx0, z: bz0, w: bx1 - bx0, d: bz1 - bz0, y: Y });
    const grp = pg.build(SUBMAT.solid.clone(), SUBMAT.glow, 'bodega');
    const hit = new THREE.Mesh(new THREE.BoxGeometry(bx1 - bx0, 1.8, bz1 - bz0), MAT.hit);
    hit.position.set((bx0 + bx1) / 2, Y + 0.9, (bz0 + bz1) / 2); hit.userData.place = 'bodega';
    grp.add(hit); grp.userData.place = 'bodega';
    root.add(grp);
    places.push({ id: 'bodega', name: 'Bodega', kind: 'building', view: 'sub', group: grp, anchor: new THREE.Vector3((bx0 + bx1) / 2, Y + 2.2, bz0 + 1.5), hit: [hit] });
    const l = new THREE.PointLight(0xffe3a0, 3.5, 8, 1.2); l.position.set((bx0 + bx1) / 2, Y + 2.6, (bz0 + bz1) / 2); root.add(l);
  }
  return { root, places };
}

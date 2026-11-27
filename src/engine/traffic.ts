import * as THREE from 'three';
import { Geo, rng } from './geo';
import { approved } from '../models';
import { LANES, PALETTE, SLICE, SLICE_X0, SLICE_X1, TRACKS, TUNNEL_Y, stationX } from '../world/config';
import { Crossing, MAT } from '../world/surface';

/** Vehicles are cut cleanly at the edges of the city slice, as in a scale model. */
export const CLIP = [new THREE.Plane(new THREE.Vector3(1, 0, 0), -SLICE_X0), new THREE.Plane(new THREE.Vector3(-1, 0, 0), SLICE_X1)];
const clipSolid = MAT.solid.clone(); clipSolid.clippingPlanes = CLIP;
const clipGlow = MAT.glow.clone(); clipGlow.clippingPlanes = CLIP;
const trainSolid = MAT.solid.clone(); trainSolid.clippingPlanes = CLIP;
const trainGlow = MAT.glow.clone(); trainGlow.clippingPlanes = CLIP;
export const BUS_MATS = [clipSolid, clipGlow];

// ---------- traffic lights ----------
export const SIGNAL_PERIOD = 18, CAR_GREEN = 9;
export function phaseAt(c: Crossing, t: number) { return (t + c.offset) % SIGNAL_PERIOD; }
/** Pedestrians may start crossing only with enough green left to finish. */
export function pedCanCross(c: Crossing, t: number) { const p = phaseAt(c, t); return p > CAR_GREEN + 0.4 && p < SIGNAL_PERIOD - 6.4; }
export function carsMayPass(c: Crossing, t: number) { return phaseAt(c, t) < CAR_GREEN; }
export function updateSignals(cs: Crossing[], t: number) {
  for (const c of cs) {
    const cars = carsMayPass(c, t), peds = !cars && phaseAt(c, t) < SIGNAL_PERIOD - 0.6;
    c.heads.car.forEach(h => (h.material = cars ? MAT.green : MAT.red));
    c.heads.ped.forEach(h => (h.material = peds ? MAT.green : MAT.red));
  }
}

// ---------- buses ----------
function busMesh(color: number) {
  const g = new Geo();
  approved('bus').build(g, rng(1), { x: -0.8, z: -0.28, color });       // centred on the origin
  return g.build(clipSolid, clipGlow, 'bus');
}

interface Vehicle { mesh: THREE.Object3D; x: number; v: number; dir: 1 | -1; lane: number; len: number; dwell: number; stopAt?: number; done?: Set<number> }

export class Buses {
  readonly group = new THREE.Group();
  private list: Vehicle[] = [];
  private nextSpawn = { 1: 0, [-1]: 3 } as Record<string, number>;
  private colorK = 0;
  /** `occupied(x)` tells whether someone is still on the crossing at x. */
  constructor(private crossings: Crossing[], private occupied: (x: number) => boolean = () => false) {}

  update(dt: number, t: number) {
    for (const dir of [1, -1] as const) {
      if (t >= this.nextSpawn[dir]) {
        const x = dir === 1 ? SLICE_X0 - 1.2 : SLICE_X1 + 1.2;
        const clear = this.list.every(b => b.dir !== dir || Math.abs(b.x - x) > 3);
        if (clear) {
          const mesh = busMesh(PALETTE.bus[this.colorK++ % PALETTE.bus.length]);
          if (dir === -1) mesh.rotation.y = Math.PI;
          this.group.add(mesh);
          this.list.push({ mesh, x, v: 1.6, dir, lane: dir === 1 ? LANES.east : LANES.west, len: 1.6, dwell: 0 });
          this.nextSpawn[dir] = t + 7 + Math.random() * 6;
        }
      }
    }
    for (const b of this.list) {
      const front = b.x + b.dir * b.len / 2;
      // stop line before a crossing with red for cars
      let limit = Infinity;
      for (const c of this.crossings) {
        const stopX = c.x - b.dir * 0.55;
        const ahead = (stopX - front) * b.dir;
        if (ahead > -0.05 && ahead < 2.2 && (!carsMayPass(c, t) || this.occupied(c.x))) limit = Math.min(limit, ahead);
      }
      // keep distance to the bus ahead
      for (const o of this.list) {
        if (o === b || o.dir !== b.dir) continue;
        const gap = (o.x - b.x) * b.dir - (o.len + b.len) / 2;
        if (gap > -0.1) limit = Math.min(limit, gap - 0.35);
      }
      const vmax = 1.7;
      const target = limit === Infinity ? vmax : Math.max(0, Math.min(vmax, Math.sqrt(Math.max(0, 2 * 1.6 * limit))));
      b.v += Math.sign(target - b.v) * Math.min(Math.abs(target - b.v), (target < b.v ? 3.2 : 1.2) * dt);
      b.x += b.dir * b.v * dt;
      b.mesh.position.set(b.x, 0, b.lane);
    }
    this.list = this.list.filter(b => {
      const out = b.dir === 1 ? b.x > SLICE_X1 + 1.5 : b.x < SLICE_X0 - 1.5;
      if (out) { this.group.remove(b.mesh); b.mesh.traverse(o => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose(); }); }
      return !out;
    });
  }
}

// ---------- metro trains ----------
function trainMesh() {
  const g = new Geo();
  approved('tren').build(g, rng(1), { x: -(1.72 + 0.04), z: -0.3 });   // centred on the origin
  return g.build(trainSolid, trainGlow, 'train');
}

export interface TrainState { dir: 1 | -1; x: number; dwellingAt: number | null; }

export class Trains {
  readonly group = new THREE.Group();
  readonly list: (Vehicle & { state: TrainState })[] = [];
  private nextSpawn = { 1: 1, [-1]: 8 } as Record<string, number>;
  onArrive: (station: number, dir: 1 | -1) => void = () => {};

  update(dt: number, t: number) {
    for (const dir of [1, -1] as const) {
      if (t >= this.nextSpawn[dir] && !this.list.some(v => v.dir === dir)) {
        const mesh = trainMesh();
        if (dir === -1) mesh.rotation.y = Math.PI;
        this.group.add(mesh);
        const x = dir === 1 ? SLICE_X0 - 2.5 : SLICE_X1 + 2.5;
        this.list.push({ mesh, x, v: 2.6, dir, lane: dir === 1 ? TRACKS.east : TRACKS.west, len: 3.5, dwell: 0, done: new Set(), state: { dir, x, dwellingAt: null } });
        this.nextSpawn[dir] = t + 16;
      }
    }
    for (const tr of this.list) {
      if (tr.dwell > 0) {
        tr.dwell -= dt;
        if (tr.dwell <= 0) { tr.state.dwellingAt = null; }
      } else {
        // next station ahead that it has not served yet
        let stop: number | undefined;
        for (let i = SLICE.from; i <= SLICE.to; i++) {
          const sx = stationX(i);
          if ((sx - tr.x) * tr.dir >= -0.01 && !tr.done!.has(i) && (stop === undefined || Math.abs(sx - tr.x) < Math.abs(stop - tr.x))) stop = sx;
        }
        const dist = stop === undefined ? Infinity : Math.abs(stop - tr.x);
        const vmax = 2.8, dec = 1.4;
        const target = Math.min(vmax, Math.sqrt(2 * dec * dist));
        tr.v += Math.sign(target - tr.v) * Math.min(Math.abs(target - tr.v), (target < tr.v ? dec * 1.6 : 1.0) * dt);
        tr.x += tr.dir * Math.min(tr.v * dt, dist);
        if (stop !== undefined && Math.abs(stop - tr.x) < 0.01 && tr.v < 0.25) {
          const i = SLICE.from + Math.round((stop - stationX(SLICE.from)) / (stationX(1) - stationX(0)));
          tr.done!.add(i); tr.dwell = 5.5; tr.v = 0; tr.state.dwellingAt = i;
          this.onArrive(i, tr.dir);
        }
      }
      tr.state.x = tr.x;
      tr.mesh.position.set(tr.x, TUNNEL_Y + 0.02, tr.lane);
    }
    for (let k = this.list.length - 1; k >= 0; k--) {
      const tr = this.list[k];
      if (tr.dir === 1 ? tr.x > SLICE_X1 + 3 : tr.x < SLICE_X0 - 3) { this.group.remove(tr.mesh); this.list.splice(k, 1); }
    }
  }
  dwelling(i: number, dir: 1 | -1) { return this.list.some(t => t.dir === dir && t.state.dwellingAt === i); }
}

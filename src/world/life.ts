import * as THREE from 'three';
import { Crowd, Step } from '../engine/crowd';
import { pedCanCross } from '../engine/traffic';
import { Trains } from '../engine/traffic';
import { AV, Mood, R1, SLICE, TUNNEL_Y, stationX, streetX } from './config';
import { Crossing } from './surface';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
const MOODS: Mood[] = ['h', 'h', 'h', 'n'];

/**
 * Surface pedestrians. Every route uses only sidewalks, crossings (with the light) and station mouths,
 * so nobody walks through houses or buses.
 */
export class SurfaceLife {
  private next = 0;
  constructor(private crowd: Crowd, private crossings: Crossing[], private clock: { t: number }) {
    for (let k = 0; k < 40; k++) this.spawn(true);
    this.plazaPeople();
  }
  private stations() { const s: number[] = []; for (let i = SLICE.from; i <= SLICE.to; i++) s.push(i); return s; }
  private doors() {
    const d: number[] = [];
    for (let i = SLICE.from; i <= SLICE.to; i++) { const c = (streetX(i) + streetX(i + 1)) / 2; d.push(c - 1.4, c, c + 1.4); }
    return d;
  }
  private crossingFor(a: number, b: number) {
    let best = this.crossings[0], bd = Infinity;
    for (const c of this.crossings) { const d = Math.abs(a - c.x) + Math.abs(c.x - b); if (d < bd) { bd = d; best = c; } }
    return best;
  }
  /** Back sidewalk → crossing (waits for green) → front sidewalk, or the reverse. */
  private cross(c: Crossing, northToSouth: boolean): Step[] {
    const lane = c.x + (northToSouth ? -0.12 : 0.12);
    const zA = northToSouth ? AV.z0 - 0.2 : AV.z1 + 0.2, zB = northToSouth ? AV.z1 + 0.2 : AV.z0 - 0.2;
    return [{ to: V(lane, 0, zA) }, { wait: () => pedCanCross(c, this.clock.t) }, { to: V(lane, 0, zB), fast: true } as Step];
  }
  private mouthIn(i: number): Step[] { const x = stationX(i); return [{ to: V(x + (Math.random() - 0.5) * 0.5, 0, 1.72) }, { to: V(x, -0.32, 2.4) }, { vanish: true }]; }
  private mouthOut(i: number): Step[] { const x = stationX(i); return [{ appear: true }, { to: V(x + (Math.random() - 0.5) * 0.5, 0, 1.72) }]; }

  spawn(initial = false) {
    const r = Math.random();
    const st = pick(this.stations());
    const door = pick(this.doors());
    const mood = pick(MOODS), face = Math.random() < 0.35;
    const front = 1.78, back = -1.95;
    let start: THREE.Vector3, route: Step[];
    if (r < 0.42) {                                         // from a house door on the back row to the metro
      const c = this.crossingFor(door, stationX(st));
      start = V(door, 0, R1.z1 - 0.05);
      route = [{ appear: true }, { to: V(door, 0, back) }, { to: V(c.x + 0.12, 0, back) }, ...this.cross(c, true), { to: V(stationX(st), 0, front) }, ...this.mouthIn(st)];
    } else if (r < 0.62) {                                  // up a front street to the metro
      const sx = streetX(SLICE.from + Math.floor(Math.random() * (SLICE.to - SLICE.from + 2))) + 0.14;
      start = V(sx, 0, 6.7);
      route = [{ appear: true }, { to: V(sx, 0, front) }, { to: V(stationX(st), 0, front) }, ...this.mouthIn(st)];
    } else if (r < 0.88) {                                  // coming out of the metro, going home
      const c = this.crossingFor(stationX(st), door);
      start = V(stationX(st), -0.32, 2.4);
      route = [...this.mouthOut(st), { to: V(c.x - 0.12, 0, front) }, ...this.cross(c, false), { to: V(door, 0, back) }, { to: V(door, 0, R1.z1 - 0.05) }, { vanish: true }];
    } else {                                                // a walk along the back sidewalk
      const d2 = pick(this.doors());
      start = V(door, 0, R1.z1 - 0.05);
      route = [{ appear: true }, { to: V(door, 0, back - 0.1) }, { to: V(d2, 0, back - 0.1) }, { to: V(d2, 0, R1.z1 - 0.05) }, { vanish: true }];
    }
    const a = this.crowd.spawn(start, route, { mood, face, tag: 'sup' });
    if (a && initial) {                                     // start the scene with people already on their way
      const steps = Math.floor(Math.random() * 3);
      for (let k = 0; k < steps && a.i < route.length; k++) { const s = route[a.i]; if ('to' in s) a.pos.copy(s.to); a.i++; if ('appear' in s) a.scale = 1; }
      if ('appear' in (route[0] ?? {})) a.scale = 1;
    }
  }
  private plazaPeople() {
    const x0 = streetX(6) + 0.42, x1 = streetX(7) - 0.42;
    for (let k = 0; k < 7; k++) {
      const p = () => V(x0 + 0.8 + Math.random() * (x1 - x0 - 1.6), 0, R1.z0 + 0.8 + Math.random() * (R1.z1 - R1.z0 - 1.6));
      const route: Step[] = [];
      for (let j = 0; j < 30; j++) route.push({ to: p() }, { stand: 3 + Math.random() * 8 });
      this.crowd.spawn(p(), route, { mood: 'h', face: k % 2 === 0, speed: 0.25, tag: 'plaza' });
    }
  }
  update() {
    if (this.clock.t > this.next) {
      const alive = this.crowd.agents.filter(a => a.alive && a.tag === 'sup').length;
      if (alive < 55) this.spawn();
      this.next = this.clock.t + 0.35;
    }
  }
}

/** Underground: people come down the escalator, wait behind the yellow line, board when a train stops; others get off. */
export class UndergroundLife {
  private next = 0;
  constructor(private crowd: Crowd, private trains: Trains, private clock: { t: number }) {
    const Y = TUNNEL_Y + 0.22;
    for (let i = SLICE.from; i <= SLICE.to; i++) for (let k = 0; k < 5; k++) { this.waiter(i, 'back', true); if (k < 4) this.waiter(i, 'front', true); }
    trains.onArrive = (i, dir) => this.alight(i, dir);
    // warehouse workers
    const bx = streetX(SLICE.from) + 1.2;
    for (let k = 0; k < 3; k++) {
      const route: Step[] = [];
      for (let j = 0; j < 40; j++) route.push({ to: V(bx + Math.random() * 7, TUNNEL_Y, 5.6 + Math.floor(Math.random() * 3) * 1.35 + 0.15) }, { stand: 2 + Math.random() * 4 });
      this.crowd.spawn(V(bx + k * 2, TUNNEL_Y, 6.2), route, { color: 0xff6b2c, speed: 0.3, tag: 'worker' });
    }
    void Y;
  }
  private slot(i: number, side: 'back' | 'front') {
    const x = stationX(i);
    let sx = x - 1.6 + Math.random() * 3.3;
    if (side === 'back' && sx > x - 1.0 && sx < x - 0.55) sx += 0.6;
    const z = side === 'back' ? -1.65 - Math.random() * 0.6 : 1.65 + Math.random() * 0.6;
    return V(sx, TUNNEL_Y + 0.22, z);
  }
  waiter(i: number, side: 'back' | 'front', initial = false) {
    const x = stationX(i), Y = TUNNEL_Y;
    const dir: 1 | -1 = side === 'back' ? 1 : -1;
    const s = this.slot(i, side);
    const board = V(s.x, Y + 0.22, side === 'back' ? -1.42 : 1.42);
    const pre: Step[] = side === 'back'
      ? [{ appear: true }, { to: V(x - 2.1, Y + 2.04, -2.4) }, { to: V(x - 0.8, Y + 0.24, -2.4) }]
      : [{ appear: true }];
    const start = side === 'back' ? V(x - 2.4, Y + 2.04, -3.5) : V(x + 1.95, Y + 0.22, 2.05);
    const route: Step[] = [...(initial ? [] : pre), { to: s }, { hold: () => !this.trains.dwelling(i, dir) }, { to: board }, { vanish: true }];
    const mood: Mood = Math.random() < 0.8 ? 'h' : 'n';
    this.crowd.spawn(initial ? s : start, route, { mood, face: Math.random() < 0.4, tag: `w${i}${side}` });
  }
  alight(i: number, dir: 1 | -1) {
    const x = stationX(i), Y = TUNNEL_Y;
    const n = 2 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) {
      const dx = x - 1.4 + Math.random() * 2.8;
      if (dir === 1) {
        this.crowd.spawn(V(dx, Y + 0.22, -1.42), [{ appear: true }, { to: V(x - 0.8, Y + 0.24, -2.25) }, { to: V(x - 2.0, Y + 1.95, -2.25) }, { to: V(x - 2.4, Y + 2.04, -3.5) }, { vanish: true }], { mood: 'h', tag: 'off' });
      } else {
        this.crowd.spawn(V(dx, Y + 0.22, 1.42), [{ appear: true }, { to: V(x + 1.95, Y + 0.22, 2.05) }, { vanish: true }], { mood: 'h', tag: 'off' });
      }
    }
  }
  update() {
    if (this.clock.t < this.next) return;
    this.next = this.clock.t + 0.8;
    for (let i = SLICE.from; i <= SLICE.to; i++) for (const side of ['back', 'front'] as const) {
      const n = this.crowd.agents.filter(a => a.alive && a.tag === `w${i}${side}`).length;
      if (n < (side === 'back' ? 6 : 4) && Math.random() < 0.5) this.waiter(i, side);
    }
  }
}

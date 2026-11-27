import * as THREE from 'three';
import { Mood, MOOD_COLOR, PALETTE } from '../world/config';

/** One step of a route. People only ever walk along routes built from these. */
export type Step =
  | { to: THREE.Vector3; fast?: boolean }
  | { wait: () => boolean }                 // stand until the condition is true (e.g. green light)
  | { stand: number }                        // stand for n seconds
  | { hold: () => boolean }                  // stand while true (e.g. waiting for a train)
  | { appear: true } | { vanish: true };     // fade in / out (doors, stairs, train doors)

export interface Agent {
  pos: THREE.Vector3; heading: number;
  route: Step[]; i: number; t: number;
  speed: number; color: THREE.Color; mood: Mood; face: boolean;
  scale: number; alive: boolean; walking: boolean; tag?: string;
}

const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);

function faceTexture(m: Mood) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d')!;
  x.fillStyle = '#FBF8F2'; x.strokeStyle = MOOD_COLOR[m]; x.lineWidth = 6;
  x.beginPath(); x.arc(32, 32, 27, 0, Math.PI * 2); x.fill(); x.stroke();
  x.fillStyle = '#1B2340'; x.beginPath(); x.arc(23, 26, 3.6, 0, 7); x.arc(41, 26, 3.6, 0, 7); x.fill();
  x.strokeStyle = '#1B2340'; x.lineWidth = 4; x.lineCap = 'round'; x.beginPath();
  if (m === 'h') x.arc(32, 34, 11, 0.15 * Math.PI, 0.85 * Math.PI);
  else if (m === 's') x.arc(32, 50, 11, 1.2 * Math.PI, 1.8 * Math.PI);
  else { x.moveTo(22, 42); x.lineTo(42, 42); }
  x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Draws up to `cap` people with two instanced meshes (body + head): one draw call each, whatever the crowd size.
 * Depth (who is in front of whom) is handled by the GPU depth buffer, so nothing can be drawn over what is in front of it.
 */
export class Crowd {
  readonly group = new THREE.Group();
  readonly agents: Agent[] = [];
  private bodies: THREE.InstancedMesh;
  private heads: THREE.InstancedMesh;
  private faces: THREE.Sprite[] = [];
  private faceMats: Record<Mood, THREE.SpriteMaterial>;
  showFaces = false;
  readonly material: THREE.MeshStandardMaterial;

  constructor(readonly cap = 400) {
    this.material = new THREE.MeshStandardMaterial({ roughness: 0.7, flatShading: true });
    const body = new THREE.CapsuleGeometry(0.06, 0.13, 3, 8); body.translate(0, 0.125, 0);
    const head = new THREE.SphereGeometry(0.054, 8, 6); head.translate(0, 0.29, 0);
    this.bodies = new THREE.InstancedMesh(body, this.material, cap);
    this.heads = new THREE.InstancedMesh(head, this.material, cap);
    for (const m of [this.bodies, this.heads]) { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.castShadow = true; m.frustumCulled = false; m.count = 0; }
    this.group.add(this.bodies, this.heads);
    const fm = (m: Mood) => new THREE.SpriteMaterial({ map: faceTexture(m), color: 0xd8d8d8 });
    this.faceMats = { h: fm('h'), n: fm('n'), s: fm('s') };
  }

  spawn(at: THREE.Vector3, route: Step[], opts: Partial<Pick<Agent, 'speed' | 'mood' | 'face' | 'tag'>> & { color?: number } = {}) {
    if (this.agents.filter(a => a.alive).length >= this.cap) return null;
    const a: Agent = {
      pos: at.clone(), heading: 0, route, i: 0, t: 0,
      speed: opts.speed ?? 0.42 + Math.random() * 0.12,
      color: new THREE.Color(opts.color ?? PALETTE.people[Math.floor(Math.random() * PALETTE.people.length)]),
      mood: opts.mood ?? 'h', face: opts.face ?? false, scale: 1, alive: true, walking: false, tag: opts.tag,
    };
    const dead = this.agents.findIndex(x => !x.alive);
    if (dead >= 0) this.agents[dead] = a; else this.agents.push(a);
    return a;
  }

  update(dt: number, camera: THREE.Camera) {
    for (const a of this.agents) {
      if (!a.alive) continue;
      a.walking = false;
      const s = a.route[a.i];
      if (!s) { a.alive = false; continue; }
      if ('to' in s) {
        const d = tmpP.subVectors(s.to, a.pos); const L = d.length();
        const step = a.speed * (s.fast ? 1.35 : 1) * dt;
        if (L <= step) { a.pos.copy(s.to); a.i++; }
        else { a.pos.addScaledVector(d, step / L); a.heading = Math.atan2(d.x, d.z); a.walking = true; }
      } else if ('wait' in s) { if (s.wait()) a.i++; }
      else if ('hold' in s) { if (!s.hold()) a.i++; }
      else if ('stand' in s) { a.t += dt; if (a.t >= s.stand) { a.t = 0; a.i++; } }
      else if ('appear' in s) { a.scale = Math.min(1, a.scale + dt * 2.5); if (a.scale >= 1) a.i++; }
      else if ('vanish' in s) { a.scale -= dt * 2.5; if (a.scale <= 0) a.alive = false; }
    }
    // write instances
    let n = 0;
    const now = performance.now() / 1000;
    for (let k = 0; k < this.agents.length; k++) {
      const a = this.agents[k];
      if (!a.alive || n >= this.cap) continue;
      const bob = a.walking ? Math.abs(Math.sin(now * 9 + k)) * 0.02 : 0;
      tmpQ.setFromAxisAngle(up, a.heading);
      tmpS.setScalar(Math.max(0.001, a.scale));
      tmpM.compose(tmpP.set(a.pos.x, a.pos.y + bob, a.pos.z), tmpQ, tmpS);
      this.bodies.setMatrixAt(n, tmpM); this.heads.setMatrixAt(n, tmpM);
      this.bodies.setColorAt(n, a.color); this.heads.setColorAt(n, SKIN);
      n++;
    }
    this.bodies.count = this.heads.count = n;
    this.bodies.instanceMatrix.needsUpdate = this.heads.instanceMatrix.needsUpdate = true;
    if (this.bodies.instanceColor) this.bodies.instanceColor.needsUpdate = true;
    if (this.heads.instanceColor) this.heads.instanceColor.needsUpdate = true;
    this.updateFaces(camera);
  }

  private updateFaces(camera: THREE.Camera) {
    const want = this.showFaces ? this.agents.filter(a => a.alive && a.face && a.scale > 0.6) : [];
    while (this.faces.length < want.length) { const sp = new THREE.Sprite(this.faceMats.h); sp.scale.set(0.17, 0.17, 1); sp.renderOrder = 5; this.group.add(sp); this.faces.push(sp); }
    this.faces.forEach((sp, k) => {
      const a = want[k];
      sp.visible = !!a;
      if (a) { sp.material = this.faceMats[a.mood]; sp.position.set(a.pos.x, a.pos.y + 0.5, a.pos.z); }
    });
    void camera;
  }

  setOpacity(o: number) {
    this.material.transparent = o < 1; this.material.opacity = o; this.material.depthWrite = o > 0.5;
    Object.values(this.faceMats).forEach(m => { m.transparent = true; m.opacity = o; });
  }
}
const SKIN = new THREE.Color(0xe8b896);

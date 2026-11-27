import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * Collects many small primitives (with per-vertex colour) and merges them into a couple of meshes:
 * `solid` (lit) and `glow` (unlit: windows, lamps, screens — picked up by the bloom pass).
 * Merging keeps draw calls low, which is what makes a whole city cheap to render.
 */
export class Geo {
  solid: THREE.BufferGeometry[] = [];
  glow: THREE.BufferGeometry[] = [];

  private push(g: THREE.BufferGeometry, color: number, glow = false) {
    const ng = g.index ? g.toNonIndexed() : g;
    if (!ng.getAttribute('normal')) ng.computeVertexNormals();
    if (ng.getAttribute('uv')) ng.deleteAttribute('uv');
    const c = new THREE.Color(color);
    const n = ng.getAttribute('position').count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
    ng.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    (glow ? this.glow : this.solid).push(ng);
    if (ng !== g) g.dispose();
  }

  /** Axis-aligned box from its minimum corner. */
  box(x: number, y: number, z: number, w: number, h: number, d: number, color: number, glow = false) {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x + w / 2, y + h / 2, z + d / 2);
    this.push(g, color, glow);
  }
  /** Box with rounded edges (soft scale-model look). */
  roundBox(x: number, y: number, z: number, w: number, h: number, d: number, color: number, radius = 0.06, glow = false) {
    const g = new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w / 2, h / 2, d / 2));
    g.translate(x + w / 2, y + h / 2, z + d / 2);
    this.push(g, color, glow);
  }
  /** Faceted ball (low-poly foliage). */
  ico(x: number, y: number, z: number, r: number, color: number, detail = 0, sy = 1) {
    const g = new THREE.IcosahedronGeometry(r, detail);
    g.scale(1, sy, 1); g.translate(x, y, z);
    this.push(g, color);
  }
  /** Rounded box centred at (cx,cy,cz), rotated (radians, XYZ order). Used for sloped roof panels. */
  rbox(cx: number, cy: number, cz: number, w: number, h: number, d: number, rx: number, ry: number, rz: number, color: number, radius = 0.03) {
    const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 2, h / 2, d / 2));
    g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz);
    g.translate(cx, cy, cz);
    this.push(g, color);
  }
  /** Wheel: cylinder lying along z. */
  wheel(x: number, y: number, z: number, r: number, w: number, color: number) {
    const g = new THREE.CylinderGeometry(r, r, w, 16);
    g.rotateX(Math.PI / 2); g.translate(x, y, z);
    this.push(g, color);
  }
  /** Smooth sphere / ellipsoid. */
  blob(x: number, y: number, z: number, r: number, color: number, sy = 1, seg = 20, glow = false) {
    const g = new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.6));
    g.scale(1, sy, 1); g.translate(x, y, z);
    this.push(g, color, glow);
  }
  capsule(x: number, y: number, z: number, r: number, len: number, color: number) {
    const g = new THREE.CapsuleGeometry(r, len, 4, 10);
    g.translate(x, y + len / 2 + r, z);
    this.push(g, color);
  }
  /** Pitched roof, ridge along x (axis = 'x') or along z. */
  roof(x: number, y: number, z: number, w: number, d: number, h: number, color: number, axis: 'x' | 'z' = 'x', over = 0.06) {
    const shape = new THREE.Shape();
    const span = axis === 'x' ? d + over * 2 : w + over * 2;
    shape.moveTo(-span / 2, 0); shape.lineTo(span / 2, 0); shape.lineTo(0, h); shape.closePath();
    const len = axis === 'x' ? w + over * 2 : d + over * 2;
    const g = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false });
    if (axis === 'x') { g.rotateY(Math.PI / 2); g.translate(x - over, y, z + d / 2); }
    else { g.translate(x + w / 2, y, z - over); }
    this.push(g, color);
  }
  cyl(x: number, y: number, z: number, r: number, h: number, color: number, seg = 8, glow = false) {
    const g = new THREE.CylinderGeometry(r, r, h, seg);
    g.translate(x, y + h / 2, z);
    this.push(g, color, glow);
  }
  cone(x: number, y: number, z: number, r: number, h: number, color: number, seg = 6) {
    const g = new THREE.ConeGeometry(r, h, seg);
    g.translate(x, y + h / 2, z);
    this.push(g, color);
  }
  sphere(x: number, y: number, z: number, r: number, color: number, seg = 8, glow = false) {
    const g = new THREE.SphereGeometry(r, seg, Math.max(4, seg / 2));
    g.translate(x, y, z);
    this.push(g, color, glow);
  }
  dome(x: number, y: number, z: number, r: number, color: number) {
    const g = new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    g.translate(x, y, z);
    this.push(g, color);
  }
  /** Flat quad on the ground (y), useful for streets, crosswalks and lots. */
  plane(x: number, y: number, z: number, w: number, d: number, color: number, glow = false) {
    const g = new THREE.PlaneGeometry(w, d);
    g.rotateX(-Math.PI / 2);
    g.translate(x + w / 2, y, z + d / 2);
    this.push(g, color, glow);
  }
  /** Vertical quad facing +z (front) — windows, signs. */
  panelZ(x: number, y: number, z: number, w: number, h: number, color: number, glow = false) {
    const g = new THREE.PlaneGeometry(w, h);
    g.translate(x + w / 2, y + h / 2, z);
    this.push(g, color, glow);
  }
  /** Vertical quad facing +x (side) — windows. */
  panelX(x: number, y: number, z: number, d: number, h: number, color: number, glow = false) {
    const g = new THREE.PlaneGeometry(d, h);
    g.rotateY(Math.PI / 2);
    g.translate(x, y + h / 2, z + d / 2);
    this.push(g, color, glow);
  }
  arch(x: number, y: number, z: number, w: number, h: number, color: number, glow = false) {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(w, 0); s.lineTo(w, h - w / 2);
    s.absarc(w / 2, h - w / 2, w / 2, 0, Math.PI, false); s.lineTo(0, 0);
    const g = new THREE.ShapeGeometry(s, 8);
    g.translate(x, y, z);
    this.push(g, color, glow);
  }

  /** Inclined slab between two points of the x–y plane (escalators, ramps), centred at depth z. */
  beam(x0: number, y0: number, x1: number, y1: number, z: number, depth: number, thick: number, color: number) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const g = new THREE.BoxGeometry(len, thick, depth);
    g.rotateZ(Math.atan2(y1 - y0, x1 - x0));
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, z);
    this.push(g, color);
  }

  build(solidMat: THREE.Material, glowMat: THREE.Material, name = ''): THREE.Group {
    const grp = new THREE.Group();
    grp.name = name;
    if (this.solid.length) {
      const m = new THREE.Mesh(mergeGeometries(this.solid, false)!, solidMat);
      m.castShadow = true; m.receiveShadow = true; grp.add(m);
    }
    if (this.glow.length) {
      const m = new THREE.Mesh(mergeGeometries(this.glow, false)!, glowMat);
      grp.add(m);
    }
    this.solid.forEach(g => g.dispose()); this.glow.forEach(g => g.dispose());
    this.solid = []; this.glow = [];
    return grp;
  }
}

/** Small deterministic random generator so the city is always the same. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  const next = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  return {
    next,
    range: (a: number, b: number) => a + (b - a) * next(),
    pick: <T,>(arr: readonly T[]) => arr[Math.floor(next() * arr.length)],
    chance: (p: number) => next() < p,
  };
}
export type Rng = ReturnType<typeof rng>;

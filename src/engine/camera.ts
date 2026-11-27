import * as THREE from 'three';

export interface Bounds { x0: number; x1: number; z0: number; z1: number }

/**
 * Fixed-angle orthographic camera (scale-model look) with:
 * drag with a 6 px threshold, short inertia, elastic edges, trackpad pan, pinch / wheel zoom at the cursor,
 * double-click zoom, keyboard, and animated flights.
 */
export class CameraRig {
  readonly camera: THREE.OrthographicCamera;
  readonly target = new THREE.Vector3();
  zoom = 1; zmin = 0.5; zmax = 2.6;
  frustum = 15;                                  // world units visible vertically at zoom 1
  bounds: Bounds;
  private elev = THREE.MathUtils.degToRad(33);
  private yaw = THREE.MathUtils.degToRad(21);
  private dir = new THREE.Vector3();
  private right = new THREE.Vector3();
  private fwd = new THREE.Vector3();
  private shown = new THREE.Vector3();             // displayed target (with elastic overshoot)
  private vel = new THREE.Vector2();
  private anim: null | ((now: number) => boolean) = null;
  onChange: () => void = () => {};
  moving = false;

  constructor(private el: HTMLElement, bounds: Bounds) {
    this.bounds = bounds;
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
    this.dir.set(Math.sin(this.yaw) * Math.cos(this.elev), Math.sin(this.elev), Math.cos(this.yaw) * Math.cos(this.elev));
    this.right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    this.fwd.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this.bind();
  }

  get level(): 'far' | 'mid' | 'near' { return this.zoom < 0.8 ? 'far' : this.zoom < 1.5 ? 'mid' : 'near'; }

  resize(w: number, h: number) {
    const a = w / h;
    this.camera.left = -this.frustum * a / 2; this.camera.right = this.frustum * a / 2;
    this.camera.top = this.frustum / 2; this.camera.bottom = -this.frustum / 2;
    this.apply();
  }

  /** Elastic edge: past the bounds the camera moves less and less. */
  private elastic(v: number, lo: number, hi: number) {
    const r = 2.2 / this.zoom;
    if (v < lo) return lo - r * (1 - 1 / ((lo - v) / r * 0.6 + 1));
    if (v > hi) return hi + r * (1 - 1 / ((v - hi) / r * 0.6 + 1));
    return v;
  }
  private clampHard() {
    const b = this.bounds;
    this.target.x = THREE.MathUtils.clamp(this.target.x, b.x0, b.x1);
    this.target.z = THREE.MathUtils.clamp(this.target.z, b.z0, b.z1);
  }
  apply(elastic = false) {
    const b = this.bounds;
    this.shown.copy(this.target);
    if (elastic) { this.shown.x = this.elastic(this.target.x, b.x0, b.x1); this.shown.z = this.elastic(this.target.z, b.z0, b.z1); }
    this.camera.zoom = this.zoom;
    this.camera.position.copy(this.shown).addScaledVector(this.dir, 120);
    this.camera.lookAt(this.shown);
    this.camera.updateProjectionMatrix();
    this.onChange();
  }

  /** World units per screen pixel at the current zoom. */
  private wpp() { return this.frustum / this.zoom / this.el.clientHeight; }
  panPixels(dx: number, dy: number) {
    const k = this.wpp();
    this.target.addScaledVector(this.right, -dx * k);
    this.target.addScaledVector(this.fwd, dy * k / Math.sin(this.elev));
  }
  /** Ground point (at the current target height) under a screen position. */
  groundAt(sx: number, sy: number) {
    const r = this.el.getBoundingClientRect();
    const ndc = new THREE.Vector2(((sx - r.left) / r.width) * 2 - 1, -((sy - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, this.camera);
    const p = new THREE.Vector3();
    ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.target.y), p);
    return p;
  }
  zoomAt(sx: number, sy: number, z: number) {
    const before = this.groundAt(sx, sy);
    this.zoom = THREE.MathUtils.clamp(z, this.zmin, this.zmax);
    this.apply();
    const after = this.groundAt(sx, sy);
    this.target.add(before.sub(after)); this.target.y = this.shown.y;
    this.clampHard(); this.apply();
  }

  flyTo(x: number, z: number, zoom = this.zoom, ms = 750, y = this.target.y) {
    const x0 = this.target.x, z0 = this.target.z, y0 = this.target.y, k0 = this.zoom, t0 = performance.now();
    const b = this.bounds;
    const x1 = THREE.MathUtils.clamp(x, b.x0, b.x1), z1 = THREE.MathUtils.clamp(z, b.z0, b.z1), k1 = THREE.MathUtils.clamp(zoom, this.zmin, this.zmax);
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    this.anim = now => {
      const t = ms <= 0 ? 1 : Math.min(1, (now - t0) / ms), e = ease(t);
      this.target.set(x0 + (x1 - x0) * e, y0 + (y - y0) * e, z0 + (z1 - z0) * e); this.zoom = k0 + (k1 - k0) * e;
      this.apply();
      return t < 1;
    };
  }

  /** Called every frame by the main loop. */
  tick(now: number, dt: number) {
    if (this.anim) { if (!this.anim(now)) this.anim = null; this.moving = true; return; }
    if (this.dragging) { this.moving = true; return; }
    if (this.vel.lengthSq() > 1e-6 || this.outside()) {
      this.target.x += this.vel.x * dt; this.target.z += this.vel.y * dt;
      const k = Math.pow(0.0018, dt);              // short glide
      this.vel.multiplyScalar(k);
      const b = this.bounds, sp = 1 - Math.pow(0.0001, dt);
      if (this.target.x < b.x0 || this.target.x > b.x1) { this.vel.x *= Math.pow(0.001, dt); this.target.x += (THREE.MathUtils.clamp(this.target.x, b.x0, b.x1) - this.target.x) * sp; }
      if (this.target.z < b.z0 || this.target.z > b.z1) { this.vel.y *= Math.pow(0.001, dt); this.target.z += (THREE.MathUtils.clamp(this.target.z, b.z0, b.z1) - this.target.z) * sp; }
      if (this.vel.lengthSq() < 0.0004 && !this.outside(0.01)) { this.vel.set(0, 0); this.clampHard(); }
      this.apply(true); this.moving = true; return;
    }
    this.moving = false;
  }
  private outside(eps = 0) { const b = this.bounds; return this.target.x < b.x0 - eps || this.target.x > b.x1 + eps || this.target.z < b.z0 - eps || this.target.z > b.z1 + eps; }

  // ---------- input ----------
  private dragging = false;
  private down: { x: number; y: number; tx: number; tz: number } | null = null;
  private samples: [number, number, number][] = [];
  /** True if the last pointerup was a click (no drag). */
  lastWasClick = false;

  private bind() {
    const el = this.el;
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      this.anim = null; this.vel.set(0, 0);
      this.down = { x: e.clientX, y: e.clientY, tx: this.target.x, tz: this.target.z };
      this.samples = [[performance.now(), e.clientX, e.clientY]];
      this.dragging = false;
    });
    window.addEventListener('pointermove', e => {
      if (!this.down) return;
      const dx = e.clientX - this.down.x, dy = e.clientY - this.down.y;
      if (!this.dragging) {
        if (Math.hypot(dx, dy) < 6) return;
        this.dragging = true; el.classList.add('drag');
      }
      this.target.x = this.down.tx; this.target.z = this.down.tz;
      this.panPixels(dx, dy);
      this.samples.push([performance.now(), e.clientX, e.clientY]); if (this.samples.length > 8) this.samples.shift();
      this.apply(true);
    });
    window.addEventListener('pointerup', () => {
      if (!this.down) return;
      this.lastWasClick = !this.dragging;
      this.down = null; el.classList.remove('drag');
      if (!this.dragging) return;
      this.dragging = false;
      const now = performance.now(), s = this.samples.filter(q => now - q[0] < 90);
      if (s.length > 1) {
        const a = s[0], b = s[s.length - 1], dt = Math.max(8, b[0] - a[0]) / 1000;
        const before = this.target.clone();
        this.panPixels((b[1] - a[1]) / dt, (b[2] - a[2]) / dt);
        const v = this.target.clone().sub(before); this.target.copy(before);
        const max = 30 / this.zoom;
        this.vel.set(THREE.MathUtils.clamp(v.x, -max, max), THREE.MathUtils.clamp(v.z, -max, max)).multiplyScalar(0.55);
      }
    });
    el.addEventListener('wheel', e => {
      e.preventDefault(); this.anim = null;
      const trackpad = !e.ctrlKey && e.deltaMode === 0 && (Math.abs(e.deltaX) > 0.5 || Math.abs(e.deltaY) < 40 || !Number.isInteger(e.deltaY));
      if (trackpad || e.shiftKey) {
        const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX, dy = e.shiftKey ? 0 : e.deltaY;
        this.panPixels(-dx, -dy); this.clampHard(); this.apply();
      } else {
        this.zoomAt(e.clientX, e.clientY, this.zoom * Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0018)));
      }
    }, { passive: false });
    el.addEventListener('dblclick', e => {
      const p = this.groundAt(e.clientX, e.clientY);
      this.flyTo(p.x, p.z, this.zoom * 1.6, 450);
    });
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase(), s = 40;
      if (k === 'arrowleft' || k === 'a') this.panPixels(s, 0);
      else if (k === 'arrowright' || k === 'd') this.panPixels(-s, 0);
      else if (k === 'arrowup' || k === 'w') this.panPixels(0, s);
      else if (k === 'arrowdown' || k === 's') this.panPixels(0, -s);
      else if (k === '+' || k === '=') return this.flyTo(this.target.x, this.target.z, this.zoom * 1.3, 250);
      else if (k === '-') return this.flyTo(this.target.x, this.target.z, this.zoom / 1.3, 250);
      else return;
      this.clampHard(); this.apply();
    });
  }
}

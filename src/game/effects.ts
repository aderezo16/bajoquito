import * as THREE from 'three';
import { Geo, rng } from '../engine/geo';
import { approved } from '../models';
import { F2, R1, SLAB, SLICE, SLICE_X0, SLICE_X1, STATIONS, TUNNEL_Y, stationX, streetX, zoneOf } from '../world/config';
import { Place } from '../world/surface';
import { Crowd, Step } from '../engine/crowd';

/**
 * Everything in the 3D city that answers to the game: line colour, warning beacons, adverts,
 * litter, dark stations, a protest in the plaza, the TV van, the news ticker, district moods.
 */
const Y = TUNNEL_Y;
const basic = (c: number, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), toneMapped: false });

function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d')!);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

export interface CityState {
  playing: boolean; salud: number; frec: number; mant: string; rep: number; happy: number;
  stations: { crowd: number; broken: boolean; fault: boolean; dark: number; ad: { t: string; on: boolean } | null; dirty: boolean }[];
  protest: string | null; tv: boolean; led: string; zones: { k: string; n: string; mood: number }[];
  buses: number; terminalBuses: number; rain: boolean; locked: boolean; stationsOpen: boolean; month: number; view?: 'sup' | 'sub';
}

export class CityFx {
  readonly sup = new THREE.Group();
  readonly sub = new THREE.Group();
  private lineSup: THREE.MeshBasicMaterial;
  private lineSub: THREE.MeshBasicMaterial;
  private beacons: { sup: THREE.Mesh; sub: THREE.Mesh; on: boolean; fast: boolean }[] = [];
  private ads: (THREE.Mesh | null)[] = [];
  private adState: string[] = [];
  private litter: THREE.Group[] = [];
  private lights: THREE.PointLight[] = [];
  private dark: number[] = Array(15).fill(0);
  private protestOn = '';
  private protestSign: THREE.Mesh | null = null;
  private van: THREE.Group;
  private ledTex: THREE.CanvasTexture | null = null;
  private ledText = '';
  private zoneLabels = new Map<string, THREE.Mesh>();
  private zoneText = new Map<string, string>();
  private last: Partial<Record<string, string>> = {};
  rain = false;

  constructor(private places: Place[], private crowdSup: Crowd) {
    // the line, drawn on top of the street and the tunnel floor so its colour can follow the trains' health
    const W = SLICE_X1 - SLICE_X0;
    this.lineSup = basic(0x3d8bff, 1.1); this.lineSub = basic(0x3d8bff, 1.1);
    const ls = new THREE.Mesh(new THREE.PlaneGeometry(W, 0.1), this.lineSup); ls.rotation.x = -Math.PI / 2; ls.position.set(SLICE_X0 + W / 2, 0.0125, 0.55); this.sup.add(ls);
    const lu = new THREE.Mesh(new THREE.PlaneGeometry(W, 0.08), this.lineSub); lu.rotation.x = -Math.PI / 2; lu.position.set(SLICE_X0 + W / 2, Y + 0.008, 0); this.sub.add(lu);

    const red = basic(0xff4a4a, 1.6), geo = new THREE.SphereGeometry(0.09, 12, 8);
    for (let i = SLICE.from; i <= SLICE.to; i++) {
      const x = stationX(i);
      const a = new THREE.Mesh(geo, red); a.position.set(x + 1.2, 1.45, 2.3); a.visible = false; this.sup.add(a);
      const b = new THREE.Mesh(geo, red); b.position.set(x - 2.0, Y + 2.35, -2.4); b.visible = false; this.sub.add(b);
      this.beacons.push({ sup: a, sub: b, on: false, fast: false });
      this.ads.push(null); this.adState.push('');
      // litter on the back platform and the mouth of the station
      const lg = new Geo(), r = rng(100 + i);
      for (let k = 0; k < 14; k++) {
        const px = x - 1.8 + r.next() * 3.6, pz = -2.6 + r.next() * 1.0;
        lg.box(px, Y + 0.222, pz, 0.05 + r.next() * 0.07, 0.012, 0.04 + r.next() * 0.06, r.pick([0xe9edf5, 0xd9a441, 0x8a96b8, 0xc8583a]));
      }
      for (let k = 0; k < 6; k++) lg.box(x - 1.2 + r.next() * 2.4, 0.01, 1.5 + r.next() * 0.6, 0.06, 0.012, 0.05, r.pick([0xe9edf5, 0xd9a441, 0x8a96b8]));
      const litter = lg.build(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), new THREE.MeshBasicMaterial(), `litter${i}`);
      litter.visible = false; this.sub.add(litter); this.litter.push(litter);
    }
    // a few warm lights follow the camera from station to station underground
    for (let k = 0; k < 5; k++) { const l = new THREE.PointLight(0xffd9a0, 6, 6, 1.6); this.sub.add(l); this.lights.push(l); }

    // TV van (shows up when there is a scandal)
    const vg = new Geo();
    vg.roundBox(0, 0.06, 0, 0.9, 0.42, 0.46, 0xf2f4fa, 0.08); vg.roundBox(0.62, 0.22, -0.01, 0.26, 0.18, 0.48, 0x2a3466, 0.04);
    vg.box(0.05, 0.2, 0.465, 0.5, 0.06, 0.004, 0xff6b2c); vg.cyl(0.3, 0.48, 0.23, 0.02, 0.18, 0x9aa6c4); vg.rbox(0.3, 0.7, 0.23, 0.3, 0.03, 0.3, 0.7, 0, 0, 0xe6ebf5, 0.02);
    for (const wx of [0.18, 0.72]) for (const wz of [0.0, 0.46]) vg.wheel(wx, 0.07, wz, 0.07, 0.05, 0x1b2340);
    this.van = vg.build(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), 'tvvan');
    const med = this.place('medios', 'sup');
    if (med) this.van.position.set(med.anchor.x + 1.5, 0, R1.z1 + 0.15);
    this.van.visible = false; this.sup.add(this.van);

    // news ticker on the Medios screen
    const mv = approved('medios').defaults as Record<string, number | boolean>;
    if (med && mv.conPantalla) {
      const w = (mv.ancho as number) - 0.28, h = (mv.pisos as number) * 0.4 + 0.1, d = mv.fondo as number;
      this.ledTex = canvasTex(2048, 128, () => {});
      this.ledTex.wrapS = THREE.RepeatWrapping;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.5), new THREE.MeshBasicMaterial({ map: this.ledTex, toneMapped: false }));
      m.position.set(med.anchor.x, h * 0.42 + 0.26, med.anchor.z + d / 2 + 0.1);
      med.group.add(m);
    }
  }

  private place(id: string, view: 'sup' | 'sub') { return this.places.find(p => p.id === id && p.view === view); }
  private changed(k: string, v: unknown) { const s = JSON.stringify(v); if (this.last[k] === s) return false; this.last[k] = s; return true; }

  apply(c: CityState) {
    // the line glows blue when trains are healthy, amber and then red as they wear out
    const lc = c.salud >= 65 ? 0x3d8bff : c.salud >= 45 ? 0xffb347 : 0xff5a4a;
    this.lineSup.color.set(lc).multiplyScalar(1.1); this.lineSub.color.set(lc).multiplyScalar(1.1);

    c.stations.forEach((s, i) => {
      const b = this.beacons[i];
      b.on = c.playing && c.stationsOpen && (s.broken || s.fault); b.fast = s.fault;
      if (this.changed('br' + i, s.broken)) for (const v of ['sup', 'sub'] as const) this.place(`st${i}`, v)?.rebuild?.({ broken: s.broken });
      this.litter[i].visible = c.playing && s.dirty && i % 2 === 0;
      this.dark[i] = s.dark;
      const sub = this.place(`st${i}`, 'sub');
      if (sub && this.changed('dk' + i, s.dark)) sub.group.traverse(o => { const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial; if (m?.isMeshStandardMaterial) m.color.setScalar(1 - s.dark * 0.65); });
      const key = s.ad ? s.ad.t + (s.ad.on ? '1' : '0') : '';
      if (key !== this.adState[i]) { this.adState[i] = key; this.setAd(i, s.ad); }
    });

    // warehouse shelves, yard crew and lamps, buses at the terminal
    const fillN = Math.round(Math.max(0, Math.min(1, c.rep / 100)) * 10) / 10;
    if (this.changed('bod', fillN)) this.place('bodega', 'sub')?.rebuild?.({ llenado: fillN });
    const crew = { r: 3, n: 5, f: 9 }[c.mant] ?? 5, lamps = { r: 1, n: 2, f: 4 }[c.mant] ?? 2;
    if (this.changed('tal', [crew, lamps, c.salud < 60])) this.place('taller', 'sub')?.rebuild?.({ trabajadores: crew, luces: lamps, trenesAdentro: c.salud < 60 ? 3 : 2 });
    if (this.changed('ter', c.terminalBuses)) this.place('terminal', 'sup')?.rebuild?.({ buses: c.terminalBuses });

    this.van.visible = c.tv;
    this.setProtest(c.protest);
    if (this.ledTex && c.led !== this.ledText) { this.ledText = c.led; this.drawLed(c.led); }
    for (const z of c.zones) this.setZone(z.k, z.n, z.mood);
    this.rain = c.rain;
  }

  private setAd(i: number, ad: { t: string; on: boolean } | null) {
    const old = this.ads[i];
    if (old) { this.sub.remove(old); (old.material as THREE.Material).dispose(); this.ads[i] = null; }
    if (!ad) return;
    const x = stationX(i), col = ad.t === 'pdi' ? '#7CC4FF' : ad.t === 'nam' ? '#FF6B2C' : '#FFC857';
    const tex = canvasTex(256, 160, g => {
      g.fillStyle = '#0E1430'; g.fillRect(0, 0, 256, 160);
      g.fillStyle = col; g.fillRect(10, 10, 236, 140);
      g.fillStyle = '#1B2340'; g.font = '700 30px Sora, Inter, sans-serif'; g.textAlign = 'center';
      g.fillText(ad.t === 'nam' ? STATIONS[i].toUpperCase() : 'PUBLICIDAD', 128, ad.t === 'nam' ? 70 : 88);
      if (ad.t === 'nam') { g.font = '600 24px Inter, sans-serif'; g.fillText('+ MARCA', 128, 110); }
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ad.t === 'nam' ? 1.4 : 0.9, ad.t === 'nam' ? 0.5 : 0.56), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true, opacity: ad.on ? 1 : 0.45 }));
    m.position.set(ad.t === 'nam' ? x - 0.1 : x + 1.1, ad.t === 'nam' ? Y + 1.85 : Y + 1.05, -4.37);
    m.userData.pdi = ad.t === 'pdi' && ad.on;
    this.sub.add(m); this.ads[i] = m;
  }

  private setProtest(text: string | null) {
    const key = text ?? '';
    if (key === this.protestOn) return;
    this.protestOn = key;
    for (const a of this.crowdSup.agents) if (a.alive && a.tag === 'protest') a.alive = false;
    if (this.protestSign) { this.sup.remove(this.protestSign); this.protestSign = null; }
    if (!text) return;
    const mun = this.place('municipio', 'sup');
    const cx = mun ? mun.anchor.x : stationX(6), cz = R1.z0 + 1.1;
    for (let k = 0; k < 22; k++) {
      const p = new THREE.Vector3(cx - 1.6 + (k % 8) * 0.42 + Math.random() * 0.1, 0, cz + Math.floor(k / 8) * 0.38 + Math.random() * 0.1);
      const route: Step[] = [];
      for (let j = 0; j < 200; j++) route.push({ stand: 1 + Math.random() * 2 }, { to: p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.15, 0, (Math.random() - 0.5) * 0.15)) });
      this.crowdSup.spawn(p, route, { mood: 's', face: k % 3 === 0, speed: 0.2, tag: 'protest' });
    }
    const tex = canvasTex(512, 128, g => {
      g.fillStyle = '#F6F1E7'; g.fillRect(0, 0, 512, 128); g.fillStyle = '#E5484D'; g.fillRect(0, 0, 512, 10); g.fillRect(0, 118, 512, 10);
      g.fillStyle = '#B4372F'; g.font = '700 64px Sora, Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 66);
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, side: THREE.DoubleSide }));
    sign.position.set(cx, 0.85, cz + 0.2); this.sup.add(sign); this.protestSign = sign;
  }

  private drawLed(text: string) {
    const cv = this.ledTex!.image as HTMLCanvasElement, g = cv.getContext('2d')!;
    g.fillStyle = '#120A06'; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = '#FF8A3D'; g.font = '700 80px Sora, Inter, sans-serif'; g.textBaseline = 'middle';
    const t = (text.toUpperCase() + '   ·   ').repeat(3);
    g.fillText(t, 10, 68);
    this.ledTex!.needsUpdate = true;
  }

  private setZone(k: string, name: string, mood: number) {
    const txt = `${name.toUpperCase()} · ${Math.round(mood)}`;
    if (this.zoneText.get(k) === txt) return;
    this.zoneText.set(k, txt);
    const col = mood >= 65 ? '#6EE3AE' : mood >= 50 ? '#F2C46B' : '#FF8A7A';
    const tex = canvasTex(1024, 160, g => { g.fillStyle = col; g.font = '700 110px Sora, Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = 0.9; g.fillText(txt, 512, 84); });
    let m = this.zoneLabels.get(k);
    if (!m) {
      const idx = k === 'sur' ? [0, 4] : k === 'centro' ? [5, 8] : [9, 14];
      m = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.0), new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.set((streetX(idx[0]) + streetX(idx[1] + 1)) / 2, 0.02, F2.z1 + 1.1 > SLAB.z1 ? SLAB.z1 - 0.55 : F2.z1 + 0.5);
      this.sup.add(m); this.zoneLabels.set(k, m);
    }
    const mat = m.material as THREE.MeshBasicMaterial; mat.map?.dispose(); mat.map = tex; mat.needsUpdate = true;
  }

  /** Per-frame: pulsing beacons, blinking screens, the ticker, lights near the camera. */
  update(t: number, view: 'sup' | 'sub', focusX: number) {
    for (const b of this.beacons) {
      const s = 1 + Math.sin(t * (b.fast ? 10 : 5)) * 0.25;
      b.sup.visible = b.on && view === 'sup'; b.sub.visible = b.on && view === 'sub';
      b.sup.scale.setScalar(s); b.sub.scale.setScalar(s);
    }
    for (const a of this.ads) if (a?.userData.pdi) ((a.material as THREE.MeshBasicMaterial).color.setScalar(0.85 + Math.sin(t * 3) * 0.15));
    if (this.ledTex) this.ledTex.offset.x = (t * 0.035) % 1;
    // lights: the nearest stations to the camera, dimmer if the station is dark
    const nearest = [...Array(15).keys()].sort((a, b) => Math.abs(stationX(a) - focusX) - Math.abs(stationX(b) - focusX)).slice(0, this.lights.length);
    this.lights.forEach((l, k) => { const i = nearest[k]; l.position.set(stationX(i), Y + 1.6, -1.6); l.intensity = 6 * (1 - this.dark[i] * 0.85); l.visible = view === 'sub'; });
    void zoneOf;
  }
}

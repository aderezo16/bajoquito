import '../legacy/game.css';
import './style.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CameraRig } from './engine/camera';
import { Geo } from './engine/geo';
import { Crowd } from './engine/crowd';
import { BUS_MATS, Buses, Trains, updateSignals } from './engine/traffic';
import { SLICE_X0, SLICE_X1, TUNNEL_Y, stationX } from './world/config';
import { buildSurface, Place } from './world/surface';
import { buildUnderground } from './world/underground';
import { LIFE, SurfaceLife, UndergroundLife } from './world/life';
import { CityFx, CityState } from './game/effects';
import { LineNav } from './ui/line';

/**
 * Bajo Quito: the 3D city (this file) under the game's interface and logic (legacy/parts, prototype v0.9).
 * They talk through window.BQ3D: the game tells the city what happened; the city moves the markers and
 * opens a building's window when you click it.
 */
const canvas = document.getElementById('scene') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
let pixelRatio = Math.min(devicePixelRatio, 2);
renderer.setPixelRatio(pixelRatio);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
const clock = { t: 0 };

// ---------- light: a clear night (the moon and its shadows follow the camera along the line) ----------
const hemi = new THREE.HemisphereLight(0x8d97c4, 0x1a1530, 1.05);
scene.add(hemi, new THREE.AmbientLight(0xffd9a8, 0.18));
const moon = new THREE.DirectionalLight(0xd2dcff, 1.75);
moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
Object.assign(moon.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 70 });
moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.02;
scene.add(moon, moon.target);

// ---------- world ----------
Geo.lowDetail = true;
const sup = buildSurface();
const sub = buildUnderground();
scene.add(sup.root, sub.root);
const crowdSup = new Crowd(320); sup.root.add(crowdSup.group);
const crowdSub = new Crowd(320); sub.root.add(crowdSub.group);
const onCrossing = (x: number) => crowdSup.agents.some(a => a.alive && Math.abs(a.pos.x - x) < 0.45 && Math.abs(a.pos.z) < 1.25);
const buses = new Buses(sup.crossings, onCrossing); sup.root.add(buses.group);
const trains = new Trains(); sub.root.add(trains.group);
const lifeSup = new SurfaceLife(crowdSup, sup.crossings, clock);
const lifeSub = new UndergroundLife(crowdSub, trains, clock);
const places: Place[] = [...sup.places, ...sub.places];
const fx = new CityFx(places, crowdSup);
sup.root.add(fx.sup); sub.root.add(fx.sub);

// ---------- camera ----------
const rig = new CameraRig(canvas, { x0: SLICE_X0 + 3, x1: SLICE_X1 - 3, z0: -6, z1: 5 });
rig.zmin = 0.38;
rig.target.set(stationX(6), 0, -0.5); rig.zoom = 1.0;

// ---------- post-processing ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, rig.camera));
const outline = new OutlinePass(new THREE.Vector2(1, 1), scene, rig.camera);
Object.assign(outline, { edgeStrength: 4, edgeGlow: 0.4, edgeThickness: 1.6, pulsePeriod: 0 });
outline.visibleEdgeColor.set(0xffc857); outline.hiddenEdgeColor.set(0x8a6a20);
composer.addPass(outline);
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.28, 0.32, 1.0);
composer.addPass(bloom);
composer.addPass(new OutputPass());
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(w, h, false); composer.setPixelRatio(pixelRatio); composer.setSize(w, h);
  rig.resize(w, h);
}
addEventListener('resize', resize); resize();

// ---------- views (surface ⇄ underground) ----------
let view: 'sup' | 'sub' = 'sup';
let fade = 0, fadeTo = 0;
const supMats = new Set<THREE.Material>();
const collectSup = () => { supMats.clear(); sup.root.traverse(o => { const m = (o as THREE.Mesh).material; if (m) (Array.isArray(m) ? m : [m]).forEach(x => supMats.add(x)); }); BUS_MATS.forEach(m => supMats.add(m)); };
collectSup();
function applyFade() {
  const o = 1 - fade;
  supMats.forEach(m => { if (!m.visible) return; m.transparent = o < 0.999; m.opacity = o; m.depthWrite = o > 0.5; });
  crowdSup.setOpacity(o);
  sup.root.visible = o > 0.01;
}
function setView(v: 'sup' | 'sub') {
  canvas.classList.toggle('sup', v === 'sup');
  if (v === view) return;
  view = v; fadeTo = v === 'sub' ? 1 : 0;
  collectSup();
  rig.flyTo(rig.target.x, rig.target.z, rig.zoom, 900, v === 'sub' ? TUNNEL_Y + 0.4 : 0);
  hover(null);
}
canvas.classList.add('sup');

// ---------- picking and hover: clicking a building opens its window in the game ----------
const ray = new THREE.Raycaster();
let hovered: string | null = null;
const visiblePlace = (p: Place) => { let o: THREE.Object3D | null = p.group; while (o) { if (!o.visible) return false; o = o.parent; } return true; };
function placeOf(id: string) { return places.find(p => p.id === id && p.view === view); }
function markerOf(id: string) { return document.querySelector<HTMLElement>(`#ui [data-hs="${id}"]`); }
function hover(id: string | null) {
  if (id === hovered) return;
  if (hovered) { markerOf(hovered)?.classList.remove('hov'); placeOf(hovered)?.group.traverse(o => { const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial; if (m?.emissive) m.emissive.setHex(0); }); }
  hovered = id;
  const p = id ? placeOf(id) : undefined;
  outline.selectedObjects = p ? p.group.children.filter(c => (c as THREE.Mesh).isMesh && !p.hit.includes(c)) : [];
  p?.group.traverse(o => { const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial; if (m?.emissive) m.emissive.setHex(0x2a2108); });
  if (id) markerOf(id)?.classList.add('hov');
  canvas.classList.toggle('hover', !!id);
}
function pickAt(sx: number, sy: number) {
  ray.setFromCamera(new THREE.Vector2((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1), rig.camera);
  const hits = ray.intersectObjects(places.filter(p => p.view === view && visiblePlace(p) && markerOf(p.id)).flatMap(p => p.hit), false);
  return hits.length ? (hits[0].object.userData.place as string) : null;
}
canvas.addEventListener('pointermove', e => { if (!(e.buttons & 1)) hover(pickAt(e.clientX, e.clientY)); });
canvas.addEventListener('pointerleave', () => hover(null));
canvas.addEventListener('pointerup', e => { setTimeout(() => { if (rig.lastWasClick) { const id = pickAt(e.clientX, e.clientY); if (id) markerOf(id)?.click(); } }, 0); });
document.getElementById('zin')!.onclick = () => rig.flyTo(rig.target.x, rig.target.z, rig.zoom * 1.35, 300, rig.target.y);
document.getElementById('zout')!.onclick = () => rig.flyTo(rig.target.x, rig.target.z, rig.zoom / 1.35, 300, rig.target.y);

// ---------- the whole line at a glance ----------
const lineNav = new LineNav(document.getElementById('line3d')!, i => { rig.flyTo(stationX(i), view === 'sub' ? -0.6 : -0.5, Math.max(rig.zoom, 0.9), 650, view === 'sub' ? TUNNEL_Y + 0.4 : 0); flightUntil = performance.now() + 700; });

// ---------- markers: the game's building and station markers ride on the 3D anchors ----------
const stage = document.getElementById('stage')!;
const tmp = new THREE.Vector3();
function placeMarkers() {
  const sr = stage.getBoundingClientRect(), K = sr.width / 1440;
  document.querySelectorAll<HTMLElement>('#ui .m3[data-hs]').forEach(el => {
    const p = placeOf(el.dataset.hs!);
    let show = !!p && visiblePlace(p) && fade === (view === 'sub' ? 1 : 0);
    if (p && show) {
      tmp.copy(p.anchor).applyMatrix4(p.group.matrixWorld).project(rig.camera);
      const x = (tmp.x + 1) / 2 * innerWidth, y = (1 - tmp.y) / 2 * innerHeight;
      show = tmp.z < 1 && x > 20 && x < innerWidth - 20 && y > 90 * K && y < innerHeight - 20;
      el.style.left = ((x - sr.left) / K).toFixed(1) + 'px'; el.style.top = ((y - sr.top) / K).toFixed(1) + 'px';
    }
    el.style.visibility = show ? 'visible' : 'hidden';
  });
}

// ---------- rising buildings (new in an episode) ----------
const rising: { g: THREE.Object3D; t0: number }[] = [];
const OPTIONAL = ['municipio', 'concejo', 'medios', 'terminal'];
function setBuildings(list: string[]) {
  for (const id of OPTIONAL) { const p = places.find(x => x.id === id); if (p) { p.group.visible = list.includes(id); p.group.scale.y = 1; } }
}
function rise(id: string) {
  const p = places.find(x => x.id === id); if (!p) return;
  p.group.visible = true; p.group.scale.y = 0.001; rising.push({ g: p.group, t0: performance.now() });
  focus(id);
}

// ---------- camera moves asked by the game ----------
let flightUntil = 0;
function focus(id: string, cb?: () => void) {
  const p = places.find(x => x.id === id && (x.view === view || !/^st/.test(id))) ?? placeOf(id);
  if (!p) return false;
  const x = p.anchor.x, z = p.view === 'sub' ? (p.anchor.z > 2 ? 3.2 : -1) : Math.max(-6, Math.min(4, p.anchor.z * 0.6));
  if (Math.abs(rig.target.x - x) < 2.6 && Math.abs(rig.target.z - z) < 3 && rig.zoom >= 0.8) return false;
  rig.flyTo(x, z, Math.max(rig.zoom, 0.95), 750, p.view === 'sub' ? TUNNEL_Y + 0.4 : 0);
  flightUntil = performance.now() + 800;
  if (cb) setTimeout(cb, 820);
  return true;
}

// ---------- the bridge the game uses ----------
let timeScale = 1, rainOn = false, lastState: CityState | null = null;
const bridge = {
  setView, focus, placeMarkers, setBuildings, rise,
  select(_id: string | null) { /* windows blur the city; nothing to mark */ },
  speed(k: number) { timeScale = Math.max(1, Math.min(4, k / 3.5)); },
  apply(c: CityState) {
    lastState = c;
    if (c.view && c.view !== view) setView(c.view);
    fx.apply(c);
    LIFE.happy = c.happy; c.stations.forEach((s, i) => (LIFE.crowd[i] = s.crowd));
    trains.headway = c.frec * 6;
    buses.interval = 16 - c.buses * 1.4;
    rainOn = c.rain;
    lineNav.setAlerts(c.stations.map(s => c.playing && c.stationsOpen && (s.broken || s.fault)));
  },
};
Object.assign(window as unknown as Record<string, unknown>, { BQ3D: bridge });

// ---------- loop ----------
let last = performance.now(), frames = 0, fpsT = last, slow = 0, k = 0;
const legacy = window as unknown as { __legacyBoot?: () => void; __legacyTut?: () => void; __legacyState?: () => { screen: string; view: string } };
let screen = 'title';
document.body.classList.add('screen');
rig.onChange = () => {
  crowdSup.showFaces = crowdSub.showFaces = rig.level === 'near';
  if (screen === 'game' && performance.now() > flightUntil) { clearTimeout(tutT); tutT = window.setTimeout(() => legacy.__legacyTut?.(), 160); }
};
let tutT = 0;
function loop(now: number) {
  const realDt = Math.min(0.05, (now - last) / 1000); last = now;
  const dt = realDt * timeScale;
  clock.t += dt;
  if (++k % 20 === 0) {
    const st = legacy.__legacyState?.();
    if (st && st.screen !== screen) {
      const wasGame = screen === 'game';
      screen = st.screen; document.body.classList.toggle('screen', screen !== 'game');
      // entering a game: start where the action is (the warehouse underground, the Municipio above)
      if (screen === 'game' && !wasGame) { const id = view === 'sub' ? 'bodega' : 'municipio'; const p = places.find(x => x.id === id); if (p) { rig.flyTo(p.anchor.x, view === 'sub' ? 1.5 : p.anchor.z * 0.55, 0.85, 900, view === 'sub' ? TUNNEL_Y + 0.4 : 0); flightUntil = performance.now() + 950; } }
    }
    document.getElementById('rainfx')!.classList.toggle('on', rainOn && view === 'sup' && screen === 'game');
  }
  // title screen: a slow ride along the line
  if (screen !== 'game' && performance.now() > flightUntil) { rig.target.x = stationX(7) + Math.sin(clock.t * 0.03) * 22; rig.apply(); }
  rig.tick(now, realDt);
  if (fade !== fadeTo) { fade += Math.sign(fadeTo - fade) * Math.min(Math.abs(fadeTo - fade), realDt / 0.8); applyFade(); }
  for (let r = rising.length - 1; r >= 0; r--) {
    const e = (now - rising[r].t0) / 1300, s = Math.min(1, e);
    rising[r].g.scale.y = Math.max(0.001, 1 + 2.70158 * Math.pow(s - 1, 3) + 1.70158 * Math.pow(s - 1, 2));   // ease out with a small overshoot
    if (e >= 1) { rising[r].g.scale.y = 1; rising.splice(r, 1); }
  }
  LIFE.focusX = rig.target.x;
  moon.position.set(rig.target.x - 10, 18, 14); moon.target.position.set(rig.target.x, 0, 0); moon.target.updateMatrixWorld();
  updateSignals(sup.crossings, clock.t);
  buses.update(dt, clock.t); trains.update(dt, clock.t);
  lifeSup.update(); lifeSub.update();
  crowdSup.update(dt, rig.camera); crowdSub.update(dt, rig.camera);
  fx.update(clock.t, view, rig.target.x);
  placeMarkers();
  if (k % 3 === 0) lineNav.update(rig.camera, view === 'sub' ? TUNNEL_Y : 0);
  composer.render();
  // if the computer struggles, draw fewer pixels
  frames++;
  if (now - fpsT > 1000) {
    const fps = frames * 1000 / (now - fpsT); frames = 0; fpsT = now;
    slow = fps < 28 ? slow + 1 : 0;
    if (slow >= 3 && pixelRatio > 1) { pixelRatio = 1; resize(); slow = 0; }
  }
  requestAnimationFrame(loop);
}
rig.apply();
requestAnimationFrame(loop);
legacy.__legacyBoot?.();
setTimeout(() => document.getElementById('loading')!.classList.add('out'), 250);

// test hooks (used by the automated checks)
Object.assign(window as unknown as Record<string, unknown>, { __bq: { rig, setView, crowdSup, crowdSub, buses, trains, clock, pickAt, places, sup, fx, get state() { return lastState; }, get view() { return view; } } });

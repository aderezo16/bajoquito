import './style.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CameraRig } from './engine/camera';
import { Crowd } from './engine/crowd';
import { BUS_MATS, Buses, Trains, updateSignals } from './engine/traffic';
import { SLICE, SLICE_X0, SLICE_X1, TUNNEL_Y, stationX } from './world/config';
import { buildSurface, Place } from './world/surface';
import { buildUnderground } from './world/underground';
import { SurfaceLife, UndergroundLife } from './world/life';
import { Pins } from './ui/pins';
import { Strip } from './ui/strip';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const app = document.getElementById('app')!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
const clock = { t: 0 };

// ---------- light: a clear night ----------
scene.add(new THREE.HemisphereLight(0x8d97c4, 0x1a1530, 1.05));
scene.add(new THREE.AmbientLight(0xffd9a8, 0.18));
const moon = new THREE.DirectionalLight(0xd2dcff, 1.75);
const cx = (SLICE_X0 + SLICE_X1) / 2;
moon.position.set(cx - 10, 18, 14); moon.target.position.set(cx, 0, 0);
moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
Object.assign(moon.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 60 });
moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.02;
scene.add(moon, moon.target);

// ---------- world ----------
const sup = buildSurface();
const sub = buildUnderground();
scene.add(sup.root, sub.root);
const crowdSup = new Crowd(260); sup.root.add(crowdSup.group);
const crowdSub = new Crowd(220); sub.root.add(crowdSub.group);
const onCrossing = (x: number) => crowdSup.agents.some(a => a.alive && Math.abs(a.pos.x - x) < 0.45 && Math.abs(a.pos.z) < 1.25);
const buses = new Buses(sup.crossings, onCrossing); sup.root.add(buses.group);
const trains = new Trains(); sub.root.add(trains.group);
const lifeSup = new SurfaceLife(crowdSup, sup.crossings, clock);
const lifeSub = new UndergroundLife(crowdSub, trains, clock);

// ---------- camera ----------
const rig = new CameraRig(canvas, { x0: SLICE_X0 + 3, x1: SLICE_X1 - 3, z0: -6, z1: 5 });
rig.target.set(stationX(6), 0, -0.5); rig.zoom = 1.05;

// ---------- post-processing ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, rig.camera));
const outline = new OutlinePass(new THREE.Vector2(1, 1), scene, rig.camera);
Object.assign(outline, { edgeStrength: 4, edgeGlow: 0.4, edgeThickness: 1.6, pulsePeriod: 0 });
outline.visibleEdgeColor.set(0xffc857); outline.hiddenEdgeColor.set(0x8a6a20);
composer.addPass(outline);
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.28, 0.32, 1.0);   // soft glow, only for things brighter than white
composer.addPass(bloom);
composer.addPass(new OutputPass());

function resize() {
  const w = app.clientWidth, h = app.clientHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  rig.resize(w, h);
}
addEventListener('resize', resize); resize();

// ---------- views (surface ⇄ underground) ----------
let view: 'sup' | 'sub' = 'sup';
let fade = 0, fadeTo = 0;                      // 0 = surface, 1 = underground
const supMats = new Set<THREE.Material>();
sup.root.traverse(o => { const m = (o as THREE.Mesh).material; if (m) (Array.isArray(m) ? m : [m]).forEach(x => supMats.add(x)); });
BUS_MATS.forEach(m => supMats.add(m));
function applyFade() {
  const o = 1 - fade;
  supMats.forEach(m => { if (!m.visible) return; m.transparent = o < 0.999; m.opacity = o; m.depthWrite = o > 0.5; });
  crowdSup.setOpacity(o);
  sup.root.visible = o > 0.01;
}
function setView(v: 'sup' | 'sub') {
  if (v === view) return;
  view = v; fadeTo = v === 'sub' ? 1 : 0;
  document.querySelectorAll('.vbtn').forEach(b => b.classList.toggle('on', (b as HTMLElement).dataset.view === v));
  rig.flyTo(rig.target.x, rig.target.z, rig.zoom, 900, v === 'sub' ? TUNNEL_Y + 0.4 : 0);
  pins.setView(v); hover(null);
}
document.querySelectorAll<HTMLButtonElement>('.vbtn').forEach(b => b.onclick = () => setView(b.dataset.view as 'sup' | 'sub'));

// ---------- picking, hover and pins ----------
const places: Place[] = [...sup.places, ...sub.places];
const pins = new Pins(document.getElementById('pins')!, places, rig.camera, canvas, id => open(id), id => hover(id));
const ray = new THREE.Raycaster();
let hovered: string | null = null;
function placeOf(id: string) { return places.find(p => p.id === id && p.view === view); }
function hover(id: string | null) {
  if (id === hovered) return;
  if (hovered) { const p = placeOf(hovered); p?.group.traverse(o => { const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial; if (m?.emissive) m.emissive.setHex(0); }); }
  hovered = id;
  const p = id ? placeOf(id) : undefined;
  outline.selectedObjects = p ? p.group.children.filter(c => (c as THREE.Mesh).isMesh && (c as THREE.Mesh).material !== undefined && !p.hit.includes(c)) : [];
  p?.group.traverse(o => { const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial; if (m?.emissive) m.emissive.setHex(0x2a2108); });
  pins.highlight(id);
  canvas.classList.toggle('hover', !!id);
}
function pickAt(sx: number, sy: number) {
  const r = canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((sx - r.left) / r.width) * 2 - 1, -((sy - r.top) / r.height) * 2 + 1), rig.camera);
  const hits = ray.intersectObjects(places.filter(p => p.view === view).flatMap(p => p.hit), false);
  return hits.length ? (hits[0].object.userData.place as string) : null;
}
canvas.addEventListener('pointermove', e => { if (!(e.buttons & 1)) hover(pickAt(e.clientX, e.clientY)); });
canvas.addEventListener('pointerleave', () => hover(null));
canvas.addEventListener('pointerup', e => { setTimeout(() => { if (rig.lastWasClick) { const id = pickAt(e.clientX, e.clientY); if (id) open(id); } }, 0); });
const toastEl = document.getElementById('toast')!;
let toastT = 0;
function open(id: string) {
  const p = placeOf(id); if (!p) return;
  toastEl.textContent = 'Aquí se abriría: ' + (p.kind === 'station' ? 'Estación ' + p.name : p.name);
  toastEl.style.opacity = '1'; clearTimeout(toastT); toastT = window.setTimeout(() => (toastEl.style.opacity = '0'), 1600);
}

// ---------- station strip, zoom buttons ----------
const strip = new Strip(document.getElementById('strip')!, i => rig.flyTo(stationX(i), -0.5, Math.max(rig.zoom, 1.1)));
document.getElementById('zin')!.onclick = () => rig.flyTo(rig.target.x, rig.target.z, rig.zoom * 1.35, 300);
document.getElementById('zout')!.onclick = () => rig.flyTo(rig.target.x, rig.target.z, rig.zoom / 1.35, 300);
const levelBars = [...document.querySelectorAll('#zlev span')];
let hinted = false;
canvas.addEventListener('pointerdown', () => { if (!hinted) { hinted = true; setTimeout(() => (document.getElementById('hint')!.style.opacity = '0'), 2500); } });

rig.onChange = () => {
  const lvl = rig.level;
  app.dataset.level = lvl;
  crowdSup.showFaces = crowdSub.showFaces = lvl === 'near';
  levelBars.forEach((s, i) => s.classList.toggle('on', i <= (lvl === 'far' ? 0 : lvl === 'mid' ? 1 : 2)));
};
rig.apply();

// ---------- loop ----------
const fpsEl = document.getElementById('fps')!;
let last = performance.now(), frames = 0, fpsT = last, lastReal = last;
function loop(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const realDt = Math.min(0.25, (now - lastReal) / 1000); lastReal = now;
  clock.t += dt;
  rig.tick(now, dt);
  if (fade !== fadeTo) { fade += Math.sign(fadeTo - fade) * Math.min(Math.abs(fadeTo - fade), realDt / 0.8); applyFade(); }
  updateSignals(sup.crossings, clock.t);
  buses.update(dt, clock.t); trains.update(dt, clock.t);
  lifeSup.update(); lifeSub.update();
  crowdSup.update(dt, rig.camera); crowdSub.update(dt, rig.camera);
  pins.update(); strip.update(rig.target.x, rig.camera, canvas);
  composer.render();
  frames++;
  if (now - fpsT > 1000) { fpsEl.textContent = `${Math.round(frames * 1000 / (now - fpsT))} fps`; frames = 0; fpsT = now; }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// test hooks (used by the automated checks)
Object.assign(window as unknown as Record<string, unknown>, { __bq: { rig, setView, crowdSup, crowdSub, buses, trains, clock, pickAt, places, sup, SLICE } });

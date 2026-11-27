import './catalog.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { Geo, rng } from '../engine/geo';
import { Group, Look, ModelDef, Version, approved, model, models, status } from '../models';

// ---------- renderer & scene ----------
const canvas = document.getElementById('view') as HTMLCanvasElement;
const stage = document.getElementById('stage')!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const outline = new OutlineEffect(renderer, { defaultThickness: 0.008, defaultColor: [0.1, 0.08, 0.12] });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 500);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.autoRotateSpeed = 0.9; controls.autoRotate = true;
controls.maxPolarAngle = Math.PI * 0.47; controls.minPolarAngle = 0.15;

const hemi = new THREE.HemisphereLight(0x8d97c4, 0x1a1530, 1.05);
const amb = new THREE.AmbientLight(0xffd9a8, 0.2);
const sun = new THREE.DirectionalLight(0xd2dcff, 1.75);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
scene.add(hemi, amb, sun, sun.target);
const floor = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshStandardMaterial({ color: 0x111a44, roughness: 1 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.position.y = -0.27; scene.add(floor);

let day = false;
function setLight(isDay: boolean) {
  day = isDay;
  stage.classList.toggle('day', day);
  hemi.color.set(day ? 0xdfe9ff : 0x8d97c4); hemi.groundColor.set(day ? 0x8a7a66 : 0x1a1530); hemi.intensity = day ? 1.3 : 1.05;
  sun.color.set(day ? 0xfff1dc : 0xd2dcff); sun.intensity = day ? 2.6 : 1.75;
  amb.intensity = day ? 0.15 : 0.2;
  renderer.toneMappingExposure = day ? 1.05 : 1.0;
  (floor.material as THREE.MeshStandardMaterial).color.set(day ? 0xb7c3d6 : 0x111a44);
  glowMat.color.setScalar(day ? 0.85 : 1.12);
  document.querySelectorAll('#light button').forEach(b => b.classList.toggle('on', (b as HTMLElement).dataset.l === (day ? 'day' : 'night')));
}

// ---------- materials per look ----------
const toonRamp = (() => { const t = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const solidMats: Record<Look, THREE.Material> = {
  flat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, flatShading: true }),
  smooth: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62 }),
  toon: new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonRamp }),
};
solidMats.flat.userData.outlineParameters = { visible: false };
solidMats.smooth.userData.outlineParameters = { visible: false };
const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, color: new THREE.Color(1.12, 1.12, 1.12) });
glowMat.userData.outlineParameters = { visible: false };

// ---------- building a model ----------
function buildVersion(v: Version, withPerson: boolean) {
  const g = new Geo();
  v.build(g, rng(7), { x: 0, z: 0, ...v.defaults } as never);
  const grp = g.build(solidMats[v.look ?? 'flat'], glowMat);
  const box = new THREE.Box3().setFromObject(grp);
  const c = box.getCenter(new THREE.Vector3());
  grp.position.set(-c.x, -box.min.y, -c.z);
  if (withPerson) {
    const pg = new Geo();
    approved('persona').build(pg, rng(1), { x: 0, z: 0, ...approved('persona').defaults } as never);
    const p = pg.build(solidMats.flat, glowMat);
    p.position.set(box.max.x - c.x + 0.25, 0, box.max.z - c.z - 0.1);
    grp.add(p);
  }
  return { grp, size: box.getSize(new THREE.Vector3()) };
}

const holder = new THREE.Group(); scene.add(holder);
let current: ModelDef | null = null, version = '', compare = false, all = false, withPerson = false;
const tagsEl = document.getElementById('tags')!;
let tags: { el: HTMLDivElement; at: THREE.Vector3 }[] = [];

function show() {
  holder.clear(); tagsEl.innerHTML = ''; tags = [];
  if (!current) return;
  const items: { v: Version; label: string }[] = [];
  if (all) for (const id of ['estilo-a', 'estilo-b', 'estilo-c']) { const m = model(id); items.push({ v: m.versions[m.approved], label: m.name }); }
  else {
    items.push({ v: current.versions[version], label: compare ? `${version} (en revisión)` : '' });
    if (compare && current.review && version !== current.approved) items.unshift({ v: current.versions[current.approved], label: `${current.approved} (aprobada)` });
  }
  let x = 0, maxR = 0;
  const built = items.map(it => ({ ...it, ...buildVersion(it.v, withPerson) }));
  const gap = 1.2, total = built.reduce((s, b) => s + b.size.x, 0) + gap * (built.length - 1);
  x = -total / 2;
  for (const b of built) {
    b.grp.position.x += x + b.size.x / 2;
    holder.add(b.grp);
    if (b.label) {
      const el = document.createElement('div'); el.textContent = b.label; tagsEl.appendChild(el);
      tags.push({ el, at: new THREE.Vector3(x + b.size.x / 2, b.size.y + 0.35, 0) });
    }
    x += b.size.x + gap;
    maxR = Math.max(maxR, b.size.y);
  }
  const R = Math.max(total, ...built.map(b => b.size.z), maxR * 1.6) * 0.62 + 0.4;
  floor.scale.setScalar(R * 1.25);
  sun.position.set(-R * 1.2, R * 1.8, R * 1.4); sun.target.position.set(0, 0, 0);
  Object.assign(sun.shadow.camera, { left: -R * 1.4, right: R * 1.4, top: R * 1.4, bottom: -R * 1.4, near: 0.1, far: R * 6 });
  sun.shadow.camera.updateProjectionMatrix();
  controls.target.set(0, maxR * 0.35, 0);
  // frame the whole thing: distance from its bounding sphere and the camera's field of view
  const depth = Math.max(...built.map(b => b.size.z)), sphere = Math.hypot(total, depth, maxR) / 2;
  const fov = THREE.MathUtils.degToRad(camera.fov) * Math.min(1, camera.aspect);
  const fit = (stage.clientHeight + 100) / stage.clientHeight;   // the view offset crops the picture a little
  const dist = sphere / Math.sin(fov / 2) * 1.15 * fit;
  camera.position.set(dist * 0.55, dist * 0.55, dist * 0.75);
  camera.near = dist / 100; camera.far = dist * 10; camera.updateProjectionMatrix();
  controls.minDistance = R * 0.5; controls.maxDistance = R * 6;
}

// ---------- side list & info ----------
const GROUPS: Group[] = ['Estilo', 'Barrios', 'Estaciones', 'Transporte', 'Personas', 'Protagonistas'];
const listEl = document.getElementById('list')!;
function stOf(m: ModelDef) { return m.catalogOnly ? 'study' : status(m) === 'aprobado' ? 'ok' : 'rev'; }
function renderList() {
  let s = '';
  for (const gname of GROUPS) {
    const ms = models().filter(m => m.group === gname);
    if (!ms.length) continue;
    s += `<h3>${gname === 'Estilo' ? 'Estilo · elige uno' : gname}</h3>`;
    for (const m of ms) s += `<button data-id="${m.id}" class="${current?.id === m.id ? 'on' : ''}"><span class="dot ${stOf(m)}"></span><span class="nm">${m.name}</span><span class="vv">${Object.keys(m.versions).length > 1 ? Object.keys(m.versions).length + ' versiones' : ''}</span></button>`;
  }
  listEl.innerHTML = s;
  listEl.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.onclick = () => select(b.dataset.id!));
}
function renderInfo() {
  if (!current) return;
  const m = current, v = m.versions[version];
  document.getElementById('name')!.textContent = m.name;
  const st = document.getElementById('status')!;
  const k = stOf(m); st.className = 'st ' + k; st.textContent = k === 'study' ? 'estudio de estilo' : k === 'ok' ? 'aprobado' : 'en revisión';
  document.getElementById('versions')!.innerHTML = Object.keys(m.versions).map(id =>
    `<button data-v="${id}" class="${id === version ? 'on' : ''}">${id}<small>${id === m.approved ? 'aprobada' : id === m.review ? 'en revisión' : ''}</small></button>`).join('');
  document.querySelectorAll<HTMLButtonElement>('#versions button').forEach(b => b.onclick = () => { version = b.dataset.v!; renderInfo(); show(); });
  document.getElementById('meta')!.textContent = `${version} · ${v.date}`;
  document.getElementById('notes')!.textContent = v.notes;
  document.getElementById('askname')!.textContent = m.name;
  const cmp = document.getElementById('compare')!; cmp.hidden = !m.review; cmp.classList.toggle('on', compare);
  const allB = document.getElementById('all')!; allB.hidden = m.group !== 'Estilo'; allB.classList.toggle('on', all);
}
function select(id: string) {
  current = model(id); version = current.review ?? current.approved; compare = false; all = false;
  history.replaceState(null, '', '#' + id);
  renderList(); renderInfo(); show();
}

// ---------- toolbar ----------
document.querySelectorAll<HTMLButtonElement>('#light button').forEach(b => b.onclick = () => setLight(b.dataset.l === 'day'));
const tg = (id: string, fn: (on: boolean) => void) => { const b = document.getElementById(id)!; b.onclick = () => { const on = !b.classList.contains('on'); b.classList.toggle('on', on); fn(on); }; };
tg('spin', on => (controls.autoRotate = on));
tg('scale', on => { withPerson = on; show(); });
tg('compare', on => { compare = on; show(); });
tg('all', on => { all = on; show(); });

// ---------- loop ----------
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  // keep the model clear of the info card (bottom-left): shift the picture right and up
  camera.setViewOffset(w + 300, h + 100, 0, 100, w, h);
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
const v3 = new THREE.Vector3();
function loop() {
  controls.update();
  const toon = holder.children.some(c => c.children.some(m => (m as THREE.Mesh).material === solidMats.toon));
  if (toon) outline.render(scene, camera); else renderer.render(scene, camera);
  for (const t of tags) { v3.copy(t.at).project(camera); t.el.style.left = `${(v3.x * 0.5 + 0.5) * stage.clientWidth}px`; t.el.style.top = `${(-v3.y * 0.5 + 0.5) * stage.clientHeight}px`; }
  requestAnimationFrame(loop);
}
setLight(false);
const first = location.hash.slice(1);
select(models().some(m => m.id === first) ? first : 'estilo-b');
requestAnimationFrame(loop);
Object.assign(window as unknown as Record<string, unknown>, { __cat: { select, setLight, models, show: () => show(), setAll: (on: boolean) => { all = on; show(); }, controls } });

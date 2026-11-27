import './catalog.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Geo, rng } from '../engine/geo';
import { Group, Look, ModelDef, Setting, Version, approved, model, models, status } from '../models';
import { loadAll, save, Saved, where } from './store';

type P = Record<string, number | boolean | string>;

// ---------- renderer, light, ambient occlusion ----------
const canvas = document.getElementById('view') as HTMLCanvasElement;
const stage = document.getElementById('stage')!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 500);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.autoRotateSpeed = 0.8; controls.autoRotate = true;
controls.maxPolarAngle = Math.PI * 0.47; controls.minPolarAngle = 0.12;
const hemi = new THREE.HemisphereLight(0xffffff, 0xb9a88f, 1.4);
const sun = new THREE.DirectionalLight(0xfff3e2, 2.2);
const fill = new THREE.DirectionalLight(0xdfe8ff, 0.6);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 8; sun.shadow.blurSamples = 16; sun.shadow.bias = -0.0004;
scene.add(hemi, sun, sun.target, fill);
const floor = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.ShadowMaterial({ opacity: 0.18 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
let ao: GTAOPass | null = null;
try { ao = new GTAOPass(scene, camera, 1, 1); ao.blendIntensity = 0.85; composer.addPass(ao); } catch { ao = null; }
composer.addPass(new OutputPass());

const solidMats: Record<Look, THREE.Material> = {
  flat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, flatShading: true }),
  smooth: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 }),
  toon: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 }),
};
const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });

function setLight(n: boolean) {
  night = n;
  stage.classList.toggle('night', n);
  hemi.color.set(n ? 0x8d97c4 : 0xffffff); hemi.groundColor.set(n ? 0x1a1530 : 0xb9a88f); hemi.intensity = n ? 1.0 : 1.4;
  sun.color.set(n ? 0xc8d4ff : 0xfff3e2); sun.intensity = n ? 1.4 : 2.2; fill.intensity = n ? 0.15 : 0.6;
  (floor.material as THREE.ShadowMaterial).opacity = n ? 0.35 : 0.18;
  glowMat.color.setScalar(n ? 1.12 : 0.92);
  document.querySelectorAll('#light button').forEach(b => b.classList.toggle('on', (b as HTMLElement).dataset.l === (n ? 'night' : 'day')));
  schedule();
}

// ---------- state ----------
let saved = new Map<string, Saved>();
let night = false;
let current: ModelDef | null = null, version = '', compare = false, withPerson = false;
let params: P = {};                    // what the editor shows now
let base: P = {};                      // the version's defaults

function buildOne(v: Version, p: P, withP: boolean) {
  const g = new Geo();
  v.build(g, rng(7), { x: 0, z: 0, ...p, noche: night } as never);
  const grp = g.build(solidMats[v.look ?? 'flat'], glowMat);
  const box = new THREE.Box3().setFromObject(grp);
  const c = box.getCenter(new THREE.Vector3());
  grp.position.set(-c.x, -box.min.y, -c.z);
  if (withP) {
    const m = model('persona');
    const use = m.review ? m.versions[m.review] : approved('persona');
    const pp = m.review && saved.get('persona')?.base === m.review ? { ...use.defaults, ...saved.get('persona')!.params } : use.defaults;
    const pg = new Geo(); use.build(pg, rng(1), { x: 0, z: 0, ...pp } as never);
    const pm = pg.build(solidMats.smooth, glowMat);
    pm.position.set(box.max.x - c.x + 0.2, 0, box.max.z - c.z - 0.15);
    grp.add(pm);
  }
  return { grp, size: box.getSize(new THREE.Vector3()) };
}

const holder = new THREE.Group(); scene.add(holder);
const tagsEl = document.getElementById('tags')!;
let tags: { el: HTMLDivElement; at: THREE.Vector3 }[] = [];
let framedFor = '', framedSize = 0;
function rebuild() {
  holder.traverse(o => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); });
  holder.clear(); tagsEl.innerHTML = ''; tags = [];
  if (!current) return;
  const items: { v: Version; p: P; label: string }[] = [{ v: current.versions[version], p: params, label: compare ? 'tu versión' : '' }];
  if (compare && version !== current.approved) items.unshift({ v: current.versions[current.approved], p: current.versions[current.approved].defaults as P, label: `${current.approved} (la que usa el juego)` });
  const built = items.map(it => ({ ...it, ...buildOne(it.v, it.p, withPerson) }));
  const gap = 0.9, total = built.reduce((s, b) => s + b.size.x, 0) + gap * (built.length - 1);
  let x = -total / 2, maxH = 0;
  for (const b of built) {
    b.grp.position.x += x + b.size.x / 2; holder.add(b.grp);
    if (b.label) { const el = document.createElement('div'); el.textContent = b.label; tagsEl.appendChild(el); tags.push({ el, at: new THREE.Vector3(x + b.size.x / 2, b.size.y + 0.25, 0) }); }
    x += b.size.x + gap; maxH = Math.max(maxH, b.size.y);
  }
  const depth = Math.max(...built.map(b => b.size.z));
  const R = Math.max(total, depth, maxH) * 0.75 + 0.3;
  floor.scale.setScalar(R * 2);
  sun.position.set(-R * 1.1, R * 2.2, R * 1.6); fill.position.set(R * 2, R, -R);
  Object.assign(sun.shadow.camera, { left: -R * 1.3, right: R * 1.3, top: R * 1.3, bottom: -R * 1.3, near: 0.1, far: R * 8 });
  sun.shadow.camera.updateProjectionMatrix();
  // reframe only when the model or the comparison changes, never while a slider moves
  const key = `${current.id}|${version}|${compare}|${withPerson}`;
  const sphere = Math.hypot(total, depth, maxH) / 2;
  if (key !== framedFor || sphere > framedSize * 1.2 || sphere < framedSize * 0.6) {
    framedFor = key; framedSize = sphere;
    const fov = THREE.MathUtils.degToRad(camera.fov) * Math.min(1, camera.aspect);
    const dist = Math.max(sphere, 0.9) / Math.sin(fov / 2) * 1.7;
    controls.target.set(0, maxH * 0.4, 0);
    camera.position.set(dist * 0.6, dist * 0.5, dist * 0.68);
    camera.near = dist / 100; camera.far = dist * 10; camera.updateProjectionMatrix();
    controls.minDistance = sphere * 0.6; controls.maxDistance = sphere * 6;
  }
}
let pending = false;
function schedule() { if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; rebuild(); }); } }

// ---------- list & info ----------
const GROUPS: Group[] = ['Barrios', 'Estaciones', 'Transporte', 'Personas', 'Protagonistas'];
const listEl = document.getElementById('list')!;
const stOf = (m: ModelDef) => (status(m) === 'aprobado' ? 'ok' : 'rev');
function renderList() {
  listEl.innerHTML = '';
  for (const gname of GROUPS) {
    const ms = models().filter(m => m.group === gname && !m.catalogOnly);
    if (!ms.length) continue;
    const h = document.createElement('h3'); h.textContent = gname; listEl.appendChild(h);
    for (const m of ms) {
      const b = document.createElement('button');
      b.className = current?.id === m.id ? 'on' : '';
      b.dataset.id = m.id;
      b.innerHTML = `<span class="dot ${stOf(m)}"></span><span class="nm"></span>${saved.has(m.id) ? '<span class="ed" title="con tus ajustes guardados">✎</span>' : ''}`;
      (b.querySelector('.nm') as HTMLElement).textContent = m.name;
      b.onclick = () => select(m.id);
      listEl.appendChild(b);
    }
  }
}
function renderInfo() {
  if (!current) return;
  const m = current, v = m.versions[version];
  document.getElementById('name')!.textContent = m.name;
  const st = document.getElementById('status')!; st.className = 'st ' + stOf(m); st.textContent = stOf(m) === 'ok' ? 'aprobado' : 'en revisión';
  const vb = document.getElementById('versions')!; vb.innerHTML = '';
  for (const id of Object.keys(m.versions)) {
    const b = document.createElement('button'); b.className = id === version ? 'on' : '';
    b.innerHTML = `${id}<small>${id === m.approved ? 'la usa el juego' : id === m.review ? 'en revisión' : ''}</small>`;
    b.onclick = () => { version = id; loadParams(); renderInfo(); renderEditor(); schedule(); };
    vb.appendChild(b);
  }
  document.getElementById('notes')!.textContent = v.notes;
  const cmp = document.getElementById('compare')!; cmp.hidden = version === m.approved; cmp.classList.toggle('on', compare);
}

// ---------- editor ----------
const ctlEl = document.getElementById('controls')!, estatus = document.getElementById('estatus')!;
const note = document.getElementById('note') as HTMLTextAreaElement;
const hex = (v: unknown) => (typeof v === 'string' ? v : '#' + Number(v).toString(16).padStart(6, '0'));
function loadParams() {
  const v = current!.versions[version];
  base = { ...(v.defaults as P) };
  const s = saved.get(current!.id);
  params = s && s.base === version ? { ...base, ...s.params } : { ...base };
  note.value = s && s.base === version ? s.nota : '';
}
function savedRef() { const s = saved.get(current!.id); return s && s.base === version ? { ...base, ...s.params } : base; }
function dirty() { return JSON.stringify(savedRef()) !== JSON.stringify(params); }
function renderStatus() {
  if (!current!.versions[version].settings) { estatus.textContent = ''; return; }
  const s = saved.get(current!.id);
  const noteChanged = (s?.base === version ? s.nota : '') !== note.value.trim();
  if (dirty() || noteChanged) estatus.innerHTML = '<b>Cambios sin guardar.</b>';
  else if (s && s.base === version) {
    const t = new Date(s.guardado);
    const when = `${t.toLocaleDateString('es-EC')} ${t.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`;
    estatus.textContent = where === 'nube' ? `Guardado ${when}. Para pasarlo a una versión nueva, dime: «revisa los ajustes de ${current!.name}».` : `Guardado ${when} en este navegador.`;
  } else estatus.textContent = 'Mueve los controles: el modelo cambia al instante.';
  (document.getElementById('bsave') as HTMLButtonElement).disabled = !(dirty() || noteChanged);
}
function renderEditor() {
  const v = current!.versions[version];
  document.getElementById('ebase')!.textContent = `${current!.name} · sobre ${version}`;
  ctlEl.innerHTML = '';
  if (!v.settings) {
    const d = document.createElement('div'); d.className = 'empty';
    const alt = Object.entries(current!.versions).find(([, x]) => x.settings);
    d.textContent = alt ? `Esta versión no se puede ajustar. Elige ${alt[0]} (estilo nuevo) en la ficha para editarla.` : 'Este modelo todavía no tiene ajustes. Pídeme su versión en el estilo nuevo y la hago editable.';
    ctlEl.appendChild(d);
    document.getElementById('save')!.style.display = 'none';
    return;
  }
  document.getElementById('save')!.style.display = '';
  let group = '';
  for (const s of v.settings) {
    if (s.group && s.group !== group) { group = s.group; const h = document.createElement('h4'); h.textContent = group; ctlEl.appendChild(h); }
    ctlEl.appendChild(control(s));
  }
  renderStatus();
}
function control(s: Setting) {
  const row = document.createElement('label'); row.className = 'ctl'; row.dataset.k = s.k;
  const name = document.createElement('span'); name.textContent = s.label; row.appendChild(name);
  const mark = () => { row.classList.toggle('changed', String(params[s.k]) !== String(base[s.k])); renderStatus(); schedule(); };
  if (s.t === 'num') {
    const val = document.createElement('span'); val.className = 'val';
    const r = document.createElement('input'); r.type = 'range'; r.min = String(s.min); r.max = String(s.max); r.step = String(s.step); r.value = String(params[s.k]);
    const fmt = () => (val.textContent = s.step >= 1 ? String(Math.round(Number(r.value))) : Number(r.value).toFixed(s.step < 0.01 ? 3 : 2));
    r.oninput = () => { params[s.k] = Number(r.value); fmt(); mark(); };
    fmt(); row.append(val, r);
  } else if (s.t === 'color') {
    const c = document.createElement('input'); c.type = 'color'; c.value = hex(params[s.k]);
    c.oninput = () => { params[s.k] = c.value.toUpperCase(); mark(); };
    row.appendChild(c);
  } else if (s.t === 'bool') {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'sw' + (params[s.k] ? ' on' : '');
    b.onclick = e => { e.preventDefault(); params[s.k] = !params[s.k]; b.classList.toggle('on', !!params[s.k]); mark(); };
    row.appendChild(b);
  } else {
    const sel = document.createElement('select');
    for (const [k, l] of s.opts) { const o = document.createElement('option'); o.value = k; o.textContent = l; sel.appendChild(o); }
    sel.value = String(params[s.k]); sel.onchange = () => { params[s.k] = sel.value; mark(); };
    row.appendChild(sel);
  }
  row.classList.toggle('changed', String(params[s.k]) !== String(base[s.k]));
  return row;
}
note.oninput = () => renderStatus();
document.getElementById('bundo')!.onclick = () => { loadParams(); renderEditor(); schedule(); };
document.getElementById('bbase')!.onclick = () => { params = { ...base }; renderEditor(); schedule(); };
document.getElementById('bsave')!.onclick = async () => {
  const prev = saved.get(current!.id);
  const changed: P = {};
  for (const k in params) if (String(params[k]) !== String(base[k])) changed[k] = params[k];
  const s: Saved = { model: current!.id, base: version, params: changed, nota: note.value.trim(), guardado: new Date().toISOString(), n: (prev?.n ?? 0) + 1 };
  estatus.textContent = 'Guardando…';
  try { await save(s); saved.set(s.model, s); renderList(); renderStatus(); }
  catch { saved.set(s.model, s); renderList(); estatus.innerHTML = '<b>No se pudo guardar en la nube.</b> Quedó en este navegador; vuelve a intentar en un momento.'; }
};

function select(id: string) {
  current = model(id); version = current.review ?? current.approved; compare = false;
  history.replaceState(null, '', '#' + id);
  loadParams(); renderList(); renderInfo(); renderEditor(); schedule();
}

// ---------- toolbar ----------
document.querySelectorAll<HTMLButtonElement>('#light button').forEach(b => b.onclick = () => setLight(b.dataset.l === 'night'));
const tg = (id: string, fn: (on: boolean) => void) => { const b = document.getElementById(id)!; b.onclick = () => { const on = !b.classList.contains('on'); b.classList.toggle('on', on); fn(on); }; };
tg('spin', on => (controls.autoRotate = on));
tg('scale', on => { withPerson = on; schedule(); });
tg('compare', on => { compare = on; schedule(); });

// ---------- loop ----------
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h; camera.setViewOffset(w + 220, h + 120, 0, 120, w, h); camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
const v3 = new THREE.Vector3();
function loop() {
  controls.update();
  composer.render();
  for (const t of tags) { v3.copy(t.at).project(camera); t.el.style.left = `${(v3.x * 0.5 + 0.5) * stage.clientWidth}px`; t.el.style.top = `${(-v3.y * 0.5 + 0.5) * stage.clientHeight}px`; }
  requestAnimationFrame(loop);
}
const first = location.hash.slice(1);
select(models().some(m => m.id === first) ? first : 'edificio');
setLight(false);
requestAnimationFrame(loop);
loadAll().then(s => { saved = s; if (current) { loadParams(); renderList(); renderEditor(); schedule(); } });
Object.assign(window as unknown as Record<string, unknown>, { __cat: { select, setLight, controls, get params() { return params; } } });

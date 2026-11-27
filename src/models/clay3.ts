import { Geo, Rng } from '../engine/geo';
import { ModelDef, Params, Setting } from './registry';
import { tint } from './city';

/**
 * Buildings the game needs and the 3D city did not have yet: Medios, Terminal de buses,
 * Taller y cocheras, Control de trenes. Same «arcilla» style, editable in the workshop.
 * Some settings are driven by the game (marked «en el juego…»).
 */
const num = (p: Params, k: string) => Number(p[k]);
const col = (p: Params, k: string) => { const v = p[k]; return typeof v === 'string' ? parseInt(v.replace('#', ''), 16) : Number(v); };
const on = (p: Params, k: string) => p[k] === true || p[k] === 'true';
const night = (p: Params) => p.noche !== false;
const D = '2026-11-27', C = 'Color';

// ---------------- Medios (canal de TV y radio) ----------------
export function medios(g: Geo, r: Rng, p: Params) {
  const { x, z } = p, w = num(p, 'ancho'), d = num(p, 'fondo'), fl = Math.round(num(p, 'pisos')), fh = 0.4;
  const wall = col(p, 'fachada'), glass = col(p, 'vidrio'), scr = col(p, 'pantalla');
  const h = fl * fh + 0.1;
  g.tag('base'); g.roundBox(x - 0.1, 0, z - 0.1, w + 0.2, 0.42, d + 0.2, tint(wall, 0.85), 0.04);
  g.tag('torre'); g.roundBox(x, 0, z, w, h, d, wall, 0.05);
  g.tag('ventanas');
  const cols = Math.max(2, Math.round(w / 0.3)), side = Math.max(2, Math.round(d / 0.3));
  for (let f = 1; f < fl; f++) {
    const y = f * fh + 0.08;
    // continuous glass bands, some lit at night
    g.box(x + 0.06, y, z + d - 0.005, w - 0.12, fh * 0.6, 0.012, glass);
    g.box(x + w - 0.005, y, z + 0.06, 0.012, fh * 0.6, d - 0.12, tint(glass, 0.9));
    for (let c = 0; c < cols; c++) if (night(p) && r.chance(0.28)) g.box(x + 0.08 + c * (w - 0.16) / cols, y + 0.03, z + d + 0.004, (w - 0.16) / cols - 0.03, fh * 0.5, 0.006, 0xffd58a, true);
    for (let c = 0; c < side; c++) if (night(p) && r.chance(0.25)) g.box(x + w + 0.004, y + 0.03, z + 0.08 + c * (d - 0.16) / side, 0.006, fh * 0.5, (d - 0.16) / side - 0.03, 0xffd58a, true);
  }
  g.mark('fachada de vidrio', x, fh, z + d, x + w, h, z + d + 0.01);
  if (on(p, 'conPantalla')) {
    g.tag('pantalla');
    const sy = h * 0.42;
    g.roundBox(x + 0.08, sy - 0.05, z + d, w - 0.16, 0.62, 0.08, 0x141a33, 0.02);
    g.panelZ(x + 0.14, sy, z + d + 0.085, w - 0.28, 0.52, scr, true);
    g.mark('pantalla', x + 0.14, sy, z + d + 0.08, x + w - 0.14, sy + 0.52, z + d + 0.09);
  }
  g.tag('techo'); g.roundBox(x + 0.05, h, z + 0.05, w - 0.1, 0.12, d - 0.1, tint(wall, 1.15), 0.03);
  if (on(p, 'antena')) {
    g.tag('antena');
    const ax = x + w * 0.62, az = z + d * 0.45, ah = num(p, 'altoAntena');
    g.cyl(ax, h + 0.12, az, 0.035, ah, 0xcfd6e6, 8);
    for (let k = 1; k <= 3; k++) g.box(ax - 0.12 + k * 0.01, h + 0.12 + ah * k / 4, az - 0.01, 0.24 - k * 0.04, 0.02, 0.02, 0xcfd6e6);
    g.sphere(ax, h + 0.14 + ah, az, 0.05, 0xff5a4a, 8, true);
    g.tag('parabólicas'); for (const [dx, dz] of [[0.25, 0.3], [0.5, d - 0.35]]) { g.cyl(x + dx, h + 0.12, z + dz, 0.02, 0.1, 0x9aa6c4); g.rbox(x + dx, h + 0.28, z + dz, 0.26, 0.04, 0.26, 0.6, 0, 0, 0xe6ebf5, 0.02); }
  }
  g.tag('entrada'); g.roundBox(x + w * 0.3, 0, z + d + 0.08, w * 0.4, 0.38, 0.32, tint(wall, 1.2), 0.03);
  g.panelZ(x + w * 0.36, 0.02, z + d + 0.405, w * 0.28, 0.28, night(p) ? 0xffe3a0 : glass, night(p));
}

// ---------------- Terminal de buses ----------------
export function terminal(g: Geo, _r: Rng, p: Params) {
  const { x, z } = p, w = num(p, 'ancho'), d = num(p, 'fondo'), n = Math.round(num(p, 'arcos'));
  const roof = col(p, 'techo'), floor = col(p, 'piso'), frame = col(p, 'estructura');
  g.tag('piso'); g.roundBox(x, 0, z, w, 0.05, d, floor, 0.02);
  g.tag('andenes');
  const bays = 3;
  for (let b = 0; b < bays; b++) {
    const bz = z + 0.35 + b * (d - 0.7) / bays;
    g.roundBox(x + 0.3, 0.05, bz, w - 0.6, 0.08, 0.22, tint(floor, 1.18), 0.02);
    g.box(x + 0.3, 0.131, bz + 0.2, w - 0.6, 0.004, 0.02, 0xffc857, true);
  }
  g.tag('estructura');
  for (let k = 0; k <= n; k++) {
    const ax = x + 0.1 + k * (w - 0.2) / n;
    for (const az of [z + 0.12, z + d - 0.2]) g.roundBox(ax - 0.04, 0, az, 0.08, 1.1, 0.08, frame, 0.02);
  }
  g.tag('techo');
  // a sequence of soft vaults along the terminal
  for (let k = 0; k < n; k++) {
    const ax = x + 0.1 + k * (w - 0.2) / n, aw = (w - 0.2) / n;
    for (let s = 0; s < 6; s++) {
      const a0 = Math.PI * s / 6, a1 = Math.PI * (s + 1) / 6;
      const zc = z + d / 2, R = d / 2;
      const y0 = 1.1 + Math.sin(a0) * 0.32, y1 = 1.1 + Math.sin(a1) * 0.32;
      const z0 = zc - Math.cos(a0) * R, z1 = zc - Math.cos(a1) * R;
      g.rbox(ax + aw / 2, (y0 + y1) / 2, (z0 + z1) / 2, aw - 0.03, 0.05, Math.hypot(z1 - z0, y1 - y0) + 0.02, Math.atan2(y1 - y0, z1 - z0) * -1, 0, 0, s % 2 ? roof : tint(roof, 1.08), 0.015);
    }
  }
  g.mark('techo de bóvedas', x, 1.1, z, x + w, 1.45, z + d);
  g.tag('letrero'); g.roundBox(x + w / 2 - 0.9, 1.1, z + d - 0.12, 1.8, 0.28, 0.06, 0x173e86, 0.03);
  g.panelZ(x + w / 2 - 0.8, 1.14, z + d - 0.055, 1.6, 0.2, 0xcfe0ff, true);
  const nb = Math.round(num(p, 'buses'));
  if (nb > 0) {
    g.tag('buses');
    const colors = [0x3dbe8b, 0xffc857, 0xff8a5b, 0x9fd3ff];
    for (let b = 0; b < Math.min(nb, 6); b++) {
      const bay = b % bays, slot = Math.floor(b / bays);
      const bz = z + 0.35 + bay * (d - 0.7) / bays + 0.3, bx = x + 0.6 + slot * 1.9;
      const c = colors[b % colors.length];
      g.roundBox(bx, 0.1, bz, 1.6, 0.5, 0.5, c, 0.1);
      g.roundBox(bx + 0.12, 0.33, bz - 0.01, 1.3, 0.16, 0.52, night(p) ? 0xfff0c8 : 0xa9d6f0, 0.04);
      for (const wx of [0.28, 1.25]) for (const wz of [-0.01, 0.46]) g.wheel(bx + wx, 0.1, bz + wz + 0.02, 0.09, 0.06, 0x1b2340);
    }
  }
  if (on(p, 'reloj')) { g.tag('reloj'); g.cyl(x + 0.25, 0, z + d - 0.35, 0.04, 1.3, frame); g.roundBox(x + 0.13, 1.3, z + d - 0.4, 0.24, 0.24, 0.1, 0xf2eadb, 0.04); }
}

// ---------------- Taller y cocheras (bajo tierra) ----------------
export function taller(g: Geo, _r: Rng, p: Params) {
  const { x, z } = p, Y = num(p, 'y'), w = num(p, 'ancho'), d = num(p, 'fondo');
  const wall = col(p, 'pared'), floor = col(p, 'piso'), body = col(p, 'trenes');
  g.tag('piso'); g.plane(x, Y + 0.01, z, w, d, floor);
  g.tag('paredes'); g.roundBox(x, Y, z - 0.1, w, 1.6, 0.1, wall, 0.02); g.roundBox(x - 0.1, Y, z, 0.1, 1.6, d, tint(wall, 0.9), 0.02);
  g.roundBox(x, Y, z + d - 0.1, w, 0.25, 0.1, wall, 0.02);
  const tracks = 3;
  for (let k = 0; k < tracks; k++) {
    const tz = z + 0.6 + k * (d - 1.0) / (tracks - 1);
    g.tag('vías');
    for (const dz of [-0.2, 0.2]) g.box(x + 0.2, Y + 0.035, tz + dz - 0.015, w - 0.4, 0.035, 0.03, 0x8090c0);
    g.tag('fosas'); g.box(x + 0.8, Y + 0.012, tz - 0.12, w * 0.55, 0.004, 0.24, 0x0c0f24);
  }
  const nt = Math.round(num(p, 'trenesAdentro'));
  g.tag('trenes en revisión');
  for (let k = 0; k < Math.min(nt, tracks); k++) {
    const tz = z + 0.6 + k * (d - 1.0) / (tracks - 1) - 0.3, tx = x + 0.5 + (k % 2) * 0.7;
    for (let c = 0; c < 2; c++) {
      g.roundBox(tx + c * 1.8, Y + 0.12, tz, 1.72, 0.6, 0.6, body, 0.12);
      g.roundBox(tx + c * 1.8 + 0.02, Y + 0.2, tz - 0.008, 1.68, 0.06, 0.616, col(p, 'franja'), 0.02);
      g.roundBox(tx + c * 1.8 + 0.14, Y + 0.38, tz - 0.01, 1.44, 0.22, 0.62, 0x2a3466, 0.03);
    }
    if (k === 0) { g.tag('tren elevado'); for (const jx of [tx + 0.3, tx + 1.3]) g.box(jx, Y, tz + 0.2, 0.12, 0.12, 0.2, 0xffc857); }
  }
  g.tag('grúa');
  g.box(x + 0.3, Y + 1.55, z + 0.2, w - 0.6, 0.08, 0.1, 0xffc857);
  g.box(x + w * 0.45, Y + 1.0, z + 0.2, 0.06, 0.55, 0.06, 0x7f8fb8);
  g.tag('mesas de trabajo'); for (let k = 0; k < 3; k++) g.roundBox(x + w - 1.6 + k * 0.5, Y, z + 0.15, 0.4, 0.3, 0.25, 0x6b4a2e, 0.02);
  const nl = Math.round(num(p, 'luces'));
  g.tag('lámparas');
  for (let k = 0; k < 4; k++) {
    const lx = x + 0.8 + k * (w - 1.6) / 3;
    g.box(lx - 0.25, Y + 1.5, z + d / 2 - 0.05, 0.5, 0.04, 0.1, 0x2a3060);
    g.box(lx - 0.22, Y + 1.48, z + d / 2 - 0.03, 0.44, 0.02, 0.06, k < nl ? 0xfff3c4 : 0x3a4070, k < nl);
  }
  const nw = Math.round(num(p, 'trabajadores'));
  g.tag('personal');
  for (let k = 0; k < nw; k++) {
    const px = x + 0.6 + ((k * 0.37) % 1) * (w - 1.2), pz = z + 0.45 + (k % 3) * (d - 0.9) / 2 + 0.3;
    g.capsule(px, Y, pz, 0.05, 0.12, 0xff6b2c);
    g.sphere(px, Y + 0.28, pz, 0.045, 0xe8b896, 8);
    g.blob(px, Y + 0.31, pz, 0.05, 0xffc857, 0.55, 10);
  }
}

// ---------------- Control de trenes (bajo tierra) ----------------
export function control(g: Geo, _r: Rng, p: Params) {
  const { x, z } = p, Y = num(p, 'y'), w = num(p, 'ancho'), d = num(p, 'fondo');
  const wall = col(p, 'pared'), scr = col(p, 'pantallas');
  g.tag('piso'); g.plane(x, Y + 0.01, z, w, d, tint(wall, 0.7));
  g.tag('paredes'); g.roundBox(x, Y, z - 0.1, w, 1.5, 0.1, wall, 0.02); g.roundBox(x - 0.1, Y, z, 0.1, 1.5, d, tint(wall, 0.9), 0.02);
  g.roundBox(x, Y, z + d - 0.1, w, 0.25, 0.1, wall, 0.02);
  g.tag('mapa de la línea');
  g.roundBox(x + 0.2, Y + 0.55, z - 0.02, w - 0.4, 0.8, 0.05, 0x0e1430, 0.02);
  g.box(x + 0.35, Y + 0.95, z + 0.035, w - 0.7, 0.025, 0.01, 0x3d8bff, true);
  for (let k = 0; k < 15; k++) g.sphere(x + 0.35 + k * (w - 0.7) / 14, Y + 0.963, z + 0.04, 0.03, k % 5 === 2 ? 0xffc857 : 0xcfe0ff, 6, true);
  g.mark('mapa de la línea', x + 0.2, Y + 0.55, z, x + w - 0.2, Y + 1.35, z + 0.05);
  const ns = Math.round(num(p, 'puestos'));
  for (let k = 0; k < ns; k++) {
    const row = Math.floor(k / 3), cx = x + 0.5 + (k % 3) * (w - 1.0) / 2, cz = z + 0.75 + row * 0.75;
    g.tag('puestos'); g.roundBox(cx - 0.35, Y, cz, 0.7, 0.28, 0.32, 0x5d6a9c, 0.03);
    g.tag('pantallas'); for (const dx of [-0.2, 0.08]) { g.box(cx + dx - 0.02, Y + 0.28, cz + 0.02, 0.16, 0.12, 0.02, 0x141a33); g.panelZ(cx + dx - 0.01, Y + 0.29, cz + 0.045, 0.14, 0.1, scr, true); }
    if (on(p, 'operadores')) { g.tag('operadores'); g.capsule(cx - 0.05, Y, cz + 0.45, 0.05, 0.12, [0x2f79e0, 0x3dbe8b, 0xc9b6ff][k % 3]); g.sphere(cx - 0.05, Y + 0.28, cz + 0.45, 0.045, 0xe8b896, 8); }
  }
}

// ---------------- registration ----------------
const S: Record<string, Setting[]> = {
  medios: [
    { k: 'pisos', label: 'Pisos', t: 'num', min: 4, max: 14, step: 1, group: 'Forma' },
    { k: 'ancho', label: 'Ancho', t: 'num', min: 1.0, max: 2.6, step: 0.05, group: 'Forma' },
    { k: 'fondo', label: 'Fondo', t: 'num', min: 1.0, max: 2.6, step: 0.05, group: 'Forma' },
    { k: 'conPantalla', label: 'Pantalla gigante', t: 'bool', group: 'Forma' },
    { k: 'antena', label: 'Antena y parabólicas', t: 'bool', group: 'Forma' },
    { k: 'altoAntena', label: 'Alto de la antena', t: 'num', min: 0.4, max: 2, step: 0.05, group: 'Forma' },
    { k: 'fachada', label: 'Fachada', t: 'color', group: C }, { k: 'vidrio', label: 'Vidrio', t: 'color', group: C }, { k: 'pantalla', label: 'Pantalla', t: 'color', group: C },
  ],
  terminal: [
    { k: 'ancho', label: 'Ancho', t: 'num', min: 3, max: 6, step: 0.1, group: 'Forma' },
    { k: 'fondo', label: 'Fondo', t: 'num', min: 2, max: 3.6, step: 0.1, group: 'Forma' },
    { k: 'arcos', label: 'Bóvedas del techo', t: 'num', min: 2, max: 8, step: 1, group: 'Forma' },
    { k: 'buses', label: 'Buses estacionados (en el juego depende de los acuerdos)', t: 'num', min: 0, max: 6, step: 1, group: 'Forma' },
    { k: 'reloj', label: 'Reloj', t: 'bool', group: 'Forma' },
    { k: 'techo', label: 'Techo', t: 'color', group: C }, { k: 'piso', label: 'Piso', t: 'color', group: C }, { k: 'estructura', label: 'Estructura', t: 'color', group: C },
  ],
  taller: [
    { k: 'ancho', label: 'Ancho', t: 'num', min: 5, max: 12, step: 0.2, group: 'Forma' },
    { k: 'fondo', label: 'Fondo', t: 'num', min: 3, max: 6, step: 0.1, group: 'Forma' },
    { k: 'trenesAdentro', label: 'Trenes en revisión', t: 'num', min: 0, max: 3, step: 1, group: 'Forma' },
    { k: 'trabajadores', label: 'Personal (en el juego depende del mantenimiento)', t: 'num', min: 0, max: 12, step: 1, group: 'Forma' },
    { k: 'luces', label: 'Lámparas encendidas (en el juego depende del mantenimiento)', t: 'num', min: 0, max: 4, step: 1, group: 'Forma' },
    { k: 'pared', label: 'Paredes', t: 'color', group: C }, { k: 'piso', label: 'Piso', t: 'color', group: C },
    { k: 'trenes', label: 'Trenes', t: 'color', group: C }, { k: 'franja', label: 'Franja de los trenes', t: 'color', group: C },
  ],
  control: [
    { k: 'ancho', label: 'Ancho', t: 'num', min: 2.5, max: 6, step: 0.1, group: 'Forma' },
    { k: 'fondo', label: 'Fondo', t: 'num', min: 2, max: 4, step: 0.1, group: 'Forma' },
    { k: 'puestos', label: 'Puestos de control', t: 'num', min: 1, max: 6, step: 1, group: 'Forma' },
    { k: 'operadores', label: 'Operadores', t: 'bool', group: 'Forma' },
    { k: 'pared', label: 'Paredes', t: 'color', group: C }, { k: 'pantallas', label: 'Pantallas', t: 'color', group: C },
  ],
};
const v1 = (build: (g: Geo, r: Rng, p: Params) => void, settings: Setting[], defaults: Record<string, number | boolean | string>, notes: string) =>
  ({ v1: { build, settings, defaults, notes, date: D, look: 'smooth' as const } });

export function registerClay3(register: (d: ModelDef) => void) {
  register({ id: 'medios', name: 'Medios', group: 'Protagonistas', approved: 'v1',
    versions: v1(medios, S.medios, { pisos: 9, ancho: 1.7, fondo: 1.6, conPantalla: true, antena: true, altoAntena: 1.1, fachada: '#3E6FD0', vidrio: '#9FC7F0', pantalla: '#FF6B2C' },
      'Primera versión: torre del canal con fachada de vidrio, pantalla gigante, antena y parabólicas.') });
  register({ id: 'terminal', name: 'Terminal de buses', group: 'Transporte', approved: 'v1',
    versions: v1(terminal, S.terminal, { ancho: 4.6, fondo: 2.8, arcos: 5, buses: 3, reloj: true, techo: '#3DBE8B', piso: '#C9CED8', estructura: '#E9EDF5' },
      'Primera versión: andenes con bóvedas, letrero y buses estacionados.') });
  register({ id: 'taller', name: 'Taller y cocheras', group: 'Estaciones', approved: 'v1',
    versions: v1(taller, S.taller, { y: 0, ancho: 8.6, fondo: 4.2, trenesAdentro: 3, trabajadores: 5, luces: 2, pared: '#2F3B78', piso: '#4A5590', trenes: '#F3F6FC', franja: '#FF6B2C' },
      'Primera versión: nave con tres vías, fosas, trenes en revisión, grúa, lámparas y personal.') });
  register({ id: 'control', name: 'Control de trenes', group: 'Estaciones', approved: 'v1',
    versions: v1(control, S.control, { y: 0, ancho: 4.2, fondo: 3.0, puestos: 6, operadores: true, pared: '#26306A', pantallas: '#7CC4FF' },
      'Primera versión: sala con el mapa de la línea, puestos con pantallas y operadores.') });
}

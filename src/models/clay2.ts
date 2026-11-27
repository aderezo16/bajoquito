import { Geo, Rng } from '../engine/geo';
import { model, Params, Setting } from './registry';
import { tint } from './city';

/** «Arcilla» versions of the remaining models, so every element of the game can be adjusted in the workshop. */
const num = (p: Params, k: string) => Number(p[k]);
const col = (p: Params, k: string) => { const v = p[k]; return typeof v === 'string' ? parseInt(v.replace('#', ''), 16) : Number(v); };
const on = (p: Params, k: string) => p[k] === true || p[k] === 'true';
const night = (p: Params) => p.noche !== false;
const D = '2026-11-27', C = 'Color';

function win(g: Geo, cx: number, cy: number, zf: number, w: number, h: number, wall: number, glass: number, lit: boolean) {
  g.mark('ventana (frente)', cx - w / 2, cy - h / 2, zf, cx + w / 2, cy + h / 2, zf + 0.01);
  g.box(cx - w / 2 - 0.022, cy - h / 2 - 0.022, zf - 0.002, w + 0.044, h + 0.044, 0.006, tint(wall, 0.84));
  g.box(cx - w / 2, cy + h / 2 - 0.025, zf, w, 0.025, 0.008, tint(wall, 0.58));
  g.panelZ(cx - w / 2 + 0.02, cy - h / 2, zf + 0.006, w - 0.02, h - 0.025, lit ? 0xffd58a : glass, lit);
  g.roundBox(cx - w / 2 - 0.02, cy - h / 2 - 0.028, zf - 0.01, w + 0.04, 0.028, 0.045, tint(wall, 1.1), 0.01);
}

// ---------------- Tren ----------------
export function tren(g: Geo, r: Rng, p: Params) {
  const { x, z } = p, n = Math.round(num(p, 'coches')), L = num(p, 'largoCoche'), W = 0.6, H = 0.62, rad = num(p, 'redondeo');
  const body = col(p, 'carroceria'), band = col(p, 'franja'), glass = col(p, 'vidrio');
  for (let i = 0; i < n; i++) {
    const x0 = x + i * (L + 0.05);
    g.tag('carrocería'); g.roundBox(x0, 0.12, z, L, H, W, body, rad);
    g.tag('franja'); g.roundBox(x0 + 0.02, 0.2, z - 0.008, L - 0.04, 0.06, W + 0.016, band, 0.02);
    g.tag('ventanas'); g.roundBox(x0 + 0.14, 0.38, z - 0.01, L - 0.28, 0.24, W + 0.02, night(p) ? 0xfff0c8 : glass, 0.03);
    g.mark('ventanas del coche', x0 + 0.14, 0.38, z + W, x0 + L - 0.14, 0.62, z + W + 0.01);
    g.tag('puertas');
    for (const dx of [0.3, L - 0.42]) g.box(x0 + dx, 0.14, z + W + 0.004, 0.12, 0.46, 0.006, tint(body, 0.8));
    if (on(p, 'pasajeros')) {
      g.tag('pasajeros');
      for (let k = 0; k < Math.floor((L - 0.4) / 0.24); k++) {
        const px = x0 + 0.22 + k * 0.24;
        g.box(px - 0.035, 0.46, z + W + 0.012, 0.07, 0.08, 0.004, 0x1b2340);
        g.box(px - 0.06, 0.38, z + W + 0.012, 0.12, 0.08, 0.004, [0xffc857, 0xff8a5b, 0x7cc4ff, 0xc9b6ff, 0x8ee3c0][(k + i) % 5]);
      }
    }
  }
  const xf = x + n * (L + 0.05) - 0.05;
  g.tag('frente'); g.roundBox(xf - 0.04, 0.3, z + 0.06, 0.08, 0.26, W - 0.12, glass, 0.03);
  for (const zz of [z + 0.12, z + W - 0.12]) g.blob(xf + 0.02, 0.22, zz, 0.035, 0xfff3c4, 1, 10, true);
  void r;
}

// ---------------- Semáforo ----------------
export function semaforo(g: Geo, _r: Rng, p: Params) {
  const { x, z } = p, h = num(p, 'altura'), pole = col(p, 'poste'), box = col(p, 'caja');
  g.tag('base'); g.roundBox(x - 0.05, 0, z - 0.05, 0.1, 0.04, 0.1, tint(pole, 0.8), 0.015);
  g.tag('poste'); g.cyl(x, 0, z, 0.02, h, pole, 10);
  g.tag('caja'); g.roundBox(x - 0.05, h - 0.06, z - 0.035, 0.1, 0.26, 0.07, box, 0.025);
  g.tag('luces');
  const cols = [0xff4d4f, 0xffc857, 0x4dffa0];
  cols.forEach((c, i) => g.blob(x, h + 0.14 - i * 0.075, z + 0.04, 0.025, night(p) && i === 2 ? c : tint(c, 0.6), 1, 10, night(p) && i === 2));
  if (on(p, 'peatonal')) {
    g.tag('semáforo peatonal'); g.roundBox(x - 0.035, h * 0.55, z - 0.03, 0.07, 0.12, 0.06, box, 0.02);
    g.blob(x, h * 0.55 + 0.06, z + 0.035, 0.02, 0xff4d4f, 1, 8);
  }
}

// ---------------- Municipio ----------------
export function municipio(g: Geo, r: Rng, p: Params) {
  const { x, z } = p, w = num(p, 'ancho'), d = num(p, 'fondo'), fh = num(p, 'altoPiso'), na = Math.round(num(p, 'arcos'));
  const wall = col(p, 'pared'), trim = col(p, 'molduras'), glass = col(p, 'vidrio'), h = fh * 2 + 0.1;
  g.tag('cuerpo'); g.roundBox(x, 0, z, w, h, d, wall, 0.04);
  g.tag('arcos');
  for (let k = 0; k < na; k++) {
    const ax = x + 0.3 + k * ((w - 0.6) / Math.max(1, na - 1)) - 0.12;
    g.mark('arco', ax, 0, z + d, ax + 0.24, fh * 0.9, z + d + 0.01);
    g.box(ax - 0.03, 0, z + d - 0.002, 0.3, fh * 0.92 + 0.03, 0.006, tint(wall, 0.84));
    g.arch(ax, 0, z + d + 0.006, 0.24, fh * 0.9, night(p) && on(p, 'arcosIluminados') ? 0xffd58a : tint(wall, 0.55), night(p) && on(p, 'arcosIluminados'));
  }
  g.tag('cornisa'); g.roundBox(x - 0.03, fh, z + d - 0.03, w + 0.06, 0.06, 0.1, trim, 0.02);
  g.roundBox(x - 0.06, h, z - 0.06, w + 0.12, 0.1, d + 0.12, trim, 0.03);
  g.tag('ventanas');
  for (let k = 0; k < na; k++) win(g, x + 0.3 + k * ((w - 0.6) / Math.max(1, na - 1)), fh + fh * 0.55, z + d, 0.2, fh * 0.55, wall, glass, night(p) && r.chance(0.5));
  if (on(p, 'fronton')) {
    g.tag('frontón'); const cx = x + w / 2;
    g.roundBox(cx - 0.9, 0, z + d - 0.05, 1.8, h + 0.1, 0.12, tint(wall, 1.05), 0.03);
    g.roof(cx - 0.95, h + 0.1, z + d - 0.08, 1.9, 0.18, 0.4, trim, 'x', 0.02);
  }
  if (on(p, 'bandera')) {
    g.tag('bandera'); const cx = x + w / 2;
    g.cyl(cx, h + 0.1, z + d * 0.5, 0.015, 1.0, 0xc9d5f2, 8);
    g.box(cx + 0.015, h + 0.82, z + d * 0.5, 0.36, 0.2, 0.015, col(p, 'colorBandera'));
  }
}

// ---------------- Concejo ----------------
export function concejo(g: Geo, r: Rng, p: Params) {
  const { x, z } = p, w = num(p, 'ancho'), d = num(p, 'fondo'), h = num(p, 'alto'), nc = Math.round(num(p, 'columnas'));
  const body = col(p, 'cuerpo'), colm = col(p, 'columnasColor'), dome = col(p, 'cupula'), glass = col(p, 'vidrio');
  g.tag('cuerpo'); g.roundBox(x, 0, z, w, h, d, body, 0.04);
  g.tag('ventanas');
  for (let k = 0; k < nc - 1; k++) win(g, x + 0.45 + (k + 0.5) * ((w - 0.9) / (nc - 1)), h * 0.5, z + d, 0.18, h * 0.42, body, glass, night(p) && r.chance(0.5));
  g.tag('columnas');
  for (let k = 0; k < nc; k++) {
    const cx = x + 0.45 + k * ((w - 0.9) / (nc - 1));
    g.cyl(cx, 0, z + d + 0.22, 0.06, h * 0.92, colm, 14);
    g.roundBox(cx - 0.08, 0, z + d + 0.14, 0.16, 0.05, 0.16, tint(colm, 0.9), 0.015);
  }
  g.roundBox(x + 0.2, h * 0.92, z + d - 0.05, w - 0.4, 0.12, 0.4, colm, 0.03);
  g.roundBox(x + 0.15, 0, z + d - 0.02, w - 0.3, 0.06, 0.45, tint(colm, 0.85), 0.02);
  if (on(p, 'conCupula')) {
    g.tag('cúpula');
    const r0 = Math.min(w, d) * 0.22;
    g.cyl(x + w / 2, h, z + d / 2, r0, 0.18, tint(body, 0.9), 24);
    g.dome(x + w / 2, h + 0.18, z + d / 2, r0, dome);
    g.cyl(x + w / 2, h + 0.18 + r0 - 0.02, z + d / 2, 0.035, 0.22, 0xc9d5f2, 8);
  }
}

// ---------------- Catedral ----------------
export function catedral(g: Geo, r: Rng, p: Params) {
  const { x, z } = p, w = num(p, 'ancho'), d = num(p, 'fondo'), hn = num(p, 'altoNave'), ht = num(p, 'altoTorres');
  const wall = col(p, 'pared'), roof = col(p, 'teja'), spire = col(p, 'chapitel'), glass = col(p, 'vidrio');
  g.tag('nave'); g.roundBox(x, 0, z, w, hn, d, wall, 0.04);
  g.tag('techo'); g.roof(x, hn, z, w, d, 0.45, roof, 'z', 0.06);
  if (on(p, 'torres')) {
    const tw = Math.min(0.8, w * 0.22);
    for (const tx of [x, x + w - tw]) {
      g.tag('torres'); g.roundBox(tx, 0, z + d - tw, tw, ht, tw, tint(wall, 1.05), 0.04);
      win(g, tx + tw / 2, ht * 0.72, z + d, tw * 0.4, ht * 0.16, wall, glass, night(p) && r.chance(0.6));
      g.tag('chapiteles'); g.cone(tx + tw / 2, ht, z + d - tw / 2, tw * 0.62, tw, spire, 4);
    }
  }
  g.tag('puerta'); g.mark('puerta', x + w / 2 - 0.18, 0, z + d, x + w / 2 + 0.18, 0.6, z + d + 0.01);
  g.box(x + w / 2 - 0.22, 0, z + d - 0.002, 0.44, 0.66, 0.006, tint(wall, 0.82));
  g.arch(x + w / 2 - 0.18, 0, z + d + 0.006, 0.36, 0.6, 0x5a3e26);
  if (on(p, 'roseton')) { g.tag('rosetón'); g.cyl(x + w / 2, hn * 0.78, z + d + 0.005, 0.13, 0.02, night(p) ? 0xffd58a : glass, 20, night(p)); }
}

// ---------------- Estación bajo tierra ----------------
export function estacionSub(g: Geo, _r: Rng, p: Params) {
  const x = p.x + 2.6, Y = num(p, 'y'), L = num(p, 'largoAnden'), wall = col(p, 'pared'), floor = col(p, 'anden'), sign = col(p, 'letrero');
  const half = L / 2;
  g.tag('pared del fondo'); g.roundBox(x - half - 0.6, Y, -4.45, L + 1.1, 3.0, 0.12, wall, 0.03);
  g.box(x - half - 0.5, Y + 2.8, -4.32, L + 0.9, 0.06, 0.02, 0xcfe0ff, true);
  g.tag('letrero'); g.roundBox(x - 1.3, Y + 2.2, -4.34, 2.4, 0.46, 0.05, sign, 0.04);
  g.mark('letrero con el nombre', x - 1.3, Y + 2.2, -4.3, x + 1.1, Y + 2.66, -4.29);
  if (on(p, 'mezzanine')) { g.tag('mezzanine'); g.roundBox(x - half - 0.6, Y + 1.9, -4.32, 3.2, 0.14, 1.65, tint(wall, 1.25), 0.03); g.roundBox(x - half - 0.6, Y + 2.04, -2.72, 3.2, 0.35, 0.04, 0x9aa6c4, 0.015); }
  if (on(p, 'escalera')) { g.tag('escalera eléctrica'); g.beam(x - half, Y + 1.95, x - half + 1.2, Y + 0.24, -2.4, 0.45, 0.06, p.broken ? 0xe5484d : col(p, 'escaleraColor')); }
  for (const [z0, z1, name] of [[-2.7, -1.4, 'anden del fondo'], [1.4, 2.7, 'anden del frente']] as const) {
    g.tag(name); g.roundBox(x - half, Y, z0, L, 0.22, z1 - z0, floor, 0.02);
    g.box(x - half, Y + 0.221, z0 < 0 ? z1 - 0.06 : z0, L, 0.005, 0.06, 0xffc857, true);
  }
  if (on(p, 'bancas')) { g.tag('bancas'); for (const bx of [x - half + 0.6, x + half - 1.1]) g.roundBox(bx, Y + 0.22, -2.55, 0.5, 0.1, 0.16, 0x6b4a2e, 0.02); }
  if (p.withTrack) { g.tag('vía (solo en el taller)'); g.plane(x - half - 0.6, Y, -1.4, L + 1.2, 2.8, 0x1a1f4c); for (const tz of [-0.55, 0.55]) for (const dz of [-0.2, 0.2]) g.box(x - half - 0.6, Y + 0.035, tz + dz - 0.015, L + 1.2, 0.035, 0.03, 0x8090c0); }
}

// ---------------- Bodega ----------------
export function bodega(g: Geo, r: Rng, p: Params) {
  const { x: bx0, z: bz0 } = p, w = num(p, 'ancho'), d = num(p, 'fondo'), Y = num(p, 'y'), rows = Math.round(num(p, 'filas')), lv = Math.round(num(p, 'niveles'));
  const wall = col(p, 'pared'), shelf = col(p, 'estantes'), boxC = col(p, 'cajas');
  const bx1 = bx0 + w, bz1 = bz0 + d;
  g.tag('piso'); g.plane(bx0, Y + 0.01, bz0, w, d, tint(wall, 0.8));
  g.tag('paredes'); g.roundBox(bx0, Y, bz0 - 0.1, w, 1.1, 0.1, wall, 0.02); g.roundBox(bx0 - 0.1, Y, bz0, 0.1, 1.1, d, tint(wall, 0.9), 0.02);
  g.roundBox(bx0, Y, bz1 - 0.1, w, 0.28, 0.1, wall, 0.02); g.roundBox(bx1 - 0.1, Y, bz0, 0.1, 0.28, d, wall, 0.02);
  for (let row = 0; row < rows; row++) {
    const zz = bz0 + 0.5 + row * ((d - 1.0) / Math.max(1, rows - 1 || 1)) * (rows > 1 ? 1 : 0);
    for (let l = 0; l < lv; l++) {
      const ly = 0.1 + l * 0.62;
      g.tag('estantes'); g.roundBox(bx0 + 0.5, Y + ly, zz, w - 1.2, 0.04, 0.62, shelf, 0.01);
      g.tag('cajas');
      const K = Math.floor((w - 1.4) / 0.6), fill = p.llenado === undefined ? 1 : num(p, 'llenado');
      for (let k = 0; k < K; k++) if (r.chance(0.8) && ((row * lv + l) * K + k) / (rows * lv * K) < fill) g.roundBox(bx0 + 0.6 + k * 0.6, Y + ly + 0.04, zz + 0.06, 0.48, 0.38, 0.5, tint(boxC, 0.9 + r.next() * 0.2), 0.02);
    }
    g.tag('estantes'); for (const px of [bx0 + 0.45, bx1 - 0.72]) g.box(px, Y, zz + 0.55, 0.06, 0.1 + lv * 0.62, 0.06, tint(shelf, 1.2));
  }
  if (on(p, 'montacargas')) { g.tag('montacargas'); g.roundBox(bx1 - 1.9, Y, bz1 - 0.95, 0.6, 0.42, 0.45, 0xffc857, 0.05); g.box(bx1 - 1.95, Y, bz1 - 0.95, 0.06, 1.05, 0.45, 0x7f8fb8); g.wheel(bx1 - 1.75, Y + 0.08, bz1 - 0.5, 0.08, 0.05, 0x2a2f45); }
}

// ---------------- registration ----------------
const NOTE = 'Estilo «arcilla» con ajustes editables y partes que se pueden quitar o agregar desde el chat.';
const S: Record<string, Setting[]> = {
  tren: [
    { k: 'coches', label: 'Coches', t: 'num', min: 1, max: 6, step: 1, group: 'Forma' },
    { k: 'largoCoche', label: 'Largo de cada coche', t: 'num', min: 1.0, max: 2.6, step: 0.05, group: 'Forma' },
    { k: 'redondeo', label: 'Redondeo de bordes', t: 'num', min: 0, max: 0.2, step: 0.005, group: 'Forma' },
    { k: 'pasajeros', label: 'Pasajeros en las ventanas', t: 'bool', group: 'Forma' },
    { k: 'carroceria', label: 'Carrocería', t: 'color', group: C }, { k: 'franja', label: 'Franja', t: 'color', group: C }, { k: 'vidrio', label: 'Vidrio', t: 'color', group: C },
  ],
  semaforo: [
    { k: 'altura', label: 'Altura', t: 'num', min: 0.4, max: 1.2, step: 0.02, group: 'Forma' },
    { k: 'peatonal', label: 'Semáforo peatonal', t: 'bool', group: 'Forma' },
    { k: 'poste', label: 'Poste', t: 'color', group: C }, { k: 'caja', label: 'Caja de luces', t: 'color', group: C },
  ],
  municipio: [
    { k: 'ancho', label: 'Ancho', t: 'num', min: 2.5, max: 6, step: 0.1, group: 'Forma' },
    { k: 'fondo', label: 'Fondo', t: 'num', min: 1.5, max: 4, step: 0.1, group: 'Forma' },
    { k: 'altoPiso', label: 'Alto de cada piso', t: 'num', min: 0.5, max: 1.0, step: 0.02, group: 'Forma' },
    { k: 'arcos', label: 'Arcos', t: 'num', min: 3, max: 13, step: 1, group: 'Fachada' },
    { k: 'arcosIluminados', label: 'Arcos iluminados (noche)', t: 'bool', group: 'Fachada' },
    { k: 'fronton', label: 'Frontón central', t: 'bool', group: 'Fachada' },
    { k: 'bandera', label: 'Bandera', t: 'bool', group: 'Fachada' },
    { k: 'pared', label: 'Pared', t: 'color', group: C }, { k: 'molduras', label: 'Molduras y techo', t: 'color', group: C },
    { k: 'vidrio', label: 'Vidrio', t: 'color', group: C }, { k: 'colorBandera', label: 'Bandera', t: 'color', group: C },
  ],
  concejo: [
    { k: 'ancho', label: 'Ancho', t: 'num', min: 2.5, max: 6, step: 0.1, group: 'Forma' },
    { k: 'fondo', label: 'Fondo', t: 'num', min: 1.5, max: 4, step: 0.1, group: 'Forma' },
    { k: 'alto', label: 'Alto', t: 'num', min: 0.8, max: 2.0, step: 0.05, group: 'Forma' },
    { k: 'columnas', label: 'Columnas', t: 'num', min: 3, max: 10, step: 1, group: 'Fachada' },
    { k: 'conCupula', label: 'Cúpula', t: 'bool', group: 'Fachada' },
    { k: 'cuerpo', label: 'Cuerpo', t: 'color', group: C }, { k: 'columnasColor', label: 'Columnas', t: 'color', group: C },
    { k: 'cupula', label: 'Cúpula', t: 'color', group: C }, { k: 'vidrio', label: 'Vidrio', t: 'color', group: C },
  ],
  catedral: [
    { k: 'ancho', label: 'Ancho', t: 'num', min: 2.5, max: 6, step: 0.1, group: 'Forma' },
    { k: 'fondo', label: 'Fondo', t: 'num', min: 2, max: 5, step: 0.1, group: 'Forma' },
    { k: 'altoNave', label: 'Alto de la nave', t: 'num', min: 0.6, max: 1.8, step: 0.05, group: 'Forma' },
    { k: 'torres', label: 'Torres', t: 'bool', group: 'Forma' },
    { k: 'altoTorres', label: 'Alto de las torres', t: 'num', min: 1.2, max: 3.5, step: 0.05, group: 'Forma' },
    { k: 'roseton', label: 'Rosetón', t: 'bool', group: 'Forma' },
    { k: 'pared', label: 'Pared', t: 'color', group: C }, { k: 'teja', label: 'Teja', t: 'color', group: C },
    { k: 'chapitel', label: 'Chapiteles', t: 'color', group: C }, { k: 'vidrio', label: 'Vidrio', t: 'color', group: C },
  ],
  estacionSub: [
    { k: 'largoAnden', label: 'Largo del andén', t: 'num', min: 2.5, max: 6, step: 0.1, group: 'Forma' },
    { k: 'mezzanine', label: 'Mezzanine', t: 'bool', group: 'Forma' },
    { k: 'escalera', label: 'Escalera eléctrica', t: 'bool', group: 'Forma' },
    { k: 'bancas', label: 'Bancas', t: 'bool', group: 'Forma' },
    { k: 'pared', label: 'Pared', t: 'color', group: C }, { k: 'anden', label: 'Andén', t: 'color', group: C },
    { k: 'letrero', label: 'Letrero', t: 'color', group: C }, { k: 'escaleraColor', label: 'Escalera', t: 'color', group: C },
  ],
  bodega: [
    { k: 'ancho', label: 'Ancho', t: 'num', min: 4, max: 14, step: 0.2, group: 'Forma' },
    { k: 'fondo', label: 'Fondo', t: 'num', min: 2.5, max: 7, step: 0.1, group: 'Forma' },
    { k: 'filas', label: 'Filas de estantes', t: 'num', min: 1, max: 5, step: 1, group: 'Forma' },
    { k: 'niveles', label: 'Niveles por estante', t: 'num', min: 1, max: 4, step: 1, group: 'Forma' },
    { k: 'montacargas', label: 'Montacargas', t: 'bool', group: 'Forma' },
    { k: 'llenado', label: 'Estantes llenos (en el juego depende de los repuestos)', t: 'num', min: 0, max: 1, step: 0.05, group: 'Forma' },
    { k: 'pared', label: 'Paredes', t: 'color', group: C }, { k: 'estantes', label: 'Estantes', t: 'color', group: C }, { k: 'cajas', label: 'Cajas', t: 'color', group: C },
  ],
};
function addReview(id: string, build: (g: Geo, r: Rng, p: Params) => void, defaults: Record<string, number | boolean | string>, settings: Setting[]) {
  const m = model(id);
  const v = 'v' + (Object.keys(m.versions).length + 1);
  m.versions[v] = { build, defaults, settings, notes: NOTE, date: D, look: 'smooth' };
  m.review = v;
}
export function registerClay2() {
  addReview('tren', tren, { coches: 2, largoCoche: 1.72, redondeo: 0.12, pasajeros: true, carroceria: '#F3F6FC', franja: '#FF6B2C', vidrio: '#A9D6F0' }, S.tren);
  addReview('semaforo', semaforo, { altura: 0.6, peatonal: true, poste: '#3B4A72', caja: '#1B2340' }, S.semaforo);
  addReview('municipio', municipio, { ancho: 4.3, fondo: 2.8, altoPiso: 0.7, arcos: 9, arcosIluminados: true, fronton: true, bandera: true, pared: '#F4EDE0', molduras: '#E6D7BC', vidrio: '#A9BCCB', colorBandera: '#FFC857' }, S.municipio);
  addReview('concejo', concejo, { ancho: 4.0, fondo: 2.75, alto: 1.2, columnas: 6, conCupula: true, cuerpo: '#4A5E96', columnasColor: '#F2EADB', cupula: '#3E8C78', vidrio: '#A9BCCB' }, S.concejo);
  addReview('catedral', catedral, { ancho: 3.9, fondo: 2.85, altoNave: 1.0, torres: true, altoTorres: 2.0, roseton: true, pared: '#EFE8DA', teja: '#C8583A', chapitel: '#6E8F7E', vidrio: '#A9BCCB' }, S.catedral);
  addReview('estacion-subterranea', estacionSub, { y: 0, broken: false, withTrack: true, largoAnden: 4.0, mezzanine: true, escalera: true, bancas: true, pared: '#2A3474', anden: '#5866A8', letrero: '#173E86', escaleraColor: '#3E4C8C' }, S.estacionSub);
  addReview('bodega', bodega, { ancho: 10.2, fondo: 4.5, y: 0, filas: 3, niveles: 3, montacargas: true, llenado: 1, pared: '#3A4580', estantes: '#5D6A9C', cajas: '#B08D6E' }, S.bodega);
}

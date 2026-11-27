import { Geo, Rng } from '../engine/geo';
import { model, Params, Setting } from './registry';
import { tint } from './city';

/**
 * «Arcilla»: stylised low-poly with soft rounded edges, matte colours, recessed windows and thick trims
 * (reference: the orange building Andrés sent). Every model here is driven by settings the user can adjust
 * in the catalog; saved adjustments become new versions.
 */
const num = (p: Params, k: string) => Number(p[k]);
const col = (p: Params, k: string) => { const v = p[k]; return typeof v === 'string' ? parseInt(v.replace('#', ''), 16) : Number(v); };
const on = (p: Params, k: string) => p[k] === true || p[k] === 'true';
const D = '2026-11-27';
/** Lit window? Only at night (the catalog passes noche=false by day; the game is always at night). */
const litAt = (p: Params, r: Rng, share: number) => { const l = r.chance(share); return p.noche !== false && l; };

/** Recessed window on the front (+z) face at depth zf. (cx, cy) = centre. */
function winFront(g: Geo, cx: number, cy: number, zf: number, w: number, h: number, wall: number, glass: number, lit: boolean, sill = true) {
  g.mark('ventana (frente)', cx - w / 2, cy - h / 2, zf, cx + w / 2, cy + h / 2, zf + 0.01);
  g.box(cx - w / 2 - 0.025, cy - h / 2 - 0.025, zf - 0.002, w + 0.05, h + 0.05, 0.006, tint(wall, 0.86));       // reveal
  g.box(cx - w / 2, cy + h / 2 - 0.028, zf, w, 0.028, 0.008, tint(wall, 0.58));                                   // inner shadow (top)
  g.box(cx - w / 2, cy - h / 2, zf, 0.022, h, 0.008, tint(wall, 0.66));                                           // inner shadow (left)
  g.panelZ(cx - w / 2 + 0.022, cy - h / 2, zf + 0.006, w - 0.022, h - 0.028, lit ? 0xffd58a : glass, lit);
  if (sill) g.roundBox(cx - w / 2 - 0.02, cy - h / 2 - 0.03, zf - 0.01, w + 0.04, 0.03, 0.05, tint(wall, 1.12), 0.012);
}
/** Recessed window on the right (+x) face at x = xf. (cz, cy) = centre. */
function winSide(g: Geo, xf: number, cy: number, cz: number, w: number, h: number, wall: number, glass: number, lit: boolean, sill = true) {
  g.mark('ventana (costado derecho)', xf, cy - h / 2, cz - w / 2, xf + 0.01, cy + h / 2, cz + w / 2);
  g.box(xf - 0.002, cy - h / 2 - 0.025, cz - w / 2 - 0.025, 0.006, h + 0.05, w + 0.05, tint(wall, 0.84));
  g.box(xf, cy + h / 2 - 0.028, cz - w / 2, 0.008, 0.028, w, tint(wall, 0.55));
  g.box(xf, cy - h / 2, cz + w / 2 - 0.022, 0.008, h, 0.022, tint(wall, 0.62));
  g.panelX(xf + 0.006, cy - h / 2, cz - w / 2, w - 0.022, h - 0.028, lit ? 0xffd58a : glass, lit);
  if (sill) g.roundBox(xf - 0.01, cy - h / 2 - 0.03, cz - w / 2 - 0.02, 0.05, 0.03, w + 0.04, tint(wall, 1.1), 0.012);
}
/** Flat roof with a thick rounded parapet and a sunken centre. */
function parapetRoof(g: Geo, x: number, z: number, w: number, d: number, y: number, c: number, rim: number, r: number) {
  const o = 0.06, t = 0.11;
  g.roundBox(x - o, y, z - o, w + 2 * o, 0.06, d + 2 * o, tint(c, 0.94), r * 0.6);
  g.roundBox(x - o, y, z - o, w + 2 * o, rim, t, c, r);
  g.roundBox(x - o, y, z + d + o - t, w + 2 * o, rim, t, c, r);
  g.roundBox(x - o, y, z - o, t, rim, d + 2 * o, c, r);
  g.roundBox(x + w + o - t, y, z - o, t, rim, d + 2 * o, c, r);
}
/** Gable roof made of two thick rounded panels (ridge along x) plus wall-coloured gables. */
function gableRoof(g: Geo, x: number, z: number, w: number, d: number, y: number, rise: number, over: number, roof: number, wall: number) {
  const half = d / 2 + over, ang = Math.atan2(rise, d / 2), len = Math.hypot(half, rise * (half / (d / 2)));
  const th = 0.06, cx = x + w / 2;
  for (const s of [-1, 1]) {
    const cz = z + d / 2 + s * half / 2, cy = y + rise / 2 - (over * Math.tan(ang)) / 2 + th / 2;
    g.rbox(cx, cy, cz, w + over * 2, th, len, s * ang, 0, 0, s > 0 ? roof : tint(roof, 0.86), 0.025);
  }
  g.roof(x, y, z, w, d, rise, wall, 'x', 0);
  g.rbox(cx, y + rise + th * 0.6, z + d / 2, w + over * 2 + 0.02, 0.05, 0.08, 0, 0, 0, tint(roof, 0.78), 0.02);
}

// ---------------- Edificio (the reference) ----------------
export function edificio(g: Geo, r: Rng, p: Params) {
  const { x, z } = p;
  const fl = Math.round(num(p, 'pisos')), cf = Math.round(num(p, 'colsFrente')), cs = Math.round(num(p, 'colsLado'));
  const mod = num(p, 'modulo'), fh = num(p, 'alturaPiso'), rad = num(p, 'redondeo');
  const wall = col(p, 'pared'), trim = col(p, 'cornisa'), glass = col(p, 'vidrio'), door = col(p, 'puerta');
  const ww = num(p, 'ventanaAncho'), wh = num(p, 'ventanaAlto'), lit = num(p, 'iluminadas');
  const w = cf * mod + 0.16, d = cs * mod + 0.16, h = fl * fh + 0.08;
  g.tag('cuerpo'); g.roundBox(x, 0, z, w, h, d, wall, rad);
  g.tag('ventanas');
  for (let f = 0; f < fl; f++) {
    const cy = 0.06 + f * fh + fh * 0.52;
    for (let c = 0; c < cf; c++) {
      const cx = x + 0.08 + (c + 0.5) * mod;
      if (f === 0 && c === 0 && on(p, 'conPuerta')) continue;
      winFront(g, cx, cy, z + d, ww, wh, wall, glass, litAt(p, r, lit));
    }
    for (let c = 0; c < cs; c++) {
      const cz = z + 0.08 + (c + 0.5) * mod;
      if (on(p, 'ventanasDobles')) {
        const nw = ww * 0.42;
        winSide(g, x + w, cy, cz - nw * 0.62, nw, wh, wall, glass, litAt(p, r, lit), false);
        winSide(g, x + w, cy, cz + nw * 0.62, nw, wh, wall, glass, litAt(p, r, lit), false);
      } else winSide(g, x + w, cy, cz, ww, wh, wall, glass, litAt(p, r, lit));
    }
  }
  if (on(p, 'conPuerta')) {
    g.tag('puerta');
    const cx = x + 0.08 + 0.5 * mod, dw = Math.min(mod * 0.78, 0.36), dh = Math.min(fh * 0.92, 0.4);
    g.mark('puerta', cx - dw / 2, 0.04, z + d, cx + dw / 2, 0.04 + dh, z + d + 0.012);
    g.box(cx - dw / 2 - 0.03, 0.04, z + d - 0.002, dw + 0.06, dh + 0.03, 0.006, tint(wall, 0.8));
    g.box(cx - dw / 2, 0.04, z + d, dw / 2 - 0.006, dh, 0.012, door);
    g.box(cx + 0.006, 0.04, z + d, dw / 2 - 0.006, dh, 0.012, door);
    g.tag('escalón'); if (on(p, 'escalon')) g.roundBox(cx - dw / 2 - 0.08, 0, z + d - 0.02, dw + 0.16, 0.045, 0.16, trim, 0.02);
  }
  g.tag('techo'); parapetRoof(g, x, z, w, d, h, trim, num(p, 'parapeto'), rad);
}

// ---------------- Casa de barrio ----------------
export function casa(g: Geo, r: Rng, p: Params) {
  const { x, z } = p;
  const w = num(p, 'ancho'), d = num(p, 'fondo'), h = num(p, 'alto'), rad = num(p, 'redondeo');
  const wall = col(p, 'pared'), roof = col(p, 'techo'), door = col(p, 'puerta'), glass = col(p, 'vidrio');
  g.tag('cuerpo'); g.roundBox(x, 0, z, w, h, d, wall, rad);
  const n = Math.round(num(p, 'ventanas'));
  const doorAt = n > 1 ? Math.floor(n / 2) : -1;
  for (let k = 0; k < n; k++) {
    const cx = x + (k + 0.5) * (w / n);
    if (k === doorAt && on(p, 'conPuerta')) {
      const dw = 0.2, dh = Math.min(h * 0.78, 0.36);
      g.tag('puerta'); g.mark('puerta', cx - dw / 2, 0, z + d, cx + dw / 2, dh, z + d + 0.012);
      g.box(cx - dw / 2 - 0.025, 0.0, z + d - 0.002, dw + 0.05, dh + 0.025, 0.006, tint(wall, 0.8));
      g.box(cx - dw / 2, 0, z + d, dw, dh, 0.012, door);
      g.roundBox(cx - dw / 2 - 0.05, 0, z + d - 0.01, dw + 0.1, 0.035, 0.12, tint(wall, 1.1), 0.015);
      continue;
    }
    g.tag('ventanas');
    winFront(g, cx, h * 0.55, z + d, 0.2, Math.min(0.24, h * 0.45), wall, glass, litAt(p, r, num(p, 'iluminadas')));
  }
  g.tag('ventanas'); winSide(g, x + w, h * 0.55, z + d / 2, 0.2, Math.min(0.24, h * 0.45), wall, glass, litAt(p, r, num(p, 'iluminadas')));
  g.tag('techo');
  if (p.tipoTecho === 'plano') parapetRoof(g, x, z, w, d, h, roof, 0.08, rad);
  else gableRoof(g, x, z, w, d, h, num(p, 'pendiente'), num(p, 'alero'), roof, wall);
  if (on(p, 'jardin')) {
    g.tag('jardín');
    g.roundBox(x - 0.05, 0, z + d + 0.1, w + 0.1, 0.03, 0.32, 0x7fb069, 0.015);
    for (let k = 0; k < 3; k++) g.blob(x + 0.15 + k * (w - 0.3) / 2, 0.08, z + d + 0.26, 0.07, 0x5f9e55, 0.8, 12);
  }
}

// ---------------- Manzana colonial ----------------
export function colonial(g: Geo, r: Rng, p: Params) {
  const { x, z } = p;
  const w = num(p, 'ancho'), d = num(p, 'fondo'), fl = Math.round(num(p, 'pisos')), rad = num(p, 'redondeo');
  const wall = col(p, 'pared'), roof = col(p, 'teja'), wood = col(p, 'madera'), base = col(p, 'zocalo'), glass = col(p, 'vidrio');
  const t = 0.85, fh = 0.4, h = fl * fh + 0.06;
  g.tag('cuerpo');
  const wing = (wx: number, wz: number, ww: number, wd: number) => g.roundBox(wx, 0, wz, ww, h, wd, wall, rad);
  wing(x, z, w, t); wing(x, z + t, t, d - 2 * t); wing(x + w - t, z + t, t, d - 2 * t); wing(x, z + d - t, w, t);
  g.tag('zócalo'); g.roundBox(x - 0.01, 0, z + d - 0.03, w + 0.02, 0.1, 0.05, base, 0.015);
  g.roundBox(x + w - 0.03, 0, z - 0.01, 0.05, 0.1, d + 0.02, base, 0.015);
  // tile roofs over each wing
  g.tag('techo');
  gableRoof(g, x, z + d - t, w, t, h, 0.28, 0.06, roof, wall);
  gableRoof(g, x, z, w, t, h, 0.28, 0.06, tint(roof, 0.95), wall);
  for (const sx of [x, x + w - t]) {
    const cz = z + d / 2, len = d - 2 * t + 0.05, ang = Math.atan2(0.28, t / 2), half = t / 2 + 0.06;
    for (const s of [-1, 1]) g.rbox(sx + t / 2 + s * half / 2, h + 0.14, cz, Math.hypot(half, 0.28 * half / (t / 2)), 0.06, len, 0, 0, -s * ang, s > 0 ? roof : tint(roof, 0.86), 0.025);
  }
  const n = Math.round(num(p, 'ventanas'));
  for (let f = 0; f < fl; f++) for (let k = 0; k < n; k++) {
    const cx = x + (k + 0.5) * (w / n), cy = 0.06 + f * fh + fh * 0.5;
    if (f === 0 && k === Math.floor(n / 2) && on(p, 'porton')) {
      const dw = 0.34, dh = 0.36;
      g.tag('portón'); g.mark('porton', cx - dw / 2, 0, z + d, cx + dw / 2, dh, z + d + 0.01);
      g.box(cx - dw / 2 - 0.04, 0, z + d - 0.002, dw + 0.08, dh + 0.04, 0.006, tint(wall, 0.8));
      g.arch(cx - dw / 2, 0, z + d + 0.006, dw, dh, wood);
      continue;
    }
    g.tag('ventanas'); winFront(g, cx, cy, z + d, 0.2, 0.26, wall, glass, litAt(p, r, num(p, 'iluminadas')), !(f > 0 && on(p, 'balcones')));
    if (f > 0 && on(p, 'balcones')) {
      g.tag('balcones');
      g.roundBox(cx - 0.16, cy - 0.16, z + d - 0.01, 0.32, 0.035, 0.16, wood, 0.012);
      for (let q = 0; q < 5; q++) g.box(cx - 0.15 + q * 0.072, cy - 0.125, z + d + 0.13, 0.014, 0.12, 0.014, wood);
      g.box(cx - 0.16, cy - 0.01, z + d + 0.125, 0.32, 0.018, 0.024, wood);
    }
  }
  g.tag('ventanas');
  for (let k = 0; k < Math.max(2, Math.round(n * d / w)); k++) {
    const cz = z + t + (k + 0.5) * ((d - t) / Math.max(2, Math.round(n * d / w)));
    winSide(g, x + w, 0.06 + fh * (fl - 0.5), cz, 0.2, 0.26, wall, glass, litAt(p, r, num(p, 'iluminadas')));
  }
  g.tag('patio'); g.roundBox(x + t, 0, z + t, w - 2 * t, 0.02, d - 2 * t, 0x7fb069, 0.01);
  g.tag('árbol del patio');
  if (on(p, 'arbolPatio')) { g.cyl(x + w / 2, 0, z + d / 2, 0.04, 0.3, 0x7a5233, 8); g.blob(x + w / 2, 0.45, z + d / 2, 0.24, 0x5f9e55, 0.9); }
}

// ---------------- Árbol ----------------
export function arbol(g: Geo, _r: Rng, p: Params) {
  const { x, z } = p, h = num(p, 'altura'), c = num(p, 'copa'), leaf = col(p, 'hojas'), trunk = col(p, 'tronco');
  const cx = x + c, cz = z + c;
  g.tag('tronco'); g.cyl(cx, 0, cz, 0.035 + c * 0.08, h * 0.5, trunk, 10);
  g.tag('copa');
  const top = h * 0.5;
  if (p.forma === 'conico') { g.cone(cx, top - 0.05, cz, c * 0.85, h * 0.85, leaf, 10); g.cone(cx, top + h * 0.3, cz, c * 0.6, h * 0.55, tint(leaf, 1.12), 10); }
  else if (p.forma === 'nube') {
    g.blob(cx, top + c * 0.7, cz, c * 0.75, leaf, 0.9);
    g.blob(cx + c * 0.55, top + c * 0.55, cz + c * 0.2, c * 0.5, tint(leaf, 1.1), 0.9);
    g.blob(cx - c * 0.5, top + c * 0.5, cz - c * 0.15, c * 0.5, tint(leaf, 0.92), 0.9);
  } else g.blob(cx, top + c * 0.8, cz, c, leaf, 0.95);
}

// ---------------- Farol ----------------
export function farol(g: Geo, _r: Rng, p: Params) {
  const { x, z } = p, h = num(p, 'altura'), pole = col(p, 'poste'), light = col(p, 'luz');
  g.tag('base'); g.roundBox(x - 0.06, 0, z - 0.06, 0.12, 0.05, 0.12, tint(pole, 0.85), 0.02);
  g.tag('poste'); g.cyl(x, 0, z, 0.022, h, pole, 10);
  g.tag('lámpara');
  if (on(p, 'brazo')) {
    g.roundBox(x - 0.02, h - 0.03, z - 0.02, 0.2, 0.035, 0.04, pole, 0.015);
    g.roundBox(x + 0.12, h - 0.09, z - 0.05, 0.12, 0.06, 0.1, pole, 0.02);
    g.blob(x + 0.18, h - 0.1, z, 0.04, light, 0.6, 12, true);
  } else { g.roundBox(x - 0.06, h, z - 0.06, 0.12, 0.12, 0.12, pole, 0.03); g.blob(x, h + 0.06, z, 0.045, light, 1, 12, true); }
}

// ---------------- Bus ----------------
export function bus(g: Geo, _r: Rng, p: Params) {
  const { x, z } = p, L = num(p, 'largo'), W = 0.56, H = 0.56, rad = num(p, 'redondeo');
  const body = col(p, 'color'), band = col(p, 'franja'), glass = col(p, 'vidrio');
  g.tag('carrocería'); g.roundBox(x, 0.1, z, L, H, W, body, rad);
  g.tag('franja'); g.roundBox(x + 0.02, 0.18, z - 0.008, L - 0.04, 0.05, W + 0.016, band, 0.02);
  g.tag('ventanas');
  const n = Math.round(num(p, 'ventanas'));
  for (let k = 0; k < n; k++) {
    const wx = x + 0.12 + k * ((L - 0.42) / n), ww = (L - 0.42) / n - 0.05;
    g.roundBox(wx, 0.34, z - 0.01, ww, 0.2, W + 0.02, glass, 0.02);
  }
  g.tag('parabrisas'); g.roundBox(x + L - 0.12, 0.3, z + 0.04, 0.14, 0.26, W - 0.08, glass, 0.03);
  g.tag('faros');
  for (const zz of [z + 0.08, z + W - 0.16]) g.blob(x + L + 0.005, 0.2, zz + 0.04, 0.03, 0xfff3c4, 1, 10, true);
  const wr = num(p, 'ruedas');
  g.tag('ruedas');
  for (const wx of [x + 0.32, x + L - 0.34]) for (const wz of [z - 0.005, z + W + 0.005]) { g.wheel(wx, wr, wz, wr, 0.08, 0x2a2f45); g.wheel(wx, wr, wz, wr * 0.45, 0.1, 0x9aa6c4); }
}

// ---------------- Persona ----------------
export function persona(g: Geo, _r: Rng, p: Params) {
  const { x, z } = p, s = num(p, 'altura') / 0.32, hd = num(p, 'cabeza');
  const cx = x + 0.08, cz = z + 0.08;
  g.tag('piernas'); g.capsule(cx - 0.025 * s, 0, cz, 0.022 * s, 0.07 * s, col(p, 'pantalon'));
  g.capsule(cx + 0.025 * s, 0, cz, 0.022 * s, 0.07 * s, col(p, 'pantalon'));
  g.tag('torso'); g.capsule(cx, 0.08 * s, cz, 0.058 * s, 0.07 * s, col(p, 'ropa'));
  const hy = 0.08 * s + 0.07 * s + 0.116 * s + hd * 0.8;
  g.tag('cabeza'); g.blob(cx, hy, cz, hd, col(p, 'piel'), 1, 16);
  g.tag('pelo');
  g.blob(cx, hy + hd * 0.34, cz - hd * 0.2, hd * 1.1, col(p, 'pelo'), 0.62, 16);   // hair cap, clear of the face
}

// ---------------- Estación (acceso en la calle) ----------------
export function estacion(g: Geo, _r: Rng, p: Params) {
  const { x, z } = p, w = num(p, 'ancho'), roofC = col(p, 'techo'), post = col(p, 'postes'), totem = col(p, 'totem');
  const cx = x + 1.55, zc = z + 0.8, rad = 0.04;
  g.tag('plaza'); g.roundBox(cx - 1.55, 0, z, 3.1, 0.03, 2.1, col(p, 'plaza'), 0.015);
  g.tag('escalera');
  g.roundBox(cx - 0.55, 0.01, zc - 0.42, 1.1, 0.03, 0.84, 0x1b2340, 0.01);
  for (let k = 0; k < 4; k++) g.box(cx - 0.5, 0.0 - k * 0.0, zc - 0.36 + k * 0.17, 1.0, 0.045 - k * 0.01, 0.15, tint(0x1b2340, 1.4 - k * 0.1));
  const half = w / 2;
  g.tag('postes');
  for (const [px, pz] of [[-half + 0.08, -0.45], [half - 0.12, -0.45], [-half + 0.08, 0.42], [half - 0.12, 0.42]]) g.roundBox(cx + px, 0, zc + pz, 0.06, 0.86, 0.06, post, 0.025);
  g.tag('techo'); g.roundBox(cx - half, 0.86, zc - 0.55, w, 0.07, 1.05, roofC, rad);
  g.roundBox(cx - half + 0.06, 0.93, zc - 0.49, w - 0.12, 0.015, 0.93, tint(roofC, 1.15), 0.01);
  const th = num(p, 'altoTotem');
  g.tag('tótem');
  g.roundBox(cx + half + 0.25, 0, zc + 0.35, 0.14, th, 0.14, totem, 0.05);
  g.cyl(cx + half + 0.32, th + 0.02, zc + 0.42, 0.15, 0.05, totem, 24);
  g.cyl(cx + half + 0.32, th + 0.025, zc + 0.42, 0.11, 0.05, 0xffffff, 24, true);
}

// ---------------- registration: new versions in review ----------------
const C = 'Color';
const S: Record<string, Setting[]> = {
  edificio: [
    { k: 'pisos', label: 'Pisos', t: 'num', min: 1, max: 10, step: 1, group: 'Forma' },
    { k: 'colsFrente', label: 'Ventanas al frente', t: 'num', min: 1, max: 6, step: 1, group: 'Forma' },
    { k: 'colsLado', label: 'Ventanas al costado', t: 'num', min: 1, max: 6, step: 1, group: 'Forma' },
    { k: 'modulo', label: 'Ancho por ventana', t: 'num', min: 0.3, max: 0.7, step: 0.01, group: 'Forma' },
    { k: 'alturaPiso', label: 'Altura de cada piso', t: 'num', min: 0.3, max: 0.6, step: 0.01, group: 'Forma' },
    { k: 'redondeo', label: 'Redondeo de bordes', t: 'num', min: 0, max: 0.12, step: 0.005, group: 'Forma' },
    { k: 'parapeto', label: 'Alto del borde del techo', t: 'num', min: 0.04, max: 0.25, step: 0.01, group: 'Forma' },
    { k: 'ventanaAncho', label: 'Ancho de ventana', t: 'num', min: 0.1, max: 0.4, step: 0.01, group: 'Ventanas' },
    { k: 'ventanaAlto', label: 'Alto de ventana', t: 'num', min: 0.1, max: 0.45, step: 0.01, group: 'Ventanas' },
    { k: 'ventanasDobles', label: 'Ventanas dobles al costado', t: 'bool', group: 'Ventanas' },
    { k: 'iluminadas', label: 'Ventanas encendidas (noche)', t: 'num', min: 0, max: 1, step: 0.05, group: 'Ventanas' },
    { k: 'conPuerta', label: 'Puerta', t: 'bool', group: 'Ventanas' },
    { k: 'escalon', label: 'Escalón en la entrada', t: 'bool', group: 'Ventanas' },
    { k: 'pared', label: 'Pared', t: 'color', group: C }, { k: 'cornisa', label: 'Techo y escalón', t: 'color', group: C },
    { k: 'vidrio', label: 'Vidrio', t: 'color', group: C }, { k: 'puerta', label: 'Puerta', t: 'color', group: C },
  ],
  casa: [
    { k: 'ancho', label: 'Ancho', t: 'num', min: 0.6, max: 2.5, step: 0.05, group: 'Forma' },
    { k: 'fondo', label: 'Fondo', t: 'num', min: 0.6, max: 2.0, step: 0.05, group: 'Forma' },
    { k: 'alto', label: 'Alto de paredes', t: 'num', min: 0.3, max: 0.9, step: 0.01, group: 'Forma' },
    { k: 'redondeo', label: 'Redondeo de bordes', t: 'num', min: 0, max: 0.1, step: 0.005, group: 'Forma' },
    { k: 'tipoTecho', label: 'Techo', t: 'sel', opts: [['dosaguas', 'A dos aguas'], ['plano', 'Plano con borde']], group: 'Techo' },
    { k: 'pendiente', label: 'Altura del techo', t: 'num', min: 0.1, max: 0.6, step: 0.01, group: 'Techo' },
    { k: 'alero', label: 'Alero', t: 'num', min: 0, max: 0.2, step: 0.01, group: 'Techo' },
    { k: 'ventanas', label: 'Huecos al frente', t: 'num', min: 1, max: 5, step: 1, group: 'Fachada' },
    { k: 'conPuerta', label: 'Puerta', t: 'bool', group: 'Fachada' },
    { k: 'jardin', label: 'Jardín delantero', t: 'bool', group: 'Fachada' },
    { k: 'iluminadas', label: 'Ventanas encendidas (noche)', t: 'num', min: 0, max: 1, step: 0.05, group: 'Fachada' },
    { k: 'pared', label: 'Pared', t: 'color', group: C }, { k: 'techo', label: 'Techo', t: 'color', group: C },
    { k: 'puerta', label: 'Puerta', t: 'color', group: C }, { k: 'vidrio', label: 'Vidrio', t: 'color', group: C },
  ],
  colonial: [
    { k: 'ancho', label: 'Ancho', t: 'num', min: 2.5, max: 6, step: 0.1, group: 'Forma' },
    { k: 'fondo', label: 'Fondo', t: 'num', min: 2.0, max: 5, step: 0.1, group: 'Forma' },
    { k: 'pisos', label: 'Pisos', t: 'num', min: 1, max: 3, step: 1, group: 'Forma' },
    { k: 'redondeo', label: 'Redondeo de bordes', t: 'num', min: 0, max: 0.1, step: 0.005, group: 'Forma' },
    { k: 'ventanas', label: 'Ventanas por fachada', t: 'num', min: 3, max: 10, step: 1, group: 'Fachada' },
    { k: 'balcones', label: 'Balcones de madera', t: 'bool', group: 'Fachada' },
    { k: 'porton', label: 'Portón central', t: 'bool', group: 'Fachada' },
    { k: 'arbolPatio', label: 'Árbol en el patio', t: 'bool', group: 'Fachada' },
    { k: 'iluminadas', label: 'Ventanas encendidas (noche)', t: 'num', min: 0, max: 1, step: 0.05, group: 'Fachada' },
    { k: 'pared', label: 'Pared', t: 'color', group: C }, { k: 'teja', label: 'Teja', t: 'color', group: C },
    { k: 'madera', label: 'Madera (balcones y portón)', t: 'color', group: C }, { k: 'zocalo', label: 'Zócalo', t: 'color', group: C },
    { k: 'vidrio', label: 'Vidrio', t: 'color', group: C },
  ],
  arbol: [
    { k: 'forma', label: 'Forma', t: 'sel', opts: [['redondo', 'Redondo'], ['nube', 'Nube (3 copas)'], ['conico', 'Cónico']], group: 'Forma' },
    { k: 'altura', label: 'Altura del tronco', t: 'num', min: 0.2, max: 1.2, step: 0.02, group: 'Forma' },
    { k: 'copa', label: 'Tamaño de la copa', t: 'num', min: 0.12, max: 0.6, step: 0.01, group: 'Forma' },
    { k: 'hojas', label: 'Hojas', t: 'color', group: C }, { k: 'tronco', label: 'Tronco', t: 'color', group: C },
  ],
  farol: [
    { k: 'altura', label: 'Altura', t: 'num', min: 0.5, max: 1.4, step: 0.02, group: 'Forma' },
    { k: 'brazo', label: 'Con brazo', t: 'bool', group: 'Forma' },
    { k: 'poste', label: 'Poste', t: 'color', group: C }, { k: 'luz', label: 'Luz', t: 'color', group: C },
  ],
  bus: [
    { k: 'largo', label: 'Largo', t: 'num', min: 1.2, max: 2.6, step: 0.05, group: 'Forma' },
    { k: 'ventanas', label: 'Ventanas por lado', t: 'num', min: 2, max: 7, step: 1, group: 'Forma' },
    { k: 'ruedas', label: 'Tamaño de ruedas', t: 'num', min: 0.06, max: 0.16, step: 0.005, group: 'Forma' },
    { k: 'redondeo', label: 'Redondeo de bordes', t: 'num', min: 0, max: 0.2, step: 0.005, group: 'Forma' },
    { k: 'color', label: 'Carrocería', t: 'color', group: C }, { k: 'franja', label: 'Franja', t: 'color', group: C }, { k: 'vidrio', label: 'Vidrio', t: 'color', group: C },
  ],
  persona: [
    { k: 'altura', label: 'Altura', t: 'num', min: 0.2, max: 0.45, step: 0.005, group: 'Forma' },
    { k: 'cabeza', label: 'Tamaño de cabeza', t: 'num', min: 0.035, max: 0.09, step: 0.002, group: 'Forma' },
    { k: 'ropa', label: 'Ropa', t: 'color', group: C }, { k: 'pantalon', label: 'Pantalón', t: 'color', group: C },
    { k: 'piel', label: 'Piel', t: 'color', group: C }, { k: 'pelo', label: 'Pelo', t: 'color', group: C },
  ],
  estacion: [
    { k: 'ancho', label: 'Ancho del techo', t: 'num', min: 1.0, max: 2.4, step: 0.05, group: 'Forma' },
    { k: 'altoTotem', label: 'Alto del tótem M', t: 'num', min: 0.6, max: 1.8, step: 0.05, group: 'Forma' },
    { k: 'techo', label: 'Techo', t: 'color', group: C }, { k: 'postes', label: 'Postes', t: 'color', group: C },
    { k: 'totem', label: 'Tótem', t: 'color', group: C }, { k: 'plaza', label: 'Piso de la plaza', t: 'color', group: C },
  ],
};

const NOTE = 'Nuevo estilo «arcilla» (low-poly estilizado, bordes suaves, ventanas hundidas, colores mate), con ajustes editables.';
function addReview(id: string, v: string, build: (g: Geo, r: Rng, p: Params) => void, defaults: Record<string, number | boolean | string>, settings: Setting[]) {
  const m = model(id);
  m.versions[v] = { build, defaults, settings, notes: NOTE, date: D, look: 'smooth' };
  m.review = v;
}
export function registerClay(register: (d: import('./registry').ModelDef) => void) {
  register({ id: 'edificio', name: 'Edificio', group: 'Barrios', approved: 'v1', versions: { v1: { build: edificio, settings: S.edificio, look: 'smooth', date: D,
    notes: 'Primera versión, a partir de la referencia: cuerpo con bordes suaves, ventanas hundidas con alféizar, borde de techo grueso, puerta doble con escalón.',
    defaults: { pisos: 4, colsFrente: 3, colsLado: 3, modulo: 0.42, alturaPiso: 0.42, redondeo: 0.05, parapeto: 0.12, ventanaAncho: 0.22, ventanaAlto: 0.27, ventanasDobles: true, iluminadas: 0.3, conPuerta: true, escalon: true, pared: '#E8643C', cornisa: '#F6C98E', vidrio: '#A9BCCB', puerta: '#8C6A4A' } } } });
  addReview('casa', 'v2', casa, { ancho: 1.4, fondo: 1.1, alto: 0.5, redondeo: 0.04, tipoTecho: 'dosaguas', pendiente: 0.32, alero: 0.08, ventanas: 3, conPuerta: true, jardin: false, iluminadas: 0.3, pared: '#F2E3CC', techo: '#D9653B', puerta: '#7A5233', vidrio: '#A9BCCB' }, S.casa);
  addReview('manzana-colonial', 'v2', colonial, { ancho: 4.9, fondo: 3.65, pisos: 2, redondeo: 0.03, ventanas: 7, balcones: true, porton: true, arbolPatio: true, iluminadas: 0.25, pared: '#F6EFE2', teja: '#C8583A', madera: '#6B4426', zocalo: '#3E6E8E', vidrio: '#A9BCCB' }, S.colonial);
  addReview('arbol', 'v2', arbol, { forma: 'redondo', altura: 0.5, copa: 0.28, hojas: '#5F9E55', tronco: '#7A5233' }, S.arbol);
  addReview('farol', 'v2', farol, { altura: 0.9, brazo: true, poste: '#3B4A72', luz: '#FFE3A0' }, S.farol);
  addReview('bus', 'v2', bus, { largo: 1.6, ventanas: 4, ruedas: 0.1, redondeo: 0.1, color: '#3DBE8B', franja: '#F6C98E', vidrio: '#A9D6F0' }, S.bus);
  addReview('persona', 'v2', persona, { altura: 0.3, cabeza: 0.055, ropa: '#3B8BEB', pantalon: '#2A3156', piel: '#E8B896', pelo: '#3A2A20' }, S.persona);
  addReview('estacion-superficie', 'v2', estacion, { ancho: 1.44, altoTotem: 1.2, techo: '#BFE0FF', postes: '#E9EDF5', totem: '#2F79E0', plaza: '#C9CED8' }, S.estacion);
}

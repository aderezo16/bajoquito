import { model, models, Params } from './registry';

/**
 * Approvals: which version the GAME uses.
 * Each entry turns what Andrés saved in the workshop into a new version, then everything in review is approved.
 */
const D = '2026-11-27';
const fromWorkshop: Record<string, { base: string; params: Record<string, number | boolean | string>; notes: string }> = {
  catedral: {
    base: 'v2', notes: 'Tus ajustes del taller (27 nov): escalinata, marco de puerta, contrafuertes con pináculos, ventanas en torres, nave y costados, cruz, y agujas nuevas en las torres en lugar de los chapiteles.',
    params: {
      __ocultar: '["chapiteles"]',
      __extras: JSON.stringify([
        { nombre: 'escalinata_1', forma: 'caja_redondeada', x: 1.63, y: 0, z: 2.91, ancho: 0.84, alto: 0.05, fondo: 0.25, color: '#D9D0BE' },
        { nombre: 'escalinata_2', forma: 'caja_redondeada', x: 1.73, y: 0.05, z: 2.91, ancho: 0.64, alto: 0.05, fondo: 0.15, color: '#CFC5B2' },
        { nombre: 'marco_puerta_arriba', forma: 'caja_redondeada', x: 1.77, y: 0.66, z: 2.9, ancho: 0.56, alto: 0.08, fondo: 0.1, color: '#6E8F7E' },
        { nombre: 'marco_puerta_izq', forma: 'caja_redondeada', x: 1.77, y: 0.1, z: 2.9, ancho: 0.06, alto: 0.56, fondo: 0.1, color: '#6E8F7E' },
        { nombre: 'marco_puerta_der', forma: 'caja_redondeada', x: 2.27, y: 0.1, z: 2.9, ancho: 0.06, alto: 0.56, fondo: 0.1, color: '#6E8F7E' },
        { nombre: 'contrafuerte_izq', forma: 'caja_redondeada', x: 0, y: 0, z: 0.5, ancho: 0.1, alto: 0.9, fondo: 0.2, color: '#D9D0BE', repetir: { veces: 4, dx: 0, dy: 0, dz: 0.55 } },
        { nombre: 'contrafuerte_der', forma: 'caja_redondeada', x: 4, y: 0, z: 0.5, ancho: 0.1, alto: 0.9, fondo: 0.2, color: '#D9D0BE', repetir: { veces: 4, dx: 0, dy: 0, dz: 0.55 } },
        { nombre: 'ventana_lado_der', forma: 'panel_lado', x: 4.01, y: 0.35, z: 0.8, ancho: 0.01, alto: 0.4, fondo: 0.15, color: '#A9BCCB', repetir: { veces: 3, dx: 0, dy: 0, dz: 0.55 } },
        { nombre: 'ventana_lado_izq', forma: 'panel_lado', x: 0.09, y: 0.35, z: 0.8, ancho: 0.01, alto: 0.4, fondo: 0.15, color: '#A9BCCB', repetir: { veces: 3, dx: 0, dy: 0, dz: 0.55 } },
        { nombre: 'cruz_vertical', forma: 'caja_redondeada', x: 2.015, y: 1.45, z: 1.4, ancho: 0.07, alto: 0.4, fondo: 0.07, color: '#6E8F7E' },
        { nombre: 'cruz_horizontal', forma: 'caja_redondeada', x: 1.9, y: 1.68, z: 1.4, ancho: 0.3, alto: 0.07, fondo: 0.07, color: '#6E8F7E' },
        { nombre: 'ventana_torre_izq', forma: 'panel_frente', x: 0.445, y: 0.45, z: 2.94, ancho: 0.14, alto: 0.5, fondo: 0.01, color: '#A9BCCB' },
        { nombre: 'punta_ventana_torre_izq', forma: 'cono', x: 0.515, y: 0.95, z: 2.94, radio: 0.07, alto: 0.14, color: '#A9BCCB' },
        { nombre: 'ventana_torre_der', forma: 'panel_frente', x: 3.515, y: 0.45, z: 2.94, ancho: 0.14, alto: 0.5, fondo: 0.01, color: '#A9BCCB' },
        { nombre: 'punta_ventana_torre_der', forma: 'cono', x: 3.585, y: 0.95, z: 2.94, radio: 0.07, alto: 0.14, color: '#A9BCCB' },
        { nombre: 'ventana_nave_izq', forma: 'panel_frente', x: 1.27, y: 0.25, z: 2.92, ancho: 0.16, alto: 0.5, fondo: 0.01, color: '#A9BCCB' },
        { nombre: 'punta_ventana_nave_izq', forma: 'cono', x: 1.35, y: 0.75, z: 2.92, radio: 0.08, alto: 0.14, color: '#A9BCCB' },
        { nombre: 'ventana_nave_der', forma: 'panel_frente', x: 2.67, y: 0.25, z: 2.92, ancho: 0.16, alto: 0.5, fondo: 0.01, color: '#A9BCCB' },
        { nombre: 'punta_ventana_nave_der', forma: 'cono', x: 2.75, y: 0.75, z: 2.92, radio: 0.08, alto: 0.14, color: '#A9BCCB' },
        { nombre: 'pinaculo_izq', forma: 'cono', x: 0.05, y: 0.9, z: 0.6, radio: 0.08, alto: 0.22, color: '#6E8F7E', repetir: { veces: 4, dx: 0, dy: 0, dz: 0.55 } },
        { nombre: 'pinaculo_der', forma: 'cono', x: 4.05, y: 0.9, z: 0.6, radio: 0.08, alto: 0.22, color: '#6E8F7E', repetir: { veces: 4, dx: 0, dy: 0, dz: 0.55 } },
        { nombre: 'base_aguja_izq', forma: 'caja_redondeada', x: 0.08, y: 2, z: 2.09, ancho: 0.87, alto: 0.08, fondo: 0.87, color: '#6E8F7E' },
        { nombre: 'base_aguja_der', forma: 'caja_redondeada', x: 3.15, y: 2, z: 2.09, ancho: 0.87, alto: 0.08, fondo: 0.87, color: '#6E8F7E' },
        { nombre: 'aguja_torre_izq', forma: 'cono', x: 0.515, y: 2.08, z: 2.525, radio: 0.42, alto: 0.9, color: '#6E8F7E' },
        { nombre: 'aguja_torre_der', forma: 'cono', x: 3.585, y: 2.08, z: 2.525, radio: 0.42, alto: 0.9, color: '#6E8F7E' },
      ]),
    },
  },
  'estacion-subterranea': { base: 'v2', notes: 'Tus ajustes del taller (27 nov): andén más largo (5,1).', params: { largoAnden: 5.1 } },
};

export function applyApprovals() {
  for (const [id, w] of Object.entries(fromWorkshop)) {
    const m = model(id), b = m.versions[w.base];
    const v = 'v' + (Object.keys(m.versions).length + 1);
    m.versions[v] = { ...b, defaults: { ...b.defaults, ...w.params } as Omit<Params, 'x' | 'z'>, notes: w.notes, date: D };
    m.review = v;
  }
  // 27 nov: Andrés aprobó todo lo que estaba en revisión
  for (const m of models()) if (m.review) { m.approved = m.review; m.review = undefined; }
}

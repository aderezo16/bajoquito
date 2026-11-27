/**
 * Workshop chat: the user asks in plain Spanish ("ponle toldos a las ventanas", "quita el escalón",
 * "techo más alto y verde") and Claude answers with concrete changes to the model, which are applied at once.
 * Runs on the viewer's own Claude account through the artifact's `sample` capability.
 */
import { Extra, FORMAS } from '../models/extras';

export interface ChatState {
  modelo: string; version: string;
  tamaño: { ancho: number; alto: number; fondo: number };
  ajustes: { clave: string; etiqueta: string; tipo: string; min?: number; max?: number; opciones?: string[]; valor: unknown }[];
  partes: { parte: string; desde: number[]; hasta: number[]; oculta: boolean }[];
  elementos: { tipo: string; centro: number[]; tamaño: number[] }[];
  agregados: Extra[];
}
export interface Change {
  respuesta?: string;
  ajustes?: Record<string, unknown>;
  ocultar?: string[]; mostrar?: string[];
  agregar?: Extra[]; quitar_agregados?: string[];
}
type Sample = ((input: unknown, opts?: unknown) => Promise<{ text: string }>) & { json: <T>(input: unknown, opts?: unknown) => Promise<T> };

const RULES = `Eres el asistente del Taller de modelos 3D del juego «Bajo Quito» (estilo low-poly estilizado tipo «arcilla»: bordes suaves, colores mate, formas simples y limpias).
El usuario no es programador: te pide cambios en palabras sobre UN modelo y tú respondes SOLO con un objeto JSON con los cambios, que la página aplica de inmediato.

Sistema de coordenadas del modelo (en unidades; 1 unidad ≈ 8 m; una persona mide ~0,3):
- x: de 0 (borde izquierdo) a «ancho» (borde derecho). y: desde el suelo (0) hacia arriba. z: de 0 (la parte de atrás) a «fondo» (el FRENTE, la fachada que mira al usuario).
- La cara del frente está en z = fondo; la cara del costado visible está en x = ancho.

Tienes estas herramientas, en este orden de preferencia:
1. "ajustes": cambia valores de los ajustes existentes (respeta min/max y las opciones). Es lo mejor cuando el pedido calza con un ajuste.
2. "ocultar" / "mostrar": quita o devuelve partes del modelo por su nombre exacto de la lista «partes».
3. "agregar": piezas nuevas. Cada pieza: {"nombre": texto corto único, "forma": una de ${FORMAS.join(', ')}, "x","y","z" (esquina mínima; en cilindro/esfera/cono/luz/rueda es el centro de la base o el centro), "ancho","alto","fondo" (cajas y paneles), "radio" (cilindro, esfera, cono, rueda, luz), "color": "#RRGGBB", opcional "repetir": {"veces": n, "dx","dy","dz"} para filas de piezas iguales}.
   - "panel_frente" es un plano pegado a una fachada que mira al frente (z fija); "panel_lado" mira al costado derecho (x fija). "luz" brilla de noche.
   - Usa «elementos» (posición de cada ventana, puerta, etc.) para colocar cosas encima o junto a ellos. Ejemplo: toldo sobre una ventana del frente con centro [cx, cy, cz] y tamaño [w, h, d]: caja_redondeada con x = cx − (w+0,08)/2, ancho = w+0,08, y = cy + h/2 + 0,02, alto 0,05, z = fondo − 0,02, fondo 0,16 (sobresale hacia el frente).
   - Mantén el estilo: piezas simples, proporcionadas, colores armónicos con el modelo. Piezas que toquen el modelo, no flotando.
4. "quitar_agregados": nombres de piezas agregadas antes que hay que eliminar.

Formato de respuesta (solo JSON, sin texto alrededor):
{"respuesta": "1–2 frases en español, tono cercano, diciendo qué hiciste", "ajustes": {}, "ocultar": [], "mostrar": [], "agregar": [], "quitar_agregados": []}
Si el pedido es ambiguo o no se puede, no cambies nada y en "respuesta" pregunta o explica en una frase. Nunca uses la palabra «jorga».`;

export function setupChat(opts: { state: () => ChatState | null; apply: (c: Change) => string[]; undo: () => boolean; canUndo: () => boolean; onBusy?: (b: boolean) => void }) {
  const log = document.getElementById('chatlog')!, input = document.getElementById('chatin') as HTMLTextAreaElement;
  const send = document.getElementById('chatsend') as HTMLButtonElement, undoB = document.getElementById('chatundo') as HTMLButtonElement;
  const off = document.getElementById('chatoff')!;
  let sample: Sample | null = null, ctl: AbortController | null = null;
  let turns: { role: 'user' | 'assistant'; content: string }[] = [];
  let modelKey = '';

  const bubble = (who: 'yo' | 'claude' | 'nota', text: string, chips: string[] = []) => {
    const b = document.createElement('div'); b.className = 'msg ' + who;
    const t = document.createElement('div'); t.textContent = text; b.appendChild(t);
    if (chips.length) { const c = document.createElement('div'); c.className = 'chips'; for (const s of chips) { const s1 = document.createElement('span'); s1.textContent = s; c.appendChild(s1); } b.appendChild(c); }
    log.appendChild(b); log.scrollTop = log.scrollHeight; return t;
  };
  const busy = (on: boolean) => { send.textContent = on ? 'Detener' : 'Enviar'; input.disabled = on; opts.onBusy?.(on); };

  (async () => {
    const use = window.claude?.use;
    if (use) { try { sample = (await use('sample')) as Sample | null; } catch { sample = null; } }
    off.hidden = !!sample;
    send.disabled = !sample;
  })();

  async function ask() {
    if (ctl) { ctl.abort(); return; }
    const msg = input.value.trim();
    const st = opts.state();
    if (!msg || !sample) return;
    if (!st) { bubble('nota', 'Esta versión no se puede editar. Elige en la ficha la versión del estilo nuevo.'); return; }
    const key = st.modelo + '|' + st.version;
    if (key !== modelKey) { turns = []; modelKey = key; }
    bubble('yo', msg); input.value = '';
    const think = bubble('claude', 'Pensando…');
    turns.push({ role: 'user', content: msg });
    const ctx = `${RULES}\n\nEstado actual del modelo (JSON):\n${JSON.stringify(st)}`;
    ctl = new AbortController(); busy(true);
    try {
      const recent = turns.slice(-8);
      const ch = await sample.json<Change>([{ role: 'user', content: ctx }, ...recent], { signal: ctl.signal, cache: false, modelTier: 'default' });
      const done = opts.apply(ch ?? {});
      const reply = (typeof ch?.respuesta === 'string' && ch.respuesta) || (done.length ? 'Listo.' : 'No hice cambios.');
      think.textContent = reply;
      if (done.length) { const c = document.createElement('div'); c.className = 'chips'; for (const s of done) { const x = document.createElement('span'); x.textContent = s; c.appendChild(x); } think.parentElement!.appendChild(c); }
      turns.push({ role: 'assistant', content: JSON.stringify(ch) });
      undoB.disabled = false;
    } catch (e) {
      const code = (e as { code?: string }).code;
      think.textContent = code === 'cancelled' ? 'Detenido.' : code === 'not_granted' || code === 'sampling_disabled' ? 'El chat necesita tu permiso para usar Claude en esta página.' : code === 'rate_limited' ? 'Demasiados pedidos seguidos; espera un momento.' : code === 'invalid_json' ? 'No entendí bien la respuesta; prueba decirlo de otra forma.' : 'No pude completar el pedido; vuelve a intentar.';
      turns.pop();
    } finally { ctl = null; busy(false); }
  }
  send.onclick = ask;
  input.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } };
  undoB.onclick = () => { if (opts.undo()) bubble('nota', 'Deshice el último cambio.'); undoB.disabled = !opts.canUndo(); };
  return { reset() { log.innerHTML = ''; turns = []; modelKey = ''; undoB.disabled = !opts.canUndo(); }, refresh() { undoB.disabled = !opts.canUndo(); } };
}

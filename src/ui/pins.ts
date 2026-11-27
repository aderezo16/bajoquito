import * as THREE from 'three';
import { Place } from '../world/surface';

const ICON: Record<string, string> = {
  municipio: '<path d="M3 10h18M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18M12 3l9 5H3z"/>',
  concejo: '<path d="M4 20h16M6 20v-6M10 20v-6M14 20v-6M18 20v-6M5 14h14M7 14a5 5 0 0 1 10 0M12 6v3"/>',
  bodega: '<path d="M3 8l9-5 9 5v12H3z"/><path d="M7 20v-7h10v7M7 16h10"/>',
};

/** Labels that float over the places you can open. They never get hidden behind buildings. */
export class Pins {
  private els: { p: Place; el: HTMLDivElement }[] = [];
  private view: 'sup' | 'sub' = 'sup';
  private v = new THREE.Vector3();
  constructor(root: HTMLElement, places: Place[], private camera: THREE.Camera, private canvas: HTMLCanvasElement,
    onOpen: (id: string) => void, onHover: (id: string | null) => void) {
    for (const p of places) {
      const el = document.createElement('div');
      el.className = 'pin ' + (p.kind === 'station' ? 's' : 'f');
      el.dataset.id = p.id;
      el.innerHTML = p.kind === 'station'
        ? `<div class="chip"><span class="ic">M</span>${p.name}</div><div class="stem"></div>`
        : `<div class="chip"><span class="ic"><svg viewBox="0 0 24 24">${ICON[p.id] ?? ''}</svg></span>${p.name}</div><div class="stem"></div>`;
      el.addEventListener('click', () => onOpen(p.id));
      el.addEventListener('pointerenter', () => onHover(p.id));
      el.addEventListener('pointerleave', () => onHover(null));
      root.appendChild(el);
      this.els.push({ p, el });
    }
    this.setView('sup');
  }
  setView(v: 'sup' | 'sub') { this.view = v; for (const { p, el } of this.els) el.style.display = p.view === v ? '' : 'none'; }
  highlight(id: string | null) { for (const { p, el } of this.els) el.classList.toggle('hl', p.id === id && p.view === this.view); }
  update() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    for (const { p, el } of this.els) {
      if (p.view !== this.view) continue;
      this.v.copy(p.anchor).project(this.camera);
      const x = (this.v.x * 0.5 + 0.5) * w, y = (-this.v.y * 0.5 + 0.5) * h;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    }
  }
}

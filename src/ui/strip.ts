import * as THREE from 'three';
import { SLICE, STATIONS, SLICE_X0, SLICE_X1 } from '../world/config';

/** The whole line at a glance. In this test only the Centro slice is built; the rest is shown as "coming". */
export class Strip {
  private win: SVGRectElement;
  private sx = (i: number) => 30 + i * (800 / 14);
  constructor(root: HTMLElement, onGo: (i: number) => void) {
    let s = `<svg width="860" height="58" viewBox="0 0 860 58"><rect id="swin" y="6" height="46" rx="5" fill="rgba(255,200,87,.12)" stroke="#FFC857" stroke-width="1.5"/>`;
    s += `<line x1="30" y1="29" x2="830" y2="29" stroke="#3D8BFF" stroke-width="4" stroke-linecap="round" opacity=".5"/>`;
    s += `<line x1="${this.sx(SLICE.from)}" y1="29" x2="${this.sx(SLICE.to)}" y2="29" stroke="#3D8BFF" stroke-width="4" stroke-linecap="round"/>`;
    STATIONS.forEach((n, i) => {
      const on = i >= SLICE.from && i <= SLICE.to, up = i % 2 === 0;
      s += `<g class="dot ${on ? 'on' : 'off'}" data-i="${i}"><circle cx="${this.sx(i)}" cy="29" r="${on ? 6 : 4.5}" fill="#0B1236" stroke="${on ? '#FFC857' : '#5A6BB0'}" stroke-width="2"/>`
        + `<text x="${this.sx(i)}" y="${up ? 16 : 50}" text-anchor="middle">${n}</text></g>`;
    });
    root.innerHTML = s + '</svg>';
    this.win = root.querySelector('#swin')!;
    root.querySelectorAll<SVGGElement>('.dot.on').forEach(g => g.addEventListener('click', () => onGo(+g.dataset.i!)));
  }
  update(_x: number, camera: THREE.OrthographicCamera, canvas: HTMLCanvasElement) {
    // visible x-range on the ground, mapped onto the strip between the slice's stations
    const ray = new THREE.Raycaster(), p = new THREE.Vector3(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const xs: number[] = [];
    for (const nx of [-1, 1]) { ray.setFromCamera(new THREE.Vector2(nx, 0), camera); if (ray.ray.intersectPlane(plane, p)) xs.push(p.x); }
    if (xs.length < 2) return;
    const span = SLICE_X1 - SLICE_X0, a = this.sx(SLICE.from) - 28, b = this.sx(SLICE.to) + 28;
    const m = (x: number) => a + (x - SLICE_X0) / span * (b - a);
    const x0 = Math.max(4, m(Math.min(...xs))), x1 = Math.min(856, m(Math.max(...xs)));
    this.win.setAttribute('x', String(x0)); this.win.setAttribute('width', String(Math.max(8, x1 - x0)));
    void canvas;
  }
}

import * as THREE from 'three';
import { STATIONS, SLICE_X0, SLICE_X1, stationX } from '../world/config';

/** The whole line at a glance: where the camera is, which stations need attention. Click a station to go there. */
export class LineNav {
  private win: SVGRectElement;
  private dots: SVGCircleElement[] = [];
  private W = 340;
  private sx = (i: number) => 14 + i * ((this.W - 28) / 14);
  private ray = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private p = new THREE.Vector3();
  constructor(private root: HTMLElement, onGo: (i: number) => void) {
    const W = this.W;
    let s = `<svg width="${W}" height="54" viewBox="0 0 ${W} 54" role="navigation" aria-label="Línea del Metro"><rect id="lwin" y="8" height="30" rx="4" fill="rgba(255,200,87,.10)" stroke="#FFC857" stroke-width="1.2"/>`;
    s += `<line x1="14" y1="23" x2="${W - 14}" y2="23" stroke="#3D8BFF" stroke-width="3" stroke-linecap="round"/>`;
    for (const [a, b, n] of [[0, 4, 'SUR'], [5, 8, 'CENTRO'], [9, 14, 'NORTE']] as const)
      s += `<text x="${(this.sx(a) + this.sx(b)) / 2}" y="50" text-anchor="middle" class="lz">${n}</text>`;
    STATIONS.forEach((n, i) => {
      s += `<g class="ld" data-i="${i}"><title>${n}</title><circle cx="${this.sx(i)}" cy="23" r="9" fill="transparent"/><circle class="lc" cx="${this.sx(i)}" cy="23" r="4.5" fill="#0B1236" stroke="#9FD3FF" stroke-width="2"/></g>`;
    });
    root.innerHTML = s + '</svg><span id="lname"></span>';
    this.win = root.querySelector('#lwin')!;
    this.dots = [...root.querySelectorAll<SVGCircleElement>('.lc')];
    const name = root.querySelector<HTMLElement>('#lname')!;
    root.querySelectorAll<SVGGElement>('.ld').forEach(g => {
      g.addEventListener('click', () => onGo(+g.dataset.i!));
      g.addEventListener('mouseenter', () => { name.textContent = STATIONS[+g.dataset.i!]; name.style.left = this.sx(+g.dataset.i!) + 'px'; name.style.opacity = '1'; });
      g.addEventListener('mouseleave', () => (name.style.opacity = '0'));
    });
  }
  setAlerts(bad: boolean[]) { this.dots.forEach((d, i) => { d.setAttribute('stroke', bad[i] ? '#E5484D' : '#9FD3FF'); d.setAttribute('fill', bad[i] ? '#E5484D' : '#0B1236'); }); }
  update(camera: THREE.OrthographicCamera, groundY: number) {
    this.plane.constant = -groundY;
    const xs: number[] = [];
    for (const nx of [-1, 1]) { this.ray.setFromCamera(new THREE.Vector2(nx, 0), camera); if (this.ray.ray.intersectPlane(this.plane, this.p)) xs.push(this.p.x); }
    if (xs.length < 2) return;
    const m = (x: number) => this.sx(0) + (x - stationX(0)) / (stationX(14) - stationX(0)) * (this.sx(14) - this.sx(0));
    const x0 = Math.max(2, m(Math.min(...xs))), x1 = Math.min(this.W - 2, m(Math.max(...xs)));
    this.win.setAttribute('x', String(x0)); this.win.setAttribute('width', String(Math.max(8, x1 - x0)));
    void SLICE_X0; void SLICE_X1; void this.root;
  }
}

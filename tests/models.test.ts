import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Geo, rng } from '../src/engine/geo';
import { approved, models } from '../src/models';

function size(id: string, v: string) {
  const m = models().find(x => x.id === id)!;
  const ver = m.versions[v];
  const g = new Geo();
  ver.build(g, rng(7), { x: 0, z: 0, ...ver.defaults } as never);
  const geos = [...g.solid, ...g.glow];
  const box = new THREE.Box3();
  for (const geo of geos) { geo.computeBoundingBox(); box.union(geo.boundingBox!); }
  return { box, count: geos.reduce((s, x) => s + x.getAttribute('position').count, 0) };
}

describe('catálogo de modelos', () => {
  it('todas las versiones se construyen sin errores y con medidas válidas', () => {
    for (const m of models()) for (const v of Object.keys(m.versions)) {
      const { box, count } = size(m.id, v);
      expect(count, `${m.id} ${v} sin geometría`).toBeGreaterThan(0);
      for (const n of [box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z]) expect(Number.isFinite(n), `${m.id} ${v} medida inválida`).toBe(true);
      expect(box.max.y, `${m.id} ${v} demasiado alto`).toBeLessThan(8);
    }
  });
  it('el juego tiene una versión aprobada de cada modelo que usa', () => {
    for (const id of ['casa', 'manzana-colonial', 'arbol', 'farol', 'semaforo', 'municipio', 'concejo', 'catedral', 'bodega', 'estacion-superficie', 'estacion-subterranea', 'tren', 'bus', 'persona'])
      expect(approved(id)).toBeTruthy();
  });
  it('escala: una persona es más baja que una casa y que el techo de la estación', () => {
    const p = size('persona', 'v1').box.max.y;
    expect(p).toBeLessThan(size('casa', 'v1').box.max.y);
    expect(p).toBeLessThan(0.85);
  });
});

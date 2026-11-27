import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Geo, rng } from '../src/engine/geo';
import { approved, model, models } from '../src/models';
import { buildModel, partsOf } from '../src/models/extras';

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


describe('parts and added pieces', () => {
  const v = model('edificio').versions[model('edificio').approved];
  const size = (p: Record<string, unknown>) => { const g = new Geo(); buildModel(v, g, rng(3), { x: 0, z: 0, ...v.defaults, ...p } as never); return g; };
  it('every editable version exposes named parts', () => {
    for (const m of models()) for (const [id, ver] of Object.entries(m.versions)) {
      if (!ver.settings) continue;
      const g = new Geo(); ver.build(g, rng(3), { x: 0, z: 0, ...ver.defaults } as never);
      expect(partsOf(g, 0, 0).parts.length, `${m.id} ${id}`).toBeGreaterThan(1);
    }
  });
  it('hiding a part and adding a piece change the model', () => {
    const base = size({}).bounds().getSize(new THREE.Vector3());
    const noRoof = size({ __ocultar: JSON.stringify(['techo']) }).bounds().getSize(new THREE.Vector3());
    expect(noRoof.y).toBeLessThan(base.y);
    const antenna = size({ __extras: JSON.stringify([{ nombre: 'antena', forma: 'cilindro', x: 0.7, y: base.y, z: 0.8, radio: 0.02, alto: 0.6, color: '#888888' }]) }).bounds().getSize(new THREE.Vector3());
    expect(antenna.y).toBeGreaterThan(base.y + 0.5);
  });
});

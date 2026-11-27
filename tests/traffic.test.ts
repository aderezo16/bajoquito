import { describe, expect, it } from 'vitest';
import { CAR_GREEN, SIGNAL_PERIOD, carsMayPass, pedCanCross } from '../src/engine/traffic';

const c = { x: 0, offset: 0, heads: { car: [], ped: [] } } as never;

describe('semáforos', () => {
  it('nunca dejan pasar a buses y peatones a la vez', () => {
    for (let t = 0; t < SIGNAL_PERIOD * 3; t += 0.05) expect(carsMayPass(c, t) && pedCanCross(c, t)).toBe(false);
  });
  it('los peatones solo empiezan a cruzar con tiempo suficiente para terminar', () => {
    const crossing = 2.9 / (0.42 * 1.35);                  // ancho de la avenida / velocidad cruzando
    for (let t = 0; t < SIGNAL_PERIOD; t += 0.05) if (pedCanCross(c, t)) expect(SIGNAL_PERIOD - (t % SIGNAL_PERIOD)).toBeGreaterThan(crossing);
    expect(CAR_GREEN).toBeLessThan(SIGNAL_PERIOD);
  });
});

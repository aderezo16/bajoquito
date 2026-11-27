/**
 * World layout. Units: 1 unit ≈ 8 m. x runs along Line 1 (south → north, left → right),
 * z is depth (+z towards the viewer), y is up. The avenue (and the tunnel below it) runs along z = 0.
 */
export const STATIONS = [
  'Quitumbe', 'Morán Valverde', 'Solanda', 'El Calzado', 'El Recreo', 'Magdalena', 'San Francisco',
  'Alameda', 'El Ejido', 'U. Central', 'La Pradera', 'Carolina', 'Iñaquito', 'Jipijapa', 'El Labrador',
] as const;

export const SPACING = 5.8;
export const stationX = (i: number) => 6 + i * SPACING;
/** Cross street between station i-1 and i (i = 0..15). */
export const streetX = (i: number) => stationX(0) + (i - 0.5) * SPACING;

/** Stations included in this slice of the city (the 3D test). */
export const SLICE: { from: number; to: number } = { from: 5, to: 7 };
export const SLICE_X0 = streetX(SLICE.from) - 0.2;
export const SLICE_X1 = streetX(SLICE.to + 1) + 0.2;

// Depth bands (z)
export const AV = { z0: -1.3, z1: 1.3 };          // avenue
export const LANES = { east: -0.62, west: 0.62 }; // bus lanes
export const SIDEWALK = { back: -1.9, front: 2.35 };
export const R1 = { z0: -6.2, z1: -2.55 };        // first row behind the avenue
export const R2 = { z0: -11.2, z1: -7.0 };
export const F1 = { z0: 3.55, z1: 6.3 };          // rows in front (kept low)
export const F2 = { z0: 7.0, z1: 9.4 };
export const SLAB = { z0: -12.4, z1: 10.2, depth: 5.2 };

// Underground
export const TUNNEL_Y = -3.4;                      // tunnel floor
export const TRACKS = { east: -0.55, west: 0.55 };
export const PLATFORM = { back: [-2.7, -1.4], front: [1.4, 2.7] } as const;

export const PALETTE = {
  ground: 0x1b2148, street: 0x10142f, walk: 0x2a3160, avenue: 0x1a2048, lot: 0x1e2550,
  wallSouth: [0xb8a898, 0xac9f92, 0xa39ea4, 0xb3a38f], roofSouth: [0x8a5a48, 0x7b5547, 0x6c5a62, 0x83604c],
  wallColonial: 0xe0d6c4, roofColonial: 0x8e5644,
  wallNorth: [0x7e8aae, 0x8792b4, 0x737fa6],
  glass: 0x3d7fd6, window: 0xffd58a, windowDark: 0x17204a,
  people: [0xffc857, 0xff8a5b, 0x7cc4ff, 0xc9b6ff, 0x8ee3c0, 0xf6f1e7, 0xff6b8a],
  bus: [0x3dbe8b, 0xffc857, 0xff8a5b, 0x9fd3ff],
};

export type Mood = 'h' | 'n' | 's';
export const MOOD_COLOR: Record<Mood, string> = { h: '#3DBE8B', n: '#F2A93B', s: '#E5484D' };

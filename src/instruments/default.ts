import { InstrumentConfig } from "@/types/instrument";

// Radial line segments - the original Modular Symmetry instrument
const RING_RADII = [0, 60, 120, 180, 240, 300, 360];
const CENTER = 400;
const ANGLE_POSITIONS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95];

function createLineElement(id: string, startRing: number, endRing: number, angleRatio: number) {
  const angle = angleRatio * 60; // 60 degrees for 6-fold symmetry base
  const rad = (angle - 90) * Math.PI / 180;
  const x1 = CENTER + RING_RADII[startRing] * Math.cos(rad);
  const y1 = CENTER + RING_RADII[startRing] * Math.sin(rad);
  const x2 = CENTER + RING_RADII[endRing] * Math.cos(rad);
  const y2 = CENTER + RING_RADII[endRing] * Math.sin(rad);

  return {
    id,
    tag: "line",
    attrs: { x1, y1, x2, y2, stroke: "#e8dcc8", strokeWidth: 2.5, fill: "none" }
  };
}

// Generate elements for each key
const elements = [
  // Outer segments (Q row) - rings 4-6
  ...ANGLE_POSITIONS.map((angle, i) => createLineElement(`outer_${i}`, 4, 6, angle)),
  // Middle segments (A row) - rings 2-4
  ...ANGLE_POSITIONS.slice(0, 9).map((angle, i) => createLineElement(`middle_${i}`, 2, 4, angle)),
  // Inner segments (Z row) - rings 0-2
  ...ANGLE_POSITIONS.slice(0, 7).map((angle, i) => createLineElement(`inner_${i}`, 0, 2, angle)),
];

// Key mappings
const keyMappings: InstrumentConfig["keyMappings"] = {
  q: { elementIds: ["outer_0"], symmetry: 6 },
  w: { elementIds: ["outer_1"], symmetry: 6 },
  e: { elementIds: ["outer_2"], symmetry: 6 },
  r: { elementIds: ["outer_3"], symmetry: 6 },
  t: { elementIds: ["outer_4"], symmetry: 6 },
  y: { elementIds: ["outer_5"], symmetry: 6 },
  u: { elementIds: ["outer_6"], symmetry: 6 },
  i: { elementIds: ["outer_7"], symmetry: 6 },
  o: { elementIds: ["outer_8"], symmetry: 6 },
  p: { elementIds: ["outer_9"], symmetry: 6 },

  a: { elementIds: ["middle_0"], symmetry: 6 },
  s: { elementIds: ["middle_1"], symmetry: 6 },
  d: { elementIds: ["middle_2"], symmetry: 6 },
  f: { elementIds: ["middle_3"], symmetry: 6 },
  g: { elementIds: ["middle_4"], symmetry: 6 },
  h: { elementIds: ["middle_5"], symmetry: 6 },
  j: { elementIds: ["middle_6"], symmetry: 6 },
  k: { elementIds: ["middle_7"], symmetry: 6 },
  l: { elementIds: ["middle_8"], symmetry: 6 },

  z: { elementIds: ["inner_0"], symmetry: 6 },
  x: { elementIds: ["inner_1"], symmetry: 6 },
  c: { elementIds: ["inner_2"], symmetry: 6 },
  v: { elementIds: ["inner_3"], symmetry: 6 },
  b: { elementIds: ["inner_4"], symmetry: 6 },
  n: { elementIds: ["inner_5"], symmetry: 6 },
  m: { elementIds: ["inner_6"], symmetry: 6 },
};

export const defaultInstrument: InstrumentConfig = {
  name: "Radial Lines",
  description: "Geometric line segments with radial symmetry",
  canvas: {
    width: 800,
    height: 800,
    centerX: 400,
    centerY: 400,
  },
  elements,
  styling: {
    activeStroke: "#e8dcc8",
    activeFill: "none",
    inactiveOpacity: 0.15,
    activeGlow: "rgba(232, 220, 200, 0.6)",
    strokeWidth: 2.5,
  },
  keyMappings,
  symmetryOptions: [3, 4, 6, 8, 12],
  defaultSymmetry: 6,
};

// Flexible SVG element - can be any SVG tag with any attributes
export interface SVGElementConfig {
  id: string;
  tag: string;  // 'circle', 'path', 'rect', 'ellipse', 'polygon', 'line', 'polyline', etc.
  attrs: Record<string, string | number>;  // SVG attributes
  children?: SVGElementConfig[];  // nested elements (for groups)
}

export interface KeyMapping {
  elementIds: string[];          // which elements to activate when key is pressed
  symmetry?: number;             // replicate around center with this symmetry
  animation?: {
    type: 'pulse' | 'glow' | 'scale' | 'rotate' | 'fade';
    duration?: number;
  };
}

export interface InstrumentConfig {
  name: string;
  description: string;
  canvas: {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    background?: string;
  };
  elements: SVGElementConfig[];
  styling: {
    activeStroke?: string;
    activeFill?: string;
    inactiveOpacity?: number;
    activeGlow?: string;
    strokeWidth?: number;
  };
  keyMappings: Record<string, KeyMapping>;
  symmetryOptions?: number[];
  defaultSymmetry?: number;
  controls?: {
    symmetryKeys?: Record<string, number>;  // e.g., {"3": 3, "4": 4}
    guideToggle?: string;
  };
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

// Constants
const RING_RADII = [0, 60, 120, 180, 240, 300];
const CENTER_X = 350;
const CENTER_Y = 350;
const CONTAINER_SIZE = 700;

// Shape type definition
interface Shape {
  startRing: number;  // 0-5
  endRing: number;    // 0-5
  angleRatio: number; // 0.0-1.0 position within primary sector
}

// Key to shape mapping - all lines with varying lengths and positions
const KEY_TO_SHAPE: Record<string, Shape> = {
  // TOP ROW - Long lines from center to outer rings
  q: { startRing: 0, endRing: 5, angleRatio: 0.15 },
  w: { startRing: 0, endRing: 5, angleRatio: 0.35 },
  e: { startRing: 0, endRing: 5, angleRatio: 0.5 },
  r: { startRing: 0, endRing: 5, angleRatio: 0.65 },
  t: { startRing: 0, endRing: 5, angleRatio: 0.85 },
  y: { startRing: 0, endRing: 4, angleRatio: 0.2 },
  u: { startRing: 0, endRing: 4, angleRatio: 0.5 },
  i: { startRing: 0, endRing: 4, angleRatio: 0.8 },
  o: { startRing: 0, endRing: 3, angleRatio: 0.3 },
  p: { startRing: 0, endRing: 3, angleRatio: 0.7 },

  // HOME ROW - Medium lines from mid-rings outward
  a: { startRing: 2, endRing: 5, angleRatio: 0.2 },
  s: { startRing: 2, endRing: 5, angleRatio: 0.5 },
  d: { startRing: 2, endRing: 5, angleRatio: 0.8 },
  f: { startRing: 3, endRing: 5, angleRatio: 0.25 },
  g: { startRing: 3, endRing: 5, angleRatio: 0.5 },
  h: { startRing: 3, endRing: 5, angleRatio: 0.75 },
  j: { startRing: 1, endRing: 4, angleRatio: 0.3 },
  k: { startRing: 1, endRing: 4, angleRatio: 0.5 },
  l: { startRing: 1, endRing: 4, angleRatio: 0.7 },

  // BOTTOM ROW - Short lines on inner/mid rings
  z: { startRing: 0, endRing: 2, angleRatio: 0.2 },
  x: { startRing: 0, endRing: 2, angleRatio: 0.5 },
  c: { startRing: 0, endRing: 2, angleRatio: 0.8 },
  v: { startRing: 1, endRing: 3, angleRatio: 0.3 },
  b: { startRing: 1, endRing: 3, angleRatio: 0.7 },
  n: { startRing: 2, endRing: 4, angleRatio: 0.35 },
  m: { startRing: 2, endRing: 4, angleRatio: 0.65 },
};

// Geometry helper functions
function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function calculateActualAngle(angleRatio: number, symmetryOrder: number): number {
  const sectorSize = 360 / symmetryOrder;
  return angleRatio * sectorSize;
}

// Render line with symmetry
function renderShape(
  shape: Shape,
  symmetryOrder: number,
  shapeIndex: number
): JSX.Element[] {
  const angle = calculateActualAngle(shape.angleRatio, symmetryOrder);
  const startRadius = RING_RADII[shape.startRing];
  const endRadius = RING_RADII[shape.endRing];
  const angleStep = 360 / symmetryOrder;

  const elements: JSX.Element[] = [];

  for (let i = 0; i < symmetryOrder; i++) {
    const rotationAngle = angle + i * angleStep;
    const startPos = polarToCartesian(CENTER_X, CENTER_Y, startRadius, rotationAngle);
    const endPos = polarToCartesian(CENTER_X, CENTER_Y, endRadius, rotationAngle);

    elements.push(
      <line
        key={`line-${shapeIndex}-${i}`}
        x1={startPos.x}
        y1={startPos.y}
        x2={endPos.x}
        y2={endPos.y}
        stroke="var(--circle-stroke)"
        strokeWidth={2.5}
        className="shape-element line"
      />
    );
  }

  return elements;
}

// Render guide lines
function renderGuideLines(symmetryOrder: number): JSX.Element[] {
  const angleStep = 360 / symmetryOrder;
  const elements: JSX.Element[] = [];

  for (let i = 0; i < symmetryOrder; i++) {
    const angle = i * angleStep;
    const pos = polarToCartesian(CENTER_X, CENTER_Y, 310, angle);

    elements.push(
      <line
        key={`guide-${i}`}
        x1={CENTER_X}
        y1={CENTER_Y}
        x2={pos.x}
        y2={pos.y}
        stroke="var(--hint-color)"
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.3}
        className="guide-line"
      />
    );
  }

  return elements;
}

// Main component
export default function ModularSymmetry() {
  const [symmetryMode, setSymmetryMode] = useState<3 | 4 | 6 | 8 | 12>(6);
  const [heldKeys, setHeldKeys] = useState<Set<string>>(new Set());
  const [showGuides, setShowGuides] = useState(false);

  // Compute active shapes based on currently held keys
  const activeShapes = useMemo(() => {
    const shapes = new Map<string, Shape>();

    heldKeys.forEach((key) => {
      const shapeTemplate = KEY_TO_SHAPE[key];
      if (shapeTemplate) {
        const posKey = `${shapeTemplate.startRing}_${shapeTemplate.endRing}_${shapeTemplate.angleRatio}`;
        shapes.set(posKey, shapeTemplate);
      }
    });

    return shapes;
  }, [heldKeys]);

  const addKey = useCallback((key: string) => {
    setHeldKeys((prev) => new Set(prev).add(key));
  }, []);

  const removeKey = useCallback((key: string) => {
    setHeldKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      const key = e.key.toLowerCase();

      // Symmetry mode selection
      if (key === "3") {
        setSymmetryMode(3);
      } else if (key === "4") {
        setSymmetryMode(4);
      } else if (key === "6") {
        setSymmetryMode(6);
      } else if (key === "8") {
        setSymmetryMode(8);
      } else if (key === "0") {
        setSymmetryMode(12);
      }
      // Guide toggle
      else if (key === "`") {
        setShowGuides((prev) => !prev);
      }
      // Shape placement - add key to held set
      else if (KEY_TO_SHAPE[key]) {
        addKey(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Remove key from held set (but not for symmetry/control keys)
      if (KEY_TO_SHAPE[key]) {
        removeKey(key);
      }
    };

    // Clear all held keys if window loses focus
    const handleBlur = () => {
      setHeldKeys(new Set());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [addKey, removeKey]);

  return (
    <div className="instrument-container">
      <svg
        width={CONTAINER_SIZE}
        height={CONTAINER_SIZE}
        viewBox={`0 0 ${CONTAINER_SIZE} ${CONTAINER_SIZE}`}
        className="instrument-svg"
      >
        {/* Guide lines */}
        {showGuides && renderGuideLines(symmetryMode)}

        {/* Outer containing circle */}
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={310}
          fill="none"
          stroke="var(--circle-stroke)"
          strokeWidth="2.5"
          className="outer-ring"
        />

        {/* Ring guides (optional visual reference) */}
        {RING_RADII.slice(1).map((radius, idx) => (
          <circle
            key={`ring-${idx}`}
            cx={CENTER_X}
            cy={CENTER_Y}
            r={radius}
            fill="none"
            stroke="var(--hint-color)"
            strokeWidth="1"
            opacity={0.15}
            className="ring-guide"
          />
        ))}

        {/* All placed shapes */}
        {Array.from(activeShapes.values()).map((shape, idx) =>
          renderShape(shape, symmetryMode, idx)
        )}
      </svg>

      <div className="info-bar">
        <span className="symmetry-indicator">
          Symmetry: {symmetryMode}-fold
        </span>
        <span className="shape-count">
          Shapes: {activeShapes.size}
        </span>
      </div>

      <div className="hint-container">
        <div className="hint-row">
          <span className="hint-label">Symmetry:</span>
          <span>3 4 6 8 0(12-fold)</span>
        </div>
        <div className="hint-row">
          <span className="hint-label">Long lines:</span>
          <span>Q W E R T · Y U I · O P</span>
        </div>
        <div className="hint-row">
          <span className="hint-label">Medium lines:</span>
          <span>A S D · F G H · J K L</span>
        </div>
        <div className="hint-row">
          <span className="hint-label">Short lines:</span>
          <span>Z X C · V B · N M</span>
        </div>
        <div className="hint-row">
          <span className="hint-label">Controls:</span>
          <span>` toggle guides · Hold keys to create patterns</span>
        </div>
      </div>

      <style jsx>{`
        .instrument-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg-color);
          gap: 1.5rem;
          padding: 2rem;
        }

        .instrument-svg {
          filter: drop-shadow(0 0 60px var(--glow-color));
        }

        .outer-ring {
          opacity: 0.4;
        }

        .ring-guide {
          pointer-events: none;
        }

        .shape-element {
          transition: opacity 0.06s ease-out;
          filter: drop-shadow(0 0 4px var(--circle-stroke));
        }

        .guide-line {
          transition: opacity 0.15s ease-out;
        }

        .info-bar {
          display: flex;
          gap: 2rem;
          font-family: "JetBrains Mono", "SF Mono", "Fira Code", monospace;
          font-size: 13px;
          color: var(--circle-stroke);
          opacity: 0.6;
        }

        .symmetry-indicator,
        .shape-count {
          font-variant-numeric: tabular-nums;
        }

        .hint-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-family: "JetBrains Mono", "SF Mono", "Fira Code", monospace;
          font-size: 14px;
          color: var(--hint-color);
        }

        .hint-row {
          display: flex;
          gap: 0.6rem;
        }

        .hint-label {
          color: var(--circle-stroke);
          opacity: 0.5;
          min-width: 100px;
          text-align: right;
        }
      `}</style>
    </div>
  );
}

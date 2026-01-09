"use client";

import { useState, useEffect, useCallback, useMemo, createElement, ReactElement } from "react";
import { InstrumentConfig, SVGElementConfig } from "@/types/instrument";

interface InstrumentRendererProps {
  config: InstrumentConfig;
  onUpdateInstrument: (config: InstrumentConfig) => void;
  onGenerateNew: () => void;
}

// Convert kebab-case to camelCase for React
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Render an SVG element from config
function renderSVGElement(
  element: SVGElementConfig,
  isActive: boolean,
  symmetry: number,
  centerX: number,
  centerY: number,
  styling: InstrumentConfig['styling'],
  index: number
): ReactElement[] {
  const elements: ReactElement[] = [];
  const angleStep = 360 / symmetry;

  // Build base attributes
  const baseAttrs: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(element.attrs)) {
    // Convert kebab-case to camelCase for React
    const attrName = toCamelCase(key);
    baseAttrs[attrName] = value;
  }

  // Apply active/inactive styling
  if (isActive) {
    if (styling.activeStroke) baseAttrs['stroke'] = styling.activeStroke;
    if (styling.activeFill) baseAttrs['fill'] = styling.activeFill;
    baseAttrs['opacity'] = 1;
    if (styling.activeGlow) {
      baseAttrs['filter'] = `drop-shadow(0 0 8px ${styling.activeGlow})`;
    }
  } else {
    baseAttrs['opacity'] = styling.inactiveOpacity ?? 0.2;
  }

  // Render with symmetry
  for (let i = 0; i < symmetry; i++) {
    const rotation = i * angleStep;
    const transform = rotation !== 0
      ? `rotate(${rotation} ${centerX} ${centerY})`
      : undefined;

    const attrs = {
      ...baseAttrs,
      key: `${element.id}-${index}-${i}`,
      transform: transform ?
        (baseAttrs['transform'] ? `${transform} ${baseAttrs['transform']}` : transform)
        : baseAttrs['transform'],
    };

    elements.push(
      createElement(element.tag, attrs)
    );
  }

  return elements;
}

export default function InstrumentRenderer({ config, onUpdateInstrument, onGenerateNew }: InstrumentRendererProps) {
  const [heldKeys, setHeldKeys] = useState<Set<string>>(new Set());
  const [symmetryMode, setSymmetryMode] = useState(config.defaultSymmetry ?? 1);
  const [showGuides, setShowGuides] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = async () => {
    if (!prompt.trim() || isEditing) return;

    setIsEditing(true);
    setError(null);

    try {
      const response = await fetch("/api/edit-instrument", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          currentConfig: config
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to edit");
      }

      const updatedConfig: InstrumentConfig = await response.json();
      onUpdateInstrument(updatedConfig);
      setPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Edit failed");
    } finally {
      setIsEditing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    }
  };

  // Compute which elements are active based on held keys
  const activeElementIds = useMemo(() => {
    const ids = new Set<string>();
    heldKeys.forEach((key) => {
      const mapping = config.keyMappings[key];
      if (mapping) {
        mapping.elementIds.forEach((id) => ids.add(id));
      }
    });
    return ids;
  }, [heldKeys, config.keyMappings]);

  // Get symmetry for a specific element based on its key mapping
  const getElementSymmetry = useCallback((elementId: string): number => {
    for (const mapping of Object.values(config.keyMappings)) {
      if (mapping.elementIds.includes(elementId) && mapping.symmetry) {
        return mapping.symmetry;
      }
    }
    return symmetryMode;
  }, [config.keyMappings, symmetryMode]);

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

      // Check for symmetry mode keys
      if (config.controls?.symmetryKeys?.[key]) {
        setSymmetryMode(config.controls.symmetryKeys[key]);
        return;
      }

      // Default symmetry keys if not configured
      if (!config.controls?.symmetryKeys) {
        if (key === '3') setSymmetryMode(3);
        else if (key === '4') setSymmetryMode(4);
        else if (key === '6') setSymmetryMode(6);
        else if (key === '8') setSymmetryMode(8);
        else if (key === '0') setSymmetryMode(12);
      }

      // Guide toggle
      if (key === (config.controls?.guideToggle ?? '`')) {
        setShowGuides((prev) => !prev);
        return;
      }

      // Element activation
      if (config.keyMappings[key]) {
        addKey(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (config.keyMappings[key]) {
        removeKey(key);
      }
    };

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
  }, [addKey, removeKey, config.keyMappings, config.controls]);

  const { canvas, elements, styling } = config;

  return (
    <div className="instrument-container">
      <svg
        width={canvas.width}
        height={canvas.height}
        viewBox={`0 0 ${canvas.width} ${canvas.height}`}
        className="instrument-svg"
      >
        {/* Optional guide lines */}
        {showGuides && config.symmetryOptions && (
          <>
            {Array.from({ length: symmetryMode }, (_, i) => {
              const angle = (i * 360) / symmetryMode;
              const rad = (angle - 90) * Math.PI / 180;
              const x2 = canvas.centerX + 400 * Math.cos(rad);
              const y2 = canvas.centerY + 400 * Math.sin(rad);
              return (
                <line
                  key={`guide-${i}`}
                  x1={canvas.centerX}
                  y1={canvas.centerY}
                  x2={x2}
                  y2={y2}
                  stroke="var(--hint-color)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.3}
                />
              );
            })}
          </>
        )}

        {/* Render all elements */}
        {elements.map((element, idx) => {
          const isActive = activeElementIds.has(element.id);
          const sym = isActive ? getElementSymmetry(element.id) : symmetryMode;
          return renderSVGElement(
            element,
            isActive,
            sym,
            canvas.centerX,
            canvas.centerY,
            styling,
            idx
          );
        })}
      </svg>

      <div className="controls-bar">
        <div className="info-section">
          <span>{config.name}</span>
          <span className="separator">|</span>
          <span>{symmetryMode}-fold</span>
          <span className="separator">|</span>
          <span>Keys: Q-P A-L Z-M</span>
          <span className="separator">|</span>
          <span>Symmetry: 3 4 6 8 0</span>
        </div>
      </div>

      <button onClick={onGenerateNew} className="back-button" aria-label="Back to create new">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>

      <div className="prompt-bar">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Edit this instrument... (e.g., 'make lines thicker', 'add more rings')"
          className="prompt-input"
          disabled={isEditing}
        />
        <button
          onClick={handleEdit}
          disabled={!prompt.trim() || isEditing}
          className="edit-button"
        >
          {isEditing ? "..." : "Edit"}
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}

      <style jsx>{`
        .instrument-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: ${canvas.background ?? 'var(--bg-color)'};
          gap: 1.5rem;
          padding: 2rem;
        }

        .instrument-svg {
          filter: drop-shadow(0 0 60px var(--glow-color));
          max-height: 70vh;
          width: auto;
        }

        .controls-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          font-family: "JetBrains Mono", "SF Mono", "Fira Code", monospace;
          font-size: 13px;
          color: var(--hint-color);
          flex-wrap: wrap;
        }

        .info-section {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          flex-wrap: wrap;
          justify-content: center;
        }

        .separator {
          opacity: 0.3;
        }

        .back-button {
          position: fixed;
          top: 1.5rem;
          left: 1.5rem;
          background: transparent;
          border: 1px solid var(--hint-color);
          color: var(--circle-stroke);
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .back-button:hover {
          background: var(--hint-color);
          color: var(--bg-color);
        }

        .edit-button {
          padding: 0.6rem 1rem;
          font-family: inherit;
          font-size: inherit;
          font-weight: 600;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
          background: var(--circle-stroke);
          border: none;
          color: var(--bg-color);
        }

        .edit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 2px 10px var(--glow-color);
        }

        .edit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .prompt-bar {
          display: flex;
          gap: 0.5rem;
          width: 100%;
          max-width: 600px;
        }

        .prompt-input {
          flex: 1;
          padding: 0.6rem 1rem;
          background: transparent;
          border: 1px solid var(--hint-color);
          border-radius: 4px;
          color: var(--circle-stroke);
          font-family: "JetBrains Mono", "SF Mono", "Fira Code", monospace;
          font-size: 13px;
        }

        .prompt-input::placeholder {
          color: var(--hint-color);
          opacity: 0.6;
        }

        .prompt-input:focus {
          outline: none;
          border-color: var(--circle-stroke);
        }

        .prompt-input:disabled {
          opacity: 0.5;
        }

        .error-message {
          color: #ff6b6b;
          font-family: "JetBrains Mono", "SF Mono", "Fira Code", monospace;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}

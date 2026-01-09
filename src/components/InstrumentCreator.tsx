"use client";

import { useState } from "react";
import { InstrumentConfig } from "@/types/instrument";

interface InstrumentCreatorProps {
  onInstrumentCreated: (config: InstrumentConfig) => void;
  onBack?: () => void;
}

export default function InstrumentCreator({ onInstrumentCreated, onBack }: InstrumentCreatorProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-instrument", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate instrument");
      }

      const config: InstrumentConfig = await response.json();
      onInstrumentCreated(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="creator-container">
      <div className="creator-content">
        <h1 className="title">Cabin Instruments</h1>
        <p className="subtitle">Describe your visual instrument and bring it to life</p>

        <form onSubmit={handleSubmit} className="form">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your instrument... e.g., 'A spiral mandala with flowing petals' or 'A geometric grid that pulses outward'"
            className="prompt-input"
            disabled={isLoading}
            rows={4}
          />

          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="submit-button"
          >
            {isLoading ? (
              <span className="loading">
                <span className="dot">.</span>
                <span className="dot">.</span>
                <span className="dot">.</span>
                Creating
              </span>
            ) : (
              "Create Instrument"
            )}
          </button>
        </form>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <div className="examples">
          <p className="examples-label">Try something like:</p>
          <ul>
            <li>A radial mandala with concentric rings of petals</li>
            <li>A cosmic star field with twinkling points</li>
            <li>Flowing waves that ripple from the center</li>
            <li>A honeycomb grid with hexagonal cells</li>
            <li>Abstract organic shapes like neurons firing</li>
          </ul>
        </div>

        {onBack && (
          <button onClick={onBack} className="back-button">
            Back to Instrument
          </button>
        )}
      </div>

      <style jsx>{`
        .creator-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-color);
          padding: 2rem;
        }

        .creator-content {
          max-width: 600px;
          width: 100%;
        }

        .title {
          font-family: "JetBrains Mono", "SF Mono", "Fira Code", monospace;
          font-size: 2.5rem;
          font-weight: 300;
          color: var(--circle-stroke);
          margin: 0 0 0.5rem 0;
          text-align: center;
        }

        .subtitle {
          font-family: "JetBrains Mono", "SF Mono", "Fira Code", monospace;
          font-size: 1rem;
          color: var(--hint-color);
          margin: 0 0 2rem 0;
          text-align: center;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .prompt-input {
          width: 100%;
          padding: 1rem;
          background: transparent;
          border: 1px solid var(--hint-color);
          border-radius: 8px;
          color: var(--circle-stroke);
          font-family: "JetBrains Mono", "SF Mono", "Fira Code", monospace;
          font-size: 1rem;
          resize: vertical;
          min-height: 100px;
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

        .submit-button {
          padding: 1rem 2rem;
          background: var(--circle-stroke);
          color: var(--bg-color);
          border: none;
          border-radius: 8px;
          font-family: "JetBrains Mono", "SF Mono", "Fira Code", monospace;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px var(--glow-color);
        }

        .submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
        }

        .dot {
          animation: blink 1.4s infinite;
        }

        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes blink {
          0%, 20% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }

        .error {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(255, 100, 100, 0.1);
          border: 1px solid rgba(255, 100, 100, 0.3);
          border-radius: 8px;
          color: #ff6b6b;
          font-family: "JetBrains Mono", "SF Mono", "Fira Code", monospace;
          font-size: 0.9rem;
        }

        .examples {
          margin-top: 2rem;
          color: var(--hint-color);
          font-family: "JetBrains Mono", "SF Mono", "Fira Code", monospace;
          font-size: 0.85rem;
        }

        .examples-label {
          margin: 0 0 0.5rem 0;
          opacity: 0.7;
        }

        .examples ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .examples li {
          margin: 0.3rem 0;
          opacity: 0.5;
        }

        .back-button {
          margin-top: 2rem;
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: 1px solid var(--hint-color);
          border-radius: 8px;
          color: var(--circle-stroke);
          font-family: "JetBrains Mono", "SF Mono", "Fira Code", monospace;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          display: block;
          width: 100%;
        }

        .back-button:hover {
          background: var(--hint-color);
          color: var(--bg-color);
        }
      `}</style>
    </div>
  );
}

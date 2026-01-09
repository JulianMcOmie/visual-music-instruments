"use client";

import { useState, useEffect } from "react";
import InstrumentCreator from "@/components/InstrumentCreator";
import InstrumentRenderer from "@/components/InstrumentRenderer";
import { InstrumentConfig } from "@/types/instrument";
import { defaultInstrument } from "@/instruments/default";

const STORAGE_KEY = "cabin-instrument-config";

export default function Home() {
  const [instrument, setInstrument] = useState<InstrumentConfig | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved instrument from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const config = JSON.parse(saved);
        setInstrument(config);
      } else {
        // Use default instrument if nothing saved
        setInstrument(defaultInstrument);
      }
    } catch (err) {
      console.error("Failed to load saved instrument:", err);
      setInstrument(defaultInstrument);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInstrumentCreated = (config: InstrumentConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setInstrument(config);
    setShowCreator(false);
  };

  const handleUpdateInstrument = (config: InstrumentConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setInstrument(config);
  };

  const handleGenerateNew = () => {
    setShowCreator(true);
  };

  const handleBackToInstrument = () => {
    setShowCreator(false);
  };

  // Show loading state briefly while checking localStorage
  if (isLoading) {
    return (
      <div className="loading-container">
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-color);
          }
        `}</style>
      </div>
    );
  }

  // Show creator if requested
  if (showCreator) {
    return (
      <InstrumentCreator
        onInstrumentCreated={handleInstrumentCreated}
        onBack={handleBackToInstrument}
      />
    );
  }

  // Render the instrument
  return (
    <InstrumentRenderer
      config={instrument!}
      onUpdateInstrument={handleUpdateInstrument}
      onGenerateNew={handleGenerateNew}
    />
  );
}

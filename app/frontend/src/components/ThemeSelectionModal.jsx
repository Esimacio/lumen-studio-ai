import { useState } from "react";

const THEMES = [
  {
    id: "warm-olive",
    name: "Warm Olive",
    description: "A calm, natural look inspired by nature and sunlight.",
    colors: ["#7B853A", "#D7D2A1", "#F4EEDC"],
  },
  {
    id: "soft-lavender",
    name: "Soft Lavender",
    description: "A gentle, modern look with a fresh and creative feel.",
    colors: ["#A891C8", "#DCD2EC", "#F7F3FA"],
  },
  {
    id: "golden-sand",
    name: "Golden Sand",
    description: "A warm, bright look inspired by sunlight and comfort.",
    colors: ["#D8A84F", "#EAD39A", "#FAF0D8"],
  },
  {
    id: "slate-night",
    name: "Slate Night",
    description: "A sleek, focused look for late nights and deep work.",
    colors: ["#1F2933", "#334155", "#CBD5E1"],
  },
];

export default function ThemeSelectionModal({ onComplete }) {
  const [selectedTheme, setSelectedTheme] = useState("warm-olive");

  function handleContinue() {
    localStorage.setItem("theme", selectedTheme);
    localStorage.setItem("lumen-theme-selected", "true");
    document.documentElement.setAttribute("data-theme", selectedTheme);
    onComplete?.(selectedTheme);
  }

  function handleUseDefault() {
    localStorage.setItem("theme", "warm-olive");
    localStorage.setItem("lumen-theme-selected", "true");
    document.documentElement.setAttribute("data-theme", "warm-olive");
    onComplete?.("warm-olive");
  }

  return (
    <div className="theme-modal-overlay">
      <div className="theme-modal">
        <div className="theme-modal-header">
          <div className="theme-modal-sparkle">✦</div>
          <div>
            <h2>Choose your interface style</h2>
            <p>
              Personalize your workspace by selecting a color theme.
              <br />
              You can change this anytime in Settings.
            </p>
          </div>
        </div>

        <div className="theme-grid">
          {THEMES.map((theme) => {
            const selected = selectedTheme === theme.id;

            return (
              <button
                key={theme.id}
                type="button"
                className={`theme-card ${selected ? "selected" : ""}`}
                onClick={() => setSelectedTheme(theme.id)}
              >
                <div className="theme-preview">
                  <div className="theme-preview-sidebar">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="theme-preview-main">
                    <div />
                    <div />
                    <div />
                  </div>
                  {selected && <div className="theme-check">✓</div>}
                </div>

                <div className="theme-swatches">
                  {theme.colors.map((color) => (
                    <span key={color} style={{ backgroundColor: color }} />
                  ))}
                </div>

                <strong>{theme.name}</strong>
                <p>{theme.description}</p>
              </button>
            );
          })}
        </div>

        <div className="theme-modal-footer">
          <div className="theme-note">
            ☼ You can change the theme anytime in{" "}
            <strong>Settings &gt; Appearance</strong>.
          </div>

          <div className="theme-actions">
            <button type="button" className="theme-button secondary" onClick={handleUseDefault}>
              Use default
            </button>
            <button type="button" className="theme-button primary" onClick={handleContinue}>
              Continue →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

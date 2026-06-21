/* ORIONECT — Tweaks island (controls CSS variables on :root) */
const { useEffect, useState } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "oklch(0.63 0.17 45)",
  "displayFont": "Instrument Serif",
  "paper": "sand",
  "motion": true
}/*EDITMODE-END*/;

function readTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}
function writeTheme(dark) {
  const r = document.documentElement;
  r.setAttribute('data-theme', dark ? 'dark' : 'light');
  localStorage.setItem('orionect-theme', dark ? 'dark' : 'light');
  if (dark) {
    r.style.removeProperty('--paper');
    r.style.removeProperty('--paper-2');
    r.style.removeProperty('--ink');
  }
  // notify other listeners (nav button) so UI stays in sync
  window.dispatchEvent(new CustomEvent('orionect-theme', { detail: dark }));
}

const PAPERS = {
  sand:  { paper: "oklch(0.957 0.013 78)", paper2: "oklch(0.928 0.016 76)", ink: "oklch(0.215 0.018 55)" },
  cream: { paper: "oklch(0.972 0.010 92)", paper2: "oklch(0.948 0.013 90)", ink: "oklch(0.2 0.014 60)" },
  clay:  { paper: "oklch(0.93 0.018 65)", paper2: "oklch(0.9 0.022 63)", ink: "oklch(0.22 0.02 50)" }
};

function OrionectTweaks() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [dark, setDark] = useState(readTheme);

  // keep the toggle in sync when the nav moon/sun button flips the theme
  useEffect(() => {
    const onTheme = (e) => setDark(!!e.detail);
    window.addEventListener('orionect-theme', onTheme);
    return () => window.removeEventListener('orionect-theme', onTheme);
  }, []);

  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--accent', t.accent);
    r.style.setProperty('--font-display', `"${t.displayFont}", "Fraunces", Georgia, serif`);
    r.style.setProperty('--font-serif', `"${t.displayFont}", "Fraunces", Georgia, serif`);
    r.setAttribute('data-motion', t.motion ? 'on' : 'off');

    // surfaces: only paint inline paper/ink in LIGHT mode; dark is owned by CSS
    if (readTheme()) {
      r.style.removeProperty('--paper');
      r.style.removeProperty('--paper-2');
      r.style.removeProperty('--ink');
    } else {
      const p = PAPERS[t.paper] || PAPERS.sand;
      r.style.setProperty('--paper', p.paper);
      r.style.setProperty('--paper-2', p.paper2);
      r.style.setProperty('--ink', p.ink);
    }
  }, [t.accent, t.displayFont, t.paper, t.motion, dark]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Brand accent" />
      <TweakColor
        label="Accent"
        value={t.accent}
        options={[
          "oklch(0.63 0.17 45)",
          "oklch(0.6 0.16 28)",
          "oklch(0.62 0.13 145)",
          "oklch(0.55 0.14 250)"
        ]}
        onChange={(v) => setTweak('accent', v)}
      />
      <TweakSection label="Type & surface" />
      <TweakSelect
        label="Display font"
        value={t.displayFont}
        options={["Instrument Serif", "Fraunces", "Newsreader", "Archivo"]}
        onChange={(v) => setTweak('displayFont', v)}
      />
      <TweakRadio
        label="Paper tone"
        value={t.paper}
        options={["sand", "cream", "clay"]}
        onChange={(v) => setTweak('paper', v)}
      />
      <TweakSection label="Theme" />
      <TweakToggle
        label="Dark mode"
        value={dark}
        onChange={(v) => { setDark(v); writeTheme(v); }}
      />
      <TweakSection label="Motion" />
      <TweakToggle
        label="Animations"
        value={t.motion}
        onChange={(v) => setTweak('motion', v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<OrionectTweaks />);

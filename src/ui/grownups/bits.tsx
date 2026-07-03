import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

/** Shared small components for the grown-up UI (AR-5, AR-6). */

export function Card({ title, children }: { title?: string; children: ComponentChildren }) {
  return (
    <section class="card">
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}

/**
 * Press-and-hold control for the grown-up gate (FR-5). Works with pointer
 * *or* a held Space/Enter key. A tap-the-word alternative sits beside it for
 * anyone who cannot sustain a hold (FR-11) — both paths are equivalent.
 */
export function HoldButton({ label, onComplete, ms = 1600 }: { label: string; onComplete: () => void; ms?: number }) {
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);
  const started = useRef<number | null>(null);
  const done = useRef(false);

  const tick = (now: number) => {
    if (started.current === null) return;
    const p = Math.min((now - started.current) / ms, 1);
    setProgress(p);
    if (p >= 1) {
      if (!done.current) {
        done.current = true;
        onComplete();
      }
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };

  const begin = () => {
    if (started.current !== null) return;
    started.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  };
  const cancel = () => {
    started.current = null;
    cancelAnimationFrame(raf.current);
    if (!done.current) setProgress(0);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <button
      class="hold-btn"
      onPointerDown={begin}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault();
          begin();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') cancel();
      }}
      aria-label={`${label}. Press and hold for ${Math.round(ms / 1000)} seconds.`}
    >
      {label}
      <span
        class="hold-ring"
        style={{
          background: `conic-gradient(var(--accent) ${progress * 360}deg, transparent 0deg)`,
          mask: 'radial-gradient(circle, transparent 64%, black 66%)',
          WebkitMask: 'radial-gradient(circle, transparent 64%, black 66%)',
        }}
        aria-hidden="true"
      />
    </button>
  );
}

export function RangeField({
  label,
  value,
  min,
  max,
  words,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  /** Plain-language value names, indexed from min — spoken by screen readers too. */
  words: string[];
  hint?: string;
  onChange: (v: number) => void;
}) {
  const word = words[value - min] ?? String(value);
  return (
    <div class="field">
      <label>
        <span class="field-label">
          {label}
          <span class="range-value">{word}</span>
        </span>
        {hint && <p class="hint">{hint}</p>}
        <span class="range-row">
          {/* Steppers make every slider operable by single taps — and by
              switch scanning, which cannot drag (AR-1, AR-8). */}
          <button
            type="button"
            class="btn btn-small stepper"
            aria-label={`Decrease ${label.toLowerCase()}`}
            disabled={value <= min}
            onClick={() => onChange(Math.max(min, value - 1))}
          >
            −
          </button>
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={value}
            aria-valuetext={word}
            onInput={(e) => onChange(Number((e.target as HTMLInputElement).value))}
          />
          <button
            type="button"
            class="btn btn-small stepper"
            aria-label={`Increase ${label.toLowerCase()}`}
            disabled={value >= max}
            onClick={() => onChange(Math.min(max, value + 1))}
          >
            +
          </button>
        </span>
      </label>
    </div>
  );
}

export function Toggle({
  label,
  checked,
  hint,
  onChange,
}: {
  label: string;
  checked: boolean;
  hint?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <div class="field">
      <label class="check-item">
        <input type="checkbox" checked={checked} onChange={(e) => onChange((e.target as HTMLInputElement).checked)} />
        <span>{label}</span>
      </label>
      {hint && <p class="hint">{hint}</p>}
    </div>
  );
}

export function RadioGroup<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: Array<{ value: T; label: string; detail?: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend>{legend}</legend>
      <div class="radio-row">
        {options.map((o) => (
          <label key={o.value} class="radio-item">
            <input
              type="radio"
              name={legend}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span class="radio-text">
              <b>{o.label}</b>
              {o.detail && <small>{o.detail}</small>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Save a text/JSON file locally (PT-3, PV-4 — sharing stays in the caregiver's hands). */
export function downloadFile(name: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

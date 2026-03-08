'use client';

import { useAccessibility } from '@/app/providers';

export default function AccessibilityControls() {
  const {
    fontScale,
    highContrast,
    reducedMotion,
    setFontScale,
    setHighContrast,
    setReducedMotion,
  } = useAccessibility();

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <h2 className="text-xl font-semibold text-slate-900">Accessibility Controls</h2>
      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Text Size</label>
          <input
            type="range"
            min={0.9}
            max={1.25}
            step={0.05}
            value={fontScale}
            onChange={(e) => setFontScale(Number(e.target.value))}
            className="w-full"
          />
          <p className="mt-1 text-xs text-slate-500">{Math.round(fontScale * 100)}%</p>
        </div>

        <label className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <span className="text-sm text-slate-700">High Contrast</span>
          <input
            type="checkbox"
            checked={highContrast}
            onChange={(e) => setHighContrast(e.target.checked)}
          />
        </label>

        <label className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <span className="text-sm text-slate-700">Reduced Motion</span>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
          />
        </label>
      </div>
    </div>
  );
}

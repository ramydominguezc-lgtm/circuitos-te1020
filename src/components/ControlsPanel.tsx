import type { Layers } from '../lib/ui'
import { fmt } from '../lib/format'

export interface SliderDef {
  key: string
  label: string
  unit: string
  min: number
  max: number
  step: number
  value: number
  original: number
  digits: number
  onChange: (v: number) => void
}

export interface ToggleDef {
  key: keyof Layers
  label: string
  color: string
  value: boolean
  onChange: () => void
}

function Slider({ s }: { s: SliderDef }) {
  const changed = Math.abs(s.value - s.original) > 1e-9
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={s.key} className="text-sm font-medium text-ink">
          {s.label}
        </label>
        <span className="tnum font-mono text-sm font-semibold text-terracotta">
          {fmt(s.value, s.digits)} {s.unit}
          {changed && (
            <span className="ml-1.5 text-[11px] font-normal text-ink-faint">
              (orig. {fmt(s.original, s.digits)})
            </span>
          )}
        </span>
      </div>
      <input
        id={s.key}
        type="range"
        min={s.min}
        max={s.max}
        step={s.step}
        value={s.value}
        onChange={(e) => s.onChange(Number(e.target.value))}
      />
    </div>
  )
}

function Toggle({ t }: { t: ToggleDef }) {
  return (
    <button
      type="button"
      onClick={t.onChange}
      aria-pressed={t.value}
      className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        t.value
          ? 'border-transparent text-surface'
          : 'border-line-strong bg-surface text-ink-soft hover:border-ink-faint'
      }`}
      style={t.value ? { backgroundColor: t.color } : undefined}
    >
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: t.value ? 'var(--surface)' : t.color }}
      />
      {t.label}
    </button>
  )
}

export default function ControlsPanel({
  sliders,
  toggles,
  exploring,
  onReset,
}: {
  sliders: SliderDef[]
  toggles: ToggleDef[]
  exploring: boolean
  onReset: () => void
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-card">
      {/* Capas */}
      <div className="mb-5">
        <h3 className="mb-3 font-display text-lg font-semibold text-ink">Capas sobre el esquemático</h3>
        <div className="flex flex-wrap gap-2">
          {toggles.map((t) => (
            <Toggle key={t.key} t={t} />
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="border-t border-line pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink">Fuentes (recálculo en vivo)</h3>
          {exploring && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-surface hover:bg-ink-soft"
            >
              ↺ valores originales
            </button>
          )}
        </div>
        <div className="space-y-4">
          {sliders.map((s) => (
            <Slider key={s.key} s={s} />
          ))}
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">
          Mueve un slider y observa cómo <span className="font-medium text-ink">todos</span> los
          números del esquemático y de la tabla cambian solos. Es la prueba de que la simulación
          es real y no valores escritos a mano.
        </p>
      </div>
    </div>
  )
}

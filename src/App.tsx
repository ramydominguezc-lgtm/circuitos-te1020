import { useEffect, useMemo, useState } from 'react'
import { solve } from './lib/mna'
import type { Layers } from './lib/ui'
import {
  buildCircuit1,
  circuit1Defaults,
  circuit1Quantities,
  type Circuit1Params,
} from './circuits/circuit1'
import {
  buildCircuit2,
  circuit2Defaults,
  circuit2Quantities,
  type Circuit2Params,
} from './circuits/circuit2'
import SchematicC1 from './components/SchematicC1'
import SchematicC2 from './components/SchematicC2'
import ComparisonTable from './components/ComparisonTable'
import ControlsPanel, { type SliderDef, type ToggleDef } from './components/ControlsPanel'
import DependentSourcesPanel from './components/DependentSourcesPanel'

type CircuitKey = 'c1' | 'c2'

const TOGGLE_COLORS: Record<keyof Layers, string> = {
  mesh: 'var(--forest)',
  nodes: 'var(--forest)',
  control: 'var(--terracotta)',
  branch: 'var(--amber)',
}

export default function App() {
  const [active, setActive] = useState<CircuitKey>('c1')
  const [c1, setC1] = useState<Circuit1Params>(circuit1Defaults)
  const [c2, setC2] = useState<Circuit2Params>(circuit2Defaults)
  const [layers, setLayers] = useState<Layers>({
    mesh: true,
    nodes: true,
    control: false,
    branch: false,
  })
  const [presenting, setPresenting] = useState(false)
  const [step, setStep] = useState(0)

  const sol1 = useMemo(() => solve(buildCircuit1(c1)), [c1])
  const sol2 = useMemo(() => solve(buildCircuit2(c2)), [c2])

  const isC1 = active === 'c1'
  const sol = isC1 ? sol1 : sol2
  const quantities = isC1 ? circuit1Quantities : circuit2Quantities
  const exploring = isC1
    ? c1.V1 !== circuit1Defaults.V1 || c1.I1 !== circuit1Defaults.I1
    : c2.V1 !== circuit2Defaults.V1

  // --- Pasos del modo presentación ---
  const steps = useMemo(
    () => [
      {
        title: 'Circuito planteado',
        sub: 'El circuito completo con sus valores y fuentes.',
        layers: { mesh: false, nodes: false, control: false, branch: false } as Layers,
        table: false,
      },
      {
        title: 'Identificar las fuentes dependientes',
        sub: 'En terracota, el elemento que cada fuente sensa y su variable de control.',
        layers: { mesh: false, nodes: false, control: true, branch: false } as Layers,
        table: false,
      },
      {
        title: isC1 ? 'Plantear la supermalla' : 'Plantear el supernodo',
        sub: isC1
          ? 'Tres mallas horarias; la fuente dependiente acopla las corrientes de lazo.'
          : 'Voltajes de nodo con GND de referencia; el supernodo agrupa la fuente flotante.',
        layers: { mesh: isC1, nodes: !isC1, control: false, branch: false } as Layers,
        table: false,
      },
      {
        title: 'Resultados de la simulación',
        sub: 'Corrientes de rama y de malla/nodo obtenidas del solver.',
        layers: { mesh: isC1, nodes: !isC1, control: false, branch: true } as Layers,
        table: false,
      },
      {
        title: 'A mano vs. simulación',
        sub: 'La evidencia: cada cantidad coincide con error 0.00 %.',
        layers: { mesh: false, nodes: false, control: false, branch: false } as Layers,
        table: true,
      },
    ],
    [isC1],
  )
  const cur = steps[step]
  const effLayers = presenting ? cur.layers : layers

  useEffect(() => {
    if (!presenting) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setStep((s) => Math.min(steps.length - 1, s + 1))
      else if (e.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1))
      else if (e.key === 'Escape') setPresenting(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [presenting, steps.length])

  const schematic = isC1 ? (
    <SchematicC1 sol={sol1} params={c1} layers={effLayers} />
  ) : (
    <SchematicC2 sol={sol2} params={c2} layers={effLayers} />
  )

  // --- Sliders y toggles del panel ---
  const sliders: SliderDef[] = isC1
    ? [
        { key: 'c1v1', label: 'Fuente V₁', unit: 'V', min: 0, max: 300, step: 1, digits: 0, value: c1.V1, original: circuit1Defaults.V1, onChange: (v) => setC1((p) => ({ ...p, V1: v })) },
        { key: 'c1i1', label: 'Fuente I₁', unit: 'A', min: 0, max: 2, step: 0.1, digits: 1, value: c1.I1, original: circuit1Defaults.I1, onChange: (v) => setC1((p) => ({ ...p, I1: v })) },
      ]
    : [
        { key: 'c2v1', label: 'Fuente V₁', unit: 'V', min: 0, max: 12, step: 0.5, digits: 1, value: c2.V1, original: circuit2Defaults.V1, onChange: (v) => setC2({ V1: v }) },
      ]

  const toggleDefs: { key: keyof Layers; label: string }[] = isC1
    ? [
        { key: 'mesh', label: 'Corrientes de malla' },
        { key: 'control', label: 'Variables de control' },
        { key: 'branch', label: 'Corrientes de rama' },
      ]
    : [
        { key: 'nodes', label: 'Voltajes de nodo' },
        { key: 'control', label: 'Variables de control' },
        { key: 'branch', label: 'Corrientes de rama' },
      ]
  const toggles: ToggleDef[] = toggleDefs.map((t) => ({
    key: t.key,
    label: t.label,
    color: TOGGLE_COLORS[t.key],
    value: layers[t.key],
    onChange: () => setLayers((l) => ({ ...l, [t.key]: !l[t.key] })),
  }))

  const resetActive = () => (isC1 ? setC1(circuit1Defaults) : setC2(circuit2Defaults))

  // ============================ MODO PRESENTACIÓN ============================
  if (presenting) {
    return (
      <div className="min-h-screen bg-paper paper-grain">
        <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col px-6 py-6">
          {/* Barra superior mínima */}
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-sm uppercase tracking-[0.2em] text-ink-faint">
              {isC1 ? 'Circuito 1 · Mallas' : 'Circuito 2 · Nodos'}
            </span>
            <button
              type="button"
              onClick={() => setPresenting(false)}
              className="rounded-full border border-line-strong px-4 py-1.5 text-sm font-medium text-ink-soft hover:border-ink-faint"
            >
              ✕ salir (Esc)
            </button>
          </div>

          {/* Título del paso */}
          <div className="mb-4">
            <p className="font-mono text-lg font-semibold text-terracotta">
              Paso {step + 1} / {steps.length}
            </p>
            <h1 className="font-display text-5xl font-semibold text-ink">{cur.title}</h1>
            <p className="mt-1 text-xl text-ink-soft">{cur.sub}</p>
          </div>

          {/* Contenido */}
          <div className="flex flex-1 items-center justify-center">
            {cur.table ? (
              <div className="w-full max-w-5xl text-lg">
                <ComparisonTable quantities={quantities} sol={sol} exploring={exploring} />
              </div>
            ) : (
              <div className="w-full rounded-card border border-line bg-surface p-4 shadow-card">
                {schematic}
              </div>
            )}
          </div>

          {/* Navegación */}
          <div className="mt-4 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="rounded-full bg-ink px-6 py-2.5 text-lg font-semibold text-surface disabled:opacity-30"
            >
              ← anterior
            </button>
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(i)}
                  aria-label={`Paso ${i + 1}`}
                  className={`h-3 w-3 rounded-full transition-colors ${
                    i === step ? 'bg-terracotta' : 'bg-line-strong'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              disabled={step === steps.length - 1}
              className="rounded-full bg-ink px-6 py-2.5 text-lg font-semibold text-surface disabled:opacity-30"
            >
              siguiente →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ================================ MODO NORMAL ==============================
  return (
    <div className="min-h-screen bg-paper paper-grain">
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-10">
        {/* Encabezado */}
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 font-mono text-xs uppercase tracking-[0.22em] text-terracotta">
              TE1020 · Análisis de Circuitos Eléctricos · Actividad 6
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
              Circuitos de CD con fuentes dependientes
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
              Simulación real con un solver de Análisis Nodal Modificado (MNA) escrito a mano.
              Cambia cualquier fuente y todos los números se recalculan solos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep(0)
              setPresenting(true)
            }}
            className="rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-surface shadow-card transition-colors hover:bg-[#9c3f24]"
          >
            ▶ Modo presentación
          </button>
        </header>

        {/* Tabs */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(
            [
              { key: 'c1', title: 'Circuito 1', method: 'Mallas' },
              { key: 'c2', title: 'Circuito 2', method: 'Nodos' },
            ] as const
          ).map((t) => {
            const on = active === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActive(t.key)}
                aria-pressed={on}
                className={`flex items-baseline justify-between rounded-card border px-6 py-4 text-left transition-all ${
                  on
                    ? 'border-terracotta bg-surface shadow-card'
                    : 'border-line bg-surface/50 hover:border-line-strong'
                }`}
              >
                <span
                  className={`font-display text-2xl font-semibold ${on ? 'text-ink' : 'text-ink-soft'}`}
                >
                  {t.title}
                </span>
                <span
                  className={`rounded-full px-3 py-1 font-mono text-xs uppercase tracking-wider ${
                    on ? 'bg-terracotta text-surface' : 'bg-panel text-ink-soft'
                  }`}
                >
                  {t.method}
                </span>
              </button>
            )
          })}
        </div>

        {/* Esquemático + controles */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.65fr_1fr]">
          <div className="rounded-card border border-line bg-surface p-4 shadow-card md:p-5">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="font-display text-2xl font-semibold text-ink">
                {isC1 ? 'Circuito 1 · por mallas' : 'Circuito 2 · por nodos'}
              </h2>
              {exploring && (
                <span className="rounded-full bg-amber/15 px-3 py-1 text-xs font-medium text-amber">
                  modo exploración
                </span>
              )}
            </div>
            {schematic}
          </div>

          <ControlsPanel
            sliders={sliders}
            toggles={toggles}
            exploring={exploring}
            onReset={resetActive}
          />
        </div>

        {/* Tabla de comparación */}
        <div className="mt-6">
          <ComparisonTable quantities={quantities} sol={sol} exploring={exploring} />
        </div>

        {/* Panel de fuentes dependientes */}
        <div className="mt-8">
          <DependentSourcesPanel />
        </div>

        <footer className="mt-10 border-t border-line pt-5 text-[13px] text-ink-faint">
          Solver MNA genérico (R, V, I, VCVS, VCCS, CCVS, CCCS) con eliminación gaussiana y pivoteo
          parcial. Material de apoyo para TE1020 · Análisis de Circuitos Eléctricos.
        </footer>
      </div>
    </div>
  )
}

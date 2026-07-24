import type { Solution } from '../lib/mna'
import { buildRows, type Quantity } from '../lib/report'
import { fmt, fmtErr } from '../lib/format'

export default function ComparisonTable({
  quantities,
  sol,
  exploring,
}: {
  quantities: Quantity[]
  sol: Solution
  exploring: boolean
}) {
  const rows = buildRows(quantities, sol)

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4">
        <h3 className="font-display text-2xl font-semibold text-ink">A mano vs. Simulación</h3>
        {exploring ? (
          <span className="rounded-full bg-amber/15 px-3 py-1 text-sm font-medium text-amber">
            ⚙ modo exploración · los valores a mano son del problema original
          </span>
        ) : (
          <span className="rounded-full bg-forest/15 px-3 py-1 text-sm font-medium text-forest">
            ✓ coincidencia exacta en todas las cantidades
          </span>
        )}
      </div>

      <div className="overflow-x-auto code-scroll">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-ink-faint">
              <th className="px-5 py-3 font-semibold">Cantidad</th>
              <th className="px-5 py-3 text-right font-semibold">Cálculo a mano</th>
              <th className="px-5 py-3 text-right font-semibold">Simulación (MNA)</th>
              {!exploring && <th className="px-5 py-3 text-right font-semibold">Error</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.key}
                className={i % 2 === 0 ? 'bg-transparent' : 'bg-surface2/60'}
              >
                <td className="px-5 py-2.5 align-middle">
                  <span className="font-mono text-[15px] font-medium text-ink">{r.label}</span>
                  <span className="ml-2 text-[13px] text-ink-faint">{r.desc}</span>
                </td>
                <td className="px-5 py-2.5 text-right">
                  <span className={`tnum font-mono text-[15px] ${exploring ? 'text-ink-faint line-through' : 'text-ink'}`}>
                    {fmt(r.hand, 3)}
                  </span>
                  <span className="ml-1 text-[12px] text-ink-faint">{r.unit}</span>
                </td>
                <td className="px-5 py-2.5 text-right">
                  <span className="tnum font-mono text-[15px] font-semibold text-terracotta">
                    {fmt(r.sim, 3)}
                  </span>
                  <span className="ml-1 text-[12px] text-ink-faint">{r.unit}</span>
                </td>
                {!exploring && (
                  <td className="px-5 py-2.5 text-right">
                    <span className="tnum inline-flex items-center gap-1 font-mono text-[14px] font-semibold text-forest">
                      {fmtErr(r.errorPct)}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="border-t border-line px-5 py-3 text-[13px] text-ink-soft">
        La columna <span className="font-medium text-ink">Simulación</span> proviene 100 % del
        solver MNA (eliminación gaussiana). Ningún número de esta columna está escrito a mano: si
        cambias una resistencia en el netlist, todos se recalculan solos.
      </p>
    </div>
  )
}

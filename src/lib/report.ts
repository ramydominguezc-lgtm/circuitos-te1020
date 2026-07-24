import type { Solution } from './mna'

// Una "cantidad" es cada renglón de la tabla "A mano vs. Simulación":
// el valor a mano es una constante de la sección de validación y el de
// simulación se obtiene SIEMPRE del solver.
export interface Quantity {
  key: string
  label: string
  desc: string
  unit: string
  hand: number
  sim: (sol: Solution) => number
}

export interface Row {
  key: string
  label: string
  desc: string
  unit: string
  hand: number
  sim: number
  errorPct: number
}

export function buildRows(qs: Quantity[], sol: Solution): Row[] {
  return qs.map((q) => {
    const sim = q.sim(sol)
    const denom = Math.abs(q.hand)
    // Error relativo; si el valor a mano es 0 usamos el error absoluto.
    const errorPct =
      denom > 1e-12 ? (Math.abs(sim - q.hand) / denom) * 100 : Math.abs(sim) * 100
    return {
      key: q.key,
      label: q.label,
      desc: q.desc,
      unit: q.unit,
      hand: q.hand,
      sim,
      errorPct,
    }
  })
}

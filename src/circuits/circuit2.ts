import type { Netlist } from '../lib/mna'
import type { Quantity } from '../lib/report'

// --- Circuito 2 (se resuelve por NODOS) -------------------------------------
// Nodos: N1 (sup. izq.), N2 (bajo el 2 Ω izq.), NC ("Vc"), N3 (sup. der.).
// Referencia: GND. Solo V1 (2 V) es ajustable por slider.

export interface Circuit2Params {
  V1: number
}

export const circuit2Defaults: Circuit2Params = { V1: 2 }

export function buildCircuit2(p: Circuit2Params = circuit2Defaults): Netlist {
  return {
    ref: 'GND',
    elements: [
      { type: 'V', id: 'V1', np: 'N1', nn: 'GND', value: p.V1 },
      { type: 'R', id: 'R1', n1: 'N1', n2: 'N3', value: 1 }, // resistor superior
      { type: 'R', id: 'R2', n1: 'N1', n2: 'N2', value: 2 }, // V_y = V(N1)−V(N2)
      { type: 'R', id: 'R3', n1: 'N2', n2: 'NC', value: 1 }, // resistor central
      { type: 'R', id: 'R4', n1: 'N3', n2: 'GND', value: 2 }, // I_x sube por aquí
      // Fuente de corriente: 9 A que salen de N2 hacia GND (flecha ↓).
      { type: 'I', id: 'I1', np: 'GND', nn: 'N2', value: 9 },
      // CCVS: + en N3, − en NC. Ganancia 3·I_x. I_x = corriente que SUBE (GND→N3) por R4.
      { type: 'H', id: 'H1', np: 'N3', nn: 'NC', gain: 3, control: { through: 'R4', from: 'GND', to: 'N3' } },
      // VCCS: inyecta 2·V_y hacia NC (sale de GND). V_y = V(N1)−V(N2).
      { type: 'G', id: 'G2', np: 'NC', nn: 'GND', cp: 'N1', cn: 'N2', gain: 2 },
    ],
  }
}

export const circuit2Quantities: Quantity[] = [
  { key: 'N1', label: 'V(N1)', desc: 'nodo N1', unit: 'V', hand: 2, sim: (s) => s.nodeVoltage('N1') },
  { key: 'N2', label: 'V(N2)', desc: 'nodo N2', unit: 'V', hand: -2, sim: (s) => s.nodeVoltage('N2') },
  { key: 'NC', label: 'V(Vc)', desc: 'nodo NC', unit: 'V', hand: 5, sim: (s) => s.nodeVoltage('NC') },
  { key: 'N3', label: 'V(N3)', desc: 'nodo N3', unit: 'V', hand: 2, sim: (s) => s.nodeVoltage('N3') },
  { key: 'Ix', label: 'I_x', desc: 'corriente ↑ por R4 (control)', unit: 'A', hand: -1, sim: (s) => s.controlCurrent('H1') },
  { key: 'Vy', label: 'V_y', desc: 'V(N1)−V(N2), sobre R2', unit: 'V', hand: 4, sim: (s) => s.voltageAcross('R2') },
  { key: 'VH1', label: 'v(H1)', desc: 'voltaje de la CCVS', unit: 'V', hand: -3, sim: (s) => s.voltageAcross('H1') },
  { key: 'IG2', label: 'i(G2)', desc: 'corriente de la VCCS', unit: 'A', hand: 8, sim: (s) => s.currentThrough('G2') },
  { key: 'IR1', label: 'i(R1) sup.', desc: 'N1 y N3 al mismo potencial ⇒ 0', unit: 'A', hand: 0, sim: (s) => s.currentThrough('R1') },
]

import type { Netlist } from '../lib/mna'
import type { Quantity } from '../lib/report'

// --- Circuito 1 (se resuelve por MALLAS) ------------------------------------
// Riel superior: T0 — T1 — T2 — T3.  Riel inferior: B0 — B1 — B2 — B3.
// Referencia: B0. Solo V1 (193 V) e I1 (0.5 A) son ajustables por sliders.

export interface Circuit1Params {
  V1: number
  I1: number
}

export const circuit1Defaults: Circuit1Params = { V1: 193, I1: 0.5 }

export function buildCircuit1(p: Circuit1Params = circuit1Defaults): Netlist {
  return {
    ref: 'B0',
    elements: [
      { type: 'V', id: 'V1', np: 'T0', nn: 'B0', value: p.V1 },
      { type: 'R', id: 'R1', n1: 'T0', n2: 'T1', value: 4 },
      { type: 'R', id: 'R2', n1: 'T1', n2: 'T2', value: 2.5 },
      { type: 'R', id: 'R3', n1: 'T2', n2: 'T3', value: 2 },
      { type: 'R', id: 'R4', n1: 'B0', n2: 'B1', value: 6 },
      { type: 'R', id: 'R5', n1: 'B1', n2: 'B2', value: 7.5 },
      { type: 'R', id: 'R6', n1: 'B2', n2: 'B3', value: 8 },
      // VCCS: inyecta 0.4·V_A hacia T1 (sale de B1). V_A = V(T2)−V(T3).
      { type: 'G', id: 'G1', np: 'T1', nn: 'B1', cp: 'T2', cn: 'T3', gain: 0.4 },
      // Fuente de corriente independiente: inyecta en T2, sale de B2.
      { type: 'I', id: 'I1', np: 'T2', nn: 'B2', value: p.I1 },
      // VCVS: + en T3, − en B3. Ganancia 0.8·V_B. V_B = V(B1)−V(B2).
      { type: 'E', id: 'E1', np: 'T3', nn: 'B3', cp: 'B1', cn: 'B2', gain: 0.8 },
    ],
  }
}

// Valores "a mano" (sección de validación del enunciado). El solver debe
// reproducirlos con tolerancia 1e-9.
export const circuit1Quantities: Quantity[] = [
  { key: 'T0', label: 'V(T0)', desc: 'nodo T0', unit: 'V', hand: 193, sim: (s) => s.nodeVoltage('T0') },
  { key: 'T1', label: 'V(T1)', desc: 'nodo T1', unit: 'V', hand: 185, sim: (s) => s.nodeVoltage('T1') },
  { key: 'T2', label: 'V(T2)', desc: 'nodo T2', unit: 'V', hand: 155, sim: (s) => s.nodeVoltage('T2') },
  { key: 'T3', label: 'V(T3)', desc: 'nodo T3', unit: 'V', hand: 130, sim: (s) => s.nodeVoltage('T3') },
  { key: 'B1', label: 'V(B1)', desc: 'nodo B1', unit: 'V', hand: 12, sim: (s) => s.nodeVoltage('B1') },
  { key: 'B2', label: 'V(B2)', desc: 'nodo B2', unit: 'V', hand: 102, sim: (s) => s.nodeVoltage('B2') },
  { key: 'B3', label: 'V(B3)', desc: 'nodo B3', unit: 'V', hand: 202, sim: (s) => s.nodeVoltage('B3') },
  { key: 'VA', label: 'V_A', desc: 'V(T2)−V(T3), sobre R3', unit: 'V', hand: 25, sim: (s) => s.voltageAcross('R3') },
  { key: 'VB', label: 'V_B', desc: 'V(B1)−V(B2), sobre R5', unit: 'V', hand: -90, sim: (s) => s.voltageAcross('R5') },
  { key: 'VO', label: 'V_O', desc: 'V(T1)−V(B1)', unit: 'V', hand: 173, sim: (s) => s.nodeVoltage('T1') - s.nodeVoltage('B1') },
  { key: 'IG1', label: 'i(G1)', desc: 'corriente de la VCCS (↑)', unit: 'A', hand: 10, sim: (s) => s.currentThrough('G1') },
  { key: 'VE1', label: 'v(E1)', desc: 'voltaje de la VCVS', unit: 'V', hand: -72, sim: (s) => s.voltageAcross('E1') },
  { key: 'IM1', label: 'I₁ malla izq.', desc: 'lazo horario (= i por R1)', unit: 'A', hand: 2, sim: (s) => s.currentThrough('R1') },
  { key: 'IM2', label: 'I₂ malla centro', desc: 'lazo horario (= i por R2)', unit: 'A', hand: 12, sim: (s) => s.currentThrough('R2') },
  { key: 'IM3', label: 'I₃ malla der.', desc: 'lazo horario (= i por R3)', unit: 'A', hand: 12.5, sim: (s) => s.currentThrough('R3') },
]

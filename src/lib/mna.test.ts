import { describe, it, expect } from 'vitest'
import { solve, solveLinear, type Netlist } from './mna'
import { buildCircuit1, circuit1Quantities } from '../circuits/circuit1'
import { buildCircuit2, circuit2Quantities } from '../circuits/circuit2'

const TOL = 1e-9
const near = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(TOL)

describe('eliminación gaussiana con pivoteo parcial', () => {
  it('resuelve un sistema 3x3 conocido', () => {
    // 2x + y − z = 8 ; −3x − y + 2z = −11 ; −2x + y + 2z = −3  → (2, 3, −1)
    const A = [
      [2, 1, -1],
      [-3, -1, 2],
      [-2, 1, 2],
    ]
    const z = [8, -11, -3]
    const x = solveLinear(A, z)
    near(x[0], 2)
    near(x[1], 3)
    near(x[2], -1)
  })

  it('requiere pivoteo (pivote inicial = 0)', () => {
    const A = [
      [0, 1],
      [1, 0],
    ]
    const z = [2, 3]
    const x = solveLinear(A, z)
    near(x[0], 3)
    near(x[1], 2)
  })
})

describe('Circuito 1 · mallas', () => {
  const sol = solve(buildCircuit1())

  it('voltajes de nodo (B0 = 0)', () => {
    near(sol.nodeVoltage('B0'), 0)
    near(sol.nodeVoltage('T0'), 193)
    near(sol.nodeVoltage('T1'), 185)
    near(sol.nodeVoltage('T2'), 155)
    near(sol.nodeVoltage('T3'), 130)
    near(sol.nodeVoltage('B1'), 12)
    near(sol.nodeVoltage('B2'), 102)
    near(sol.nodeVoltage('B3'), 202)
  })

  it('variables de control y derivados', () => {
    near(sol.voltageAcross('R3'), 25) // V_A
    near(sol.voltageAcross('R5'), -90) // V_B
    near(sol.nodeVoltage('T1') - sol.nodeVoltage('B1'), 173) // V_O
    near(sol.currentThrough('G1'), 10) // corriente de G1 (↑)
    near(sol.voltageAcross('E1'), -72) // voltaje de E1
  })

  it('corrientes de rama por los resistores', () => {
    near(sol.currentThrough('R1'), 2)
    near(sol.currentThrough('R2'), 12)
    near(sol.currentThrough('R3'), 12.5)
    near(sol.currentThrough('R4'), -2) // B0→B1 (o 2 A de B1→B0)
    near(sol.currentThrough('R5'), -12) // B1→B2 (o 12 A de B2→B1)
    near(sol.currentThrough('R6'), -12.5) // B2→B3 (o 12.5 A de B3→B2)
  })

  it('corrientes de malla (horario) = corriente por los resistores del riel superior', () => {
    near(sol.currentThrough('R1'), 2) // I1
    near(sol.currentThrough('R2'), 12) // I2
    near(sol.currentThrough('R3'), 12.5) // I3
  })

  it('todas las cantidades declaradas coinciden a mano vs. simulación', () => {
    for (const q of circuit1Quantities) near(q.sim(sol), q.hand)
  })
})

describe('Circuito 2 · nodos', () => {
  const sol = solve(buildCircuit2())

  it('voltajes de nodo (GND = 0)', () => {
    near(sol.nodeVoltage('N1'), 2)
    near(sol.nodeVoltage('N2'), -2)
    near(sol.nodeVoltage('NC'), 5)
    near(sol.nodeVoltage('N3'), 2)
  })

  it('variables de control y derivados', () => {
    near(sol.controlCurrent('H1'), -1) // I_x
    near(sol.voltageAcross('R2'), 4) // V_y
    near(sol.voltageAcross('H1'), -3) // voltaje de H1
    near(sol.currentThrough('G2'), 8) // corriente de G2
  })

  it('corrientes de rama por los resistores', () => {
    near(sol.currentThrough('R1'), 0) // resistor superior: N1 y N3 iguales
    near(sol.currentThrough('R2'), 2) // 2 A hacia abajo (N1→N2)
    near(sol.currentThrough('R3'), -7) // 7 A de NC hacia N2
    near(sol.currentThrough('R4'), 1) // 1 A hacia abajo (N3→GND)
  })

  it('H1 conduce 1 A de NC hacia N3', () => {
    // branchCurrent(np→nn) = N3→NC; el sentido físico es NC→N3 ⇒ −1
    near(sol.currentThrough('H1'), -1)
  })

  it('todas las cantidades declaradas coinciden a mano vs. simulación', () => {
    for (const q of circuit2Quantities) near(q.sim(sol), q.hand)
  })
})

describe('el solver es real (no hay valores hardcodeados)', () => {
  it('cambiar una resistencia cambia los voltajes de nodo', () => {
    const base = solve(buildCircuit1())
    const mod: Netlist = buildCircuit1()
    const r1 = mod.elements.find((e) => e.id === 'R1')!
    if (r1.type === 'R') r1.value = 8 // 4 Ω → 8 Ω
    const changed = solve(mod)
    expect(Math.abs(changed.nodeVoltage('T1') - base.nodeVoltage('T1'))).toBeGreaterThan(1)
  })

  it('el circuito 1 es lineal: duplicar ambas fuentes duplica los nodos', () => {
    const doble = solve(buildCircuit1({ V1: 386, I1: 1 }))
    near(doble.nodeVoltage('T1'), 370)
    near(doble.nodeVoltage('T2'), 310)
    near(doble.nodeVoltage('B2'), 204)
  })
})

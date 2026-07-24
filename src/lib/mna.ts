// Solver genérico de Análisis Nodal Modificado (MNA).
//
// Construye el sistema lineal A·x = z a partir de un netlist declarativo y lo
// resuelve con eliminación gaussiana + pivoteo parcial (escrita a mano, sin
// dependencias). El vector de incógnitas x son los voltajes de nodo (todos los
// nodos menos la referencia) seguidos de las corrientes de rama de cada fuente
// de voltaje (V, VCVS/E, CCVS/H y los amperímetros internos).
//
// Convención de signos usada en TODO el archivo:
//   - Fuentes de corriente (I, VCCS/G, CCCS/F): "inyectan" corriente HACIA np
//     y la sacan de nn.
//   - Fuentes de voltaje (V, E, H): np es el terminal + y nn el terminal −.
//     La corriente de rama se define positiva cuando sale del nodo np.
//   - Para H y F la corriente de control se sensa insertando internamente una
//     fuente de 0 V (amperímetro) en serie con el elemento sensado.

export type NodeId = string

/** "La corriente que va de `from` a `to` a través del elemento `through`". */
export interface CurrentControl {
  through: string
  from: NodeId
  to: NodeId
}

export interface Resistor {
  type: 'R'
  id: string
  n1: NodeId
  n2: NodeId
  value: number // ohms
}
export interface VSource {
  type: 'V'
  id: string
  np: NodeId // terminal +
  nn: NodeId // terminal −
  value: number // volts
}
export interface ISource {
  type: 'I'
  id: string
  np: NodeId // inyecta corriente hacia np
  nn: NodeId // y la saca de nn
  value: number // amperes
}
export interface VCVS {
  type: 'E'
  id: string
  np: NodeId
  nn: NodeId
  cp: NodeId // control +
  cn: NodeId // control −
  gain: number // V/V (adimensional)
}
export interface VCCS {
  type: 'G'
  id: string
  np: NodeId // inyecta hacia np
  nn: NodeId
  cp: NodeId
  cn: NodeId
  gain: number // siemens (transconductancia)
}
export interface CCVS {
  type: 'H'
  id: string
  np: NodeId
  nn: NodeId
  control: CurrentControl
  gain: number // ohms (transresistencia)
}
export interface CCCS {
  type: 'F'
  id: string
  np: NodeId // inyecta hacia np
  nn: NodeId
  control: CurrentControl
  gain: number // adimensional (beta)
}

export type Element = Resistor | VSource | ISource | VCVS | VCCS | CCVS | CCCS

export interface Netlist {
  ref: NodeId
  elements: Element[]
}

export interface Solution {
  /** Voltajes de todos los nodos (incluye la referencia = 0). */
  voltages: Record<NodeId, number>
  /** Voltaje de un nodo respecto a la referencia. */
  nodeVoltage(node: NodeId): number
  /** Corriente de rama de una fuente de voltaje (convención np→nn). */
  branchCurrent(id: string): number
  /** Corriente por cualquier elemento (helper genérico). */
  currentThrough(id: string): number
  /** Voltaje entre terminales de un elemento: V(+) − V(−). */
  voltageAcross(id: string): number
  /** Corriente de control sensada por una fuente H o F. */
  controlCurrent(sourceId: string): number
}

// --- Utilidades de topología -------------------------------------------------

function terminalsOf(el: Element): [NodeId, NodeId] {
  return el.type === 'R' ? [el.n1, el.n2] : [el.np, el.nn]
}

function rewireTerminal(el: Element, oldNode: NodeId, newNode: NodeId): void {
  if (el.type === 'R') {
    if (el.n1 === oldNode) el.n1 = newNode
    else if (el.n2 === oldNode) el.n2 = newNode
  } else {
    if (el.np === oldNode) el.np = newNode
    else if (el.nn === oldNode) el.nn = newNode
  }
}

// --- Álgebra lineal ----------------------------------------------------------

/** Resuelve A·x = z por eliminación gaussiana con pivoteo parcial. */
export function solveLinear(A: number[][], z: number[]): number[] {
  const n = z.length
  // Matriz aumentada (copia para no tocar la entrada).
  const M = A.map((row, i) => [...row, z[i]])

  for (let col = 0; col < n; col++) {
    // Pivoteo parcial: elegir la fila con mayor |valor| en esta columna.
    let pivot = col
    let maxAbs = Math.abs(M[col][col])
    for (let r = col + 1; r < n; r++) {
      const a = Math.abs(M[r][col])
      if (a > maxAbs) {
        maxAbs = a
        pivot = r
      }
    }
    if (maxAbs < 1e-14) {
      throw new Error('Matriz singular: el circuito no tiene solución única.')
    }
    if (pivot !== col) {
      const tmp = M[col]
      M[col] = M[pivot]
      M[pivot] = tmp
    }
    // Eliminar por debajo del pivote.
    for (let r = col + 1; r < n; r++) {
      const factor = M[r][col] / M[col][col]
      if (factor === 0) continue
      for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c]
    }
  }

  // Sustitución hacia atrás.
  const x = new Array<number>(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n]
    for (let c = i + 1; c < n; c++) sum -= M[i][c] * x[c]
    x[i] = sum / M[i][i]
  }
  return x
}

// --- Solver MNA --------------------------------------------------------------

export function solve(netlist: Netlist): Solution {
  // Clonamos cada elemento para no mutar el netlist de entrada.
  const elements: Element[] = netlist.elements.map((e) => ({ ...e }))
  const ref = netlist.ref

  // 1) Insertar amperímetros (fuentes de 0 V) para las corrientes de control
  //    de H y F. Regla: se corta el terminal `to` del elemento sensado y se
  //    intercala un amperímetro entre el nodo interno nuevo y `to`, orientado
  //    (np = nodo interno, nn = to) para que su corriente de rama sea justo la
  //    corriente en el sentido from→to.
  const controlAmmeter: Record<string, string> = {}
  const originalEls = [...elements]
  for (const el of originalEls) {
    if (el.type !== 'H' && el.type !== 'F') continue
    const ctrl = el.control
    const through = elements.find((x) => x.id === ctrl.through)
    if (!through) {
      throw new Error(`Control de ${el.id}: no existe el elemento "${ctrl.through}".`)
    }
    const [ta, tb] = terminalsOf(through)
    const ok =
      (ctrl.from === ta && ctrl.to === tb) || (ctrl.from === tb && ctrl.to === ta)
    if (!ok) {
      throw new Error(
        `Control de ${el.id}: from/to no coinciden con los nodos de "${ctrl.through}".`,
      )
    }
    const mid = `__mid_${el.id}`
    const ammId = `__amm_${el.id}`
    rewireTerminal(through, ctrl.to, mid)
    const amm: VSource = { type: 'V', id: ammId, np: mid, nn: ctrl.to, value: 0 }
    elements.push(amm)
    controlAmmeter[el.id] = ammId
  }

  // 2) Enumerar nodos (menos la referencia).
  const nodeSet = new Set<NodeId>()
  for (const el of elements) {
    const [a, b] = terminalsOf(el)
    nodeSet.add(a)
    nodeSet.add(b)
    if (el.type === 'E' || el.type === 'G') {
      nodeSet.add(el.cp)
      nodeSet.add(el.cn)
    }
  }
  nodeSet.delete(ref)
  const nodeList = [...nodeSet]
  const nodeIndex: Record<NodeId, number> = {}
  nodeList.forEach((nd, i) => (nodeIndex[nd] = i))
  const numNodes = nodeList.length

  // 3) Ramas de voltaje (necesitan incógnita de corriente): V, E, H.
  const vBranches = elements.filter(
    (e) => e.type === 'V' || e.type === 'E' || e.type === 'H',
  )
  const branchIndex: Record<string, number> = {}
  vBranches.forEach((e, i) => (branchIndex[e.id] = numNodes + i))
  const n = numNodes + vBranches.length

  // 4) Ensamblar A y z.
  const A = Array.from({ length: n }, () => new Array<number>(n).fill(0))
  const z = new Array<number>(n).fill(0)
  const ni = (node: NodeId) => (node === ref ? -1 : nodeIndex[node])

  for (const el of elements) {
    switch (el.type) {
      case 'R': {
        const g = 1 / el.value
        const a = ni(el.n1)
        const b = ni(el.n2)
        if (a >= 0) A[a][a] += g
        if (b >= 0) A[b][b] += g
        if (a >= 0 && b >= 0) {
          A[a][b] -= g
          A[b][a] -= g
        }
        break
      }
      case 'I': {
        const p = ni(el.np)
        const q = ni(el.nn)
        if (p >= 0) z[p] += el.value
        if (q >= 0) z[q] -= el.value
        break
      }
      case 'G': {
        const g = el.gain
        const p = ni(el.np)
        const q = ni(el.nn)
        const cp = ni(el.cp)
        const cn = ni(el.cn)
        if (p >= 0 && cp >= 0) A[p][cp] -= g
        if (p >= 0 && cn >= 0) A[p][cn] += g
        if (q >= 0 && cp >= 0) A[q][cp] += g
        if (q >= 0 && cn >= 0) A[q][cn] -= g
        break
      }
      case 'F': {
        const beta = el.gain
        const k = branchIndex[controlAmmeter[el.id]]
        const p = ni(el.np)
        const q = ni(el.nn)
        if (p >= 0) A[p][k] -= beta
        if (q >= 0) A[q][k] += beta
        break
      }
      case 'V':
      case 'E':
      case 'H': {
        const k = branchIndex[el.id]
        const p = ni(el.np)
        const q = ni(el.nn)
        // Incidencia (KCL + fila de restricción comparten el ±1).
        if (p >= 0) {
          A[p][k] += 1
          A[k][p] += 1
        }
        if (q >= 0) {
          A[q][k] -= 1
          A[k][q] -= 1
        }
        // Término derecho / control de la restricción.
        if (el.type === 'V') {
          z[k] += el.value
        } else if (el.type === 'E') {
          const cp = ni(el.cp)
          const cn = ni(el.cn)
          if (cp >= 0) A[k][cp] -= el.gain
          if (cn >= 0) A[k][cn] += el.gain
        } else {
          const kc = branchIndex[controlAmmeter[el.id]]
          A[k][kc] -= el.gain
        }
        break
      }
    }
  }

  // 5) Resolver.
  const x = solveLinear(A, z)

  const voltages: Record<NodeId, number> = { [ref]: 0 }
  nodeList.forEach((nd) => (voltages[nd] = x[nodeIndex[nd]]))
  const branchCurrents: Record<string, number> = {}
  vBranches.forEach((e) => (branchCurrents[e.id] = x[branchIndex[e.id]]))

  const elById: Record<string, Element> = {}
  for (const el of elements) elById[el.id] = el

  const V = (node: NodeId) => (node === ref ? 0 : voltages[node] ?? 0)

  function requireEl(id: string): Element {
    const el = elById[id]
    if (!el) throw new Error(`Elemento "${id}" no existe en el netlist.`)
    return el
  }

  function currentThrough(id: string): number {
    const el = requireEl(id)
    switch (el.type) {
      case 'R':
        return (V(el.n1) - V(el.n2)) / el.value
      case 'V':
      case 'E':
      case 'H':
        return branchCurrents[el.id]
      case 'I':
        return el.value
      case 'G':
        return el.gain * (V(el.cp) - V(el.cn))
      case 'F':
        return el.gain * branchCurrents[controlAmmeter[el.id]]
    }
    throw new Error(`currentThrough: tipo no soportado para "${id}".`)
  }

  function voltageAcross(id: string): number {
    const el = requireEl(id)
    const [a, b] = terminalsOf(el)
    return V(a) - V(b)
  }

  function controlCurrent(sourceId: string): number {
    const amm = controlAmmeter[sourceId]
    if (!amm) throw new Error(`"${sourceId}" no es una fuente controlada por corriente.`)
    return branchCurrents[amm]
  }

  return {
    voltages,
    nodeVoltage: (node) => V(node),
    branchCurrent: (id) => branchCurrents[id],
    currentThrough,
    voltageAcross,
    controlCurrent,
  }
}

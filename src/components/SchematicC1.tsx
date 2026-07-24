import type { Solution } from '../lib/mna'
import type { Layers } from '../lib/ui'
import type { Circuit1Params } from '../circuits/circuit1'
import { fmt } from '../lib/format'
import {
  SvgDefs,
  Wire,
  Junction,
  Label,
  Chip,
  Resistor,
  IndepVSource,
  IndepISource,
  DepSource,
  CurrentArrow,
} from './svg'

const COL = [140, 400, 640, 880] // x de las columnas col0..col3
const TOP = 150
const BOT = 440
const MIDY = (TOP + BOT) / 2 // 295

const MESH_COLORS = ['var(--terracotta)', 'var(--amber)', 'var(--forest)']

// Un lazo de malla: rectángulo redondeado punteado + 4 flechas (horario) + chip.
function MeshLoop({
  x0,
  x1,
  color,
  value,
}: {
  x0: number
  x1: number
  color: string
  value: string
}) {
  const y0 = TOP + 34
  const y1 = BOT - 34
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  return (
    <g>
      <rect
        x={x0}
        y={y0}
        width={x1 - x0}
        height={y1 - y0}
        rx={18}
        fill="none"
        stroke={color}
        strokeWidth={2.4}
        className="mesh-loop"
        opacity={0.9}
      />
      <CurrentArrow x={cx} y={y0} dir="right" color={color} length={26} />
      <CurrentArrow x={x1} y={cy} dir="down" color={color} length={26} />
      <CurrentArrow x={cx} y={y1} dir="left" color={color} length={26} />
      <CurrentArrow x={x0} y={cy} dir="up" color={color} length={26} />
      {/* Chip en el tercio superior del lazo para no encimarse con las fuentes. */}
      <Chip x={cx} y={y0 + 40} text={value} color={color} stroke={color} />
    </g>
  )
}

export default function SchematicC1({
  sol,
  params,
  layers,
}: {
  sol: Solution
  params: Circuit1Params
  layers: Layers
}) {
  const iR = (id: string) => sol.currentThrough(id)
  // Centros de los resistores (para etiquetas y flechas de rama).
  const topC = [(COL[0] + COL[1]) / 2, (COL[1] + COL[2]) / 2, (COL[2] + COL[3]) / 2]
  const botC = topC

  return (
    <svg viewBox="0 0 1020 590" width="100%" role="img" aria-label="Circuito 1, resuelto por mallas">
      <SvgDefs />

      {/* --- Resistores de los rieles --- */}
      <Resistor x1={COL[0]} y1={TOP} x2={COL[1]} y2={TOP} />
      <Resistor x1={COL[1]} y1={TOP} x2={COL[2]} y2={TOP} />
      <Resistor x1={COL[2]} y1={TOP} x2={COL[3]} y2={TOP} highlight={layers.control} />
      <Resistor x1={COL[0]} y1={BOT} x2={COL[1]} y2={BOT} />
      <Resistor x1={COL[1]} y1={BOT} x2={COL[2]} y2={BOT} highlight={layers.control} />
      <Resistor x1={COL[2]} y1={BOT} x2={COL[3]} y2={BOT} />

      {/* --- Verticales: cables + fuentes --- */}
      {COL.map((x, i) => (
        <g key={i}>
          <Wire points={[[x, TOP], [x, MIDY - 25]]} />
          <Wire points={[[x, MIDY + 25], [x, BOT]]} />
        </g>
      ))}
      <IndepVSource cx={COL[0]} cy={MIDY} plus="top" />
      <DepSource cx={COL[1]} cy={MIDY} kind="current" dir="up" />
      <IndepISource cx={COL[2]} cy={MIDY} dir="up" />
      <DepSource cx={COL[3]} cy={MIDY} kind="voltage" plus="top" />

      {/* --- Nodos con dot en las T (columnas internas) --- */}
      <Junction x={COL[1]} y={TOP} />
      <Junction x={COL[2]} y={TOP} />
      <Junction x={COL[1]} y={BOT} />
      <Junction x={COL[2]} y={BOT} />

      {/* --- Nombres de nodo --- */}
      {(['T0', 'T1', 'T2', 'T3'] as const).map((n, i) => (
        <Label key={n} x={COL[i]} y={TOP - 52} size={14} weight={600} color="var(--ink-soft)">
          {n}
        </Label>
      ))}
      {(['B0', 'B1', 'B2', 'B3'] as const).map((n, i) => (
        <Label key={n} x={COL[i]} y={BOT + 52} size={14} weight={600} color="var(--ink-soft)">
          {n}
        </Label>
      ))}

      {/* --- Valores de resistor (siempre visibles) --- */}
      {[
        ['R1', '4 Ω'],
        ['R2', '2.5 Ω'],
        ['R3', '2 Ω'],
      ].map(([id, v], i) => (
        <g key={id}>
          <Label x={topC[i]} y={TOP - 32} size={12} color="var(--ink-faint)">
            {id}
          </Label>
          <Label x={topC[i]} y={TOP - 15} size={15} weight={500} mono>
            {v}
          </Label>
        </g>
      ))}
      {[
        ['R4', '6 Ω'],
        ['R5', '7.5 Ω'],
        ['R6', '8 Ω'],
      ].map(([id, v], i) => (
        <g key={id}>
          <Label x={botC[i]} y={BOT + 17} size={15} weight={500} mono>
            {v}
          </Label>
          <Label x={botC[i]} y={BOT + 34} size={12} color="var(--ink-faint)">
            {id}
          </Label>
        </g>
      ))}

      {/* --- Etiquetas de fuentes (siempre) --- */}
      <Label x={COL[0] - 34} y={MIDY - 9} size={13} weight={700} anchor="end">
        V₁
      </Label>
      <Label x={COL[0] - 34} y={MIDY + 10} size={14} anchor="end" mono>
        {fmt(params.V1, 0)} V
      </Label>

      <Label x={COL[1] + 36} y={MIDY - 9} size={13} weight={700} anchor="start" color="var(--terracotta)">
        G1 · VCCS
      </Label>
      <Label x={COL[1] + 36} y={MIDY + 10} size={14} anchor="start" mono>
        0.4·V_A
      </Label>

      <Label x={COL[2] + 36} y={MIDY - 9} size={13} weight={700} anchor="start">
        I1
      </Label>
      <Label x={COL[2] + 36} y={MIDY + 10} size={14} anchor="start" mono>
        {fmt(params.I1, 1)} A
      </Label>

      <Label x={COL[3] + 34} y={MIDY - 9} size={13} weight={700} anchor="start" color="var(--terracotta)">
        E1 · VCVS
      </Label>
      <Label x={COL[3] + 34} y={MIDY + 10} size={14} anchor="start" mono>
        0.8·V_B
      </Label>

      {/* --- Capa: corrientes de malla --- */}
      {layers.mesh && (
        <>
          <MeshLoop x0={COL[0] + 26} x1={COL[1] - 26} color={MESH_COLORS[0]} value={`I₁ = ${fmt(iR('R1'), 2)} A`} />
          <MeshLoop x0={COL[1] + 26} x1={COL[2] - 26} color={MESH_COLORS[1]} value={`I₂ = ${fmt(iR('R2'), 2)} A`} />
          <MeshLoop x0={COL[2] + 26} x1={COL[3] - 26} color={MESH_COLORS[2]} value={`I₃ = ${fmt(iR('R3'), 2)} A`} />
        </>
      )}

      {/* --- Capa: variables de control --- */}
      {layers.control && (
        <>
          <Chip x={topC[2]} y={TOP + 34} text={`V_A = ${fmt(sol.voltageAcross('R3'), 1)} V`} color="var(--terracotta)" stroke="var(--terracotta)" />
          <Chip x={botC[1]} y={BOT - 34} text={`V_B = ${fmt(sol.voltageAcross('R5'), 1)} V`} color="var(--terracotta)" stroke="var(--terracotta)" />
          {/* V_O a través de la rama de G1 */}
          <Wire points={[[COL[1] - 60, MIDY - 40], [COL[1] - 60, MIDY + 40]]} stroke="var(--forest)" width={1.6} />
          <Chip x={COL[1] - 60} y={MIDY} text={`V_O = ${fmt(sol.nodeVoltage('T1') - sol.nodeVoltage('B1'), 0)} V`} color="var(--forest)" stroke="var(--forest)" />
        </>
      )}

      {/* --- Capa: corrientes de rama --- */}
      {layers.branch && (
        <>
          {[iR('R1'), iR('R2'), iR('R3')].map((v, i) => (
            <g key={i}>
              <CurrentArrow x={topC[i]} y={TOP + 22} dir={v >= 0 ? 'right' : 'left'} />
              <Chip x={topC[i]} y={TOP + 42} text={`${fmt(Math.abs(v), 2)} A`} color="var(--amber)" stroke="var(--amber)" size={12} />
            </g>
          ))}
          {[iR('R4'), iR('R5'), iR('R6')].map((v, i) => (
            <g key={i}>
              <CurrentArrow x={botC[i]} y={BOT - 22} dir={v >= 0 ? 'right' : 'left'} />
              <Chip x={botC[i]} y={BOT - 42} text={`${fmt(Math.abs(v), 2)} A`} color="var(--amber)" stroke="var(--amber)" size={12} />
            </g>
          ))}
        </>
      )}
    </svg>
  )
}

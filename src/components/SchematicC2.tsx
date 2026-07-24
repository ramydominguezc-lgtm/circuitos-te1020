import type { Solution } from '../lib/mna'
import type { Layers } from '../lib/ui'
import type { Circuit2Params } from '../circuits/circuit2'
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

// Coordenadas fijas (control absoluto).
const XV1 = 120 // columna de V1
const XN1 = 360 // columna N1 / R2 / I1
const XNC = 600 // columna NC / G2
const XN3 = 820 // columna N3 / R4
const YTOP = 150 // riel superior (N1 — R1 — N3)
const YMID = 300 // N2 — R3 — NC
const YGND = 470 // riel de tierra

export default function SchematicC2({
  sol,
  params,
  layers,
}: {
  sol: Solution
  params: Circuit2Params
  layers: Layers
}) {
  const V = (n: string) => sol.nodeVoltage(n)
  const iR = (id: string) => sol.currentThrough(id)

  return (
    <svg viewBox="0 0 960 560" width="100%" role="img" aria-label="Circuito 2, resuelto por nodos">
      <SvgDefs />

      {/* --- Cables base --- */}
      {/* Riel N1 (de V1 a la T de N1) */}
      <Wire points={[[XV1, YTOP], [XN1, YTOP]]} />
      {/* Riel de tierra */}
      <Wire points={[[XV1, YGND], [XN3, YGND]]} />
      {/* V1 vertical */}
      <Wire points={[[XV1, YTOP], [XV1, (YTOP + YGND) / 2 - 21]]} />
      <Wire points={[[XV1, (YTOP + YGND) / 2 + 21], [XV1, YGND]]} />
      {/* Bajante N1→N2 (R2) y N2→GND (I1) */}
      <Wire points={[[XN1, YMID], [XN1, (YMID + YGND) / 2 - 21]]} />
      <Wire points={[[XN1, (YMID + YGND) / 2 + 21], [XN1, YGND]]} />
      {/* NC→GND (G2) */}
      <Wire points={[[XNC, YMID], [XNC, (YMID + YGND) / 2 - 23]]} />
      <Wire points={[[XNC, (YMID + YGND) / 2 + 23], [XNC, YGND]]} />
      {/* Diagonal H1 (NC → N3) por debajo del rombo */}
      <Wire points={[[XNC, YMID], [XN3, YTOP]]} />

      {/* --- Resistores --- */}
      <Resistor x1={XN1} y1={YTOP} x2={XN3} y2={YTOP} highlight={layers.branch && Math.abs(iR('R1')) < 1e-9} />
      <Resistor x1={XN1} y1={YTOP} x2={XN1} y2={YMID} highlight={layers.control} />
      <Resistor x1={XN1} y1={YMID} x2={XNC} y2={YMID} />
      <Resistor x1={XN3} y1={YTOP} x2={XN3} y2={YGND} highlight={layers.control} />

      {/* --- Fuentes --- */}
      <IndepVSource cx={XV1} cy={(YTOP + YGND) / 2} plus="top" />
      <IndepISource cx={XN1} cy={(YMID + YGND) / 2} dir="down" />
      <DepSource cx={XNC} cy={(YMID + YGND) / 2} kind="current" dir="up" />
      <DepSource cx={(XNC + XN3) / 2} cy={(YMID + YTOP) / 2} kind="voltage" plus="top" highlight={layers.control} />

      {/* --- Nodos (dots) --- */}
      <Junction x={XN1} y={YTOP} />
      <Junction x={XN1} y={YMID} />
      <Junction x={XNC} y={YMID} />
      <Junction x={XN3} y={YTOP} />
      {[XV1, XN1, XNC, XN3].map((x) => (
        <Junction key={x} x={x} y={YGND} />
      ))}

      {/* --- Símbolo de tierra --- */}
      <g stroke="var(--ink)" strokeWidth={2.2} strokeLinecap="round">
        <line x1={470} y1={YGND} x2={470} y2={YGND + 16} />
        <line x1={456} y1={YGND + 16} x2={484} y2={YGND + 16} />
        <line x1={461} y1={YGND + 22} x2={479} y2={YGND + 22} />
        <line x1={466} y1={YGND + 28} x2={474} y2={YGND + 28} />
      </g>
      <Label x={470} y={YGND + 44} size={12} color="var(--ink-faint)">
        GND
      </Label>

      {/* --- Nombres de nodo --- */}
      <Label x={XN1 - 16} y={YTOP - 20} size={14} weight={600} color="var(--ink-soft)" anchor="end">
        N1
      </Label>
      <Label x={XN1 - 16} y={YMID} size={14} weight={600} color="var(--ink-soft)" anchor="end">
        N2
      </Label>
      <Label x={XNC} y={YMID - 22} size={14} weight={600} color="var(--ink-soft)">
        NC · Vc
      </Label>
      <Label x={XN3 + 16} y={YTOP - 20} size={14} weight={600} color="var(--ink-soft)" anchor="start">
        N3
      </Label>

      {/* --- Valores de resistor --- */}
      <Label x={(XN1 + XN3) / 2} y={YTOP - 18} size={15} weight={500} mono>
        R1 · 1 Ω
      </Label>
      <Label x={XN1 - 30} y={(YTOP + YMID) / 2} size={15} weight={500} mono anchor="end">
        2 Ω
      </Label>
      <Label x={XN1 - 30} y={(YTOP + YMID) / 2 + 17} size={12} color="var(--ink-faint)" anchor="end">
        R2
      </Label>
      <Label x={(XN1 + XNC) / 2} y={YMID - 16} size={15} weight={500} mono>
        R3 · 1 Ω
      </Label>
      <Label x={XN3 + 22} y={(YTOP + YGND) / 2} size={15} weight={500} mono anchor="start">
        2 Ω
      </Label>
      <Label x={XN3 + 22} y={(YTOP + YGND) / 2 + 17} size={12} color="var(--ink-faint)" anchor="start">
        R4
      </Label>

      {/* --- Etiquetas de fuentes --- */}
      <Label x={XV1 - 30} y={(YTOP + YGND) / 2 - 9} size={13} weight={700} anchor="end">
        V₁
      </Label>
      <Label x={XV1 - 30} y={(YTOP + YGND) / 2 + 10} size={14} anchor="end" mono>
        {fmt(params.V1, 0)} V
      </Label>
      <Label x={XN1 + 32} y={(YMID + YGND) / 2 - 9} size={13} weight={700} anchor="start">
        I1
      </Label>
      <Label x={XN1 + 32} y={(YMID + YGND) / 2 + 10} size={14} anchor="start" mono>
        9 A
      </Label>
      <Label x={XNC + 34} y={(YMID + YGND) / 2 - 9} size={13} weight={700} anchor="start" color="var(--terracotta)">
        G2 · VCCS
      </Label>
      <Label x={XNC + 34} y={(YMID + YGND) / 2 + 10} size={14} anchor="start" mono>
        2·V_y
      </Label>
      <Label x={(XNC + XN3) / 2 - 40} y={(YMID + YTOP) / 2 - 30} size={13} weight={700} anchor="middle" color="var(--terracotta)">
        H1 · CCVS
      </Label>
      <Label x={(XNC + XN3) / 2 - 40} y={(YMID + YTOP) / 2 - 13} size={14} anchor="middle" mono>
        3·I_x
      </Label>

      {/* --- Capa: voltajes de nodo --- */}
      {layers.nodes && (
        <>
          <Chip x={XN1 + 60} y={YTOP - 26} text={`${fmt(V('N1'), 2)} V`} color="var(--forest)" stroke="var(--forest)" />
          <Chip x={XN1 - 78} y={YMID} text={`${fmt(V('N2'), 2)} V`} color="var(--forest)" stroke="var(--forest)" />
          <Chip x={XNC} y={YMID + 26} text={`${fmt(V('NC'), 2)} V`} color="var(--forest)" stroke="var(--forest)" />
          <Chip x={XN3 + 4} y={YTOP - 44} text={`${fmt(V('N3'), 2)} V`} color="var(--forest)" stroke="var(--forest)" />
        </>
      )}

      {/* --- Capa: variables de control --- */}
      {layers.control && (
        <>
          {/* V_y sobre R2 */}
          <Chip x={XN1 + 66} y={(YTOP + YMID) / 2} text={`V_y = ${fmt(sol.voltageAcross('R2'), 1)} V`} color="var(--terracotta)" stroke="var(--terracotta)" />
          {/* I_x subiendo por R4 (amperímetro) */}
          <CurrentArrow x={XN3} y={(YTOP + YGND) / 2 - 60} dir="up" color="var(--terracotta)" length={30} />
          <Chip x={XN3 - 74} y={(YTOP + YGND) / 2 - 60} text={`I_x = ${fmt(sol.controlCurrent('H1'), 1)} A`} color="var(--terracotta)" stroke="var(--terracotta)" />
        </>
      )}

      {/* --- Capa: corrientes de rama --- */}
      {layers.branch && (
        <>
          {/* R1 superior = 0 (resaltado) */}
          <Chip x={(XN1 + XN3) / 2} y={YTOP + 20} text="i(R1) = 0 A" color="var(--forest)" stroke="var(--forest)" />
          {/* R2 */}
          <CurrentArrow x={XN1 + 20} y={(YTOP + YMID) / 2} dir={iR('R2') >= 0 ? 'down' : 'up'} />
          <Chip x={XN1 + 74} y={(YTOP + YMID) / 2 + 26} text={`${fmt(Math.abs(iR('R2')), 2)} A`} color="var(--amber)" stroke="var(--amber)" size={12} />
          {/* R3 */}
          <CurrentArrow x={(XN1 + XNC) / 2} y={YMID + 20} dir={iR('R3') >= 0 ? 'right' : 'left'} />
          <Chip x={(XN1 + XNC) / 2} y={YMID + 40} text={`${fmt(Math.abs(iR('R3')), 2)} A`} color="var(--amber)" stroke="var(--amber)" size={12} />
          {/* R4 */}
          <CurrentArrow x={XN3 - 20} y={(YTOP + YGND) / 2 + 40} dir={iR('R4') >= 0 ? 'down' : 'up'} />
          <Chip x={XN3 - 74} y={(YTOP + YGND) / 2 + 40} text={`${fmt(Math.abs(iR('R4')), 2)} A`} color="var(--amber)" stroke="var(--amber)" size={12} />
        </>
      )}
    </svg>
  )
}

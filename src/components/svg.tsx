// Primitivas SVG dibujadas a mano para los esquemáticos. Todo con control
// absoluto de coordenadas: nada de librerías de circuitos.

import type { ReactNode } from 'react'

const INK = 'var(--ink)'

export function SvgDefs() {
  return (
    <defs>
      {/* Punta de flecha que hereda el color del trazo (context-stroke). */}
      <marker
        id="ah"
        markerWidth="10"
        markerHeight="10"
        refX="7"
        refY="4.5"
        orient="auto-start-reverse"
      >
        <path d="M1,1 L8,4.5 L1,8 Z" fill="context-stroke" />
      </marker>
    </defs>
  )
}

// --- Cables y nodos ---------------------------------------------------------

export function Wire({
  points,
  stroke = INK,
  width = 2.4,
  className,
}: {
  points: [number, number][]
  stroke?: string
  width?: number
  className?: string
}) {
  const d = points.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ')
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    />
  )
}

export function Junction({ x, y, r = 4.6 }: { x: number; y: number; r?: number }) {
  return <circle cx={x} cy={y} r={r} fill={INK} />
}

// --- Texto ------------------------------------------------------------------

export function Label({
  x,
  y,
  children,
  size = 15,
  weight = 500,
  color = INK,
  anchor = 'middle',
  mono = false,
  italic = false,
}: {
  x: number
  y: number
  children: ReactNode
  size?: number
  weight?: number
  color?: string
  anchor?: 'start' | 'middle' | 'end'
  mono?: boolean
  italic?: boolean
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="middle"
      style={{
        fontFamily: mono
          ? "'JetBrains Mono', ui-monospace, monospace"
          : "'Space Grotesk', system-ui, sans-serif",
        fontSize: size,
        fontWeight: weight,
        fontStyle: italic ? 'italic' : 'normal',
        fill: color,
      }}
    >
      {children}
    </text>
  )
}

// Píldora con valor numérico (fondo + borde). Centrada en (x, y).
export function Chip({
  x,
  y,
  text,
  color = INK,
  bg = 'var(--surface)',
  stroke = 'var(--line-strong)',
  size = 14,
  bold = true,
}: {
  x: number
  y: number
  text: string
  color?: string
  bg?: string
  stroke?: string
  size?: number
  bold?: boolean
}) {
  const w = text.length * size * 0.62 + 16
  const h = size + 12
  return (
    <g>
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={h / 2}
        fill={bg}
        stroke={stroke}
        strokeWidth={1.3}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: size,
          fontWeight: bold ? 700 : 500,
          fill: color,
        }}
      >
        {text}
      </text>
    </g>
  )
}

// --- Resistor (zigzag ANSI) -------------------------------------------------

function zigzag(len: number, amp = 8, teeth = 6): string {
  // Deja tramos de cable a los lados y un cuerpo (zigzag) compacto y constante.
  const lead = Math.max(14, (len - 108) / 2)
  const body = len - 2 * lead
  const step = body / teeth
  let d = `M 0 0 L ${lead} 0`
  for (let i = 0; i < teeth; i++) {
    const px = lead + step * (i + 0.5)
    d += ` L ${px.toFixed(2)} ${i % 2 === 0 ? -amp : amp}`
  }
  d += ` L ${len - lead} 0 L ${len} 0`
  return d
}

export function Resistor({
  x1,
  y1,
  x2,
  y2,
  highlight = false,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  highlight?: boolean
}) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI
  const d = zigzag(len)
  return (
    <g transform={`translate(${x1} ${y1}) rotate(${angle})`}>
      {highlight && (
        <path
          d={d}
          fill="none"
          stroke="var(--terracotta)"
          strokeWidth={10}
          strokeOpacity={0.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <path
        d={d}
        fill="none"
        stroke={highlight ? 'var(--terracotta)' : INK}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  )
}

// --- Fuentes ----------------------------------------------------------------

type Side = 'top' | 'bottom' | 'left' | 'right'
type Dir = 'up' | 'down' | 'left' | 'right'

function signPos(cx: number, cy: number, r: number, side: Side, inset = 11) {
  switch (side) {
    case 'top':
      return { x: cx, y: cy - r + inset }
    case 'bottom':
      return { x: cx, y: cy + r - inset }
    case 'left':
      return { x: cx - r + inset, y: cy }
    case 'right':
      return { x: cx + r - inset, y: cy }
  }
}

// Fuente independiente de voltaje: círculo con + y −.
export function IndepVSource({
  cx,
  cy,
  r = 21,
  plus = 'top',
}: {
  cx: number
  cy: number
  r?: number
  plus?: Side
}) {
  const minus: Side =
    plus === 'top' ? 'bottom' : plus === 'bottom' ? 'top' : plus === 'left' ? 'right' : 'left'
  const p = signPos(cx, cy, r, plus)
  const m = signPos(cx, cy, r, minus)
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="var(--surface)" stroke={INK} strokeWidth={2.6} />
      <Label x={p.x} y={p.y} size={18} weight={700}>
        +
      </Label>
      <Label x={m.x} y={m.y} size={20} weight={700}>
        −
      </Label>
    </g>
  )
}

function arrowInside(cx: number, cy: number, r: number, dir: Dir, stroke: string) {
  const a = r - 7
  let x1 = cx,
    y1 = cy,
    x2 = cx,
    y2 = cy
  if (dir === 'up') {
    y1 = cy + a
    y2 = cy - a
  } else if (dir === 'down') {
    y1 = cy - a
    y2 = cy + a
  } else if (dir === 'left') {
    x1 = cx + a
    x2 = cx - a
  } else {
    x1 = cx - a
    x2 = cx + a
  }
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={stroke}
      strokeWidth={2.6}
      markerEnd="url(#ah)"
      strokeLinecap="round"
    />
  )
}

// Fuente independiente de corriente: círculo con flecha.
export function IndepISource({
  cx,
  cy,
  r = 21,
  dir = 'up',
  color = INK,
}: {
  cx: number
  cy: number
  r?: number
  dir?: Dir
  color?: string
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="var(--surface)" stroke={INK} strokeWidth={2.6} />
      {arrowInside(cx, cy, r, dir, color)}
    </g>
  )
}

function diamondPath(cx: number, cy: number, r: number) {
  return `M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`
}

// Fuente dependiente: rombo. kind 'voltage' → +/− ; kind 'current' → flecha.
export function DepSource({
  cx,
  cy,
  r = 23,
  kind,
  plus = 'top',
  dir = 'up',
  highlight = false,
}: {
  cx: number
  cy: number
  r?: number
  kind: 'voltage' | 'current'
  plus?: Side
  dir?: Dir
  highlight?: boolean
}) {
  const stroke = highlight ? 'var(--terracotta)' : INK
  const minus: Side =
    plus === 'top' ? 'bottom' : plus === 'bottom' ? 'top' : plus === 'left' ? 'right' : 'left'
  const p = signPos(cx, cy, r, plus, 13)
  const m = signPos(cx, cy, r, minus, 13)
  return (
    <g>
      {highlight && (
        <path d={diamondPath(cx, cy, r + 5)} fill="var(--terracotta)" opacity={0.14} />
      )}
      <path d={diamondPath(cx, cy, r)} fill="var(--surface)" stroke={stroke} strokeWidth={2.6} />
      {kind === 'voltage' ? (
        <>
          <Label x={p.x} y={p.y} size={17} weight={700} color={stroke}>
            +
          </Label>
          <Label x={m.x} y={m.y} size={19} weight={700} color={stroke}>
            −
          </Label>
        </>
      ) : (
        arrowInside(cx, cy, r, dir, stroke)
      )}
    </g>
  )
}

// Flecha de corriente de rama con su valor (para superponer sobre resistores).
export function CurrentArrow({
  x,
  y,
  dir,
  length = 34,
  color = 'var(--amber)',
}: {
  x: number
  y: number
  dir: Dir
  length?: number
  color?: string
}) {
  const h = length / 2
  let x1 = x,
    y1 = y,
    x2 = x,
    y2 = y
  if (dir === 'right') {
    x1 = x - h
    x2 = x + h
  } else if (dir === 'left') {
    x1 = x + h
    x2 = x - h
  } else if (dir === 'down') {
    y1 = y - h
    y2 = y + h
  } else {
    y1 = y + h
    y2 = y - h
  }
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={3}
      markerEnd="url(#ah)"
      strokeLinecap="round"
    />
  )
}

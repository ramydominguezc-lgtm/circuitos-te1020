// Formateo de números para la UI. Redondea a `d` decimales y evita el
// "-0.00" y los ceros de relleno que ensucian la lectura en pantalla.

export function fmt(x: number, d = 3): string {
  if (!Number.isFinite(x)) return '—'
  let v = x
  if (Math.abs(v) < 5e-13) v = 0 // limpia ruido numérico ~0
  const s = v.toFixed(d)
  return s === `-${(0).toFixed(d)}` ? (0).toFixed(d) : s
}

// Valor con unidad, ej. "185.000 V".
export function fmtUnit(x: number, unit: string, d = 3): string {
  return `${fmt(x, d)} ${unit}`.trim()
}

// Error en porcentaje para la tabla. Bajo el umbral se muestra "0.00 %".
export function fmtErr(pct: number): string {
  const v = Math.abs(pct) < 1e-6 ? 0 : pct
  return `${v.toFixed(2)} %`
}

// Signo explícito para etiquetas de corriente/voltaje cuando importa el sentido.
export function fmtSigned(x: number, d = 2): string {
  const v = Math.abs(x) < 5e-13 ? 0 : x
  const s = fmt(Math.abs(v), d)
  return v < 0 ? `−${s}` : v > 0 ? `${s}` : s
}

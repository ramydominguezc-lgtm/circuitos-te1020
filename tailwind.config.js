/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta cálida y terrosa (papel/tinta + acentos)
        paper: '#EDE6D5',       // fondo bone/crema (más profundo, para que las tarjetas resalten)
        surface: '#F7F1E4',     // tarjetas y paneles (crema claro)
        surface2: '#F1E9D8',    // superficie secundaria
        panel: '#E4DAC2',       // paneles hundidos (barra de esquemático)
        ink: '#221E17',         // tinta casi negra cálida
        'ink-soft': '#5E5647',  // texto secundario (marrón grisáceo)
        'ink-faint': '#8A806C', // texto terciario / captions
        line: '#D6C9AC',        // hairlines cálidas
        'line-strong': '#C3B189',
        terracotta: '#B14A2C',  // acento principal
        'terracotta-soft': '#D98A6A',
        amber: '#C6841E',       // acento secundario
        'amber-soft': '#E5B34E',
        forest: '#4C6142',      // acento verde bosque / "ok"
        'forest-soft': '#7C9169',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 0 #FBF7EE inset, 0 2px 6px -2px rgba(34,30,23,0.12), 0 8px 24px -12px rgba(34,30,23,0.18)',
        raised: '0 1px 0 0 #FBF7EE inset, 0 10px 30px -14px rgba(34,30,23,0.35)',
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
}

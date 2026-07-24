# Circuitos de CD con fuentes dependientes · TE1020

App web de una sola página que **simula y explica dos circuitos de CD con fuentes
dependientes**. Material de apoyo para un video de la Actividad 6 de
TE1020 · Análisis de Circuitos Eléctricos.

El punto central: la simulación es **real**. Un solver de Análisis Nodal
Modificado (MNA) escrito a mano resuelve el circuito desde un netlist
declarativo; ningún número en pantalla está escrito a mano (salvo la columna
"cálculo a mano" de la tabla de comparación).

## Stack

- Vite + React + TypeScript
- Tailwind CSS v3
- Sin backend — todo corre en el cliente
- Esquemáticos en SVG dibujados a mano (sin librerías de circuitos)

## Solver (lo importante)

`src/lib/mna.ts` — solver MNA genérico:

- Recibe un netlist y arma la matriz `A` y el vector `z`
- Soporta R, V, I, VCVS (E), VCCS (G), CCVS (H), CCCS (F)
- Para H y F inserta internamente una fuente de 0 V (amperímetro) que sensa la
  corriente de control
- Resuelve con eliminación gaussiana + pivoteo parcial (sin dependencias)
- `currentThrough(id)`, `voltageAcross(id)`, `nodeVoltage(node)`,
  `controlCurrent(id)`

Los netlists de ambos circuitos están en `src/circuits/`. Si cambias una
resistencia ahí, todos los valores de la UI se recalculan solos.

## Scripts

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm test         # 14 tests: valida ambos circuitos a 1e-9
npm run build    # build de producción (carpeta dist/)
```

## Deploy a Vercel

El proyecto se detecta automáticamente como Vite (build `npm run build`,
salida `dist/`), sin configuración extra. Opciones:

1. **Desde GitHub (recomendado):** importa el repo en
   [vercel.com/new](https://vercel.com/new) → deploy automático en cada push.
2. **Desde la CLI:** `npm i -g vercel` y luego `vercel` en la raíz del proyecto.

## Estructura

```
src/
  lib/
    mna.ts            solver MNA + eliminación gaussiana
    mna.test.ts       tests con los valores de validación
    report.ts         tabla "a mano vs. simulación"
    format.ts         formateo de números
    ui.ts             tipos de capas
  circuits/
    circuit1.ts       netlist + cantidades (mallas)
    circuit2.ts       netlist + cantidades (nodos)
  components/
    svg.tsx           primitivas SVG (resistores, fuentes, flechas)
    SchematicC1.tsx   esquemático circuito 1
    SchematicC2.tsx   esquemático circuito 2
    ComparisonTable.tsx
    ControlsPanel.tsx
    DependentSourcesPanel.tsx
  App.tsx             tabs, layout y modo presentación
```

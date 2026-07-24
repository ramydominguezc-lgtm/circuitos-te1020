// Capas que se pueden superponer sobre cada esquemático.
export interface Layers {
  mesh: boolean // corrientes de malla (solo Circuito 1)
  nodes: boolean // voltajes de nodo (solo Circuito 2)
  control: boolean // variables de control (V_A, V_B, V_y, I_x)
  branch: boolean // corrientes de rama sobre cada resistor
}

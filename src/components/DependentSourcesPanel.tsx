import { useState } from 'react'

interface SourceCard {
  tag: string
  spice: string // letra SPICE
  kind: string
  gain: string
  gainNote: string
  senses: string
  output: string
  netlist: string
}

const CARDS: SourceCard[] = [
  {
    tag: '0.4 · V_A',
    spice: 'G',
    kind: 'VCCS · fuente de corriente controlada por voltaje',
    gain: '0.4 siemens (S)',
    gainNote: 'transconductancia — tiene unidades, NO es adimensional',
    senses: 'el resistor de 2 Ω (R3). Toma el + en el nodo izquierdo (T2), − en T3 ⇒ V_A = V(T2) − V(T3).',
    output: 'inyecta corriente hacia arriba, de B1 a T1.',
    netlist: 'G1 B1 T1 T2 T3 0.4',
  },
  {
    tag: '0.8 · V_B',
    spice: 'E',
    kind: 'VCVS · fuente de voltaje controlada por voltaje',
    gain: '0.8 V/V',
    gainNote: 'ganancia adimensional',
    senses: 'el resistor de 7.5 Ω (R5). Toma el + en el nodo izquierdo (B1), − en B2 ⇒ V_B = V(B1) − V(B2).',
    output: 'terminal + arriba (T3), − abajo (B3).',
    netlist: 'E1 T3 B3 B1 B2 0.8',
  },
  {
    tag: '3 · I_x',
    spice: 'H',
    kind: 'CCVS · fuente de voltaje controlada por corriente',
    gain: '3 ohms (Ω)',
    gainNote: 'transresistencia — tiene unidades de resistencia',
    senses: 'la corriente que SUBE por el 2 Ω derecho (R4). En LTspice se sensa con una fuente de 0 V (Vx) en serie.',
    output: 'terminal + arriba (N3), − abajo (NC).',
    netlist: 'R4 N3 NX 2\nVx 0 NX 0\nH1 N3 NC Vx 3',
  },
  {
    tag: '2 · V_y',
    spice: 'G',
    kind: 'VCCS · fuente de corriente controlada por voltaje',
    gain: '2 siemens (S)',
    gainNote: 'transconductancia — tiene unidades',
    senses: 'el resistor de 2 Ω izquierdo (R2). Toma el + arriba (N1), − abajo (N2) ⇒ V_y = V(N1) − V(N2).',
    output: 'inyecta corriente hacia arriba, hacia NC.',
    netlist: 'G2 0 NC N1 N2 2',
  },
]

const CALLOUTS: { title: string; body: string; tone: 'terra' | 'amber' | 'forest' }[] = [
  {
    title: 'Multisim · control por VOLTAJE = 4 terminales',
    body: 'Las fuentes controladas por voltaje (E, G) tienen dos terminales de control que se conectan como puntas de prueba, en paralelo al elemento sensado, y dos terminales de salida.',
    tone: 'forest',
  },
  {
    title: 'Multisim · control por CORRIENTE = rama en SERIE',
    body: 'La fuente controlada por corriente (H, F) es distinta: su entrada de control es una rama en serie que hay que intercalar cortando el cable de la rama sensada. Se comporta como un amperímetro ideal (un corto). Este es el error más común.',
    tone: 'amber',
  },
  {
    title: 'LTspice · fuente de 0 V para sensar corriente',
    body: 'El elemento H solo acepta el nombre de una fuente de voltaje como referencia. Por eso hace falta intercalar una fuente de 0 V en serie con la rama cuya corriente se quiere sensar (aquí, Vx en serie con R4).',
    tone: 'terra',
  },
  {
    title: 'Error #1 · invertir las terminales de control',
    body: 'Invertir el control cambia el signo de la ganancia y todo el circuito da mal. Si un resultado no cuadra, revisa PRIMERO la orientación del control, no el valor de la ganancia.',
    tone: 'terra',
  },
  {
    title: 'Polaridad invertida = normal',
    body: 'En este ejercicio 0.8·V_B da −72 V y 3·I_x da −3 V: las fuentes dependientes pueden operar con polaridad invertida a la dibujada. Eso es correcto, no es un error.',
    tone: 'forest',
  },
]

const NETLIST_C1 = `* Circuito 1 - TE1020 (mallas) - fuentes dependientes
* Referencia: B0 = 0
V1 T0 0 193
R1 T0 T1 4
R2 T1 T2 2.5
R3 T2 T3 2
R4 0 B1 6
R5 B1 B2 7.5
R6 B2 B3 8
* VCCS G1 = 0.4*V_A, V_A = V(T2)-V(T3); inyecta en T1
G1 B1 T1 T2 T3 0.4
* Fuente de corriente I1 = 0.5 A hacia T2
I1 B2 T2 0.5
* VCVS E1 = 0.8*V_B, V_B = V(B1)-V(B2); + en T3
E1 T3 B3 B1 B2 0.8
.op
.end`

const NETLIST_C2 = `* Circuito 2 - TE1020 (nodos) - fuentes dependientes
* Referencia: GND = 0
V1 N1 0 2
R1 N1 N3 1
R2 N1 N2 2
R3 N2 NC 1
* R4 con amperimetro de 0 V (Vx) para sensar I_x que sube por R4
R4 N3 NX 2
Vx 0 NX 0
* Fuente de corriente I1 = 9 A que baja de N2 a tierra
I1 N2 0 9
* CCVS H1 = 3*I_x, sensa la corriente de Vx; + en N3, - en NC
H1 N3 NC Vx 3
* VCCS G2 = 2*V_y, V_y = V(N1)-V(N2); inyecta en NC
G2 0 NC N1 N2 2
.op
.end`

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1600)
          },
          () => setCopied(false),
        )
      }}
      className="rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-surface transition-colors hover:bg-ink-soft"
    >
      {copied ? '✓ copiado' : 'copiar'}
    </button>
  )
}

const TONE: Record<string, string> = {
  terra: 'border-terracotta/40 bg-terracotta/[0.06]',
  amber: 'border-amber/40 bg-amber/[0.06]',
  forest: 'border-forest/40 bg-forest/[0.06]',
}
const TONE_DOT: Record<string, string> = {
  terra: 'bg-terracotta',
  amber: 'bg-amber',
  forest: 'bg-forest',
}

function NetlistBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-[#211E17]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="font-mono text-xs font-medium text-[#E5D9BE]">{title}</span>
        <CopyButton text={code} />
      </div>
      <pre className="code-scroll overflow-x-auto px-4 py-3">
        <code className="font-mono text-[12.5px] leading-relaxed text-[#EDE6D5]">{code}</code>
      </pre>
    </div>
  )
}

export default function DependentSourcesPanel() {
  return (
    <section className="rounded-card border border-line bg-surface p-6 shadow-card md:p-8">
      <div className="mb-6 max-w-3xl">
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-terracotta">
          Guía de simulación
        </p>
        <h2 className="font-display text-3xl font-semibold text-ink md:text-4xl">
          Cómo conectar las fuentes dependientes
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          Una tarjeta por fuente: tipo, símbolo SPICE, ganancia con unidades, qué elemento sensa,
          orientación de terminales y la línea de netlist lista para LTspice.
        </p>
      </div>

      {/* Tarjetas */}
      <div className="grid gap-4 lg:grid-cols-2">
        {CARDS.map((c) => (
          <article key={c.tag} className="flex flex-col rounded-card border border-line-strong bg-paper/60 p-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-terracotta font-display text-2xl font-semibold text-surface">
                {c.spice}
              </span>
              <div>
                <h3 className="font-mono text-xl font-bold text-ink">{c.tag}</h3>
                <p className="text-[13px] text-ink-soft">{c.kind}</p>
              </div>
            </div>
            <dl className="space-y-2 text-[14px]">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 font-medium text-ink-faint">Ganancia</dt>
                <dd className="text-ink">
                  <span className="font-mono font-semibold">{c.gain}</span>
                  <span className="block text-[12.5px] text-ink-soft">{c.gainNote}</span>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 font-medium text-ink-faint">Sensa</dt>
                <dd className="text-ink-soft">{c.senses}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 font-medium text-ink-faint">Salida</dt>
                <dd className="text-ink-soft">{c.output}</dd>
              </div>
            </dl>
            <div className="mt-3 rounded-lg bg-[#211E17] px-3 py-2">
              <code className="font-mono text-[12.5px] leading-relaxed text-[#EDE6D5] whitespace-pre-wrap">
                {c.netlist}
              </code>
            </div>
          </article>
        ))}
      </div>

      {/* Callouts */}
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {CALLOUTS.map((co) => (
          <div key={co.title} className={`rounded-card border px-4 py-3 ${TONE[co.tone]}`}>
            <div className="mb-1 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${TONE_DOT[co.tone]}`} />
              <h4 className="text-[14px] font-semibold text-ink">{co.title}</h4>
            </div>
            <p className="text-[13.5px] leading-relaxed text-ink-soft">{co.body}</p>
          </div>
        ))}
      </div>

      {/* Netlists completos */}
      <div className="mt-6">
        <h3 className="mb-3 font-display text-xl font-semibold text-ink">
          Netlists completos de LTspice
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <NetlistBlock title="circuito1.cir" code={NETLIST_C1} />
          <NetlistBlock title="circuito2.cir" code={NETLIST_C2} />
        </div>
      </div>
    </section>
  )
}

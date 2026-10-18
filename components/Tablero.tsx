// Tablero portable (18/10/2026), con los colores en variables
// --tb-* (ver tablero.css): cada panel pone su paleta y listo.
// Reglas aprendidas:
// 1. El color del cambio dice si es BUENO o MALO, no si sube o baja (el gasto va neutro; 0 % va neutro).
// 2. La plata se suma por moneda: nunca mezclar pesos y dólares en un mismo número.
// 3. Cantidades chicas → eje con enteros. 4. Metas solo con números que puso el dueño: nada inventado.
// 5. Antes de dar por bueno un número, cruzarlo con la base (y con el sistema externo si viene de afuera).
import type { CSSProperties, ReactNode } from 'react'

export const num = (n: number) => Math.round(n).toLocaleString('es-AR')
export const pesos = (n: number) => '$' + num(n)
export const pct = (n: number, dec = 0) => n.toLocaleString('es-AR', { maximumFractionDigits: dec }) + ' %'

/** Fecha de Tucumán (UTC−3) de un momento ISO o de ahora. */
export const diaTuc = (iso?: string) => new Date((iso ? new Date(iso).getTime() : Date.now()) - 3 * 3600 * 1000).toISOString().slice(0, 10)
/** Los últimos n días (de Tucumán), del más viejo a hoy. */
export function ultimosDias(n: number): string[] {
  const hoy = new Date(`${diaTuc()}T12:00:00Z`).getTime()
  return Array.from({ length: n }, (_, k) => new Date(hoy - (n - 1 - k) * 86400000).toISOString().slice(0, 10))
}
/** Cuenta (o suma) por día sobre una lista de días. */
export function porDia<T>(dias: string[], items: T[], fecha: (x: T) => string | null | undefined, valor: (x: T) => number = () => 1): number[] {
  const m = new Map(dias.map(d => [d, 0]))
  for (const x of items) { const f = fecha(x); if (f && m.has(f)) m.set(f, m.get(f)! + valor(x)) }
  return dias.map(d => m.get(d)!)
}
export const suma = (l: number[]) => l.reduce((a, b) => a + b, 0)

/** Cambio en % de un período contra el anterior; null si no hay con qué comparar. */
export function cambioPct(actual: number, anterior: number): number | null {
  if (!anterior) return null
  return ((actual - anterior) / anterior) * 100
}

export function Encabezado({ seccion, titulo, resaltado, sub, pastillas }: {
  seccion: string; titulo: string; resaltado?: string; sub?: ReactNode; pastillas?: { texto: string; tono?: 'bien' | 'ojo' | 'mal' }[]
}) {
  return (
    <div className="tb-cartel">
      <div style={{ minWidth: 0 }}>
        <div className="tb-seccion">{seccion}</div>
        <h1 className="tb-titulo">{titulo}{resaltado ? <> <span>{resaltado}</span></> : null}</h1>
        {sub && <p className="tb-sub" style={{ margin: '.35rem 0 0' }}>{sub}</p>}
      </div>
      {pastillas && pastillas.length > 0 && <div className="tb-pastillas">
        {pastillas.map(p => <span key={p.texto} className={`tb-pastilla ${p.tono || ''}`}>{p.texto}</span>)}
      </div>}
    </div>
  )
}

/** El marco con el borde que brilla en el color de la pantalla. */
export function Tablero({ acento = 'var(--tb-principal)', children }: { acento?: string; children: ReactNode }) {
  return <section className="tb" style={{ '--tb-acento': acento } as CSSProperties}>{children}</section>
}

export function Fila({ columnas = 4, children }: { columnas?: 2 | 3 | 4; children: ReactNode }) {
  return <div className={`tb-fila tb-fila-${columnas}`}>{children}</div>
}

export function Bloque({ titulo, nota, children, ancho }: { titulo?: string; nota?: string; children: ReactNode; ancho?: boolean }) {
  return (
    <div className={`tb-bloque${ancho ? ' tb-ancho' : ''}`}>
      {titulo && <h3 className="tb-h3">{titulo}{nota && <small>{nota}</small>}</h3>}
      {children}
    </div>
  )
}

/** Línea chiquita de tendencia, a escala, con el último punto marcado. */
export function Tendencia({ serie, color = 'var(--tb-acento)' }: { serie: number[]; color?: string }) {
  if (serie.length < 2) return null
  const w = 200, h = 34, max = Math.max(...serie, 1)
  const pts = serie.map((y, k) => [k * (w / (serie.length - 1)), h - 3 - (y / max) * (h - 8)])
  const linea = pts.map(p => p.join(',')).join(' ')
  const [ux, uy] = pts[pts.length - 1]
  return (
    <svg className="tb-mini" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polygon points={`0,${h} ${linea} ${w},${h}`} fill={color} opacity={0.16} />
      <polyline points={linea} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      <circle cx={ux} cy={uy} r={3} fill={color} />
    </svg>
  )
}

/** Tarjeta de número. bueno: true = subir es bueno · false = bajar es bueno · null = neutro (ej. el gasto). */
export function Kpi({ dato, valor, cambio = null, bueno = true, nota, serie, color, textoCambio }: {
  dato: string; valor: ReactNode; cambio?: number | null; bueno?: boolean | null; nota?: ReactNode
  serie?: number[]; color?: string; textoCambio?: string
}) {
  let clase = 'neutro', txt = textoCambio || ''
  if (cambio !== null && cambio !== undefined && Number.isFinite(cambio)) {
    const sube = cambio >= 0
    if (Math.abs(cambio) < 0.5) txt = textoCambio || '= igual que antes'   // sin cambio: ni verde ni rojo
    else {
      clase = bueno === null ? 'neutro' : sube === bueno ? 'bien' : 'mal'
      txt = textoCambio || `${sube ? '↑' : '↓'} ${pct(Math.abs(cambio))}`
    }
  }
  return (
    <div className="tb-bloque tb-kpi">
      <div className="tb-dato">{dato}</div>
      <div className="tb-numero" style={color ? { color } : undefined}>{valor}</div>
      {txt && <span className={`tb-cambio ${clase}`}>{txt}</span>}
      {nota && <div className="tb-nota">{nota}</div>}
      {serie && <Tendencia serie={serie} color={color} />}
    </div>
  )
}

/** Barras por día (escala izquierda) + línea opcional (escala derecha) + marca dorada en los días elegidos. */
export function GraficoDias({ etiquetas, barras, linea, marcas, formatoBarra = num, nombreBarra, nombreLinea, nombreMarca, mismaEscala }: {
  etiquetas: string[]; barras: number[]; linea?: number[]; marcas?: boolean[]
  /** true cuando barra y línea son de la misma unidad (ej. ingresos y egresos): una sola escala, nunca dos de plata */
  mismaEscala?: boolean
  formatoBarra?: (n: number) => string; nombreBarra: string; nombreLinea?: string; nombreMarca?: string
}) {
  const W = 640, H = 230, izq = 52, der = linea && !mismaEscala ? 40 : 12, arr = 16, aba = 28, aw = W - izq - der, ah = H - arr - aba
  const redondo = (m: number) => { const p = Math.pow(10, Math.floor(Math.log10(Math.max(m, 1)))); return Math.ceil(m / p) * p }
  // Con cantidades chicas (personas, clics) el tope mínimo es 4, para que el eje marque 0-1-2-3-4 y no «0, 0, 1, 1, 1»
  const entero = (l: number[]) => l.every(Number.isInteger)
  const maxB = Math.max(redondo(Math.max(...barras, ...(mismaEscala && linea ? linea : []), 1)), entero(barras) ? 4 : 0)
  const maxL = mismaEscala ? maxB : linea ? Math.max(redondo(Math.max(...linea, 1)), entero(linea) ? 2 : 0) : 1
  const paso = aw / Math.max(barras.length, 1), bw = Math.min(28, paso * 0.55)
  const yB = (v: number) => arr + ah - (v / maxB) * ah
  const yL = (v: number) => arr + ah - (v / maxL) * ah
  const ptsL = linea?.map((v, k) => [izq + k * paso + paso / 2, yL(v)]) || []
  const cadaCuanto = Math.ceil(etiquetas.length / 10)
  return (
    <div>
      <svg className="tb-grafico" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${nombreBarra}${nombreLinea ? ' y ' + nombreLinea : ''} por día`}>
        <defs><linearGradient id="tb-gb" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--tb-acento)" stopOpacity={0.95} /><stop offset="1" stopColor="var(--tb-acento)" stopOpacity={0.3} /></linearGradient></defs>
        {[0, .25, .5, .75, 1].map(f => <g key={f}>
          <line x1={izq} x2={W - der} y1={yB(maxB * f)} y2={yB(maxB * f)} stroke="var(--tb-borde)" strokeWidth={1} />
          <text x={izq - 8} y={yB(maxB * f) + 4} textAnchor="end" fontSize={11} fill="var(--tb-apagado)">{formatoBarra(maxB * f)}</text>
        </g>)}
        {linea && !mismaEscala && [0, .5, 1].map(f => <text key={f} x={W - der + 8} y={yL(maxL * f) + 4} fontSize={11} fill="var(--tb-violeta)">{num(maxL * f)}</text>)}
        {barras.map((v, k) => {
          const x = izq + k * paso + (paso - bw) / 2, h = (v / maxB) * ah
          return <g key={k}>
            <rect x={x} y={arr + ah - h} width={bw} height={Math.max(h, 0)} rx={Math.min(6, bw / 3)} fill="url(#tb-gb)" />
            {marcas?.[k] && <circle cx={x + bw / 2} cy={arr + ah - h - 10} r={5} fill="var(--tb-dorado)" />}
            {k % cadaCuanto === 0 && <text x={izq + k * paso + paso / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--tb-apagado)">{etiquetas[k]}</text>}
          </g>
        })}
        {linea && <polyline points={ptsL.map(p => p.join(',')).join(' ')} fill="none" stroke="var(--tb-violeta)" strokeWidth={2.5} />}
        {ptsL.map((p, k) => <circle key={k} cx={p[0]} cy={p[1]} r={k === ptsL.length - 1 ? 5 : 3.2} fill="var(--tb-violeta)" stroke="var(--tb-superficie)" strokeWidth={2} />)}
      </svg>
      <div className="tb-leyenda">
        <span><i style={{ background: 'var(--tb-acento)' }} />{nombreBarra}</span>
        {nombreLinea && <span><i style={{ background: 'var(--tb-violeta)' }} />{nombreLinea}</span>}
        {nombreMarca && <span><i style={{ background: 'var(--tb-dorado)' }} />{nombreMarca}</span>}
      </div>
    </div>
  )
}

/** Embudo en escalones; el ancho va con la raíz para que los pasos chicos se vean. corte = el paso donde se pierde la gente. */
export function Embudo({ pasos, corte, nota }: { pasos: [string, number][]; corte?: number; nota?: string }) {
  const colores = ['var(--tb-cian-claro)', 'var(--tb-cian)', 'var(--tb-violeta)', 'var(--tb-rosa)', 'var(--tb-error)', 'var(--tb-dorado)']
  const base = pasos[0]?.[1] || 1
  return (
    <div className="tb-embudo">
      {pasos.map(([nombre, n], k) => {
        const ancho = 46 + 54 * Math.sqrt(Math.max(n, 0) / base)
        const prev = k ? pasos[k - 1][1] : 0
        const txt = k === 0 ? '100 %' : prev ? pct((n / prev) * 100, 1) : '—'
        return <div key={nombre} className="tb-escalon">
          <div className="tb-peldano" style={{ width: `${ancho}%`, background: colores[k % colores.length] }}>{num(n)} <span>{nombre}</span></div>
          <div className={`tb-paso${k === corte ? ' corte' : ''}`}>{txt}</div>
        </div>
      })}
      {nota && <div className="tb-corte">{nota}</div>}
    </div>
  )
}

export type Alerta = { nivel: 'mal' | 'ojo' | 'bien'; titulo: string; texto?: string }
export function Alertas({ items, vacio = 'Nada para avisar.' }: { items: Alerta[]; vacio?: string }) {
  if (!items.length) return <div className="tb-vacio">{vacio}</div>
  return <div>{items.map(a => (
    <div key={a.titulo} className="tb-alerta">
      <div className={`tb-icono ${a.nivel}`} aria-hidden="true">{a.nivel === 'bien' ? '✓' : '!'}</div>
      <div><b>{a.titulo}</b>{a.texto && <p>{a.texto}</p>}</div>
    </div>
  ))}</div>
}

export type Meta = { nombre: string; valor: number; meta: number; texto?: string }
/** Barras de metas: verde si llega, amarillo si va por la mitad, rojo si está lejos. */
export function Metas({ items }: { items: Meta[] }) {
  return <div>{items.map(m => {
    const p = m.meta ? m.valor / m.meta : 0
    const color = p >= 1 ? 'var(--tb-ok)' : p >= 0.5 ? 'var(--tb-aviso)' : 'var(--tb-error)'
    return <div key={m.nombre} className="tb-meta">
      <div><span>{m.nombre}</span><b>{m.texto || `${num(m.valor)} / ${num(m.meta)}`}</b></div>
      <div className="tb-pista"><i style={{ width: `${Math.min(100, p * 100)}%`, background: color }} /></div>
    </div>
  })}</div>
}

/** Barras horizontales simples (rankings, clics por producto). */
export function Ranking({ items, formato = num }: { items: [string, number][]; formato?: (n: number) => string }) {
  const max = Math.max(1, ...items.map(i => i[1]))
  return <div className="tb-ranking">{items.map(([k, v]) => (
    <div key={k}><span>{k}</span><div className="tb-pista"><i style={{ width: `${(v / max) * 100}%`, background: 'var(--tb-acento)' }} /></div><b>{formato(v)}</b></div>
  ))}</div>
}

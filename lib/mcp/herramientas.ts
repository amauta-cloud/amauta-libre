// Lo que AMAUTA Libre le ofrece a Hermes (@nachito): las finanzas personales de Ignacio.
//
// Decisión de Ignacio (13/09/2026): AMAUTA Libre es donde registra TODO lo que le
// ingresa y lo que gasta, lo de los negocios (ventas de la Librería, ventas y bonos de
// Bienestar, pagos a proveedores) y lo de todos los días. Hermes copia acá lo que anota
// en los negocios y anota directo lo personal. Siempre en una categoría que ya existe en
// su cuenta: si no está claro cuál, pregunta mostrando la lista para que él elija.
//
// Escribe igual que la app (app/(app)/tablero/TablizableClient.tsx): un ítem en
// finanzas_items y el total del día recalculado en finanzas_diarias, conservando el
// ahorro 🐷. Todo filtrado por USUARIO_ID: nunca lee ni toca a otros usuarios.
//
// Respuestas: ✅ registrado (con lo releído) · ❓ pregunta concreta, nada escrito ·
// ⚠️ no se registró.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { USUARIO_ID } from './acceso'

export type Herramienta = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  run: (args: Record<string, unknown>) => Promise<string>
}

type Categoria = { nombre: string; emoji: string | null; orden: number | null; activo?: boolean | null }
type Item = { id: string; fecha: string; tipo: 'ingreso' | 'gasto'; monto: number; descripcion: string | null; categoria: string | null; creado_en: string }

const ERROR_INTERNO = 'error interno (queda en el log del servidor)'
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function db(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ─── Leer lo que manda Hermes ─────────────────────────────────────────────────

const texto = (v: unknown) => (v === undefined || v === null ? '' : String(v).trim())
const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const redondear = (n: number) => Math.round(n * 100) / 100
const hoyAR = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

function plata(n: number): string {
  const entero = Number.isInteger(redondear(n))
  return '$' + redondear(n).toLocaleString('es-AR', { minimumFractionDigits: entero ? 0 : 2, maximumFractionDigits: 2 })
}

function fechaLinda(iso: string): string {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

function sumarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** 27249.59 · "27.249,59" · "27249,59" · "$ 7.000" → número con centavos. */
function leerMonto(v: unknown, dudas: string[]): number | null {
  let n: number | null = null
  if (typeof v === 'number') {
    n = v
  } else {
    const s = texto(v).replace(/\$|\s/g, '')
    if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) n = Number(s.replace(/\./g, '').replace(',', '.'))
    else if (/^\d+,\d{1,2}$/.test(s)) n = Number(s.replace(',', '.'))
    else if (/^\d+(\.\d{1,2})?$/.test(s)) n = Number(s)
  }
  if (n === null || !Number.isFinite(n) || n <= 0) {
    dudas.push('¿De cuánto fue?')
    return null
  }
  return redondear(n)
}

/** Vacío o "hoy" = hoy · "ayer" · AAAA-MM-DD · DD/MM · DD/MM/AAAA. Nunca una fecha futura. */
function leerFecha(v: unknown, dudas: string[]): string | null {
  const s = sinTildes(texto(v))
  const hoy = hoyAR()
  let f: string | null = null
  if (!s || s === 'hoy') f = hoy
  else if (s === 'ayer') f = sumarDias(hoy, -1)
  else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) f = s
  else {
    const m = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/.exec(s)
    if (m) {
      const anio = m[3] ? (m[3].length === 2 ? `20${m[3]}` : m[3]) : hoy.slice(0, 4)
      f = `${anio}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
    }
  }
  // La fecha tiene que existir tal cual: 31/02 no se convierte en 03/03.
  if (!f || new Date(`${f}T12:00:00Z`).toISOString().slice(0, 10) !== f) {
    dudas.push(`¿Qué fecha? "${texto(v)}" no es una fecha válida.`)
    return null
  }
  if (f > hoy) {
    dudas.push(`El ${fechaLinda(f)} todavía no llegó: ¿qué fecha es?`)
    return null
  }
  return f
}

function leerTipo(v: unknown, dudas: string[]): 'ingreso' | 'gasto' | null {
  const s = sinTildes(texto(v))
  if (/^(ingreso|ingresos|entrada|cobro|cobre|venta|bono)$/.test(s)) return 'ingreso'
  if (/^(gasto|gastos|salida|pago|pague|compra|egreso)$/.test(s)) return 'gasto'
  dudas.push('¿Es un ingreso o un gasto?')
  return null
}

// ─── Categorías ───────────────────────────────────────────────────────────────

async function categorias(sb: SupabaseClient): Promise<Categoria[]> {
  const { data, error } = await sb
    .from('finanzas_categorias')
    .select('nombre, emoji, orden, activo')
    .eq('usuario_id', USUARIO_ID)
    .order('orden', { ascending: true })
  if (error) throw error
  return (data ?? []).filter(c => c.activo !== false) as Categoria[]
}

const conEmoji = (c: Categoria) => `${c.emoji ? c.emoji + ' ' : ''}${c.nombre}`
const palabras = (s: string) => sinTildes(s).replace(/[^a-z0-9ñ ]+/g, ' ').split(/\s+/).filter(w => w.length >= 3)

function listaCategorias(cats: Categoria[]): string {
  return cats.map((c, i) => `${i + 1}. ${conEmoji(c)}`).join('\n')
}

/**
 * La categoría tiene que ser una de las de Ignacio. Vale el nombre (sin importar
 * tildes ni mayúsculas), el número de la lista o una palabra que apunte a una sola
 * ("librería" → Amauta Libreria, "carla" → Casa Gastos con Carla). Si no, null.
 */
function elegirCategoria(pedido: string, cats: Categoria[]): Categoria | null {
  const q = sinTildes(pedido)
  if (!q) return null
  if (/^\d+$/.test(q)) return cats[Number(q) - 1] ?? null
  const exacta = cats.find(c => sinTildes(c.nombre) === q)
  if (exacta) return exacta
  const pq = palabras(pedido)
  if (!pq.length) return null
  const candidatas = cats.filter(c => {
    const pc = palabras(c.nombre)
    return pq.every(w => pc.some(x => x.startsWith(w) || w.startsWith(x)))
  })
  return candidatas.length === 1 ? candidatas[0] : null
}

// ─── Escribir como la app ─────────────────────────────────────────────────────

/** Recalcula el total del día en finanzas_diarias con los ítems que quedaron, sin tocar el ahorro. */
async function recalcularDia(sb: SupabaseClient, fecha: string): Promise<{ ingresos: number; gastos: number }> {
  const { data, error } = await sb.from('finanzas_items').select('tipo, monto').eq('usuario_id', USUARIO_ID).eq('fecha', fecha)
  if (error) throw error
  let ingresos = 0
  let gastos = 0
  for (const i of data ?? []) {
    if (i.tipo === 'ingreso') ingresos += Number(i.monto)
    else if (i.tipo === 'gasto') gastos += Number(i.monto)
  }
  ingresos = redondear(ingresos)
  gastos = redondear(gastos)
  const { data: dia, error: e1 } = await sb
    .from('finanzas_diarias').select('ahorro').eq('usuario_id', USUARIO_ID).eq('fecha', fecha).maybeSingle()
  if (e1) throw e1
  const { error: e2 } = await sb.from('finanzas_diarias').upsert(
    { usuario_id: USUARIO_ID, fecha, ingresos, gastos, ahorro: dia?.ahorro ?? false },
    { onConflict: 'usuario_id,fecha' },
  )
  if (e2) throw e2
  return { ingresos, gastos }
}

function preguntar(dudas: string[]): string {
  return dudas.length === 1 ? `❓ ${dudas[0]}` : '❓ No registré nada. Antes necesito saber:\n' + dudas.map((d, i) => `${i + 1}. ${d}`).join('\n')
}

// ─── Herramientas ─────────────────────────────────────────────────────────────

export const HERRAMIENTAS: Herramienta[] = [
  {
    name: 'libre_registrar',
    description: 'Anota DIRECTO un ingreso o un gasto en AMAUTA Libre, la app donde Ignacio registra TODAS sus finanzas. Usala (1) para copiar lo que anotaste en la Librería o en Bienestar y mueve plata (venta cobrada, bono, cobro de deuda, pago a proveedor, gasto, compra pagada), con la categoría de ese negocio, y (2) para cualquier ingreso o gasto de Ignacio que te cuente. La categoría tiene que ser una de las suyas: si no está claro cuál, devuelve ❓ con la lista numerada para que Ignacio elija. Devuelve ✅ con el total del día releído y el id para deshacerlo con libre_anular.',
    inputSchema: {
      type: 'object',
      properties: {
        tipo: { type: 'string', enum: ['ingreso', 'gasto'] },
        monto: { type: 'string', description: 'En pesos: 7000, "27.249,59" o 27249.59' },
        categoria: { type: 'string', description: 'Una de las categorías de Ignacio (libre_categorias), por nombre o por número de la lista. Librería → "Amauta Libreria"; Bienestar → "Amauta Bienestar".' },
        descripcion: { type: 'string', description: 'Corta, como la escribe Ignacio: qué, canal, medio y quién. Ej. "Bodas de sangre Facebook efectivo Evelyn", "Bono desempeño agosto 300 puntos". Sin explicaciones.' },
        fecha: { type: 'string', description: 'AAAA-MM-DD, DD/MM o "ayer". Por defecto hoy. La del movimiento real (si copiás una venta de ayer, ayer).' },
        repetir: { type: 'boolean', description: 'Solo si te avisé que parecía repetido e Ignacio dice que es otro movimiento' },
      },
      required: ['tipo', 'monto', 'categoria'],
    },
    async run(args) {
      const dudas: string[] = []
      let tipo = leerTipo(args.tipo, dudas)
      const monto = leerMonto(args.monto, dudas)
      const fecha = leerFecha(args.fecha, dudas)
      const descripcion = texto(args.descripcion).replace(/\s+/g, ' ').slice(0, 140) || null
      let sb: SupabaseClient
      let cats: Categoria[]
      try {
        sb = db()
        cats = await categorias(sb)
      } catch (e) {
        console.error('[mcp libre] categorias', e)
        return `⚠️ NO SE REGISTRÓ: ${ERROR_INTERNO}`
      }
      const cat = elegirCategoria(texto(args.categoria), cats)
      if (!cat) {
        const dijo = texto(args.categoria)
        dudas.push(`${dijo ? `"${dijo}" no es una de tus categorías. ` : ''}¿En cuál lo anoto?\n${listaCategorias(cats)}`)
      }
      if (dudas.length || !tipo || monto === null || !fecha || !cat) return preguntar(dudas)

      // Igual que la app: lo que va a Inversión es plata que sale.
      const avisos: string[] = []
      if (sinTildes(cat.nombre) === 'inversion' && tipo !== 'gasto') {
        tipo = 'gasto'
        avisos.push('Inversión se anota siempre como gasto, igual que en la app.')
      }

      try {
        if (args.repetir !== true && texto(args.repetir) !== 'true') {
          const hace10 = new Date(Date.now() - 10 * 60_000).toISOString()
          const { data: iguales, error } = await sb
            .from('finanzas_items').select('id, monto, descripcion')
            .eq('usuario_id', USUARIO_ID).eq('fecha', fecha).eq('tipo', tipo).eq('categoria', cat.nombre).gte('creado_en', hace10)
          if (error) throw error
          const igual = (iguales ?? []).find(i => Math.abs(Number(i.monto) - monto) < 0.005 &&
            sinTildes(i.descripcion ?? '') === sinTildes(descripcion ?? ''))
          if (igual) {
            return `❓ Esto mismo ya lo anoté hace menos de 10 minutos (id ${igual.id}). No lo cargo de nuevo. Si de verdad es otro movimiento, volvé a llamar con repetir: true.`
          }
        }
        const { data: item, error } = await sb.from('finanzas_items')
          .insert({ usuario_id: USUARIO_ID, fecha, tipo, monto, descripcion, categoria: cat.nombre })
          .select('id').single()
        if (error) throw error

        // Ya quedó anotado: de acá en adelante nada puede decir "NO SE REGISTRÓ".
        let releido: string
        try {
          const dia = await recalcularDia(sb, fecha)
          releido = `✔️ Releído: el ${fechaLinda(fecha)} suma ingresos ${plata(dia.ingresos)} · gastos ${plata(dia.gastos)}`
        } catch (e) {
          console.error('[mcp libre] recalcular', e)
          releido = '🔸 Quedó anotado, pero no pude actualizar el total del día: abrí ese día en el tablero para que se recalcule.'
        }
        return [
          `✅ REGISTRADO EN AMAUTA LIBRE — ${tipo === 'ingreso' ? 'INGRESO' : 'GASTO'} · ${conEmoji(cat)} · ${plata(monto)}`,
          `   ${descripcion ? descripcion + ' · ' : ''}${fechaLinda(fecha)}`,
          ...avisos.map(a => `🔸 ${a}`),
          releido,
          `Para deshacerlo: libre_anular con id ${item.id}`,
        ].join('\n')
      } catch (e) {
        console.error('[mcp libre] registrar', e)
        return `⚠️ NO SE REGISTRÓ: ${ERROR_INTERNO}`
      }
    },
  },
  {
    name: 'libre_categorias',
    description: 'Lista numerada de las categorías de finanzas de Ignacio en AMAUTA Libre. Mostrásela cuando no esté claro dónde va un ingreso o un gasto, para que él elija.',
    inputSchema: { type: 'object', properties: {} },
    async run() {
      try {
        const cats = await categorias(db())
        return cats.length ? `Tus categorías en AMAUTA Libre:\n${listaCategorias(cats)}` : 'No hay categorías cargadas en AMAUTA Libre.'
      } catch (e) {
        console.error('[mcp libre] categorias', e)
        return `⚠️ No pude leer las categorías: ${ERROR_INTERNO}`
      }
    },
  },
  {
    name: 'libre_movimientos',
    description: 'Últimos ingresos y gastos anotados en AMAUTA Libre, con su id (sirve para anular). No registra nada.',
    inputSchema: {
      type: 'object',
      properties: {
        dias: { type: 'integer', description: 'Cuántos días para atrás, de 1 a 31. Por defecto 7.' },
        categoria: { type: 'string', description: 'Opcional: solo esa categoría' },
      },
    },
    async run(args) {
      try {
        const sb = db()
        const dias = Math.min(31, Math.max(1, Math.round(Number(args.dias) || 7)))
        const desde = sumarDias(hoyAR(), -(dias - 1))
        let q = sb.from('finanzas_items').select('id, fecha, tipo, monto, descripcion, categoria, creado_en')
          .eq('usuario_id', USUARIO_ID).gte('fecha', desde)
        if (texto(args.categoria)) {
          const cat = elegirCategoria(texto(args.categoria), await categorias(sb))
          if (!cat) return `❓ "${texto(args.categoria)}" no es una de tus categorías.`
          q = q.eq('categoria', cat.nombre)
        }
        const { data, error } = await q.order('fecha', { ascending: false }).order('creado_en', { ascending: false }).limit(30)
        if (error) throw error
        const items = (data ?? []) as Item[]
        if (!items.length) return `No hay movimientos en los últimos ${dias} días.`
        return items.map(i => `${fechaLinda(i.fecha)} · ${i.tipo === 'ingreso' ? '➕' : '➖'} ${plata(Number(i.monto))} · ${i.categoria ?? 'sin categoría'}${i.descripcion ? ' · ' + i.descripcion : ''} · id ${i.id}`).join('\n')
      } catch (e) {
        console.error('[mcp libre] movimientos', e)
        return `⚠️ No pude leer los movimientos: ${ERROR_INTERNO}`
      }
    },
  },
  {
    name: 'libre_resumen',
    description: 'Resumen de las finanzas de Ignacio en AMAUTA Libre: ingresos, gastos y resultado de un período, con el detalle por categoría. No registra nada.',
    inputSchema: {
      type: 'object',
      properties: { periodo: { type: 'string', enum: ['hoy', 'ayer', 'semana', 'mes'], description: 'Por defecto hoy. Semana = últimos 7 días; mes = desde el 1 del mes.' } },
    },
    async run(args) {
      try {
        const hoy = hoyAR()
        const periodo = texto(args.periodo) || 'hoy'
        const [desde, hasta, etiqueta] =
          periodo === 'ayer' ? [sumarDias(hoy, -1), sumarDias(hoy, -1), 'ayer']
            : periodo === 'semana' ? [sumarDias(hoy, -6), hoy, 'los últimos 7 días']
              : periodo === 'mes' ? [`${hoy.slice(0, 8)}01`, hoy, `${MESES[Number(hoy.slice(5, 7)) - 1]}`]
                : [hoy, hoy, 'hoy']
        const { data, error } = await db().from('finanzas_items').select('tipo, monto, categoria')
          .eq('usuario_id', USUARIO_ID).gte('fecha', desde).lte('fecha', hasta)
        if (error) throw error
        let ingresos = 0
        let gastos = 0
        const porCat = new Map<string, { ingresos: number; gastos: number }>()
        for (const i of data ?? []) {
          const m = Number(i.monto)
          const c = porCat.get(i.categoria ?? 'Sin categoría') ?? { ingresos: 0, gastos: 0 }
          if (i.tipo === 'ingreso') { ingresos += m; c.ingresos += m } else { gastos += m; c.gastos += m }
          porCat.set(i.categoria ?? 'Sin categoría', c)
        }
        const lineas = [...porCat.entries()]
          .sort((a, b) => (b[1].ingresos + b[1].gastos) - (a[1].ingresos + a[1].gastos))
          .map(([nombre, v]) => `   • ${nombre}: ${v.ingresos ? `+${plata(v.ingresos)}` : ''}${v.ingresos && v.gastos ? ' · ' : ''}${v.gastos ? `−${plata(v.gastos)}` : ''}`)
        return [
          `AMAUTA Libre — ${etiqueta}`,
          `Ingresos ${plata(ingresos)} · Gastos ${plata(gastos)} · Resultado ${ingresos - gastos < 0 ? '−' : ''}${plata(Math.abs(ingresos - gastos))}`,
          ...(lineas.length ? ['Por categoría:', ...lineas] : ['Sin movimientos.']),
        ].join('\n')
      } catch (e) {
        console.error('[mcp libre] resumen', e)
        return `⚠️ No pude armar el resumen: ${ERROR_INTERNO}`
      }
    },
  },
  {
    name: 'libre_anular',
    description: 'Borra un ingreso o gasto de AMAUTA Libre con el id del informe (o de libre_movimientos) y recalcula el total de ese día. Usalo cuando Ignacio dice que algo quedó mal o cuando anulaste lo mismo en la Librería o en Bienestar.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'El id del movimiento' } },
      required: ['id'],
    },
    async run(args) {
      const id = texto(args.id)
      if (!/^[0-9a-f-]{36}$/i.test(id)) return '❓ Pasame el id completo que figura en el informe.'
      try {
        const sb = db()
        const { data: item, error } = await sb.from('finanzas_items')
          .select('id, fecha, tipo, monto, descripcion, categoria').eq('usuario_id', USUARIO_ID).eq('id', id).maybeSingle()
        if (error) throw error
        if (!item) return '⚠️ NO SE ANULÓ: no encontré ese movimiento en tu cuenta.'
        const { error: e2 } = await sb.from('finanzas_items').delete().eq('usuario_id', USUARIO_ID).eq('id', id)
        if (e2) throw e2
        let releido: string
        try {
          const dia = await recalcularDia(sb, item.fecha)
          releido = `✔️ Releído: el ${fechaLinda(item.fecha)} queda con ingresos ${plata(dia.ingresos)} · gastos ${plata(dia.gastos)}`
        } catch (e) {
          console.error('[mcp libre] recalcular al anular', e)
          releido = '🔸 Se borró, pero no pude actualizar el total del día: abrí ese día en el tablero.'
        }
        return [
          `↩️ ANULADO EN AMAUTA LIBRE — ${item.tipo === 'ingreso' ? 'INGRESO' : 'GASTO'} · ${item.categoria ?? 'sin categoría'} · ${plata(Number(item.monto))}`,
          `   ${item.descripcion ? item.descripcion + ' · ' : ''}${fechaLinda(item.fecha)}`,
          releido,
        ].join('\n')
      } catch (e) {
        console.error('[mcp libre] anular', e)
        return `⚠️ NO SE ANULÓ: ${ERROR_INTERNO}`
      }
    },
  },
]

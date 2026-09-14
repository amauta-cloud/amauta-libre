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
  // Primero palabras enteras: "libreria" es Amauta Libreria y "libre" es Amauta Libre.
  // Con prefijos solos, "libreria" empieza con "libre" y chocaba con las dos.
  const enteras = cats.filter(c => pq.every(w => palabras(c.nombre).includes(w)))
  if (enteras.length === 1) return enteras[0]
  if (enteras.length > 1) return null
  const porPrefijo = cats.filter(c => {
    const pc = palabras(c.nombre)
    return pq.every(w => pc.some(x => x.startsWith(w) || w.startsWith(x)))
  })
  return porPrefijo.length === 1 ? porPrefijo[0] : null
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
  // Un día que queda sin movimientos y sin ahorro marcado no es un día con finanzas: se
  // borra la fila en vez de dejarla en cero (si no, al anular lo único cargado quedaba
  // contando como día registrado).
  if (ingresos === 0 && gastos === 0 && !dia?.ahorro) {
    const { error: e3 } = await sb.from('finanzas_diarias').delete().eq('usuario_id', USUARIO_ID).eq('fecha', fecha)
    if (e3) throw e3
    return { ingresos, gastos }
  }
  const { error: e2 } = await sb.from('finanzas_diarias').upsert(
    { usuario_id: USUARIO_ID, fecha, ingresos, gastos, ahorro: dia?.ahorro ?? false },
    { onConflict: 'usuario_id,fecha' },
  )
  if (e2) throw e2
  return { ingresos, gastos }
}

/**
 * Un movimiento igual ese mismo día (mismo tipo, categoría y monto), cargado a cualquier
 * hora, por Hermes o a mano en el tablero. El 13/09/2026 Hermes copió una venta del día
 * anterior sin ver que ya estaba: mirar solo los últimos 10 minutos no alcanza.
 */
async function igualEseDia(
  sb: SupabaseClient, fecha: string, tipo: 'ingreso' | 'gasto', categoria: string, monto: number,
): Promise<{ id: string; descripcion: string | null; fecha: string } | null> {
  // Lo de los negocios (categorías Amauta…) se controla 7 días para cada lado: Ignacio a veces anota
  // la venta a mano en Libre y después se la cuenta a Hermes (decisión del 14/09/2026). Lo personal,
  // solo el mismo día: un gasto igual en la semana (la misma nafta, el mismo café) es normal.
  const semana = categoria.toLowerCase().startsWith('amauta')
  const { data, error } = await sb.from('finanzas_items').select('id, monto, descripcion, fecha')
    .eq('usuario_id', USUARIO_ID).gte('fecha', semana ? sumarDias(fecha, -7) : fecha).lte('fecha', semana ? sumarDias(fecha, 7) : fecha)
    .eq('tipo', tipo).eq('categoria', categoria)
  if (error) throw error
  return ((data ?? []) as { id: string; monto: number; descripcion: string | null; fecha: string }[])
    .find(i => Math.abs(Number(i.monto) - monto) < 0.005) ?? null
}

const yaEsta = (tipo: string, cat: Categoria, monto: number, fecha: string, igual: { id: string; descripcion: string | null; fecha?: string }) =>
  `❓ Ya hay un ${tipo} igual el ${fechaLinda(igual.fecha ?? fecha)}: ${conEmoji(cat)} · ${plata(monto)}${igual.descripcion ? ` · ${igual.descripcion}` : ''} (id ${igual.id}). ` +
  'No lo cargo de nuevo. Si de verdad es otro, volvé a llamar con repetir: true.'

function preguntar(dudas: string[]): string {
  return dudas.length === 1 ? `❓ ${dudas[0]}` : '❓ No registré nada. Antes necesito saber:\n' + dudas.map((d, i) => `${i + 1}. ${d}`).join('\n')
}

// ─── Herramientas ─────────────────────────────────────────────────────────────

export const HERRAMIENTAS: Herramienta[] = [
  {
    name: 'libre_registrar',
    description: 'Anota DIRECTO un ingreso o un gasto en AMAUTA Libre, la app donde Ignacio registra TODAS sus finanzas. Usala (1) para copiar lo que anotaste en la Librería o en Bienestar y mueve plata (venta cobrada, bono, cobro de deuda, pago a proveedor, gasto, compra pagada), con la categoría de ese negocio, y (2) para cualquier ingreso o gasto de Ignacio que te cuente. La categoría tiene que ser una de las suyas: si no está claro cuál, devuelve ❓ con la lista numerada para que Ignacio elija. Devuelve ✅ con el total del día releído y el id para deshacerlo con libre_anular. Si lo pagó con la tarjeta de crédito apalancándose (transferencia con tarjeta de Mercado Pago), usá libre_pago_con_tarjeta.',
    inputSchema: {
      type: 'object',
      properties: {
        tipo: { type: 'string', enum: ['ingreso', 'gasto'] },
        monto: { type: 'string', description: 'En pesos: 7000, "27.249,59" o 27249.59' },
        categoria: { type: 'string', description: 'Una de las categorías de Ignacio (libre_categorias), por nombre o por número de la lista. Librería → "Amauta Libreria"; Bienestar → "Amauta Bienestar".' },
        descripcion: { type: 'string', description: 'Corta, como la escribe Ignacio: qué, canal, medio y quién. Ej. "Bodas de sangre Facebook efectivo Evelyn", "Bono desempeño agosto 300 puntos". Sin explicaciones.' },
        fecha: { type: 'string', description: 'AAAA-MM-DD, DD/MM o "ayer". Por defecto hoy. La del movimiento real (si copiás una venta de ayer, ayer).' },
        repetir: { type: 'boolean', description: 'Solo si te avisé que ya había uno igual ese día e Ignacio dice que es otro movimiento' },
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
          const igual = await igualEseDia(sb, fecha, tipo, cat.nombre, monto)
          if (igual) return yaEsta(tipo, cat, monto, fecha, igual)
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
    name: 'libre_pago_con_tarjeta',
    description: 'Anota DIRECTO un pago apalancado con la tarjeta de crédito (por ejemplo "transferir con tarjeta" de Mercado Pago, que cobra 6,99% + IVA de interés en la tarjeta). Carga los dos movimientos como los lleva Ignacio: un INGRESO en Tarjeta de Crédito (la plata que pone la tarjeta) y un GASTO por lo que se pagó, en su categoría, por el mismo monto. El interés no se anota aparte (se paga con el resumen de la tarjeta), pero el informe dice cuánto cuesta. Si no está clara la categoría del pago, devuelve ❓ con la lista. Devuelve ✅ con el día releído y los dos id para deshacerlo con libre_anular.',
    inputSchema: {
      type: 'object',
      properties: {
        monto: { type: 'string', description: 'Lo que se transfirió o pagó, sin el interés: 15000 o "15.000"' },
        categoria: { type: 'string', description: 'La categoría de lo que se pagó (una de las de Ignacio), por nombre o número. No "Tarjeta de Crédito": esa la pone la herramienta.' },
        descripcion: { type: 'string', description: 'Qué se pagó y a quién, corto: "Empanadas", "Alquiler a Juan". Sin explicaciones.' },
        fecha: { type: 'string', description: 'AAAA-MM-DD, DD/MM o "ayer". Por defecto hoy.' },
        interes: { type: 'string', description: 'Porcentaje de interés sin IVA. Por defecto 6,99 (Mercado Pago).' },
        repetir: { type: 'boolean', description: 'Solo si te avisé que parecía repetido e Ignacio dice que es otro pago' },
      },
      required: ['monto', 'categoria'],
    },
    async run(args) {
      const dudas: string[] = []
      const monto = leerMonto(args.monto, dudas)
      const fecha = leerFecha(args.fecha, dudas)
      const descripcion = texto(args.descripcion).replace(/\s+/g, ' ').slice(0, 120) || null
      const interesTexto = texto(args.interes).replace('%', '').replace(',', '.')
      const interes = interesTexto ? Number(interesTexto) : 6.99
      if (!Number.isFinite(interes) || interes < 0 || interes > 100) dudas.push(`¿Qué interés cobra? "${texto(args.interes)}" no es un porcentaje válido.`)
      let sb: SupabaseClient
      let cats: Categoria[]
      try {
        sb = db()
        cats = await categorias(sb)
      } catch (e) {
        console.error('[mcp libre] categorias', e)
        return `⚠️ NO SE REGISTRÓ: ${ERROR_INTERNO}`
      }
      const tarjeta = cats.find(c => sinTildes(c.nombre).startsWith('tarjeta de credito')) ?? null
      if (!tarjeta) dudas.push(`No encontré la categoría "Tarjeta de Crédito" en tu cuenta. ¿En cuál anoto la plata que puso la tarjeta?\n${listaCategorias(cats)}`)
      const cat = elegirCategoria(texto(args.categoria), cats)
      if (!cat) {
        const dijo = texto(args.categoria)
        dudas.push(`${dijo ? `"${dijo}" no es una de tus categorías. ` : ''}¿En qué categoría va lo que pagaste?\n${listaCategorias(cats)}`)
      } else if (tarjeta && cat.nombre === tarjeta.nombre) {
        dudas.push('Lo que pagaste no va en Tarjeta de Crédito (esa es la plata que pone la tarjeta): ¿qué pagaste y en qué categoría va?')
      }
      if (dudas.length || monto === null || !fecha || !cat || !tarjeta) return preguntar(dudas)

      try {
        if (args.repetir !== true && texto(args.repetir) !== 'true') {
          const igual = await igualEseDia(sb, fecha, 'gasto', cat.nombre, monto)
          if (igual) return yaEsta('gasto', cat, monto, fecha, igual)
        }
        // Los dos movimientos en un solo insert: entran los dos o ninguno.
        const { data: filas, error } = await sb.from('finanzas_items').insert([
          { usuario_id: USUARIO_ID, fecha, tipo: 'ingreso', monto, descripcion: `${descripcion ?? cat.nombre} · con tarjeta`, categoria: tarjeta.nombre },
          { usuario_id: USUARIO_ID, fecha, tipo: 'gasto', monto, descripcion, categoria: cat.nombre },
        ]).select('id, tipo')
        if (error) throw error

        // Ya quedó anotado: de acá en adelante nada puede decir "NO SE REGISTRÓ".
        const ids = (filas ?? []).map(f => f.id).join(', ')
        const costo = redondear(monto * (interes / 100) * 1.21)
        let releido: string
        try {
          const dia = await recalcularDia(sb, fecha)
          releido = `✔️ Releído: el ${fechaLinda(fecha)} suma ingresos ${plata(dia.ingresos)} · gastos ${plata(dia.gastos)}`
        } catch (e) {
          console.error('[mcp libre] recalcular', e)
          releido = '🔸 Quedó anotado, pero no pude actualizar el total del día: abrí ese día en el tablero para que se recalcule.'
        }
        return [
          `✅ REGISTRADO EN AMAUTA LIBRE — PAGO CON TARJETA · ${plata(monto)}`,
          `   • INGRESO · ${conEmoji(tarjeta)} · ${plata(monto)}`,
          `   • GASTO · ${conEmoji(cat)} · ${plata(monto)}${descripcion ? ' · ' + descripcion : ''}`,
          `   ${fechaLinda(fecha)} · Costo del préstamo: ${plata(costo)} (${String(interes).replace('.', ',')}% + IVA), se paga con el resumen de la tarjeta.`,
          releido,
          `Para deshacerlo: libre_anular con id ${ids}`,
        ].join('\n')
      } catch (e) {
        console.error('[mcp libre] pago con tarjeta', e)
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
    description: 'Últimos ingresos y gastos anotados en AMAUTA Libre (por Hermes o a mano), con su id. Sirve para revisar antes de anotar y para anular. Sin categoría busca en todas. No registra nada.',
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
        let filtro = ''
        if (texto(args.categoria)) {
          const cat = elegirCategoria(texto(args.categoria), await categorias(sb))
          if (!cat) return `❓ "${texto(args.categoria)}" no es una de tus categorías.`
          q = q.eq('categoria', cat.nombre)
          filtro = ` de ${cat.nombre}`
        }
        const { data, error } = await q.order('fecha', { ascending: false }).order('creado_en', { ascending: false }).limit(30)
        if (error) throw error
        const items = (data ?? []) as Item[]
        // Si se filtró por categoría, que se lea: "no hay de Amauta Libreria" no es "no hay nada".
        if (!items.length) return `No hay movimientos${filtro} en los últimos ${dias} días${filtro ? ' (solo busqué en esa categoría)' : ''}.`
        return (filtro ? `Movimientos${filtro} de los últimos ${dias} días:\n` : '') + items.map(i => `${fechaLinda(i.fecha)} · ${i.tipo === 'ingreso' ? '➕' : '➖'} ${plata(Number(i.monto))} · ${i.categoria ?? 'sin categoría'}${i.descripcion ? ' · ' + i.descripcion : ''} · id ${i.id}`).join('\n')
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
    name: 'libre_reporte',
    description: 'Ingresos y gastos de AMAUTA Libre entre dos fechas, con el resultado y el detalle por categoría (por ejemplo "¿cuánto gasté en Ocio en agosto?" o "¿cuánto usé la tarjeta este mes?"). No registra nada.',
    inputSchema: {
      type: 'object',
      properties: {
        desde: { type: 'string', description: 'hoy · ayer · AAAA-MM-DD · DD/MM. Por defecto hoy.' },
        hasta: { type: 'string', description: 'Igual que desde. Por defecto el mismo día que desde.' },
        categoria: { type: 'string', description: 'Opcional: solo esa categoría' },
        formato: { type: 'string', enum: ['texto', 'datos'], description: 'texto (por defecto). datos devuelve JSON: lo usan los avisos programados.' },
      },
    },
    async run(args) {
      const dudas: string[] = []
      const desde = leerFecha(args.desde, dudas)
      const hasta = texto(args.hasta) ? leerFecha(args.hasta, dudas) : desde
      if (!desde || !hasta) return preguntar(dudas)
      if (hasta < desde) return `❓ "hasta" (${fechaLinda(hasta)}) es anterior a "desde" (${fechaLinda(desde)}). ¿Qué período querés?`
      try {
        const sb = db()
        let filtro: string | null = null
        if (texto(args.categoria)) {
          const cat = elegirCategoria(texto(args.categoria), await categorias(sb))
          if (!cat) return `❓ "${texto(args.categoria)}" no es una de tus categorías.`
          filtro = cat.nombre
        }
        const items: Item[] = []
        // De a 1000 filas (el tope de Supabase por pedido); 20 páginas alcanzan para años.
        for (let pagina = 0; pagina < 20; pagina++) {
          let q = sb.from('finanzas_items').select('id, fecha, tipo, monto, descripcion, categoria, creado_en')
            .eq('usuario_id', USUARIO_ID).gte('fecha', desde).lte('fecha', hasta)
          if (filtro) q = q.eq('categoria', filtro)
          const { data, error } = await q.order('fecha', { ascending: true }).order('creado_en', { ascending: true })
            .range(pagina * 1000, pagina * 1000 + 999)
          if (error) throw error
          const filas = (data ?? []) as Item[]
          items.push(...filas.map(i => ({ ...i, monto: Number(i.monto) })))
          if (filas.length < 1000) break
        }
        let ingresos = 0
        let gastos = 0
        const porCategoria: Record<string, { ingresos: number; gastos: number }> = {}
        for (const i of items) {
          const c = (porCategoria[i.categoria ?? 'Sin categoría'] ??= { ingresos: 0, gastos: 0 })
          if (i.tipo === 'ingreso') { ingresos += i.monto; c.ingresos = redondear(c.ingresos + i.monto) } else { gastos += i.monto; c.gastos = redondear(c.gastos + i.monto) }
        }
        const r = {
          desde, hasta, categoria: filtro, ingresos: redondear(ingresos), gastos: redondear(gastos),
          resultado: redondear(ingresos - gastos), porCategoria, items,
        }
        if (texto(args.formato) === 'datos') return JSON.stringify(r)
        const lineas = Object.entries(porCategoria)
          .sort((a, b) => (b[1].ingresos + b[1].gastos) - (a[1].ingresos + a[1].gastos))
          .map(([nombre, v]) => `   • ${nombre}: ${v.ingresos ? `+${plata(v.ingresos)}` : ''}${v.ingresos && v.gastos ? ' · ' : ''}${v.gastos ? `−${plata(v.gastos)}` : ''}`)
        const periodo = desde === hasta ? fechaLinda(desde) : `del ${fechaLinda(desde)} al ${fechaLinda(hasta)}`
        return [
          `AMAUTA Libre — ${periodo}${filtro ? ` · solo ${filtro}` : ''}`,
          `Ingresos ${plata(r.ingresos)} · Gastos ${plata(r.gastos)} · Resultado ${r.resultado < 0 ? '−' : ''}${plata(Math.abs(r.resultado))}`,
          ...(lineas.length ? ['Por categoría:', ...lineas] : ['Sin movimientos.']),
        ].join('\n')
      } catch (e) {
        console.error('[mcp libre] reporte', e)
        return `⚠️ No pude armar el reporte: ${ERROR_INTERNO}`
      }
    },
  },
  {
    name: 'libre_anular',
    description: 'Borra uno o varios ingresos o gastos de AMAUTA Libre con los id del informe (o de libre_movimientos) y recalcula el total de esos días. Usalo cuando Ignacio dice que algo quedó mal o cuando anulaste lo mismo en la Librería o en Bienestar. Un pago con tarjeta tiene dos id: anulá los dos.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Uno o varios id separados por coma' } },
      required: ['id'],
    },
    async run(args) {
      const ids = [...new Set(texto(args.id).split(/[\s,;]+/).filter(Boolean))]
      if (!ids.length || ids.some(i => !/^[0-9a-f-]{36}$/i.test(i))) return '❓ Pasame el id completo que figura en el informe (si son varios, separados por coma).'
      try {
        const sb = db()
        const { data: items, error } = await sb.from('finanzas_items')
          .select('id, fecha, tipo, monto, descripcion, categoria').eq('usuario_id', USUARIO_ID).in('id', ids)
        if (error) throw error
        if (!items?.length) return '⚠️ NO SE ANULÓ: no encontré esos movimientos en tu cuenta.'
        const { error: e2 } = await sb.from('finanzas_items').delete().eq('usuario_id', USUARIO_ID).in('id', items.map(i => i.id))
        if (e2) throw e2
        const lineas = items.map(i =>
          `   • ${i.tipo === 'ingreso' ? 'INGRESO' : 'GASTO'} · ${i.categoria ?? 'sin categoría'} · ${plata(Number(i.monto))}${i.descripcion ? ' · ' + i.descripcion : ''} · ${fechaLinda(i.fecha)}`)
        const faltan = ids.filter(i => !items.some(x => x.id === i))
        const releidos: string[] = []
        for (const fecha of [...new Set(items.map(i => i.fecha))]) {
          try {
            const dia = await recalcularDia(sb, fecha)
            releidos.push(`✔️ Releído: el ${fechaLinda(fecha)} queda con ingresos ${plata(dia.ingresos)} · gastos ${plata(dia.gastos)}`)
          } catch (e) {
            console.error('[mcp libre] recalcular al anular', e)
            releidos.push(`🔸 Se borró, pero no pude actualizar el total del ${fechaLinda(fecha)}: abrí ese día en el tablero.`)
          }
        }
        return [
          `↩️ ANULADO EN AMAUTA LIBRE — ${items.length} movimiento${items.length > 1 ? 's' : ''}`,
          ...lineas,
          ...(faltan.length ? [`🔸 No encontré: ${faltan.join(', ')}`] : []),
          ...releidos,
        ].join('\n')
      } catch (e) {
        console.error('[mcp libre] anular', e)
        return `⚠️ NO SE ANULÓ: ${ERROR_INTERNO}`
      }
    },
  },
]

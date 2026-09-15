// Los hábitos de Ignacio en AMAUTA Libre, para que Hermes (@nachito) le lleve la rutina diaria.
//
// Decisión de Ignacio (15/09/2026): no quiere entrar a la app para marcar. Le cuenta a Nachito lo que
// hizo y Nachito lo marca acá; también crea, renombra, pausa y reactiva hábitos cuando se lo pide, sin
// preguntar cada vez. Lo que marca Nachito se ve igual en la app y lo que marca a mano lo ve Nachito.
//
// Escribe igual que la app (app/(app)/tablero/TablizableClient.tsx): un registro por hábito y día en
// habito_registros (upsert por habito_id,fecha) y el hábito en habitos. Pausar es activo=false, lo mismo
// que "eliminar" en la app: el historial queda. Nada se borra. Las categorías de hábitos son las fijas
// de la app (CATEGORIAS en TablizableClient.tsx). Todo filtrado por USUARIO_ID.
//
// Respuestas: ✅ hecho (con lo releído) · ❓ pregunta concreta · ⚠️ no se hizo.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { USUARIO_ID } from './acceso'
import type { Herramienta } from './herramientas'

type Habito = {
  id: string
  nombre: string
  emoji: string | null
  tipo: string
  unidad: string | null
  meta_numero: number | null
  orden: number | null
  activo: boolean | null
  categoria: string | null
  dias_semana: number[] | null
  creado_en: string
}
type Registro = { habito_id: string; fecha: string; valor_bool: boolean | null; valor_numero: number | null; nota: string | null }
type Categoria = { id: string | null; nombre: string }

const ERROR_INTERNO = 'error interno (queda en el log del servidor)'
// En el orden de getUTCDay(), que es el que guarda dias_semana la app.
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const CATEGORIAS: Record<string, Categoria> = {
  general: { id: null, nombre: 'General' },
  salud: { id: 'salud', nombre: '💪 Salud' },
  mente: { id: 'mente', nombre: '🧠 Mente' },
  dinero: { id: 'dinero', nombre: '💰 Dinero' },
  aprender: { id: 'aprender', nombre: '📚 Aprender' },
  social: { id: 'social', nombre: '👥 Social' },
}
const SINONIMOS: Record<string, string> = {
  plata: 'dinero', trabajo: 'dinero', negocio: 'dinero', negocios: 'dinero', finanzas: 'dinero',
  cuerpo: 'salud', espiritu: 'mente', espiritualidad: 'mente', estudio: 'aprender', aprendizaje: 'aprender',
  familia: 'social', vinculos: 'social', 'sin categoria': 'general',
}
// Palabras que Ignacio dice alrededor del nombre y no ayudan a encontrar el hábito.
const RELLENO = new Set(['los', 'las', 'del', 'con', 'por', 'para', 'una', 'uno', 'unos', 'unas', 'que', 'hice', 'hecho', 'hecha',
  'marca', 'marcar', 'habito', 'habitos', 'mis', 'tus', 'hoy', 'ayer'])

function db(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ─── Leer lo que manda Hermes ─────────────────────────────────────────────────

const texto = (v: unknown) => (v === undefined || v === null ? '' : String(v).trim())
const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const siEs = (v: unknown) => v === true || texto(v).toLowerCase() === 'true'
const noEs = (v: unknown) => v === false || texto(v).toLowerCase() === 'false'
const hoyAR = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
const diaAR = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
const diaSemana = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay()
const diaLargo = (iso: string) => `${DIAS[diaSemana(iso)]} ${ddmm(iso)}`
const cant = (n: number) => (Number.isInteger(n) ? String(n) : n.toLocaleString('es-AR', { maximumFractionDigits: 2 }))
const conEmoji = (h: Habito) => `${h.emoji ? h.emoji + ' ' : ''}${h.nombre}`

function sumarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

function preguntar(dudas: string[]): string {
  return dudas.length === 1 ? `❓ ${dudas[0]}` : '❓ Antes necesito saber:\n' + dudas.map((d, i) => `${i + 1}. ${d}`).join('\n')
}

/** Vacío o "hoy" · "ayer" · "anteayer" · AAAA-MM-DD · DD/MM · DD/MM/AAAA. Nunca futura ni de hace más de `atras` días. */
function leerFecha(v: unknown, dudas: string[], atras: number): string | null {
  const s = sinTildes(texto(v))
  const hoy = hoyAR()
  let f: string | null = null
  if (!s || s === 'hoy') f = hoy
  else if (s === 'ayer') f = sumarDias(hoy, -1)
  else if (s === 'anteayer' || s === 'antes de ayer') f = sumarDias(hoy, -2)
  else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) f = s
  else {
    const m = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/.exec(s)
    if (m) {
      const anio = m[3] ? (m[3].length === 2 ? `20${m[3]}` : m[3]) : hoy.slice(0, 4)
      f = `${anio}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
    }
  }
  if (!f || new Date(`${f}T12:00:00Z`).toISOString().slice(0, 10) !== f) {
    dudas.push(`¿Qué día? "${texto(v)}" no es una fecha válida.`)
    return null
  }
  if (f > hoy) {
    dudas.push(`El ${ddmm(f)} todavía no llegó: ¿qué día es?`)
    return null
  }
  if (f < sumarDias(hoy, -atras)) {
    dudas.push(`El ${ddmm(f)} es de hace más de ${atras} días: ¿es esa fecha?`)
    return null
  }
  return f
}

/** "dinero", "💰 Dinero", "plata", el número de la lista… → una de las 6 categorías fijas de la app. */
function leerCategoria(v: unknown): Categoria | null {
  const s = sinTildes(texto(v)).replace(/^[^a-z0-9]+/, '')
  if (/^[1-6]$/.test(s)) return Object.values(CATEGORIAS)[Number(s) - 1]
  return CATEGORIAS[SINONIMOS[s] ?? s] ?? null
}
const LISTA_CATEGORIAS = Object.values(CATEGORIAS).map((c, i) => `${i + 1}. ${c.nombre}`).join('\n')

/** "todos" → null (todos los días, como la app) · "lunes a viernes" · "lunes, miércoles y viernes". undefined = no se entendió. */
function leerDias(v: unknown, dudas: string[]): number[] | null | undefined {
  const s = sinTildes(texto(v))
  if (!s || /^(todos|todos los dias|todos los dias de la semana|diario|siempre)$/.test(s)) return null
  if (/^(de )?lunes a viernes$|^dias (de semana|habiles)$/.test(s)) return [1, 2, 3, 4, 5]
  if (/^(los )?fin(es)? de semana$/.test(s)) return [0, 6]
  const nombres = DIAS.map(sinTildes)
  const partes = s.replace(/[,;]/g, ' ').split(/\s+/).filter(p => p && !['y', 'e', 'los', 'el', 'de'].includes(p))
  const dias = partes.map(p => nombres.findIndex(d => d === p || (p.length >= 3 && d.startsWith(p))))
  if (!dias.length || dias.some(d => d < 0)) {
    dudas.push(`¿Qué días? "${texto(v)}" no lo entendí (por ejemplo "todos", "lunes a viernes" o "lunes, miércoles y viernes").`)
    return undefined
  }
  const unicos = [...new Set(dias)].sort((a, b) => a - b)
  return unicos.length === 7 ? null : unicos
}

function leerCantidad(v: unknown, dudas: string[], que: string): number | null {
  const s = texto(v).replace(',', '.')
  if (!s) return null
  const n = Number(s)
  if (!Number.isFinite(n) || n < 0) {
    dudas.push(`"${texto(v)}" no es ${que} válida.`)
    return null
  }
  return Math.round(n * 100) / 100
}

const diasEnPalabras = (dias: number[] | null) => (!dias?.length ? 'todos los días' : dias.map(d => DIAS[d]).join(', '))
const nombreCategoria = (id: string | null) => Object.values(CATEGORIAS).find(c => c.id === id)?.nombre ?? id ?? 'General'

// ─── Leer como la app ─────────────────────────────────────────────────────────

async function cargarHabitos(sb: SupabaseClient): Promise<Habito[]> {
  const { data, error } = await sb.from('habitos')
    .select('id, nombre, emoji, tipo, unidad, meta_numero, orden, activo, categoria, dias_semana, creado_en')
    .eq('usuario_id', USUARIO_ID)
    .order('orden', { ascending: true })
    .order('creado_en', { ascending: true })
  if (error) throw error
  return (data ?? []) as Habito[]
}

async function cargarRegistros(sb: SupabaseClient, desde: string, hasta: string): Promise<Registro[]> {
  const out: Registro[] = []
  // De a 1000 filas (el tope de Supabase por pedido).
  for (let pagina = 0; pagina < 20; pagina++) {
    const { data, error } = await sb.from('habito_registros').select('habito_id, fecha, valor_bool, valor_numero, nota')
      .eq('usuario_id', USUARIO_ID).gte('fecha', desde).lte('fecha', hasta)
      .order('fecha', { ascending: true }).range(pagina * 1000, pagina * 1000 + 999)
    if (error) throw error
    const filas = (data ?? []) as Registro[]
    out.push(...filas)
    if (filas.length < 1000) break
  }
  return out
}

const activo = (h: Habito) => h.activo !== false
const tocaEseDia = (h: Habito, fecha: string) => activo(h) && (!h.dias_semana?.length || h.dias_semana.includes(diaSemana(fecha)))
const valorNumero = (r?: Registro) => (r?.valor_numero == null ? 0 : Number(r.valor_numero))

/** Cumplido: sí/no marcado en sí; de cantidad, llegó a la meta (o, sin meta, algo anotado). */
function cumplido(h: Habito, r?: Registro): boolean {
  if (!r) return false
  if (h.tipo === 'numero') return h.meta_numero ? valorNumero(r) >= Number(h.meta_numero) : valorNumero(r) > 0
  return r.valor_bool === true
}

function cuantoLleva(h: Habito, r?: Registro): string {
  if (h.tipo !== 'numero') return ''
  return ` — ${cant(valorNumero(r))}${h.meta_numero ? ` de ${cant(Number(h.meta_numero))}` : ''}${h.unidad ? ` ${h.unidad}` : ''}`
}

async function rutinaDelDia(sb: SupabaseClient, fecha: string) {
  const [todos, regs] = await Promise.all([cargarHabitos(sb), cargarRegistros(sb, fecha, fecha)])
  const lista = todos.filter(h => tocaEseDia(h, fecha))
  const porHabito = new Map(regs.map(r => [r.habito_id, r]))
  const hechos = lista.filter(h => cumplido(h, porHabito.get(h.id))).length
  return { todos, lista, porHabito, hechos }
}

// ─── Encontrar el hábito que dijo Ignacio ─────────────────────────────────────

const palabras = (s: string) => sinTildes(s).replace(/[^a-z0-9ñ ]+/g, ' ').split(/\s+/).filter(w => w.length >= 3 && !RELLENO.has(w))

function porNombre(pedido: string, candidatos: Habito[]): Habito[] {
  const q = sinTildes(pedido)
  const exactos = candidatos.filter(h => sinTildes(h.nombre) === q)
  if (exactos.length) return exactos
  const pq = palabras(pedido)
  if (!pq.length) return []
  // Primero palabras enteras; después principios de palabra ("video" → "videos", "subi" → "subir").
  const enteras = candidatos.filter(h => pq.every(w => palabras(h.nombre).includes(w)))
  if (enteras.length) return enteras
  return candidatos.filter(h => {
    const ph = palabras(h.nombre)
    return pq.every(w => ph.some(x => x.startsWith(w) || (w.length >= 4 && w.startsWith(x))))
  })
}

/**
 * Uno o varios hábitos: el número de la lista del día, el nombre (o parte) o el id, separados por coma
 * o "y". Primero se prueba el pedido entero, porque hay nombres con comas ("sin alcohol, sin harina…").
 */
function resolver(pedido: string, lista: Habito[], todos: Habito[]): { habitos: Habito[]; dudas: string[] } {
  const dudas: string[] = []
  const s = texto(pedido)
  if (!s) return { habitos: [], dudas: ['¿Qué hábito?'] }
  const buscar = (p: string) => {
    const c = porNombre(p, todos.filter(activo))
    return c.length ? c : porNombre(p, todos)
  }
  const uno = (p: string): Habito | null => {
    if (/^[0-9a-f-]{36}$/i.test(p)) {
      const h = todos.find(x => x.id === p)
      if (!h) dudas.push(`No encontré el hábito con id ${p}.`)
      return h ?? null
    }
    if (/^\d{1,2}$/.test(p)) {
      const h = lista[Number(p) - 1]
      if (!h) dudas.push(`No hay un hábito número ${p}: la rutina de ese día va del 1 al ${lista.length}.`)
      return h ?? null
    }
    const c = buscar(p)
    if (c.length === 1) return c[0]
    if (!c.length) dudas.push(`"${p}" no es ninguno de tus hábitos.`)
    else dudas.push(`"${p}" puede ser ${c.slice(0, 6).map(h => `«${conEmoji(h)}»`).join(' o ')}: ¿cuál?`)
    return null
  }
  let partes: string[]
  if (!/^[\d\s,;y]+$/.test(s) && buscar(s).length === 1) partes = [s]
  else partes = s.split(/\s*(?:,|;|\s+y\s+|\s+e\s+)\s*/).map(p => p.trim()).filter(Boolean)
  const vistos = new Set<string>()
  const habitos: Habito[] = []
  for (const p of partes) {
    const h = uno(p)
    if (h && !vistos.has(h.id)) {
      vistos.add(h.id)
      habitos.push(h)
    }
  }
  return { habitos, dudas }
}

// ─── Herramientas ─────────────────────────────────────────────────────────────

export const HERRAMIENTAS_HABITOS: Herramienta[] = [
  {
    name: 'libre_habitos_hoy',
    description: 'La rutina del día de Ignacio en AMAUTA Libre: la lista numerada de sus hábitos de ese día con lo que ya hizo (✅) y lo que falta (⬜); los de cantidad muestran cuánto lleva de la meta. Para "¿qué me falta?", "mi rutina" y antes de marcar si no tenés la lista a mano: los números de esta lista son los que entiende libre_habito_marcar. Con incluir_pausados agrega los pausados. formato datos devuelve JSON (lo usan los avisos). No marca nada.',
    inputSchema: {
      type: 'object',
      properties: {
        fecha: { type: 'string', description: 'hoy (por defecto) · ayer · DD/MM · AAAA-MM-DD' },
        incluir_pausados: { type: 'boolean' },
        formato: { type: 'string', enum: ['texto', 'datos'] },
      },
    },
    async run(args) {
      const dudas: string[] = []
      const fecha = leerFecha(args.fecha, dudas, 400)
      if (!fecha) return preguntar(dudas)
      try {
        const r = await rutinaDelDia(db(), fecha)
        const pausados = r.todos.filter(h => !activo(h))
        if (texto(args.formato) === 'datos') {
          return JSON.stringify({
            fecha, hechos: r.hechos, total: r.lista.length,
            habitos: r.lista.map((h, i) => {
              const reg = r.porHabito.get(h.id)
              return {
                numero: i + 1, id: h.id, nombre: h.nombre, emoji: h.emoji, tipo: h.tipo, unidad: h.unidad,
                meta: h.meta_numero == null ? null : Number(h.meta_numero), categoria: h.categoria,
                valor_bool: reg?.valor_bool ?? null, valor_numero: reg?.valor_numero == null ? null : Number(reg.valor_numero),
                nota: reg?.nota ?? null, cumplido: cumplido(h, reg),
              }
            }),
            pausados: pausados.map(h => ({ id: h.id, nombre: h.nombre, emoji: h.emoji })),
          })
        }
        if (!r.lista.length) return `No tenés hábitos para el ${diaLargo(fecha)}.`
        return [
          `🎯 Tu rutina del ${diaLargo(fecha)} — vas ${r.hechos} de ${r.lista.length}`,
          ...r.lista.map((h, i) => {
            const reg = r.porHabito.get(h.id)
            return `${i + 1}. ${cumplido(h, reg) ? '✅' : '⬜'} ${conEmoji(h)}${cuantoLleva(h, reg)}`
          }),
          ...(siEs(args.incluir_pausados) && pausados.length ? [`⏸️ Pausados: ${pausados.map(conEmoji).join(' · ')}`] : []),
        ].join('\n')
      } catch (e) {
        console.error('[mcp libre] habitos hoy', e)
        return `⚠️ No pude leer tus hábitos: ${ERROR_INTERNO}`
      }
    },
  },
  {
    name: 'libre_habito_marcar',
    description: 'Marca DIRECTO en AMAUTA Libre lo que Ignacio hizo de su rutina ("ya medité", "hice el 1, el 3 y el 5", "subí un video de FOR SALE", "hoy no ayuné"), sin pedir confirmación. habito = número de la lista del día (libre_habitos_hoy), nombre o parte del nombre, o id; varios separados por coma. Los de cantidad llevan cantidad (con sumar: true se suma a lo que ya tenía: "subí otro video"). hecho: false lo desmarca. Por defecto hoy; "ayer" también vale. Marca lo que está claro y pregunta (❓) solo por lo dudoso. Devuelve ✅ con cuántos lleva del día. Los contactos de Bienestar y Neuquén 1 se cuentan solos desde sus apps: marcalos a mano solo si Ignacio lo pide.',
    inputSchema: {
      type: 'object',
      properties: {
        habito: { type: 'string', description: 'Número de la lista del día, nombre o id. Varios: "1, 3, 5".' },
        cantidad: { type: 'string', description: 'Solo para los de cantidad: 2, 20, "1,5"' },
        sumar: { type: 'boolean', description: 'La cantidad se suma a lo que ya tenía ese día' },
        hecho: { type: 'boolean', description: 'false = no lo hizo o desmarcar. Por defecto true.' },
        fecha: { type: 'string', description: 'hoy (por defecto) · ayer · DD/MM. Hasta 31 días para atrás.' },
        nota: { type: 'string', description: 'Opcional, corta, como la dijo Ignacio' },
        solo_si_mayor: { type: 'boolean', description: 'Lo usa el conteo automático: no baja un número que ya era mayor' },
      },
      required: ['habito'],
    },
    async run(args) {
      const dudas: string[] = []
      const fecha = leerFecha(args.fecha, dudas, 31)
      const cantidad = leerCantidad(args.cantidad, dudas, 'una cantidad')
      if (!fecha || dudas.length) return preguntar(dudas)
      const hecho = !noEs(args.hecho)
      const nota = args.nota === undefined ? undefined : (texto(args.nota).replace(/\s+/g, ' ').slice(0, 280) || null)
      let sb: SupabaseClient
      let r: Awaited<ReturnType<typeof rutinaDelDia>>
      try {
        sb = db()
        r = await rutinaDelDia(sb, fecha)
      } catch (e) {
        console.error('[mcp libre] habitos marcar leer', e)
        return `⚠️ NO SE MARCÓ: ${ERROR_INTERNO}`
      }
      const { habitos, dudas: noEncontrados } = resolver(texto(args.habito), r.lista, r.todos)
      dudas.push(...noEncontrados)
      if (cantidad !== null && habitos.length > 1) return '❓ La cantidad va de a un hábito por vez: ¿a cuál le pongo esa cantidad?'

      const lineas: string[] = []
      const sinCambio: string[] = []
      let fallas = 0
      for (const h of habitos) {
        if (!activo(h)) {
          dudas.push(`«${conEmoji(h)}» está pausado: ¿lo reactivo y lo marco?`)
          continue
        }
        const antes = r.porHabito.get(h.id)
        const fila: Record<string, unknown> = { usuario_id: USUARIO_ID, habito_id: h.id, fecha }
        if (nota !== undefined) fila.nota = nota
        let linea: string
        if (h.tipo === 'numero') {
          let valor: number
          if (!hecho) valor = 0
          else if (cantidad !== null) valor = Math.round(((siEs(args.sumar) ? valorNumero(antes) : 0) + cantidad) * 100) / 100
          else {
            dudas.push(`¿Cuántos${h.unidad ? ' ' + h.unidad : ''} de «${conEmoji(h)}»?${h.meta_numero ? ` La meta es ${cant(Number(h.meta_numero))}.` : ''}`)
            continue
          }
          if (siEs(args.solo_si_mayor) && antes && valor <= valorNumero(antes)) {
            sinCambio.push(`${conEmoji(h)} ya tenía ${cant(valorNumero(antes))}`)
            continue
          }
          fila.valor_numero = valor
          const llega = h.meta_numero && valor >= Number(h.meta_numero)
          linea = `   • ${conEmoji(h)}: ${cant(valor)}${h.meta_numero ? ` de ${cant(Number(h.meta_numero))}` : ''}${h.unidad ? ` ${h.unidad}` : ''}${llega ? ' ✓' : ''}`
        } else {
          fila.valor_bool = hecho
          linea = `   • ${conEmoji(h)}: ${hecho ? 'hecho ✓' : 'no hecho'}`
        }
        // De a uno: con varios en un solo upsert, las columnas que no manda una fila quedarían en null en las otras.
        const { error } = await sb.from('habito_registros').upsert(fila, { onConflict: 'habito_id,fecha' })
        if (error) {
          console.error('[mcp libre] habitos marcar', error)
          fallas++
          lineas.push(`   ⚠️ ${conEmoji(h)}: NO SE MARCÓ (${ERROR_INTERNO})`)
          continue
        }
        lineas.push(linea)
      }
      if (!lineas.length && !sinCambio.length) return preguntar(dudas.length ? dudas : ['¿Qué hábito?'])

      let releido = ''
      if (lineas.length > fallas) {
        try {
          const d = await rutinaDelDia(sb, fecha)
          const faltan = d.lista.filter(h => !cumplido(h, d.porHabito.get(h.id)))
          releido = `✔️ Releído: el ${diaLargo(fecha)} vas ${d.hechos} de ${d.lista.length}` +
            (faltan.length ? `. Faltan: ${faltan.map(h => `${conEmoji(h)}${cuantoLleva(h, d.porHabito.get(h.id))}`).join(' · ')}` : ' 🎉')
        } catch (e) {
          console.error('[mcp libre] habitos releer', e)
          releido = '🔸 Quedó marcado, pero no pude releer el día.'
        }
      }
      return [
        ...(lineas.length ? [`${fallas === lineas.length ? '⚠️' : '✅'} MARCADO EN AMAUTA LIBRE — ${diaLargo(fecha)}`, ...lineas] : []),
        ...(sinCambio.length ? [`Sin cambios: ${sinCambio.join(' · ')}`] : []),
        ...(releido ? [releido] : []),
        ...(dudas.length ? [preguntar(dudas)] : []),
      ].join('\n')
    },
  },
  {
    name: 'libre_habito_crear',
    description: 'Crea DIRECTO un hábito nuevo en la rutina de Ignacio en AMAUTA Libre cuando lo pide ("sumá a la rutina…"), sin pedir confirmación (autorizado por Ignacio el 15/09/2026). Nombre corto; si es de un negocio, con el negocio adelante: "Librería · Historias de catálogo". tipo si_no (hecho o no hecho) o numero (con meta por día y unidad). categoria: una de las 6 fijas de la app (general, salud, mente, dinero, aprender, social); lo de los negocios va en dinero. dias: "todos" (por defecto), "lunes a viernes" o los días. ❓ si ya existe uno igual (activo o pausado).',
    inputSchema: {
      type: 'object',
      properties: {
        nombre: { type: 'string' },
        emoji: { type: 'string', description: 'Uno solo. Por defecto ⭐' },
        tipo: { type: 'string', enum: ['si_no', 'numero'], description: 'Por defecto si_no; numero si mandás meta' },
        meta: { type: 'string', description: 'Solo numero: cuánto por día (2, 20)' },
        unidad: { type: 'string', description: 'Solo numero: videos, contactos, páginas, min' },
        categoria: { type: 'string', enum: ['general', 'salud', 'mente', 'dinero', 'aprender', 'social'] },
        dias: { type: 'string', description: '"todos" (por defecto), "lunes a viernes", "lunes, miércoles y viernes"' },
      },
      required: ['nombre'],
    },
    async run(args) {
      const dudas: string[] = []
      const nombre = texto(args.nombre).replace(/\s+/g, ' ').slice(0, 80)
      if (!nombre) return '❓ ¿Cómo se llama el hábito?'
      const tipoDicho = sinTildes(texto(args.tipo))
      const meta = leerCantidad(args.meta, dudas, 'una meta')
      let tipo: 'boolean' | 'numero' = meta !== null ? 'numero' : 'boolean'
      if (/^(si_no|si\/no|sino|boolean|hecho)$/.test(tipoDicho)) tipo = 'boolean'
      else if (/^(numero|cantidad|numerico)$/.test(tipoDicho)) tipo = 'numero'
      else if (tipoDicho) dudas.push('¿Se marca como hecho o no hecho, o con una cantidad?')
      if (tipo === 'boolean' && meta !== null) dudas.push(`«${nombre}» se marca como hecho o no hecho: ¿lleva meta de cantidad (entonces es de tipo numero)?`)
      if (meta === 0) dudas.push('La meta tiene que ser mayor que cero.')
      const cat = texto(args.categoria) ? leerCategoria(args.categoria) : CATEGORIAS.general
      if (!cat) dudas.push(`"${texto(args.categoria)}" no es una categoría de hábitos. Las de la app son:\n${LISTA_CATEGORIAS}`)
      const dias = leerDias(args.dias, dudas)
      if (dudas.length || !cat || dias === undefined) return preguntar(dudas)
      const emoji = Array.from(texto(args.emoji)).slice(0, 4).join('') || '⭐'
      const unidad = tipo === 'numero' ? texto(args.unidad).slice(0, 20) || null : null

      try {
        const sb = db()
        const todos = await cargarHabitos(sb)
        const igual = todos.find(h => sinTildes(h.nombre) === sinTildes(nombre))
        if (igual) {
          return activo(igual)
            ? `❓ Ya tenés «${conEmoji(igual)}» en la rutina. ¿Querés cambiarle algo (libre_habito_editar)?`
            : `❓ «${conEmoji(igual)}» ya existe y está pausado. ¿Lo reactivo (libre_habito_editar habito=${igual.id} activo=true)?`
        }
        const orden = Math.max(0, ...todos.filter(activo).map(h => h.orden ?? 0)) + 1
        const { data, error } = await sb.from('habitos').insert({
          usuario_id: USUARIO_ID, nombre, emoji, tipo, unidad, meta_numero: tipo === 'numero' ? meta : null,
          obligatorio: false, orden, activo: true, categoria: cat.id, dias_semana: dias,
        }).select('id').single()
        if (error) throw error
        let lugar = ''
        try {
          const d = await rutinaDelDia(sb, hoyAR())
          const n = d.lista.findIndex(h => h.id === data.id)
          lugar = n >= 0 ? `   Queda el ${n + 1} de tu rutina de hoy.` : '   Hoy no le toca.'
        } catch (e) {
          console.error('[mcp libre] habitos crear releer', e)
        }
        return [
          `✅ HÁBITO NUEVO EN AMAUTA LIBRE — ${emoji} ${nombre}`,
          `   ${tipo === 'numero' ? `Cantidad por día${meta ? `, meta ${cant(meta)}${unidad ? ' ' + unidad : ''}` : ''}` : 'Hecho o no hecho'} · ${cat.nombre} · ${diasEnPalabras(dias)}`,
          ...(lugar ? [lugar] : []),
          `Para deshacerlo: libre_habito_editar habito=${data.id} activo=false`,
        ].join('\n')
      } catch (e) {
        console.error('[mcp libre] habitos crear', e)
        return `⚠️ NO SE CREÓ: ${ERROR_INTERNO}`
      }
    },
  },
  {
    name: 'libre_habito_editar',
    description: 'Cambia DIRECTO un hábito de AMAUTA Libre, sin pedir confirmación: nombre, emoji, categoria, meta, unidad, dias, o activo=false para pausarlo (sale de la rutina y su historial queda guardado) y activo=true para reactivarlo. Los hábitos no se borran: si Ignacio dice "borrá" o "sacá" uno, pausalo y contale que el historial queda. habito = número de la lista del día, nombre o id. No cambia el tipo (sí/no o cantidad): para eso se pausa y se crea otro.',
    inputSchema: {
      type: 'object',
      properties: {
        habito: { type: 'string', description: 'Número de la lista del día, nombre o id' },
        nombre: { type: 'string' },
        emoji: { type: 'string' },
        categoria: { type: 'string', enum: ['general', 'salud', 'mente', 'dinero', 'aprender', 'social'] },
        meta: { type: 'string', description: 'Solo los de cantidad' },
        unidad: { type: 'string', description: 'Solo los de cantidad' },
        dias: { type: 'string', description: '"todos", "lunes a viernes", "lunes, miércoles y viernes"' },
        activo: { type: 'boolean', description: 'false = pausar · true = reactivar' },
      },
      required: ['habito'],
    },
    async run(args) {
      const dudas: string[] = []
      let sb: SupabaseClient
      let r: Awaited<ReturnType<typeof rutinaDelDia>>
      try {
        sb = db()
        r = await rutinaDelDia(sb, hoyAR())
      } catch (e) {
        console.error('[mcp libre] habitos editar leer', e)
        return `⚠️ NO SE CAMBIÓ: ${ERROR_INTERNO}`
      }
      const { habitos, dudas: noEncontrados } = resolver(texto(args.habito), r.lista, r.todos)
      if (noEncontrados.length) return preguntar(noEncontrados)
      if (habitos.length !== 1) return '❓ Los cambios van de a un hábito por vez: ¿cuál?'
      const h = habitos[0]
      const cambios: Record<string, unknown> = {}
      const lineas: string[] = []

      if (args.nombre !== undefined) {
        const nombre = texto(args.nombre).replace(/\s+/g, ' ').slice(0, 80)
        const otro = r.todos.find(x => x.id !== h.id && sinTildes(x.nombre) === sinTildes(nombre))
        if (!nombre) dudas.push('¿Qué nombre nuevo le pongo?')
        else if (otro) dudas.push(`Ya hay otro hábito «${conEmoji(otro)}»${activo(otro) ? '' : ' (pausado)'}: ¿qué nombre le pongo?`)
        else if (nombre !== h.nombre) {
          cambios.nombre = nombre
          lineas.push(`   • nombre: «${h.nombre}» → «${nombre}»`)
        }
      }
      if (args.emoji !== undefined) {
        const emoji = Array.from(texto(args.emoji)).slice(0, 4).join('')
        if (emoji && emoji !== h.emoji) {
          cambios.emoji = emoji
          lineas.push(`   • emoji: ${h.emoji ?? '—'} → ${emoji}`)
        }
      }
      if (args.categoria !== undefined) {
        const cat = leerCategoria(args.categoria)
        if (!cat) dudas.push(`"${texto(args.categoria)}" no es una categoría de hábitos. Las de la app son:\n${LISTA_CATEGORIAS}`)
        else if (cat.id !== h.categoria) {
          cambios.categoria = cat.id
          lineas.push(`   • categoría: ${nombreCategoria(h.categoria)} → ${cat.nombre}`)
        }
      }
      if (args.meta !== undefined || args.unidad !== undefined) {
        if (h.tipo !== 'numero') dudas.push(`«${conEmoji(h)}» se marca como hecho o no hecho: no lleva meta ni unidad.`)
        else {
          if (args.meta !== undefined) {
            const meta = leerCantidad(args.meta, dudas, 'una meta')
            if (meta === 0) dudas.push('La meta tiene que ser mayor que cero.')
            else if (meta !== null && meta !== Number(h.meta_numero)) {
              cambios.meta_numero = meta
              lineas.push(`   • meta: ${h.meta_numero == null ? 'sin meta' : cant(Number(h.meta_numero))} → ${cant(meta)}`)
            }
          }
          if (args.unidad !== undefined) {
            const unidad = texto(args.unidad).slice(0, 20) || null
            if (unidad !== h.unidad) {
              cambios.unidad = unidad
              lineas.push(`   • unidad: ${h.unidad ?? '—'} → ${unidad ?? '—'}`)
            }
          }
        }
      }
      if (args.dias !== undefined) {
        const dias = leerDias(args.dias, dudas)
        if (dias !== undefined && JSON.stringify(dias ?? []) !== JSON.stringify(h.dias_semana ?? [])) {
          cambios.dias_semana = dias
          lineas.push(`   • días: ${diasEnPalabras(h.dias_semana)} → ${diasEnPalabras(dias)}`)
        }
      }
      let pausa: boolean | null = null
      if (args.activo !== undefined) {
        const quiere = !noEs(args.activo)
        if (quiere !== activo(h)) {
          cambios.activo = quiere
          pausa = !quiere
        }
      }
      if (dudas.length) return preguntar(dudas)
      if (!Object.keys(cambios).length) {
        if (args.activo !== undefined) return `«${conEmoji(h)}» ya estaba ${activo(h) ? 'activo' : 'pausado'}: no cambié nada.`
        return `❓ ¿Qué le cambio a «${conEmoji(h)}»? (nombre, emoji, categoría, meta, días, pausar o reactivar)`
      }

      try {
        const { error } = await sb.from('habitos').update(cambios).eq('id', h.id).eq('usuario_id', USUARIO_ID)
        if (error) throw error
      } catch (e) {
        console.error('[mcp libre] habitos editar', e)
        return `⚠️ NO SE CAMBIÓ: ${ERROR_INTERNO}`
      }
      if (pausa !== null) {
        let historial = ''
        try {
          const { count } = await sb.from('habito_registros').select('id', { count: 'exact', head: true })
            .eq('usuario_id', USUARIO_ID).eq('habito_id', h.id)
          historial = count ? ` (sus ${count} días marcados quedan guardados)` : ''
        } catch (e) {
          console.error('[mcp libre] habitos contar historial', e)
        }
        lineas.push(pausa
          ? `   • ⏸️ pausado: ya no aparece en tu rutina${historial}`
          : '   • ▶️ reactivado: vuelve a tu rutina')
      }
      return [
        `✅ CAMBIADO EN AMAUTA LIBRE — ${conEmoji({ ...h, ...(cambios as Partial<Habito>) })}`,
        ...lineas,
        pausa ? `Para deshacerlo: libre_habito_editar habito=${h.id} activo=true` : `id ${h.id}`,
      ].join('\n')
    },
  },
  {
    name: 'libre_habitos_semana',
    description: 'Cómo le fue a Ignacio con sus hábitos entre dos fechas (por defecto los últimos 7 días, hoy incluido): por hábito, cuántos días le tocaba y cuántos cumplió; en los de cantidad, también el total. Para "¿cómo vengo con los hábitos?" y el aviso de los lunes. Solo los hábitos activos. formato datos devuelve JSON. No marca nada.',
    inputSchema: {
      type: 'object',
      properties: {
        desde: { type: 'string', description: 'DD/MM · AAAA-MM-DD · ayer. Por defecto hace 6 días.' },
        hasta: { type: 'string', description: 'Por defecto hoy' },
        formato: { type: 'string', enum: ['texto', 'datos'] },
      },
    },
    async run(args) {
      const dudas: string[] = []
      const hasta = leerFecha(args.hasta, dudas, 400)
      const desde = texto(args.desde) ? leerFecha(args.desde, dudas, 400) : hasta && sumarDias(hasta, -6)
      if (!desde || !hasta) return preguntar(dudas)
      if (hasta < desde) return `❓ "hasta" (${ddmm(hasta)}) es anterior a "desde" (${ddmm(desde)}). ¿Qué período querés?`
      if (desde < sumarDias(hasta, -92)) return '❓ El período puede tener hasta 3 meses. ¿Cuál querés?'
      try {
        const sb = db()
        const [todos, regs] = await Promise.all([cargarHabitos(sb), cargarRegistros(sb, desde, hasta)])
        const reg = new Map(regs.map(x => [`${x.habito_id}|${x.fecha}`, x]))
        const fechas: string[] = []
        for (let f = desde; f <= hasta; f = sumarDias(f, 1)) fechas.push(f)
        const filas = todos.filter(activo).map(h => {
          const creado = diaAR(h.creado_en)
          let tocaban = 0
          let cumplidos = 0
          let total = 0
          for (const f of fechas) {
            const x = reg.get(`${h.id}|${f}`)
            total += valorNumero(x)
            if (f < creado || !tocaEseDia(h, f)) continue
            tocaban++
            if (cumplido(h, x)) cumplidos++
          }
          return {
            id: h.id, nombre: h.nombre, emoji: h.emoji, tipo: h.tipo, unidad: h.unidad, categoria: h.categoria,
            meta: h.meta_numero == null ? null : Number(h.meta_numero), tocaban, cumplidos, total: Math.round(total * 100) / 100,
          }
        }).filter(f => f.tocaban > 0)
        const cumplidos = filas.reduce((t, f) => t + f.cumplidos, 0)
        const tocaban = filas.reduce((t, f) => t + f.tocaban, 0)
        if (texto(args.formato) === 'datos') return JSON.stringify({ desde, hasta, cumplidos, tocaban, habitos: filas })
        if (!filas.length) return `No hay hábitos activos entre el ${ddmm(desde)} y el ${ddmm(hasta)}.`
        return [
          `🎯 Hábitos del ${ddmm(desde)} al ${ddmm(hasta)} — cumpliste ${cumplidos} de ${tocaban}`,
          ...filas.map((f, i) => `${i + 1}. ${f.emoji ? f.emoji + ' ' : ''}${f.nombre}: ${f.cumplidos} de ${f.tocaban} días` +
            (f.tipo === 'numero' ? ` (${cant(f.total)}${f.unidad ? ' ' + f.unidad : ''} en total)` : '')),
        ].join('\n')
      } catch (e) {
        console.error('[mcp libre] habitos semana', e)
        return `⚠️ No pude armar el resumen de hábitos: ${ERROR_INTERNO}`
      }
    },
  },
]

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/LocaleContext'
import OnboardingTutorial from '@/components/OnboardingTutorial'
import RatingPrompt from '@/components/RatingPrompt'

type Habito = {
  id: string
  nombre: string
  emoji: string
  tipo: string
  unidad: string | null
  obligatorio: boolean
  orden: number
  meta_numero: number | null
  categoria?: string | null
  dias_semana?: number[] | null
}

type Registro = {
  habito_id: string
  valor_bool: boolean | null
  valor_numero: number | null
  nota: string | null
}

type HistorialReg = {
  habito_id: string
  fecha: string
  valor_bool: boolean | null
  valor_numero: number | null
  nota?: string | null
}

const PLANTILLAS: Omit<Habito, 'id' | 'obligatorio' | 'orden'>[] = [
  { nombre: 'Agua', emoji: '💧', tipo: 'numero', unidad: 'vasos', meta_numero: 8 },
  { nombre: 'Ejercicio', emoji: '🏃', tipo: 'boolean', unidad: null, meta_numero: null },
  { nombre: 'Lectura', emoji: '📚', tipo: 'numero', unidad: 'páginas', meta_numero: 20 },
  { nombre: 'Meditación', emoji: '🧘', tipo: 'numero', unidad: 'min', meta_numero: 10 },
  { nombre: 'Sin azúcar', emoji: '🥗', tipo: 'boolean', unidad: null, meta_numero: null },
  { nombre: 'Dormir 8h', emoji: '🛌', tipo: 'boolean', unidad: null, meta_numero: null },
  { nombre: 'Gratitud', emoji: '🙏', tipo: 'boolean', unidad: null, meta_numero: null },
  { nombre: 'Idioma', emoji: '🗣️', tipo: 'numero', unidad: 'min', meta_numero: 15 },
  { nombre: 'Sin redes sociales', emoji: '📵', tipo: 'boolean', unidad: null, meta_numero: null },
  { nombre: 'Caminata', emoji: '🚶', tipo: 'numero', unidad: 'min', meta_numero: 30 },
  { nombre: 'Vitaminas', emoji: '💊', tipo: 'boolean', unidad: null, meta_numero: null },
  { nombre: 'Correr', emoji: '🏅', tipo: 'numero', unidad: 'km', meta_numero: 5 },
  { nombre: 'Stretching', emoji: '🤸', tipo: 'numero', unidad: 'min', meta_numero: 10 },
  { nombre: 'Escritura', emoji: '✍️', tipo: 'numero', unidad: 'min', meta_numero: 15 },
  { nombre: 'Journaling', emoji: '📓', tipo: 'boolean', unidad: null, meta_numero: null },
  { nombre: 'Respiración', emoji: '🌬️', tipo: 'numero', unidad: 'min', meta_numero: 5 },
  { nombre: 'Sin alcohol', emoji: '🚫', tipo: 'boolean', unidad: null, meta_numero: null },
  { nombre: 'Sin tabaco', emoji: '🚭', tipo: 'boolean', unidad: null, meta_numero: null },
  { nombre: 'Llamar familia', emoji: '📞', tipo: 'boolean', unidad: null, meta_numero: null },
  { nombre: 'Fruta', emoji: '🍎', tipo: 'numero', unidad: 'porciones', meta_numero: 2 },
  { nombre: 'Yoga', emoji: '🧘‍♀️', tipo: 'numero', unidad: 'min', meta_numero: 20 },
  { nombre: 'Podcast', emoji: '🎧', tipo: 'numero', unidad: 'min', meta_numero: 20 },
]

type MetasData = {
  meta30: string
  meta90: string
  meta180: string
} | null

type Finanzas = { ingresos: number; gastos: number; ahorro: boolean }
type FinanzaItem = { id: string; tipo: 'ingreso' | 'gasto'; monto: number; descripcion: string | null; categoria: string | null; creado_en: string }
type FinanzaCategoria = { id: string; nombre: string; emoji: string; es_base: boolean; orden: number }

const DEFAULT_CATS_FIN = [
  { nombre: 'Trabajo',    emoji: '💼', es_base: true, orden: 1 },
  { nombre: 'Comida',     emoji: '🍔', es_base: true, orden: 2 },
  { nombre: 'Casa',       emoji: '🏠', es_base: true, orden: 3 },
  { nombre: 'Transporte', emoji: '🚗', es_base: true, orden: 4 },
  { nombre: 'Salud',      emoji: '💊', es_base: true, orden: 5 },
  { nombre: 'Ocio',       emoji: '🎉', es_base: true, orden: 6 },
  { nombre: 'Inversión',  emoji: '📈', es_base: true, orden: 7 },
  { nombre: 'Otro',       emoji: '➕', es_base: true, orden: 8 },
]

const CAT_FIN_EMOJIS = ['💰','🏠','🚗','🍔','💊','🎉','📚','🎮','🐕','👗','💡','🛒','✈️','⚽','🎨','🔧','🌿','💻','🎵','🍕']

const PLANTILLAS_CATEGORIAS: { nombre: string; emoji: string }[] = [
  { nombre: 'Educación',     emoji: '🎓' },
  { nombre: 'Entretenimiento', emoji: '🎮' },
  { nombre: 'Ropa',          emoji: '👗' },
  { nombre: 'Mascotas',      emoji: '🐕' },
  { nombre: 'Viajes',        emoji: '✈️' },
  { nombre: 'Tecnología',    emoji: '💻' },
  { nombre: 'Cuidado personal', emoji: '🌿' },
  { nombre: 'Regalos',       emoji: '🎁' },
  { nombre: 'Gimnasio',      emoji: '🏋️' },
  { nombre: 'Suscripciones', emoji: '📱' },
  { nombre: 'Ahorro',        emoji: '🐷' },
  { nombre: 'Deudas',        emoji: '📉' },
]

const EMOJIS = ['⭐','🎯','📚','🏃','🧠','💧','🥗','🛌','✍️','🎨','🎵','💼','🌿','🙏','📞','💊','🚴','🏋️','🧘','🍎','🔥','💪','🎧','📖','⚽','🎸','🖥️','🌅','🎭','🦁']

const CATEGORIAS = [
  { id: null as string | null, label: 'General', color: '#6b7280' },
  { id: 'salud',    label: '💪 Salud',    color: '#10b981' },
  { id: 'mente',    label: '🧠 Mente',    color: '#8B5CF6' },
  { id: 'dinero',   label: '💰 Dinero',   color: '#F5C518' },
  { id: 'aprender', label: '📚 Aprender', color: '#3B82F6' },
  { id: 'social',   label: '👥 Social',   color: '#EC4899' },
]

function catColor(cat?: string | null): string {
  return CATEGORIAS.find(c => c.id === (cat ?? null))?.color ?? '#6b7280'
}

const DIAS_CORTOS = ['D','L','M','M','J','V','S']
const DIAS_LABELS = ['Do','Lu','Ma','Mi','Ju','Vi','Sá']

function isHoy(h: { dias_semana?: number[] | null }, dow: number): boolean {
  if (!h.dias_semana || h.dias_semana.length === 0) return true
  return h.dias_semana.includes(dow)
}

function frecuenciaLabel(dias?: number[] | null): string {
  if (!dias || dias.length === 0) return ''
  return [...dias].sort((a, b) => a - b).map(d => DIAS_LABELS[d]).join(' ')
}

export default function TablizableClient({ habitos, regMap: initialRegMap, userId, today, racha, metas, historial }: {
  habitos: Habito[]
  regMap: Record<string, Registro>
  userId: string
  today: string
  racha: number
  metas: MetasData
  historial: HistorialReg[]
}) {
  const supabase = createClient()
  const { t, locale } = useLocale()
  const fmt = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)

  const [regMap, setRegMap] = useState(initialRegMap)
  const [loading, setLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'hoy' | 'mes' | 'habitos' | 'finanzas' | 'metas'>('hoy')
  const [habitoFeedback, setHabitoFeedback] = useState<string | null>(null)

  // Numeric habit stepper values (controlled)
  const [numValues, setNumValues] = useState<Record<string, number>>(
    () => Object.fromEntries(
      habitos.filter(h => h.tipo === 'numero').map(h => [h.id, initialRegMap[h.id]?.valor_numero ?? 0])
    )
  )

  // Notas diarias por hábito
  const [notaOpen, setNotaOpen] = useState<string | null>(null)
  const [notaInputs, setNotaInputs] = useState<Record<string, string>>(
    () => Object.fromEntries(
      habitos.filter(h => initialRegMap[h.id]?.nota).map(h => [h.id, initialRegMap[h.id]?.nota ?? ''])
    )
  )
  const [notaSaving, setNotaSaving] = useState<string | null>(null)

  // Plantillas
  const [showPlantillas, setShowPlantillas] = useState(false)

  // Finanzas hoy
  const [finanzas, setFinanzas] = useState<Finanzas>({ ingresos: 0, gastos: 0, ahorro: false })
  const [finanzaItems, setFinanzaItems] = useState<FinanzaItem[]>([])
  const [itemTipo, setItemTipo] = useState<'ingreso' | 'gasto'>('ingreso')
  const [itemMonto, setItemMonto] = useState('')
  const [itemDesc, setItemDesc] = useState('')
  const [itemCategoria, setItemCategoria] = useState<string | null>(null)
  const [itemAdding, setItemAdding] = useState(false)

  // Finanza categorías
  const [finanzaCategorias, setFinanzaCategorias] = useState<FinanzaCategoria[]>([])
  const [showAddCategoria, setShowAddCategoria] = useState(false)
  const [nuevaCatNombre, setNuevaCatNombre] = useState('')
  const [nuevaCatEmoji, setNuevaCatEmoji] = useState('💰')
  const [catSaving, setCatSaving] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<FinanzaCategoria | null>(null)
  const [editCatNombre, setEditCatNombre] = useState('')
  const [editCatEmoji, setEditCatEmoji] = useState('')
  const [showPlantillasCat, setShowPlantillasCat] = useState(false)

  // Mes tab
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const mesNombre = new Intl.DateTimeFormat(locale === 'es' ? 'es-AR' : locale, { month: 'long' }).format(new Date(year, month - 1, 1))
  const [monthRegistros, setMonthRegistros] = useState<{ habito_id: string; fecha: string; valor_bool: boolean | null; valor_numero: number | null }[]>([])
  const [monthFinanzas, setMonthFinanzas] = useState<{ fecha: string; ingresos: number; gastos: number; ahorro: boolean }[]>([])
  const [monthItems, setMonthItems] = useState<{ tipo: string; monto: number; categoria: string | null }[]>([])
  const [monthLoading, setMonthLoading] = useState(false)

  // Edit past day
  const [editingDay, setEditingDay] = useState<string | null>(null)
  const [editDayRegMap, setEditDayRegMap] = useState<Record<string, Registro>>({})
  const [editDayFin, setEditDayFin] = useState<Finanzas>({ ingresos: 0, gastos: 0, ahorro: false })
  const [editDayItems, setEditDayItems] = useState<FinanzaItem[]>([])
  const [editItemTipo, setEditItemTipo] = useState<'ingreso' | 'gasto'>('ingreso')
  const [editItemMonto, setEditItemMonto] = useState('')
  const [editItemDesc, setEditItemDesc] = useState('')
  const [editItemCategoria, setEditItemCategoria] = useState<string | null>(null)
  const [editItemAdding, setEditItemAdding] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editSaved, setEditSaved] = useState(false)

  // Habitos management — filter out the legacy "Ahorro" base habit (replaced by finanzas section)
  const [localHabitos, setLocalHabitos] = useState<Habito[]>(
    habitos.filter(h => !(h.obligatorio && h.nombre?.toLowerCase().includes('ahorro')))
  )
  const [showAddHabito, setShowAddHabito] = useState(false)
  const [editingHabito, setEditingHabito] = useState<Habito | null>(null)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoEmoji, setNuevoEmoji] = useState('⭐')
  const [nuevoTipo, setNuevoTipo] = useState<'boolean' | 'numero'>('boolean')
  const [nuevoUnidad, setNuevoUnidad] = useState('')
  const [nuevoMeta, setNuevoMeta] = useState('')
  const [nuevoCategoria, setNuevoCategoria] = useState<string | null>(null)
  const [nuevoDiasSemana, setNuevoDiasSemana] = useState<number[] | null>(null)
  const [habitoSaving, setHabitoSaving] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [historialOpen, setHistorialOpen] = useState<string | null>(null)

  // Live stats
  const todayDow = new Date(today + 'T12:00:00').getDay()
  const habitosHoy = localHabitos.filter(h => isHoy(h, todayDow))
  const completados = habitosHoy.filter(h => {
    const r = regMap[h.id]
    if (!r) return false
    if (h.tipo === 'boolean') return r.valor_bool === true
    if (h.tipo === 'numero') return r.valor_numero !== null && r.valor_numero > 0
    return false
  }).length
  const pct = habitosHoy.length > 0 ? Math.round((completados / habitosHoy.length) * 100) : 0

  // One-time cleanup: delete the legacy "Ahorro" base habit from DB
  useEffect(() => {
    const ahorroBase = habitos.find(h => h.obligatorio && h.nombre?.toLowerCase().includes('ahorro'))
    if (ahorroBase) {
      supabase.from('habitos').delete().eq('id', ahorroBase.id).then(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load finance categories (create defaults if empty)
  useEffect(() => {
    async function loadCategorias() {
      const { data } = await supabase.from('finanzas_categorias').select('*').eq('usuario_id', userId).eq('activo', true).order('orden')
      if (!data || data.length === 0) {
        const { data: created } = await supabase.from('finanzas_categorias').insert(
          DEFAULT_CATS_FIN.map(c => ({ usuario_id: userId, ...c }))
        ).select()
        setFinanzaCategorias((created || []) as FinanzaCategoria[])
      } else {
        setFinanzaCategorias(data as FinanzaCategoria[])
      }
    }
    loadCategorias()
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load today's finanzas
  useEffect(() => {
    Promise.all([
      supabase.from('finanzas_items').select('*').eq('usuario_id', userId).eq('fecha', today).order('creado_en'),
      supabase.from('finanzas_diarias').select('ahorro').eq('usuario_id', userId).eq('fecha', today).maybeSingle(),
    ]).then(([{ data: itemsData }, { data: dailyRec }]) => {
      const items = (itemsData || []) as FinanzaItem[]
      setFinanzaItems(items)
      const ingresos = items.filter(i => i.tipo === 'ingreso').reduce((a, i) => a + i.monto, 0)
      const gastos = items.filter(i => i.tipo === 'gasto').reduce((a, i) => a + i.monto, 0)
      const ahorro = (dailyRec as { ahorro: boolean } | null)?.ahorro ?? false
      setFinanzas({ ingresos, gastos, ahorro })
    })
  }, [userId, today]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load month data
  const loadMonthData = useCallback(async () => {
    setMonthLoading(true)
    const daysInMonth = new Date(year, month, 0).getDate()
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const to = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
    const [regRes, finRes, itemsRes] = await Promise.all([
      supabase.from('habito_registros').select('habito_id,fecha,valor_bool,valor_numero').eq('usuario_id', userId).gte('fecha', from).lte('fecha', to),
      supabase.from('finanzas_diarias').select('fecha,ingresos,gastos,ahorro').eq('usuario_id', userId).gte('fecha', from).lte('fecha', to),
      supabase.from('finanzas_items').select('tipo,monto,categoria').eq('usuario_id', userId).gte('fecha', from).lte('fecha', to),
    ])
    setMonthRegistros(regRes.data || [])
    setMonthFinanzas((finRes.data || []) as { fecha: string; ingresos: number; gastos: number; ahorro: boolean }[])
    setMonthItems((itemsRes.data || []) as { tipo: string; monto: number; categoria: string | null }[])
    setMonthLoading(false)
  }, [userId, year, month]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'mes' || activeTab === 'finanzas') loadMonthData()
  }, [activeTab, loadMonthData])

  async function toggleBool(habito: Habito) {
    const current = regMap[habito.id]?.valor_bool ?? false
    const newVal = !current
    setRegMap(prev => ({ ...prev, [habito.id]: { habito_id: habito.id, valor_bool: newVal, valor_numero: null, nota: prev[habito.id]?.nota ?? null } }))
    if (newVal) {
      setHabitoFeedback(habito.id)
      setTimeout(() => setHabitoFeedback(null), 1200)
    }
    setLoading(habito.id)
    await supabase.from('habito_registros').upsert({
      usuario_id: userId, habito_id: habito.id, fecha: today, valor_bool: newVal,
    }, { onConflict: 'habito_id,fecha' })
    setLoading(null)
  }

  async function stepNumero(habito: Habito, delta: number) {
    const current = numValues[habito.id] ?? 0
    const newVal = Math.max(0, current + delta)
    setNumValues(prev => ({ ...prev, [habito.id]: newVal }))
    setRegMap(prev => ({ ...prev, [habito.id]: { habito_id: habito.id, valor_bool: null, valor_numero: newVal, nota: prev[habito.id]?.nota ?? null } }))
    await supabase.from('habito_registros').upsert({
      usuario_id: userId, habito_id: habito.id, fecha: today, valor_numero: newVal,
    }, { onConflict: 'habito_id,fecha' })
  }

  async function setNumero(habito: Habito, val: string) {
    const newVal = Math.max(0, parseFloat(val) || 0)
    setNumValues(prev => ({ ...prev, [habito.id]: newVal }))
    setRegMap(prev => ({ ...prev, [habito.id]: { habito_id: habito.id, valor_bool: null, valor_numero: newVal, nota: prev[habito.id]?.nota ?? null } }))
  }

  async function saveNumero(habito: Habito) {
    const newVal = numValues[habito.id] ?? 0
    await supabase.from('habito_registros').upsert({
      usuario_id: userId, habito_id: habito.id, fecha: today, valor_numero: newVal,
    }, { onConflict: 'habito_id,fecha' })
  }

  async function saveNota(habito: Habito) {
    const nota = notaInputs[habito.id] ?? ''
    setNotaSaving(habito.id)
    setRegMap(prev => ({ ...prev, [habito.id]: { ...(prev[habito.id] ?? { habito_id: habito.id, valor_bool: null, valor_numero: null }), nota: nota || null } }))
    await supabase.from('habito_registros').upsert({
      usuario_id: userId, habito_id: habito.id, fecha: today, nota: nota || null,
    }, { onConflict: 'habito_id,fecha' })
    setNotaSaving(null)
    if (!nota.trim()) setNotaOpen(null)
  }

  function rachaHabito(habitoId: string): number {
    const h = localHabitos.find(x => x.id === habitoId)
    if (!h) return 0
    if (!isHoy(h, todayDow)) return 0
    const doneToday = (() => {
      const r = historial.find(x => x.habito_id === habitoId && x.fecha === today)
      return r?.valor_bool === true || (r?.valor_numero != null && r.valor_numero > 0)
    })()
    let streak = doneToday ? 1 : 0
    for (let i = 1; i <= 60; i++) {
      const d = new Date(today + 'T12:00:00')
      d.setDate(d.getDate() - i)
      if (!isHoy(h, d.getDay())) continue
      const f = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const r = historial.find(x => x.habito_id === habitoId && x.fecha === f)
      const done = r?.valor_bool === true || (r?.valor_numero != null && r.valor_numero > 0)
      if (done) streak++
      else break
    }
    return streak
  }

  async function addFromPlantilla(p: typeof PLANTILLAS[0]) {
    const maxOrden = Math.max(...localHabitos.map(h => h.orden), 0)
    const { data } = await supabase.from('habitos').insert({
      usuario_id: userId, nombre: p.nombre, emoji: p.emoji, tipo: p.tipo,
      unidad: p.unidad, meta_numero: p.meta_numero, obligatorio: false,
      orden: maxOrden + 1, activo: true,
    }).select().single()
    if (data) {
      setLocalHabitos(prev => [...prev, data as Habito])
      setNumValues(prev => ({ ...prev, [data.id]: 0 }))
    }
  }

  async function syncFinanzasDiarias(items: FinanzaItem[]) {
    const ingresos = items.filter(i => i.tipo === 'ingreso').reduce((a, i) => a + i.monto, 0)
    const gastos = items.filter(i => i.tipo === 'gasto').reduce((a, i) => a + i.monto, 0)
    setFinanzas(prev => ({ ...prev, ingresos, gastos }))
    await supabase.from('finanzas_diarias').upsert({
      usuario_id: userId, fecha: today, ingresos, gastos, ahorro: finanzas.ahorro,
    }, { onConflict: 'usuario_id,fecha' })
  }

  async function toggleAhorro() {
    const newAhorro = !finanzas.ahorro
    setFinanzas(prev => ({ ...prev, ahorro: newAhorro }))
    await supabase.from('finanzas_diarias').upsert({
      usuario_id: userId, fecha: today,
      ingresos: finanzas.ingresos, gastos: finanzas.gastos, ahorro: newAhorro,
    }, { onConflict: 'usuario_id,fecha' })
  }

  async function addFinanzaItem() {
    const monto = parseFloat(itemMonto) || 0
    if (!monto) return
    setItemAdding(true)
    const tipoFinal: 'ingreso' | 'gasto' = itemCategoria === 'Inversión' ? 'gasto' : itemTipo
    const { data } = await supabase.from('finanzas_items').insert({
      usuario_id: userId, fecha: today, tipo: tipoFinal, monto, descripcion: itemDesc.trim() || null, categoria: itemCategoria,
    }).select().single()
    if (data) {
      const newItems = [...finanzaItems, data as FinanzaItem]
      setFinanzaItems(newItems)
      await syncFinanzasDiarias(newItems)
    }
    setItemMonto(''); setItemDesc(''); setItemAdding(false)
  }

  async function deleteFinanzaItem(id: string) {
    await supabase.from('finanzas_items').delete().eq('id', id)
    const newItems = finanzaItems.filter(i => i.id !== id)
    setFinanzaItems(newItems)
    await syncFinanzasDiarias(newItems)
  }

  async function addCategoria() {
    if (!nuevaCatNombre.trim()) return
    setCatSaving(true)
    const maxOrden = Math.max(...finanzaCategorias.map(c => c.orden), 0)
    const { data } = await supabase.from('finanzas_categorias').insert({
      usuario_id: userId, nombre: nuevaCatNombre.trim(), emoji: nuevaCatEmoji, es_base: false, orden: maxOrden + 1,
    }).select().single()
    if (data) setFinanzaCategorias(prev => [...prev, data as FinanzaCategoria])
    setCatSaving(false)
    setNuevaCatNombre(''); setNuevaCatEmoji('💰'); setShowAddCategoria(false)
  }

  async function deleteCategoria(id: string) {
    await supabase.from('finanzas_categorias').update({ activo: false }).eq('id', id)
    setFinanzaCategorias(prev => prev.filter(c => c.id !== id))
  }

  async function saveEditCategoria() {
    if (!editingCategoria || !editCatNombre.trim()) return
    setCatSaving(true)
    await supabase.from('finanzas_categorias').update({ nombre: editCatNombre.trim(), emoji: editCatEmoji }).eq('id', editingCategoria.id)
    setFinanzaCategorias(prev => prev.map(c => c.id === editingCategoria.id ? { ...c, nombre: editCatNombre.trim(), emoji: editCatEmoji } : c))
    setEditingCategoria(null)
    setCatSaving(false)
  }

  async function moveCategoria(id: string, dir: -1 | 1) {
    const sorted = [...finanzaCategorias].sort((a, b) => a.orden - b.orden)
    const idx = sorted.findIndex(c => c.id === id)
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const a = sorted[idx], b = sorted[swapIdx]
    await Promise.all([
      supabase.from('finanzas_categorias').update({ orden: b.orden }).eq('id', a.id),
      supabase.from('finanzas_categorias').update({ orden: a.orden }).eq('id', b.id),
    ])
    setFinanzaCategorias(prev => prev.map(c => {
      if (c.id === a.id) return { ...c, orden: b.orden }
      if (c.id === b.id) return { ...c, orden: a.orden }
      return c
    }).sort((x, y) => x.orden - y.orden))
  }

  async function addFromPlantillaCat(p: { nombre: string; emoji: string }) {
    const yaExiste = finanzaCategorias.some(c => c.nombre === p.nombre)
    if (yaExiste) return
    const maxOrden = Math.max(...finanzaCategorias.map(c => c.orden), 0)
    const { data } = await supabase.from('finanzas_categorias').insert({
      usuario_id: userId, nombre: p.nombre, emoji: p.emoji, es_base: false, orden: maxOrden + 1,
    }).select().single()
    if (data) setFinanzaCategorias(prev => [...prev, data as FinanzaCategoria])
  }

  // Month calculations
  function getDayPct(dateStr: string): number {
    const dayRegs = monthRegistros.filter(r => r.fecha === dateStr)
    if (dayRegs.length === 0 || localHabitos.length === 0) return 0
    const dow = new Date(dateStr + 'T12:00:00').getDay()
    const habitosDia = localHabitos.filter(h => isHoy(h, dow))
    if (habitosDia.length === 0) return 0
    const done = dayRegs.filter(r => r.valor_bool === true || (r.valor_numero !== null && r.valor_numero > 0)).length
    return Math.round((done / habitosDia.length) * 100)
  }

  function getDayBg(p: number): string {
    if (p === 0) return 'rgba(255,255,255,0.04)'
    if (p <= 25) return 'rgba(139,92,246,0.15)'
    if (p <= 50) return 'rgba(139,92,246,0.3)'
    if (p <= 75) return 'rgba(139,92,246,0.5)'
    return p === 100 ? 'rgba(16,185,129,0.65)' : 'rgba(139,92,246,0.75)'
  }

  async function openEditDay(dateStr: string) {
    if (dateStr > today) return
    const [{ data: regs }, { data: fin }, { data: items }] = await Promise.all([
      supabase.from('habito_registros').select('habito_id,valor_bool,valor_numero').eq('usuario_id', userId).eq('fecha', dateStr),
      supabase.from('finanzas_diarias').select('ingresos,gastos,ahorro').eq('usuario_id', userId).eq('fecha', dateStr).maybeSingle(),
      supabase.from('finanzas_items').select('*').eq('usuario_id', userId).eq('fecha', dateStr).order('creado_en'),
    ])
    const rm: Record<string, Registro> = {}
    for (const r of (regs || [])) rm[r.habito_id] = { ...r, nota: null }
    setEditDayRegMap(rm)
    const loadedItems = (items || []) as FinanzaItem[]
    setEditDayItems(loadedItems)
    const ingresos = loadedItems.filter(i => i.tipo === 'ingreso').reduce((a, i) => a + i.monto, 0)
    const gastos = loadedItems.filter(i => i.tipo === 'gasto').reduce((a, i) => a + i.monto, 0)
    const ahorro = (fin as { ahorro: boolean } | null)?.ahorro ?? false
    setEditDayFin({ ingresos, gastos, ahorro })
    setEditItemTipo('ingreso'); setEditItemMonto(''); setEditItemDesc(''); setEditItemCategoria(null)
    setEditingDay(dateStr)
    setEditSaved(false)
  }

  async function syncEditDayFinanzas(items: FinanzaItem[]) {
    if (!editingDay) return
    const ingresos = items.filter(i => i.tipo === 'ingreso').reduce((a, i) => a + i.monto, 0)
    const gastos = items.filter(i => i.tipo === 'gasto').reduce((a, i) => a + i.monto, 0)
    setEditDayFin(prev => ({ ...prev, ingresos, gastos }))
    await supabase.from('finanzas_diarias').upsert({
      usuario_id: userId, fecha: editingDay, ingresos, gastos, ahorro: editDayFin.ahorro,
    }, { onConflict: 'usuario_id,fecha' })
  }

  async function toggleEditDayAhorro() {
    if (!editingDay) return
    const newAhorro = !editDayFin.ahorro
    setEditDayFin(prev => ({ ...prev, ahorro: newAhorro }))
    await supabase.from('finanzas_diarias').upsert({
      usuario_id: userId, fecha: editingDay,
      ingresos: editDayFin.ingresos, gastos: editDayFin.gastos, ahorro: newAhorro,
    }, { onConflict: 'usuario_id,fecha' })
  }

  async function addEditDayItem() {
    if (!editingDay) return
    const monto = parseFloat(editItemMonto) || 0
    if (!monto) return
    setEditItemAdding(true)
    const tipoFinal: 'ingreso' | 'gasto' = editItemCategoria === 'Inversión' ? 'gasto' : editItemTipo
    const { data } = await supabase.from('finanzas_items').insert({
      usuario_id: userId, fecha: editingDay, tipo: tipoFinal, monto, descripcion: editItemDesc.trim() || null, categoria: editItemCategoria,
    }).select().single()
    if (data) {
      const newItems = [...editDayItems, data as FinanzaItem]
      setEditDayItems(newItems)
      await syncEditDayFinanzas(newItems)
    }
    setEditItemMonto(''); setEditItemDesc(''); setEditItemAdding(false)
  }

  async function deleteEditDayItem(id: string) {
    await supabase.from('finanzas_items').delete().eq('id', id)
    const newItems = editDayItems.filter(i => i.id !== id)
    setEditDayItems(newItems)
    await syncEditDayFinanzas(newItems)
  }

  async function saveEditDay() {
    if (!editingDay) return
    setEditSaving(true)
    const upserts = localHabitos.map(h => {
      const r = editDayRegMap[h.id]
      return {
        usuario_id: userId, habito_id: h.id, fecha: editingDay,
        valor_bool: h.tipo === 'boolean' ? (r?.valor_bool ?? false) : null,
        valor_numero: h.tipo === 'numero' ? (r?.valor_numero ?? 0) : null,
      }
    })
    await supabase.from('habito_registros').upsert(upserts, { onConflict: 'habito_id,fecha' })
    setEditSaving(false)
    setEditSaved(true)
    setTimeout(() => { setEditingDay(null); loadMonthData() }, 1200)
  }

  async function addHabito() {
    if (!nuevoNombre.trim()) return
    setHabitoSaving(true)
    const maxOrden = Math.max(...localHabitos.map(h => h.orden), 0)
    const metaNum = nuevoTipo === 'numero' && nuevoMeta ? parseFloat(nuevoMeta) || null : null
    const { data } = await supabase.from('habitos').insert({
      usuario_id: userId, nombre: nuevoNombre.trim(), emoji: nuevoEmoji,
      tipo: nuevoTipo, unidad: nuevoTipo === 'numero' && nuevoUnidad.trim() ? nuevoUnidad.trim() : null,
      meta_numero: metaNum, obligatorio: false, orden: maxOrden + 1, activo: true,
      categoria: nuevoCategoria, dias_semana: nuevoDiasSemana,
    }).select().single()
    if (data) {
      setLocalHabitos(prev => [...prev, data as Habito])
      if (data.tipo === 'numero') setNumValues(prev => ({ ...prev, [data.id]: 0 }))
    }
    setHabitoSaving(false)
    setShowAddHabito(false)
    setNuevoNombre(''); setNuevoEmoji('⭐'); setNuevoTipo('boolean'); setNuevoUnidad(''); setNuevoMeta(''); setNuevoCategoria(null); setNuevoDiasSemana(null)
  }

  async function saveEditHabito() {
    if (!editingHabito || !nuevoNombre.trim()) return
    setHabitoSaving(true)
    await supabase.from('habitos').update({ nombre: nuevoNombre.trim(), emoji: nuevoEmoji, categoria: nuevoCategoria, dias_semana: nuevoDiasSemana }).eq('id', editingHabito.id)
    setLocalHabitos(prev => prev.map(h => h.id === editingHabito.id ? { ...h, nombre: nuevoNombre.trim(), emoji: nuevoEmoji, categoria: nuevoCategoria, dias_semana: nuevoDiasSemana } : h))
    setHabitoSaving(false)
    setEditingHabito(null); setNuevoNombre(''); setNuevoCategoria(null); setNuevoDiasSemana(null)
  }

  async function deleteHabito(id: string) {
    if (!confirm(t('tablero.habitos.eliminar_confirm'))) return
    await supabase.from('habitos').update({ activo: false }).eq('id', id)
    setLocalHabitos(prev => prev.filter(h => h.id !== id))
  }

  function reorderPersonal(fromIdx: number, toIdx: number) {
    const reordered = [...localHabitos]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    const updated = reordered.map((h, i) => ({ ...h, orden: i + 1 }))
    setLocalHabitos(updated)
    Promise.all(updated.map((h, i) => supabase.from('habitos').update({ orden: i + 1 }).eq('id', h.id)))
  }

  function handleDragDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) return
    const fromIdx = localHabitos.findIndex(h => h.id === draggingId)
    const toIdx = localHabitos.findIndex(h => h.id === targetId)
    setDraggingId(null)
    setDragOverId(null)
    reorderPersonal(fromIdx, toIdx)
  }

  function moveHabito(id: string, dir: 'up' | 'down') {
    const idx = localHabitos.findIndex(h => h.id === id)
    const newIdx = dir === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= localHabitos.length) return
    reorderPersonal(idx, newIdx)
  }

  // Month stats
  const daysInMonthNum = new Date(year, month, 0).getDate()
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysWithData = new Set(monthRegistros.map(r => r.fecha))
  const totalDias = daysWithData.size
  const eficienciaSum = [...daysWithData].reduce((acc, d) => acc + getDayPct(d), 0)
  const eficienciaPromedio = totalDias > 0 ? Math.round(eficienciaSum / totalDias) : 0
  const totalIngresos = monthFinanzas.reduce((a, f) => a + (f.ingresos || 0), 0)
  const totalGastos = monthFinanzas.reduce((a, f) => a + (f.gastos || 0), 0)
  const profit = totalIngresos - totalGastos
  const inversionMes = monthItems.filter(i => i.categoria === 'Inversión' && i.tipo === 'gasto').reduce((a, i) => a + i.monto, 0)
  const diasAhorro = monthFinanzas.filter(d => d.ahorro)
  const ahorroEstimado = diasAhorro.reduce((a, d) => a + Math.round((d.ingresos || 0) * 0.1), 0)
  const ahorroAcumulado = inversionMes > 0 ? inversionMes : ahorroEstimado

  const ingresosHoy = finanzas.ingresos
  const gastosHoy = finanzas.gastos
  const inversionHoy = finanzaItems.filter(i => i.categoria === 'Inversión').reduce((a, i) => a + i.monto, 0)

  // Locale-aware day abbreviations: index 0=Sun, 1=Mon, ..., 6=Sat
  const localeCode = locale === 'es' ? 'es-AR' : locale
  const diasNarrow = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(localeCode, { weekday: 'narrow' }).format(new Date(2025, 0, 5 + i))
  )
  const diasShort = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(localeCode, { weekday: 'short' }).format(new Date(2025, 0, 5 + i)).replace('.', '').slice(0, 2)
  )
  const gastosNoInv = gastosHoy - inversionHoy
  const libreHoy = ingresosHoy - gastosHoy
  const sugerido10 = Math.round(ingresosHoy * 0.1)

  const navBtn = (tab: typeof activeTab, label: string, emoji: string) => (
    <button onClick={() => setActiveTab(tab)} style={{
      flex: 1, padding: '0.5rem 0.25rem', borderRadius: '8px', border: 'none',
      background: activeTab === tab ? 'rgba(139,92,246,0.25)' : 'transparent',
      color: activeTab === tab ? '#a78bfa' : '#6b7280',
      fontWeight: activeTab === tab ? 700 : 400,
      fontSize: '0.72rem', cursor: 'pointer', transition: 'all 0.15s',
    }}>{emoji} {label}</button>
  )

  if (localHabitos.length === 0 && activeTab === 'hoy') {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✨</div>
        <p style={{ color: '#9ca3af', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 600 }}>{t('tablero.hoy.sin_habitos')}</p>
        <p style={{ color: '#6b7280', fontSize: '0.82rem', marginBottom: '1.5rem' }}>{t('tablero.hoy.sin_habitos_sub')}</p>
        <button onClick={() => setActiveTab('habitos')} style={{
          padding: '0.7rem 1.5rem', borderRadius: '10px', border: 'none',
          background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
          color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
        }}>
          {t('tablero.hoy.sin_habitos_cta')}
        </button>
      </div>
    )
  }

  return (
    <>
      <OnboardingTutorial />
      {/* Tab nav */}
      <div style={{
        display: 'flex', gap: '0.2rem', padding: '0.25rem',
        background: 'rgba(255,255,255,0.04)', borderRadius: '10px', marginBottom: '1.25rem',
      }}>
        {navBtn('hoy', t('tablero.tabs.hoy'), '⚡')}
        {navBtn('mes', t('tablero.tabs.mes'), '📊')}
        {navBtn('finanzas', t('tablero.tabs.finanzas'), '💰')}
        {navBtn('habitos', t('tablero.tabs.habitos'), '✏️')}
        {navBtn('metas', t('tablero.tabs.metas'), '🎯')}
      </div>

      {/* ── HOY ── */}
      {activeTab === 'hoy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Ring + racha */}
          <div style={{
            background: '#1a1730', borderRadius: '16px', border: '1px solid rgba(139,92,246,0.15)',
            padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem',
          }}>
            <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
              <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(139,92,246,0.12)" strokeWidth="6"/>
                <circle cx="36" cy="36" r="30" fill="none"
                  stroke={pct === 100 ? '#10b981' : '#8B5CF6'} strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - pct / 100)}`}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pct === 100 ? '#6ee7b7' : '#a78bfa', fontWeight: 700, fontSize: '1rem' }}>
                {pct}%
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>{completados}/{habitosHoy.length} {t('tablero.hoy.habitos')}</div>
              <div style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                {pct === 100 ? t('tablero.hoy.perfect') : pct >= 50 ? t('tablero.hoy.going_well') : t('tablero.hoy.start_one')}
              </div>
            </div>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '0.5rem 0.875rem',
              background: racha > 0 ? 'rgba(251,146,60,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${racha > 0 ? 'rgba(251,146,60,0.25)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '12px', flexShrink: 0,
            }}>
              <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{racha > 0 ? '🔥' : '💤'}</span>
              <span style={{ color: racha > 0 ? '#fb923c' : '#4b5563', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>{racha}</span>
              <span style={{ color: '#6b7280', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('tablero.hoy.racha')}</span>
              {(() => {
                const level = pct < 25 ? 0 : pct < 50 ? 1 : pct < 75 ? 2 : pct < 100 ? 3 : 4
                const barColors = ['#7c3aed', '#f59e0b', '#fb923c', '#10b981']
                return (
                  <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', marginTop: '0.3rem' }}>
                    {[1, 2, 3, 4].map(bar => (
                      <div key={bar} style={{
                        width: 5,
                        height: 5 + bar * 3,
                        borderRadius: 2,
                        background: bar <= level ? barColors[bar - 1] : 'rgba(255,255,255,0.08)',
                      }} />
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Habit list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {habitosHoy.map(h => {
              const reg = regMap[h.id]
              const done = h.tipo === 'boolean' ? reg?.valor_bool === true : (reg?.valor_numero ?? 0) > 0
              return (
                <div key={h.id} style={{
                  background: '#1a1730',
                  border: `1px solid ${done ? 'rgba(139,92,246,0.35)' : 'rgba(139,92,246,0.1)'}`,
                  borderRadius: '14px', padding: '1rem 1.125rem',
                  display: 'flex', alignItems: 'center', gap: '0.875rem', transition: 'border-color 0.2s',
                  borderLeft: `3px solid ${catColor(h.categoria)}`,
                }}>
                  <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{h.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: h.tipo === 'numero' ? '0.5rem' : '0.25rem' }}>
                      <span style={{ color: done ? '#a78bfa' : '#d1d5db', fontWeight: 500, fontSize: '0.9rem' }}>{h.nombre}</span>
                      {rachaHabito(h.id) > 1 && (
                        <span style={{ fontSize: '0.6rem', color: '#fb923c', fontWeight: 700 }}>🔥{rachaHabito(h.id)}d</span>
                      )}
                    </div>
                    {h.tipo === 'numero' && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: h.meta_numero ? '0.4rem' : 0 }}>
                          <button onClick={() => stepNumero(h, -1)}
                            style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(0,0,0,0.3)', color: '#9ca3af', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>−</button>
                          <input
                            type="number" min="0"
                            value={numValues[h.id] ?? 0}
                            onChange={e => setNumero(h, e.target.value)}
                            onBlur={() => saveNumero(h)}
                            style={{ width: '52px', padding: '0.35rem 0.4rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(139,92,246,0.2)', color: '#fff', fontSize: '0.95rem', fontWeight: 700, outline: 'none', textAlign: 'center' }} />
                          <button onClick={() => stepNumero(h, 1)}
                            style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
                          {h.unidad && <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{h.unidad}</span>}
                        </div>
                        {h.meta_numero && (
                          <div>
                            <div style={{ height: '4px', borderRadius: '99px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: '0.2rem' }}>
                              <div style={{ height: '100%', borderRadius: '99px', transition: 'width 0.3s ease',
                                width: `${Math.min(100, Math.round(((numValues[h.id] ?? 0) / h.meta_numero) * 100))}%`,
                                background: (numValues[h.id] ?? 0) >= h.meta_numero ? '#10b981' : '#8B5CF6' }} />
                            </div>
                            <span style={{ fontSize: '0.62rem', color: '#4b5563' }}>
                              {numValues[h.id] ?? 0}/{h.meta_numero} {h.unidad}
                              {(numValues[h.id] ?? 0) >= h.meta_numero && ' ✓'}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {/* Nota del día */}
                    {notaOpen === h.id ? (
                      <div style={{ marginTop: '0.5rem' }}>
                        <textarea
                          value={notaInputs[h.id] ?? ''}
                          onChange={e => setNotaInputs(prev => ({ ...prev, [h.id]: e.target.value }))}
                          placeholder={t('tablero.hoy.nota_placeholder')}
                          rows={2}
                          autoFocus
                          style={{ width: '100%', padding: '0.5rem 0.625rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)', color: '#e5e7eb', fontSize: '0.8rem', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem' }}>
                          <button onClick={() => saveNota(h)} disabled={notaSaving === h.id}
                            style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', border: 'none', background: '#8B5CF6', color: 'white', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                            {notaSaving === h.id ? '...' : t('common.save')}
                          </button>
                          <button onClick={() => setNotaOpen(null)}
                            style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#6b7280', fontSize: '0.72rem', cursor: 'pointer' }}>{t('common.cancel')}</button>
                        </div>
                      </div>
                    ) : (
                      notaInputs[h.id] && (
                        <div onClick={() => setNotaOpen(h.id)} style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: '#6b7280', cursor: 'pointer', fontStyle: 'italic', lineHeight: 1.4 }}>
                          📝 {notaInputs[h.id]}
                        </div>
                      )
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                    {h.tipo === 'boolean' && (
                      <button onClick={() => toggleBool(h)} disabled={loading === h.id} style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: done ? '#8B5CF6' : 'rgba(139,92,246,0.1)',
                        border: `2px solid ${done ? '#8B5CF6' : 'rgba(139,92,246,0.3)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: '1rem',
                        opacity: loading === h.id ? 0.6 : 1,
                        transform: habitoFeedback === h.id ? 'scale(1.25)' : 'scale(1)',
                        transition: 'all 0.2s',
                      }}>{done ? '✓' : ''}</button>
                    )}
                    <button onClick={() => setNotaOpen(notaOpen === h.id ? null : h.id)}
                      title="Agregar nota"
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: notaInputs[h.id] ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)', color: notaInputs[h.id] ? '#a78bfa' : '#4b5563', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      📝
                    </button>
                    <button onClick={() => setHistorialOpen(h.id)}
                      title="Ver historial"
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.04)', color: '#4b5563', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      📊
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Semana en revisión */}
          {(() => {
            const semana: { fecha: string; label: string; pct: number }[] = []
            const fmtDia = (d: Date) => new Intl.DateTimeFormat(locale === 'es' ? 'es-AR' : locale, { weekday: 'short' }).format(d).replace('.', '')
            for (let i = 6; i >= 0; i--) {
              const d = new Date(today + 'T12:00:00')
              d.setDate(d.getDate() - i)
              const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
              const regsDelDia = historial.filter(r => r.fecha === fecha)
              const hechos = regsDelDia.filter(r => r.valor_bool === true || (r.valor_numero != null && r.valor_numero > 0)).length
              const habitosDia = localHabitos.filter(h => isHoy(h, d.getDay()))
              const total = habitosDia.length
              const pct = total > 0 && regsDelDia.length > 0 ? Math.round((hechos / total) * 100) : (fecha === today ? Math.round((completados / total) * 100) : 0)
              semana.push({ fecha, label: i === 0 ? t('tablero.tabs.hoy') : fmtDia(d), pct })
            }
            const semPct = Math.round(semana.reduce((a, d) => a + d.pct, 0) / 7)
            const mejorDia = semana.reduce((best, d) => d.pct > best.pct ? d : best, semana[0])
            return (
              <div style={{ background: '#1a1730', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1rem 1.125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                  <span style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600 }}>{t('tablero.hoy.semana_revision')}</span>
                  <span style={{ fontSize: '0.75rem', color: semPct >= 70 ? '#10b981' : semPct >= 40 ? '#a78bfa' : '#6b7280', fontWeight: 700 }}>{semPct}{t('tablero.hoy.semana_promedio')}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'flex-end', height: '48px', marginBottom: '0.625rem' }}>
                  {semana.map(({ fecha, label, pct }) => {
                    const isToday = fecha === today
                    const barH = Math.max(4, Math.round((pct / 100) * 40))
                    const barColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#8B5CF6' : pct > 0 ? '#6b7280' : 'rgba(255,255,255,0.06)'
                    return (
                      <div key={fecha} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                        <div style={{ fontSize: '0.6rem', color: isToday ? '#a78bfa' : '#4b5563', fontWeight: isToday ? 700 : 400 }}>{pct > 0 ? `${pct}%` : ''}</div>
                        <div style={{ width: '100%', height: `${barH}px`, borderRadius: '3px', background: barColor, transition: 'height 0.3s', outline: isToday ? '1px solid rgba(139,92,246,0.5)' : 'none' }} />
                        <div style={{ fontSize: '0.62rem', color: isToday ? '#a78bfa' : '#6b7280', fontWeight: isToday ? 700 : 400 }}>{label}</div>
                      </div>
                    )
                  })}
                </div>
                {mejorDia.pct > 0 && <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{t('tablero.hoy.mejor_dia')} <span style={{ color: '#a78bfa', fontWeight: 600 }}>{mejorDia.label}</span> {t('tablero.hoy.mejor_dia_pct', { pct: mejorDia.pct })}</div>}
              </div>
            )
          })()}

          {/* Finanzas */}
          <div style={{ background: '#1a1730', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600, marginBottom: '0.875rem' }}>{t('tablero.hoy.movimientos')}</div>

            {/* Tipo buttons */}
            <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem' }}>
              {itemCategoria !== 'Inversión' && (
                <>
                  <button onClick={() => setItemTipo('ingreso')} style={{
                    padding: '0.5rem 0.875rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: itemTipo === 'ingreso' ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.06)',
                    color: '#10b981', fontSize: '0.78rem', fontWeight: itemTipo === 'ingreso' ? 700 : 400,
                    outline: itemTipo === 'ingreso' ? '1.5px solid rgba(16,185,129,0.5)' : '1px solid rgba(16,185,129,0.15)',
                    transition: 'all 0.15s',
                  }}>{t('tablero.hoy.ingreso_btn')}</button>
                  <button onClick={() => setItemTipo('gasto')} style={{
                    padding: '0.5rem 0.875rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: itemTipo === 'gasto' ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.06)',
                    color: '#ef4444', fontSize: '0.78rem', fontWeight: itemTipo === 'gasto' ? 700 : 400,
                    outline: itemTipo === 'gasto' ? '1.5px solid rgba(239,68,68,0.5)' : '1px solid rgba(239,68,68,0.15)',
                    transition: 'all 0.15s',
                  }}>{t('tablero.hoy.gasto_btn')}</button>
                </>
              )}
              {itemCategoria === 'Inversión' && (
                <button
                  onClick={() => { setItemCategoria(null); setItemTipo('ingreso'); setItemMonto('') }}
                  style={{ padding: '0.5rem 0.875rem', borderRadius: '8px', background: 'rgba(245,197,24,0.15)', border: '1px solid rgba(245,197,24,0.35)', color: '#F5C518', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {t('tablero.hoy.inversion_tipo')}
                  <span style={{ fontSize: '1rem', lineHeight: 1, opacity: 0.7 }}>×</span>
                </button>
              )}
            </div>

            {/* Categoría chips */}
            {finanzaCategorias.length > 0 && (
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.625rem' }}>
                {finanzaCategorias.map(cat => (
                  <button key={cat.id}
                    onClick={() => {
                      const next = itemCategoria === cat.nombre ? null : cat.nombre
                      setItemCategoria(next)
                      if (next === 'Inversión') setItemTipo('gasto')
                    }}
                    style={{
                      padding: '0.3rem 0.6rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.72rem',
                      background: itemCategoria === cat.nombre ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.05)',
                      color: itemCategoria === cat.nombre ? '#a78bfa' : '#6b7280',
                      outline: itemCategoria === cat.nombre ? '1px solid rgba(139,92,246,0.4)' : 'none',
                      fontWeight: itemCategoria === cat.nombre ? 700 : 400, transition: 'all 0.12s',
                    }}
                  >{cat.emoji} {cat.nombre}</button>
                ))}
              </div>
            )}

            {/* Monto + descripcion + Agregar */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
              <input
                type="number" value={itemMonto} onChange={e => setItemMonto(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addFinanzaItem()}
                placeholder={t('tablero.hoy.monto_placeholder')}
                style={{ width: '90px', padding: '0.55rem 0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${itemCategoria === 'Inversión' ? 'rgba(245,197,24,0.3)' : itemTipo === 'ingreso' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: '#f3f0ff', fontSize: '0.9rem', fontWeight: 700, outline: 'none', flexShrink: 0 }}
              />
              <input
                value={itemDesc} onChange={e => setItemDesc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addFinanzaItem()}
                placeholder={t('tablero.hoy.detalle_placeholder')}
                style={{ flex: 1, minWidth: '80px', padding: '0.55rem 0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: '0.8rem', outline: 'none' }}
              />
              <button onClick={addFinanzaItem} disabled={itemAdding || !itemMonto} style={{
                padding: '0.55rem 0.875rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: 'rgba(139,92,246,0.25)', color: '#a78bfa', fontSize: '0.82rem', fontWeight: 700, flexShrink: 0,
                opacity: !itemMonto ? 0.5 : 1,
              }}>
                {itemAdding ? '...' : t('tablero.hoy.agregar')}
              </button>
            </div>

            {/* Lista de items del día */}
            {finanzaItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.875rem' }}>
                {finanzaItems.map(item => {
                  const isInv = item.categoria === 'Inversión'
                  const itemColor = item.tipo === 'ingreso' ? '#10b981' : isInv ? '#F5C518' : '#ef4444'
                  const itemBg = item.tipo === 'ingreso' ? 'rgba(16,185,129,0.06)' : isInv ? 'rgba(245,197,24,0.06)' : 'rgba(239,68,68,0.06)'
                  const itemBorder = item.tipo === 'ingreso' ? 'rgba(16,185,129,0.18)' : isInv ? 'rgba(245,197,24,0.25)' : 'rgba(239,68,68,0.18)'
                  return (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.5rem 0.75rem', borderRadius: '8px',
                      background: itemBg, border: `1px solid ${itemBorder}`,
                    }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: itemColor, flexShrink: 0 }}>
                        {item.tipo === 'ingreso' ? '+' : '-'}{fmt(item.monto)}
                      </span>
                      {item.categoria && (
                        <span style={{ fontSize: '0.68rem', color: '#6b7280', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', padding: '0.1rem 0.4rem', flexShrink: 0 }}>
                          {finanzaCategorias.find(c => c.nombre === item.categoria)?.emoji} {item.categoria}
                        </span>
                      )}
                      {item.descripcion && (
                        <span style={{ fontSize: '0.78rem', color: '#9ca3af', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.descripcion}
                        </span>
                      )}
                      <button onClick={() => deleteFinanzaItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', fontSize: '1rem', padding: '0 2px', marginLeft: 'auto', flexShrink: 0 }}>×</button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Inversión del día */}
            {ingresosHoy > 0 && (
              <div style={{ marginBottom: '0.875rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(245,197,24,0.07)', border: '1px solid rgba(245,197,24,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>{t('tablero.hoy.regla10')}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F5C518', marginTop: '0.1rem' }}>
                      {t('tablero.hoy.regla10_sugeridos', { amount: fmt(sugerido10) })}
                    </div>
                  </div>
                  {inversionHoy > 0 ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.62rem', color: '#10b981', fontWeight: 700 }}>{t('tablero.hoy.regla10_registrado')}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>{fmt(inversionHoy)}</div>
                    </div>
                  ) : (
                    <button onClick={() => { setItemCategoria('Inversión'); setItemMonto(String(sugerido10)) }} style={{
                      padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(245,197,24,0.3)', background: 'rgba(245,197,24,0.1)', color: '#F5C518', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                    }}>{t('tablero.hoy.regla10_aplicar')}</button>
                  )}
                </div>
              </div>
            )}

            {/* Ahorro del día — toggle explícito */}
            <button onClick={toggleAhorro} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
              background: finanzas.ahorro ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${finanzas.ahorro ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
              cursor: 'pointer', textAlign: 'left', marginBottom: '0.5rem',
            }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                background: finanzas.ahorro ? '#10b981' : 'transparent',
                border: `2px solid ${finanzas.ahorro ? '#10b981' : '#4b5563'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {finanzas.ahorro && <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 900, lineHeight: 1 }}>✓</span>}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: finanzas.ahorro ? '#10b981' : '#9ca3af' }}>
                🐷 {finanzas.ahorro ? t('tablero.hoy.ahorro_si') : t('tablero.hoy.ahorro_no')}
              </span>
            </button>

            {/* Balance desglosado */}
            {(ingresosHoy > 0 || gastosHoy > 0) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {ingresosHoy > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '7px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{t('tablero.hoy.ingresos_balance')}</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>+{fmt(ingresosHoy)}</span>
                  </div>
                )}
                {gastosNoInv > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '7px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{t('tablero.hoy.gastos_balance')}</span>
                    <span style={{ fontWeight: 700, color: '#ef4444' }}>-{fmt(gastosNoInv)}</span>
                  </div>
                )}
                {inversionHoy > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '7px', background: 'rgba(245,197,24,0.06)', border: '1px solid rgba(245,197,24,0.15)' }}>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{t('tablero.hoy.inversion_balance')}</span>
                    <span style={{ fontWeight: 700, color: '#F5C518' }}>-{fmt(inversionHoy)}</span>
                  </div>
                )}
                {finanzas.ahorro && inversionHoy === 0 && sugerido10 > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '7px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>🐷 {t('tablero.mes.ahorro10')}</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>{fmt(sugerido10)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', borderRadius: '8px', background: libreHoy >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${libreHoy >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, marginTop: '0.1rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e5e7eb' }}>📊 {t('tablero.hoy.resultado_dia')}</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: libreHoy >= 0 ? '#10b981' : '#ef4444' }}>
                    {libreHoy >= 0 ? '+' : ''}{fmt(libreHoy)}
                  </span>
                </div>
                {libreHoy < 0 && (
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', fontStyle: 'italic', textAlign: 'center' }}>
                    {t('tablero.hoy.dia_rojo')}
                  </div>
                )}
              </div>
            )}

            {/* Link al análisis completo */}
            {(ingresosHoy > 0 || gastosHoy > 0) && (
              <button onClick={() => setActiveTab('finanzas')} style={{
                marginTop: '0.75rem', width: '100%', padding: '0.55rem', borderRadius: '8px',
                border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.06)',
                color: '#a78bfa', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              }}>
                {t('tablero.hoy.ver_analisis')}
              </button>
            )}
          </div>

          <RatingPrompt racha={racha} />
        </div>
      )}

      {/* ── MES ── */}
      {activeTab === 'mes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Navigator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }}
              style={{ border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.5rem', padding: '0.25rem 0.5rem' }}>‹</button>
            <span style={{ color: '#e5e7eb', fontWeight: 700, fontSize: '1rem' }}>{mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1)} {year}</span>
            <button onClick={() => { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }}
              style={{ border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.5rem', padding: '0.25rem 0.5rem' }}>›</button>
          </div>

          {monthLoading ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem', fontSize: '0.85rem' }}>{t('common.loading')}</div>
          ) : (
            <>
              {/* Stats cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: t('tablero.mes.eficiencia'), value: `${eficienciaPromedio}%`, color: '#a78bfa', sub: t('tablero.mes.dias_registrados', { n: totalDias }), subColor: '#4b5563' },
                  { label: t('tablero.mes.racha_actual'), value: `${racha} días`, color: '#F5C518', sub: racha > 0 ? '🔥' : t('tablero.mes.sin_racha'), subColor: '#4b5563' },
                  { label: t('tablero.mes.ingresos'), value: fmt(totalIngresos), color: '#10b981', sub: totalGastos > 0 ? `📉 ${fmt(totalGastos)}` : t('tablero.mes.total_mes'), subColor: totalGastos > 0 ? '#ef4444' : '#4b5563' },
                  { label: t('tablero.mes.resultado'), value: (profit > 0 ? '+' : '') + fmt(profit), color: profit >= 0 ? '#10b981' : '#ef4444', sub: profit >= 0 ? t('tablero.mes.ganancia') : t('tablero.mes.perdida'), subColor: '#4b5563' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#1a1730', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem 1.125rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.3rem' }}>{s.label}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '0.68rem', color: s.subColor, marginTop: '0.15rem' }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Ahorro acumulado del mes */}
              {(ahorroAcumulado > 0 || diasAhorro.length > 0) && (
                <div style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(245,197,24,0.05))', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, marginBottom: '0.2rem' }}>{t('tablero.mes.ahorro_acumulado')}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{fmt(ahorroAcumulado)}</div>
                    {diasAhorro.length > 0 && (
                      <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: '0.2rem' }}>
                        {diasAhorro.length} {diasAhorro.length === 1 ? t('tablero.mes.dia_ahorro_singular') : t('tablero.mes.dias_ahorro')}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '2.5rem' }}>🐷</div>
                </div>
              )}

              {/* Heatmap */}
              <div style={{ background: '#1a1730', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                  <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600 }}>{t('tablero.mes.mapa')}</div>
                  <div style={{ fontSize: '0.65rem', color: '#4b5563', fontStyle: 'italic' }}>{t('tablero.mes.mapa_hint')}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '3px', marginBottom: '3px' }}>
                  {diasNarrow.map((d, i) => (
                    <div key={i} style={{ textAlign: 'center', fontSize: '0.6rem', color: '#4b5563', padding: '2px 0' }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '3px' }}>
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonthNum }, (_, i) => i + 1).map(day => {
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const dayPct = getDayPct(dateStr)
                    const isPast = dateStr <= today
                    return (
                      <div key={day} onClick={() => openEditDay(dateStr)}
                        title={isPast ? `${dateStr} · ${dayPct}%` : undefined}
                        style={{
                          aspectRatio: '1', borderRadius: '4px', background: getDayBg(dayPct),
                          border: dateStr === today ? '1.5px solid #8B5CF6' : '1px solid rgba(255,255,255,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.55rem', color: '#6b7280',
                          cursor: isPast ? 'pointer' : 'default',
                        }}
                      >{day}</div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.75rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.62rem', color: '#4b5563' }}>{t('tablero.mes.menos')}</span>
                  {['rgba(255,255,255,0.04)','rgba(139,92,246,0.15)','rgba(139,92,246,0.3)','rgba(139,92,246,0.5)','rgba(139,92,246,0.75)','rgba(16,185,129,0.65)'].map((c, i) => (
                    <div key={i} style={{ width: '12px', height: '12px', borderRadius: '2px', background: c }} />
                  ))}
                  <span style={{ fontSize: '0.62rem', color: '#4b5563' }}>{t('tablero.mes.mas')}</span>
                </div>
              </div>

              {/* Cumplimiento por hábito */}
              {totalDias > 0 && (
                <div style={{ background: '#1a1730', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600, marginBottom: '1rem' }}>{t('tablero.mes.cumplimiento')}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {localHabitos.map(h => {
                      const count = monthRegistros.filter(r => r.habito_id === h.id && (r.valor_bool === true || (r.valor_numero !== null && r.valor_numero > 0))).length
                      const p = totalDias > 0 ? Math.round(count / totalDias * 100) : 0
                      return (
                        <div key={h.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#d1d5db' }}>{h.emoji} {h.nombre}</span>
                            <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 700 }}>{count}/{totalDias} · {p}%</span>
                          </div>
                          <div style={{ height: '5px', borderRadius: '99px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: '99px', width: `${p}%`, background: p === 100 ? '#10b981' : 'linear-gradient(90deg,#8B5CF6,#EC4899)' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Resumen financiero */}
              {(totalIngresos > 0 || totalGastos > 0) && (
                <div style={{ background: '#1a1730', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600, marginBottom: '1rem' }}>{t('tablero.mes.resumen_fin')}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{t('tablero.mes.ingresos')}</span>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>{fmt(totalIngresos)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{t('tablero.mes.gastos_label')}</span>
                      <span style={{ fontWeight: 700, color: '#ef4444' }}>{fmt(totalGastos - inversionMes)}</span>
                    </div>
                    {inversionMes > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{t('tablero.mes.inversion_label')}</span>
                        <span style={{ fontWeight: 700, color: '#F5C518' }}>{fmt(inversionMes)}</span>
                      </div>
                    )}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.625rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e5e7eb' }}>{t('tablero.mes.resultado_neto')}</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: profit >= 0 ? '#10b981' : '#ef4444' }}>{profit >= 0 ? '+' : ''}{fmt(profit)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Desglose ingresos + gastos por categoría */}
              {monthItems.length > 0 && (() => {
                const buildFilas = (items: typeof monthItems, prefix: string) => {
                  const cats = finanzaCategorias.map(cat => ({
                    id: cat.id, nombre: cat.nombre, emoji: cat.emoji,
                    total: items.filter(i => i.categoria === cat.nombre).reduce((a, i) => a + i.monto, 0),
                  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)
                  const sinCat = items.filter(i => !i.categoria || !finanzaCategorias.some(c => c.nombre === i.categoria)).reduce((a, i) => a + i.monto, 0)
                  return sinCat > 0 ? [...cats, { id: `__otros_${prefix}__`, nombre: t('tablero.mes.sin_categoria'), emoji: '❓', total: sinCat }] : cats
                }
                const ingresosMes = monthItems.filter(i => i.tipo === 'ingreso')
                const gastosMes = monthItems.filter(i => i.tipo === 'gasto')
                const filasIng = buildFilas(ingresosMes, 'ing')
                const filasGas = buildFilas(gastosMes, 'gas')
                if (filasIng.length === 0 && filasGas.length === 0) return null
                const totalIngMes = ingresosMes.reduce((a, i) => a + i.monto, 0)
                const totalGasMes = gastosMes.reduce((a, i) => a + i.monto, 0)
                const maxIng = Math.max(...filasIng.map(c => c.total), 1)
                const maxGas = Math.max(...filasGas.map(c => c.total), 1)
                const renderFilas = (filas: typeof filasGas, total: number, max: number, tipo: 'ingreso' | 'gasto') =>
                  filas.map(cat => {
                    const pct = total > 0 ? Math.round(cat.total / total * 100) : 0
                    const isInv = cat.nombre === 'Inversión'
                    const isSin = cat.id.startsWith('__otros_')
                    const barColor = tipo === 'ingreso' ? 'linear-gradient(90deg,#10b981,#34d399)' : isInv ? 'linear-gradient(90deg,#F5C518,#f59e0b)' : isSin ? 'linear-gradient(90deg,#6b7280,#9ca3af)' : 'linear-gradient(90deg,#ef4444,#f87171)'
                    const textColor = tipo === 'ingreso' ? '#10b981' : isInv ? '#F5C518' : isSin ? '#9ca3af' : '#ef4444'
                    return (
                      <div key={cat.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: isSin ? '#6b7280' : '#d1d5db' }}>{cat.emoji} {cat.nombre}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.68rem', color: '#4b5563', fontWeight: 600 }}>{pct}%</span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: textColor }}>{tipo === 'ingreso' ? '+' : '-'}{fmt(cat.total)}</span>
                          </div>
                        </div>
                        <div style={{ height: '5px', borderRadius: '99px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '99px', width: `${Math.round(cat.total / max * 100)}%`, background: barColor, transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    )
                  })
                return (
                  <div style={{ background: '#1a1730', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600, marginBottom: '1rem' }}>{t('tablero.mes.desglose_titulo')}</div>
                    {filasIng.length > 0 && (
                      <>
                        <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>💚 {t('tablero.mes.ingresos')}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.625rem' }}>
                          {renderFilas(filasIng, totalIngMes, maxIng, 'ingreso')}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: filasGas.length > 0 ? '0.875rem' : 0 }}>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{t('tablero.mes.total_ingresos_mes')}</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>+{fmt(totalIngMes)}</span>
                        </div>
                      </>
                    )}
                    {filasGas.length > 0 && (
                      <>
                        {filasIng.length > 0 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.875rem' }} />}
                        <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>🔴 {t('tablero.mes.gastos_label')}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {renderFilas(filasGas, totalGasMes, maxGas, 'gasto')}
                        </div>
                        <div style={{ marginTop: '0.875rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{t('tablero.mes.total_gastos')}</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ef4444' }}>{fmt(totalGasMes)}</span>
                        </div>
                      </>
                    )}
                  </div>
                )
              })()}
            </>
          )}
        </div>
      )}

      {/* ── HÁBITOS ── */}
      {activeTab === 'habitos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Lista unificada de hábitos */}
          <div style={{ background: '#1a1730', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600 }}>{t('tablero.habitos.personales')}</div>
              <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{t('tablero.habitos.contador').replace('{n}', String(localHabitos.length))}</span>
            </div>

            {localHabitos.length === 0 && !showAddHabito && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#4b5563', fontSize: '0.82rem' }}>
                {t('tablero.habitos.sin_personales')}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.875rem' }}>
              {localHabitos.map(h => (
                <div
                  key={h.id}
                  draggable={!editingHabito}
                  onDragStart={() => setDraggingId(h.id)}
                  onDragOver={e => { e.preventDefault(); setDragOverId(h.id) }}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={() => handleDragDrop(h.id)}
                  onDragEnd={() => { setDraggingId(null); setDragOverId(null) }}
                  style={{ opacity: draggingId === h.id ? 0.4 : 1, transition: 'opacity 0.15s' }}
                >
                  {editingHabito?.id === h.id ? (
                    <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', padding: '1rem' }}>
                      <div style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: 700, marginBottom: '0.75rem' }}>{t('tablero.habitos.editar', { name: h.nombre })}</div>
                      <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder={t('tablero.habitos.nombre_placeholder')}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.25)', color: '#f3f0ff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', marginBottom: '0.75rem' }} />
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.4rem' }}>{t('tablero.habitos.frecuencia')}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                          <button onClick={() => setNuevoDiasSemana(null)} style={{ padding: '0.3rem 0.625rem', borderRadius: '6px', border: 'none', fontSize: '0.75rem', background: nuevoDiasSemana === null ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)', color: nuevoDiasSemana === null ? '#a78bfa' : '#6b7280', fontWeight: nuevoDiasSemana === null ? 700 : 400, cursor: 'pointer' }}>{t('tablero.habitos.todos_dias')}</button>
                          {diasNarrow.map((d, i) => {
                            const sel = nuevoDiasSemana?.includes(i) ?? false
                            return <button key={i} onClick={() => {
                              if (nuevoDiasSemana === null) { setNuevoDiasSemana([i]) }
                              else if (sel) { const next = nuevoDiasSemana.filter(x => x !== i); setNuevoDiasSemana(next.length === 0 ? null : next) }
                              else { setNuevoDiasSemana([...nuevoDiasSemana, i]) }
                            }} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', fontSize: '0.78rem', background: sel ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.05)', color: sel ? '#a78bfa' : '#6b7280', fontWeight: sel ? 700 : 400, cursor: 'pointer' }}>{d}</button>
                          })}
                        </div>
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.4rem' }}>{t('tablero.habitos.categoria_label')}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                          {CATEGORIAS.map(c => (
                            <button key={String(c.id)} onClick={() => setNuevoCategoria(c.id)} style={{
                              padding: '0.3rem 0.625rem', borderRadius: '6px', border: 'none', fontSize: '0.75rem',
                              background: nuevoCategoria === c.id ? `${c.color}22` : 'rgba(255,255,255,0.05)',
                              color: nuevoCategoria === c.id ? c.color : '#6b7280',
                              fontWeight: nuevoCategoria === c.id ? 700 : 400, cursor: 'pointer',
                              outline: nuevoCategoria === c.id ? `1px solid ${c.color}66` : 'none',
                            }}>{c.label}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.4rem' }}>{t('tablero.habitos.emoji_label')}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.875rem' }}>
                        {EMOJIS.map(e => <button key={e} onClick={() => setNuevoEmoji(e)} style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', fontSize: '1rem', background: nuevoEmoji === e ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.06)', cursor: 'pointer' }}>{e}</button>)}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={saveEditHabito} disabled={!nuevoNombre.trim() || habitoSaving}
                          style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', background: nuevoNombre.trim() ? '#8b5cf6' : 'rgba(139,92,246,0.3)', color: 'white', fontWeight: 600, fontSize: '0.82rem', cursor: nuevoNombre.trim() ? 'pointer' : 'default' }}>
                          {habitoSaving ? t('common.saving') : t('common.save')}
                        </button>
                        <button onClick={() => { setEditingHabito(null); setNuevoNombre('') }}
                          style={{ padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9ca3af', fontSize: '0.82rem', cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.7rem 0.875rem', borderRadius: '10px',
                      background: dragOverId === h.id ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)',
                      border: dragOverId === h.id ? '1px dashed rgba(139,92,246,0.4)' : '1px solid transparent',
                      cursor: 'grab', transition: 'background 0.1s, border 0.1s',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 }}>
                        <button onClick={() => moveHabito(h.id, 'up')}
                          style={{ width: '20px', height: '18px', border: 'none', background: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.65rem', lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
                        <button onClick={() => moveHabito(h.id, 'down')}
                          style={{ width: '20px', height: '18px', border: 'none', background: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.65rem', lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
                      </div>
                      <span style={{ fontSize: '1.1rem' }}>{h.emoji}</span>
                      <span style={{ fontSize: '0.875rem', color: '#e5e7eb', flex: 1 }}>{h.nombre}</span>
                      {h.categoria && <span style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: `${catColor(h.categoria)}22`, color: catColor(h.categoria), fontWeight: 600, flexShrink: 0 }}>{CATEGORIAS.find(c => c.id === h.categoria)?.label}</span>}
                      {h.dias_semana && h.dias_semana.length > 0 && <span style={{ fontSize: '0.6rem', color: '#6b7280', flexShrink: 0 }}>📅 {[...h.dias_semana].sort((a, b) => a - b).map(d => diasShort[d]).join(' ')}</span>}
                      {h.tipo === 'numero' && h.unidad && <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{h.unidad}</span>}
                      <button onClick={() => { setEditingHabito(h); setNuevoNombre(h.nombre); setNuevoEmoji(h.emoji); setNuevoTipo(h.tipo as 'boolean' | 'numero'); setNuevoCategoria(h.categoria ?? null); setNuevoDiasSemana(h.dias_semana ?? null) }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px', fontSize: '0.9rem' }}>✏️</button>
                      <button onClick={() => deleteHabito(h.id)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.7)', padding: '2px', fontSize: '0.9rem' }}>🗑️</button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {showAddHabito && !editingHabito && (
              <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', padding: '1rem', marginBottom: '0.875rem' }}>
                <div style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: 700, marginBottom: '0.75rem' }}>{t('tablero.habitos.nuevo')}</div>
                <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder={t('tablero.habitos.nombre_placeholder')} autoFocus
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.25)', color: '#f3f0ff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', marginBottom: '0.75rem' }} />
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.4rem' }}>{t('tablero.habitos.tipo')}</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(['boolean', 'numero'] as const).map(tipo => (
                      <button key={tipo} onClick={() => setNuevoTipo(tipo)} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', background: nuevoTipo === tipo ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)', color: nuevoTipo === tipo ? '#a78bfa' : '#6b7280', fontWeight: nuevoTipo === tipo ? 700 : 400, fontSize: '0.82rem', cursor: 'pointer' }}>
                        {tipo === 'boolean' ? t('tablero.habitos.si_no') : t('tablero.habitos.numero')}
                      </button>
                    ))}
                  </div>
                </div>
                {nuevoTipo === 'numero' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input value={nuevoUnidad} onChange={e => setNuevoUnidad(e.target.value)} placeholder={t('tablero.habitos.unidad_placeholder')}
                      style={{ padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.25)', color: '#f3f0ff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                    <input type="number" min="1" value={nuevoMeta} onChange={e => setNuevoMeta(e.target.value)} placeholder={t('tablero.habitos.meta_placeholder')}
                      style={{ padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.25)', color: '#f3f0ff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                )}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.4rem' }}>{t('tablero.habitos.frecuencia')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    <button onClick={() => setNuevoDiasSemana(null)} style={{ padding: '0.3rem 0.625rem', borderRadius: '6px', border: 'none', fontSize: '0.75rem', background: nuevoDiasSemana === null ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)', color: nuevoDiasSemana === null ? '#a78bfa' : '#6b7280', fontWeight: nuevoDiasSemana === null ? 700 : 400, cursor: 'pointer' }}>{t('tablero.habitos.todos_dias')}</button>
                    {DIAS_CORTOS.map((d, i) => {
                      const sel = nuevoDiasSemana?.includes(i) ?? false
                      return <button key={i} onClick={() => {
                        if (nuevoDiasSemana === null) { setNuevoDiasSemana([i]) }
                        else if (sel) { const next = nuevoDiasSemana.filter(x => x !== i); setNuevoDiasSemana(next.length === 0 ? null : next) }
                        else { setNuevoDiasSemana([...nuevoDiasSemana, i]) }
                      }} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', fontSize: '0.78rem', background: sel ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.05)', color: sel ? '#a78bfa' : '#6b7280', fontWeight: sel ? 700 : 400, cursor: 'pointer' }}>{d}</button>
                    })}
                  </div>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.4rem' }}>{t('tablero.habitos.categoria_label')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {CATEGORIAS.map(c => (
                      <button key={String(c.id)} onClick={() => setNuevoCategoria(c.id)} style={{
                        padding: '0.3rem 0.625rem', borderRadius: '6px', border: 'none', fontSize: '0.75rem',
                        background: nuevoCategoria === c.id ? `${c.color}22` : 'rgba(255,255,255,0.05)',
                        color: nuevoCategoria === c.id ? c.color : '#6b7280',
                        fontWeight: nuevoCategoria === c.id ? 700 : 400, cursor: 'pointer',
                        outline: nuevoCategoria === c.id ? `1px solid ${c.color}66` : 'none',
                      }}>{c.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.4rem' }}>{t('tablero.habitos.emoji_label')}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.875rem' }}>
                  {EMOJIS.map(e => <button key={e} onClick={() => setNuevoEmoji(e)} style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', fontSize: '1rem', background: nuevoEmoji === e ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.06)', cursor: 'pointer' }}>{e}</button>)}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={addHabito} disabled={!nuevoNombre.trim() || habitoSaving}
                    style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', background: nuevoNombre.trim() ? '#8b5cf6' : 'rgba(139,92,246,0.3)', color: 'white', fontWeight: 600, fontSize: '0.82rem', cursor: nuevoNombre.trim() ? 'pointer' : 'default' }}>
                    {habitoSaving ? t('common.saving') : t('tablero.habitos.agregar')}
                  </button>
                  <button onClick={() => { setShowAddHabito(false); setNuevoNombre(''); setNuevoEmoji('⭐'); setNuevoTipo('boolean'); setNuevoUnidad(''); setNuevoMeta('') }}
                    style={{ padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9ca3af', fontSize: '0.82rem', cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            )}

            {!showAddHabito && !editingHabito && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setShowAddHabito(true)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.75rem', borderRadius: '10px',
                  border: '1px dashed rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.05)',
                  color: '#a78bfa', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                }}>
                  {t('tablero.habitos.crear')}
                </button>
                <button onClick={() => setShowPlantillas(true)} style={{
                  padding: '0.75rem 1rem', borderRadius: '10px',
                  border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.05)',
                  color: '#6b7280', fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  {t('tablero.habitos.plantillas_btn')}
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── FINANZAS ── */}
      {activeTab === 'finanzas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Resumen del mes */}
          {monthLoading ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '1.5rem', fontSize: '0.85rem' }}>{t('common.loading')}</div>
          ) : (totalIngresos > 0 || totalGastos > 0) ? (
            <div style={{ background: '#1a1730', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600, marginBottom: '1rem' }}>
                {t('tablero.finanzas.este_mes')} — {new Intl.DateTimeFormat(locale === 'es' ? 'es-AR' : locale, { month: 'long' }).format(new Date(year, month - 1, 1)).charAt(0).toUpperCase() + new Intl.DateTimeFormat(locale === 'es' ? 'es-AR' : locale, { month: 'long' }).format(new Date(year, month - 1, 1)).slice(1)} {year}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '7px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
                  <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{t('tablero.hoy.ingresos_balance')}</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>+{fmt(totalIngresos)}</span>
                </div>
                {(totalGastos - inversionMes) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '7px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                    <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{t('tablero.hoy.gastos_balance')}</span>
                    <span style={{ fontWeight: 700, color: '#ef4444' }}>-{fmt(totalGastos - inversionMes)}</span>
                  </div>
                )}
                {inversionMes > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '7px', background: 'rgba(245,197,24,0.06)', border: '1px solid rgba(245,197,24,0.15)' }}>
                    <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{t('tablero.hoy.inversion_balance')}</span>
                    <span style={{ fontWeight: 700, color: '#F5C518' }}>-{fmt(inversionMes)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', borderRadius: '8px', background: profit >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${profit >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, marginTop: '0.1rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e5e7eb' }}>📊 {t('tablero.finanzas.resultado')}</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: profit >= 0 ? '#10b981' : '#ef4444' }}>{profit >= 0 ? '+' : ''}{fmt(profit)}</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Desglose ingresos + gastos por categoría */}
          {!monthLoading && monthItems.length > 0 && (() => {
            const buildFilas = (items: typeof monthItems, prefix: string) => {
              const cats = finanzaCategorias.map(cat => ({
                id: cat.id, nombre: cat.nombre, emoji: cat.emoji,
                total: items.filter(i => i.categoria === cat.nombre).reduce((a, i) => a + i.monto, 0),
              })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)
              const sinCat = items.filter(i => !i.categoria || !finanzaCategorias.some(c => c.nombre === i.categoria)).reduce((a, i) => a + i.monto, 0)
              return sinCat > 0 ? [...cats, { id: `__otros_${prefix}__`, nombre: t('tablero.mes.sin_categoria'), emoji: '❓', total: sinCat }] : cats
            }
            const ingresosMes = monthItems.filter(i => i.tipo === 'ingreso')
            const gastosMes = monthItems.filter(i => i.tipo === 'gasto')
            const filasIng = buildFilas(ingresosMes, 'ing')
            const filasGas = buildFilas(gastosMes, 'gas')
            if (filasIng.length === 0 && filasGas.length === 0) return null
            const totalIngMes = ingresosMes.reduce((a, i) => a + i.monto, 0)
            const totalGasMes = gastosMes.reduce((a, i) => a + i.monto, 0)
            const maxIng = Math.max(...filasIng.map(c => c.total), 1)
            const maxGas = Math.max(...filasGas.map(c => c.total), 1)
            const renderFilas = (filas: typeof filasGas, total: number, max: number, tipo: 'ingreso' | 'gasto') =>
              filas.map(cat => {
                const pct = total > 0 ? Math.round(cat.total / total * 100) : 0
                const isInv = cat.nombre === 'Inversión'
                const isSin = cat.id.startsWith('__otros_')
                const barColor = tipo === 'ingreso' ? 'linear-gradient(90deg,#10b981,#34d399)' : isInv ? 'linear-gradient(90deg,#F5C518,#f59e0b)' : isSin ? 'linear-gradient(90deg,#6b7280,#9ca3af)' : 'linear-gradient(90deg,#ef4444,#f87171)'
                const textColor = tipo === 'ingreso' ? '#10b981' : isInv ? '#F5C518' : isSin ? '#9ca3af' : '#ef4444'
                return (
                  <div key={cat.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: isSin ? '#6b7280' : '#d1d5db' }}>{cat.emoji} {cat.nombre}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.68rem', color: '#4b5563', fontWeight: 600 }}>{pct}%</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: textColor }}>{tipo === 'ingreso' ? '+' : '-'}{fmt(cat.total)}</span>
                      </div>
                    </div>
                    <div style={{ height: '5px', borderRadius: '99px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '99px', width: `${Math.round(cat.total / max * 100)}%`, background: barColor, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )
              })
            return (
              <div style={{ background: '#1a1730', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600, marginBottom: '1rem' }}>{t('tablero.mes.desglose_titulo')}</div>
                {filasIng.length > 0 && (
                  <>
                    <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>💚 {t('tablero.mes.ingresos')}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.625rem' }}>
                      {renderFilas(filasIng, totalIngMes, maxIng, 'ingreso')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: filasGas.length > 0 ? '0.875rem' : 0 }}>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{t('tablero.mes.total_ingresos_mes')}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>+{fmt(totalIngMes)}</span>
                    </div>
                  </>
                )}
                {filasGas.length > 0 && (
                  <>
                    {filasIng.length > 0 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.875rem' }} />}
                    <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>🔴 {t('tablero.mes.gastos_label')}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {renderFilas(filasGas, totalGasMes, maxGas, 'gasto')}
                    </div>
                    <div style={{ marginTop: '0.875rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{t('tablero.mes.total_gastos')}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ef4444' }}>{fmt(totalGasMes)}</span>
                    </div>
                  </>
                )}
              </div>
            )
          })()}

          {/* Categorías — gestión completa */}
          <div style={{ background: '#1a1730', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600 }}>{t('tablero.finanzas.categorias_titulo')}</div>
              <button onClick={() => setShowPlantillasCat(true)} style={{ fontSize: '0.72rem', color: '#a78bfa', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '6px', padding: '0.25rem 0.625rem', cursor: 'pointer', fontWeight: 600 }}>
                {t('tablero.finanzas.plantillas_cat_btn')}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.75rem' }}>
              {[...finanzaCategorias].sort((a, b) => a.orden - b.orden).map((cat, idx, arr) => (
                <div key={cat.id}>
                  {editingCategoria?.id === cat.id ? (
                    <div style={{ padding: '0.5rem 0.625rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.4rem', flexShrink: 0, width: '36px', textAlign: 'center' }}>{editCatEmoji || '?'}</span>
                        <input
                          value={editCatNombre}
                          onChange={e => setEditCatNombre(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveEditCategoria()}
                          style={{ flex: 1, minWidth: '80px', padding: '0.45rem 0.6rem', borderRadius: '7px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(139,92,246,0.25)', color: '#f3f0ff', fontSize: '0.875rem', outline: 'none' }}
                        />
                        <button onClick={saveEditCategoria} disabled={!editCatNombre.trim() || catSaving} style={{ padding: '0.45rem 0.7rem', borderRadius: '7px', border: 'none', background: 'rgba(139,92,246,0.3)', color: '#a78bfa', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>{catSaving ? '...' : '✓'}</button>
                        <button onClick={() => setEditingCategoria(null)} style={{ padding: '0.45rem 0.5rem', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#6b7280', fontSize: '0.8rem', cursor: 'pointer' }}>✕</button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {CAT_FIN_EMOJIS.map(e => (
                          <button key={e} onClick={() => setEditCatEmoji(e)} style={{ width: '30px', height: '30px', borderRadius: '6px', border: 'none', fontSize: '1rem', background: editCatEmoji === e ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.06)', cursor: 'pointer' }}>{e}</button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid transparent' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginRight: '2px', flexShrink: 0 }}>
                        <button onClick={() => moveCategoria(cat.id, -1)} disabled={idx === 0} style={{ background: 'none', border: 'none', color: idx === 0 ? '#374151' : '#6b7280', cursor: idx === 0 ? 'default' : 'pointer', fontSize: '0.6rem', padding: '0 2px', lineHeight: 1 }}>▲</button>
                        <button onClick={() => moveCategoria(cat.id, 1)} disabled={idx === arr.length - 1} style={{ background: 'none', border: 'none', color: idx === arr.length - 1 ? '#374151' : '#6b7280', cursor: idx === arr.length - 1 ? 'default' : 'pointer', fontSize: '0.6rem', padding: '0 2px', lineHeight: 1 }}>▼</button>
                      </div>
                      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{cat.emoji}</span>
                      <span style={{ fontSize: '0.875rem', color: '#d1d5db', flex: 1 }}>{cat.nombre}</span>
                      <button
                        onClick={() => { setEditingCategoria(cat); setEditCatNombre(cat.nombre); setEditCatEmoji(cat.emoji) }}
                        style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: '0.75rem', padding: '0 4px' }}
                      >✏️</button>
                      <button onClick={() => { if (confirm(t('tablero.finanzas.eliminar_cat'))) deleteCategoria(cat.id) }} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}>×</button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {showAddCategoria ? (
              <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '10px', padding: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '1.4rem', flexShrink: 0, width: '36px', textAlign: 'center' }}>{nuevaCatEmoji}</span>
                  <input
                    value={nuevaCatNombre}
                    onChange={e => setNuevaCatNombre(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCategoria()}
                    placeholder={t('tablero.finanzas.cat_placeholder')}
                    autoFocus
                    style={{ flex: 1, minWidth: '120px', padding: '0.55rem 0.6rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.25)', color: '#f3f0ff', fontSize: '0.875rem', outline: 'none' }}
                  />
                  <button onClick={addCategoria} disabled={!nuevaCatNombre.trim() || catSaving} style={{ padding: '0.55rem 0.875rem', borderRadius: '8px', border: 'none', background: 'rgba(139,92,246,0.25)', color: '#a78bfa', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                    {catSaving ? '...' : '✓'}
                  </button>
                  <button onClick={() => { setShowAddCategoria(false); setNuevaCatNombre(''); setNuevaCatEmoji('💰') }} style={{ padding: '0.55rem 0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#6b7280', fontSize: '0.82rem', cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {CAT_FIN_EMOJIS.map(e => (
                    <button key={e} onClick={() => setNuevaCatEmoji(e)} style={{ width: '30px', height: '30px', borderRadius: '6px', border: 'none', fontSize: '1rem', background: nuevaCatEmoji === e ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.06)', cursor: 'pointer' }}>{e}</button>
                  ))}
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddCategoria(true)} style={{
                width: '100%', padding: '0.625rem', borderRadius: '8px',
                border: '1px dashed rgba(139,92,246,0.25)', background: 'transparent',
                color: '#6b7280', fontSize: '0.8rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              }}>
                {t('tablero.hoy.agregar_cat')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── METAS ── */}
      {activeTab === 'metas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Racha actual como ancla de progreso */}
          <div style={{ background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: '14px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🔥</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fb923c', fontWeight: 700, fontSize: '0.95rem' }}>{racha} {t('tablero.metas_tab.dias_activo')}</div>
              <div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                {racha === 0 ? t('tablero.hoy.racha_cero') : racha >= 30 ? t('tablero.hoy.racha_ciclo') : t('tablero.hoy.racha_building')}
              </div>
            </div>
          </div>
          {[
            { key: 'meta30', label: t('metas.meta30_titulo'), emoji: '🌱', color: '#10b981', bg: 'rgba(16,185,129,0.06)', bdr: 'rgba(16,185,129,0.2)', value: metas?.meta30, dias: 30 },
            { key: 'meta90', label: t('metas.meta90_titulo'), emoji: '🚀', color: '#a78bfa', bg: 'rgba(139,92,246,0.06)', bdr: 'rgba(139,92,246,0.2)', value: metas?.meta90, dias: 90 },
            { key: 'meta180', label: t('metas.meta180_titulo'), emoji: '🏆', color: '#F5C518', bg: 'rgba(245,197,24,0.06)', bdr: 'rgba(245,197,24,0.2)', value: metas?.meta180, dias: 180 },
          ].map(m => {
            const progreso = Math.min(100, Math.round((racha / m.dias) * 100))
            const diasRestantes = Math.max(0, m.dias - racha)
            return (
              <div key={m.key} style={{ background: m.bg, border: `1px solid ${m.bdr}`, borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{m.emoji}</span>
                    <span style={{ color: m.color, fontWeight: 700, fontSize: '0.88rem' }}>{m.label}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: progreso === 100 ? m.color : '#6b7280', fontWeight: progreso === 100 ? 700 : 400 }}>
                    {progreso === 100 ? t('tablero.metas_tab.completado') : t('tablero.metas_tab.progreso').replace('{actual}', String(racha)).replace('{total}', String(m.dias)).replace('{restantes}', String(diasRestantes))}
                  </span>
                </div>
                {/* Barra de progreso */}
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginBottom: '0.75rem', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progreso}%`, background: m.color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
                {m.value
                  ? <p style={{ margin: 0, color: '#d1d5db', fontSize: '0.88rem', lineHeight: 1.6 }}>{m.value}</p>
                  : <p style={{ margin: 0, color: '#4b5563', fontSize: '0.82rem', fontStyle: 'italic' }}>{t('tablero.metas_tab.sin_meta')}</p>
                }
              </div>
            )
          })}
          <Link href="/metas" style={{
            display: 'block', textAlign: 'center', padding: '0.875rem', borderRadius: '12px',
            border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.08)',
            color: '#a78bfa', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none',
          }}>{t('tablero.metas_tab.editar')}</Link>

          {/* CTA Amauta Cloud */}
          <a href="https://amauta.cloud/landing" target="_blank" rel="noopener noreferrer" style={{
            display: 'block', textDecoration: 'none',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.07))',
            border: '1px solid rgba(139,92,246,0.22)', borderRadius: '12px', padding: '1rem 1.25rem',
          }}>
            <div style={{ fontSize: '0.65rem', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>
              {t('tablero.metas_tab.cta_label')}
            </div>
            <div style={{ color: '#e5e7eb', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.2rem' }}>
              {t('tablero.metas_tab.cta_titulo')}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
              {t('tablero.metas_tab.cta_desc')}
            </div>
          </a>
        </div>
      )}

      {/* Modal plantillas */}
      {showPlantillas && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setShowPlantillas(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '500px', maxHeight: '70vh', overflowY: 'auto',
            background: '#0f0a2e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '16px 16px 12px 12px', padding: '1.25rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e5e7eb' }}>{t('tablero.habitos.plantillas_titulo')}</div>
              <button onClick={() => setShowPlantillas(false)} style={{ border: 'none', background: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#4b5563', marginBottom: '1rem', margin: '0 0 1rem' }}>
              {t('tablero.habitos.plantillas_desc')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {PLANTILLAS.map(p => {
                const yaExiste = localHabitos.some(h => h.nombre.toLowerCase() === p.nombre.toLowerCase())
                return (
                  <button key={p.nombre} onClick={async () => { if (!yaExiste) { await addFromPlantilla(p); setShowPlantillas(false) } }}
                    disabled={yaExiste}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 1rem',
                      borderRadius: '10px', border: `1px solid ${yaExiste ? 'rgba(255,255,255,0.04)' : 'rgba(139,92,246,0.2)'}`,
                      background: yaExiste ? 'rgba(255,255,255,0.02)' : 'rgba(139,92,246,0.06)',
                      cursor: yaExiste ? 'default' : 'pointer', textAlign: 'left', width: '100%',
                      opacity: yaExiste ? 0.5 : 1,
                    }}>
                    <span style={{ fontSize: '1.4rem' }}>{p.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: yaExiste ? '#4b5563' : '#e5e7eb' }}>{t(`tablero.habitos.plantillas_nombres.${p.nombre}`)}</div>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.1rem' }}>
                        {p.tipo === 'numero' ? t('tablero.habitos.numerico', { n: p.meta_numero ?? 0, u: p.unidad ?? '' }) : t('tablero.habitos.si_no_diario')}
                      </div>
                    </div>
                    {yaExiste
                      ? <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{t('tablero.habitos.ya_tenes')}</span>
                      : <span style={{ fontSize: '0.8rem', color: '#a78bfa' }}>+</span>
                    }
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal plantillas categorías */}
      {showPlantillasCat && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setShowPlantillasCat(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '500px', maxHeight: '70vh', overflowY: 'auto',
            background: '#0f0a2e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '16px 16px 12px 12px', padding: '1.25rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e5e7eb' }}>{t('tablero.finanzas.cat_plantillas_titulo')}</div>
              <button onClick={() => setShowPlantillasCat(false)} style={{ border: 'none', background: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#4b5563', margin: '0 0 1rem' }}>
              {t('tablero.finanzas.cat_plantillas_desc')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {PLANTILLAS_CATEGORIAS.map(p => {
                const yaExiste = finanzaCategorias.some(c => c.nombre === p.nombre)
                return (
                  <button key={p.nombre} onClick={async () => { if (!yaExiste) { await addFromPlantillaCat(p); setShowPlantillasCat(false) } }}
                    disabled={yaExiste}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 1rem',
                      borderRadius: '10px', border: `1px solid ${yaExiste ? 'rgba(255,255,255,0.04)' : 'rgba(139,92,246,0.2)'}`,
                      background: yaExiste ? 'rgba(255,255,255,0.02)' : 'rgba(139,92,246,0.06)',
                      cursor: yaExiste ? 'default' : 'pointer', textAlign: 'left', width: '100%',
                      opacity: yaExiste ? 0.5 : 1,
                    }}>
                    <span style={{ fontSize: '1.4rem' }}>{p.emoji}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: yaExiste ? '#4b5563' : '#e5e7eb', flex: 1 }}>{p.nombre}</span>
                    {yaExiste
                      ? <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{t('tablero.finanzas.cat_ya_tenes')}</span>
                      : <span style={{ fontSize: '0.8rem', color: '#a78bfa' }}>+</span>
                    }
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal editar día pasado */}
      {editingDay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setEditingDay(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto',
            background: '#0f0a2e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '16px 16px 12px 12px', padding: '1.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e5e7eb' }}>{t('tablero.edit_day.titulo')}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.15rem' }}>{editingDay}</div>
              </div>
              <button onClick={() => setEditingDay(null)} style={{ border: 'none', background: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, marginBottom: '0.625rem' }}>{t('tablero.edit_day.habitos')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {localHabitos.map(h => {
                  const reg = editDayRegMap[h.id]
                  const done = h.tipo === 'boolean' ? reg?.valor_bool === true : (reg?.valor_numero ?? 0) > 0
                  return (
                    <div key={h.id}>
                      {h.tipo === 'boolean' ? (
                        <button onClick={() => setEditDayRegMap(prev => ({ ...prev, [h.id]: { habito_id: h.id, valor_bool: !done, valor_numero: null, nota: null } }))}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.875rem', borderRadius: '8px', border: 'none', background: done ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)', cursor: 'pointer', textAlign: 'left', width: '100%', borderLeft: `3px solid ${done ? '#8B5CF6' : 'transparent'}` }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, border: done ? 'none' : '2px solid rgba(255,255,255,0.15)', background: done ? '#8B5CF6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {done && <span style={{ fontSize: '0.6rem', color: 'white' }}>✓</span>}
                          </div>
                          <span style={{ fontSize: '0.85rem' }}>{h.emoji}</span>
                          <span style={{ fontSize: '0.82rem', color: done ? '#f3f0ff' : '#9ca3af' }}>{h.nombre}</span>
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', borderRadius: '8px', background: 'rgba(255,255,255,0.04)' }}>
                          <span style={{ fontSize: '0.85rem' }}>{h.emoji}</span>
                          <span style={{ fontSize: '0.82rem', color: '#9ca3af', flex: 1 }}>{h.nombre}</span>
                          <button onClick={() => setEditDayRegMap(prev => ({ ...prev, [h.id]: { habito_id: h.id, valor_bool: null, valor_numero: Math.max(0, (prev[h.id]?.valor_numero ?? 0) - 1), nota: null } }))}
                            style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(0,0,0,0.3)', color: '#9ca3af', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <span style={{ minWidth: '2rem', textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{editDayRegMap[h.id]?.valor_numero ?? 0}</span>
                          <button onClick={() => setEditDayRegMap(prev => ({ ...prev, [h.id]: { habito_id: h.id, valor_bool: null, valor_numero: (prev[h.id]?.valor_numero ?? 0) + 1, nota: null } }))}
                            style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.12)', color: '#a78bfa', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          {h.unidad && <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{h.unidad}</span>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, marginBottom: '0.625rem' }}>{t('tablero.edit_day.movimientos')}</div>

              {/* Tipo buttons */}
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.4rem' }}>
                {editItemCategoria !== 'Inversión' && (
                  <>
                    <button onClick={() => setEditItemTipo('ingreso')} style={{
                      padding: '0.4rem 0.7rem', borderRadius: '7px', border: 'none', cursor: 'pointer',
                      background: editItemTipo === 'ingreso' ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.06)',
                      color: '#10b981', fontSize: '0.75rem', fontWeight: editItemTipo === 'ingreso' ? 700 : 400,
                      outline: editItemTipo === 'ingreso' ? '1.5px solid rgba(16,185,129,0.5)' : '1px solid rgba(16,185,129,0.15)',
                      transition: 'all 0.15s',
                    }}>{t('tablero.hoy.ingreso_btn')}</button>
                    <button onClick={() => setEditItemTipo('gasto')} style={{
                      padding: '0.4rem 0.7rem', borderRadius: '7px', border: 'none', cursor: 'pointer',
                      background: editItemTipo === 'gasto' ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.06)',
                      color: '#ef4444', fontSize: '0.75rem', fontWeight: editItemTipo === 'gasto' ? 700 : 400,
                      outline: editItemTipo === 'gasto' ? '1.5px solid rgba(239,68,68,0.5)' : '1px solid rgba(239,68,68,0.15)',
                      transition: 'all 0.15s',
                    }}>{t('tablero.hoy.gasto_btn')}</button>
                  </>
                )}
                {editItemCategoria === 'Inversión' && (
                  <div style={{ padding: '0.4rem 0.7rem', borderRadius: '7px', background: 'rgba(245,197,24,0.15)', border: '1px solid rgba(245,197,24,0.35)', color: '#F5C518', fontSize: '0.75rem', fontWeight: 700 }}>
                    {t('tablero.hoy.inversion_tipo')}
                  </div>
                )}
              </div>

              {/* Categoría chips */}
              {finanzaCategorias.length > 0 && (
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {finanzaCategorias.map(cat => (
                    <button key={cat.id}
                      onClick={() => {
                        const next = editItemCategoria === cat.nombre ? null : cat.nombre
                        setEditItemCategoria(next)
                        if (next === 'Inversión') setEditItemTipo('gasto')
                      }}
                      style={{
                        padding: '0.25rem 0.5rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.68rem',
                        background: editItemCategoria === cat.nombre ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.05)',
                        color: editItemCategoria === cat.nombre ? '#a78bfa' : '#6b7280',
                        outline: editItemCategoria === cat.nombre ? '1px solid rgba(139,92,246,0.4)' : 'none',
                        fontWeight: editItemCategoria === cat.nombre ? 700 : 400,
                      }}
                    >{cat.emoji} {cat.nombre}</button>
                  ))}
                </div>
              )}

              {/* Monto + desc + Agregar */}
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.625rem', flexWrap: 'wrap' }}>
                <input
                  type="number" value={editItemMonto} onChange={e => setEditItemMonto(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addEditDayItem()}
                  placeholder={t('tablero.hoy.monto_placeholder')}
                  style={{ width: '80px', padding: '0.45rem 0.5rem', borderRadius: '7px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${editItemCategoria === 'Inversión' ? 'rgba(245,197,24,0.3)' : editItemTipo === 'ingreso' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: '#f3f0ff', fontSize: '0.85rem', fontWeight: 700, outline: 'none', flexShrink: 0 }}
                />
                <input
                  value={editItemDesc} onChange={e => setEditItemDesc(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addEditDayItem()}
                  placeholder={t('tablero.hoy.detalle_placeholder')}
                  style={{ flex: 1, minWidth: '70px', padding: '0.45rem 0.5rem', borderRadius: '7px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: '0.78rem', outline: 'none' }}
                />
                <button onClick={addEditDayItem} disabled={editItemAdding || !editItemMonto} style={{
                  padding: '0.45rem 0.75rem', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  background: 'rgba(139,92,246,0.2)', color: '#a78bfa', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0,
                  opacity: !editItemMonto ? 0.5 : 1,
                }}>
                  {editItemAdding ? '...' : t('tablero.edit_day.agregar')}
                </button>
              </div>

              {/* Lista de items */}
              {editDayItems.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.625rem' }}>
                  {editDayItems.map(item => {
                    const isInv = item.categoria === 'Inversión'
                    const itemColor = item.tipo === 'ingreso' ? '#10b981' : isInv ? '#F5C518' : '#ef4444'
                    const itemBg = item.tipo === 'ingreso' ? 'rgba(16,185,129,0.06)' : isInv ? 'rgba(245,197,24,0.06)' : 'rgba(239,68,68,0.06)'
                    const itemBorder = item.tipo === 'ingreso' ? 'rgba(16,185,129,0.18)' : isInv ? 'rgba(245,197,24,0.25)' : 'rgba(239,68,68,0.18)'
                    return (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.45rem 0.7rem', borderRadius: '7px',
                        background: itemBg, border: `1px solid ${itemBorder}`,
                      }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: itemColor, flexShrink: 0 }}>
                          {item.tipo === 'ingreso' ? '+' : '-'}{fmt(item.monto)}
                        </span>
                        {item.categoria && (
                          <span style={{ fontSize: '0.65rem', color: '#6b7280', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', padding: '0.1rem 0.35rem', flexShrink: 0 }}>
                            {finanzaCategorias.find(c => c.nombre === item.categoria)?.emoji} {item.categoria}
                          </span>
                        )}
                        {item.descripcion && (
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.descripcion}
                          </span>
                        )}
                        <button onClick={() => deleteEditDayItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', fontSize: '0.95rem', padding: '0 2px', marginLeft: 'auto', flexShrink: 0 }}>×</button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Inversión del día en modal */}
              {editDayFin.ingresos > 0 && (() => {
                const invEdit = editDayItems.filter(i => i.categoria === 'Inversión').reduce((a, i) => a + i.monto, 0)
                return (
                  <div style={{ padding: '0.6rem 0.875rem', borderRadius: '8px', background: 'rgba(245,197,24,0.07)', border: '1px solid rgba(245,197,24,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{t('tablero.edit_day.regla10', { amount: fmt(Math.round(editDayFin.ingresos * 0.1)) })}</span>
                    {invEdit > 0 ? (
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>✓ {fmt(invEdit)}</span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{t('tablero.edit_day.sin_registrar')}</span>
                    )}
                  </div>
                )
              })()}

              {/* Ahorro toggle en modal de edición */}
              <button onClick={toggleEditDayAhorro} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                width: '100%', padding: '0.65rem 0.875rem', borderRadius: '8px',
                background: editDayFin.ahorro ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${editDayFin.ahorro ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                  background: editDayFin.ahorro ? '#10b981' : 'transparent',
                  border: `2px solid ${editDayFin.ahorro ? '#10b981' : '#4b5563'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {editDayFin.ahorro && <span style={{ color: 'white', fontSize: '0.6rem', fontWeight: 900, lineHeight: 1 }}>✓</span>}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: editDayFin.ahorro ? '#10b981' : '#9ca3af' }}>
                  🐷 {editDayFin.ahorro ? t('tablero.hoy.ahorro_si') : t('tablero.hoy.ahorro_no')}
                </span>
              </button>
            </div>

            <button onClick={saveEditDay} disabled={editSaving} style={{
              width: '100%', padding: '0.875rem', borderRadius: '10px', border: 'none',
              background: editSaved ? '#10b981' : 'linear-gradient(135deg,#8B5CF6,#EC4899)',
              color: 'white', fontSize: '0.9rem', fontWeight: 700, cursor: editSaving ? 'default' : 'pointer',
            }}>
              {editSaving ? t('common.saving') : editSaved ? t('tablero.edit_day.guardado') : t('tablero.edit_day.guardar')}
            </button>
          </div>
        </div>
      )}

      {/* ── HISTORIAL MODAL ── */}
      {historialOpen && (() => {
        const h = localHabitos.find(x => x.id === historialOpen)
        if (!h) return null
        const days30: { fecha: string; done: boolean }[] = []
        for (let i = 29; i >= 0; i--) {
          const d = new Date(today + 'T12:00:00')
          d.setDate(d.getDate() - i)
          const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          const reg = historial.find(r => r.habito_id === h.id && r.fecha === fecha)
          const done = reg?.valor_bool === true || (reg?.valor_numero != null && reg.valor_numero > 0)
          days30.push({ fecha, done })
        }
        const completados30 = days30.filter(d => d.done).length
        const pct30 = Math.round((completados30 / 30) * 100)
        const racha30 = rachaHabito(h.id)
        return (
          <div onClick={() => setHistorialOpen(null)} style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              width: '100%', maxWidth: '500px',
              background: '#1a1730',
              border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: '20px 20px 0 0',
              padding: '1.5rem',
              display: 'flex', flexDirection: 'column', gap: '1.25rem',
            }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '99px', background: 'rgba(255,255,255,0.15)', margin: '0 auto -0.5rem' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{h.emoji}</span>
                  <div>
                    <div style={{ color: '#f3f0ff', fontWeight: 700, fontSize: '1rem' }}>{h.nombre}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.72rem' }}>{t('tablero.habitos.ultimos_30d')}</div>
                  </div>
                </div>
                <button onClick={() => setHistorialOpen(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.625rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.15)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fb923c' }}>{racha30}</div>
                  <div style={{ fontSize: '0.62rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('tablero.habitos.racha_label')}</div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#a78bfa' }}>{completados30}</div>
                  <div style={{ fontSize: '0.62rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('tablero.habitos.dias_label')}</div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>{pct30}%</div>
                  <div style={{ fontSize: '0.62rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('tablero.habitos.cumplimiento_label')}</div>
                </div>
              </div>

              {/* Calendar dots */}
              <div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>{t('tablero.habitos.historial_label')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '0.3rem' }}>
                  {days30.map(({ fecha, done }) => {
                    const isToday = fecha === today
                    return (
                      <div key={fecha} title={fecha} style={{
                        aspectRatio: '1',
                        borderRadius: '4px',
                        background: done ? '#8B5CF6' : 'rgba(255,255,255,0.05)',
                        border: isToday ? '1px solid rgba(139,92,246,0.6)' : '1px solid transparent',
                        position: 'relative',
                      }} />
                    )
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#8B5CF6' }} />
                  <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{t('tablero.habitos.completado_legend')}</span>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{t('tablero.habitos.sin_registro_legend')}</span>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}

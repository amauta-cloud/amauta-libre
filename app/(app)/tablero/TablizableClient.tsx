'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Habito = {
  id: string
  nombre: string
  emoji: string
  tipo: string
  unidad: string | null
  obligatorio: boolean
  orden: number
  meta_numero: number | null
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
]

type MetasData = {
  meta30: string
  meta90: string
  meta180: string
} | null

type Finanzas = { ingresos: number; gastos: number; ahorro: boolean }

const EMOJIS = ['⭐','🎯','📚','🏃','🧠','💧','🥗','🛌','✍️','🎨','🎵','💼','🌿','🙏','📞','💊','🚴','🏋️','🧘','🍎','🔥','💪','🎧','📖','⚽','🎸','🖥️','🌅','🎭','🦁']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)
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
  const [regMap, setRegMap] = useState(initialRegMap)
  const [loading, setLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'hoy' | 'mes' | 'habitos' | 'metas'>('hoy')

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
  const [ingresosInput, setIngresosInput] = useState('')
  const [gastosInput, setGastosInput] = useState('')
  const [finanzasSaving, setFinanzasSaving] = useState(false)
  const [finanzasSaved, setFinanzasSaved] = useState(false)

  // Mes tab
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [monthRegistros, setMonthRegistros] = useState<{ habito_id: string; fecha: string; valor_bool: boolean | null; valor_numero: number | null }[]>([])
  const [monthFinanzas, setMonthFinanzas] = useState<{ fecha: string; ingresos: number; gastos: number; ahorro: boolean }[]>([])
  const [monthLoading, setMonthLoading] = useState(false)

  // Edit past day
  const [editingDay, setEditingDay] = useState<string | null>(null)
  const [editDayRegMap, setEditDayRegMap] = useState<Record<string, Registro>>({})
  const [editDayFin, setEditDayFin] = useState<Finanzas>({ ingresos: 0, gastos: 0, ahorro: false })
  const [editIngresosInput, setEditIngresosInput] = useState('')
  const [editGastosInput, setEditGastosInput] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editSaved, setEditSaved] = useState(false)

  // Habitos management
  const [localHabitos, setLocalHabitos] = useState<Habito[]>(habitos)
  const [showAddHabito, setShowAddHabito] = useState(false)
  const [editingHabito, setEditingHabito] = useState<Habito | null>(null)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoEmoji, setNuevoEmoji] = useState('⭐')
  const [nuevoTipo, setNuevoTipo] = useState<'boolean' | 'numero'>('boolean')
  const [nuevoUnidad, setNuevoUnidad] = useState('')
  const [nuevoMeta, setNuevoMeta] = useState('')
  const [habitoSaving, setHabitoSaving] = useState(false)

  // Live stats
  const completados = localHabitos.filter(h => {
    const r = regMap[h.id]
    if (!r) return false
    if (h.tipo === 'boolean') return r.valor_bool === true
    if (h.tipo === 'numero') return r.valor_numero !== null && r.valor_numero > 0
    return false
  }).length
  const pct = localHabitos.length > 0 ? Math.round((completados / localHabitos.length) * 100) : 0

  // Load today's finanzas
  useEffect(() => {
    supabase.from('finanzas_diarias')
      .select('ingresos,gastos,ahorro')
      .eq('usuario_id', userId)
      .eq('fecha', today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFinanzas({ ingresos: data.ingresos || 0, gastos: data.gastos || 0, ahorro: data.ahorro || false })
          setIngresosInput(data.ingresos > 0 ? String(data.ingresos) : '')
          setGastosInput(data.gastos > 0 ? String(data.gastos) : '')
        }
      })
  }, [userId, today]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load month data
  const loadMonthData = useCallback(async () => {
    setMonthLoading(true)
    const daysInMonth = new Date(year, month, 0).getDate()
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const to = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
    const [regRes, finRes] = await Promise.all([
      supabase.from('habito_registros').select('habito_id,fecha,valor_bool,valor_numero').eq('usuario_id', userId).gte('fecha', from).lte('fecha', to),
      supabase.from('finanzas_diarias').select('fecha,ingresos,gastos,ahorro').eq('usuario_id', userId).gte('fecha', from).lte('fecha', to),
    ])
    setMonthRegistros(regRes.data || [])
    setMonthFinanzas((finRes.data || []) as { fecha: string; ingresos: number; gastos: number; ahorro: boolean }[])
    setMonthLoading(false)
  }, [userId, year, month]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'mes') loadMonthData()
  }, [activeTab, loadMonthData])

  async function toggleBool(habito: Habito) {
    const current = regMap[habito.id]?.valor_bool ?? false
    const newVal = !current
    setRegMap(prev => ({ ...prev, [habito.id]: { habito_id: habito.id, valor_bool: newVal, valor_numero: null, nota: prev[habito.id]?.nota ?? null } }))
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
    const doneToday = (() => {
      const r = historial.find(h => h.habito_id === habitoId && h.fecha === today)
      return r?.valor_bool === true || (r?.valor_numero != null && r.valor_numero > 0)
    })()
    let streak = doneToday ? 1 : 0
    for (let i = 1; i <= 60; i++) {
      const d = new Date(today + 'T12:00:00')
      d.setDate(d.getDate() - i)
      const f = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const r = historial.find(h => h.habito_id === habitoId && h.fecha === f)
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

  async function saveFinanzas() {
    const ingresos = parseFloat(ingresosInput) || 0
    const gastos = parseFloat(gastosInput) || 0
    setFinanzas(prev => ({ ...prev, ingresos, gastos }))
    setFinanzasSaving(true)
    await supabase.from('finanzas_diarias').upsert({
      usuario_id: userId, fecha: today, ingresos, gastos, ahorro: finanzas.ahorro,
    }, { onConflict: 'usuario_id,fecha' })
    setFinanzasSaving(false)
    setFinanzasSaved(true)
    setTimeout(() => setFinanzasSaved(false), 2000)
  }

  // Month calculations
  function getDayPct(dateStr: string): number {
    const dayRegs = monthRegistros.filter(r => r.fecha === dateStr)
    if (dayRegs.length === 0 || localHabitos.length === 0) return 0
    const done = dayRegs.filter(r => r.valor_bool === true || (r.valor_numero !== null && r.valor_numero > 0)).length
    return Math.round((done / localHabitos.length) * 100)
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
    const [{ data: regs }, { data: fin }] = await Promise.all([
      supabase.from('habito_registros').select('habito_id,valor_bool,valor_numero').eq('usuario_id', userId).eq('fecha', dateStr),
      supabase.from('finanzas_diarias').select('ingresos,gastos,ahorro').eq('usuario_id', userId).eq('fecha', dateStr).maybeSingle(),
    ])
    const rm: Record<string, Registro> = {}
    for (const r of (regs || [])) rm[r.habito_id] = { ...r, nota: null }
    setEditDayRegMap(rm)
    const f = fin || { ingresos: 0, gastos: 0, ahorro: false }
    setEditDayFin(f)
    setEditIngresosInput(f.ingresos > 0 ? String(f.ingresos) : '')
    setEditGastosInput(f.gastos > 0 ? String(f.gastos) : '')
    setEditingDay(dateStr)
    setEditSaved(false)
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
    await Promise.all([
      supabase.from('habito_registros').upsert(upserts, { onConflict: 'habito_id,fecha' }),
      supabase.from('finanzas_diarias').upsert({
        usuario_id: userId, fecha: editingDay,
        ingresos: parseFloat(editIngresosInput) || 0,
        gastos: parseFloat(editGastosInput) || 0,
        ahorro: editDayFin.ahorro,
      }, { onConflict: 'usuario_id,fecha' }),
    ])
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
    }).select().single()
    if (data) {
      setLocalHabitos(prev => [...prev, data as Habito])
      if (data.tipo === 'numero') setNumValues(prev => ({ ...prev, [data.id]: 0 }))
    }
    setHabitoSaving(false)
    setShowAddHabito(false)
    setNuevoNombre(''); setNuevoEmoji('⭐'); setNuevoTipo('boolean'); setNuevoUnidad(''); setNuevoMeta('')
  }

  async function saveEditHabito() {
    if (!editingHabito || !nuevoNombre.trim()) return
    setHabitoSaving(true)
    await supabase.from('habitos').update({ nombre: nuevoNombre.trim(), emoji: nuevoEmoji }).eq('id', editingHabito.id)
    setLocalHabitos(prev => prev.map(h => h.id === editingHabito.id ? { ...h, nombre: nuevoNombre.trim(), emoji: nuevoEmoji } : h))
    setHabitoSaving(false)
    setEditingHabito(null); setNuevoNombre('')
  }

  async function deleteHabito(id: string) {
    if (!confirm('¿Eliminar este hábito? Sus registros históricos se mantienen.')) return
    await supabase.from('habitos').update({ activo: false }).eq('id', id)
    setLocalHabitos(prev => prev.filter(h => h.id !== id))
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
  const ahorroAcumulado = monthFinanzas.filter(f => f.ahorro && f.ingresos > 0).reduce((a, f) => a + Math.round(f.ingresos * 0.1), 0)

  const ingresosHoy = parseFloat(ingresosInput) || 0
  const gastosHoy = parseFloat(gastosInput) || 0
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
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
        <p>Tus hábitos se cargan automáticamente al registrarte.</p>
      </div>
    )
  }

  return (
    <>
      {/* Tab nav */}
      <div style={{
        display: 'flex', gap: '0.2rem', padding: '0.25rem',
        background: 'rgba(255,255,255,0.04)', borderRadius: '10px', marginBottom: '1.25rem',
      }}>
        {navBtn('hoy', 'Hoy', '⚡')}
        {navBtn('mes', 'Mes', '📊')}
        {navBtn('habitos', 'Hábitos', '✏️')}
        {navBtn('metas', 'Metas', '🎯')}
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
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>{completados}/{localHabitos.length} hábitos</div>
              <div style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                {pct === 100 ? '¡Día perfecto! 🏆' : pct >= 50 ? 'Vas bien, seguí' : 'Empezá por uno'}
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
              <span style={{ color: '#6b7280', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>racha</span>
            </div>
          </div>

          {/* Habit list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {localHabitos.map(h => {
              const reg = regMap[h.id]
              const done = h.tipo === 'boolean' ? reg?.valor_bool === true : (reg?.valor_numero ?? 0) > 0
              return (
                <div key={h.id} style={{
                  background: '#1a1730',
                  border: `1px solid ${done ? 'rgba(139,92,246,0.35)' : 'rgba(139,92,246,0.1)'}`,
                  borderRadius: '14px', padding: '1rem 1.125rem',
                  display: 'flex', alignItems: 'center', gap: '0.875rem', transition: 'border-color 0.2s',
                }}>
                  <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{h.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: h.tipo === 'numero' ? '0.5rem' : '0.25rem' }}>
                      <span style={{ color: done ? '#a78bfa' : '#d1d5db', fontWeight: 500, fontSize: '0.9rem' }}>{h.nombre}</span>
                      {h.obligatorio && <span style={{ fontSize: '0.6rem', background: 'rgba(139,92,246,0.2)', color: '#a78bfa', borderRadius: '4px', padding: '0.1rem 0.35rem' }}>base</span>}
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
                          placeholder="Anotá algo sobre este hábito hoy..."
                          rows={2}
                          autoFocus
                          style={{ width: '100%', padding: '0.5rem 0.625rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)', color: '#e5e7eb', fontSize: '0.8rem', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem' }}>
                          <button onClick={() => saveNota(h)} disabled={notaSaving === h.id}
                            style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', border: 'none', background: '#8B5CF6', color: 'white', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                            {notaSaving === h.id ? '...' : 'Guardar'}
                          </button>
                          <button onClick={() => setNotaOpen(null)}
                            style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#6b7280', fontSize: '0.72rem', cursor: 'pointer' }}>Cancelar</button>
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
                        cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem',
                        opacity: loading === h.id ? 0.6 : 1,
                      }}>{done ? '✓' : ''}</button>
                    )}
                    <button onClick={() => setNotaOpen(notaOpen === h.id ? null : h.id)}
                      title="Agregar nota"
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: notaInputs[h.id] ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)', color: notaInputs[h.id] ? '#a78bfa' : '#4b5563', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      📝
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Finanzas */}
          <div style={{ background: '#1a1730', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600, marginBottom: '1rem' }}>💰 Movimientos del día</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '0.875rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#10b981', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>📈 Ingresos</label>
                <input type="number" value={ingresosInput} onChange={e => setIngresosInput(e.target.value)} placeholder="0"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: '1rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#ef4444', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>📉 Gastos</label>
                <input type="number" value={gastosInput} onChange={e => setGastosInput(e.target.value)} placeholder="0"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '1rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            {ingresosHoy > 0 && (
              <div style={{ marginBottom: '0.875rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(245,197,24,0.07)', border: '1px solid rgba(245,197,24,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>💡 Regla del 10% — ahorro sugerido</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F5C518', marginTop: '0.1rem' }}>{fmt(sugerido10)}</div>
                  </div>
                  <div style={{ fontSize: '1.5rem' }}>🐷</div>
                </div>
                <button onClick={() => setFinanzas(prev => ({ ...prev, ahorro: !prev.ahorro }))} style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: 'none',
                  background: finanzas.ahorro ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  borderLeft: `3px solid ${finanzas.ahorro ? '#10b981' : 'transparent'}`,
                }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, border: finanzas.ahorro ? 'none' : '2px solid rgba(255,255,255,0.2)', background: finanzas.ahorro ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                    {finanzas.ahorro && <span style={{ fontSize: '0.65rem', color: 'white' }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: finanzas.ahorro ? '#10b981' : '#9ca3af', fontWeight: finanzas.ahorro ? 700 : 400 }}>
                    {finanzas.ahorro ? '¡Ahorré el 10%!' : '¿Ahorré el 10% hoy?'}
                  </span>
                </button>
              </div>
            )}

            {(ingresosHoy > 0 || gastosHoy > 0) && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: (ingresosHoy - gastosHoy) >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${(ingresosHoy - gastosHoy) >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Resultado del día</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: (ingresosHoy - gastosHoy) >= 0 ? '#10b981' : '#ef4444' }}>
                  {(ingresosHoy - gastosHoy) >= 0 ? '+' : ''}{fmt(ingresosHoy - gastosHoy)}
                </span>
              </div>
            )}

            <button onClick={saveFinanzas} disabled={finanzasSaving} style={{
              width: '100%', padding: '0.75rem', borderRadius: '10px', border: 'none',
              background: finanzasSaved ? '#10b981' : 'rgba(139,92,246,0.2)',
              color: finanzasSaved ? '#fff' : '#a78bfa', fontSize: '0.85rem', fontWeight: 700,
              cursor: finanzasSaving ? 'default' : 'pointer', transition: 'background 0.3s',
            }}>
              {finanzasSaving ? 'Guardando...' : finanzasSaved ? '✓ Guardado' : 'Guardar movimientos'}
            </button>
          </div>
        </div>
      )}

      {/* ── MES ── */}
      {activeTab === 'mes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Navigator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }}
              style={{ border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.5rem', padding: '0.25rem 0.5rem' }}>‹</button>
            <span style={{ color: '#e5e7eb', fontWeight: 700, fontSize: '1rem' }}>{MESES[month - 1]} {year}</span>
            <button onClick={() => { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }}
              style={{ border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.5rem', padding: '0.25rem 0.5rem' }}>›</button>
          </div>

          {monthLoading ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem', fontSize: '0.85rem' }}>Un momento...</div>
          ) : (
            <>
              {/* Stats cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: 'Eficiencia', value: `${eficienciaPromedio}%`, color: '#a78bfa', sub: `${totalDias} días registrados` },
                  { label: 'Racha actual', value: `${racha} días`, color: '#F5C518', sub: racha > 0 ? '🔥' : 'Sin racha' },
                  { label: 'Ingresos', value: fmt(totalIngresos), color: '#10b981', sub: 'Total del mes' },
                  { label: 'Resultado', value: fmt(profit), color: profit >= 0 ? '#10b981' : '#ef4444', sub: profit >= 0 ? 'Ganancia' : 'Pérdida' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#1a1730', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem 1.125rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.3rem' }}>{s.label}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '0.68rem', color: '#4b5563', marginTop: '0.15rem' }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Ahorro acumulado */}
              {ahorroAcumulado > 0 && (
                <div style={{ background: 'linear-gradient(135deg,rgba(245,197,24,0.08),rgba(16,185,129,0.05))', border: '1px solid rgba(245,197,24,0.25)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, marginBottom: '0.2rem' }}>🐷 Ahorro acumulado (10%)</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F5C518' }}>{fmt(ahorroAcumulado)}</div>
                  </div>
                  <div style={{ fontSize: '2.5rem' }}>🐷</div>
                </div>
              )}

              {/* Heatmap */}
              <div style={{ background: '#1a1730', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600, marginBottom: '0.875rem' }}>Mapa de hábitos — tocá un día para editar</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '3px', marginBottom: '3px' }}>
                  {['D','L','M','X','J','V','S'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '0.6rem', color: '#4b5563', padding: '2px 0' }}>{d}</div>
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
                  <span style={{ fontSize: '0.62rem', color: '#4b5563' }}>Menos</span>
                  {['rgba(255,255,255,0.04)','rgba(139,92,246,0.15)','rgba(139,92,246,0.3)','rgba(139,92,246,0.5)','rgba(139,92,246,0.75)','rgba(16,185,129,0.65)'].map((c, i) => (
                    <div key={i} style={{ width: '12px', height: '12px', borderRadius: '2px', background: c }} />
                  ))}
                  <span style={{ fontSize: '0.62rem', color: '#4b5563' }}>Más</span>
                </div>
              </div>

              {/* Cumplimiento por hábito */}
              {totalDias > 0 && (
                <div style={{ background: '#1a1730', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600, marginBottom: '1rem' }}>Cumplimiento por hábito</div>
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
                  <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600, marginBottom: '1rem' }}>💰 Resumen financiero</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>📈 Ingresos</span>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>{fmt(totalIngresos)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>📉 Gastos</span>
                      <span style={{ fontWeight: 700, color: '#ef4444' }}>{fmt(totalGastos)}</span>
                    </div>
                    {ahorroAcumulado > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>🐷 Ahorro (10%)</span>
                        <span style={{ fontWeight: 700, color: '#F5C518' }}>{fmt(ahorroAcumulado)}</span>
                      </div>
                    )}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.625rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e5e7eb' }}>Resultado neto</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: profit >= 0 ? '#10b981' : '#ef4444' }}>{profit >= 0 ? '+' : ''}{fmt(profit)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── HÁBITOS ── */}
      {activeTab === 'habitos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Base */}
          <div style={{ background: '#1a1730', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600, marginBottom: '0.875rem' }}>Hábitos base</div>
            {localHabitos.filter(h => h.obligatorio).map(h => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: '8px', marginBottom: '0.375rem', background: 'rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize: '1rem' }}>{h.emoji}</span>
                <span style={{ fontSize: '0.875rem', color: '#9ca3af', flex: 1 }}>{h.nombre}</span>
                <span style={{ fontSize: '0.65rem', background: 'rgba(139,92,246,0.2)', color: '#a78bfa', borderRadius: '4px', padding: '0.1rem 0.4rem' }}>base</span>
              </div>
            ))}
          </div>

          {/* Custom */}
          <div style={{ background: '#1a1730', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600 }}>Mis hábitos personales</div>
              <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{localHabitos.filter(h => !h.obligatorio).length} hábitos</span>
            </div>

            {localHabitos.filter(h => !h.obligatorio).length === 0 && !showAddHabito && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#4b5563', fontSize: '0.82rem' }}>
                Todavía no agregaste hábitos personales
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.875rem' }}>
              {localHabitos.filter(h => !h.obligatorio).map(h => (
                <div key={h.id}>
                  {editingHabito?.id === h.id ? (
                    <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', padding: '1rem' }}>
                      <div style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: 700, marginBottom: '0.75rem' }}>Editar: {h.nombre}</div>
                      <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Nombre..."
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.25)', color: '#f3f0ff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', marginBottom: '0.75rem' }} />
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.4rem' }}>Emoji</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.875rem' }}>
                        {EMOJIS.map(e => <button key={e} onClick={() => setNuevoEmoji(e)} style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', fontSize: '1rem', background: nuevoEmoji === e ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.06)', cursor: 'pointer' }}>{e}</button>)}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={saveEditHabito} disabled={!nuevoNombre.trim() || habitoSaving}
                          style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', background: nuevoNombre.trim() ? '#8b5cf6' : 'rgba(139,92,246,0.3)', color: 'white', fontWeight: 600, fontSize: '0.82rem', cursor: nuevoNombre.trim() ? 'pointer' : 'default' }}>
                          {habitoSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button onClick={() => { setEditingHabito(null); setNuevoNombre('') }}
                          style={{ padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9ca3af', fontSize: '0.82rem', cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.875rem', borderRadius: '10px', background: 'rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '1.1rem' }}>{h.emoji}</span>
                      <span style={{ fontSize: '0.875rem', color: '#e5e7eb', flex: 1 }}>{h.nombre}</span>
                      {h.tipo === 'numero' && h.unidad && <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{h.unidad}</span>}
                      <button onClick={() => { setEditingHabito(h); setNuevoNombre(h.nombre); setNuevoEmoji(h.emoji); setNuevoTipo(h.tipo as 'boolean' | 'numero') }}
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
                <div style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: 700, marginBottom: '0.75rem' }}>Nuevo hábito</div>
                <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Nombre del hábito..." autoFocus
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.25)', color: '#f3f0ff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', marginBottom: '0.75rem' }} />
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.4rem' }}>Tipo</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(['boolean', 'numero'] as const).map(t => (
                      <button key={t} onClick={() => setNuevoTipo(t)} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', background: nuevoTipo === t ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)', color: nuevoTipo === t ? '#a78bfa' : '#6b7280', fontWeight: nuevoTipo === t ? 700 : 400, fontSize: '0.82rem', cursor: 'pointer' }}>
                        {t === 'boolean' ? '✓ Sí/No' : '# Número'}
                      </button>
                    ))}
                  </div>
                </div>
                {nuevoTipo === 'numero' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input value={nuevoUnidad} onChange={e => setNuevoUnidad(e.target.value)} placeholder="Unidad (vasos, km, min...)"
                      style={{ padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.25)', color: '#f3f0ff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                    <input type="number" min="1" value={nuevoMeta} onChange={e => setNuevoMeta(e.target.value)} placeholder="Meta diaria"
                      style={{ padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.25)', color: '#f3f0ff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                )}
                <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.4rem' }}>Emoji</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.875rem' }}>
                  {EMOJIS.map(e => <button key={e} onClick={() => setNuevoEmoji(e)} style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', fontSize: '1rem', background: nuevoEmoji === e ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.06)', cursor: 'pointer' }}>{e}</button>)}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={addHabito} disabled={!nuevoNombre.trim() || habitoSaving}
                    style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', background: nuevoNombre.trim() ? '#8b5cf6' : 'rgba(139,92,246,0.3)', color: 'white', fontWeight: 600, fontSize: '0.82rem', cursor: nuevoNombre.trim() ? 'pointer' : 'default' }}>
                    {habitoSaving ? 'Guardando...' : 'Agregar hábito'}
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
                  + Crear hábito
                </button>
                <button onClick={() => setShowPlantillas(true)} style={{
                  padding: '0.75rem 1rem', borderRadius: '10px',
                  border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.05)',
                  color: '#6b7280', fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  📋 Plantillas
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── METAS ── */}
      {activeTab === 'metas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '14px', padding: '1.25rem', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.6, fontStyle: 'italic' }}>
              "El éxito es la realización progresiva de un ideal digno."<br />
              <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>— Earl Nightingale</span>
            </p>
          </div>
          {[
            { key: 'meta30', label: 'Meta de 30 días', emoji: '🌱', color: '#10b981', bg: 'rgba(16,185,129,0.06)', bdr: 'rgba(16,185,129,0.2)', value: metas?.meta30 },
            { key: 'meta90', label: 'Meta de 90 días', emoji: '🚀', color: '#a78bfa', bg: 'rgba(139,92,246,0.06)', bdr: 'rgba(139,92,246,0.2)', value: metas?.meta90 },
            { key: 'meta180', label: 'Meta de 180 días', emoji: '🏆', color: '#F5C518', bg: 'rgba(245,197,24,0.06)', bdr: 'rgba(245,197,24,0.2)', value: metas?.meta180 },
          ].map(m => (
            <div key={m.key} style={{ background: m.bg, border: `1px solid ${m.bdr}`, borderRadius: '14px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{m.emoji}</span>
                <span style={{ color: m.color, fontWeight: 700, fontSize: '0.9rem' }}>{m.label}</span>
              </div>
              {m.value
                ? <p style={{ margin: 0, color: '#d1d5db', fontSize: '0.9rem', lineHeight: 1.6 }}>{m.value}</p>
                : <p style={{ margin: 0, color: '#4b5563', fontSize: '0.85rem', fontStyle: 'italic' }}>Todavía sin escribir</p>
              }
            </div>
          ))}
          <Link href="/metas" style={{
            display: 'block', textAlign: 'center', padding: '0.875rem', borderRadius: '12px',
            border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.08)',
            color: '#a78bfa', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none',
          }}>✏️ Editar mis metas</Link>
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
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e5e7eb' }}>📋 Plantillas de hábitos</div>
              <button onClick={() => setShowPlantillas(false)} style={{ border: 'none', background: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#4b5563', marginBottom: '1rem', margin: '0 0 1rem' }}>
              Tocá uno para agregarlo a tu lista. Los que ya tenés no se duplican.
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
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: yaExiste ? '#4b5563' : '#e5e7eb' }}>{p.nombre}</div>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.1rem' }}>
                        {p.tipo === 'numero' ? `Numérico · ${p.meta_numero} ${p.unidad} diarios` : 'Sí/No diario'}
                      </div>
                    </div>
                    {yaExiste
                      ? <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>ya tenés</span>
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
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e5e7eb' }}>✏️ Editar día</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.15rem' }}>{editingDay}</div>
              </div>
              <button onClick={() => setEditingDay(null)} style={{ border: 'none', background: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, marginBottom: '0.625rem' }}>Hábitos</div>
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
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, marginBottom: '0.625rem' }}>💰 Movimientos</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: parseFloat(editIngresosInput) > 0 ? '0.75rem' : 0 }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#10b981', display: 'block', marginBottom: '0.3rem' }}>📈 Ingresos</label>
                  <input type="number" value={editIngresosInput} onChange={e => setEditIngresosInput(e.target.value)} placeholder="0"
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: '0.9rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#ef4444', display: 'block', marginBottom: '0.3rem' }}>📉 Gastos</label>
                  <input type="number" value={editGastosInput} onChange={e => setEditGastosInput(e.target.value)} placeholder="0"
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.9rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              {parseFloat(editIngresosInput) > 0 && (
                <button onClick={() => setEditDayFin(prev => ({ ...prev, ahorro: !prev.ahorro }))}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: 'none', background: editDayFin.ahorro ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', cursor: 'pointer', borderLeft: `3px solid ${editDayFin.ahorro ? '#10b981' : 'transparent'}` }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0, border: editDayFin.ahorro ? 'none' : '2px solid rgba(255,255,255,0.2)', background: editDayFin.ahorro ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {editDayFin.ahorro && <span style={{ fontSize: '0.6rem', color: 'white' }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '0.82rem', color: editDayFin.ahorro ? '#10b981' : '#9ca3af', fontWeight: editDayFin.ahorro ? 700 : 400 }}>
                    🐷 {editDayFin.ahorro ? `Ahorré ${fmt(Math.round(parseFloat(editIngresosInput) * 0.1))}` : `¿Ahorré el 10%? (${fmt(Math.round(parseFloat(editIngresosInput) * 0.1))})`}
                  </span>
                </button>
              )}
            </div>

            <button onClick={saveEditDay} disabled={editSaving} style={{
              width: '100%', padding: '0.875rem', borderRadius: '10px', border: 'none',
              background: editSaved ? '#10b981' : 'linear-gradient(135deg,#8B5CF6,#EC4899)',
              color: 'white', fontSize: '0.9rem', fontWeight: 700, cursor: editSaving ? 'default' : 'pointer',
            }}>
              {editSaving ? 'Guardando...' : editSaved ? '✓ ¡Guardado!' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

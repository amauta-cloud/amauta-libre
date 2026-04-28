'use client'

import { useState } from 'react'
import Link from 'next/link'

type UsuarioTabla = {
  id: string
  nombre: string | null
  email: string | null
  ultimaActividad: string | null
  authUser?: { created_at: string } | null
  streak: number
  habitosHoy: number
  educacionEtapa: number
}

export default function AdminUsuariosTable({
  usuarios,
  hace7,
  hace30,
}: {
  usuarios: UsuarioTabla[]
  hace7: string
  hace30: string
}) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? usuarios.filter(u => {
        const q = search.toLowerCase()
        return (u.nombre ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q)
      })
    : usuarios

  function exportCSV() {
    const headers = ['Nombre', 'Email', 'Registrado', 'Racha', 'Hábitos Hoy', 'Edu (paso)', 'Última actividad']
    const rows = filtered.map(u => [
      u.nombre ?? '',
      u.email ?? '',
      u.authUser?.created_at ? new Date(u.authUser.created_at).toLocaleDateString('es-AR') : '',
      String(u.streak),
      String(u.habitosHoy),
      String(u.educacionEtapa),
      u.ultimaActividad ?? 'nunca',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usuarios-amauta-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem', overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <h2 style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>
          Usuarios <span style={{ color: '#6b7280', fontWeight: 400 }}>({filtered.length}{filtered.length !== usuarios.length ? ` de ${usuarios.length}` : ''})</span>
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            style={{
              padding: '0.4rem 0.75rem', borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#e5e7eb', fontSize: '0.78rem', outline: 'none', width: '200px',
            }}
          />
          <button
            onClick={exportCSV}
            style={{
              padding: '0.4rem 0.75rem', borderRadius: '8px',
              border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(139,92,246,0.08)',
              color: '#a78bfa', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            ↓ CSV
          </button>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
        <thead>
          <tr>
            {['Usuario', 'Registrado', 'Racha', 'Hoy', 'Edu', 'Última actividad', ''].map(h => (
              <th key={h} style={{ textAlign: 'left', color: '#6b7280', fontWeight: 600, padding: '0.35rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(u => {
            const activo7d = u.ultimaActividad && u.ultimaActividad >= hace7
            const activo30d = u.ultimaActividad && u.ultimaActividad >= hace30
            const registrado = u.authUser?.created_at
              ? new Date(u.authUser.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })
              : '—'
            let actividadColor = '#374151'
            const actividadLabel = u.ultimaActividad ?? 'nunca'
            if (activo7d) { actividadColor = '#10b981' }
            else if (activo30d) { actividadColor = '#9ca3af' }
            else if (u.ultimaActividad) { actividadColor = '#6b7280' }
            const streakColor = u.streak >= 30 ? '#f59e0b' : u.streak >= 7 ? '#a78bfa' : u.streak > 0 ? '#6b7280' : '#374151'
            const eduColor = u.educacionEtapa >= 11 ? '#10b981' : u.educacionEtapa >= 5 ? '#a78bfa' : u.educacionEtapa > 0 ? '#6b7280' : '#374151'
            return (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>
                  <div style={{ color: '#e5e7eb', fontWeight: 500 }}>{u.nombre || '—'}</div>
                  <div style={{ color: '#4b5563', fontSize: '0.65rem' }}>{u.email}</div>
                </td>
                <td style={{ padding: '0.6rem 0.75rem', color: '#6b7280', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>{registrado}</td>
                <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>
                  <span style={{ color: streakColor, fontWeight: 600, fontSize: '0.78rem' }}>
                    {u.streak > 0 ? `${u.streak >= 7 ? '🔥' : '⚡'}${u.streak}d` : '—'}
                  </span>
                </td>
                <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>
                  <span style={{ color: u.habitosHoy > 0 ? '#10b981' : '#374151', fontWeight: u.habitosHoy > 0 ? 600 : 400, fontSize: '0.78rem' }}>
                    {u.habitosHoy > 0 ? `✓ ${u.habitosHoy}` : '—'}
                  </span>
                </td>
                <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>
                  <span style={{ color: eduColor, fontSize: '0.78rem', fontWeight: 600 }}>
                    {u.educacionEtapa}/11
                  </span>
                </td>
                <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>
                  <span style={{ color: actividadColor, fontSize: '0.72rem' }}>{actividadLabel}</span>
                </td>
                <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>
                  <Link href={`/admin/usuario/${u.id}`} style={{ fontSize: '0.72rem', color: '#7c3aed', textDecoration: 'none', padding: '0.25rem 0.5rem', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '6px' }}>
                    Ver →
                  </Link>
                </td>
              </tr>
            )
          })}
          {filtered.length === 0 && (
            <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#4b5563', fontSize: '0.8rem' }}>
              {search ? 'Sin resultados' : 'Sin usuarios registrados'}
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

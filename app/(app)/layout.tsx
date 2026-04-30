import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import LocalDateSync from '@/components/LocalDateSync'
import MetaPixelEvents from '@/components/MetaPixelEvents'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: perfil }, { data: educacionData }] = await Promise.all([
    supabase.from('usuarios').select('nombre').eq('id', user.id).maybeSingle(),
    supabase.from('educacion_estado').select('etapa_actual').eq('usuario_id', user.id).maybeSingle(),
  ])

  // Garantiza que el registro usuarios exista para nuevos usuarios
  if (!perfil) {
    await supabase.from('usuarios').upsert(
      { id: user.id, email: user.email ?? '', nombre: user.user_metadata?.full_name ?? user.user_metadata?.name ?? '' },
      { onConflict: 'id', ignoreDuplicates: true }
    )
  }
  const educacionPaso = educacionData?.etapa_actual ?? 0

  const meta = user.user_metadata || {}
  const identityData = user.identities?.[0]?.identity_data || {}
  const avatarUrl = meta.avatar_url || meta.picture || identityData.avatar_url || identityData.picture || null

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <NavBar
        nombre={perfil?.nombre || user.user_metadata?.full_name}
        avatar={avatarUrl}
        userId={user.id}
        educacionPaso={educacionPaso}
      />
      <LocalDateSync />
      <Suspense fallback={null}><MetaPixelEvents /></Suspense>
      <main style={{
        flex: 1,
        paddingBottom: '5rem',
        paddingLeft: '0',
        overflowX: 'hidden',
      }} className="app-main">
        {children}
      </main>
      <style>{`
        @media (min-width: 768px) {
          .app-main { padding-left: 220px !important; padding-bottom: 0 !important; }
        }
      `}</style>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('nombre, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <NavBar
        nombre={perfil?.nombre || user.user_metadata?.full_name}
        avatar={perfil?.avatar_url || user.user_metadata?.avatar_url}
        userId={user.id}
      />
      <main style={{
        flex: 1,
        paddingBottom: '5rem',        /* mobile: clear bottom nav */
        paddingLeft: '0',
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

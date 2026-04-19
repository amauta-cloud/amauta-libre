import { createClient } from '@/lib/supabase/server'
import MetasClient from './MetasClient'

export default async function MetasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <MetasClient userId={user!.id} />
  )
}

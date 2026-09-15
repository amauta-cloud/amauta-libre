export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Servidor MCP de AMAUTA Libre, para que Hermes (@nachito) anote las finanzas de Ignacio y le lleve
// la rutina de hábitos.
//
// Mismo modelo que Bienestar y la Librería: JSON-RPC 2.0 sobre HTTP (el modo simple del
// transporte Streamable HTTP de MCP), una request y una respuesta. El middleware ya deja
// pasar /api/ sin sesión, así que el bearer token es lo único que separa las finanzas de
// Ignacio de internet: se compara su huella en tiempo constante.

import { createHash, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { HERRAMIENTAS as FINANZAS } from '@/lib/mcp/herramientas'
import { HERRAMIENTAS_HABITOS } from '@/lib/mcp/habitos'
import { TOKEN_SHA256 } from '@/lib/mcp/acceso'

// Finanzas (13/09/2026) y hábitos (15/09/2026).
const HERRAMIENTAS = [...FINANZAS, ...HERRAMIENTAS_HABITOS]

type Rpc = { jsonrpc: '2.0'; id?: string | number | null; method?: string; params?: Record<string, unknown> }

const ok = (id: Rpc['id'], result: unknown) => NextResponse.json({ jsonrpc: '2.0', id, result })
const fail = (id: Rpc['id'], code: number, message: string) =>
  NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } })

function autorizado(header: string | null): boolean {
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token || !/^[0-9a-f]{64}$/.test(TOKEN_SHA256)) return false
  const recibido = createHash('sha256').update(token).digest()
  return timingSafeEqual(recibido, Buffer.from(TOKEN_SHA256, 'hex'))
}

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('[mcp] falta SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_URL')
    return NextResponse.json({ error: 'MCP no configurado' }, { status: 503 })
  }
  if (!autorizado(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let rpc: Rpc
  try { rpc = await request.json() } catch { return fail(null, -32700, 'JSON inválido') }
  const { id = null, method, params = {} } = rpc

  // Las notificaciones no llevan id y no esperan respuesta.
  if (method?.startsWith('notifications/')) return new NextResponse(null, { status: 204 })

  switch (method) {
    case 'initialize':
      return ok(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'amauta-libre', version: '1.0.0' },
      })

    case 'ping':
      return ok(id, {})

    case 'tools/list':
      return ok(id, {
        tools: HERRAMIENTAS.map(h => ({ name: h.name, description: h.description, inputSchema: h.inputSchema })),
      })

    case 'tools/call': {
      const nombre = String(params.name ?? '')
      const args = (params.arguments ?? {}) as Record<string, unknown>
      const h = HERRAMIENTAS.find(x => x.name === nombre)
      if (!h) return fail(id, -32602, `No existe la herramienta ${nombre}`)
      try {
        return ok(id, { content: [{ type: 'text', text: await h.run(args) }] })
      } catch (e) {
        console.error('[mcp]', nombre, e)
        // Como resultado y no como error de protocolo: así Hermes puede contarle a Ignacio qué pasó.
        return ok(id, { content: [{ type: 'text', text: '⚠️ Se me complicó ejecutar esa herramienta. Probá de nuevo.' }], isError: true })
      }
    }

    default:
      return fail(id, -32601, `Método no soportado: ${method}`)
  }
}

// Algunos clientes MCP tantean con GET antes de hablar.
export async function GET() {
  return NextResponse.json({ name: 'amauta-libre', transport: 'streamable-http', metodo: 'POST JSON-RPC 2.0' })
}

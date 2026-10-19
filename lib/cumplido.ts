// 19/10/2026: una sola regla de «cumplido» para toda la app (la misma de lib/mcp/habitos.ts, la que usa Nachi).
// Antes, en 16 lugares, un hábito con número contaba como hecho apenas se cargaba algo: 1 vaso de 8 ya figuraba «hecho».
// Sí/no: marcado. Con número: llegó a la meta; si el hábito no tiene meta, alcanza con anotar algo.
type Registro = { valor_bool: boolean | null; valor_numero: number | null }

export function cumplido(r: Registro | null | undefined, meta?: number | null): boolean {
  if (!r) return false
  if (r.valor_bool === true) return true
  if (r.valor_numero == null) return false
  return meta ? Number(r.valor_numero) >= Number(meta) : Number(r.valor_numero) > 0
}

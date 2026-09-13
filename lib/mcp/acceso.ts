// Quién puede usar el MCP de AMAUTA Libre y sobre qué usuario escribe.
//
// Sin variables de entorno a propósito: el token nunca está en el repo, solo su huella
// SHA-256, que no se puede revertir. El token lo tiene Hermes en /root/.hermes/.env
// (MCP_AMAUTA_LIBRE_API_KEY). Para cambiarlo: generar uno nuevo, poner acá su huella y
// actualizar Hermes. En Vercel se puede pisar con MCP_TOKEN_SHA256 y MCP_USUARIO_ID.

export const TOKEN_SHA256 = process.env.MCP_TOKEN_SHA256 || 'f076cd8886ab27b6ef843bea9da261295c37a1506c69647a34297f7c7a03eaa2'

/** amauta.iiaa@gmail.com: la cuenta de AMAUTA Libre de Ignacio (362 ítems de finanzas al 13/09/2026). */
export const USUARIO_ID = process.env.MCP_USUARIO_ID || '559cc2a2-f472-4d9c-be3c-d59f2b5b970b'

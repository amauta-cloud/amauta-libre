-- ============================================================
-- AMAUTA LIBRE — Fixes de auditoría (julio 2026)
-- Ejecutar en: Supabase Dashboard > SQL Editor (pegar todo y "Run")
-- Idempotente: se puede correr más de una vez sin romper nada.
-- ============================================================

-- ┌──────────────────────────────────────────────────────────┐
-- │ C-1 (CRÍTICO) — Fuga de soporte_mensajes                  │
-- │ La política SELECT USING (true) deja que cualquiera con   │
-- │ la anon key (pública) lea TODOS los mensajes de soporte.  │
-- │ El admin sigue leyendo por service_role (ignora RLS).     │
-- └──────────────────────────────────────────────────────────┘
alter table soporte_mensajes enable row level security;

-- Borrar cualquier política permisiva previa (nombres posibles)
drop policy if exists "admin reads all"                on soporte_mensajes;
drop policy if exists "Enable read access for all users" on soporte_mensajes;
drop policy if exists "public read soporte_mensajes"   on soporte_mensajes;
drop policy if exists "users read soporte"             on soporte_mensajes;
drop policy if exists "users insert own support"       on soporte_mensajes;
drop policy if exists "users read own soporte"         on soporte_mensajes;
drop policy if exists "users insert own soporte"       on soporte_mensajes;

-- El usuario solo lee y crea sus propios mensajes
create policy "users read own soporte"
  on soporte_mensajes for select
  using (auth.uid() = usuario_id);
create policy "users insert own soporte"
  on soporte_mensajes for insert
  with check (auth.uid() = usuario_id);


-- ┌──────────────────────────────────────────────────────────┐
-- │ A-1 (ALTO) — notas_admin_usuarios sin RLS confirmado      │
-- │ Notas privadas del admin sobre cada usuario. Hoy vacía,   │
-- │ pero en cuanto se cargue la 1ra nota quedaría pública si   │
-- │ RLS no está activo. El admin opera 100% por service_role. │
-- └──────────────────────────────────────────────────────────┘
alter table notas_admin_usuarios enable row level security;
drop policy if exists "Enable read access for all users" on notas_admin_usuarios;
drop policy if exists "public read notas"                on notas_admin_usuarios;
-- Sin políticas para usuarios: con RLS activo y sin policy permisiva,
-- ningún cliente anon/authenticated lee ni escribe. Solo service_role.


-- ┌──────────────────────────────────────────────────────────┐
-- │ M-1 (MEDIO) — Índices compuestos de acceso caliente       │
-- │ Prevención para cuando crezca la base (hoy hay ~1.9k regs)│
-- │ CONCURRENTLY no puede ir dentro de una transacción.       │
-- │ Si el SQL Editor da error por eso, corré este bloque      │
-- │ aparte, línea por línea.                                   │
-- └──────────────────────────────────────────────────────────┘
create index concurrently if not exists idx_habito_registros_usuario_fecha
  on habito_registros (usuario_id, fecha);
create index concurrently if not exists idx_habito_registros_fecha
  on habito_registros (fecha);
create index concurrently if not exists idx_finanzas_items_usuario_fecha
  on finanzas_items (usuario_id, fecha);
create index concurrently if not exists idx_habitos_usuario
  on habitos (usuario_id);
create index concurrently if not exists idx_tareas_usuario
  on tareas (usuario_id);
create index concurrently if not exists idx_push_events_usuario
  on push_events (usuario_id);


-- ┌──────────────────────────────────────────────────────────┐
-- │ B-1 (BAJO/opcional) — Blindar montos de finanzas          │
-- │ Descomentá si querés impedir montos <= 0.                 │
-- │ Antes revisá que no haya filas con monto <= 0.            │
-- └──────────────────────────────────────────────────────────┘
-- update finanzas_items set monto = abs(monto) where monto < 0;
-- delete from finanzas_items where monto = 0;
-- alter table finanzas_items
--   add constraint finanzas_items_monto_positivo check (monto > 0);


-- ============================================================
-- VERIFICACIÓN post-fix (correr después):
--   Con la ANON key, esto debe devolver [] (antes devolvía filas):
--   curl -s "https://<proyecto>.supabase.co/rest/v1/soporte_mensajes?select=*" \
--        -H "apikey: <ANON_KEY>"
-- ============================================================

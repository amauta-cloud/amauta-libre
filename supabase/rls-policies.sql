-- ============================================================
-- AMAUTA LIBRE — Row Level Security Policies
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── push_events (nueva tabla para click tracking) ────────────
create table if not exists push_events (
  id          uuid default gen_random_uuid() primary key,
  usuario_id  uuid references auth.users(id) on delete cascade not null,
  campaign    text not null,
  clicked_at  timestamptz default now()
);
alter table push_events enable row level security;
create policy "users read own push events"
  on push_events for select
  using (auth.uid() = usuario_id);
-- inserts are done via service role key (no insert policy needed for users)

-- ── habitos ──────────────────────────────────────────────────
alter table habitos enable row level security;
drop policy if exists "users manage own habitos" on habitos;
create policy "users manage own habitos"
  on habitos for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- ── habito_registros ─────────────────────────────────────────
alter table habito_registros enable row level security;
drop policy if exists "users manage own habito_registros" on habito_registros;
create policy "users manage own habito_registros"
  on habito_registros for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- ── finanzas_diarias ─────────────────────────────────────────
alter table finanzas_diarias enable row level security;
drop policy if exists "users manage own finanzas_diarias" on finanzas_diarias;
create policy "users manage own finanzas_diarias"
  on finanzas_diarias for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- ── finanzas_items ───────────────────────────────────────────
alter table finanzas_items enable row level security;
drop policy if exists "users manage own finanzas_items" on finanzas_items;
create policy "users manage own finanzas_items"
  on finanzas_items for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- ── finanzas_categorias ──────────────────────────────────────
alter table finanzas_categorias enable row level security;
drop policy if exists "users manage own finanzas_categorias" on finanzas_categorias;
create policy "users manage own finanzas_categorias"
  on finanzas_categorias for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- ── metas ────────────────────────────────────────────────────
alter table metas enable row level security;
drop policy if exists "users manage own metas" on metas;
create policy "users manage own metas"
  on metas for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- ── tareas ───────────────────────────────────────────────────
alter table tareas enable row level security;
drop policy if exists "users manage own tareas" on tareas;
create policy "users manage own tareas"
  on tareas for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- ── ideas ────────────────────────────────────────────────────
alter table ideas enable row level security;
drop policy if exists "users manage own ideas" on ideas;
create policy "users manage own ideas"
  on ideas for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- ── eventos ──────────────────────────────────────────────────
alter table eventos enable row level security;
drop policy if exists "users manage own eventos" on eventos;
create policy "users manage own eventos"
  on eventos for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- ── usuarios ─────────────────────────────────────────────────
alter table usuarios enable row level security;
drop policy if exists "users read own profile" on usuarios;
drop policy if exists "users update own profile" on usuarios;
create policy "users read own profile"
  on usuarios for select
  using (auth.uid() = id);
create policy "users update own profile"
  on usuarios for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
create policy "users insert own profile"
  on usuarios for insert
  with check (auth.uid() = id);

-- ── educacion_estado ─────────────────────────────────────────
alter table educacion_estado enable row level security;
drop policy if exists "users manage own educacion_estado" on educacion_estado;
create policy "users manage own educacion_estado"
  on educacion_estado for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- ── educacion_etapas (contenido global, solo lectura) ────────
alter table educacion_etapas enable row level security;
drop policy if exists "public read educacion_etapas" on educacion_etapas;
create policy "public read educacion_etapas"
  on educacion_etapas for select
  using (true);

-- ── push_subscriptions ───────────────────────────────────────
alter table push_subscriptions enable row level security;
drop policy if exists "users manage own push_subscriptions" on push_subscriptions;
create policy "users manage own push_subscriptions"
  on push_subscriptions for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

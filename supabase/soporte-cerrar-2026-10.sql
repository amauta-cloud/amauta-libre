-- AMAUTA Libre — cerrar soporte_mensajes (18/10/2026). Reemplaza el bloque C-1 de audit-fixes-2026-07.sql,
-- que borraba las reglas viejas por nombre: si la regla abierta se llamaba distinto, la fuga seguía (verificado:
-- el 18/10 la clave pública todavía leía todos los mensajes).
-- Seguro para la app: el usuario solo INSERTA lo suyo (NavBar); el panel, el borrado de cuenta y las notas
-- del admin usan la clave de servidor, que no pasa por estas reglas.

-- 1) Borra TODAS las reglas de soporte_mensajes, se llamen como se llamen
do $$ declare p record; begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'soporte_mensajes' loop
    execute format('drop policy %I on public.soporte_mensajes', p.policyname);
  end loop;
end $$;

-- 2) Protección activada y solo lo propio
alter table public.soporte_mensajes enable row level security;
create policy "users read own soporte" on public.soporte_mensajes for select using (auth.uid() = usuario_id);
create policy "users insert own soporte" on public.soporte_mensajes for insert with check (auth.uid() = usuario_id);

-- 3) Control: tiene que dar 2 reglas
select policyname, cmd from pg_policies where schemaname = 'public' and tablename = 'soporte_mensajes';

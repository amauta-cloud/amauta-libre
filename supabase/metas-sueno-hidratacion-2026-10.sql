-- 19/10/2026 (decisión de Ignacio): los hábitos de ejemplo con número arrancan con meta.
-- Antes no tenían y cualquier valor contaba como cumplido (1 vaso de agua = «hecho»).
-- 1) Los que ya existen (solo los de ejemplo, sin meta; los que cada uno creó con su nombre no se tocan)
update public.habitos set meta_numero = 8 where nombre = 'Hidratación' and unidad = 'vasos' and meta_numero is null;
update public.habitos set meta_numero = 7 where nombre = 'Horas de sueño' and unidad = 'horas' and meta_numero is null;
-- 2) Los que se crean al registrarse (disparador on_auth_user_created → crear_habitos_iniciales)
create or replace function public.crear_habitos_iniciales(p_usuario_id uuid)
returns void language plpgsql security definer as $function$
begin
  insert into public.habitos (usuario_id, nombre, emoji, tipo, unidad, obligatorio, orden, meta_numero) values
    (p_usuario_id, 'Ahorro / Finanzas', '💰', 'numero', '$', true, 1, null),
    (p_usuario_id, 'Hidratación', '💧', 'numero', 'vasos', true, 2, 8),
    (p_usuario_id, 'Ejercicio físico', '🏋️', 'boolean', null, true, 3, null),
    (p_usuario_id, 'Lectura', '📚', 'boolean', null, false, 4, null),
    (p_usuario_id, 'Horas de sueño', '😴', 'numero', 'horas', false, 5, 7),
    (p_usuario_id, 'Mindfulness / Meditación', '🧘', 'boolean', null, false, 6, null),
    (p_usuario_id, 'Alimentación consciente', '🥗', 'boolean', null, false, 7, null);
end;
$function$;

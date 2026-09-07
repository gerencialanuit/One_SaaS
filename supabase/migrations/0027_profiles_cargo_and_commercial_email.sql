-- Seccion "Usuarios" en el sidebar (solo gerente): cargo/puesto y un email
-- comercial editable, separados del email de login (que sigue siendo el de
-- auth.users, de solo lectura aqui).
alter table public.profiles add column cargo text;
alter table public.profiles add column commercial_email text;

-- El gerente ya puede VER todos los perfiles (migracion 0008). Le falta poder
-- EDITAR cargo/commercial_email/full_name de cualquier usuario, no solo el
-- propio (migracion 0001 solo permite auth.uid() = id en update).
create policy "gerente administra perfiles de cualquier usuario"
  on public.profiles for update
  to authenticated
  using (public.current_user_role() = 'gerente')
  with check (public.current_user_role() = 'gerente');

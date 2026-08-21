-- CRITICO: "Gerente can view all profiles" (migracion 0001) referenciaba
-- 'profiles' dentro de su propia policy sobre 'profiles' -> infinite recursion.
-- current_user_role() es SECURITY DEFINER y su consulta interna a profiles NO
-- dispara RLS (corre con los privilegios del dueño de la funcion).

drop policy "Gerente can view all profiles" on public.profiles;

create policy "Gerente can view all profiles"
  on public.profiles for select
  to authenticated
  using (public.current_user_role() = 'gerente');

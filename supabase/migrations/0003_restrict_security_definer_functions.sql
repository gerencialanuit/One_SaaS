-- Fix advisor WARN: revocar EXECUTE publico de funciones SECURITY DEFINER.
-- Postgres otorga EXECUTE a PUBLIC por defecto, y Supabase ademas otorga
-- permisos explicitos a anon/authenticated por separado de PUBLIC -- hay
-- que revocar de los 3 para que la funcion deje de ser invocable via
-- /rest/v1/rpc/<nombre> por cualquiera.

revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.current_user_role() from anon, authenticated, public;

-- current_user_role() se sigue pudiendo usar dentro de las policies RLS
-- (la evaluacion de RLS no depende de GRANT EXECUTE via API), pero ya no
-- es invocable como endpoint publico.

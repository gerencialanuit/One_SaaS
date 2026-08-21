-- Fase 7: acceso publico (sin login) a una cotizacion compartida, exclusivamente
-- por share_token exacto. NUNCA una policy 'using (true)' sobre quote_signatures
-- (expondria todos los tokens via /rest/v1/quote_signatures?select=*).

create or replace function public.get_shared_quote(p_token uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  update public.quote_signatures
  set viewed_at = coalesce(viewed_at, now())
  where share_token = p_token;

  select json_build_object(
    'quote_id', q.id,
    'project_type', q.project_type,
    'quote_status', q.status,
    'client_name', c.name,
    'version_number', qv.version_number,
    'subtotal', qv.subtotal,
    'discount_percent', qv.discount_percent,
    'total', qv.total,
    'estimated_delivery_date', qv.estimated_delivery_date,
    'decision', qs.decision,
    'decided_at', qs.decided_at,
    'signer_name', qs.signer_name,
    'items', (
      select coalesce(json_agg(json_build_object(
        'product_name', p.name,
        'quantity', qi.quantity,
        'unit_price', qi.unit_price
      )), '[]'::json)
      from public.quote_items qi
      join public.products p on p.id = qi.product_id
      where qi.quote_version_id = qv.id
    )
  )
  into result
  from public.quote_signatures qs
  join public.quote_versions qv on qv.id = qs.quote_version_id
  join public.quotes q on q.id = qv.quote_id
  join public.clients c on c.id = q.client_id
  where qs.share_token = p_token;

  return result;
end;
$$;

revoke execute on function public.get_shared_quote(uuid) from public;
grant execute on function public.get_shared_quote(uuid) to anon, authenticated;

create or replace function public.decide_shared_quote(
  p_token uuid,
  p_decision text,
  p_signature_data text,
  p_signer_name text,
  p_signer_ip text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_signature_id uuid;
  v_quote_id uuid;
  v_already_decided text;
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decision invalida';
  end if;

  select qs.id, q.id, qs.decision
  into v_signature_id, v_quote_id, v_already_decided
  from public.quote_signatures qs
  join public.quote_versions qv on qv.id = qs.quote_version_id
  join public.quotes q on q.id = qv.quote_id
  where qs.share_token = p_token;

  if v_signature_id is null then
    raise exception 'Cotización no encontrada';
  end if;

  if v_already_decided is not null then
    raise exception 'Esta cotización ya fue procesada';
  end if;

  update public.quote_signatures
  set decision = p_decision,
      signature_data = p_signature_data,
      signer_name = p_signer_name,
      signer_ip = p_signer_ip,
      decided_at = now()
  where id = v_signature_id;

  update public.quotes
  set status = p_decision,
      updated_at = now()
  where id = v_quote_id;
end;
$$;

revoke execute on function public.decide_shared_quote(uuid, text, text, text, text) from public;
grant execute on function public.decide_shared_quote(uuid, text, text, text, text) to anon, authenticated;

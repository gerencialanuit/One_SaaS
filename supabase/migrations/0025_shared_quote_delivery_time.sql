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
    'quote_number', q.quote_number,
    'project_type', q.project_type,
    'quote_status', q.status,
    'client_name', c.name,
    'client_city', c.city,
    'commercial_name', pr.full_name,
    'commercial_email', pr.email,
    'version_number', qv.version_number,
    'subtotal', qv.subtotal,
    'discount_percent', qv.discount_percent,
    'total', qv.total,
    'estimated_delivery_date', qv.estimated_delivery_date,
    'intro_message', qv.intro_message,
    'payment_terms', qv.payment_terms,
    'delivery_time_text', qv.delivery_time_text,
    'validity_text', qv.validity_text,
    'notes', qv.notes,
    'issued_date', qv.created_at,
    'decision', qs.decision,
    'decided_at', qs.decided_at,
    'signer_name', qs.signer_name,
    'items', (
      select coalesce(json_agg(json_build_object(
        'product_name', p.name,
        'product_description', p.description,
        'product_image_url', p.image_url,
        'zone_name', qi.zone_name,
        'quantity', qi.quantity,
        'unit_price', qi.unit_price
      )), '[]'::json)
      from public.quote_items qi
      join public.products p on p.id = qi.product_id
      where qi.quote_version_id = qv.id
    ),
    'taxes', (
      select coalesce(json_agg(json_build_object(
        'name', qt.name,
        'rate', qt.rate,
        'kind', qt.kind,
        'enabled', qt.enabled,
        'amount', qt.amount
      )), '[]'::json)
      from public.quote_taxes qt
      where qt.quote_version_id = qv.id
    )
  )
  into result
  from public.quote_signatures qs
  join public.quote_versions qv on qv.id = qs.quote_version_id
  join public.quotes q on q.id = qv.quote_id
  join public.clients c on c.id = q.client_id
  join public.profiles pr on pr.id = q.commercial_id
  where qs.share_token = p_token;

  return result;
end;
$$;

revoke execute on function public.get_shared_quote(uuid) from public;
grant execute on function public.get_shared_quote(uuid) to anon, authenticated;

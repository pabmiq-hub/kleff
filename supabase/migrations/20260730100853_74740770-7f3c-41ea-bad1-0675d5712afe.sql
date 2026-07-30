revoke execute on function public.karma_active_season() from public, anon;
revoke execute on function public.karma_lifetime(uuid) from public, anon;
revoke execute on function public.karma_balance(uuid) from public, anon;
revoke execute on function public.karma_category_usage(uuid, uuid) from public, anon;
grant execute on function public.karma_active_season() to authenticated, service_role;
grant execute on function public.karma_lifetime(uuid) to authenticated, service_role;
grant execute on function public.karma_balance(uuid) to authenticated, service_role;
grant execute on function public.karma_category_usage(uuid, uuid) to authenticated, service_role;
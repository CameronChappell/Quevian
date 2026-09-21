-- Applied through the Supabase migration tool. No secrets are stored in this file.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
create schema if not exists quevian_ops;
revoke all on schema quevian_ops from public, anon, authenticated;
create table if not exists quevian_ops.requests (request_id bigint primary key, task text not null, created_at timestamptz not null default now());
alter table quevian_ops.requests enable row level security;
revoke all on quevian_ops.requests from public, anon, authenticated;
create or replace function quevian_ops.dispatch(task text default 'maintenance') returns bigint language plpgsql security invoker set search_path='' as $$
declare request_id bigint; token text; base_url text;
begin
 if task not in ('maintenance','backup','health') then raise exception 'Unsupported job'; end if;
 select decrypted_secret into token from vault.decrypted_secrets where name='quevian_job_token';
 select decrypted_secret into base_url from vault.decrypted_secrets where name='quevian_job_origin';
 if token is null or base_url is null then raise exception 'Job configuration missing'; end if;
 if task='health' then
  select net.http_get(url:=base_url||'/api/health',headers:=jsonb_build_object('Authorization','Bearer '||token),timeout_milliseconds:=15000) into request_id;
 else
  select net.http_post(url:=base_url||'/api/internal/jobs/'||task,headers:=jsonb_build_object('Authorization','Bearer '||token,'Content-Type','application/json'),body:='{}'::jsonb,timeout_milliseconds:=60000) into request_id;
 end if;
 insert into quevian_ops.requests values(request_id,task,now());
 return request_id;
end;$$;
revoke all on function quevian_ops.dispatch(text) from public, anon, authenticated;
-- Vault values are configured through secret-aware tools.
-- Activate after the application job routes are deployed:
-- select cron.schedule('quevian-maintenance','*/2 * * * *',$job$select quevian_ops.dispatch('maintenance');$job$);
-- select cron.schedule('quevian-backup','15 3 * * *',$job$select quevian_ops.dispatch('backup');$job$);
-- select cron.schedule('quevian-health','*/5 * * * *',$job$select quevian_ops.dispatch('health');$job$);

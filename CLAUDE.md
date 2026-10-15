# RYNO Dashboard — notas para agentes

## Tablas nuevas: GRANT explícito + RLS desde el 30-oct-2026

Desde el **30-oct-2026** Supabase ya no expone sola al Data API (supabase-js, `/rest/v1`, `/graphql/v1`) una tabla o vista nueva en `public`: sin `GRANT` responde **42501 `permission denied for table …`**, también con la llave `service_role` (esa se salta la RLS, no los GRANT). Las tablas que ya existen no cambian. Fuente: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically

Toda migración de `supabase/migrations` que cree una tabla o vista en `public` lleva en el MISMO archivo el GRANT y la RLS (proyecto `xzkasvcqvddmgybzajeu`):

```sql
create table public.notas (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), texto text);
alter table public.notas enable row level security;
create policy "notas: lo propio" on public.notas for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.notas to authenticated;
-- anon SOLO si una pantalla sin sesión la lee de verdad: grant select on public.notas to anon; + su create policy … for select to anon using (…);
```

- Conceder **lo mínimo que usa el código**: mirar cada `.from('tabla')` y con qué cliente corre (sesión del usuario = `authenticated`, llave de servidor = `service_role`). Si el servidor la toca con la service key, también `grant … to service_role`.
- `serial`/`bigserial` necesita además `grant usage, select on sequence public.<tabla>_id_seq to …`.
- Las funciones no cambian (Postgres sigue dando EXECUTE a PUBLIC): si `anon` no debe llamarla, `revoke execute on function … from public, anon`.
- Probar antes con `BEGIN … ROLLBACK` haciendo `set local role authenticated` (y `anon`): el SELECT tiene que pasar o fallar por RLS, nunca por 42501.

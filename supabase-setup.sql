-- Execute este SQL no Supabase > SQL Editor.
-- Cria as tabelas que o site usa: itens (contagem de doações) e recados (mural).

create table if not exists public.itens (
  id text primary key check (id in ('camisa-curta', 'camisa-longa', 'gravata', 'calca')),
  count integer not null default 0 check (count >= 0 and count <= 10000)
);

insert into public.itens (id, count) values
  ('camisa-curta', 0), ('camisa-longa', 0), ('gravata', 0), ('calca', 0)
on conflict (id) do nothing;

create table if not exists public.recados (
  id bigint generated always as identity primary key,
  nome text not null check (char_length(trim(nome)) between 1 and 40),
  texto text not null check (char_length(trim(texto)) between 1 and 280),
  created_at timestamptz not null default now()
);

alter table public.itens enable row level security;
alter table public.recados enable row level security;

revoke all on public.itens from anon, authenticated;
revoke all on public.recados from anon, authenticated;
grant select on public.itens to anon, authenticated;
grant select, insert on public.recados to anon, authenticated;
grant usage, select on sequence public.recados_id_seq to anon, authenticated;

drop policy if exists "Public can read item counts" on public.itens;
create policy "Public can read item counts" on public.itens
for select to anon, authenticated using (true);

drop policy if exists "Public can read recados" on public.recados;
create policy "Public can read recados" on public.recados
for select to anon, authenticated using (true);

drop policy if exists "Public can post recados" on public.recados;
create policy "Public can post recados" on public.recados
for insert to anon, authenticated
with check (char_length(trim(nome)) between 1 and 40 and char_length(trim(texto)) between 1 and 280);

-- O contador só pode mudar em +/- 1 e apenas para os quatro itens previstos.
create or replace function public.ajustar_item(p_item_id text, p_delta integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_item_id not in ('camisa-curta', 'camisa-longa', 'gravata', 'calca') then
    raise exception 'Item inválido';
  end if;
  if p_delta not in (-1, 1) then
    raise exception 'Alteração inválida';
  end if;
  update public.itens
     set count = greatest(0, least(10000, count + p_delta))
   where id = p_item_id;
  if not found then
    raise exception 'Item não encontrado';
  end if;
end;
$$;

revoke all on function public.ajustar_item(text, integer) from public;
grant execute on function public.ajustar_item(text, integer) to anon, authenticated;

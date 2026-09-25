-- Allegati del Portale Scuola: PDF e immagini, max 5 MB per file
create table if not exists public.richieste_intervento_allegati (
  id uuid primary key default gen_random_uuid(),
  richiesta_id uuid not null references public.richieste_intervento(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  nome_file text not null,
  mime_type text not null,
  dimensione_bytes bigint not null check (dimensione_bytes > 0 and dimensione_bytes <= 5242880),
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists richieste_intervento_allegati_richiesta_idx
  on public.richieste_intervento_allegati(richiesta_id);

alter table public.richieste_intervento_allegati enable row level security;

drop policy if exists "school_allegati_select" on public.richieste_intervento_allegati;
create policy "school_allegati_select"
on public.richieste_intervento_allegati
for select to authenticated
using (public.school_user_has_request(auth.uid(), richiesta_id));

drop policy if exists "school_allegati_insert" on public.richieste_intervento_allegati;
create policy "school_allegati_insert"
on public.richieste_intervento_allegati
for insert to authenticated
with check (
  created_by = auth.uid()
  and public.school_user_has_request(auth.uid(), richiesta_id)
  and mime_type in ('application/pdf','image/jpeg','image/png','image/gif','image/webp','image/bmp','image/tiff')
  and dimensione_bytes between 1 and 5242880
);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'richieste-intervento',
  'richieste-intervento',
  false,
  5242880,
  array['application/pdf','image/jpeg','image/png','image/gif','image/webp','image/bmp','image/tiff']::text[]
)
on conflict (id) do update set
  public=false,
  file_size_limit=5242880,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "school_request_files_select" on storage.objects;
create policy "school_request_files_select"
on storage.objects
for select to authenticated
using (
  bucket_id='richieste-intervento'
  and public.school_user_has_request(auth.uid(), split_part(name,'/',1)::uuid)
);

drop policy if exists "school_request_files_insert" on storage.objects;
create policy "school_request_files_insert"
on storage.objects
for insert to authenticated
with check (
  bucket_id='richieste-intervento'
  and public.school_user_has_request(auth.uid(), split_part(name,'/',1)::uuid)
  and (storage.extension(name) in ('pdf','jpg','jpeg','png','gif','webp','bmp','tif','tiff'))
  and (coalesce((metadata->>'size')::bigint,0) between 1 and 5242880)
);
-- Phase 5 foundation only. The app currently uses local browser persistence.
-- Apply in Supabase SQL Editor or with `supabase db push` when wiring auth/sync.
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text check (char_length(display_name) <= 100),
 preferred_language text not null default 'auto' check (preferred_language in ('auto','zh','en')),
 created_at timestamptz not null default now()
);
create table public.pets (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 name text not null check (char_length(trim(name)) between 1 and 24),
 species text not null default 'dog' check (species = 'dog'),
 breed text not null default 'golden_retriever' check (breed = 'golden_retriever'),
 personality text not null check (personality in ('friendly','calm','playful','independent')),
 voice_id text not null default 'marin',
 adopted_at timestamptz not null default now(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(id,owner_id)
);
create table public.pet_states (
 pet_id uuid primary key references public.pets(id) on delete cascade,
 energy real not null default 75 check (energy between 0 and 100),
 satiety real not null default 65 check (satiety between 0 and 100),
 mood text not null default 'calm' check (mood in ('calm','happy','curious','sleepy')),
 activity text not null default 'idle' check (activity in ('idle','look_at_user','blink','sit','lie_down','sleep','wake_up','walk','tail_wag','eat','play','happy','curious','listen','speak')),
 last_fed_at timestamptz, last_played_at timestamptz, last_interaction_at timestamptz,
 updated_at timestamptz not null default now()
);
create table public.conversations (
 id uuid primary key default gen_random_uuid(), pet_id uuid not null, owner_id uuid not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(pet_id,owner_id) references public.pets(id,owner_id) on delete cascade,
 unique(id,owner_id)
);
create table public.messages (
 id uuid primary key default gen_random_uuid(),conversation_id uuid not null,owner_id uuid not null,
 role text not null check (role in ('user','assistant')), content text not null check (char_length(content) between 1 and 12000),
 modality text not null default 'text' check (modality in ('text','voice')),
 created_at timestamptz not null default now(),
 foreign key(conversation_id,owner_id) references public.conversations(id,owner_id) on delete cascade
);
create table public.memories (
 id uuid primary key default gen_random_uuid(),pet_id uuid not null,owner_id uuid not null,
 content text not null check (char_length(content) between 1 and 500),
 category text not null default 'shared_experience', approved boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(pet_id,owner_id) references public.pets(id,owner_id) on delete cascade
);
create table public.pet_interactions (
 id uuid primary key default gen_random_uuid(),pet_id uuid not null,owner_id uuid not null,
 interaction_type text not null check (interaction_type in ('feed','pet','play')),
 metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),
 foreign key(pet_id,owner_id) references public.pets(id,owner_id) on delete cascade
);
create table public.user_preferences (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 subtitles_enabled boolean not null default true,auto_speech_enabled boolean not null default false,
 long_term_memory_enabled boolean not null default false,updated_at timestamptz not null default now()
);
create index pets_owner_idx on public.pets(owner_id);
create index conversations_owner_pet_idx on public.conversations(owner_id,pet_id);
create index messages_conversation_time_idx on public.messages(conversation_id,created_at);
create index messages_owner_idx on public.messages(owner_id);
create index memories_pet_approved_idx on public.memories(owner_id,pet_id,approved);
create index pet_interactions_pet_time_idx on public.pet_interactions(owner_id,pet_id,created_at);
alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.pet_states enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.memories enable row level security;
alter table public.pet_interactions enable row level security;
alter table public.user_preferences enable row level security;
create policy profiles_own on public.profiles for all to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy pets_own on public.pets for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy states_own on public.pet_states for all to authenticated
 using (exists(select 1 from public.pets where id=pet_id and owner_id=(select auth.uid())))
 with check (exists(select 1 from public.pets where id=pet_id and owner_id=(select auth.uid())));
create policy conversations_own on public.conversations for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy messages_own on public.messages for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy memories_own on public.memories for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy interactions_own on public.pet_interactions for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy preferences_own on public.user_preferences for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
-- Composite FKs above prevent a user from attaching their own rows to another user's pet/conversation.
-- No service role credentials belong in the browser; auth/profile provisioning is a later milestone.

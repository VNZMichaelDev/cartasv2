-- Create room_players table for tracking players in rooms
create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  player_id uuid references public.profiles(id) on delete cascade,
  connected boolean default true,
  joined_at timestamp with time zone default now(),
  unique(room_id, player_id)
);

-- Enable RLS
alter table public.room_players enable row level security;

-- RLS policies for room_players
create policy "room_players_select_all"
  on public.room_players for select
  using (true);

create policy "room_players_insert_own"
  on public.room_players for insert
  with check (auth.uid() = player_id);

create policy "room_players_update_own"
  on public.room_players for update
  using (auth.uid() = player_id);

create policy "room_players_delete_own"
  on public.room_players for delete
  using (auth.uid() = player_id);

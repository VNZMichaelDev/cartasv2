-- Create game_moves table for real-time updates and history
create table if not exists public.game_moves (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  player_id uuid references public.profiles(id) on delete cascade,
  move_type text check (move_type in ('play_card', 'call_truco', 'call_envido', 'call_flor', 'accept_call', 'reject_call')) not null,
  move_data jsonb not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.game_moves enable row level security;

-- RLS policies for game_moves
create policy "game_moves_select_room_players"
  on public.game_moves for select
  using (
    exists (
      select 1 from public.room_players
      where room_players.room_id = game_moves.room_id
      and room_players.player_id = auth.uid()
    )
  );

create policy "game_moves_insert_own"
  on public.game_moves for insert
  with check (auth.uid() = player_id);

-- Create index for real-time subscriptions
create index if not exists game_moves_room_id_created_at_idx 
on public.game_moves (room_id, created_at desc);

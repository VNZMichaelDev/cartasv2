-- Create game_states table for persisting game data
create table if not exists public.game_states (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade unique,
  deck jsonb not null,
  hands jsonb not null,
  table_cards jsonb not null,
  won_tricks jsonb not null,
  turn_player_id uuid references public.profiles(id),
  hand_starter_id uuid references public.profiles(id),
  round_number integer check (round_number in (1, 2, 3)) default 1,
  current_call jsonb,
  call_accepted boolean default false,
  scores jsonb not null,
  winner_id uuid references public.profiles(id),
  phase text check (phase in ('flor', 'envido', 'truco', 'playing')) default 'playing',
  envido_points jsonb,
  flor_called boolean default false,
  envido_called boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.game_states enable row level security;

-- RLS policies for game_states - players in the room can view/update
create policy "game_states_select_room_players"
  on public.game_states for select
  using (
    exists (
      select 1 from public.room_players
      where room_players.room_id = game_states.room_id
      and room_players.player_id = auth.uid()
    )
  );

create policy "game_states_insert_room_creator"
  on public.game_states for insert
  with check (
    exists (
      select 1 from public.rooms
      where rooms.id = game_states.room_id
      and rooms.creator_id = auth.uid()
    )
  );

create policy "game_states_update_room_players"
  on public.game_states for update
  using (
    exists (
      select 1 from public.room_players
      where room_players.room_id = game_states.room_id
      and room_players.player_id = auth.uid()
    )
  );

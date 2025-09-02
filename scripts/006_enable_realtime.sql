-- Enable real-time subscriptions for tables
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_players;
alter publication supabase_realtime add table public.game_states;
alter publication supabase_realtime add table public.game_moves;

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add updated_at triggers
create trigger handle_updated_at_rooms
  before update on public.rooms
  for each row
  execute function public.handle_updated_at();

create trigger handle_updated_at_profiles
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create trigger handle_updated_at_game_states
  before update on public.game_states
  for each row
  execute function public.handle_updated_at();

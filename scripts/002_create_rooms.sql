-- Create rooms table for game sessions
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  creator_id uuid references public.profiles(id) on delete cascade,
  status text check (status in ('waiting', 'playing', 'ended')) default 'waiting',
  max_points integer check (max_points in (15, 30)) default 15,
  with_flor boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.rooms enable row level security;

-- RLS policies for rooms - anyone can view, only creator can modify
create policy "rooms_select_all"
  on public.rooms for select
  using (true);

create policy "rooms_insert_own"
  on public.rooms for insert
  with check (auth.uid() = creator_id);

create policy "rooms_update_creator"
  on public.rooms for update
  using (auth.uid() = creator_id);

create policy "rooms_delete_creator"
  on public.rooms for delete
  using (auth.uid() = creator_id);

-- Function to generate unique room codes
create or replace function generate_room_code()
returns text
language plpgsql
as $$
declare
  code text;
  exists boolean;
begin
  loop
    -- Generate 6-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    select count(*) > 0 into exists
    from public.rooms
    where rooms.code = code;
    
    -- Exit loop if code is unique
    exit when not exists;
  end loop;
  
  return code;
end;
$$;

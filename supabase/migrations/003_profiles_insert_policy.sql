-- Allow signed-in users to create their own profile row if the auth trigger missed it

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

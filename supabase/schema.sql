-- Schema for Trello-style Board

-- Clean up existing tables to avoid "already exists" errors
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.cards CASCADE;
DROP TABLE IF EXISTS public.lists CASCADE;
DROP TABLE IF EXISTS public.boards CASCADE;

-- Create Boards Table
CREATE TABLE public.boards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id)
);

-- Create Lists Table
CREATE TABLE public.lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0
);

-- Create Cards Table
CREATE TABLE public.cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    list_id UUID REFERENCES public.lists(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    color TEXT DEFAULT 'gray',
    user_id UUID REFERENCES auth.users(id),
    due_date DATE
);

-- Create Comments Table (Chat inside cards)
CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    content TEXT NOT NULL,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    user_avatar TEXT
);

-- Create Meetings Table (Calls for the Calendar)
CREATE TABLE public.meetings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    meeting_date DATE NOT NULL,
    time_start TEXT,
    time_end TEXT,
    color TEXT DEFAULT 'blue',
    user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Create policies (for testing, allow all authenticated users or anon if needed)
CREATE POLICY "Allow all read" ON public.boards FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.boards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.boards FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.boards FOR DELETE USING (true);

CREATE POLICY "Allow all read" ON public.lists FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.lists FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.lists FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.lists FOR DELETE USING (true);

CREATE POLICY "Allow all read" ON public.cards FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.cards FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.cards FOR DELETE USING (true);

CREATE POLICY "Allow all read" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.comments FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.comments FOR DELETE USING (true);

CREATE POLICY "Allow all read" ON public.meetings FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.meetings FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.meetings FOR DELETE USING (true);

-- Enable Realtime
alter publication supabase_realtime add table public.boards;
alter publication supabase_realtime add table public.lists;
alter publication supabase_realtime add table public.cards;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.meetings;

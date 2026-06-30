-- 005_add_checkins.sql

CREATE TABLE IF NOT EXISTS public.venue_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(venue_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.venue_checkins ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Anyone can view checkins" ON public.venue_checkins FOR SELECT USING (true);
CREATE POLICY "Users can check in" ON public.venue_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove check in" ON public.venue_checkins FOR DELETE USING (auth.uid() = user_id);

-- Optional: Create an RPC to easily get checkin count and users per venue
CREATE OR REPLACE FUNCTION get_venue_checkins(p_venue_id TEXT)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    checked_in_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vc.user_id,
        p.username,
        p.avatar_url,
        vc.created_at
    FROM public.venue_checkins vc
    JOIN public.profiles p ON vc.user_id = p.id
    WHERE vc.venue_id = p_venue_id
    -- Só mostramos check-ins das últimas 12 horas para manter atualizado
    AND vc.created_at > NOW() - INTERVAL '12 hours'
    ORDER BY vc.created_at DESC;
END;
$$;

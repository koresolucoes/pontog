-- Migration: add_favorites
CREATE TABLE IF NOT EXISTS favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    favorite_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, favorite_id)
);

-- RLS for favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own favorites" 
ON favorites FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own favorites" 
ON favorites FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON favorites FOR DELETE 
USING (auth.uid() = user_id);

-- RPC for fetching favorite users details
CREATE OR REPLACE FUNCTION get_my_favorite_users()
RETURNS TABLE (
    favorite_id UUID,
    username TEXT,
    avatar_url TEXT,
    age INT,
    distance_km FLOAT,
    is_verified BOOLEAN,
    subscription_tier TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.favorite_id,
        p.username,
        p.avatar_url,
        (EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth::DATE)))::INT AS age,
        NULL::FLOAT AS distance_km,
        p.is_verified,
        p.subscription_tier
    FROM favorites f
    JOIN profiles p ON p.id = f.favorite_id
    WHERE f.user_id = auth.uid()
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

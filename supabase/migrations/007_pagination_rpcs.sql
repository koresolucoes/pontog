-- RPC paginado para o modo Agora
CREATE OR REPLACE FUNCTION get_active_agora_posts_paginated(p_page INT DEFAULT 1, p_limit INT DEFAULT 20)
RETURNS TABLE (
    id BIGINT,
    user_id UUID,
    photo_url TEXT,
    status_text TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    username TEXT,
    avatar_url TEXT,
    date_of_birth DATE,
    likes_count BIGINT,
    comments_count BIGINT,
    user_has_liked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ap.id,
        ap.user_id,
        ap.photo_url,
        ap.status_text,
        ap.expires_at,
        ap.created_at,
        p.username,
        p.avatar_url,
        p.date_of_birth,
        (SELECT COUNT(*) FROM agora_post_likes ar WHERE ar.post_id = ap.id) AS likes_count,
        (SELECT COUNT(*) FROM agora_post_comments ac WHERE ac.post_id = ap.id) AS comments_count,
        EXISTS(SELECT 1 FROM agora_post_likes ar WHERE ar.post_id = ap.id AND ar.user_id = auth.uid()) AS user_has_liked
    FROM agora_posts ap
    JOIN profiles p ON p.id = ap.user_id
    WHERE ap.expires_at > NOW()
    ORDER BY ap.created_at DESC
    LIMIT p_limit
    OFFSET (p_page - 1) * p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

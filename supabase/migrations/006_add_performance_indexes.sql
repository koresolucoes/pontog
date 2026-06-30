-- Otimizações de Performance para Alta Demanda (Indexes)
-- Esses índices evitam "Sequential Scans" (varreduras completas) nas tabelas durante picos de acesso.

-- 1. Profiles (Filtros do Mapa e Lista de Usuários)
-- Agiliza a busca por usuários online usando last_seen
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen DESC);
-- Otimiza a busca espacial se houver uso extensivo de lat/lng
CREATE INDEX IF NOT EXISTS idx_profiles_lat_lng ON profiles(lat, lng);

-- 2. Feed "Agora" (Otimização de Joins e Ordenação)
-- Muito importante para carregar o feed rapidamente e ordenado por data
CREATE INDEX IF NOT EXISTS idx_agora_posts_created_at ON agora_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agora_posts_user_id ON agora_posts(user_id);
-- Agiliza o carregamento de comentários e reações vinculados a um post
CREATE INDEX IF NOT EXISTS idx_agora_comments_post_id ON agora_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_agora_reactions_post_id ON agora_post_likes(post_id);

-- 3. Mensagens e Inbox (Otimização de leitura de Chats)
-- Agiliza encontrar chats onde o usuário participa
CREATE INDEX IF NOT EXISTS idx_conv_participants_user_id ON conversation_participants(user_id);
-- Muito importante para carregar o histórico de uma conversa em ordem cronológica
CREATE INDEX IF NOT EXISTS idx_messages_conv_id_created_at ON messages(conversation_id, created_at DESC);

-- 4. Relações e Interações sociais
-- Otimiza a verificação de favoritos
CREATE INDEX IF NOT EXISTS idx_favorites_user_favorite ON favorites(user_id, favorite_id);
-- Otimiza o carregamento de check-ins de um local específico
CREATE INDEX IF NOT EXISTS idx_venue_checkins_venue_id ON venue_checkins(venue_id);

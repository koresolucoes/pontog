// api/admin/users.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const verifyAdmin = (req: VercelRequest) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('Not authenticated');
    // This will throw if invalid, which is caught below
    jwt.verify(token, process.env.JWT_SECRET!);
};

// Server-safe function to construct public image URLs
const getPublicImageUrlServer = (supabaseClient: SupabaseClient, path: string | null | undefined): string => {
    const BUCKET_NAME = 'user_uploads';
    if (!path) return 'https://placehold.co/400x400/1f2937/d1d5db/png?text=G'; 
    
    if (path.startsWith('http')) {
        if (path.includes('?t=')) return path;
        return `${path}?t=${new Date().getTime()}`;
    }
    
    const { data } = supabaseClient.storage.from(BUCKET_NAME).getPublicUrl(path);

    return `${data.publicUrl}?t=${new Date().getTime()}`;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    verifyAdmin(req);
    
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // FIX: Replace failing RPC call with a direct query.
    // This query fetches all profile data and joins related user/tribe info.
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        users ( email, created_at ),
        profile_tribes ( tribes ( name ) )
      `)
      .order('created_at', { referencedTable: 'users', ascending: false });

    if (error) throw error;
        
    // Process the nested data to match the flat 'Profile' type
    const processedData = data.map((profile: any) => {
        const { users: user, profile_tribes, location, ...rest } = profile;
        
        return {
            ...rest,
            email: user?.email,
            created_at: user?.created_at,
            tribes: profile_tribes.map((pt: any) => pt.tribes.name),
            lat: location ? location.coordinates[1] : null,
            lng: location ? location.coordinates[0] : null,
            distance_km: null, // Distance is not relevant in the admin panel
            avatar_url: getPublicImageUrlServer(supabaseAdmin, profile.avatar_url),
            public_photos: (profile.public_photos || []).map((p: string) => getPublicImageUrlServer(supabaseAdmin, p)),
        }
    });

    res.status(200).json(processedData);

  } catch (error: any) {
    console.error(`Error in /api/admin/users: ${error.message}`);
    // Distinguish between auth errors and server errors for better client-side handling.
    if (error.message === 'Not authenticated' || error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Authentication failed' });
    }
    // For Supabase errors or other issues, send a 500
    return res.status(500).json({ error: error.message || 'A server error occurred.' });
  }
}

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

    // Call the RPC function to get user data with emails
    const { data, error } = await supabaseAdmin.rpc('get_all_users_for_admin');

    if (error) throw error;
        
    // Process avatar URLs before sending
    const processedData = data.map(user => ({
      ...user,
      avatar_url: getPublicImageUrlServer(supabaseAdmin, user.avatar_url)
    }));

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
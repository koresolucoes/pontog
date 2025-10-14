// api/admin/users.ts
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { getPublicImageUrl } from '../../lib/supabase';

const verifyAdmin = (req: VercelRequest) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('Not authenticated');
    jwt.verify(token, process.env.JWT_SECRET!);
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

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false }); // FIX: Changed created_at to updated_at

    if (error) throw error;
        
    // Process avatar URLs before sending
    const processedData = data.map(user => ({
      ...user,
      avatar_url: getPublicImageUrl(user.avatar_url)
    }));

    res.status(200).json(processedData);

  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Authentication failed' });
  }
}

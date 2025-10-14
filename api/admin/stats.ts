// api/admin/stats.ts
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

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

    const { count: totalUsers } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    const { count: activeSubscriptions } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_tier', 'plus')
        .gt('subscription_expires_at', new Date().toISOString());

    const { data: totalRevenueData, error: revenueError } = await supabaseAdmin
        .from('payments')
        .select('amount')
        .eq('status', 'approved');
        
    if (revenueError) throw revenueError;
    const totalRevenue = totalRevenueData.reduce((sum, item) => sum + item.amount, 0);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: dailySignups } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo);
        
    res.status(200).json({
        totalUsers,
        activeSubscriptions,
        totalRevenue,
        dailySignups
    });

  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Authentication failed' });
  }
}

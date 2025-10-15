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

    // Fetch user data with necessary fields for stats calculation
    const { data: allUsers, error: usersError } = await supabaseAdmin
        .from('profiles')
        .select(`
            id,
            subscription_tier,
            subscription_expires_at,
            users ( created_at )
        `);
    
    if (usersError) throw usersError;

    const totalUsers = allUsers.length;

    const activeSubscriptions = allUsers.filter(p => 
        p.subscription_tier === 'plus' &&
        p.subscription_expires_at &&
        new Date(p.subscription_expires_at) > new Date()
    ).length;
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailySignups = allUsers.filter((p: any) => 
        p.users?.created_at && new Date(p.users.created_at) > twentyFourHoursAgo
    ).length;

    const { data: totalRevenueData, error: revenueError } = await supabaseAdmin
        .from('payments')
        .select('amount')
        .eq('status', 'approved');
        
    if (revenueError) throw revenueError;
    const totalRevenue = totalRevenueData.reduce((sum, item) => sum + item.amount, 0);
        
    res.status(200).json({
        totalUsers: totalUsers ?? 0,
        activeSubscriptions: activeSubscriptions ?? 0,
        totalRevenue: totalRevenue ?? 0,
        dailySignups: dailySignups ?? 0
    });

  } catch (error: any) {
    console.error(`Error in /api/admin/stats: ${error.message}`);
    if (error.message === 'Not authenticated' || error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
       return res.status(401).json({ error: 'Authentication failed' });
    }
    res.status(500).json({ error: error.message || 'Erro no servidor' });
  }
}

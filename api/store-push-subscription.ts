// api/store-push-subscription.ts
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { subscription_object } = req.body;

    if (!subscription_object || !subscription_object.endpoint) { // Check for endpoint
        return res.status(400).json({ error: 'subscription_object with endpoint is required' });
    }

    // Initialize Supabase admin client using environment variables from Vercel
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Get the user from the JWT token sent in the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return res.status(401).json({ error: 'User not authenticated or token is invalid' });
    }

    // Upsert based on the endpoint, which is now the primary key.
    // This correctly links the device to the currently logged-in user.
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert({
        endpoint: subscription_object.endpoint, // The conflict target
        user_id: user.id,
        subscription_details: subscription_object
      }, { onConflict: 'endpoint' }); 

    if (error) throw error;

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('Error storing push subscription:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
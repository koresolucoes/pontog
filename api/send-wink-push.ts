// api/send-wink-push.ts
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL!}`,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { receiver_id } = req.body;
    if (!receiver_id) {
      return res.status(400).json({ error: 'receiver_id is required' });
    }
    
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: senderUser } } = await supabaseAdmin.auth.getUser(token);

    if (!senderUser) {
      return res.status(401).json({ error: 'Sender not authenticated' });
    }

    // 1. Verifica se o destinatário quer receber notificações de 'new_wink'
    const { data: preferences, error: prefError } = await supabaseAdmin
        .from('notification_preferences')
        .select('enabled')
        .eq('user_id', receiver_id)
        .eq('notification_type', 'new_wink')
        .limit(1);
        
    if (prefError) throw prefError;
        
    if (!preferences || preferences.length === 0 || !preferences[0].enabled) {
        return res.status(200).json({ success: true, message: 'User has disabled new wink notifications.' });
    }
    
    const { data: senderProfile } = await supabaseAdmin
        .from('profiles')
        .select('username')
        .eq('id', senderUser.id)
        .single();
    
    if (!senderProfile) {
        return res.status(404).json({ error: 'Sender profile not found' });
    }

    const { data: subscriptionData } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription_details')
      .eq('user_id', receiver_id)
      .single();

    if (!subscriptionData) {
      return res.status(200).json({ success: true, message: 'No subscription found.' });
    }

    const subscription = subscriptionData.subscription_details;
    const payload = JSON.stringify({
      title: `Você recebeu um novo chamado! 😉`,
      body: `${senderProfile.username} chamou você.`,
    });
    
    await webpush.sendNotification(subscription as any, payload).catch(async (error) => {
        if (error.statusCode === 410 || error.statusCode === 404) {
            await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', receiver_id);
        } else {
            console.error('Error sending wink push notification:', error);
        }
    });

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('Internal server error in send-wink-push:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
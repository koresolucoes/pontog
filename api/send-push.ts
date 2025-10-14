// api/send-push.ts
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';

// FIX: Usa variáveis de ambiente consistentes e apropriadas para o servidor.
// O e-mail de contato e a chave pública VAPID agora são lidos de variáveis
// sem o prefixo 'VITE_', que é uma convenção para o frontend.
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL || 'contact@example.com'}`,
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
    const { receiver_id, message_content } = req.body;
    if (!receiver_id || !message_content) {
      return res.status(400).json({ error: 'receiver_id and message_content are required' });
    }
    
    // Inicializa o cliente admin do Supabase
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Obtém o usuário remetente a partir do token de autenticação
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: senderUser } } = await supabaseAdmin.auth.getUser(token);

    if (!senderUser) {
      return res.status(401).json({ error: 'Sender not authenticated' });
    }
    
    // 1. Verifica se o destinatário tem notificações para 'new_message' ativadas
    const { data: preference } = await supabaseAdmin
        .from('notification_preferences')
        .select('enabled')
        .eq('user_id', receiver_id)
        .eq('notification_type', 'new_message')
        .single();
        
    // Se a preferência não existe ou está desativada, não envia a notificação
    if (!preference || !preference.enabled) {
        return res.status(200).json({ success: true, message: 'User has disabled new message notifications.' });
    }
    
    // Busca o nome de usuário do remetente
    const { data: senderProfile } = await supabaseAdmin
        .from('profiles')
        .select('username')
        .eq('id', senderUser.id)
        .single();
    
    if (!senderProfile) {
        return res.status(404).json({ error: 'Sender profile not found' });
    }

    // Busca a inscrição de push do destinatário
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription_details')
      .eq('user_id', receiver_id)
      .single();

    if (subscriptionError || !subscriptionData) {
      // É normal não encontrar uma inscrição se o usuário não ativou as notificações
      console.log(`No push subscription found for user ${receiver_id}.`);
      return res.status(200).json({ success: true, message: 'No subscription found.' });
    }

    const subscription = subscriptionData.subscription_details;
    const payload = JSON.stringify({
      title: `Nova mensagem de ${senderProfile.username}`,
      body: message_content,
    });
    
    // Envia a notificação
    await webpush.sendNotification(subscription as any, payload)
        .catch(async (error) => {
            // Se a inscrição for inválida (ex: usuário desinstalou o app), remove ela do DB
            if (error.statusCode === 410 || error.statusCode === 404) {
                console.log(`Subscription for user ${receiver_id} is gone. Deleting.`);
                await supabaseAdmin
                    .from('push_subscriptions')
                    .delete()
                    .eq('user_id', receiver_id);
            } else {
                console.error('Error sending push notification:', error);
            }
        });

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('Internal server error in send-push:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
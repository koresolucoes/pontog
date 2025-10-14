// api/mercadopago-webhook.ts
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { add } from 'date-fns';

const plans: { [key: string]: { price: number, months: number } } = {
  monthly: { price: 29.90, months: 1 },
  quarterly: { price: 79.90, months: 3 },
  yearly: { price: 239.90, months: 12 },
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { action, data } = req.body;
    
    // O Mercado Pago envia um teste de webhook, que ignoramos.
    // O que nos interessa é a notificação de pagamento criado/atualizado.
    if (action !== 'payment.updated' && action !== 'payment.created') {
        return res.status(200).send('Event not relevant, skipped.');
    }
    
    const paymentId = data.id;
    if (!paymentId) {
        return res.status(400).json({ error: 'Payment ID not found in webhook body' });
    }

    // 1. Busca os detalhes do pagamento na API do Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN!}` },
    });
    
    if (!mpResponse.ok) {
      console.error('Failed to fetch payment details from Mercado Pago', await mpResponse.json());
      return res.status(500).json({ error: 'Could not get payment details' });
    }
    
    const paymentDetails = await mpResponse.json();

    // Inicializa o cliente admin do Supabase
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    
    // 2. Insere/Atualiza o registro na nossa tabela 'payments' para auditoria
    const { error: paymentLogError } = await supabaseAdmin
      .from('payments')
      .upsert({
          mercadopago_id: paymentDetails.id,
          user_id: paymentDetails.external_reference.split('|')[0],
          plan_id: paymentDetails.external_reference.split('|')[1],
          amount: paymentDetails.transaction_amount,
          status: paymentDetails.status,
          updated_at: new Date().toISOString()
      }, { onConflict: 'mercadopago_id' });
    
    if (paymentLogError) throw paymentLogError;

    // 3. Se o pagamento foi aprovado, atualiza o perfil do usuário
    if (paymentDetails.status === 'approved') {
        const [userId, planId] = paymentDetails.external_reference.split('|');
        const plan = plans[planId];
        if (!userId || !plan) {
            console.error('Invalid external_reference:', paymentDetails.external_reference);
            return res.status(400).json({ error: 'Invalid external reference in payment' });
        }
        
        // Calcula a data de expiração da assinatura
        const expiresAt = add(new Date(), { months: plan.months }).toISOString();
        
        // Atualiza a tabela 'profiles'
        const { error: profileUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({
                subscription_tier: 'plus',
                subscription_expires_at: expiresAt,
            })
            .eq('id', userId);

        if (profileUpdateError) throw profileUpdateError;
    }

    // Responde 200 OK para o Mercado Pago para confirmar o recebimento
    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('Mercado Pago Webhook Error:', error);
    // Retorna status 500 mas com mensagem de sucesso para o MP não ficar tentando reenviar
    // já que o erro foi do nosso lado.
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
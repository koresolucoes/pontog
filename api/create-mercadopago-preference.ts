import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const plans: { [key: string]: { title: string; price: number, months: number } } = {
  monthly: { title: 'Ponto G Plus - 1 Mês', price: 29.90, months: 1 },
  quarterly: { title: 'Ponto G Plus - 3 Meses', price: 79.90, months: 3 },
  yearly: { title: 'Ponto G Plus - 12 Meses', price: 239.90, months: 12 },
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { planId } = req.body;
    const selectedPlan = plans[planId];
    if (!selectedPlan) {
      return res.status(400).json({ error: 'Plano inválido.' });
    }

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Autorização ausente.' });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return res.status(401).json({ error: 'Usuário não autenticado.' });

    const preference = {
      items: [{
          id: planId,
          title: selectedPlan.title,
          description: `Acesso ao Ponto G Plus por ${selectedPlan.months} ${selectedPlan.months > 1 ? 'meses' : 'mês'}.`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: selectedPlan.price,
      }],
      payer: { email: user.email },
      back_urls: {
        success: `${req.headers.origin}/?payment=success`,
        failure: `${req.headers.origin}/?payment=failure`,
        pending: `${req.headers.origin}/?payment=pending`,
      },
      auto_return: 'approved',
      external_reference: `${user.id}|${planId}`,
      notification_url: `https://${req.headers.host}/api/mercadopago-webhook`,
    };
    
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN!}`,
        'X-Idempotency-Key': `${user.id}-${Date.now()}`
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json();
      console.error('Mercado Pago API Error:', errorData);
      throw new Error('Erro ao se comunicar com o Mercado Pago.');
    }

    const responseData = await mpResponse.json();
    return res.status(200).json({ init_point: responseData.init_point });

  } catch (error: any) {
    console.error('Error creating Mercado Pago preference:', error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
  }
}
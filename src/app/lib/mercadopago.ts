// ── Mercado Pago Client (lib/mercadopago.ts) ───────────────────────────────
// Docs: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/integrate-checkout-pro

const BASE_URL = 'https://api.mercadopago.com';

function getHeaders(idempotencyKey?: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado.');

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Idempotency-Key': idempotencyKey ?? crypto.randomUUID(),
  };
}

export interface MercadoPagoPreferenceParams {
  transactionAmount: number;
  description: string;
  payer: { email: string };
  externalReference: string;  // O Slug da sua turma
  successUrl: string;
  cancelUrl: string;
  notificationUrl?: string;
}

export interface MercadoPagoPreferenceResponse {
  id: string;
  initPoint: string;      
  sandboxInitPoint: string;
}

/** * Cria uma preferência de pagamento (Checkout Pro)
 * Suporta modo Produção (APP_USR) e modo Teste (TEST)
 */
export async function createPreference(
  params: MercadoPagoPreferenceParams,
): Promise<MercadoPagoPreferenceResponse> {

  // Log de monitoramento
  console.log(`[MercadoPago] Criando preferência para: ${params.externalReference}`);

  // Regra de Ouro: Produção (APP_USR) exige HTTPS para o auto_return funcionar.
  // Se for localhost (http), deixamos o auto_return como undefined para evitar Erro 400.
  const canAutoReturn = params.successUrl.startsWith('https');

  const body = {
    items: [{
      title:       params.description,
      quantity:    1,
      unit_price:  Number(params.transactionAmount),
      currency_id: 'BRL',
    }],
    payer: { 
      email: params.payer.email 
    },
    external_reference: params.externalReference,
    back_urls: {
      success: params.successUrl,
      failure: params.cancelUrl,
      pending: params.successUrl,
    },
    // Ativa apenas se a URL for segura (Produção/ngrok)
    auto_return: canAutoReturn ? 'approved' : undefined,
    
    payment_methods: {
      excluded_payment_types: [
        { id: 'credit_card' }, 
        { id: 'debit_card' }, 
        { id: 'ticket' }
      ],
      installments: 1, // Apenas pagamento à vista
    },
    // URL para o Mercado Pago avisar seu servidor que o PIX foi pago
    notification_url: params.notificationUrl,
  };

  const res = await fetch(`${BASE_URL}/checkout/preferences`, {
    method: 'POST',
    headers: getHeaders(params.externalReference),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("❌ Erro na API do Mercado Pago:", errText);
    throw new Error(`Mercado Pago erro ${res.status}: ${errText}`);
  }

  const json = await res.json();
  
  return {
    id:                json.id,
    initPoint:         json.init_point,
    sandboxInitPoint:  json.sandbox_init_point,
  };
}

/** * Consulta o status de um pagamento pelo ID 
 * Útil para processar o Webhook e validar se o dinheiro caiu
 */
export async function getPaymentStatus(
  paymentId: string | number,
): Promise<{ id: number; status: string; externalReference: string }> {
  const res = await fetch(`${BASE_URL}/v1/payments/${paymentId}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mercado Pago erro ${res.status}: ${err}`);
  }

  const json = await res.json();
  return {
    id:                json.id,
    status:            json.status,
    externalReference: json.external_reference,
  };
}
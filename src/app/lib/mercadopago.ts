// ── Mercado Pago Client ────────────────────────────────────────────────────
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
  externalReference: string;  // slug
  successUrl: string;
  cancelUrl: string;
  notificationUrl?: string;
}

export interface MercadoPagoPreferenceResponse {
  id: string;
  initPoint: string;      // URL para redirecionar (produção)
  sandboxInitPoint: string; // URL para redirecionar (sandbox)
}

/** Cria uma preferência de pagamento (Checkout Pro) */
export async function createPreference(
  params: MercadoPagoPreferenceParams,
): Promise<MercadoPagoPreferenceResponse> {
  const body: Record<string, unknown> = {
    items: [{
      title:       params.description,
      quantity:    1,
      unit_price: params.transactionAmount,
      currency_id: 'BRL',
    }],
    payer: { email: params.payer.email },
    external_reference: params.externalReference,
    // REMOVA A CONDIÇÃO DO LOCALHOST AQUI:
    back_urls: {
      success: params.successUrl,
      failure: params.cancelUrl,
      pending: params.successUrl,
    },
    auto_return: 'approved',
    payment_methods: {
      excluded_payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }, { id: 'ticket' }],
      // Dica: Se quiser focar em PIX no Checkout Pro, o MP exige pelo menos um meio não excluído
    },
  };

  if (params.notificationUrl) {
    body.notification_url = params.notificationUrl;
  }

  const res = await fetch(`${BASE_URL}/checkout/preferences`, {
    method: 'POST',
    headers: getHeaders(params.externalReference),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mercado Pago erro ${res.status}: ${err}`);
  }

  const json = await res.json();
  return {
    id:                json.id,
    initPoint:         json.init_point,
    sandboxInitPoint:  json.sandbox_init_point,
  };
}

/** Consulta o status de um pagamento pelo ID */
export async function getPaymentStatus(
  paymentId: number,
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
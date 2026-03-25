const BASE_URL = 'https://api.mercadopago.com';

/**
 * Gera os headers padrões para as requisições do Mercado Pago.
 * A Idempotency Key evita que a mesma operação seja executada duas vezes por erro de rede.
 */
function getHeaders(idempotencyKey?: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado no .env');

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    // Se não enviar uma chave, geramos uma única para esta requisição
    'X-Idempotency-Key': idempotencyKey || crypto.randomUUID(),
  };
}

export interface MercadoPagoPreferenceParams {
  transactionAmount: number;
  description: string;
  payer: { email: string };
  externalReference: string; // O Slug da sua turma (fundamental para o Webhook)
  successUrl: string;
  cancelUrl: string;
  notificationUrl?: string; // URL do seu Webhook (https://seusite.com/api/webhook-mercadopago)
}

export interface MercadoPagoPreferenceResponse {
  id: string;
  initPoint: string;
  sandboxInitPoint: string;
}

/**
 * Cria uma preferência de pagamento (Checkout Pro)
 * Focada em PIX para evitar distrações no checkout.
 */
export async function createPreference(
  params: MercadoPagoPreferenceParams,
): Promise<MercadoPagoPreferenceResponse> {
  
  console.log(`[MercadoPago] Gerando checkout para: ${params.externalReference}`);

  // O Mercado Pago exige HTTPS para o redirecionamento automático (auto_return)
  const canAutoReturn = params.successUrl.startsWith('https');

  const body = {
    items: [
      {
        title: params.description,
        quantity: 1,
        unit_price: Number(params.transactionAmount),
        currency_id: 'BRL',
      },
    ],
    payer: {
      email: params.payer.email,
    },
    external_reference: params.externalReference,
    back_urls: {
      success: params.successUrl,
      failure: params.cancelUrl,
      pending: params.successUrl,
    },
    // auto_return: 'approved' faz o usuário voltar pro seu site sozinho após pagar
    auto_return: canAutoReturn ? 'approved' : undefined,
    
    payment_methods: {
      // Configuramos para aceitar apenas PIX (opcional, mas recomendado para o seu modelo)
      excluded_payment_types: [
        { id: 'ticket' }, // Boleto
        // Descomente abaixo se quiser esconder cartões e focar só no PIX:
        // { id: 'credit_card' },
        // { id: 'debit_card' },
      ],
      installments: 1,
    },
    
    // URL que o Mercado Pago chamará (Webhook)
    notification_url: params.notificationUrl,
    
    // Força o PIX como método de pagamento padrão ao abrir o checkout
    payment_methods_options: {
      default_payment_method_id: "pix"
    },

    // Expira o link em 24h para não deixar lixo no sistema do MP
    expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  // Usamos o slug + timestamp para a Idempotency Key ser única por tentativa de clique
  const idempotencyKey = `${params.externalReference}-${Date.now()}`;

  const res = await fetch(`${BASE_URL}/checkout/preferences`, {
    method: 'POST',
    headers: getHeaders(idempotencyKey),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("❌ Erro ao criar Preferência MP:", errText);
    throw new Error(`Mercado Pago erro ${res.status}: ${errText}`);
  }

  const json = await res.json();
  
  return {
    id: json.id,
    initPoint: json.init_point,
    sandboxInitPoint: json.sandbox_init_point,
  };
}

/**
 * Consulta o status real de um pagamento diretamente na API.
 * Essencial para o Webhook validar se o pagamento foi REALMENTE aprovado.
 */
export async function getPaymentStatus(
  paymentId: string | number,
): Promise<{ id: number; status: string; externalReference: string }> {
  
  const res = await fetch(`${BASE_URL}/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!res.ok) {
    const err = await res.text();
    // Se o pagamento não for encontrado, lançamos um erro com 404 para o Webhook tratar
    throw new Error(`Mercado Pago erro ${res.status}: ${err}`);
  }

  const json = await res.json();
  
  return {
    id: json.id,
    status: json.status, // 'approved', 'pending', 'rejected', etc.
    externalReference: json.external_reference, // O slug que você enviou na criação
  };
}
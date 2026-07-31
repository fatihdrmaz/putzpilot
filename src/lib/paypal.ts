// PayPal Orders API v2 + Webhooks + Refunds.
// Anahtarlar .env.local'e girilene kadar canlı çağrılar 503 döner (isConfigured).

const PAYPAL_BASE =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export function isPayPalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PayPal token alınamadı: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

export interface PayPalOrder {
  id: string;
  status: string;
  links: { href: string; rel: string; method: string }[];
}

// custom_id formatı: "<bookingId>:<prepayment|reservation_fee>[:<cleanerId>]"
export async function createOrder(params: {
  amount: number; // EUR
  customId: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<PayPalOrder> {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "EUR", value: params.amount.toFixed(2) },
          custom_id: params.customId,
          description: params.description,
        },
      ],
      application_context: {
        brand_name: "PutzPilot",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`PayPal order oluşturulamadı: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export interface CaptureResult {
  orderId: string;
  status: string;
  captureId: string | null;
  customId: string | null;
  amount: number | null;
}

export async function captureOrder(orderId: string): Promise<CaptureResult> {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Aynı order iki kez capture edilirse PayPal idempotent davranır
      "PayPal-Request-Id": `capture-${orderId}`,
    },
  });
  if (!res.ok) {
    throw new Error(`PayPal capture başarısız: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const unit = data.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  return {
    orderId: data.id,
    status: data.status,
    captureId: capture?.id ?? null,
    customId: capture?.custom_id ?? unit?.custom_id ?? null,
    amount: capture ? parseFloat(capture.amount.value) : null,
  };
}

export async function refundCapture(params: {
  captureId: string;
  amount: number; // EUR; tam iade için capture tutarı
  noteToPayer?: string;
}): Promise<{ id: string; status: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v2/payments/captures/${params.captureId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `refund-${params.captureId}`,
    },
    body: JSON.stringify({
      amount: { currency_code: "EUR", value: params.amount.toFixed(2) },
      note_to_payer: params.noteToPayer,
    }),
  });
  if (!res.ok) {
    throw new Error(`PayPal iade başarısız: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return { id: data.id, status: data.status };
}

// Webhook imza doğrulaması — PRD gereği zorunlu.
export async function verifyWebhookSignature(
  headers: Headers,
  rawBody: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.verification_status === "SUCCESS";
}

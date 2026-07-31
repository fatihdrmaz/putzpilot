// WhatsApp Business Cloud API bildirimleri.
// Anahtarlar girilmediyse mesajlar gönderilmez, sadece konsola not düşülür
// (kişisel veri loglanmaz — sadece şablon adı).

const GRAPH_URL = "https://graph.facebook.com/v21.0";

export type WhatsAppTemplate =
  | "cleaner_arrived" // "Temizlik görevlisi evinize ulaştı ve çalışmaya başladı."
  | "checkpoint_75" // "Kontrol etmemizi istediğiniz bir alan varsa şimdi bildirin."
  | "cleaning_completed" // "Temizlik tamamlandı" + değerlendirme bağlantısı
  | "cleaner_assigned" // Temizlikçi atandı bilgisi
  | "booking_cancelled"; // İptal bilgisi

export async function sendWhatsAppTemplate(params: {
  toPhone: string; // E.164 formatında
  template: WhatsAppTemplate;
  language: "de" | "tr";
  bodyParams?: string[];
}): Promise<{ sent: boolean }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.info(`[whatsapp:skip] template=${params.template} (env eksik)`);
    return { sent: false };
  }

  const res = await fetch(`${GRAPH_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: params.toPhone,
      type: "template",
      template: {
        name: params.template,
        language: { code: params.language },
        components: params.bodyParams?.length
          ? [
              {
                type: "body",
                parameters: params.bodyParams.map((text) => ({ type: "text", text })),
              },
            ]
          : undefined,
      },
    }),
  });

  if (!res.ok) {
    console.error(`[whatsapp:error] template=${params.template} status=${res.status}`);
    return { sent: false };
  }
  return { sent: true };
}

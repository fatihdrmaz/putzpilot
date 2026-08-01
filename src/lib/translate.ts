// DeepL çeviri — destek mesajları TR<->DE. Anahtar yoksa metni olduğu gibi
// döndürür (kod kırılmaz; env gelince otomatik devreye girer).
export async function translate(
  text: string,
  targetLang: "TR" | "DE"
): Promise<{ text: string; translated: boolean }> {
  const key = process.env.DEEPL_API_KEY;
  if (!key || !text.trim()) return { text, translated: false };

  // Ücretsiz anahtarlar ":fx" ile biter ve farklı host kullanır
  const host = key.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
  try {
    const res = await fetch(`${host}/v2/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: [text], target_lang: targetLang }),
    });
    if (!res.ok) return { text, translated: false };
    const data = await res.json();
    return { text: data.translations?.[0]?.text ?? text, translated: true };
  } catch {
    return { text, translated: false };
  }
}

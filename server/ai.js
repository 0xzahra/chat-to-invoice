import { parseChat } from './parser.js';
// Picks the first configured OpenAI-compatible provider; falls back to the deterministic parser.
const PROVIDERS = [
  ['OPENAI_API_KEY', 'https://api.openai.com/v1', process.env.OPENAI_MODEL || 'gpt-4o-mini', 'OpenAI'],
  ['XAI_API_KEY', 'https://api.x.ai/v1', process.env.XAI_MODEL || 'grok-3-mini', 'xAI'],
  ['OPENROUTER_API_KEY', 'https://openrouter.ai/api/v1', process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini', 'OpenRouter'],
];
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
export function activeAI() {
  if (process.env.GEMINI_API_KEY) return { gemini: true, model: GEMINI_MODEL, label: `Google Gemini (${GEMINI_MODEL})` };
  const p = PROVIDERS.find(([k]) => process.env[k]);
  return p ? { key: process.env[p[0]], base: p[1], model: p[2], label: `${p[3]} (${p[2]})` } : null;
}
const S = (type, extra = {}) => ({ type, ...extra });
const ORDER_SCHEMA = S('OBJECT', { properties: { buyer_name: S('STRING'), buyer_email: S('STRING'), currency: S('STRING'), shipping: S('NUMBER'), discount: S('NUMBER'),
  items: S('ARRAY', { items: S('OBJECT', { properties: { name: S('STRING'), description: S('STRING'), quantity: S('NUMBER'), unit_price: S('NUMBER') }, required: ['name', 'quantity', 'unit_price'] }) }) },
  required: ['buyer_name', 'buyer_email', 'currency', 'items', 'shipping'] });
const MSG_SCHEMA = S('OBJECT', { properties: { message: S('STRING') }, required: ['message'] });
async function gemini(system, user, schema) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST', headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json', responseSchema: schema, thinkingConfig: { thinkingBudget: 0 } } }),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  return JSON.parse((await r.json()).candidates[0].content.parts.map((p) => p.text).join(''));
}
async function llm(system, user, schema = ORDER_SCHEMA) {
  const ai = activeAI();
  if (ai.gemini) return gemini(system, user, schema);
  const r = await fetch(`${ai.base}/chat/completions`, {
    method: 'POST', headers: { Authorization: `Bearer ${ai.key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: ai.model, temperature: 0, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
  });
  if (!r.ok) throw new Error(`LLM ${r.status}`);
  return JSON.parse((await r.json()).choices[0].message.content);
}
export async function extract(chat) {
  if (!activeAI()) return parseChat(chat);
  try {
    const out = await llm('You extract a customer order from a WhatsApp/Telegram chat between a small online seller and a buyer. The chat may be in any language (English, French, Spanish, Portuguese, Arabic, Chinese, Hausa...). Return JSON: buyer_name, buyer_email, currency (ISO 4217 code), items [{name, description (size/colour notes), quantity, unit_price}], shipping, discount. Keep item names in the chat language. unit_price is per unit: if a price is for several units, divide. Do not invent data; unknown -> empty string or 0. Do not include the seller as buyer.', chat);
    return { ...out, engine: activeAI().label };
  } catch (e) { return { ...parseChat(chat), engine: 'local-parser (LLM failed)' }; }
}

const T = {
  en: { name: 'English', gentle: (b, a, s, l) => `Hi ${b}! 😊 Just a friendly reminder that your invoice from ${s} for ${a} is ready. You can pay securely with PayPal here: ${l}. Thank you so much!`, firm: (b, a, s, l) => `Hello ${b}, this is a reminder that invoice ${a} from ${s} is still unpaid. Kindly complete payment via PayPal: ${l}. Your order ships as soon as it's settled.` },
  fr: { name: 'Français', gentle: (b, a, s, l) => `Bonjour ${b} ! 😊 Petit rappel : votre facture ${s} de ${a} est prête. Vous pouvez la régler en toute sécurité via PayPal : ${l}. Merci beaucoup !`, firm: (b, a, s, l) => `Bonjour ${b}, la facture de ${a} de ${s} reste impayée. Merci de procéder au paiement via PayPal : ${l}. Votre commande sera expédiée dès réception.` },
  es: { name: 'Español', gentle: (b, a, s, l) => `¡Hola ${b}! 😊 Un recordatorio amable: tu factura de ${s} por ${a} está lista. Puedes pagar de forma segura con PayPal aquí: ${l}. ¡Muchas gracias!`, firm: (b, a, s, l) => `Hola ${b}, la factura de ${a} de ${s} sigue pendiente. Por favor, completa el pago con PayPal: ${l}. Enviaremos tu pedido en cuanto se confirme.` },
  pt: { name: 'Português', gentle: (b, a, s, l) => `Olá ${b}! 😊 Um lembrete amigável: sua fatura da ${s} no valor de ${a} está pronta. Pague com segurança pelo PayPal: ${l}. Muito obrigada!`, firm: (b, a, s, l) => `Olá ${b}, a fatura de ${a} da ${s} ainda está em aberto. Por favor, conclua o pagamento pelo PayPal: ${l}. Enviaremos seu pedido assim que for confirmado.` },
  ar: { name: 'العربية', gentle: (b, a, s, l) => `مرحباً ${b}! 😊 تذكير لطيف بأن فاتورتك من ${s} بقيمة ${a} جاهزة. يمكنك الدفع بأمان عبر PayPal: ${l}. شكراً جزيلاً!`, firm: (b, a, s, l) => `مرحباً ${b}، نذكّرك بأن الفاتورة بقيمة ${a} من ${s} لم تُسدَّد بعد. يرجى إتمام الدفع عبر PayPal: ${l}. سيتم شحن طلبك فور التأكيد.` },
  sw: { name: 'Kiswahili', gentle: (b, a, s, l) => `Habari ${b}! 😊 Kumbusho la kirafiki: ankara yako kutoka ${s} ya ${a} iko tayari. Lipa kwa usalama kupitia PayPal: ${l}. Asante sana!`, firm: (b, a, s, l) => `Habari ${b}, ankara ya ${a} kutoka ${s} bado haijalipwa. Tafadhali kamilisha malipo kupitia PayPal: ${l}. Oda yako itatumwa mara tu malipo yatakapothibitishwa.` },
  zh: { name: '简体中文', gentle: (b, a, s, l) => `${b}您好！😊 温馨提醒：您在 ${s} 的订单发票（${a}）已准备好，可通过 PayPal 安全付款：${l}。非常感谢！`, firm: (b, a, s, l) => `${b}您好，您在 ${s} 的发票（${a}）尚未付款。请通过 PayPal 完成付款：${l}。确认付款后我们会立即发货。` },
  ha: { name: 'Hausa', gentle: (b, a, s, l) => `Sannu ${b}! 😊 Tunatarwa ce kawai: takardar kuɗin ki daga ${s} ta ${a} ta shirya. Za ki iya biya lafiya ta PayPal a nan: ${l}. Mun gode sosai!`, firm: (b, a, s, l) => `Sannu ${b}, takardar kuɗi ta ${a} daga ${s} ba a biya ta ba tukuna. Don Allah ki kammala biyan kuɗi ta PayPal: ${l}. Za mu tura kayan ki da zarar an tabbatar.` },
  tr: { name: 'Türkçe', gentle: (b, a, s, l) => `Merhaba ${b}! 😊 ${s} faturanız (${a}) hazır, küçük bir hatırlatma. PayPal ile güvenle ödeyebilirsiniz: ${l}. Çok teşekkürler!`, firm: (b, a, s, l) => `Merhaba ${b}, ${s} tarafından kesilen ${a} tutarındaki fatura henüz ödenmedi. Lütfen ödemeyi PayPal üzerinden tamamlayın: ${l}. Ödeme onaylanınca siparişiniz kargoya verilecek.` },
  de: { name: 'Deutsch', gentle: (b, a, s, l) => `Hallo ${b}! 😊 Nur eine kurze Erinnerung: Deine Rechnung von ${s} über ${a} ist bereit. Du kannst sicher mit PayPal bezahlen: ${l}. Vielen Dank!`, firm: (b, a, s, l) => `Hallo ${b}, die Rechnung von ${s} über ${a} ist noch offen. Bitte schließe die Zahlung über PayPal ab: ${l}. Wir versenden deine Bestellung, sobald sie eingegangen ist.` },
  id: { name: 'Bahasa Indonesia', gentle: (b, a, s, l) => `Halo ${b}! 😊 Sekadar mengingatkan, faktur dari ${s} sebesar ${a} sudah siap. Kamu bisa bayar dengan aman lewat PayPal: ${l}. Terima kasih banyak!`, firm: (b, a, s, l) => `Halo ${b}, faktur ${a} dari ${s} belum dibayar. Mohon selesaikan pembayaran lewat PayPal: ${l}. Pesanan akan dikirim setelah pembayaran dikonfirmasi.` },
  ru: { name: 'Русский', gentle: (b, a, s, l) => `Здравствуйте, ${b}! 😊 Небольшое напоминание: ваш счёт от ${s} на ${a} готов. Оплатить безопасно через PayPal можно здесь: ${l}. Большое спасибо!`, firm: (b, a, s, l) => `Здравствуйте, ${b}. Счёт от ${s} на ${a} пока не оплачен. Пожалуйста, завершите оплату через PayPal: ${l}. Мы отправим заказ сразу после подтверждения.` },
};
export const LANGS = Object.fromEntries(Object.entries(T).map(([k, v]) => [k, v.name]));
export async function reminder({ buyer, amount, seller, link, lang = 'en', tone = 'gentle' }) {
  if (activeAI()) {
    try {
      const o = await llm('Write a short WhatsApp payment reminder from a small seller to a buyer, written natively (not word-for-word translated) in the requested language. Include the amount and the PayPal link exactly once. 2-3 sentences, one emoji at most. Reply JSON {message}.', `Language: ${LANGS[lang] || lang}. Tone: ${tone}. Buyer: ${buyer}. Seller: ${seller}. Amount: ${amount}. PayPal link: ${link}.`, MSG_SCHEMA);
      return { message: o.message, engine: activeAI().label };
    } catch {}
  }
  const t = T[lang] || T.en;
  return { message: t[tone === 'firm' ? 'firm' : 'gentle'](buyer, amount, seller, link), engine: 'template' };
}

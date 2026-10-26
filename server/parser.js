// Deterministic local chat parser (fallback when no LLM key is configured).
const SYM = { '$': 'USD', '€': 'EUR', '£': 'GBP', '₦': 'NGN', 'C$': 'CAD', 'A$': 'AUD' };
const CODES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NGN', 'KES', 'GHS', 'ZAR', 'INR', 'BRL', 'MXN', 'JPY'];
const PRICE = /(C\$|A\$|[$€£₦])\s?(\d+(?:[.,]\d{1,2})?)|(\d[\d,]*(?:[.,]\d+)?)\s?(USD|EUR|GBP|CAD|AUD|NGN|KES|GHS|ZAR|INR|BRL|MXN|JPY|dollars?|euros?|pounds?)\b|(\d+(?:[.,]\d{1,2})?)\s?([$€£₦])/i;
const num = (s) => parseFloat(/,\d{1,2}$/.test(s) ? String(s).replace(',', '.') : String(s).replace(/,/g, ''));

export function splitMessages(chat) {
  return chat.split(/\r?\n/).map((raw) => {
    let l = raw.trim().replace(/^\[[^\]]*\]\s*/, '').replace(/^\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4},?\s+\d{1,2}:\d{2}(?:\s?[AP]M)?\s*-\s*/i, '');
    const m = l.match(/^([^:]{1,40}?):\s+(.*)$/);
    return m ? { speaker: m[1].trim(), text: m[2].trim() } : { speaker: null, text: l };
  }).filter((m) => m.text);
}

function currencyOf(m) {
  if (m[1]) return SYM[m[1]] || 'USD';
  if (m[6]) return SYM[m[6]] || 'USD';
  const c = m[4].toUpperCase();
  if (c.startsWith('DOLLAR')) return 'USD';
  if (c.startsWith('EURO')) return 'EUR';
  if (c.startsWith('POUND')) return 'GBP';
  return c;
}

export function parseChat(chat) {
  const msgs = splitMessages(chat);
  const items = []; let shipping = 0; let currency = null; let email = null; let buyer = null; let discount = 0;
  const speakers = [...new Set(msgs.map((m) => m.speaker).filter(Boolean))];
  for (const { speaker, text } of msgs) {
    const em = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    if (em) { email = em[0].replace(/[.,]$/, ''); buyer = buyer || speaker; }
    const named = text.match(/(?:my name is|this is|name:)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i);
    if (named) buyer = named[1];
    for (const part0 of text.replace(/[(（][^)）]*[)）]/g, (x) => x.replace(/[,，]/g, '¸')).split(/,(?!\d)|[;；]|\band\b(?=\s+\d)/i)) {
      const part = part0.replace(/¸/g, ',');
      const p = part.match(PRICE);
      if (!p) continue;
      const cur = currencyOf(p); currency = currency || cur;
      const amount = num(p[2] || p[3] || p[5]);
      if (/shipping|delivery|courier|dispatch|livraison|env[ií]o|frete|entrega|الشحن|التوصيل|运费|邮费|快递|kudin aika|jigila|kargo|versand|lieferung|ongkir|ongkos kirim|pengiriman|доставка|usafirishaji/i.test(part)) { shipping = amount; continue; }
      if (/discount|off\b|remise|descuento|desconto|خصم|折扣|ragi/i.test(part)) { discount = amount; continue; }
      if (/total|altogether|in all/i.test(part) && items.length) continue;
      const before = part.slice(0, p.index);
      const q = before.match(/(?:^|\s)(\d+)\s*(?:x|×|pcs?|pieces?|units?|件|个|條|条|串)?\s*(?=\p{L})/iu);
      const qty = q ? parseInt(q[1], 10) : 1;
      let name = (q ? before.slice(before.indexOf(q[0]) + q[0].length) : before)
        .replace(/\b(i'?d like|i want|please|can i (?:get|have)|also|plus|add|and|one|a|an|of)\b/gi, ' ')
        .replace(/(^|\s)(et|y|e|and|و|还有|da|ve|und|dan|и)\s+/giu, ' ')
        .replace(/(\s|^)(at|for|@|each|ea|costs?|is|à|a|por|par|cada|pièce|بسعر|للقطعة|للواحدة|每件|每串|每个|kowace|kowanne|tanesi|zu|je|per|buah|по|за|штуку|kila|moja)(\s|$)/giu, ' ').replace(/(\s|^)(at|for|@|each|ea|costs?|is|à|a|por|par|cada|pièce|بسعر|للقطعة|للواحدة|每件|每串|每个|kowace|kowanne|tanesi|zu|je|per|buah|по|за|штуку|kila|moja)(\s|$)/giu, ' ').replace(/\s(at|for|@|à|a|por|بسعر|每件|每串|a)\s*$/iu, '').replace(/(每件|每串|每个|，)+\s*$/u, '').replace(/[-–:@]+\s*$/, '')
        .replace(/\s+/g, ' ').trim();
      let note = '';
      const paren = name.match(/[(（]([^)）]*)[)）]/); if (paren) { note = paren[1]; name = name.replace(paren[0], '').trim(); }
      if (!name || name.length < 2) continue;
      const totalPriced = /\bfor\s*$/i.test(before.trim() + ' ') && !/each|ea\b|per/i.test(part) && qty > 1 && /\bfor\b\s*$/i.test(before.trim());
      const unit = totalPriced ? +(amount / qty).toFixed(2) : amount;
      items.push({ name: name.charAt(0).toUpperCase() + name.slice(1), description: note, quantity: qty, unit_price: unit });
    }
  }
  if (!buyer) buyer = speakers[0] || '';
  return { buyer_name: buyer, buyer_email: email || '', currency: currency || 'USD', items, shipping, discount, engine: 'local-parser' };
}

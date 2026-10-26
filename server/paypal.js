// PayPal Invoicing v2 client. Real sandbox when keys exist, otherwise an in-memory mock with the same response shapes.
const BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
export const LIVE = Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
let token = null; let tokenExp = 0;
async function auth() {
  if (token && Date.now() < tokenExp) return token;
  const basic = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const r = await fetch(`${BASE}/v1/oauth2/token`, { method: 'POST', headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
  if (!r.ok) throw new Error(`PayPal auth failed (${r.status})`);
  const j = await r.json(); token = j.access_token; tokenExp = Date.now() + (j.expires_in - 60) * 1000; return token;
}
async function pp(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, { ...opts, headers: { Authorization: `Bearer ${await auth()}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(opts.headers || {}) } });
  const text = await r.text(); const body = text ? JSON.parse(text) : {};
  if (!r.ok) throw new Error(body.message || body.details?.[0]?.description || `PayPal ${r.status}`);
  return body;
}
const money = (currency, v) => ({ currency_code: currency, value: Number(v || 0).toFixed(2) });
export function buildPayload(d) {
  return {
    detail: { currency_code: d.currency, note: d.note || 'Thank you for your order!', invoice_date: new Date().toISOString().slice(0, 10), payment_term: { term_type: 'DUE_ON_RECEIPT' } },
    invoicer: { business_name: d.seller || 'Luma Threads Studio' },
    primary_recipients: [{ billing_info: { name: { full_name: d.buyer_name }, email_address: d.buyer_email } }],
    items: d.items.map((i) => ({ name: i.name.slice(0, 200), description: i.description || undefined, quantity: String(i.quantity), unit_amount: money(d.currency, i.unit_price), unit_of_measure: 'QUANTITY' })),
    amount: { breakdown: { shipping: { amount: money(d.currency, d.shipping) }, ...(d.discount ? { discount: { invoice_discount: { amount: money(d.currency, d.discount) } } } : {}) } },
  };
}
const slim = (inv) => ({ id: inv.id, number: inv.detail?.invoice_number, status: inv.status, total: inv.amount, recipient: inv.primary_recipients?.[0]?.billing_info, link: inv.detail?.metadata?.recipient_view_url || inv.links?.find((l) => l.rel === 'payer-view')?.href, created: inv.detail?.metadata?.create_time, items: inv.items?.length });

// ---- mock ----
const store = new Map(); let seq = 1000;
function mockCreate(payload) {
  const id = `INV2-DEMO-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const cur = payload.detail.currency_code;
  const sub = payload.items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_amount.value), 0);
  const total = sub + Number(payload.amount.breakdown.shipping.amount.value) - Number(payload.amount.breakdown.discount?.invoice_discount?.amount?.value || 0);
  const inv = { ...payload, id, status: 'DRAFT', detail: { ...payload.detail, invoice_number: String(++seq), metadata: { create_time: new Date().toISOString(), recipient_view_url: `https://www.sandbox.paypal.com/invoice/p/#${id}` } }, amount: { currency_code: cur, value: total.toFixed(2) } };
  store.set(id, inv); return inv;
}

export async function createInvoice(d) {
  const payload = buildPayload(d);
  if (!LIVE) return slim(mockCreate(payload));
  const inv = await pp('/v2/invoicing/invoices', { method: 'POST', body: JSON.stringify(payload) });
  return slim(inv.id ? inv : await pp(new URL(inv.href).pathname));
}
export async function sendInvoice(id) {
  if (!LIVE) { const i = store.get(id); i.status = 'SENT'; return slim(i); }
  await pp(`/v2/invoicing/invoices/${id}/send`, { method: 'POST', body: JSON.stringify({ send_to_invoicer: true }) });
  return getInvoice(id);
}
export async function getInvoice(id) {
  if (!LIVE) return slim(store.get(id));
  return slim(await pp(`/v2/invoicing/invoices/${id}`));
}
export async function remindInvoice(id) {
  if (!LIVE) return getInvoice(id);
  await pp(`/v2/invoicing/invoices/${id}/remind`, { method: 'POST', body: JSON.stringify({ send_to_invoicer: true }) });
  return getInvoice(id);
}
export async function simulatePaid(id) {
  if (LIVE) { // Records an external payment via PayPal's record-payment endpoint (real sandbox call).
    const inv = await getInvoice(id);
    await pp(`/v2/invoicing/invoices/${id}/payments`, { method: 'POST', body: JSON.stringify({ method: 'OTHER', payment_date: new Date().toISOString().slice(0, 10), amount: { currency_code: inv.total.currency_code, value: inv.total.value }, note: 'Recorded from Chat-to-Invoice' }) });
    return getInvoice(id);
  }
  const i = store.get(id); i.status = 'PAID'; return slim(i);
}

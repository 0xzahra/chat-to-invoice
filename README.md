# Chat-to-Invoice

Turn a pasted WhatsApp or Telegram order chat into a PayPal invoice. Built for the PayPal AI Hackathon.

A small online seller pastes the conversation. The app extracts the items, quantities, prices, currency, buyer name and email, and shows an editable invoice preview. It then creates and sends the invoice through the **PayPal Invoicing v2 API** (sandbox), tracks its status (Draft → Sent → Paid) and drafts polite payment reminders with a gentle or firm tone.

- **AI:** Google Gemini (`GEMINI_API_KEY`, default `gemini-2.5-flash`, override with `GEMINI_MODEL`) with structured JSON output (`responseSchema`) for extraction and reminders. OpenAI, xAI and OpenRouter keys are also supported, and a deterministic multilingual rule-based parser plus templates is the fallback.
- **Native UI in 12 languages:** English, French, Spanish, Portuguese, Arabic (RTL), Chinese (Simplified), Hausa, Turkish, German, Indonesian, Russian, Swahili. The language picker is searchable (by native or English name), and counts use `Intl.PluralRules`. Extraction handles chats in all of them (`src/sample.js` has a sample chat per language).
- **Light and dark themes:** starts from the system preference and remembers the choice (localStorage).


**Live demo:** https://chat-to-invoice.vercel.app (PayPal **sandbox** only, no real money)  
**Demo video:** coming soon on YouTube.

## Setup
```bash
npm install
cp .env.example .env   # add PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET (sandbox), GEMINI_API_KEY
npm run build && npm start          # http://localhost:8787
# or: npm run dev                   # Vite on :5173, API on :8787
npm test                            # parser test against the sample chat
```
Without PayPal keys the app runs in **Demo mode (sandbox keys not yet connected)**, which uses an in-memory mock with the same response shapes.

## Architecture
```
React + Tailwind (Vite)  ──/api──▶  Express server (server/)
  landing + dashboard               ├─ ai.js      extraction + reminders: Gemini (JSON schema) > OpenAI / xAI / OpenRouter,
                                    │             otherwise parser.js (deterministic regex parser) + templates
                                    └─ paypal.js  OAuth2 client-credentials → Invoicing v2
                                                  POST /v2/invoicing/invoices         create (DRAFT)
                                                  POST /v2/invoicing/invoices/:id/send  (SENT)
                                                  GET  /v2/invoicing/invoices/:id       status refresh
                                                  POST /v2/invoicing/invoices/:id/payments  record payment (MARKED_AS_PAID)
                                                  POST /v2/invoicing/invoices/:id/remind
```
Secrets stay on the server and never reach the browser.

The sample seller ("Luma Threads Studio") and buyer are fictional.

## License
MIT. See [LICENSE](LICENSE).

## Deploying on Vercel
`api/index.js` wraps the same Express app as a serverless function, and `vercel.json` builds the Vite front end to `dist/`. Set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` (sandbox) and `GEMINI_API_KEY` as project env vars.

import 'dotenv/config';
import express from 'express';


import { extract, reminder, activeAI, LANGS } from './ai.js';
import * as paypal from './paypal.js';

const app = express(); app.use(express.json({ limit: '200kb' }));
const wrap = (fn) => async (req, res) => { try { res.json(await fn(req)); } catch (e) { res.status(400).json({ error: e.message }); } };
app.get('/api/config', (_q, res) => res.json({ ai: activeAI()?.label || 'Local deterministic parser', paypalMode: paypal.LIVE ? 'sandbox' : 'demo', langs: LANGS }));
app.post('/api/extract', wrap((r) => extract(String(r.body.chat || ''))));
app.post('/api/invoices', wrap((r) => paypal.createInvoice(r.body)));
app.post('/api/invoices/:id/send', wrap((r) => paypal.sendInvoice(r.params.id)));
app.get('/api/invoices/:id', wrap((r) => paypal.getInvoice(r.params.id)));
app.post('/api/invoices/:id/remind', wrap((r) => paypal.remindInvoice(r.params.id)));
app.post('/api/invoices/:id/simulate-paid', wrap((r) => paypal.simulatePaid(r.params.id)));
app.post('/api/reminder', wrap((r) => reminder(r.body)));
export default app;

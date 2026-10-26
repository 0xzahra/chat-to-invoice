import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import app from './app.js';
import { activeAI } from './ai.js';
import * as paypal from './paypal.js';

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '../dist');
app.use(express.static(dist)); app.get('*', (_q, res) => res.sendFile(path.join(dist, 'index.html')));
const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`Chat-to-Invoice on http://localhost:${port} | AI: ${activeAI()?.label || 'local parser'} | PayPal: ${paypal.LIVE ? 'SANDBOX' : 'DEMO MODE'}`));

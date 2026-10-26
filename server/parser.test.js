import { parseChat } from './parser.js';
import { SAMPLE_CHAT } from '../src/sample.js';
const r = parseChat(SAMPLE_CHAT); console.log(JSON.stringify(r, null, 2));
if (r.items[0].name !== 'Linen wrap dress' || r.items[0].quantity !== 2 || r.items.length !== 3 || r.shipping !== 12 || r.buyer_email !== 'amara.okafor@example.com') { console.error('FAIL'); process.exit(1); }
console.log('PASS');

import { SAMPLES } from '../src/sample.js';
for (const [k, c] of Object.entries(SAMPLES)) { const x = parseChat(c); if (x.items.length !== 3 || x.shipping !== 12 || !x.buyer_email) { console.error('FAIL', k, JSON.stringify(x)); process.exitCode = 1; }
  console.log(k, x.items.map((i) => `${i.quantity}×${i.name}@${i.unit_price}`).join(' | '), 'ship', x.shipping, x.buyer_email); }

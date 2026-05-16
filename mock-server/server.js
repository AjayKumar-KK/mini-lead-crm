// Mini Lead CRM — Mock API server
// Run: npm install && npm start
// Default port: 4000 (override with PORT env var)

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ---------- Optional latency / failure simulation ----------
// Set MOCK_LATENCY_MS=300 to add 300ms delay to every request.
// Set MOCK_FAILURE_RATE=0.1 to randomly fail 10% of requests with 500.
const LATENCY_MS = parseInt(process.env.MOCK_LATENCY_MS || '0', 10);
const FAILURE_RATE = parseFloat(process.env.MOCK_FAILURE_RATE || '0');

app.use(async (req, res, next) => {
  if (LATENCY_MS) await new Promise(r => setTimeout(r, LATENCY_MS));
  if (FAILURE_RATE && Math.random() < FAILURE_RATE) {
    return res.status(500).json({ error: 'Simulated server error (chaos mode)' });
  }
  next();
});

// ---------- State machine ----------
const TRANSITIONS = {
  NEW:       ['CONTACTED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['CONVERTED', 'LOST'],
  CONVERTED: [],
  LOST:      [],
};
const STATUSES = Object.keys(TRANSITIONS);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- In-memory store ----------
let leads = [];
try {
  const seedPath = path.join(__dirname, 'seed.json');
  leads = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  console.log(`Loaded ${leads.length} leads from seed.json`);
} catch (e) {
  console.warn('No seed.json found — starting with empty dataset');
}

// ---------- Helpers ----------
function validateLeadInput(input, { partial = false } = {}) {
  const errors = [];
  if (!partial || 'name' in input) {
    if (!input.name || typeof input.name !== 'string' || !input.name.trim()) {
      errors.push('name is required');
    }
  }
  if (!partial || 'email' in input) {
    if (!input.email || !EMAIL_RE.test(input.email)) {
      errors.push('email must be a valid email');
    }
  }
  return errors;
}

function newLead(input) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone || null,
    status: 'NEW',
    source: input.source || null,
    created_at: now,
    updated_at: now,
  };
}

// ---------- Routes ----------

// GET /leads?status=NEW,CONTACTED&q=aman
app.get('/leads', (req, res) => {
  let result = [...leads];
  if (req.query.status) {
    const wanted = String(req.query.status).split(',');
    result = result.filter(l => wanted.includes(l.status));
  }
  if (req.query.q) {
    const q = String(req.query.q).toLowerCase();
    result = result.filter(
      l => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
    );
  }
  res.json(result);
});

// GET /leads/:id
app.get('/leads/:id', (req, res) => {
  const lead = leads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});

// POST /leads
app.post('/leads', (req, res) => {
  const errors = validateLeadInput(req.body);
  if (errors.length) return res.status(422).json({ error: errors.join('; ') });
  const lead = newLead(req.body);
  leads.push(lead);
  res.status(201).json(lead);
});

// PUT /leads/:id  (does NOT change status — use PATCH /leads/:id/status)
app.put('/leads/:id', (req, res) => {
  const lead = leads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  const errors = validateLeadInput(req.body, { partial: true });
  if (errors.length) return res.status(422).json({ error: errors.join('; ') });
  const { status, id, created_at, ...allowed } = req.body;
  Object.assign(lead, allowed, { updated_at: new Date().toISOString() });
  res.json(lead);
});

// DELETE /leads/:id
app.delete('/leads/:id', (req, res) => {
  const idx = leads.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Lead not found' });
  leads.splice(idx, 1);
  res.status(204).send();
});

// PATCH /leads/:id/status  body: { status: "CONTACTED" }
app.patch('/leads/:id/status', (req, res) => {
  const lead = leads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  const { status } = req.body || {};
  if (!status || !STATUSES.includes(status)) {
    return res.status(422).json({ error: `status must be one of ${STATUSES.join(', ')}` });
  }
  const valid = TRANSITIONS[lead.status];
  if (!valid.includes(status)) {
    return res.status(400).json({
      error: `Invalid status transition from ${lead.status} to ${status}`,
    });
  }
  lead.status = status;
  lead.updated_at = new Date().toISOString();
  res.json(lead);
});

// POST /leads/bulk  body: [{ name, email, ... }, ...]   (partial success)
app.post('/leads/bulk', (req, res) => {
  const items = Array.isArray(req.body) ? req.body : req.body.leads;
  if (!Array.isArray(items)) {
    return res.status(422).json({ error: 'Body must be an array of leads' });
  }
  const results = items.map((input, index) => {
    const errors = validateLeadInput(input);
    if (errors.length) return { index, success: false, error: errors.join('; ') };
    const lead = newLead(input);
    leads.push(lead);
    return { index, success: true, lead };
  });
  res.status(207).json({
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  });
});

// PUT /leads/bulk  body: [{ id, ...partialUpdates }, ...]   (partial success)
app.put('/leads/bulk', (req, res) => {
  const items = Array.isArray(req.body) ? req.body : req.body.leads;
  if (!Array.isArray(items)) {
    return res.status(422).json({ error: 'Body must be an array of partial updates' });
  }
  const results = items.map((input, index) => {
    if (!input.id) return { index, success: false, error: 'id is required' };
    const lead = leads.find(l => l.id === input.id);
    if (!lead) return { index, success: false, error: 'Lead not found' };
    const errors = validateLeadInput(input, { partial: true });
    if (errors.length) return { index, success: false, error: errors.join('; ') };
    const { status, id, created_at, ...allowed } = input;
    Object.assign(lead, allowed, { updated_at: new Date().toISOString() });
    return { index, success: true, lead: { ...lead } };
  });
  res.status(207).json({
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  });
});

// 404 fallback
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ---------- Start ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Mock CRM API running on http://localhost:${PORT}`);
  if (LATENCY_MS) console.log(`  artificial latency: ${LATENCY_MS}ms`);
  if (FAILURE_RATE) console.log(`  random failure rate: ${(FAILURE_RATE * 100).toFixed(0)}%`);
});

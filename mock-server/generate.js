// generate.js — creates a large seed file for Level 3 perf testing
// Usage:
//   node generate.js                  -> 5000 leads -> seed.json (overwrites)
//   node generate.js 10000            -> 10000 leads -> seed.json
//   node generate.js 5000 large.json  -> 5000 leads -> large.json

const crypto = require('crypto');
const fs = require('fs');

const N = parseInt(process.argv[2] || '5000', 10);
const OUT = process.argv[3] || 'seed.json';

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];
const SOURCES = ['website', 'referral', 'campaign', 'cold-outreach', 'event'];
const FIRST = ['Aman','Priya','Rahul','Anjali','Vikram','Neha','Arjun','Sneha','Karan','Pooja','Rohan','Divya','Ishaan','Meera','Aditya','Riya','Siddharth','Tanvi','Yash','Zara','Kabir','Aarav','Ananya','Diya','Ira'];
const LAST = ['Gupta','Sharma','Patel','Singh','Kumar','Reddy','Nair','Verma','Iyer','Joshi','Mehta','Khan','Desai','Rao','Bansal','Chowdhury','Menon','Kapoor','Agarwal','Pillai','Bhatt','Saxena','Malhotra','Trivedi','Chauhan'];

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

const leads = Array.from({ length: N }, (_, i) => {
  const first = pick(FIRST);
  const last = pick(LAST);
  const created = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString();
  const updated = new Date(new Date(created).getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: crypto.randomUUID(),
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}.${i}@example.com`,
    phone: Math.random() < 0.8 ? `+91-9${Math.floor(100000000 + Math.random() * 900000000)}` : null,
    status: pick(STATUSES),
    source: pick(SOURCES),
    created_at: created,
    updated_at: updated,
  };
});

fs.writeFileSync(OUT, JSON.stringify(leads, null, 2));
console.log(`Wrote ${N} leads to ${OUT}`);

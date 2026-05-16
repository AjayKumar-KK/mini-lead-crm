# Mini Lead CRM — Mock API Server

A small Express server that simulates the backend for the Mini Lead CRM frontend assessment. Single file, no build step.

## Setup

```bash
npm install
npm start
```

Server runs at `http://localhost:4000`. Edit `PORT` env var to change.

```bash
PORT=5000 npm start
```

## Endpoints

| Method | Path                       | Description                                    |
| ------ | -------------------------- | ---------------------------------------------- |
| GET    | `/leads`                   | List all leads. Filters: `?status=NEW,LOST`, `?q=aman` (name/email search) |
| GET    | `/leads/:id`               | Get a single lead                              |
| POST   | `/leads`                   | Create a lead. Required: `name`, `email`. Status starts as `NEW` |
| PUT    | `/leads/:id`               | Update lead fields (does NOT change status)    |
| DELETE | `/leads/:id`               | Delete a lead                                  |
| PATCH  | `/leads/:id/status`        | Transition status. Body: `{ "status": "CONTACTED" }` |
| POST   | `/leads/bulk`              | Create many leads. Returns 207 with per-item results |
| PUT    | `/leads/bulk`              | Update many leads. Returns 207 with per-item results |

### Status transitions (enforced server-side)

```
NEW → CONTACTED → QUALIFIED → CONVERTED
  ↘         ↘          ↘
   LOST     LOST       LOST
```

`CONVERTED` and `LOST` are terminal. Invalid transitions return `400` with a clear message.

### Status codes

- `200` on read/update success
- `201` on create
- `204` on delete
- `207` on bulk (multi-status — read the `results` array)
- `400` on invalid status transition
- `404` on missing lead
- `422` on validation error (missing name, invalid email, etc.)

## Seed data

`seed.json` ships with 20 sample leads spanning all statuses. The server loads it on boot and keeps everything in memory — restarting resets state.

To generate a larger dataset for Level 3 perf testing:

```bash
node generate.js 5000        # 5000 leads -> seed.json
node generate.js 10000 big.json   # 10000 leads -> big.json
```

## Chaos mode (optional)

Useful for stress-testing your loading/error states.

```bash
# Add 500ms latency to every request
MOCK_LATENCY_MS=500 npm start

# Randomly fail 15% of requests with 500
MOCK_FAILURE_RATE=0.15 npm start

# Both
MOCK_LATENCY_MS=300 MOCK_FAILURE_RATE=0.1 npm start
```

We won't tell you to use these, but if your UI feels great under chaos mode, that's a good sign.

## Notes

- CORS is wide open — all origins allowed.
- All state is in-memory; restart the server to reset.
- The server enforces validation and the state machine. Your UI must still prevent invalid transitions from being offered (the server is a safety net, not your only check).

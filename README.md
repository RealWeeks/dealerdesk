# DealDesk

DealDesk is a mobile-first AI car buying and negotiation assistant. The MVP helps a buyer manage an active vehicle search, find manually seeded dealers, start dealer outreach, track dealer conversations, compare offers, review AI extractions before saving structured data, and generate negotiation replies.

The first seeded workflow targets a 2026 Lexus RX 350h Premium AWD search from Portland, Maine, while the data model is generic for future vehicles.

## Repo layout

- `server/`: Node, Express, TypeScript, MongoDB, Mongoose, Zod, JWT auth, and backend-only AI endpoints.
- `mobile/`: Expo, React Native, TypeScript, Expo Router, TanStack Query-ready UI, and mobile screen tests.
- `shared/`: Shared TypeScript constants and Zod schemas.
- `docs/`: Product, technical, API, and testing notes.

## Running Locally

```bash
cd dealdesk
npm install
cp server/.env.example server/.env
cp mobile/.env.example mobile/.env
```

1. Seed real dealer data:

```bash
npm run seed:dealers
```

2. Start the API server:

```bash
npm run dev:server
```

The API defaults to `http://localhost:4000`.

3. In a second terminal, start the Expo mobile app:

```bash
npm run dev:mobile
```

4. Open the Expo Go app on iPhone and scan the QR code shown by Expo.

If testing on a physical phone, set `EXPO_PUBLIC_API_BASE_URL` in `mobile/.env` to your computer's LAN URL instead of localhost, for example:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.25:4000
```

Then restart Expo:

```bash
npm run dev:mobile
```

Expo may warn that it expects `react-native@0.79.6`. This project currently pins `react-native@0.79.5` because that version typechecks cleanly with the current TypeScript/React Native setup.

## Useful Commands

Run the full test suite:

```bash
npm test
```

Run server-only checks:

```bash
npm run test -w @dealdesk/server
npm run build -w @dealdesk/server
```

Run mobile-only checks:

```bash
npm run test -w @dealdesk/mobile
npm run build -w @dealdesk/mobile
```

## Tests and builds

```bash
npm run build -w @dealdesk/shared
npm run test -w @dealdesk/server
npm run build -w @dealdesk/server
npm run test -w @dealdesk/mobile
npm run build -w @dealdesk/mobile
```

Normal tests mock AI behavior and never call OpenAI. To try real AI locally, set `OPENAI_API_KEY` in `server/.env` and call the `/ai/*` endpoints through the backend.

## Outreach queue

The Outreach Queue is the practical first-contact workflow for real dealers attached to your active search. It groups dealers by contact status, lets you select not-contacted dealers, generates a reusable initial outreach message, copies it for manual email/text/web forms, and then records what you sent.

The app does not send dealer emails or texts automatically yet. You copy the message, send it yourself, then confirm in DealDesk. Confirmation creates outbound `Interaction` records, marks dealers `contacted`, sets `lastContactedAt`, and can create follow-up `Task` records due in two days. It does not create offers, quotes, vehicles, AI extractions, or fake dealer replies.

Backend endpoints:

```text
POST /outreach/initial-message
POST /outreach/mark-contacted
GET /message-templates
GET /dealers/:dealerId/timeline
```

Manual real-life flow:

1. Seed and attach real dealers.
2. Open the app and go to Outreach.
3. Select one or more not-contacted dealers.
4. Generate and copy the initial message.
5. Send it manually through the dealer's site, email, or text.
6. Confirm sent in DealDesk to save outbound interactions and follow-up tasks.

### Message templates

Initial outreach messages are database-backed `MessageTemplate` records. Built-in templates have `userId: null` and `isBuiltIn: true`; custom templates are user-owned and editable. The app tracks `MessageTemplateUsage` per user/search/dealer/template so it can suggest unused templates for the same dealer first. If every active initial outreach template has already been used with that dealer, DealDesk chooses the least recently used one and marks it as previously used.

Seed the built-in starter templates:

```bash
npm run seed:templates
```

Preview template seed changes:

```bash
npm run seed:templates -- --dry-run
```

The current seed includes 20 built-in `initial_outreach` templates. They are human-sounding openers that ask for in-stock or incoming matching units and an itemized out-the-door quote while keeping trade-in and financing separate. No fake offers, fake quotes, fake interactions, or fake dealer replies are seeded.

Dealer Detail includes a timeline built from real saved records: interactions, offers, tasks, AI extractions, template usage, and derived dealer status events.

## Dealer seeds

Dealer seeds live in `server/src/seed/lexusNewEnglandDealers.ts`. The seed file is intentionally plain TypeScript so you can edit addresses, phone numbers, inventory URLs, coordinates, and verification notes before writing to MongoDB.

The dealer seed command only writes `DealerSeed` records. It does not create offers, quotes, vehicles, interactions, tasks, or AI extractions.

Preview dealer seed inserts/updates:

```bash
npm run seed:dealers -- --dry-run
```

Write dealer seeds:

```bash
npm run seed:dealers
```

Attach seeded dealers to your existing active car search by account email:

```bash
npm run seed:attach-dealers -- --email you@example.com --brand Lexus --radius 150
```

Preview attach before writing:

```bash
npm run seed:attach-dealers -- --email you@example.com --brand Lexus --radius 150 --dry-run
```

Attach behavior:

- Looks up your existing user by email.
- Requires an existing active car search; it fails clearly instead of creating a fake search.
- Finds matching seeded dealers by brand and radius from your active search ZIP.
- Creates missing `SearchDealer` records only.
- Skips dealers already attached to that search.
- Defaults status to `not_contacted`.
- Sets priority by distance: `high` within 75 miles, `medium` within 150 miles, `low` farther out.
- Does not create offers, fake quotes, fake dealer messages, vehicles, tasks, or AI extraction records.

The initial Lexus New England seed file is useful for a Lexus RX 350h search near Portland, Maine. Most records include `needsVerification: true` where coordinates or contact details should be checked against the dealer website before serious use.

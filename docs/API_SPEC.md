# API Spec

## Auth

- `POST /auth/register`: `{ email, password }` -> `{ token, user }`
- `POST /auth/login`: `{ email, password }` -> `{ token, user }`
- `GET /me`: bearer token -> `{ user }`

## Car searches

- `POST /car-searches`
- `GET /car-searches`
- `GET /car-searches/active`
- `GET /car-searches/:id`
- `PATCH /car-searches/:id`
- `DELETE /car-searches/:id`

Search body includes year, make, model, trim, zipCode, radius, targets, travel/shipping flags, trade strategy, financing strategy, and status.

## Dealer seeds

- `GET /dealer-seeds/search?brand=Lexus&zip=04101&radius=150`
- `POST /dealer-seeds/seed-local-dev`

Search returns seeded dealers sorted by `distanceMiles`.

## Search dealers

- `POST /car-searches/:carSearchId/dealers`: `{ dealerSeedId, priority?, notes? }`
- `GET /car-searches/:carSearchId/dealers`
- `GET /dealers/:id`
- `GET /dealers/:dealerId/timeline`
- `PATCH /dealers/:id`
- `DELETE /dealers/:id`

Timeline returns `{ items }` sorted newest first. Item types include `interaction`, `offer`, `task`, `ai_extraction`, `template_usage`, and `dealer_status`.

## Vehicles, offers, interactions, tasks

- `POST /car-searches/:carSearchId/vehicles`
- `GET /car-searches/:carSearchId/vehicles`
- `PATCH /vehicles/:id`
- `DELETE /vehicles/:id`
- `POST /car-searches/:carSearchId/offers`
- `GET /car-searches/:carSearchId/offers`
- `GET /offers/:id`
- `PATCH /offers/:id`
- `DELETE /offers/:id`
- `POST /car-searches/:carSearchId/interactions`
- `GET /car-searches/:carSearchId/interactions`
- `GET /dealers/:dealerId/interactions`
- `POST /car-searches/:carSearchId/tasks`
- `GET /car-searches/:carSearchId/tasks`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`

## AI

- `POST /ai/parse-dealer-message`: `{ carSearchId, dealerId?, rawText }`
- `POST /ai/summarize-call-note`: `{ carSearchId, dealerId?, rawText }`
- `POST /ai/generate-reply`: `{ carSearchId, dealerId, offerId?, userGoal?, tone? }`
- `POST /ai/analyze-offers`: `{ carSearchId }`

AI parse responses include dealer, vehicle, offer, red flags, missing info, next step, suggested reply, confidence, and `extractionId`.

## Message templates and outreach

- `GET /message-templates?category=initial_outreach&dealerId=:dealerId`
- `POST /message-templates`
- `PATCH /message-templates/:id`
- `POST /message-templates/:id/duplicate`
- `DELETE /message-templates/:id`
- `POST /outreach/initial-message`: `{ carSearchId, dealerId?, templateId?, tone? }`
- `POST /outreach/mark-contacted`: `{ carSearchId, dealerIds, messageText, templateId?, createFollowUp, followUpDueAt? }`

Built-in templates have `userId: null` and cannot be edited directly. Users can create custom templates or duplicate a built-in template into an editable user-owned copy.

When `dealerId` is provided, template list responses include `usedWithThisDealer` and `lastUsedAt`. Unused templates sort before used templates. Confirming outreach creates outbound `Interaction` records and `MessageTemplateUsage` records using the edited message body; it does not create offers.

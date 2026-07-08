# Testing Strategy

## Backend

Backend tests use Vitest, Supertest, and mongodb-memory-server. Tests run against an in-memory MongoDB and exercise real Express routes, JWT authentication, validation, user scoping, dealer seed search, Haversine distance, offers, interactions, and AI extraction review behavior.

The AI client is mocked in tests. Bad AI output is validated with Zod and returns a controlled error.

## Frontend

Frontend tests use Vitest and React Native Testing Library. They focus on critical screen behavior: login rendering, active search display, dealer cards, add dealer actions, pasted update text, review extraction fields, offer ranking, and generated reply display.

## Manual AI

Real OpenAI calls are not part of normal tests. For manual testing, set `OPENAI_API_KEY` on the server and call the backend AI endpoints.

# Tech Spec

## Architecture

DealDesk is a TypeScript monorepo with shared schemas, an Express API, MongoDB persistence, and an Expo mobile app. The mobile app never calls OpenAI directly; all AI work flows through authenticated backend routes.

## Backend

The server uses Express, Mongoose, Zod, bcrypt, jsonwebtoken, cors, helmet, morgan, and an AI service abstraction. Every user-owned model includes `userId`, and routes query by both resource ID and authenticated user ID.

Models include `User`, `CarSearch`, `DealerSeed`, `SearchDealer`, `Vehicle`, `Offer`, `Interaction`, `Task`, and `AIExtraction`.

## AI flow

AI endpoints validate inputs, call a mockable AI client, validate output with shared Zod schemas, save an `AIExtraction` with `userConfirmed: false`, and return reviewable structured data. Confirmation can create final offer data; parsing itself does not overwrite saved records.

## Mobile

The mobile app uses Expo Router, React Native, TypeScript, React Hook Form-ready inputs, and TanStack Query-ready API helpers. Screens are mobile-first and safe-area aware.

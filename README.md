# OC Transpo – Personal Work-Life Tracker (Backend)

A domain-driven, invariant-first backend system for personal work-life tracking.

## Principles
- Reality is append-only
- Corrections never rewrite history
- Invariants are enforced centrally
- Transport layers contain no business logic

## Tech Stack
- Node.js + TypeScript
- Express (HTTP only)
- PostgreSQL
- Prisma ORM

## Architecture
- Domain layer is framework-independent
- Application layer orchestrates use cases
- Infrastructure layer handles persistence

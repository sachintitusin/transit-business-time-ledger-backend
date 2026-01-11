# Transit Business Time Ledger

An invariant-first, append-only domain system for accurately representing real-world work time, paired with a worker-facing application for transit operations.

---

## Overview

Transit Business Time Ledger is a full-stack system designed for workers in a transit business to reliably record, review, and understand their work life.

At its core, the system prioritizes truth, auditability, and correctness over convenience.

The backend models reality as it happened.
The frontend allows workers to interact with that reality safely and clearly.

---

## Why This Project Exists

Most time-tracking systems assume that planned schedules equal reality.
In real transit operations, this assumption breaks down quickly.

Workers:
- start late or early
- take over shifts
- work overtime unexpectedly
- record data hours or days later
- occasionally make mistakes when entering times

Traditional systems handle this by editing records, which silently rewrites history and destroys trust.

This project takes a different approach.

Reality is never edited.
Mistakes are corrected, not erased.

---

## Core Philosophy

The system is built around a few strict principles:

- Reality is append-only
- Corrections explain mistakes
- Effective truth is computed
- Planning never overrides reality
- Invariants over convenience

---

## What This System Is (and Is Not)

### This is
- A worker-facing work-life tracking system
- Designed for transit businesses and their operators
- Focused on what actually happened
- Built using domain-driven design principles

### This is not
- A payroll system
- A scheduling authority
- A compliance or HR system

---

## Architecture Overview

domain/        → Pure business logic & invariants  
application/   → Use-case orchestration  
ports/         → Repository & policy interfaces  
infrastructure → Prisma + PostgreSQL implementations  
interfaces/    → HTTP controllers & middleware  
tests/         → Invariant and lifecycle tests  

---

## Technology Stack

Backend:
- Node.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Express
- Jest
- Docker

Frontend (planned):
- Worker-facing web/mobile app

---

## Getting Started

### Prerequisites
- Node.js 18+
- Docker
- npm

### Setup

git clone https://github.com/your-username/transit-business-time-ledger.git
cd transit-business-time-ledger
npm install
cp .env.example .env

### Start Database

docker compose up -d

### Migrate Database

npx prisma migrate dev
npx prisma generate

### Run Server

npm run dev

Server runs on http://localhost:3000

### Run Tests

npm test

---

## Status

- Backend domain model: complete
- Invariants: locked
- Domain APIs: finalized
- Infrastructure & HTTP layers: in progress
- Frontend application: planned

---

## Final Note

This system intentionally avoids shortcuts.

Start with the domain invariants, then the correction model, then the effective time rules.

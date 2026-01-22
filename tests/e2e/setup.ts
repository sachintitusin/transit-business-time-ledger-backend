// tests/e2e/setup.ts
import { beforeAll, beforeEach, afterAll } from "vitest";
import type { Express } from "express";
import { prisma } from "../../src/infrastructure/prisma/prismaClient";
import { createApp } from "../../src/server";
import {
  TEST_DRIVER_1,
  TEST_DRIVER_2,
  TOKEN_DRIVER_1,
  TOKEN_DRIVER_2
} from "../helpers/auth.helper";

// Export app for tests
export let app: Express;

// Auth constants
export const TEST_DRIVER_ID = TEST_DRIVER_1;
export const OTHER_DRIVER_ID = TEST_DRIVER_2;
export const TEST_AUTH_HEADER = { Authorization: `Bearer ${TOKEN_DRIVER_1}` };
export const OTHER_AUTH_HEADER = { Authorization: `Bearer ${TOKEN_DRIVER_2}` };

// ----------------------------------------------------------------------
// One-time driver setup (stable identities for auth)
// ----------------------------------------------------------------------
beforeAll(async () => {
  // Ensure clean slate before seeding drivers
  await cleanupAll();

  await prisma.driver.upsert({
    where: { id: TEST_DRIVER_ID },
    update: {},
    create: {
      id: TEST_DRIVER_ID,
      email: `${TEST_DRIVER_ID}@test.com`,
      name: "E2E Driver",
    },
  });

  await prisma.driver.upsert({
    where: { id: OTHER_DRIVER_ID },
    update: {},
    create: {
      id: OTHER_DRIVER_ID,
      email: `${OTHER_DRIVER_ID}@test.com`,
      name: "Other Driver",
    },
  });
});

// ----------------------------------------------------------------------
// ✅ KEY ENTERPRISE ISOLATION FIX
// Each test gets:
//   - clean database (no active work periods)
//   - fresh Express app + DI graph
// ----------------------------------------------------------------------
beforeEach(async () => {
  await cleanupAll();   // 🔑 DB isolation
  app = createApp();    // 🔑 App / DI isolation
});

// ----------------------------------------------------------------------
// Global teardown
// ----------------------------------------------------------------------
afterAll(async () => {
  await prisma.$disconnect();
});

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------
async function cleanupAll() {
  await prisma.shiftTransferEvent.deleteMany({});
  await prisma.workCorrection.deleteMany({});
  await prisma.leaveCorrection.deleteMany({});
  await prisma.leaveEvent.deleteMany({});
  await prisma.workPeriod.deleteMany({});
  await prisma.entryProjection.deleteMany({});
}

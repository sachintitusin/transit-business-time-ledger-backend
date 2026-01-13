// tests/e2e/setup.ts
import { afterEach, beforeAll, beforeEach, afterAll } from "vitest";
import { prisma } from "../../src/infrastructure/prisma/prismaClient";
import { 
  TEST_DRIVER_1, 
  TEST_DRIVER_2, 
  TOKEN_DRIVER_1, 
  TOKEN_DRIVER_2 
} from "../helpers/auth.helper";

// ✅ Use IDs from auth.helper
export const TEST_DRIVER_ID = TEST_DRIVER_1;
export const OTHER_DRIVER_ID = TEST_DRIVER_2;
export const TEST_AUTH_HEADER = { Authorization: `Bearer ${TOKEN_DRIVER_1}` };
export const OTHER_AUTH_HEADER = { Authorization: `Bearer ${TOKEN_DRIVER_2}` };

beforeAll(async () => {
  await cleanupAll();
  
  // ✅ Create drivers with matching IDs
  await prisma.driver.upsert({
    where: { id: TEST_DRIVER_ID }, // Now uses 11111111-1111-1111-1111-111111111111
    update: {},
    create: {
      id: TEST_DRIVER_ID,
      email: `${TEST_DRIVER_ID}@test.com`, // Matches auth.helper email format
      name: "E2E Driver",
    },
  });

  await prisma.driver.upsert({
    where: { id: OTHER_DRIVER_ID }, // Now uses 22222222-2222-2222-2222-222222222222
    update: {},
    create: {
      id: OTHER_DRIVER_ID,
      email: `${OTHER_DRIVER_ID}@test.com`,
      name: "Other Driver",
    },
  });
});

beforeEach(async () => {
  await cleanupAll();
});

afterEach(async () => {
  await cleanupAll();
});

afterAll(async () => {
  await cleanupAll();
  await prisma.$disconnect();
});

async function cleanupAll() {
  await prisma.shiftTransferEvent.deleteMany({});
  await prisma.workCorrection.deleteMany({});
  await prisma.leaveCorrection.deleteMany({});
  await prisma.leaveEvent.deleteMany({});
  await prisma.workPeriod.deleteMany({});
}

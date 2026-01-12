import { afterEach, beforeAll, beforeEach, afterAll } from "vitest";
import { prisma } from "../../src/infrastructure/prisma/prismaClient";

export const TEST_DRIVER_ID = "00000000-0000-0000-0000-000000000001";
export const OTHER_DRIVER_ID = "00000000-0000-0000-0000-000000000002";

beforeAll(async () => {
  // Clean everything first
  await cleanupAll();
  
  // Seed primary test driver
  await prisma.driver.upsert({
    where: { id: TEST_DRIVER_ID },
    update: {},
    create: {
      id: TEST_DRIVER_ID,
      email: "e2e.driver@local.test",
      name: "E2E Driver",
    },
  });

  // Seed secondary driver
  await prisma.driver.upsert({
    where: { id: OTHER_DRIVER_ID },
    update: {},
    create: {
      id: OTHER_DRIVER_ID,
      email: "e2e.other@local.test",
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
  // Delete in correct order
  await prisma.shiftTransferEvent.deleteMany({});
  await prisma.workCorrection.deleteMany({});
  await prisma.leaveCorrection.deleteMany({});
  await prisma.leaveEvent.deleteMany({});
  await prisma.workPeriod.deleteMany({});
}

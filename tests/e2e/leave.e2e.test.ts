import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../../src/server";
import { TEST_DRIVER_ID } from "./setup";

const LEAVE_IDS = {
  test1: "aaaaaaaa-1111-1111-1111-111111111111",
  test2: "bbbbbbbb-2222-2222-2222-222222222222",
  test3: "cccccccc-3333-3333-3333-333333333333",
  test4: "dddddddd-4444-4444-4444-444444444444",
  test5: "eeeeeeee-5555-5555-5555-555555555555",
};

const CORRECTION_IDS = {
  test3: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  test4: "dddddddd-dddd-dddd-dddd-dddddddddddd",
  test5: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
};

const WORK_IDS = {
  test2: "22222222-2222-2222-2222-222222222222",
  test4: "44444444-4444-4444-4444-444444444444",
  test5: "55555555-5555-5555-5555-555555555555",
};

describe.sequential("E2E: Leave lifecycle", () => {

  it("records a leave when no work exists", async () => {
    await request(app)
      .post("/leave/record")
      .send({
        driverId: TEST_DRIVER_ID,
        leaveId: LEAVE_IDS.test1, // ✅ Unique
        startTime: "2026-01-12T10:00:00Z",
        endTime: "2026-01-12T14:00:00Z",
        reason: "Personal leave",
      })
      .expect(201);
  });

  it("rejects leave that overlaps with open work", async () => {
    await request(app)
      .post("/work/start")
      .send({
        driverId: TEST_DRIVER_ID,
        workPeriodId: WORK_IDS.test2, // ✅ Unique
        startTime: "2026-01-12T09:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/leave/record")
      .send({
        driverId: TEST_DRIVER_ID,
        leaveId: LEAVE_IDS.test2, // ✅ Unique
        startTime: "2026-01-12T10:00:00Z",
        endTime: "2026-01-12T12:00:00Z",
        reason: "Overlapping leave",
      })
      .expect(400);
  });

  it("allows correcting a leave when no work conflicts", async () => {
    await request(app)
      .post("/leave/record")
      .send({
        driverId: TEST_DRIVER_ID,
        leaveId: LEAVE_IDS.test3, // ✅ Unique
        startTime: "2026-01-13T10:00:00Z",
        endTime: "2026-01-13T12:00:00Z",
        reason: "Initial leave",
      })
      .expect(201);

    await request(app)
      .post("/leave/correct")
      .send({
        driverId: TEST_DRIVER_ID,
        leaveId: LEAVE_IDS.test3,
        correctionId: CORRECTION_IDS.test3, // ✅ Unique
        correctedStartTime: "2026-01-13T11:00:00Z",
        correctedEndTime: "2026-01-13T13:00:00Z",
        reason: "Adjusted timing",
      })
      .expect(201);
  });

  it("rejects leave correction that overlaps with open work", async () => {
    await request(app)
      .post("/leave/record")
      .send({
        driverId: TEST_DRIVER_ID,
        leaveId: LEAVE_IDS.test4, // ✅ Unique
        startTime: "2026-01-14T06:00:00Z",
        endTime: "2026-01-14T07:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/start")
      .send({
        driverId: TEST_DRIVER_ID,
        workPeriodId: WORK_IDS.test4, // ✅ Unique
        startTime: "2026-01-14T07:30:00Z",
      })
      .expect(201);

    await request(app)
      .post("/leave/correct")
      .send({
        driverId: TEST_DRIVER_ID,
        leaveId: LEAVE_IDS.test4,
        correctionId: CORRECTION_IDS.test4, // ✅ Unique
        correctedStartTime: "2026-01-14T07:00:00Z",
        correctedEndTime: "2026-01-14T09:00:00Z",
        reason: "Overlaps work",
      })
      .expect(400);
  });

  it("does not partially apply a failed leave correction", async () => {
    await request(app)
      .post("/leave/record")
      .send({
        driverId: TEST_DRIVER_ID,
        leaveId: LEAVE_IDS.test5, // ✅ Unique
        startTime: "2026-01-15T06:00:00Z",
        endTime: "2026-01-15T07:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/start")
      .send({
        driverId: TEST_DRIVER_ID,
        workPeriodId: WORK_IDS.test5, // ✅ Unique
        startTime: "2026-01-15T07:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/leave/correct")
      .send({
        driverId: TEST_DRIVER_ID,
        leaveId: LEAVE_IDS.test5,
        correctionId: CORRECTION_IDS.test5, // ✅ Unique
        correctedStartTime: "2026-01-15T06:30:00Z",
        correctedEndTime: "2026-01-15T08:00:00Z",
      })
      .expect(400);

    await request(app)
      .post("/work/close")
      .send({
        driverId: TEST_DRIVER_ID,
        endTime: "2026-01-15T10:00:00Z",
      })
      .expect(200);
  });
});

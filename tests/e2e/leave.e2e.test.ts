import request from "supertest";
import { describe, it } from "vitest";
import { app, TEST_AUTH_HEADER } from "./setup";

/* ---------- FIXED TEST IDS (VALID UUIDs) ---------- */

const WORK_IDS = {
  test2: "22222222-2222-4222-8222-222222222222",
  test4: "44444444-4444-4444-8444-444444444444",
  test5: "55555555-5555-4555-8555-555555555555",
};

const LEAVE_IDS = {
  test1: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  test2: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  test3: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  test4: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  test5: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
};

const CORRECTION_IDS = {
  test3: "33333333-3333-4333-8333-333333333333",
  test4: "44444444-4444-4444-8444-444444444444",
  test5: "55555555-5555-4555-8555-555555555555",
};


/* ---------- TESTS ---------- */

describe.sequential("E2E: Leave lifecycle", () => {

  it("records a leave when no work exists", async () => {
    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId: LEAVE_IDS.test1,
        startTime: "2026-01-14T00:00:00Z",
        endTime: "2026-01-14T23:59:00Z",
        reason: "Personal leave",
      })
      .expect(201);
  });

  it("rejects leave that overlaps with open work", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test2,
        startTime: "2026-01-12T09:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId: LEAVE_IDS.test2,
        startTime: "2026-01-12T10:00:00Z",
        endTime: "2026-01-12T12:00:00Z",
        reason: "Overlapping leave",
      })
      .expect(400);
  });

  it("allows correcting a leave when no work conflicts", async () => {
    const recordRes = await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId: LEAVE_IDS.test3,
        startTime: "2026-01-13T10:00:00Z",
        endTime: "2026-01-13T12:00:00Z",
        reason: "Initial leave",
      })
      .expect(201);

    await request(app)
      .post("/leave/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId: recordRes.body.leaveId,
        correctionId: CORRECTION_IDS.test3,
        correctedStartTime: "2026-01-13T11:00:00Z",
        correctedEndTime: "2026-01-13T13:00:00Z",
        reason: "Adjusted timing",
      })
      .expect(201);
  });

  it("rejects leave correction that overlaps with open work", async () => {
    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId: LEAVE_IDS.test4,
        startTime: "2026-01-14T06:00:00Z",
        endTime: "2026-01-14T07:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test4,
        startTime: "2026-01-14T07:30:00Z",
      })
      .expect(201);

    await request(app)
      .post("/leave/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId: LEAVE_IDS.test4,
        correctionId: CORRECTION_IDS.test4,
        correctedStartTime: "2026-01-14T07:00:00Z",
        correctedEndTime: "2026-01-14T09:00:00Z",
        reason: "Overlaps work",
      })
      .expect(400);
  });

  it("does not partially apply a failed leave correction", async () => {
    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId: LEAVE_IDS.test5,
        startTime: "2026-01-15T06:00:00Z",
        endTime: "2026-01-15T07:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test5,
        startTime: "2026-01-15T07:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/leave/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId: LEAVE_IDS.test5,
        correctionId: CORRECTION_IDS.test5,
        correctedStartTime: "2026-01-15T06:30:00Z",
        correctedEndTime: "2026-01-15T08:00:00Z",
      })
      .expect(400);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        endTime: "2026-01-15T10:00:00Z",
      })
      .expect(200);
  });

});

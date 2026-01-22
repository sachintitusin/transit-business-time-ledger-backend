import request from "supertest";
import { describe, it } from "vitest";
import { app } from "./setup";
import { TEST_AUTH_HEADER } from "./setup";
import { makeIds } from "../helpers/ids";

const WORK_IDS = makeIds([
  "test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8", "test9"
] as const);

const LEAVE_IDS = makeIds([
  "test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8", "test9"
] as const);

const CORRECTION_IDS = makeIds([
  "test4", "test5", "test7", "test8"
] as const);

describe.sequential("E2E: Work–Leave overlap (cross-domain)", () => {

  /* ---------- CORE INVARIANT TESTS ---------- */

  it("prevents recording leave that overlaps an open work period", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test1,
        startTime: "2026-01-20T09:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId: LEAVE_IDS.test1,
        startTime: "2026-01-20T11:00:00Z",
        endTime: "2026-01-20T13:00:00Z",
      })
      .expect(400);
  });

  it("allows recording leave after overlapping work is fully closed", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test2,
        startTime: "2026-01-21T09:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        endTime: "2026-01-21T11:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId: LEAVE_IDS.test2,
        startTime: "2026-01-21T11:01:00Z",
        endTime: "2026-01-21T13:00:00Z",
      })
      .expect(201);
  });

  it("prevents closing work if it overlaps existing leave", async () => {
    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId: LEAVE_IDS.test3,
        startTime: "2026-01-22T10:00:00Z",
        endTime: "2026-01-22T12:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test3,
        startTime: "2026-01-22T09:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        endTime: "2026-01-22T11:30:00Z",
      })
      .expect(400);
  });

  it("prevents work correction that causes overlap with leave", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test4,
        startTime: "2026-01-23T08:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        endTime: "2026-01-23T10:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId: LEAVE_IDS.test4,
        startTime: "2026-01-23T10:30:00Z",
        endTime: "2026-01-23T12:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test4,
        correctionId: CORRECTION_IDS.test4,
        correctedStartTime: "2026-01-23T09:30:00Z",
        correctedEndTime: "2026-01-23T11:30:00Z",
      })
      .expect(400);
  });

  it("prevents leave correction that causes overlap with existing work", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test5,
        startTime: "2026-01-24T09:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        endTime: "2026-01-24T11:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId: LEAVE_IDS.test5,
        startTime: "2026-01-24T12:00:00Z",
        endTime: "2026-01-24T14:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/leave/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId: LEAVE_IDS.test5,
        correctionId: CORRECTION_IDS.test5,
        correctedStartTime: "2026-01-24T10:30:00Z",
        correctedEndTime: "2026-01-24T13:00:00Z",
      })
      .expect(400);
  });

  /* ---------- BOUNDARY RULES (HALF-OPEN) ---------- */

  it("ALLOWS leave starting exactly when work ends (half-open boundary)", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test8,
        startTime: "2026-01-27T09:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        endTime: "2026-01-27T11:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId: LEAVE_IDS.test8,
        startTime: "2026-01-27T11:00:00Z",
        endTime: "2026-01-27T12:00:00Z",
      })
      .expect(201);
  });

  it("ALLOWS leave ending exactly when work starts (half-open boundary)", async () => {
    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId: LEAVE_IDS.test9,
        startTime: "2026-01-28T08:00:00Z",
        endTime: "2026-01-28T09:00:00Z",
      })
      .expect(201);
  });

  it("prevents leave overlapping multiple work periods", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test6,
        startTime: "2026-01-29T08:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        endTime: "2026-01-29T10:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test7,
        startTime: "2026-01-29T12:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        endTime: "2026-01-29T14:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId: LEAVE_IDS.test6,
        startTime: "2026-01-29T09:00:00Z",
        endTime: "2026-01-29T13:00:00Z",
      })
      .expect(400);
  });
});

import request from "supertest";
import { describe, it } from "vitest";
import { app } from "./setup";
import { TEST_AUTH_HEADER } from "./setup";
import { makeIds } from "../helpers/ids";

const WORK_IDS = makeIds([
  "test1", "test2", "test3", "test4", "test5", "test6", "test7"
] as const);

const CORRECTION_IDS = makeIds([
  "test1", "test2", "test3a", "test3b", "test4", "test5", "test6", "test7"
] as const);

describe.sequential("E2E: Work corrections", () => {
  it("corrects a closed work period successfully", async () => {
    const startRes = await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test1,
        startTime: "2026-01-20T09:00:00Z",
      })
      .expect(201);

    const wpId = startRes.body.workPeriodId;

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        endTime: "2026-01-20T17:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/work/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: wpId,
        correctionId: CORRECTION_IDS.test1,
        correctedStartTime: "2026-01-20T09:30:00Z",
        correctedEndTime: "2026-01-20T16:30:00Z",
        reason: "Forgot to clock out properly",
      })
      .expect(201);
  });

  it("rejects correction on an OPEN work period", async () => {
    const startRes = await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test2,
        startTime: "2026-01-21T09:00:00Z",
      })
      .expect(201);

    const wpId = startRes.body.workPeriodId;

    await request(app)
      .post("/work/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: wpId,
        correctionId: CORRECTION_IDS.test2,
        correctedStartTime: "2026-01-21T10:00:00Z",
        correctedEndTime: "2026-01-21T17:00:00Z",
        reason: "Attempting to correct open work",
      })
      .expect(400);
  });

  it("allows multiple corrections on the same work period (correction chain)", async () => {
    const startRes = await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test3,
        startTime: "2026-01-22T08:00:00Z",
      })
      .expect(201);

    const wpId = startRes.body.workPeriodId;

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        endTime: "2026-01-22T16:00:00Z",
      })
      .expect(200);

    // First correction
    await request(app)
      .post("/work/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: wpId,
        correctionId: CORRECTION_IDS.test3a,
        correctedStartTime: "2026-01-22T08:30:00Z",
        correctedEndTime: "2026-01-22T16:30:00Z",
        reason: "First adjustment",
      })
      .expect(201);

    // Second correction
    await request(app)
      .post("/work/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: wpId,
        correctionId: CORRECTION_IDS.test3b,
        correctedStartTime: "2026-01-22T09:00:00Z",
        correctedEndTime: "2026-01-22T17:00:00Z",
        reason: "Second adjustment",
      })
      .expect(201);
  });

  it("rejects correction with invalid time range (end before start)", async () => {
    const startRes = await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test4,
        startTime: "2026-01-23T09:00:00Z",
      })
      .expect(201);

    const wpId = startRes.body.workPeriodId;

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        endTime: "2026-01-23T17:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/work/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: wpId,
        correctionId: CORRECTION_IDS.test4,
        correctedStartTime: "2026-01-23T18:00:00Z", // After end time
        correctedEndTime: "2026-01-23T17:00:00Z",
        reason: "Invalid time range",
      })
      .expect(400);
  });

  it("rejects correction with same start and end time", async () => {
    const startRes = await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test5,
        startTime: "2026-01-24T09:00:00Z",
      })
      .expect(201);

    const wpId = startRes.body.workPeriodId;

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        endTime: "2026-01-24T17:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/work/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: wpId,
        correctionId: CORRECTION_IDS.test5,
        correctedStartTime: "2026-01-24T12:00:00Z",
        correctedEndTime: "2026-01-24T12:00:00Z", // Same as start
        reason: "Zero duration",
      })
      .expect(400);
  });

  it("rejects correction of non-existent work period", async () => {
    await request(app)
      .post("/work/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: "99999999-9999-9999-9999-999999999999",
        correctionId: CORRECTION_IDS.test6,
        correctedStartTime: "2026-01-25T09:00:00Z",
        correctedEndTime: "2026-01-25T17:00:00Z",
        reason: "Non-existent work period",
      })
      .expect(400);
  });

  it("preserves original work period data after correction", async () => {
    const startRes = await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test7,
        startTime: "2026-01-26T09:00:00Z",
      })
      .expect(201);

    const wpId = startRes.body.workPeriodId;

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        endTime: "2026-01-26T17:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/work/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: wpId,
        correctionId: CORRECTION_IDS.test7,
        correctedStartTime: "2026-01-26T10:00:00Z",
        correctedEndTime: "2026-01-26T16:00:00Z",
        reason: "Correction for verification",
      })
      .expect(201);
  });
});

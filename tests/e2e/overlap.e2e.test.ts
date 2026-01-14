import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../../src/server";
import { TEST_DRIVER_ID, TEST_AUTH_HEADER } from "./setup";
import { makeIds } from "../helpers/ids";

const WORK_IDS = makeIds([
  "test1", "test2", "test3", "test4", "test5", "test6", "test7"
] as const);

const LEAVE_IDS = makeIds([
  "test1", "test2", "test3", "test4", "test5", "test6", "test7"
] as const);

const CORRECTION_IDS = makeIds([
  "test4", "test5", "test7"
] as const);


describe.sequential("E2E: Work–Leave overlap (cross-domain)", () => {
  it("prevents recording leave that overlaps an open work period", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        workPeriodId: WORK_IDS.test1,
        startTime: "2026-01-20T09:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        leaveId: LEAVE_IDS.test1,
        startTime: "2026-01-20T11:00:00Z",
        endTime: "2026-01-20T13:00:00Z",
        reason: "Doctor visit",
      })
      .expect(400);
  });


  it("allows recording leave after the overlapping work is closed", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        workPeriodId: WORK_IDS.test2,
        startTime: "2026-01-21T09:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        endTime: "2026-01-21T11:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        leaveId: LEAVE_IDS.test2,
        startTime: "2026-01-21T11:00:01Z",
        endTime: "2026-01-21T13:00:00Z",
        reason: "Personal leave",
      })
      .expect(201);
  });


  it("prevents closing work if it overlaps an existing leave", async () => {
    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        leaveId: LEAVE_IDS.test3,
        startTime: "2026-01-22T10:00:00Z",
        endTime: "2026-01-22T12:00:00Z",
        reason: "Half-day leave",
      })
      .expect(201);

    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        workPeriodId: WORK_IDS.test3,
        startTime: "2026-01-22T09:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        endTime: "2026-01-22T11:30:00Z",
      })
      .expect(400);
  });


  it("prevents work correction that causes overlap with existing leave", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        workPeriodId: WORK_IDS.test4,
        startTime: "2026-01-23T08:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        endTime: "2026-01-23T10:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        leaveId: LEAVE_IDS.test4,
        startTime: "2026-01-23T10:30:00Z",
        endTime: "2026-01-23T12:00:00Z",
        reason: "Emergency",
      })
      .expect(201);

    await request(app)
      .post("/work/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        workPeriodId: WORK_IDS.test4,
        correctionId: CORRECTION_IDS.test4,
        correctedStartTime: "2026-01-23T09:30:00Z",
        correctedEndTime: "2026-01-23T11:30:00Z",
        reason: "Adjustment",
      })
      .expect(400);
  });


  it("prevents leave correction that causes overlap with existing work", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        workPeriodId: WORK_IDS.test5,
        startTime: "2026-01-24T09:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        endTime: "2026-01-24T11:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        leaveId: LEAVE_IDS.test5,
        startTime: "2026-01-24T12:00:00Z",
        endTime: "2026-01-24T14:00:00Z",
        reason: "Planned leave",
      })
      .expect(201);

    await request(app)
      .post("/leave/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        leaveId: LEAVE_IDS.test5,
        correctionId: CORRECTION_IDS.test5,
        correctedStartTime: "2026-01-24T10:30:00Z",
        correctedEndTime: "2026-01-24T13:00:00Z",
        reason: "Invalid correction",
      })
      .expect(400);
  });


  it("allows adjacent work and leave with a small gap (no overlap)", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        workPeriodId: WORK_IDS.test6,
        startTime: "2026-01-25T09:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        endTime: "2026-01-25T11:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        leaveId: LEAVE_IDS.test6,
        startTime: "2026-01-25T11:00:01Z",
        endTime: "2026-01-25T13:00:00Z",
        reason: "Adjacent timing",
      })
      .expect(201);
  });


  it("allows correction that removes overlap with leave", async () => {

    const res = await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: WORK_IDS.test7,
        startTime: "2026-01-26T09:00:00Z",
      })
      .expect(201);
    const wpId = (res.body.workPeriodId)

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        
        endTime: "2026-01-26T13:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId: LEAVE_IDS.test7,
        startTime: "2026-01-26T11:00:00Z",
        endTime: "2026-01-26T12:00:00Z",
        reason: "Short leave",
      })
      .expect(400);
    await request(app)
      .post("/work/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: wpId,
        correctionId: CORRECTION_IDS.test7,
        correctedStartTime: "2026-01-26T09:00:00Z",
        correctedEndTime: "2026-01-26T10:00:00Z",
        reason: "Fixed timing",
      })
      .expect(201);

    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        leaveId: LEAVE_IDS.test7,
        startTime: "2026-01-26T11:00:00Z",
        endTime: "2026-01-26T12:00:00Z",
        reason: "Short leave",
      })
      .expect(201);
  });
});

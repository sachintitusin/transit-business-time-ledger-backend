import request from "supertest";
import { describe, it } from "vitest";
import { app } from "./setup";
import { TOKEN_DRIVER_1 } from "../helpers/auth.helper";
import { randomUUID } from "crypto";

const WORK_PERIOD_ID = randomUUID();


describe.sequential("E2E: Leave corrections", () => {

  it("corrects a leave successfully when no work conflicts", async () => {
    const recordResponse = await request(app)
      .post("/leave/record")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        startTime: "2026-01-20T10:00:00Z",
        endTime: "2026-01-20T14:00:00Z",
        reason: "Doctor appointment",
      })
      .expect(201);

    const { leaveId } = recordResponse.body;

    await request(app)
      .post("/leave/correct")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        leaveId,
        correctedStartTime: "2026-01-20T11:00:00Z",
        correctedEndTime: "2026-01-20T15:00:00Z",
        reason: "Appointment ran longer",
      })
      .expect(201);
  });

  it("allows multiple corrections on the same leave (correction chain)", async () => {
    const recordResponse = await request(app)
      .post("/leave/record")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        startTime: "2026-01-21T09:00:00Z",
        endTime: "2026-01-21T12:00:00Z",
        reason: "Personal leave",
      })
      .expect(201);

    const { leaveId } = recordResponse.body;

    await request(app)
      .post("/leave/correct")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        leaveId,
        correctedStartTime: "2026-01-21T10:00:00Z",
        correctedEndTime: "2026-01-21T13:00:00Z",
        reason: "First adjustment",
      })
      .expect(201);

    await request(app)
      .post("/leave/correct")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        leaveId,
        correctedStartTime: "2026-01-21T10:30:00Z",
        correctedEndTime: "2026-01-21T14:00:00Z",
        reason: "Second adjustment",
      })
      .expect(201);
  });

  it("rejects leave correction that would overlap with closed work", async () => {
    const leaveRes = await request(app)
      .post("/leave/record")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        startTime: "2026-01-22T06:00:00Z",
        endTime: "2026-01-22T07:00:00Z",
        reason: "Morning leave",
      })
      .expect(201);

    const { leaveId } = leaveRes.body;

    const startRes = await request(app)
      .post("/work/start")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        workPeriodId: WORK_PERIOD_ID,
        startTime: "2026-01-22T09:00:00Z",
      })
      .expect(201);

    const { workPeriodId } = startRes.body;

    await request(app)
      .post("/work/close")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        endTime: "2026-01-22T17:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/leave/correct")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        leaveId,
        workPeriodId, // ✅ REQUIRED BY DTO
        correctedStartTime: "2026-01-22T08:00:00Z",
        correctedEndTime: "2026-01-22T10:00:00Z",
        reason: "Would overlap work",
      })
      .expect(400);
  });

  it("rejects correction with invalid time range (end before start)", async () => {
    const recordResponse = await request(app)
      .post("/leave/record")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        startTime: "2026-01-23T10:00:00Z",
        endTime: "2026-01-23T14:00:00Z",
        reason: "Leave to correct",
      })
      .expect(201);

    const { leaveId } = recordResponse.body;

    await request(app)
      .post("/leave/correct")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        leaveId,
        correctedStartTime: "2026-01-23T15:00:00Z",
        correctedEndTime: "2026-01-23T14:00:00Z",
        reason: "Invalid time range",
      })
      .expect(400);
  });

  it("rejects correction with same start and end time", async () => {
    const recordResponse = await request(app)
      .post("/leave/record")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        startTime: "2026-01-24T10:00:00Z",
        endTime: "2026-01-24T14:00:00Z",
        reason: "Leave to correct",
      })
      .expect(201);

    const { leaveId } = recordResponse.body;

    await request(app)
      .post("/leave/correct")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        leaveId,
        correctedStartTime: "2026-01-24T12:00:00Z",
        correctedEndTime: "2026-01-24T12:00:00Z",
        reason: "Zero duration",
      })
      .expect(400);
  });

  it("rejects correction of non-existent leave", async () => {
    await request(app)
      .post("/leave/correct")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        leaveId: "99999999-9999-4999-8999-999999999999",
        correctedStartTime: "2026-01-25T10:00:00Z",
        correctedEndTime: "2026-01-25T14:00:00Z",
        reason: "Non-existent leave",
      })
      .expect(400);
  });

});

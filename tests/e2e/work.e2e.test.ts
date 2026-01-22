import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import { app } from "./setup";
import { TOKEN_DRIVER_1, TOKEN_DRIVER_2 } from "../helpers/auth.helper";

import { randomUUID } from "crypto";

const WORK_IDS = {
  test1: randomUUID(),
  test2a: randomUUID(),
  test2b: randomUUID(),
  test3: randomUUID(),
  test4: randomUUID(),
  test5: randomUUID(),
  test6: randomUUID(),
  test7a: randomUUID(),
  test7b: randomUUID(),
};

const LEAVE_IDS = {
  test4: randomUUID(),
  test5: randomUUID(),
};


describe.sequential("E2E: Work lifecycle", () => {

  /**
   * 🔒 Test isolation
   * Ensure no OPEN work period leaks between tests.
   * Closing when none exists is acceptable and ignored.
   */
  beforeEach(async () => {
    await request(app)
      .post("/work/close")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({ endTime: new Date().toISOString() });

    await request(app)
      .post("/work/close")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_2}`)
      .send({ endTime: new Date().toISOString() });
  });

  it("starts and closes a work period successfully", async () => {
    // 1️⃣ Start work
    const startRes = await request(app)
      .post("/work/start")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        workPeriodId: WORK_IDS.test1,
        startTime: "2026-01-10T06:30:00Z",
      })
      .expect(201);

    const workPeriodId = startRes.body.workPeriodId;

    // 🔍 PROBE: verify work entry exists immediately after start
    const entryRes = await request(app)
      .get(`/entries/${workPeriodId}`)
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .expect(200);

    expect(entryRes.body).toMatchObject({
      id: workPeriodId,
      type: "WORK",
    });

    expect(entryRes.body.startTime).toBe("2026-01-10T06:30:00.000Z");
    expect(entryRes.body.endTime).toBeNull();

    // 2️⃣ Close work
    await request(app)
      .post("/work/close")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        endTime: "2026-01-10T14:30:00Z",
      })
      .expect(200);

    // 3️⃣ Analytics sanity check
    const summary = await request(app)
      .get("/analytics/work")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .query({
        from: "2026-01-10T00:00:00Z",
        to: "2026-01-11T00:00:00Z",
      })
      .expect(200);

    expect(summary.body.totalHours).toBeGreaterThan(0);
  });

  it("rejects starting work when another work period is already open", async () => {
    await request(app)
      .post("/work/start")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        workPeriodId: WORK_IDS.test2a,
        startTime: "2026-01-11T06:30:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/start")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        workPeriodId: WORK_IDS.test2b,
        startTime: "2026-01-11T07:00:00Z",
      })
      .expect(400);

    await request(app)
      .post("/work/close")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        endTime: "2026-01-11T15:00:00Z",
      })
      .expect(200);
  });

  it("rejects closing work when no work period is open", async () => {
    await request(app)
      .post("/work/close")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        endTime: "2026-01-12T14:30:00Z",
      })
      .expect(400);
  });

  it("rejects recording leave that overlaps with open work", async () => {
    await request(app)
      .post("/work/start")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        workPeriodId: WORK_IDS.test4,
        startTime: "2026-01-13T06:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/leave/record")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        leaveId: LEAVE_IDS.test4,
        startTime: "2026-01-13T12:00:00Z",
        endTime: "2026-01-13T18:00:00Z",
      })
      .expect(400);

    await request(app)
      .post("/work/close")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        endTime: "2026-01-13T15:00:00Z",
      })
      .expect(200);
  });

  it("allows closing work after a failed leave attempt (no partial state)", async () => {
    await request(app)
      .post("/work/start")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        workPeriodId: WORK_IDS.test5,
        startTime: "2026-01-14T06:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/leave/record")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        leaveId: LEAVE_IDS.test5,
        startTime: "2026-01-14T07:00:00Z",
        endTime: "2026-01-14T08:00:00Z",
      })
      .expect(400);

    await request(app)
      .post("/work/close")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        endTime: "2026-01-14T08:30:00Z",
      })
      .expect(200);

    const summary = await request(app)
      .get("/analytics/work")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .query({
        from: "2026-01-14T00:00:00Z",
        to: "2026-01-15T00:00:00Z",
      })
      .expect(200);

    expect(summary.body.totalHours).toBeGreaterThan(0);
  });

  it("rejects closing work with invalid end time (before start)", async () => {
    await request(app)
      .post("/work/start")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        workPeriodId: WORK_IDS.test6,
        startTime: "2026-01-15T10:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        endTime: "2026-01-15T09:00:00Z",
      })
      .expect(400);

    await request(app)
      .post("/work/close")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        endTime: "2026-01-15T18:00:00Z",
      })
      .expect(200);
  });

  it("isolates work periods between different drivers", async () => {
    await request(app)
      .post("/work/start")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        workPeriodId: WORK_IDS.test7a,
        startTime: "2026-01-16T08:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/start")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_2}`)
      .send({
        workPeriodId: WORK_IDS.test7b,
        startTime: "2026-01-16T08:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({ endTime: "2026-01-16T16:00:00Z" })
      .expect(200);

    await request(app)
      .post("/work/close")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_2}`)
      .send({ endTime: "2026-01-16T16:00:00Z" })
      .expect(200);
  });

});

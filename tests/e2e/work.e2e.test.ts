import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../../src/server";
import { TOKEN_DRIVER_1, TOKEN_DRIVER_2 } from "../helpers/auth.helper";



const WORK_IDS = {
  test1: "11111111-1111-1111-1111-111111111111",
  test2a: "22222222-2222-2222-2222-222222222222",
  test2b: "33333333-3333-3333-3333-333333333333",
  test3: "44444444-4444-4444-4444-444444444444",
  test4: "55555555-5555-5555-5555-555555555555",
  test5: "66666666-6666-6666-6666-666666666666",
  test6: "77777777-7777-7777-7777-777777777777",
  test7a: "88888888-8888-8888-8888-888888888888",
  test7b: "99999999-9999-9999-9999-999999999999",
};

const LEAVE_IDS = {
  test4: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  test5: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
};

describe.sequential("E2E: Work lifecycle", () => {

  it("starts and closes a work period successfully", async () => {
    await request(app)
      .post("/work/start")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        workPeriodId: WORK_IDS.test1,
        startTime: "2026-01-10T06:30:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        endTime: "2026-01-10T14:30:00Z",
      })
      .expect(200);

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

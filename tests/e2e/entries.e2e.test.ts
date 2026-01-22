import request from "supertest";
import { describe, it, expect } from "vitest";
import { app, TEST_AUTH_HEADER } from "./setup";
import { v4 as uuidv4 } from "uuid";

describe.sequential("E2E: Entries & Entry By ID (Invariant Locked)", () => {

  it("GET /entries returns empty list when no entries exist", async () => {
    const res = await request(app)
      .get("/entries")
      .set(TEST_AUTH_HEADER)
      .expect(200);

    expect(res.body.entries).toEqual([]);
  });

  it("GET /entries includes OPEN work period with startTime only", async () => {
    const workPeriodId = uuidv4();

    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId,
        startTime: "2026-02-10T08:00:00Z",
      })
      .expect(201);

    const res = await request(app)
      .get("/entries")
      .set(TEST_AUTH_HEADER)
      .expect(200);

    expect(res.body.entries.length).toBe(1);

    const entry = res.body.entries[0];
    expect(entry.type).toBe("WORK");
    expect(entry.startTime).toBe("2026-02-10T08:00:00.000Z");
    expect(entry.endTime).toBeNull();
  });

  it("GET /entries/:id returns OPEN work without computing effective time", async () => {
    const workPeriodId = uuidv4();

    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId,
        startTime: "2026-02-10T08:00:00Z",
      })
      .expect(201);

    const res = await request(app)
      .get(`/entries/${workPeriodId}`)
      .set(TEST_AUTH_HEADER)
      .expect(200);

    expect(res.body.type).toBe("WORK");
    expect(res.body.startTime).toBe("2026-02-10T08:00:00.000Z");
    expect(res.body.endTime).toBeNull();
  });

  it("GET /entries returns effective WORK time after correction", async () => {
    const workPeriodId = uuidv4();

    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId,
        startTime: "2026-02-10T08:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        endTime: "2026-02-10T16:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/work/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId,
        correctionId: uuidv4(),
        correctedStartTime: "2026-02-10T08:30:00Z",
        correctedEndTime: "2026-02-10T15:30:00Z",
        reason: "Adjustment",
      })
      .expect(201);

    const res = await request(app)
      .get("/entries")
      .set(TEST_AUTH_HEADER)
      .expect(200);

    const entry = res.body.entries.find((e: any) => e.id === workPeriodId);
    expect(entry).toBeDefined();
    expect(entry.startTime).toBe("2026-02-10T08:30:00.000Z");
    expect(entry.endTime).toBe("2026-02-10T15:30:00.000Z");
  });

  it("GET /entries/:id returns effective WORK time (not declared)", async () => {
    const workPeriodId = uuidv4();

    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId,
        startTime: "2026-02-10T08:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        endTime: "2026-02-10T16:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/work/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId,
        correctionId: uuidv4(),
        correctedStartTime: "2026-02-10T08:30:00Z",
        correctedEndTime: "2026-02-10T15:30:00Z",
        reason: "Adjustment",
      })
      .expect(201);

    const res = await request(app)
      .get(`/entries/${workPeriodId}`)
      .set(TEST_AUTH_HEADER)
      .expect(200);

    expect(res.body.startTime).toBe("2026-02-10T08:30:00.000Z");
    expect(res.body.endTime).toBe("2026-02-10T15:30:00.000Z");
  });

  it("GET /entries/:id does not expose declared or correction metadata", async () => {
    const workPeriodId = uuidv4();

    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId,
        startTime: "2026-02-10T08:00:00Z",
      })
      .expect(201);

    const res = await request(app)
      .get(`/entries/${workPeriodId}`)
      .set(TEST_AUTH_HEADER)
      .expect(200);

    expect(res.body).not.toHaveProperty("declaredStartTime");
    expect(res.body).not.toHaveProperty("declaredEndTime");
    expect(res.body).not.toHaveProperty("corrections");
  });

  it("GET /entries filters by explicit date range using effective time", async () => {
    const leaveRes = await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        startTime: "2026-02-11T00:00:00Z",
        endTime: "2026-02-11T23:59:00Z",
      })
      .expect(201);

    const leaveId = leaveRes.body.leaveId;

    await request(app)
      .post("/leave/correct")
      .set(TEST_AUTH_HEADER)
      .send({
        leaveId,
        correctionId: uuidv4(),
        correctedStartTime: "2026-02-11T08:00:00Z",
        correctedEndTime: "2026-02-11T18:00:00Z",
        reason: "Correction",
      })
      .expect(201);

    const res = await request(app)
      .get("/entries")
      .query({
        from: "2026-02-11T07:00:00Z",
        to: "2026-02-11T19:00:00Z",
      })
      .set(TEST_AUTH_HEADER)
      .expect(200);

    expect(res.body.entries.length).toBe(1);
    expect(res.body.entries[0].type).toBe("LEAVE");
  });

  it("GET /entries treats touching boundaries as non-overlapping", async () => {
    const res = await request(app)
      .get("/entries")
      .query({
        from: "2026-02-10T15:30:00Z",
        to: "2026-02-10T15:30:00Z",
      })
      .set(TEST_AUTH_HEADER)
      .expect(200);

    expect(res.body.entries.length).toBe(0);
  });

  it("GET /entries/:id returns 404 for non-existent entry", async () => {
    await request(app)
      .get(`/entries/${uuidv4()}`)
      .set(TEST_AUTH_HEADER)
      .expect(404);
  });

  it("GET /entries/:id rejects unauthenticated access", async () => {
    await request(app)
      .get(`/entries/${uuidv4()}`)
      .expect(401);
  });
});

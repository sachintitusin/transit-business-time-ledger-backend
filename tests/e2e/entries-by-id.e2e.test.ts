import request from "supertest";
import { describe, it, expect } from "vitest";
import { app, TEST_AUTH_HEADER } from "./setup";
import { v4 as uuidv4 } from "uuid";

describe("E2E: GET /entries/:id", () => {

  it("returns 404 if entry does not exist", async () => {
    await request(app)
      .get("/entries/00000000-0000-0000-0000-000000000000")
      .set(TEST_AUTH_HEADER)
      .expect(404);
  });

  it("returns a WORK entry by id", async () => {
    const workPeriodId = uuidv4();

    // 1️⃣ Start work (explicit ID)
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId,
        startTime: "2026-02-05T08:00:00Z",
      })
      .expect(201);

    // 2️⃣ Close work
    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        endTime: "2026-02-05T16:00:00Z",
      })
      .expect(200);

    // 3️⃣ Fetch entry
    const res = await request(app)
      .get(`/entries/${workPeriodId}`)
      .set(TEST_AUTH_HEADER)
      .expect(200);

    expect(res.body.id).toBe(workPeriodId);
    expect(res.body.type).toBe("WORK");
    expect(res.body.startTime).toBeDefined();
    expect(res.body.endTime).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
  });

  it("returns a LEAVE entry by id", async () => {

    // 1️⃣ Record leave (explicit ID)
    const leave = await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        startTime: "2026-02-06T00:00:00Z",
        endTime: "2026-02-06T23:59:00Z",
        reason: "Test leave",
      })
      .expect(201);

    const leaveId = leave.body.leaveId

    // 2️⃣ Fetch entry
    const res = await request(app)
      .get(`/entries/${leaveId}`)
      .set(TEST_AUTH_HEADER)
      .expect(200);

    expect(res.body.id).toBe(leaveId);
    expect(res.body.type).toBe("LEAVE");
    expect(res.body.startTime).toBeDefined();
    expect(res.body.endTime).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
  });

});

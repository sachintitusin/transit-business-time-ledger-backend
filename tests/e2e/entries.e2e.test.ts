import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../../src/server";
import { TEST_AUTH_HEADER } from "./setup";

describe.sequential("E2E: GET /entries", () => {

  it("returns empty list initially", async () => {
    const res = await request(app)
      .get("/entries")
      .set(TEST_AUTH_HEADER)
      .expect(200);

    expect(res.body.entries).toEqual([]);
  });

  it("returns work and leave entries in chronological order", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({ startTime: "2026-02-01T08:00:00Z" });

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({ endTime: "2026-02-01T16:00:00Z" });

    await request(app)
      .post("/leave/record")
      .set(TEST_AUTH_HEADER)
      .send({
        startTime: "2026-02-02T00:00:00Z",
        endTime: "2026-02-02T23:59:00Z",
      });

    const res = await request(app)
      .get("/entries")
      .set(TEST_AUTH_HEADER)
      .expect(200);

    expect(res.body.entries.length).toBe(2);
    expect(res.body.entries[0].type).toBe("WORK");
    expect(res.body.entries[1].type).toBe("LEAVE");
  });
  
    it("filters entries by date range", async () => {
    // work on Feb 1
    await request(app)
        .post("/work/start")
        .set(TEST_AUTH_HEADER)
        .send({ startTime: "2026-02-01T08:00:00Z" });

    await request(app)
        .post("/work/close")
        .set(TEST_AUTH_HEADER)
        .send({ endTime: "2026-02-01T16:00:00Z" });

    // work on Feb 10
    await request(app)
        .post("/work/start")
        .set(TEST_AUTH_HEADER)
        .send({ startTime: "2026-02-10T08:00:00Z" });

    await request(app)
        .post("/work/close")
        .set(TEST_AUTH_HEADER)
        .send({ endTime: "2026-02-10T16:00:00Z" });

    const res = await request(app)
        .get("/entries?from=2026-02-01T00:00:00Z&to=2026-02-05T23:59:00Z")
        .set(TEST_AUTH_HEADER)
        .expect(200);

    expect(res.body.entries.length).toBe(1);
    });

});

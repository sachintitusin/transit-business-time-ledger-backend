import request from "supertest";
import { describe, it, expect, afterEach } from "vitest";
import { randomUUID } from "crypto";
import { app } from "./setup";
import {
  TEST_AUTH_HEADER,
  OTHER_AUTH_HEADER,
} from "./setup";
import { prisma } from "../../src/infrastructure/prisma/prismaClient";

describe.sequential("E2E: GET /work/status", () => {

  afterEach(async () => {
    // Clean only work-related state
    await prisma.workPeriod.deleteMany({});
    await prisma.entryProjection.deleteMany({});
  });

  it("returns CLOSED when no work period is active", async () => {
    const res = await request(app)
      .get("/work/status")
      .set(TEST_AUTH_HEADER)
      .expect(200);

    expect(res.body).toEqual({
      status: "CLOSED",
      activeWorkPeriod: null,
    });
  });

  it("returns OPEN when a work period is active", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: randomUUID(),
        startTime: "2026-01-20T08:00:00Z",
      })
      .expect(201);

    const res = await request(app)
      .get("/work/status")
      .set(TEST_AUTH_HEADER)
      .expect(200);

    expect(res.body.status).toBe("OPEN");
    expect(res.body.activeWorkPeriod).toBeDefined();
    expect(res.body.activeWorkPeriod).toHaveProperty("workPeriodId");
    expect(res.body.activeWorkPeriod).toHaveProperty("startedAt");
  });

  it("returns CLOSED again after work is closed", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: randomUUID(),
        startTime: "2026-01-21T09:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        endTime: "2026-01-21T17:00:00Z",
      })
      .expect(200);

    const res = await request(app)
      .get("/work/status")
      .set(TEST_AUTH_HEADER)
      .expect(200);

    expect(res.body).toEqual({
      status: "CLOSED",
      activeWorkPeriod: null,
    });
  });

  it("isolates work status between drivers", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId: randomUUID(),
        startTime: "2026-01-22T08:00:00Z",
      })
      .expect(201);

    const resOther = await request(app)
      .get("/work/status")
      .set(OTHER_AUTH_HEADER)
      .expect(200);

    expect(resOther.body).toEqual({
      status: "CLOSED",
      activeWorkPeriod: null,
    });
  });

  it("rejects unauthenticated access", async () => {
    await request(app)
      .get("/work/status")
      .expect(401);
  });

});

import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../../src/server";
import {
  TEST_DRIVER_ID,
  OTHER_DRIVER_ID,
  TEST_AUTH_HEADER,
  OTHER_AUTH_HEADER,
} from "./setup";

describe.sequential("E2E: Shift transfers", () => {

  async function startAndCloseWork(authHeader: any) {
    const startRes = await request(app)
      .post("/work/start")
      .set(authHeader)
      .send({
        startTime: "2026-01-14T08:00:00Z",
      })
      .expect(201);

    const workPeriodId = startRes.body.workPeriodId;
    expect(workPeriodId).toBeDefined();

    await request(app)
      .post("/work/close")
      .set(authHeader)
      .send({
        endTime: "2026-01-14T16:00:00Z",
      })
      .expect(200);

    return workPeriodId;
  }

  it("records a shift transfer linked to an existing CLOSED work period", async () => {
    const workPeriodId = await startAndCloseWork(TEST_AUTH_HEADER);

    const res = await request(app)
      .post("/transfer/record")
      .set(TEST_AUTH_HEADER)
      .send({
        fromDriverId: TEST_DRIVER_ID,
        toDriverId: OTHER_DRIVER_ID,
        workPeriodId,
        reason: "Extra shift coverage",
      })
      .expect(201);

    expect(res.body.transferId).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("rejects transfer to the same driver", async () => {
    const workPeriodId = await startAndCloseWork(TEST_AUTH_HEADER);

    await request(app)
      .post("/transfer/record")
      .set(TEST_AUTH_HEADER)
      .send({
        fromDriverId: TEST_DRIVER_ID,
        toDriverId: TEST_DRIVER_ID,
        workPeriodId,
        reason: "Invalid self transfer",
      })
      .expect(400);
  });

  it("does NOT create work for the receiving driver when recording a transfer", async () => {
    const workPeriodId = await startAndCloseWork(TEST_AUTH_HEADER);

    await request(app)
      .post("/transfer/record")
      .set(TEST_AUTH_HEADER)
      .send({
        fromDriverId: TEST_DRIVER_ID,
        toDriverId: OTHER_DRIVER_ID,
        workPeriodId,
        reason: "Context only",
      })
      .expect(201);

    const summary = await request(app)
      .get("/analytics/work")
      .set(OTHER_AUTH_HEADER)
      .query({
        from: "2026-01-14T00:00:00Z",
        to: "2026-01-15T00:00:00Z",
      })
      .expect(200);

    expect(summary.body.totalHours).toBe(0);
  });

  it("does not close or modify an OPEN work period when transfer is attempted", async () => {
    const startRes = await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        startTime: "2026-01-15T08:00:00Z",
      })
      .expect(201);

    const workPeriodId = startRes.body.workPeriodId;

    await request(app)
      .post("/transfer/record")
      .set(TEST_AUTH_HEADER)
      .send({
        fromDriverId: TEST_DRIVER_ID,
        toDriverId: OTHER_DRIVER_ID,
        workPeriodId,
        reason: "Transfer during active work",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        endTime: "2026-01-15T16:00:00Z",
      })
      .expect(200);
  });

  it("rejects transfer of non-existent work period", async () => {
    await request(app)
      .post("/transfer/record")
      .set(TEST_AUTH_HEADER)
      .send({
        fromDriverId: TEST_DRIVER_ID,
        toDriverId: OTHER_DRIVER_ID,
        workPeriodId: "ffffffff-9999-9999-9999-999999999999",
        reason: "Invalid work ID",
      })
      .expect(400);
  });

  it("allows multiple transfers on same work period (chain)", async () => {
    const workPeriodId = await startAndCloseWork(TEST_AUTH_HEADER);

    // Transfer 1: TEST → OTHER
    await request(app)
      .post("/transfer/record")
      .set(TEST_AUTH_HEADER)
      .send({
        fromDriverId: TEST_DRIVER_ID,
        toDriverId: OTHER_DRIVER_ID,
        workPeriodId,
        reason: "First transfer",
      })
      .expect(201);

    // Transfer 2: OTHER → TEST
    await request(app)
      .post("/transfer/record")
      .set(OTHER_AUTH_HEADER)
      .send({
        fromDriverId: OTHER_DRIVER_ID,
        toDriverId: TEST_DRIVER_ID,
        workPeriodId,
        reason: "Return transfer",
      })
      .expect(201);
  });

  it("rejects transfer without fromDriverId or toDriverId", async () => {
    const workPeriodId = await startAndCloseWork(TEST_AUTH_HEADER);

    await request(app)
      .post("/transfer/record")
      .set(TEST_AUTH_HEADER)
      .send({
        workPeriodId,
        reason: "Missing participants",
      })
      .expect(400);
  });
});

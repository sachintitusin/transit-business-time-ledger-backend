import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../../src/server";
import { TEST_DRIVER_ID, OTHER_DRIVER_ID, TEST_AUTH_HEADER, OTHER_AUTH_HEADER } from "./setup";


const WORK_IDS = {
  test1: "aaaaaaaa-1111-1111-1111-111111111111",
  test2: "bbbbbbbb-2222-2222-2222-222222222222",
  test3: "cccccccc-3333-3333-3333-333333333333",
  test4: "dddddddd-4444-4444-4444-444444444444",
};


const TRANSFER_IDS = {
  test1: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  test2: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  test3: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  test4: "dddddddd-dddd-dddd-dddd-dddddddddddd",
};


describe.sequential("E2E: Shift transfers", () => {


  it("records a shift transfer linked to an existing CLOSED work period", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        workPeriodId: WORK_IDS.test1,
        startTime: "2026-01-14T08:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        endTime: "2026-01-14T16:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/transfer/record")
      .set(TEST_AUTH_HEADER)
      .send({
        transferId: TRANSFER_IDS.test1,
        workPeriodId: WORK_IDS.test1,
        toDriverId: OTHER_DRIVER_ID,
        fromDriverId: TEST_DRIVER_ID,
        reason: "Extra shift coverage",
      })
      .expect(201);
  });


  it("rejects transfer to the same driver", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        workPeriodId: WORK_IDS.test2,
        startTime: "2026-01-14T08:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        endTime: "2026-01-14T16:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/transfer/record")
      .set(TEST_AUTH_HEADER)
      .send({
        transferId: TRANSFER_IDS.test2,
        workPeriodId: WORK_IDS.test2,
        toDriverId: TEST_DRIVER_ID,
        fromDriverId: TEST_DRIVER_ID,
        reason: "Invalid self transfer",
      })
      .expect(400);
  });


  it("does NOT create work for the receiving driver when recording a transfer", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        workPeriodId: WORK_IDS.test3,
        startTime: "2026-01-14T08:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        endTime: "2026-01-14T16:00:00Z",
      })
      .expect(200);

    await request(app)
      .post("/transfer/record")
      .set(TEST_AUTH_HEADER)
      .send({
        transferId: TRANSFER_IDS.test3,
        workPeriodId: WORK_IDS.test3,
        toDriverId: OTHER_DRIVER_ID,
        fromDriverId: TEST_DRIVER_ID,
        reason: "Context only",
      })
      .expect(201);

    const summary = await request(app)
      .get("/analytics/work")
      .set(OTHER_AUTH_HEADER)
      .query({
        driverId: OTHER_DRIVER_ID,
        from: "2026-01-14T00:00:00Z",
        to: "2026-01-15T00:00:00Z",
      })
      .expect(200);

    expect(summary.body.totalHours).toBe(0);
  });


  it("does not close or modify an OPEN work period when transfer is attempted", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        workPeriodId: WORK_IDS.test4,
        startTime: "2026-01-15T08:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/transfer/record")
      .set(TEST_AUTH_HEADER)
      .send({
        transferId: TRANSFER_IDS.test4,
        workPeriodId: WORK_IDS.test4,
        toDriverId: OTHER_DRIVER_ID,
        fromDriverId: TEST_DRIVER_ID,
        reason: "Transfer during active work",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        endTime: "2026-01-15T16:00:00Z",
      })
      .expect(200);
  });

  it("rejects transfer of non-existent work period", async () => {
    await request(app)
      .post("/transfer/record")
      .set(TEST_AUTH_HEADER)
      .send({
        transferId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        workPeriodId: "fake-work-id-9999-9999-9999",
        toDriverId: OTHER_DRIVER_ID,
        fromDriverId: TEST_DRIVER_ID,
        reason: "Invalid work ID",
      })
      .expect(400);
  });


  it("allows multiple transfers on same work period (chain)", async () => {
    await request(app)
      .post("/work/start")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        workPeriodId: "ffffffff-ffff-ffff-ffff-ffffffffffff",
        startTime: "2026-01-16T08:00:00Z",
      })
      .expect(201);

    await request(app)
      .post("/work/close")
      .set(TEST_AUTH_HEADER)
      .send({
        driverId: TEST_DRIVER_ID,
        endTime: "2026-01-16T16:00:00Z",
      })
      .expect(200);

    // Transfer 1: TEST → OTHER
    await request(app)
      .post("/transfer/record")
      .set(TEST_AUTH_HEADER)
      .send({
        transferId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        workPeriodId: "ffffffff-ffff-ffff-ffff-ffffffffffff",
        toDriverId: OTHER_DRIVER_ID,
        fromDriverId: TEST_DRIVER_ID,
        reason: "First transfer",
      })
      .expect(201);

    // Transfer 2: OTHER → TEST (back)
    await request(app)
      .post("/transfer/record")
      .set(OTHER_AUTH_HEADER)
      .send({
        transferId: "ffffffff-eeee-eeee-eeee-eeeeeeeeeeee",
        workPeriodId: "ffffffff-ffff-ffff-ffff-ffffffffffff",
        toDriverId: TEST_DRIVER_ID,
        fromDriverId: OTHER_DRIVER_ID,
        reason: "Return transfer",
      })
      .expect(201);
  });


  it("rejects transfer without fromDriverId", async () => {
    await request(app)
      .post("/transfer/record")
      .set(TEST_AUTH_HEADER)
      .send({
        transferId: "gggggggg-gggg-gggg-gggg-gggggggggggg",
        workPeriodId: WORK_IDS.test1,
        toDriverId: OTHER_DRIVER_ID,
        // ❌ fromDriverId missing
        reason: "Missing origin",
      })
      .expect(400);
  });
});

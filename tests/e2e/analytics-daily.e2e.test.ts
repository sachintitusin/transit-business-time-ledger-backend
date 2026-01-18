import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../../src/server";
import { TEST_AUTH_HEADER } from "./setup";

describe("E2E: GET /analytics/daily", () => {

  it("returns daily analytics and summary for a valid date range", async () => {
    const res = await request(app)
      .get("/analytics/daily")
      .query({
        from: "2026-02-01T00:00:00Z",
        to: "2026-02-07T23:59:59Z",
      })
      .set(TEST_AUTH_HEADER)
      .expect(200);

    // ---- days ----
    expect(res.body).toHaveProperty("days");
    expect(Array.isArray(res.body.days)).toBe(true);

    if (res.body.days.length > 0) {
      const day = res.body.days[0];
      expect(day).toHaveProperty("date");
      expect(day).toHaveProperty("workMinutes");
      expect(day).toHaveProperty("leaveMinutes");
      expect(typeof day.workMinutes).toBe("number");
      expect(typeof day.leaveMinutes).toBe("number");
    }

    // ---- summary ----
    expect(res.body).toHaveProperty("summary");

    const summary = res.body.summary;

    expect(summary).toHaveProperty("totalWorkMinutes");
    expect(summary).toHaveProperty("totalLeaveMinutes");
    expect(summary).toHaveProperty("totalDays");

    expect(typeof summary.totalWorkMinutes).toBe("number");
    expect(typeof summary.totalLeaveMinutes).toBe("number");
    expect(typeof summary.totalDays).toBe("number");

    // sanity invariants
    expect(summary.totalWorkMinutes).toBeGreaterThanOrEqual(0);
    expect(summary.totalLeaveMinutes).toBeGreaterThanOrEqual(0);
    expect(summary.totalDays).toBe(res.body.days.length);
  });

  it("rejects when `from` is after `to`", async () => {
    await request(app)
      .get("/analytics/daily")
      .query({
        from: "2026-02-10T00:00:00Z",
        to: "2026-02-01T00:00:00Z",
      })
      .set(TEST_AUTH_HEADER)
      .expect(400);
  });

  it("rejects when date range exceeds allowed limit", async () => {
    await request(app)
      .get("/analytics/daily")
      .query({
        from: "2010-01-01T00:00:00Z",
        to: "2026-01-01T00:00:00Z",
      })
      .set(TEST_AUTH_HEADER)
      .expect(400);
  });

  it("rejects when query params are missing", async () => {
    await request(app)
      .get("/analytics/daily")
      .set(TEST_AUTH_HEADER)
      .expect(400);
  });

});

import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "./setup";
import { TOKEN_DRIVER_1 } from "../helpers/auth.helper";


describe("E2E: Start work only (isolated)", () => {
  it("opens a work period and returns 201", async () => {
    const res = await request(app)
      .post("/work/start")
      .set("Authorization", `Bearer ${TOKEN_DRIVER_1}`)
      .send({
        // ✅ valid UUID v4
        workPeriodId: "11111111-1111-4111-8111-111111111111",
        startTime: "2026-01-10T06:30:00Z",
      })
      .expect(201);

    expect(res.body).toHaveProperty("workPeriodId");
    expect(res.body.workPeriodId).toBe(
      "11111111-1111-4111-8111-111111111111"
    );
  });
});

import request from "supertest";
import { describe, it, expect } from "vitest";
import { app, TEST_AUTH_HEADER } from "./setup";

describe.sequential("E2E: GET /me", () => {

  it("returns the authenticated driver's profile", async () => {
    const response = await request(app)
      .get("/me")
      .set(TEST_AUTH_HEADER)
      .expect(200);

    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("email");

    expect(typeof response.body.id).toBe("string");
    expect(typeof response.body.email).toBe("string");

    // name is optional
    if (response.body.name !== undefined) {
      expect(typeof response.body.name).toBe("string");
    }
  });

  it("rejects request without Authorization header", async () => {
    await request(app)
      .get("/me")
      .expect(401);
  });

  it("rejects request with invalid token", async () => {
    await request(app)
      .get("/me")
      .set("Authorization", "Bearer invalid.token.here")
      .expect(401);
  });

});

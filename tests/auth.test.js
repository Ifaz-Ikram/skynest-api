const request = require("supertest");
const { app } = require("../src/app");

describe("Auth", () => {
  it("POST /auth/login returns token for admin", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "admin", password: "admin123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("role", "Admin");
  });

  it("POST /auth/login rejects bad password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "admin", password: "wrong" });

    // accept either 400 or 401 depending on your controller logic
    expect([400, 401]).toContain(res.status);
  });
});

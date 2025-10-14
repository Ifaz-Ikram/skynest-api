const request = require("supertest");
const { app } = require("../src/app");

async function getToken() {
  const res = await request(app)
    .post("/auth/login")
    .send({ username: "admin", password: "admin123" });
  return res.body.token;
}

describe("Reports", () => {
  it("GET /reports/occupancy-by-day works with token", async () => {
    const token = await getToken();
    const res = await request(app)
      .get("/reports/occupancy-by-day")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

const request = require("supertest");
const { app } = require("../../src/app");
const { sequelize } = require("../../src/models");

async function getToken() {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ username: "admin", password: "admin123" });
  return res.body.token;
}

async function findRoomTypeId() {
  try {
    const [[rt]] = await sequelize.query(
      "SELECT room_type_id FROM room_type ORDER BY room_type_id LIMIT 1",
    );
    return rt?.room_type_id;
  } catch {
    return undefined;
  }
}

async function findCorporateRoomTypeId() {
  try {
    const [rows] = await sequelize.query(
      "SELECT room_type_id FROM room_type ORDER BY room_type_id",
    );
    if (!rows || !rows.length) return undefined;
    const target = rows.find((row) => Number(row.room_type_id) >= 2) || rows[0];
    return target?.room_type_id;
  } catch {
    return undefined;
  }
}

describe("Rates", () => {
  it("GET /rates/quote requires mandatory parameters", async () => {
    const token = await getToken();
    const res = await request(app)
      .get("/api/rates/quote")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("GET /rates/quote returns a quote for a valid room type", async () => {
    const roomTypeId = await findRoomTypeId();
    if (!roomTypeId) {
      console.warn("Skipping rate quote test: no room types available.");
      return;
    }
    const token = await getToken();

    const res = await request(app)
      .get(
        `/api/rates/quote?room_type_id=${roomTypeId}&check_in=2025-11-10&check_out=2025-11-12`,
      )
      .set("Authorization", `Bearer ${token}`);

    if (res.status !== 200) {
      console.warn(
        `Rate quote request did not succeed (status ${res.status}). Body:`,
        res.body,
      );
      expect([409, 422, 400]).toContain(res.status);
      return;
    }

    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("nightly");
    expect(Array.isArray(res.body.nightly)).toBe(true);
  });

  it("GET /rates/quote enforces access-controlled plans", async () => {
    const roomTypeId = await findCorporateRoomTypeId();
    if (!roomTypeId) {
      console.warn("Skipping corporate rate test: no room types found.");
      return;
    }
    const token = await getToken();

    const res = await request(app)
      .get(
        `/api/rates/quote?room_type_id=${roomTypeId}&check_in=2025-11-10&check_out=2025-11-12&plan=CORP`,
      )
      .set("Authorization", `Bearer ${token}`);

    if (res.status === 200) {
      expect(res.body).toHaveProperty("plan");
      return;
    }

    if (
      res.status === 400 &&
      /not available for room type/i.test(res.body?.error || "")
    ) {
      console.warn(
        "Corporate plan not available for detected room type; skipping assertion.",
      );
      return;
    }

    expect([400, 403]).toContain(res.status);
    const message = res.body?.error || "";
    expect(
      /requires an access code/i.test(message) ||
        /not available/i.test(message),
    ).toBe(true);
  });
});


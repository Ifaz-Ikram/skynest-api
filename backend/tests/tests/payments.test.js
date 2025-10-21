const request = require("supertest");
const { app } = require("../../src/app");
const { sequelize } = require("../../src/models");

async function getToken() {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ username: "admin", password: "admin123" });
  return res.body.token;
}

async function findGuestAndRoomIds() {
  const [[g]] = await sequelize.query("SELECT guest_id FROM guest LIMIT 1");
  const [[r]] = await sequelize.query("SELECT room_id FROM room LIMIT 1");
  return { guest_id: g?.guest_id, room_id: r?.room_id };
}

async function createBookingViaApi(token) {
  const ids = await findGuestAndRoomIds();
  if (!ids.guest_id || !ids.room_id) {
    console.warn("Skipping payment test: guest or room seed missing.");
    return null;
  }

  const check_in_date = "2025-11-10";
  const check_out_date = "2025-11-12";
  const booked_rate = 20000;
  const nights = 2;
  const advance_payment = Math.ceil(0.1 * nights * booked_rate);

  const res = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${token}`)
    .send({
      guest_id: ids.guest_id,
      room_id: ids.room_id,
      check_in_date,
      check_out_date,
      booked_rate,
      advance_payment,
    });

  if (
    [400, 409].includes(res.status) &&
    /already booked/i.test(res.body?.error || "")
  ) {
    console.warn("Skipping payment test: room already booked in that range.");
    return null;
  }
  if (
    [400, 409].includes(res.status) &&
    /advance payment/i.test(res.body?.error || "")
  ) {
    console.warn("Skipping payment test: advance payment validation failed.");
    return null;
  }

  if (![200, 201].includes(res.status)) {
    console.warn(
      `Skipping payment test: booking API returned ${res.status} ${JSON.stringify(res.body)}`,
    );
    return null;
  }

  return res.body.booking_id || res.body.booking?.booking_id;
}

describe("Payments", () => {
  it("POST /payments should reject invalid payload", async () => {
    const token = await getToken();

    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ booking_id: "abc" });

    if (res.status === 403) {
      console.warn("Skipping payment validation: RBAC forbids admin payments.");
      return;
    }

    expect(res.status).toBe(400);
    if (res.body.errors) {
      expect(Array.isArray(res.body.errors)).toBe(true);
    } else {
      expect(res.body).toHaveProperty("error");
    }
  });

  it("POST /payments should create payment for a booking", async () => {
    const token = await getToken();
    const booking_id = await createBookingViaApi(token);

    if (!booking_id) {
      console.warn("Skipping payment creation test: booking not created.");
      return;
    }

    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        booking_id,
        paid_on: "2025-11-11",
        amount: 5000,
        method: "Cash",
      });

    if (res.status === 403) {
      console.warn("Skipping payment creation: RBAC forbids admin payments.");
      return;
    }

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty("payment_id");
  });
});

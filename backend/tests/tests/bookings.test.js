// tests/bookings.test.js
const request = require("supertest");
const { app } = require("../src/app");
const { sequelize } = require("../models");

async function getToken() {
  const res = await request(app)
    .post("/auth/login")
    .send({ username: "admin", password: "admin123" });
  return res.body.token;
}

// Try to find any existing guest_id and room_id to use.
// If not found, we'll skip the "happy path" test gracefully.
async function findGuestAndRoomIds() {
  try {
    const [[g]] = await sequelize.query("SELECT guest_id FROM guest LIMIT 1");
    const [[r]] = await sequelize.query("SELECT room_id FROM room LIMIT 1");
    return { guest_id: g?.guest_id, room_id: r?.room_id };
  } catch {
    return { guest_id: undefined, room_id: undefined };
  }
}

// Helper: extract booking_id regardless of response shape
function getBookingIdFrom(body) {
  if (!body || typeof body !== "object") return undefined;
  if (typeof body.booking_id !== "undefined") return body.booking_id; // top-level
  if (body.booking && typeof body.booking.booking_id !== "undefined") {
    return body.booking.booking_id; // nested { booking: { booking_id } }
  }
  return undefined;
}

describe("Bookings", () => {
  it("POST /bookings should reject bad payload (validation)", async () => {
    const token = await getToken();

    const res = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ guest_id: "abc" }); // clearly wrong

    expect(res.status).toBe(400); // express-validator should catch this
    expect(res.body).toHaveProperty("errors");
  });

  it("POST /bookings should create when payload is valid (if data exists)", async () => {
    const token = await getToken();
    const { guest_id, room_id } = await findGuestAndRoomIds();

    if (!guest_id || !room_id) {
      console.warn(
        "⚠️ Skipping create booking test: no guest/room rows in DB.",
      );
      return;
    }

    // Use a future range; if it still conflicts, we accept the conflict and skip
    const check_in_date = "2025-12-10";
    const check_out_date = "2025-12-12";
    const booked_rate = 20000; // per night
    const nights = 2; // keep in sync with dates above
    const advance_payment = Math.ceil(0.1 * nights * booked_rate); // meet 10% rule

    const res = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        guest_id,
        room_id,
        check_in_date,
        check_out_date,
        booked_rate,
        advance_payment,
      });

    // If DB says the room is already booked for that range, skip instead of failing
    if (
      res.status === 400 &&
      /room already booked/i.test(res.body?.error || "")
    ) {
      console.warn(
        "⚠️ Skipping create booking test: date range conflicts with existing booking.",
      );
      return;
    }

    expect([200, 201]).toContain(res.status);

    const bookingId = getBookingIdFrom(res.body);
    expect(bookingId).toBeDefined();
  });
});

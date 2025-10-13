import API from '../api.js';

const BookingsView = {
  async render() {
    return /* html */`
      <section class="card">
        <h2>Create Booking</h2>
        <div class="muted">Provide guest/room and date range. Ensure no conflicts.</div>
        <form id="bkForm" class="grid cols-3" style="margin-top:8px">
          <div><label>Guest ID</label><input name="guest_id" type="number" min="1" required /></div>
          <div><label>Room ID</label><input name="room_id" type="number" min="1" required /></div>
          <div><label>Status</label>
            <select name="status">
              <option>Booked</option>
              <option>Checked-In</option>
              <option>Checked-Out</option>
              <option>Cancelled</option>
            </select>
          </div>
          <div><label>Check-in Date</label><input name="check_in_date" type="date" required /></div>
          <div><label>Check-out Date</label><input name="check_out_date" type="date" required /></div>
          <div><label>Booked Rate (per night)</label><input name="booked_rate" type="number" min="0" step="0.01" required /></div>
          <div><label>Advance Payment</label><input name="advance_payment" type="number" min="0" step="0.01" /></div>
          <div><label>Tax %</label><input name="tax_rate_percent" type="number" min="0" step="0.01" value="0" /></div>
          <div style="align-self:end"><button class="primary" type="submit">Create</button></div>
        </form>
        <div id="bkResult" style="margin-top:12px"></div>
      </section>

      <section class="card" style="margin-top:16px">
        <h3>Update Status</h3>
        <form id="statusForm" class="row">
          <div><label>Booking ID</label><input name="id" type="number" min="1" required /></div>
          <div>
            <label>Status</label>
            <select name="status">
              <option>Booked</option>
              <option>Checked-In</option>
              <option>Checked-Out</option>
              <option>Cancelled</option>
            </select>
          </div>
          <div style="align-self:end"><button class="warn" type="submit">Update</button></div>
        </form>
        <div id="statusResult" style="margin-top:12px"></div>
      </section>
    `;
  },
  async afterRender() {
    const result = document.getElementById('bkResult');
    document.getElementById('bkForm').addEventListener('submit', async (e) => {
      e.preventDefault(); result.textContent = '';
      const fd = new FormData(e.currentTarget);
      const payload = Object.fromEntries(fd.entries());
      try {
        for (const k of ['guest_id','room_id','booked_rate','advance_payment','tax_rate_percent']) if (payload[k] === '') delete payload[k];
        const res = await API.Bookings.create(payload);
        result.innerHTML = `<div class="alert success">Created booking #${res.booking?.booking_id || res.booking_id}</div>`;
      } catch (err) {
        result.innerHTML = `<div class="alert error">${err.message}</div>`;
      }
    });

    const statusRes = document.getElementById('statusResult');
    document.getElementById('statusForm').addEventListener('submit', async (e) => {
      e.preventDefault(); statusRes.textContent = '';
      const fd = new FormData(e.currentTarget);
      try {
        await API.Bookings.updateStatus(fd.get('id'), fd.get('status'));
        statusRes.innerHTML = `<div class="alert success">Status updated</div>`;
      } catch (err) {
        statusRes.innerHTML = `<div class="alert error">${err.message}</div>`;
      }
    });
  }
};

export default BookingsView;


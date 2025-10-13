import API from '../api.js';
import { toast } from '../ui.js';

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

      <section class="card" style="margin-top:16px">
        <h3>Find Bookings</h3>
        <form id="searchForm" class="grid cols-4">
          <div><label>From</label><input name="from" type="date" /></div>
          <div><label>To</label><input name="to" type="date" /></div>
          <div><label>Room ID</label><input name="room_id" type="number" min="1" /></div>
          <div><label>Guest ID</label><input name="guest_id" type="number" min="1" /></div>
          <div><label>Status</label>
            <select name="status"><option value="">Any</option><option>Booked</option><option>Checked-In</option><option>Checked-Out</option><option>Cancelled</option></select>
          </div>
          <div><label>Page</label><input name="page" type="number" min="1" value="1" /></div>
          <div><label>Limit</label><input name="limit" type="number" min="1" max="100" value="20" /></div>
          <div style="align-self:end"><button type="submit">Search</button></div>
        </form>
        <div id="searchResult" style="margin-top:12px"></div>
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
        toast('Booking created','success');
      } catch (err) {
        result.innerHTML = `<div class="alert error">${err.message}</div>`;
        toast(err.message || 'Create booking failed','error');
      }
    });

    const statusRes = document.getElementById('statusResult');
    document.getElementById('statusForm').addEventListener('submit', async (e) => {
      e.preventDefault(); statusRes.textContent = '';
      const fd = new FormData(e.currentTarget);
      try {
        await API.Bookings.updateStatus(fd.get('id'), fd.get('status'));
        statusRes.innerHTML = `<div class="alert success">Status updated</div>`;
        toast('Booking status updated','success');
      } catch (err) {
        statusRes.innerHTML = `<div class="alert error">${err.message}</div>`;
        toast(err.message || 'Update failed','error');
      }
    });

    // search/list
    const out = document.getElementById('searchResult');
    document.getElementById('searchForm').addEventListener('submit', async (e) => {
      e.preventDefault(); out.textContent = 'Loading…';
      const fd = new FormData(e.currentTarget);
      const q = Object.fromEntries(Array.from(fd.entries()).filter(([,v]) => v !== ''));
      try {
        const r = await API.Bookings.search(q);
        const rows = (r.bookings||[]).map(b => `<tr>
          <td>${b.booking_id}</td>
          <td>${b.guest_id}</td>
          <td>${b.room_id}</td>
          <td>${b.check_in_pretty || b.check_in_date}</td>
          <td>${b.check_out_pretty || b.check_out_date}</td>
          <td>${b.status}</td>
        </tr>`).join('');
        out.innerHTML = `
          <div class="row" style="justify-content:space-between">
            <div class="pill">Total: ${r.total}</div>
            <div class="pill">Page ${r.page} • Limit ${r.limit}</div>
          </div>
          <div style="overflow:auto">
          <table class="table"><thead><tr><th>ID</th><th>Guest</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
          </div>
        `;
      } catch (err) {
        out.innerHTML = `<div class="alert error">${err.message}</div>`;
      }
    });
  }
};

export default BookingsView;

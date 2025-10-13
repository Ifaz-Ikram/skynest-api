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

      <section class="card" style="margin-top:16px">
        <h3>Free Rooms</h3>
        <form id="freeForm" class="row">
          <div><label>From</label><input name="from" type="date" required /></div>
          <div><label>To</label><input name="to" type="date" required /></div>
          <div style="align-self:end"><button type="submit">Find</button></div>
        </form>
        <div id="freeResult" style="margin-top:12px"></div>
      </section>

      <div id="drawer" class="backdrop"><div class="drawer"><div class="hd"><h3>Booking</h3><button id="drawerClose">Close</button></div><div id="drawerBody"></div></div></div>
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
    async function runSearch(formEl){
      out.textContent = 'Loading…';
      const fd = new FormData(formEl);
      const q = Object.fromEntries(Array.from(fd.entries()).filter(([,v]) => v !== ''));
      const r = await API.Bookings.search(q);
      const rows = (r.bookings||[]).map(b => `<tr>
        <td>${b.booking_id}</td>
        <td>${b.guest_id}</td>
        <td>${b.room_id}</td>
        <td>${b.check_in_pretty || b.check_in_date}</td>
        <td>${b.check_out_pretty || b.check_out_date}</td>
        <td>${b.status}</td>
        <td><button class="pill" data-view="${b.booking_id}">View</button></td>
      </tr>`).join('');
      out.innerHTML = `
        <div class="row" style="justify-content:space-between;align-items:center">
          <div class="pill">Total: ${r.total}</div>
          <div class="row" style="gap:6px;align-items:center">
            <button id="prevPage">Prev</button>
            <div class="pill">Page ${r.page} / ${Math.max(1, Math.ceil((r.total||0)/(r.limit||1)) )}</div>
            <button id="nextPage">Next</button>
          </div>
        </div>
        <div style="overflow:auto">
        <table class="table"><thead><tr><th>ID</th><th>Guest</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table>
        </div>
      `;
      // wire page buttons
      const sf = document.getElementById('searchForm');
      document.getElementById('prevPage').onclick = () => { const p = Number(sf.page.value||1); if (p>1){ sf.page.value = String(p-1); runSearch(sf); } };
      document.getElementById('nextPage').onclick = () => { const p = Number(sf.page.value||1); sf.page.value = String(p+1); runSearch(sf); };
      for (const btn of out.querySelectorAll('button[data-view]')) btn.onclick = () => openDrawer(btn.dataset.view);
    }
    document.getElementById('searchForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await runSearch(e.currentTarget); } catch (err) { out.innerHTML = `<div class="alert error">${err.message}</div>`; }
    });

    async function openDrawer(id){
      const bd = document.getElementById('drawerBody');
      const el = document.getElementById('drawer');
      el.classList.add('open');
      bd.innerHTML = '<div class="muted">Loading…</div>';
      try {
        const r = await API.Bookings.byId(id);
        const b = r.booking;
        bd.innerHTML = `
          <div class="grid">
            <div><span class="muted">Booking</span><div class="value">#${b.booking_id}</div></div>
            <div><span class="muted">Guest</span><div class="value">${b.guest_id}</div></div>
            <div><span class="muted">Room</span><div class="value">${b.room_id}</div></div>
            <div><span class="muted">Check-in</span><div>${b.check_in_pretty || b.check_in_date}</div></div>
            <div><span class="muted">Check-out</span><div>${b.check_out_pretty || b.check_out_date}</div></div>
            <div><span class="muted">Status</span><div class="pill">${b.status}</div></div>
          </div>
        `;
      } catch(e){ bd.innerHTML = `<div class="alert error">${e.message}</div>`; }
      document.getElementById('drawerClose').onclick = () => el.classList.remove('open');
      el.onclick = (ev) => { if (ev.target === el) el.classList.remove('open'); };
    }

    // free rooms
    const freeOut = document.getElementById('freeResult');
    document.getElementById('freeForm').addEventListener('submit', async (e) => {
      e.preventDefault(); freeOut.textContent = 'Loading…';
      const fd = new FormData(e.currentTarget);
      try {
        const r = await API.Bookings.freeRooms(Object.fromEntries(fd.entries()));
        const rows = (r.free_rooms||[]).map(x => `<tr><td>${x.room_id}</td><td>${x.room_number}</td><td>${x.type_name || x.room_type_id}</td><td>${x.capacity || ''}</td><td>${x.daily_rate || ''}</td></tr>`).join('');
        freeOut.innerHTML = `<div class="pill">${(r.free_rooms||[]).length} rooms free</div><div style="overflow:auto"><table class="table"><thead><tr><th>ID</th><th>Number</th><th>Type</th><th>Cap</th><th>Rate</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      } catch(err){ freeOut.innerHTML = `<div class="alert error">${err.message}</div>`; }
    });
  }
};

export default BookingsView;

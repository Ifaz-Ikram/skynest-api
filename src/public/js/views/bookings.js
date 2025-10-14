import API from '../api.js';
import { toast } from '../ui.js';

const BookingsView = {
  async render() {
    return /* html */`
      <section class="card">
        <h2>Create Booking</h2>
        <div class="muted">Provide guest/room and date range. Ensure no conflicts.</div>
        <form id="bkForm" class="grid cols-3" style="margin-top:8px">
          <div><label>Guest ID</label><input name="guest_id" type="number" min="1" required /><span class="hint error">Required, must be ≥ 1</span></div>
          <div><label>Room ID</label><input name="room_id" type="number" min="1" required /><span class="hint error">Required, must be ≥ 1</span></div>
          <div><label>Status</label>
            <select name="status">
              <option>Booked</option>
              <option>Checked-In</option>
              <option>Checked-Out</option>
              <option>Cancelled</option>
            </select>
          </div>
          <div><label>Check-in Date</label><input name="check_in_date" type="date" required /><span class="hint error">Required</span></div>
          <div><label>Check-out Date</label><input name="check_out_date" type="date" required /><span class="hint error">Must be after check-in</span></div>
          <div><label>Booked Rate (per night)</label><input name="booked_rate" type="number" min="0.01" step="0.01" required /><span class="hint error">Required, must be > 0</span></div>
          <div><label>Advance Payment</label><input name="advance_payment" type="number" min="0" step="0.01" /><span class="hint">Optional</span></div>
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
          <input type="hidden" name="sort" value="check_in_date" />
          <input type="hidden" name="dir" value="DESC" />
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
      const totalPages = Math.max(1, Math.ceil((r.total||0)/(r.limit||1)) );
      const sort = String(q.sort||'');
      const dir = String(q.dir||'DESC').toUpperCase();
      const icon = (key)=> sort===key ? (dir==='ASC'?'▲':'▼') : '';
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
            <button id="firstPage">First</button>
            <button id="prevPage">Prev</button>
            <div class="row" style="align-items:center;gap:6px">
              <label class="muted">Go to</label>
              <input id="gotoPage" type="number" min="1" max="${totalPages}" value="${r.page}" style="width:80px" />
              <span class="pill">/ ${totalPages}</span>
            </div>
            <button id="nextPage">Next</button>
            <button id="lastPage">Last</button>
          </div>
        </div>
        <div style="overflow:auto">
        <table class="table"><thead><tr>
          <th class="sortable" data-sort="booking_id">ID <span class="indicator">${icon('booking_id')}</span></th>
          <th class="sortable" data-sort="guest_id">Guest <span class="indicator">${icon('guest_id')}</span></th>
          <th class="sortable" data-sort="room_id">Room <span class="indicator">${icon('room_id')}</span></th>
          <th class="sortable" data-sort="check_in_date">Check-in <span class="indicator">${icon('check_in_date')}</span></th>
          <th class="sortable" data-sort="check_out_date">Check-out <span class="indicator">${icon('check_out_date')}</span></th>
          <th class="sortable" data-sort="status">Status <span class="indicator">${icon('status')}</span></th>
          <th></th></tr></thead><tbody>${rows}</tbody></table>
        </div>
      `;
      // wire page + sort
      const sf = document.getElementById('searchForm');
      const setPage = (p)=>{ p=Math.max(1, Math.min(totalPages, Number(p)||1)); sf.page.value = String(p); runSearch(sf); };
      document.getElementById('firstPage').onclick = () => setPage(1);
      document.getElementById('prevPage').onclick = () => setPage(Number(sf.page.value||1)-1);
      document.getElementById('nextPage').onclick = () => setPage(Number(sf.page.value||1)+1);
      document.getElementById('lastPage').onclick = () => setPage(totalPages);
      const gp = document.getElementById('gotoPage'); gp.addEventListener('change', ()=> setPage(gp.value)); gp.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); setPage(gp.value) } });
      for (const th of out.querySelectorAll('th.sortable')){
        th.addEventListener('click', ()=>{
          const key = th.dataset.sort;
          const curSort = sf.sort?.value || '';
          const curDir = (sf.dir?.value || 'DESC').toUpperCase();
          const nextDir = (curSort===key && curDir==='ASC') ? 'DESC' : 'ASC';
          if (!sf.sort){ const i=document.createElement('input'); i.type='hidden'; i.name='sort'; i.value='check_in_date'; sf.appendChild(i); }
          if (!sf.dir){ const i=document.createElement('input'); i.type='hidden'; i.name='dir'; i.value='DESC'; sf.appendChild(i); }
          sf.sort.value = key; sf.dir.value = nextDir; setPage(1);
        });
      }
      for (const btn of out.querySelectorAll('button[data-view]')) btn.onclick = () => openDrawer(btn.dataset.view);
    }
    document.getElementById('searchForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.currentTarget;
      if (!f.sort){ const i=document.createElement('input'); i.type='hidden'; i.name='sort'; i.value='check_in_date'; f.appendChild(i); }
      if (!f.dir){ const i=document.createElement('input'); i.type='hidden'; i.name='dir'; i.value='DESC'; f.appendChild(i); }
      try { await runSearch(f); } catch (err) { out.innerHTML = `<div class="alert error">${err.message}</div>`; }
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

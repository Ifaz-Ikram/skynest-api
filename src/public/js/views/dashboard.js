import API from '../api.js';

const DashboardView = {
  async render() {
    const user = API.getUser();
    return /* html */`
      <div class="grid cols-3">
        <section class="card stat"><span class="muted">Signed in as</span><div class="value">${user?.username || ''}</div><span class="pill">${user?.role || 'User'}</span></section>
        <section class="card stat" id="occStat"><span class="muted">Occupancy days in view</span><div class="value">—</div></section>
        <section class="card stat" id="revStat"><span class="muted">Billing rows</span><div class="value">—</div></section>
      </div>
      <div class="grid cols-2" style="margin-top:16px">
        <section class="card">
          <h3>Recent Occupancy</h3>
          <div class="muted" id="occList">Loading…</div>
        </section>
        <section class="card">
          <h3>Billing Summary</h3>
          <div class="muted" id="billList">Loading…</div>
        </section>
      </div>
    `;
  },
  async afterRender() {
    try {
      const occ = await API.Reports.occupancyByDay();
      const bill = await API.Reports.billingSummary();
      document.querySelector('#occStat .value').textContent = occ.length;
      document.querySelector('#revStat .value').textContent = bill.length;
      document.getElementById('occList').innerHTML = `<div class="muted">Last ${occ.length} days available.</div>`;
      document.getElementById('billList').innerHTML = `<div class="muted">${bill.length} billing rows in summary.</div>`;
    } catch (e) {
      document.getElementById('occList').innerHTML = `<div class="alert error">${e.message}</div>`;
      document.getElementById('billList').innerHTML = `<div class="alert error">${e.message}</div>`;
    }
  }
};

export default DashboardView;


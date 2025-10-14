import API from '../api.js';

function table(cols, rows) {
  const head = `<tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>`;
  const body = rows.map(r => `<tr>${cols.map(c => `<td>${r[c] ?? ''}</td>`).join('')}</tr>`).join('');
  return `<div style="overflow:auto"><table class="table"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
}

const ReportsView = {
  async render() {
    return /* html */`
      <div class="grid cols-2">
        <section class="card">
          <h3>Occupancy (Daily)</h3>
          <div id="occ">Loading…</div>
        </section>
        <section class="card">
          <h3>Billing Summary</h3>
          <div id="bill">Loading…</div>
        </section>
        <section class="card">
          <h3>Service Usage Detail</h3>
          <form id="sudForm" class="toolbar">
            <div><label>Booking ID</label><input name="booking_id" type="number" min="1" /></div>
            <div><label>From</label><input name="from" type="date" /></div>
            <div><label>To</label><input name="to" type="date" /></div>
            <div style="align-self:end"><button>Filter</button></div>
          </form>
          <div id="sud">Loading…</div>
        </section>
        <section class="card">
          <h3>Monthly Revenue (Branch)</h3>
          <div id="rev">Loading…</div>
        </section>
        <section class="card">
          <h3>Monthly Trend (Services)</h3>
          <div id="svct">Loading…</div>
        </section>
      </div>
    `;
  },
  async afterRender() {
    const safeCols = (arr) => Array.from(new Set(arr.flatMap(o => Object.keys(o || {})))).slice(0, 8);
    try {
      const occ = await API.Reports.occupancyByDay();
      const occCols = safeCols(occ);
      document.getElementById('occ').innerHTML = occ.length ? table(occCols, occ.slice(0, 50)) : '<div class="muted">No data</div>';
    } catch (e) { document.getElementById('occ').innerHTML = `<div class="alert error">${e.message}</div>`; }

    try {
      const bill = await API.Reports.billingSummary();
      const cols = safeCols(bill);
      document.getElementById('bill').innerHTML = bill.length ? table(cols, bill.slice(0, 50)) : '<div class="muted">No data</div>';
    } catch (e) { document.getElementById('bill').innerHTML = `<div class="alert error">${e.message}</div>`; }

    async function loadSUD(q = {}) {
      try {
        const sud = await API.Reports.serviceUsageDetail(q);
        const cols = safeCols(sud);
        document.getElementById('sud').innerHTML = sud.length ? table(cols, sud.slice(0, 50)) : '<div class="muted">No data</div>';
      } catch (e) { document.getElementById('sud').innerHTML = `<div class="alert error">${e.message}</div>`; }
    }
    loadSUD();
    document.getElementById('sudForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const q = Object.fromEntries(Array.from(fd.entries()).filter(([,v]) => v));
      loadSUD(q);
    });

    try {
      const rev = await API.Reports.branchRevenueMonthly();
      const cols = safeCols(rev);
      document.getElementById('rev').innerHTML = rev.length ? table(cols, rev.slice(0, 50)) : '<div class="muted">No data</div>';
    } catch (e) { document.getElementById('rev').innerHTML = `<div class="alert error">${e.message}</div>`; }

    try {
      const trend = await API.Reports.serviceMonthlyTrend();
      const cols = safeCols(trend);
      document.getElementById('svct').innerHTML = trend.length ? table(cols, trend.slice(0, 50)) : '<div class="muted">No data</div>';
    } catch (e) { document.getElementById('svct').innerHTML = `<div class="alert error">${e.message}</div>`; }
  }
};

export default ReportsView;


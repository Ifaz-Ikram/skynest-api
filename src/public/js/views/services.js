import API from '../api.js';
import { toast, fmt } from '../ui.js';

const ServicesView = {
  async render() {
    const catalog = await API.Services.catalog().catch(() => ({ services: [] }));
    const options = (catalog.services || [])
      .map((s) => `<option value="${s.service_id}">${s.name} — ${s.unit_price}</option>`) 
      .join('');
    return /* html */`
      <section class="card">
        <h2>Service Usage</h2>
        <div class="toolbar">
          <div>
            <label>Booking ID</label>
            <input id="suBookingId" type="number" min="1" placeholder="e.g. 1" />
          </div>
          <div style="align-self:end"><button id="loadUsage">Load Usage</button></div>
        </div>
        <div id="usagePanel" style="margin-top:12px"></div>
      </section>

      <section class="card" style="margin-top:16px">
        <h3>Add Usage</h3>
        <form id="usageForm" class="grid cols-4">
          <div><label>Booking ID</label><input name="booking_id" type="number" min="1" required /></div>
          <div><label>Service</label><select name="service_id">${options}</select></div>
          <div><label>Quantity</label><input name="quantity" type="number" min="1" value="1" required /></div>
          <div><label>Unit Price (optional)</label><input name="unit_price" type="number" min="0" step="0.01" /></div>
          <div><label>Used On (optional)</label><input name="used_on" type="date" /></div>
          <div style="align-self:end"><button class="primary" type="submit">Add</button></div>
        </form>
        <div id="usageResult" style="margin-top:12px"></div>
      </section>
    `;
  },
  async afterRender() {
    const panel = document.getElementById('usagePanel');
    async function refresh(id) {
      if (!id) { panel.innerHTML = '<div class="muted">Enter a booking id and click Load.</div>'; return; }
      try {
        const data = await API.Services.listUsage(id);
        const rows = (data.usages || []).map(u => `<tr>
          <td>${u.usage_id}</td>
          <td>${u.service_name || u.service_id}</td>
          <td>${u.used_on_pretty || fmt.date(u.used_on) || ''}</td>
          <td>${u.quantity}</td>
          <td>${fmt.money(u.unit_price)}</td>
          <td>${u.line_total ? fmt.money(u.line_total) : ''}</td>
          <td><button data-del="${u.usage_id}" class="danger">Delete</button></td>
        </tr>`).join('');
        panel.innerHTML = `
          <div class="row" style="justify-content:space-between">
            <div class="pill">Booking #${data.booking_id}</div>
            <div class="pill">Services Total: ${data.services_total}</div>
          </div>
          <div style="overflow:auto">
          <table class="table">
            <thead><tr><th>ID</th><th>Service</th><th>Used On</th><th>Qty</th><th>Unit</th><th>Total</th><th></th></tr></thead>
            <tbody>${rows || ''}</tbody>
          </table>
          </div>
        `;
        for (const btn of panel.querySelectorAll('button[data-del]')) {
          btn.addEventListener('click', async () => {
            try { await API.Services.deleteUsage(btn.dataset.del); toast('Service usage deleted','success'); await refresh(id); }
            catch(e){ toast(e.message || 'Delete failed','error'); }
          });
        }
      } catch (e) {
        panel.innerHTML = `<div class="alert error">${e.message}</div>`;
      }
    }

    document.getElementById('loadUsage').addEventListener('click', () => refresh(Number(document.getElementById('suBookingId').value)));
    document.getElementById('usageForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const payload = Object.fromEntries(fd.entries());
      if (payload.unit_price === '') delete payload.unit_price;
      if (payload.used_on === '') delete payload.used_on;
      const out = document.getElementById('usageResult');
      try {
        const r = await API.Services.addUsage(payload);
        out.innerHTML = `<div class="alert success">Added usage #${r.usage.usage_id}</div>`;
        toast('Service usage added','success');
        await refresh(Number(payload.booking_id));
      } catch (err) {
        out.innerHTML = `<div class="alert error">${err.message}</div>`;
        toast(err.message || 'Failed to add usage','error');
      }
    });
  }
};

export default ServicesView;

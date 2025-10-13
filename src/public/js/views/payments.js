import API from '../api.js';

const PaymentsView = {
  async render() {
    return /* html */`
      <section class="card">
        <h2>Record Payment</h2>
        <form id="payForm" class="grid cols-4">
          <div><label>Booking ID</label><input name="booking_id" type="number" min="1" required /></div>
          <div><label>Amount</label><input name="amount" type="number" min="0" step="0.01" required /></div>
          <div><label>Method</label>
            <select name="method">
              <option>Cash</option>
              <option>Card</option>
              <option>Online</option>
            </select>
          </div>
          <div><label>Paid At (optional)</label><input name="paid_at" type="datetime-local" /></div>
          <div><label>Reference (optional)</label><input name="payment_reference" /></div>
          <div style="align-self:end"><button class="primary" type="submit">Create Payment</button></div>
        </form>
        <div id="payResult" style="margin-top:12px"></div>
      </section>

      <section class="card" style="margin-top:16px">
        <h3>Adjustment (±)</h3>
        <form id="adjForm" class="grid cols-4">
          <div><label>Booking ID</label><input name="booking_id" type="number" min="1" required /></div>
          <div><label>Amount (negative for refund)</label><input name="amount" type="number" step="0.01" required /></div>
          <div><label>Reason (optional)</label><input name="reason" /></div>
          <div style="align-self:end"><button class="warn" type="submit">Add Adjustment</button></div>
        </form>
        <div id="adjResult" style="margin-top:12px"></div>
      </section>
    `;
  },
  async afterRender() {
    document.getElementById('payForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const payload = Object.fromEntries(fd.entries());
      if (!payload.paid_at) delete payload.paid_at;
      if (!payload.payment_reference) delete payload.payment_reference;
      const out = document.getElementById('payResult');
      try {
        const r = await API.Payments.create(payload);
        out.innerHTML = `<div class="alert success">Payment #${r.payment_id || r.payment?.payment_id || ''} recorded</div>`;
      } catch (err) {
        out.innerHTML = `<div class="alert error">${err.message}</div>`;
      }
    });

    document.getElementById('adjForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const payload = Object.fromEntries(fd.entries());
      const out = document.getElementById('adjResult');
      try {
        const r = await API.Payments.adjust(payload);
        out.innerHTML = `<div class="alert success">Adjustment #${r.adjustment?.adjustment_id || ''} saved (net=${r.totals?.net_total ?? ''})</div>`;
      } catch (err) {
        out.innerHTML = `<div class="alert error">${err.message}</div>`;
      }
    });
  }
};

export default PaymentsView;


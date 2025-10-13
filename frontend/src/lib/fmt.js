export const fmt = {
  date(d) {
    try { return new Date(d).toLocaleDateString('en-GB'); } catch { return d }
  },
  dt(d) {
    try { return new Date(d).toLocaleString('en-GB', { dateStyle:'medium', timeStyle:'short' }); } catch { return d }
  },
  money(n) {
    const x = Number(n);
    return Number.isFinite(x) ? x.toLocaleString('en-LK', { style:'currency', currency:'LKR' }) : n;
  },
};


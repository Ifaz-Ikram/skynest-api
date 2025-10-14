const API = (() => {
  const state = {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    base: '' // same-origin
  };

  function setAuth(token, user) {
    state.token = token;
    state.user = user || null;
    if (token) localStorage.setItem('token', token); else localStorage.removeItem('token');
    if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user');
  }

  function isAuthed() { return !!state.token; }
  function getUser() { return state.user; }
  function logout() { setAuth(null, null); }

  async function request(path, opts = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
    const res = await fetch(state.base + path, { ...opts, headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) {
      const msg = (data && (data.error || data.message)) || res.statusText;
      const err = new Error(msg);
      err.status = res.status; err.body = data; throw err;
    }
    return data;
  }

  // Auth
  async function login(username, password) {
    const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    setAuth(data.token, data.user);
    return data;
  }

  // Bookings
  const Bookings = {
    create: (payload) => request('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
    updateStatus: (id, status) => request(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    search: (q={}) => {
      const qs = new URLSearchParams(Object.fromEntries(Object.entries(q).filter(([,v]) => v!==undefined && v!==''))).toString();
      return request('/bookings' + (qs?`?${qs}`:''));
    },
    byId: (id) => request(`/bookings/${id}`),
    freeRooms: (q) => request(`/bookings/rooms/free?${new URLSearchParams(q).toString()}`),
    roomAvailability: (roomId,q) => request(`/bookings/rooms/${roomId}/availability?${new URLSearchParams(q).toString()}`),
  };

  // Services
  const Services = {
    catalog: () => request('/services'),
    addUsage: (payload) => request('/services/usage', { method: 'POST', body: JSON.stringify(payload) }),
    listUsage: (bookingId) => request(`/services/usage/${bookingId}`),
    deleteUsage: (usageId) => request(`/services/usage/${usageId}`, { method: 'DELETE' }),
  };

  // Payments
  const Payments = {
    create: (payload) => request('/payments', { method: 'POST', body: JSON.stringify(payload) }),
    adjust: (payload) => request('/payments/adjustment', { method: 'POST', body: JSON.stringify(payload) }),
  };

  // Reports
  const Reports = {
    occupancyByDay: () => request('/reports/occupancy-by-day'),
    billingSummary: () => request('/reports/billing-summary'),
    serviceUsageDetail: (query = {}) => {
      const qs = new URLSearchParams(query).toString();
      return request('/reports/service-usage-detail' + (qs ? `?${qs}` : ''));
    },
    branchRevenueMonthly: () => request('/reports/branch-revenue-monthly'),
    serviceMonthlyTrend: () => request('/reports/service-monthly-trend'),
  };

  return { state, setAuth, isAuthed, getUser, logout, request, login, Bookings, Services, Payments, Reports };
})();

export default API;

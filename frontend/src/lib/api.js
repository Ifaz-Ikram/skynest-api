export const API = (() => {
  let token = localStorage.getItem('token') || null;
  function setToken(t){ token = t; if(t) localStorage.setItem('token', t); else localStorage.removeItem('token'); }
  function authHeaders(){ return token ? { Authorization: `Bearer ${token}` } : {} }
  async function request(path, opts={}){
    const headers = { 'Content-Type':'application/json', ...(opts.headers||{}), ...authHeaders() };
    const res = await fetch(path, { ...opts, headers });
    const ct = res.headers.get('content-type')||'';
    const data = ct.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) { const err = new Error(data?.error || res.statusText); err.status = res.status; err.body = data; throw err; }
    return data;
  }
  const Auth = {
    async login(username, password){
      const data = await request('/auth/login', { method:'POST', body: JSON.stringify({ username, password }) });
      setToken(data.token); localStorage.setItem('user', JSON.stringify(data.user||null));
      return data;
    },
    logout(){ setToken(null); localStorage.removeItem('user'); }
  };
  const Bookings = {
    search:(q={})=>{ const qs=new URLSearchParams(Object.fromEntries(Object.entries(q).filter(([,v])=>v!==''&&v!==undefined))).toString(); return request('/bookings'+(qs?`?${qs}`:'')); },
    create:(p)=>request('/bookings',{method:'POST',body:JSON.stringify(p)}),
    updateStatus:(id,status)=>request(`/bookings/${id}/status`,{method:'PATCH',body:JSON.stringify({status})}),
    byId:(id)=>request(`/bookings/${id}`),
    freeRooms:(q)=>request(`/bookings/rooms/free?${new URLSearchParams(q).toString()}`),
    roomAvailability:(roomId,q)=>request(`/bookings/rooms/${roomId}/availability?${new URLSearchParams(q).toString()}`),
  };
  const Services = {
    catalog:()=>request('/services'),
    addUsage:(p)=>request('/services/usage',{method:'POST',body:JSON.stringify(p)}),
    listUsage:(bookingId)=>request(`/services/usage/${bookingId}`),
    deleteUsage:(usageId)=>request(`/services/usage/${usageId}`,{method:'DELETE'}),
  };
  const Payments = {
    create:(p)=>request('/payments',{method:'POST',body:JSON.stringify(p)}),
    adjust:(p)=>request('/payments/adjustment',{method:'POST',body:JSON.stringify(p)}),
    listForBooking:(bookingId)=>request(`/payments/${bookingId}`),
  };
  const Reports = {
    occupancyByDay:()=>request('/reports/occupancy-by-day'),
    billingSummary:()=>request('/reports/billing-summary'),
    serviceUsageDetail:(q={})=>{const qs=new URLSearchParams(q).toString(); return request('/reports/service-usage-detail'+(qs?`?${qs}`:''));},
    branchRevenueMonthly:()=>request('/reports/branch-revenue-monthly'),
    serviceMonthlyTrend:()=>request('/reports/service-monthly-trend'),
    paymentsLedger:(days=30)=>request('/reports/payments-ledger?'+new URLSearchParams({days})),
    adjustments:(days=30)=>request('/reports/adjustments?'+new URLSearchParams({days})),
  };
  const Admin = {
    listUsers:()=>request('/admin/users'),
    createUser:(p)=>request('/admin/users',{method:'POST',body:JSON.stringify(p)}),
    updateUserRole:(id,role)=>request(`/admin/users/${id}/role`,{method:'PATCH',body:JSON.stringify({role})}),
    updateUserPassword:(id,password)=>request(`/admin/users/${id}/password`,{method:'PATCH',body:JSON.stringify({password})}),
    deleteUser:(id)=>request(`/admin/users/${id}`,{method:'DELETE'}),
    createService:(p)=>request('/admin/service-catalog',{method:'POST',body:JSON.stringify(p)}),
    updateService:(id,p)=>request(`/admin/service-catalog/${id}`,{method:'PATCH',body:JSON.stringify(p)}),
    deleteService:(id)=>request(`/admin/service-catalog/${id}`,{method:'DELETE'}),
  };
  return { request, Auth, Bookings, Services, Payments, Reports, Admin };
})();

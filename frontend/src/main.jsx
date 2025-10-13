import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { API } from './lib/api.js'

function useAuth() {
  const [token, setToken] = React.useState(() => localStorage.getItem('token'))
  const [user, setUser] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })
  const login = async (username, password) => {
    const data = await API.Auth.login(username, password)
    setToken(data.token); setUser(data.user)
  }
  const logout = () => { API.Auth.logout(); setToken(null); setUser(null) }
  return { token, user, login, logout }
}

function App() {
  const auth = useAuth()
  const authed = !!auth.token
  const basename = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '/'
  return (
    <BrowserRouter basename={basename}>
      <header style={{display:'flex',gap:12,padding:12,borderBottom:'1px solid #ddd'}}>
        <b>Skynest</b>
        <nav style={{display:'flex',gap:8}}>
          {authed ? (
            <>
              <Link to="/">Home</Link>
              <Link to="/bookings">Bookings</Link>
              <Link to="/services">Services</Link>
              <button onClick={auth.logout}>Logout</button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </nav>
      </header>
      <main style={{padding:16}}>
        <Routes>
          <Route path="/login" element={<Login auth={auth} />} />
          <Route path="/" element={authed ? <Home user={auth.user} /> : <Navigate to="/login" replace />} />
          <Route path="/bookings" element={authed ? <Bookings /> : <Navigate to="/login" replace />} />
          <Route path="/services" element={authed ? <Services /> : <Navigate to="/login" replace />} />
          <Route path="/payments" element={authed ? <Payments /> : <Navigate to="/login" replace />} />
          <Route path="/reports" element={authed ? <Reports /> : <Navigate to="/login" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

function Home({ user }) {
  return <div>Welcome, <b>{user?.username}</b> ({user?.role})</div>
}

function Login({ auth }) {
  const [username, setUsername] = React.useState('admin')
  const [password, setPassword] = React.useState('admin123')
  const [err, setErr] = React.useState('')
  const onSubmit = async (e) => {
    e.preventDefault(); setErr('')
    try { await auth.login(username, password); location.href = '/' } catch (e) { setErr(e.message) }
  }
  return (
    <form onSubmit={onSubmit} style={{display:'grid',gap:8,maxWidth:320}}>
      <h2>Login</h2>
      {err && <div style={{color:'crimson'}}>{err}</div>}
      <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="username" />
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" />
      <button>Sign in</button>
    </form>
  )
}

function Bookings(){
  const [rows,setRows]=React.useState([])
  const [total,setTotal]=React.useState(0)
  const [page,setPage]=React.useState(1)
  const [limit,setLimit]=React.useState(10)
  const [loading,setLoading]=React.useState(false)
  const [filter,setFilter]=React.useState({})
  const [drawer,setDrawer]=React.useState({open:false,booking:null,usage:[],services_total:0})

  const run=async(p=page)=>{
    setLoading(true)
    try{ const r=await API.Bookings.search({...filter,page:p,limit}); setRows(r.bookings||[]); setTotal(r.total||0); setPage(r.page||p); }
    finally{ setLoading(false) }
  }
  React.useEffect(()=>{ run(1) },[])

  const open=async(id)=>{
    setDrawer(d=>({...d,open:true,booking:null,usage:[]}))
    try{
      const [b,u]=await Promise.all([API.Bookings.byId(id), API.Services.listUsage(id)])
      setDrawer({open:true,booking:b.booking,usage:u.usages||[],services_total:u.services_total})
    }catch(e){ setDrawer({open:true,booking:null,usage:[],services_total:0}) }
  }

  return (
    <div>
      <h2>Bookings</h2>
      <form onSubmit={e=>{e.preventDefault(); const fd=new FormData(e.currentTarget); const q=Object.fromEntries(Array.from(fd.entries()).filter(([,v])=>v)); setFilter(q); run(1)}} style={{display:'grid',gridTemplateColumns:'repeat(4, minmax(0,1fr))',gap:8,maxWidth:900}}>
        <input name="from" type="date" />
        <input name="to" type="date" />
        <input name="room_id" type="number" placeholder="Room ID" />
        <input name="guest_id" type="number" placeholder="Guest ID" />
        <select name="status" defaultValue=""><option value="">Any</option><option>Booked</option><option>Checked-In</option><option>Checked-Out</option><option>Cancelled</option></select>
        <input name="page" type="number" value={page} onChange={e=>setPage(Number(e.target.value||1))} />
        <input name="limit" type="number" value={limit} onChange={e=>setLimit(Number(e.target.value||10))} />
        <button>Search</button>
      </form>
      <div style={{marginTop:8}}>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <span>Total: {total}</span>
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>page>1&&run(page-1)}>Prev</button>
            <span>Page {page} / {Math.max(1, Math.ceil(total/limit))}</span>
            <button onClick={()=>run(page+1)}>Next</button>
          </div>
        </div>
        <div style={{ overflow: 'auto' }} />
        <table style={{width:'100%',borderCollapse:'collapse',marginTop:8}}>
          <thead><tr><th>ID</th><th>Guest</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map(b=> (
              <tr key={b.booking_id}>
                <td>{b.booking_id}</td><td>{b.guest_id}</td><td>{b.room_id}</td>
                <td>{b.check_in_pretty || b.check_in_date}</td>
                <td>{b.check_out_pretty || b.check_out_date}</td>
                <td>{b.status}</td>
                <td><button onClick={()=>open(b.booking_id)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div>Loading…</div>}
      </div>

      {drawer.open && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)'}} onClick={(e)=>{ if(e.target===e.currentTarget) setDrawer(d=>({...d,open:false})) }}>
          <div style={{position:'absolute',right:0,top:0,bottom:0,width:420,background:'#fff',padding:12,overflow:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <h3>Booking #{drawer.booking?.booking_id || ''}</h3>
              <button onClick={()=>setDrawer(d=>({...d,open:false}))}>Close</button>
            </div>
            {drawer.booking ? (
              <>
                <div>Guest: {drawer.booking.guest_id}</div>
                <div>Room: {drawer.booking.room_id}</div>
                <div>Range: {drawer.booking.date_range_pretty || ''}</div>
                <div>Status: {drawer.booking.status}</div>
                <h4 style={{marginTop:10}}>Service Usage</h4>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr><th>ID</th><th>Service</th><th>Used On</th><th>Qty</th><th>Unit</th></tr></thead>
                  <tbody>{drawer.usage.map(u=> <tr key={u.usage_id}><td>{u.usage_id}</td><td>{u.service_name||u.service_id}</td><td>{u.used_on_pretty||u.used_on}</td><td>{u.quantity}</td><td>{u.unit_price}</td></tr>)}</tbody>
                </table>
                <div>Total: {drawer.services_total}</div>
              </>
            ) : (
              <div>Loading…</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Services(){
  const [list,setList]=React.useState([])
  React.useEffect(()=>{ API.Services.catalog().then(d=>setList(d.services||[])) },[])
  return <div><h2>Services</h2><ul>{list.map(s=> <li key={s.service_id}>{s.name} — {s.unit_price}</li>)}</ul></div>
}

function Payments(){
  const [msg,setMsg]=React.useState('')
  const onPay=async e=>{ e.preventDefault(); setMsg(''); const fd=new FormData(e.currentTarget); try{ await API.Payments.create(Object.fromEntries(fd.entries())); setMsg('Payment recorded'); }catch(err){ setMsg(err.message) } }
  const onAdj=async e=>{ e.preventDefault(); setMsg(''); const fd=new FormData(e.currentTarget); try{ await API.Payments.adjust(Object.fromEntries(fd.entries())); setMsg('Adjustment recorded'); }catch(err){ setMsg(err.message) } }
  return (
    <div>
      <h2>Payments</h2>
      {msg && <div>{msg}</div>}
      <form onSubmit={onPay} style={{display:'grid',gridTemplateColumns:'repeat(3, minmax(0,1fr))',gap:8}}>
        <input name="booking_id" placeholder="Booking" required />
        <input name="amount" type="number" step="0.01" placeholder="Amount" required />
        <select name="method"><option>Cash</option><option>Card</option><option>Online</option></select>
        <input name="paid_at" type="datetime-local" />
        <input name="payment_reference" placeholder="Reference" />
        <button>Create Payment</button>
      </form>
      <h3>Adjustment</h3>
      <form onSubmit={onAdj} style={{display:'grid',gridTemplateColumns:'repeat(3, minmax(0,1fr))',gap:8}}>
        <input name="booking_id" placeholder="Booking" required />
        <input name="amount" type="number" step="0.01" placeholder="Amount (+/-)" required />
        <input name="reason" placeholder="Reason" />
        <button>Add Adjustment</button>
      </form>
    </div>
  )
}

function Reports(){
  const [occ,setOcc]=React.useState([])
  const [bill,setBill]=React.useState([])
  React.useEffect(()=>{ API.Reports.occupancyByDay().then(setOcc).catch(()=>{}); API.Reports.billingSummary().then(setBill).catch(()=>{}) },[])
  return (
    <div>
      <h2>Reports</h2>
      <div>Occupancy rows: {occ.length}</div>
      <div>Billing rows: {bill.length}</div>
    </div>
  )
}
createRoot(document.getElementById('root')).render(<App />)

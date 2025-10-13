import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { API } from './lib/api.js'
import { fmt } from './lib/fmt.js'
import { ToastProvider, useToast } from './lib/toast.jsx'

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
  const toast = useToast()
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
      <section style={{border:"1px solid #ddd",padding:12,borderRadius:8,marginBottom:12}}>
        <h3 style={{marginTop:0}}>Create Booking</h3>
        <form onSubmit={async e=>{ e.preventDefault(); const fd=new FormData(e.currentTarget); const p=Object.fromEntries(fd.entries());
          const gid=Number(p.guest_id), rid=Number(p.room_id), rate=Number(p.booked_rate)
          if(!gid||gid<1||!rid||rid<1){ toast.push('Guest ID and Room ID must be positive numbers',{type:'error'}); return }
          if(!p.check_in_date||!p.check_out_date){ toast.push('Dates are required',{type:'error'}); return }
          if(new Date(p.check_in_date)>=new Date(p.check_out_date)){ toast.push('Check-out must be after check-in',{type:'error'}); return }
          if(!Number.isFinite(rate)||rate<=0){ toast.push('Booked rate must be > 0',{type:'error'}); return }
          try{ await API.Bookings.create(p); toast.push('Booking created',{type:'success'}); e.currentTarget.reset(); run(1) }catch(err){ toast.push(err.message||'Create failed',{type:'error'}) } }} style={{display:'grid',gridTemplateColumns:'repeat(4, minmax(0,1fr))',gap:8,maxWidth:1100}}>
          <input name="guest_id" type="number" placeholder="Guest ID" required />
          <input name="room_id" type="number" placeholder="Room ID" required />
          <input name="check_in_date" type="date" required />
          <input name="check_out_date" type="date" required />
          <input name="booked_rate" type="number" step="0.01" placeholder="Booked rate" required />
          <input name="advance_payment" type="number" step="0.01" placeholder="Advance (optional)" />
          <input name="tax_rate_percent" type="number" step="0.01" placeholder="Tax % (optional)" />
          <select name="status" defaultValue="Booked"><option>Booked</option><option>Checked-In</option><option>Checked-Out</option><option>Cancelled</option></select>
          <div style={{gridColumn:"1 / -1"}}>
            <button>Create</button>
          </div>
        </form>
      </section>

      <section style={{border:"1px solid #ddd",padding:12,borderRadius:8,marginBottom:12}}>
        <h3 style={{marginTop:0}}>Update Status</h3>
        <form onSubmit={async e=>{ e.preventDefault(); const fd=new FormData(e.currentTarget); try{ await API.Bookings.updateStatus(fd.get('id'), fd.get('status')); toast.push('Status updated',{type:'success'}); run(page) }catch(err){ toast.push(err.message||'Update failed',{type:'error'}) } }} style={{display:'grid',gridTemplateColumns:'repeat(4, minmax(0,1fr))',gap:8,maxWidth:900}}>
          <input name="id" type="number" placeholder="Booking ID" required />
          <select name="status" defaultValue="Booked"><option>Booked</option><option>Checked-In</option><option>Checked-Out</option><option>Cancelled</option></select>
          <div style={{gridColumn:"1 / -1"}}>
            <button>Update</button>
          </div>
        </form>
      </section>
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
        {loading && <div>Loadingâ€¦</div>}
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
              <div>Loadingâ€¦</div>
            )}
          </div>
        </div>
      )}
      <section style={{border:"1px solid #ddd",padding:12,borderRadius:8,marginTop:12}}>
        <h3 style={{marginTop:0}}>Find Free Rooms</h3>
        <form onSubmit={async e=>{ e.preventDefault(); const fd=new FormData(e.currentTarget); try{ const r=await API.Bookings.freeRooms(Object.fromEntries(fd.entries())); toast.push(`${(r.free_rooms||[]).length} rooms free for the range`,{type:'success'}) }catch(err){ toast.push(err.message||'Search failed',{type:'error'}) } }} style={{display:'grid',gridTemplateColumns:'repeat(3, minmax(0,1fr))',gap:8,maxWidth:700}}>
          <input name="from" type="date" required />
          <input name="to" type="date" required />
          <button>Search</button>
        </form>
      </section>
    </div>
  )
}

function Services(){
  const toast = useToast()
  const [catalog,setCatalog]=React.useState([])
  const [bookingId,setBookingId]=React.useState('')
  const [usage,setUsage]=React.useState({booking_id:null,services_total:0,usages:[]})
  const loadUsage=async(id)=>{ if(!id) return; const d=await API.Services.listUsage(id); setUsage(d) }
  React.useEffect(()=>{ API.Services.catalog().then(d=>setCatalog(d.services||[])) },[])
  return (
    <div>
      <h2>Services</h2>
      <section style={{border:"1px solid #ddd",padding:12,borderRadius:8,marginBottom:12}}>
        <h3 style={{marginTop:0}}>Add Usage</h3>
        <form onSubmit={async e=>{ e.preventDefault(); const fd=new FormData(e.currentTarget); const p=Object.fromEntries(fd.entries()); if(!p.unit_price) delete p.unit_price; if(!p.used_on) delete p.used_on; try{ const r=await API.Services.addUsage(p); toast.push(`Added usage #${r.usage?.usage_id}`,{type:'success'}); e.currentTarget.reset(); if(p.booking_id) loadUsage(p.booking_id) }catch(err){ toast.push(err.message||'Add failed',{type:'error'}) } }} style={{display:'grid',gridTemplateColumns:'repeat(4, minmax(0,1fr))',gap:8,maxWidth:1100}}>
          <input name="booking_id" type="number" placeholder="Booking ID" required onChange={e=>setBookingId(e.target.value)} />
          <select name="service_id">{catalog.map(s=> <option key={s.service_id} value={s.service_id}>{s.name} — {s.unit_price}</option>)}</select>
          <input name="quantity" type="number" min="1" defaultValue="1" />
          <input name="unit_price" type="number" step="0.01" placeholder="Unit price (optional)" />
          <input name="used_on" type="date" />
          <div style={{gridColumn:"1 / -1"}}>
            <button>Add</button> <button type="button" onClick={()=>loadUsage(bookingId)}>Load Usage</button>
          </div>
        </form>
      </section>

      {usage.booking_id && (
        <section style={{border:"1px solid #ddd",padding:12,borderRadius:8}}>
          <h3 style={{marginTop:0}}>Usage for Booking #{usage.booking_id}</h3>
          <div style={{marginBottom:8}}>Services total: {fmt.money(usage.services_total)}</div>
          <div style={{overflow:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr><th>ID</th><th>Service</th><th>Used On</th><th>Qty</th><th>Unit</th><th>Total</th><th></th></tr></thead>
              <tbody>
                {(usage.usages||[]).map(u=> (
                  <tr key={u.usage_id}>
                    <td>{u.usage_id}</td>
                    <td>{u.service_name||u.service_id}</td>
                    <td>{u.used_on_pretty||fmt.date(u.used_on)}</td>
                    <td>{u.quantity}</td>
                    <td>{fmt.money(u.unit_price)}</td>
                    <td>{u.line_total? fmt.money(u.line_total): ''}</td>
                    <td><button onClick={async()=>{ try{ await API.Services.deleteUsage(u.usage_id); toast.push('Usage deleted',{type:'success'}); loadUsage(usage.booking_id) }catch(err){ toast.push(err.message||'Delete failed',{type:'error'}) } }}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { API } from './lib/api.js'
import { fmt } from './lib/fmt.js'
import { ToastProvider, useToast } from './lib/toast.jsx'

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
  const toast = useToast()
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
      <section style={{border:"1px solid #ddd",padding:12,borderRadius:8,marginBottom:12}}>
        <h3 style={{marginTop:0}}>Create Booking</h3>
        <form onSubmit={async e=>{ e.preventDefault(); const fd=new FormData(e.currentTarget); const p=Object.fromEntries(fd.entries());
          const gid=Number(p.guest_id), rid=Number(p.room_id), rate=Number(p.booked_rate)
          if(!gid||gid<1||!rid||rid<1){ toast.push('Guest ID and Room ID must be positive numbers',{type:'error'}); return }
          if(!p.check_in_date||!p.check_out_date){ toast.push('Dates are required',{type:'error'}); return }
          if(new Date(p.check_in_date)>=new Date(p.check_out_date)){ toast.push('Check-out must be after check-in',{type:'error'}); return }
          if(!Number.isFinite(rate)||rate<=0){ toast.push('Booked rate must be > 0',{type:'error'}); return }
          try{ await API.Bookings.create(p); toast.push('Booking created',{type:'success'}); e.currentTarget.reset(); run(1) }catch(err){ toast.push(err.message||'Create failed',{type:'error'}) } }} style={{display:'grid',gridTemplateColumns:'repeat(4, minmax(0,1fr))',gap:8,maxWidth:1100}}>
          <input name="guest_id" type="number" placeholder="Guest ID" required />
          <input name="room_id" type="number" placeholder="Room ID" required />
          <input name="check_in_date" type="date" required />
          <input name="check_out_date" type="date" required />
          <input name="booked_rate" type="number" step="0.01" placeholder="Booked rate" required />
          <input name="advance_payment" type="number" step="0.01" placeholder="Advance (optional)" />
          <input name="tax_rate_percent" type="number" step="0.01" placeholder="Tax % (optional)" />
          <select name="status" defaultValue="Booked"><option>Booked</option><option>Checked-In</option><option>Checked-Out</option><option>Cancelled</option></select>
          <div style={{gridColumn:"1 / -1"}}>
            <button>Create</button>
          </div>
        </form>
      </section>

      <section style={{border:"1px solid #ddd",padding:12,borderRadius:8,marginBottom:12}}>
        <h3 style={{marginTop:0}}>Update Status</h3>
        <form onSubmit={async e=>{ e.preventDefault(); const fd=new FormData(e.currentTarget); try{ await API.Bookings.updateStatus(fd.get('id'), fd.get('status')); toast.push('Status updated',{type:'success'}); run(page) }catch(err){ toast.push(err.message||'Update failed',{type:'error'}) } }} style={{display:'grid',gridTemplateColumns:'repeat(4, minmax(0,1fr))',gap:8,maxWidth:900}}>
          <input name="id" type="number" placeholder="Booking ID" required />
          <select name="status" defaultValue="Booked"><option>Booked</option><option>Checked-In</option><option>Checked-Out</option><option>Cancelled</option></select>
          <div style={{gridColumn:"1 / -1"}}>
            <button>Update</button>
          </div>
        </form>
      </section>
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
        {loading && <div>Loadingâ€¦</div>}
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
              <div>Loadingâ€¦</div>
            )}
          </div>
        </div>
      )}
      <section style={{border:"1px solid #ddd",padding:12,borderRadius:8,marginTop:12}}>
        <h3 style={{marginTop:0}}>Find Free Rooms</h3>
        <form onSubmit={async e=>{ e.preventDefault(); const fd=new FormData(e.currentTarget); try{ const r=await API.Bookings.freeRooms(Object.fromEntries(fd.entries())); toast.push(`${(r.free_rooms||[]).length} rooms free for the range`,{type:'success'}) }catch(err){ toast.push(err.message||'Search failed',{type:'error'}) } }} style={{display:'grid',gridTemplateColumns:'repeat(3, minmax(0,1fr))',gap:8,maxWidth:700}}>
          <input name="from" type="date" required />
          <input name="to" type="date" required />
          <button>Search</button>
        </form>
      </section>
    </div>
  )
}

function Services(){
  const [catalog,setCatalog]=React.useState([])
  const [bookingId,setBookingId]=React.useState('')
  const [usage,setUsage]=React.useState({booking_id:null,services_total:0,usages:[]})
  const loadUsage=async(id)=>{ if(!id) return; const d=await API.Services.listUsage(id); setUsage(d) }
  React.useEffect(()=>{ API.Services.catalog().then(d=>setCatalog(d.services||[])) },[])
  return (
    <div>
      <h2>Services</h2>
      <section style={{border:"1px solid #ddd",padding:12,borderRadius:8,marginBottom:12}}>
        <h3 style={{marginTop:0}}>Add Usage</h3>
        <form onSubmit={async e=>{ e.preventDefault(); const fd=new FormData(e.currentTarget); const p=Object.fromEntries(fd.entries()); if(!p.unit_price) delete p.unit_price; if(!p.used_on) delete p.used_on; try{ const r=await API.Services.addUsage(p); alert(`Added usage #${r.usage?.usage_id}`); e.currentTarget.reset(); if(p.booking_id) loadUsage(p.booking_id) }catch(err){ alert(err.message) } }} style={{display:'grid',gridTemplateColumns:'repeat(4, minmax(0,1fr))',gap:8,maxWidth:1100}}>
          <input name="booking_id" type="number" placeholder="Booking ID" required onChange={e=>setBookingId(e.target.value)} />
          <select name="service_id">{catalog.map(s=> <option key={s.service_id} value={s.service_id}>{s.name} â€” {s.unit_price}</option>)}</select>
          <input name="quantity" type="number" min="1" defaultValue="1" />
          <input name="unit_price" type="number" step="0.01" placeholder="Unit price (optional)" />
          <input name="used_on" type="date" />
          <div style={{gridColumn:"1 / -1"}}>
            <button>Add</button> <button type="button" onClick={()=>loadUsage(bookingId)}>Load Usage</button>
          </div>
        </form>
      </section>

      {usage.booking_id && (
        <section style={{border:"1px solid #ddd",padding:12,borderRadius:8}}>
          <h3 style={{marginTop:0}}>Usage for Booking #{usage.booking_id}</h3>
          <div style={{marginBottom:8}}>Services total: {usage.services_total}</div>
          <div style={{overflow:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr><th>ID</th><th>Service</th><th>Used On</th><th>Qty</th><th>Unit</th><th>Total</th><th></th></tr></thead>
              <tbody>
                {(usage.usages||[]).map(u=> (
                  <tr key={u.usage_id}>
                    <td>{u.usage_id}</td>
                    <td>{u.service_name||u.service_id}</td>
                    <td>{u.used_on_pretty||u.used_on}</td>
                    <td>{u.quantity}</td>
                    <td>{u.unit_price}</td>
                    <td>{u.line_total||''}</td>
                    <td><button onClick={async()=>{ try{ await API.Services.deleteUsage(u.usage_id); loadUsage(usage.booking_id) }catch(err){ alert(err.message) } }}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

function Payments(){
  const toast = useToast()
  const [msg,setMsg]=React.useState('')
  const onPay=async e=>{ e.preventDefault(); setMsg(''); const fd=new FormData(e.currentTarget); try{ await API.Payments.create(Object.fromEntries(fd.entries())); setMsg('Payment recorded'); toast.push('Payment recorded',{type:'success'}) }catch(err){ const m=err.message||'Payment failed'; setMsg(m); toast.push(m,{type:'error'}) } }
  const onAdj=async e=>{ e.preventDefault(); setMsg(''); const fd=new FormData(e.currentTarget); try{ await API.Payments.adjust(Object.fromEntries(fd.entries())); setMsg('Adjustment recorded'); toast.push('Adjustment recorded',{type:'success'}) }catch(err){ const m=err.message||'Adjustment failed'; setMsg(m); toast.push(m,{type:'error'}) } }
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
  const [sud,setSud]=React.useState([])
  const [rev,setRev]=React.useState([])
  const [trend,setTrend]=React.useState([])
  const [p1,setP1] = React.useState(1), [p2,setP2] = React.useState(1)
  const [p3,setP3] = React.useState(1), [p4,setP4] = React.useState(1)
  const pageSize = 20
  React.useEffect(()=>{ API.Reports.occupancyByDay().then(setOcc).catch(()=>{}); API.Reports.billingSummary().then(setBill).catch(()=>{}); API.Reports.branchRevenueMonthly().then(setRev).catch(()=>{}); API.Reports.serviceMonthlyTrend().then(setTrend).catch(()=>{}) },[])
  const cols = (arr, n=8) => Array.from(new Set(arr.flatMap(x=>Object.keys(x||{})))).slice(0,n)
  return (
    <div>
      <h2>Reports</h2>
      <section style={{border:"1px solid #ddd",padding:12,borderRadius:8,marginBottom:12}}>
        <h3 style={{marginTop:0}}>Service Usage Detail</h3>
        <form onSubmit={async e=>{ e.preventDefault(); const fd=new FormData(e.currentTarget); const q=Object.fromEntries(Array.from(fd.entries()).filter(([,v])=>v)); try{ const r=await API.Reports.serviceUsageDetail(q); setSud(r) }catch(err){ alert(err.message) } }} style={{display:'grid',gridTemplateColumns:'repeat(4, minmax(0,1fr))',gap:8,maxWidth:900}}>
          <input name="booking_id" type="number" placeholder="Booking ID" />
          <input name="from" type="date" />
          <input name="to" type="date" />
          <button>Filter</button>
        </form>
        <div style={{overflow:'auto',marginTop:8}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{cols(sud).map(c=> <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {sud.slice((p1-1)*pageSize, p1*pageSize).map((r,i)=> (
                <tr key={i}>{cols(sud).map(c=> <td key={c}>{String(r[c]??'')}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:8}}>
          <button onClick={()=> setP1(p=>Math.max(1,p-1))}>Prev</button>
          <span>Page {p1}</span>
          <button onClick={()=> setP1(p=>p+1)}>Next</button>
        </div>
      </section>

      <section style={{display:'grid',gridTemplateColumns:'repeat(2, minmax(0,1fr))',gap:12}}>
        <div style={{border:"1px solid #ddd",padding:12,borderRadius:8}}>
          <h3 style={{marginTop:0}}>Occupancy (Daily)</h3>
          <div style={{overflow:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{cols(occ,6).map(c=> <th key={c}>{c}</th>)}</tr></thead>
              <tbody>
                {occ.slice((p2-1)*pageSize, p2*pageSize).map((r,i)=> (
                  <tr key={i}>{cols(occ,6).map(c=> <td key={c}>{String(r[c]??'')}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:8}}>
          <button onClick={()=> setP2(p=>Math.max(1,p-1))}>Prev</button>
          <span>Page {p2}</span>
          <button onClick={()=> setP2(p=>p+1)}>Next</button>
        </div>
        <div style={{border:"1px solid #ddd",padding:12,borderRadius:8}}>
          <h3 style={{marginTop:0}}>Billing Summary</h3>
          <div style={{overflow:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{cols(bill,6).map(c=> <th key={c}>{c}</th>)}</tr></thead>
              <tbody>
                {bill.slice((p3-1)*pageSize, p3*pageSize).map((r,i)=> (
                  <tr key={i}>{cols(bill,6).map(c=> <td key={c}>{String(r[c]??'')}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:8}}>
          <button onClick={()=> setP3(p=>Math.max(1,p-1))}>Prev</button>
          <span>Page {p3}</span>
          <button onClick={()=> setP3(p=>p+1)}>Next</button>
        </div>
      </section>

      <section style={{display:'grid',gridTemplateColumns:'repeat(2, minmax(0,1fr))',gap:12,marginTop:12}}>
        <div style={{border:"1px solid #ddd",padding:12,borderRadius:8}}>
          <h3 style={{marginTop:0}}>Branch Revenue (Monthly)</h3>
          <div style={{overflow:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{cols(rev,6).map(c=> <th key={c}>{c}</th>)}</tr></thead>
              <tbody>
                {rev.slice(0,50).map((r,i)=> (
                  <tr key={i}>{cols(rev,6).map(c=> <td key={c}>{String(r[c]??'')}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{border:"1px solid #ddd",padding:12,borderRadius:8}}>
          <h3 style={{marginTop:0}}>Service Monthly Trend</h3>
          <div style={{overflow:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{cols(trend,6).map(c=> <th key={c}>{c}</th>)}</tr></thead>
              <tbody>
                {trend.slice((p4-1)*pageSize, p4*pageSize).map((r,i)=> (
                  <tr key={i}>{cols(trend,6).map(c=> <td key={c}>{String(r[c]??'')}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <App />
  </ToastProvider>
)

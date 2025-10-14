import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { API } from './lib/api.js'
import { ToastProvider, useToast } from './lib/toast.jsx'
import './styles.css'

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
  const role = auth.user?.role
  const can = (roles) => roles.includes(role)
  
  return (
    <BrowserRouter basename={basename}>
      <header className="topbar">
        <div className="brand">SkyNest Hotel</div>
        <nav className="nav">
          {authed ? (
            <>
              <Link to="/">Home</Link>
              {role==='Customer' && <Link to="/customer/dashboard">My Dashboard</Link>}
              {role!=='Customer' && <Link to="/staff/dashboard">Staff Dashboard</Link>}
              {can(['Admin','Manager','Receptionist','Accountant']) && <Link to="/bookings">Bookings</Link>}
              {can(['Admin','Manager','Receptionist','Accountant']) && <Link to="/services">Services</Link>}
              {can(['Admin','Manager','Accountant']) && <Link to="/payments">Payments</Link>}
              {can(['Admin','Manager','Accountant','Receptionist']) && <Link to="/reports">Reports</Link>}
              {can(['Admin']) && <Link to="/admin">Admin</Link>}
              <a className="btn" onClick={auth.logout}>Logout ({auth.user?.username})</a>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </nav>
      </header>
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login auth={auth} />} />
          <Route path="/" element={authed ? <Home user={auth.user} /> : <Navigate to="/login" replace />} />
          <Route path="/customer/dashboard" element={authed ? <CustomerDashboard /> : <Navigate to="/login" replace />} />
          <Route path="/staff/dashboard" element={authed ? <StaffDashboard /> : <Navigate to="/login" replace />} />
          <Route path="/bookings" element={authed ? <BookingsPage /> : <Navigate to="/login" replace />} />
          <Route path="/services" element={authed ? <ServicesPage /> : <Navigate to="/login" replace />} />
          <Route path="/payments" element={authed ? <PaymentsPage /> : <Navigate to="/login" replace />} />
          <Route path="/reports" element={authed ? <ReportsPage /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={authed ? <AdminPage /> : <Navigate to="/login" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

// ============================================================================
// HOME PAGE
// ============================================================================
function Home({ user }) {
  return (
    <div className="card">
      <h2>Welcome to SkyNest Hotel Management</h2>
      <p>Hello, <strong>{user?.username}</strong> ({user?.role})</p>
      <p>Use the navigation above to access your dashboard and features.</p>
    </div>
  )
}

// ============================================================================
// LOGIN PAGE
// ============================================================================
function Login({ auth }) {
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [err, setErr] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  
  const onSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      await auth.login(username, password)
      window.location.href = '/'
    } catch (e) {
      setErr(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="card" style={{maxWidth:400, margin:'0 auto'}}>
      <h2>Login</h2>
      {err && <div className="error">{err}</div>}
      <form onSubmit={onSubmit} style={{display:'flex', flexDirection:'column', gap:12}}>
        <div>
          <label>Username</label>
          <input 
            value={username} 
            onChange={e=>setUsername(e.target.value)} 
            placeholder="username" 
            required 
          />
        </div>
        <div>
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            placeholder="password" 
            required 
          />
        </div>
        <button disabled={loading}>
          {loading ? 'Logging in...' : 'Sign In'}
        </button>
      </form>
      <div style={{marginTop:16, fontSize:'0.875rem', color:'#666'}}>
        <p><strong>Demo Credentials:</strong></p>
        <ul style={{listStyle:'none', padding:0}}>
          <li>Admin: admin / admin123</li>
          <li>Manager: manager / manager123</li>
          <li>Receptionist: receptionist / receptionist123</li>
          <li>Accountant: accountant / accountant123</li>
          <li>Customer: customer / customer123</li>
        </ul>
      </div>
    </div>
  )
}

// ============================================================================
// CUSTOMER DASHBOARD
// ============================================================================
function CustomerDashboard() {
  const toast = useToast()
  const [bookings, setBookings] = React.useState([])
  const [selected, setSelected] = React.useState(null)
  const [usage, setUsage] = React.useState({usages:[], services_total:0})
  const [pays, setPays] = React.useState({payments:[], adjustments:[], totals:{total_paid:0, total_adjust:0}})
  
  const today = new Date()
  const isoToday = today.toISOString().slice(0,10)
  const in30 = new Date(today.getTime() + 30*86400000).toISOString().slice(0,10)
  
  React.useEffect(() => {
    API.Bookings.search({ page:1, limit:100 })
      .then(r => setBookings(r.bookings || []))
      .catch(() => {})
  }, [])
  
  const open = async (b) => {
    setSelected(b)
    try {
      const [full, u, p] = await Promise.all([
        API.Bookings.byId(b.booking_id),
        API.Services.listUsage(b.booking_id),
        API.Payments.listForBooking(b.booking_id)
      ])
      setSelected(full.booking || b)
      setUsage(u || {})
      setPays(p || {})
    } catch(e) {
      toast.push(e.message || 'Load failed', {type:'error'})
    }
  }
  
  const isWithin = (d, from, to) => {
    const x = (d||'').slice(0,10)
    return (!from || x >= from) && (!to || x <= to)
  }
  
  const upcoming = bookings.filter(b => 
    (b.status === 'Booked' || b.status === 'Checked-In') && 
    isWithin(b.check_in_date, isoToday, in30)
  )
  
  const past = bookings.filter(b => 
    b.status === 'Checked-Out' || b.status === 'Cancelled'
  )
  
  const nights = (a, b) => {
    try {
      return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000))
    } catch {
      return 0
    }
  }
  
  const money = (n) => (Number(n || 0)).toFixed(2)
  
  const totals = (() => {
    const b = selected || {}
    const n = nights(b.check_in_date, b.check_out_date)
    const room = n * Number(b.booked_rate || 0)
    const services = Number(usage.services_total || 0)
    const preTax = room + services - Number(b.discount_amount || 0) + Number(b.late_fee_amount || 0)
    const tax = preTax * (Number(b.tax_rate_percent || 0) / 100)
    const gross = preTax + tax
    const paid = Number(pays?.totals?.total_paid || 0)
    const adjust = Number(pays?.totals?.total_adjust || 0)
    const advance = Number(b.advance_payment || 0)
    const balance = gross - (paid + advance) + adjust
    return {n, room, services, preTax, tax, gross, paid, adjust, advance, balance}
  })()
  
  return (
    <div className="grid cols-2">
      <section className="card">
        <h3 style={{marginTop:0}}>Upcoming & Current Bookings</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Room</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map(b => (
                <tr key={b.booking_id}>
                  <td>{b.booking_id}</td>
                  <td>{b.room_id}</td>
                  <td>{b.check_in_date}</td>
                  <td>{b.check_out_date}</td>
                  <td>{b.status}</td>
                  <td><button onClick={() => open(b)}>View</button></td>
                </tr>
              ))}
              {upcoming.length === 0 && (
                <tr><td colSpan="6" className="empty">No upcoming bookings</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        <h3>Past Bookings</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Room</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {past.slice(0, 10).map(b => (
                <tr key={b.booking_id}>
                  <td>{b.booking_id}</td>
                  <td>{b.room_id}</td>
                  <td>{b.check_in_date}</td>
                  <td>{b.check_out_date}</td>
                  <td>{b.status}</td>
                  <td><button onClick={() => open(b)}>View</button></td>
                </tr>
              ))}
              {past.length === 0 && (
                <tr><td colSpan="6" className="empty">No past bookings</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      
      <section className="card">
        <h3 style={{marginTop:0}}>Booking Details</h3>
        {selected ? (
          <>
            <div className="grid cols-3">
              <div>
                <span className="muted">Booking ID</span>
                <div className="value">#{selected.booking_id}</div>
              </div>
              <div>
                <span className="muted">Room</span>
                <div className="value">{selected.room_id}</div>
              </div>
              <div>
                <span className="muted">Nights</span>
                <div className="value">{totals.n}</div>
              </div>
            </div>
            
            <h4>Services Used</h4>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Service</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(usage.usages || []).map(u => (
                    <tr key={u.usage_id}>
                      <td>{u.used_on}</td>
                      <td>{u.service_name || u.service_id}</td>
                      <td>{u.quantity}</td>
                      <td>${money(u.unit_price_at_use)}</td>
                      <td>${money(u.line_total)}</td>
                    </tr>
                  ))}
                  {(usage.usages || []).length === 0 && (
                    <tr><td colSpan="5" className="empty">No services used</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <h4>Billing Summary</h4>
            <div className="billing-grid">
              <div className="billing-row">
                <span>Room Charges ({totals.n} nights × ${money(selected.booked_rate)}):</span>
                <span>${money(totals.room)}</span>
              </div>
              <div className="billing-row">
                <span>Services:</span>
                <span>${money(totals.services)}</span>
              </div>
              {Number(selected.discount_amount || 0) > 0 && (
                <div className="billing-row">
                  <span>Discount:</span>
                  <span>-${money(selected.discount_amount)}</span>
                </div>
              )}
              {Number(selected.late_fee_amount || 0) > 0 && (
                <div className="billing-row">
                  <span>Late Fee:</span>
                  <span>${money(selected.late_fee_amount)}</span>
                </div>
              )}
              <div className="billing-row">
                <span>Tax ({selected.tax_rate_percent}%):</span>
                <span>${money(totals.tax)}</span>
              </div>
              <div className="billing-row strong">
                <span>Gross Total:</span>
                <span>${money(totals.gross)}</span>
              </div>
              <div className="billing-row">
                <span>Payments Made:</span>
                <span>-${money(totals.paid)}</span>
              </div>
              <div className="billing-row">
                <span>Advance Payment:</span>
                <span>-${money(totals.advance)}</span>
              </div>
              {Number(totals.adjust) !== 0 && (
                <div className="billing-row">
                  <span>Adjustments:</span>
                  <span>{totals.adjust > 0 ? '+' : ''}${money(totals.adjust)}</span>
                </div>
              )}
              <div className="billing-row strong highlight">
                <span>Balance Due:</span>
                <span>${money(totals.balance)}</span>
              </div>
            </div>
            
            <h4>Payment History</h4>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {(pays.payments || []).map(p => (
                    <tr key={p.payment_id}>
                      <td>{p.payment_id}</td>
                      <td>${money(p.amount)}</td>
                      <td>{p.method}</td>
                      <td>{p.paid_at}</td>
                      <td>{p.payment_reference || '-'}</td>
                    </tr>
                  ))}
                  {(pays.payments || []).length === 0 && (
                    <tr><td colSpan="5" className="empty">No payments recorded</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="empty">Select a booking to view details</div>
        )}
      </section>
    </div>
  )
}

// ============================================================================
// STAFF DASHBOARD
// ============================================================================
function StaffDashboard() {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })()
  
  const role = user?.role
  const [tab, setTab] = React.useState(
    role === 'Receptionist' ? 'Receptionist' :
    role === 'Manager' ? 'Manager' :
    role === 'Accountant' ? 'Accountant' :
    'Admin'
  )
  
  return (
    <div>
      <div className="tabs">
        {role === 'Receptionist' && (
          <button 
            className={tab === 'Receptionist' ? 'active' : ''} 
            onClick={() => setTab('Receptionist')}
          >
            Receptionist
          </button>
        )}
        {role === 'Manager' && (
          <button 
            className={tab === 'Manager' ? 'active' : ''} 
            onClick={() => setTab('Manager')}
          >
            Manager
          </button>
        )}
        {role === 'Accountant' && (
          <button 
            className={tab === 'Accountant' ? 'active' : ''} 
            onClick={() => setTab('Accountant')}
          >
            Accountant
          </button>
        )}
        {role === 'Admin' && (
          <button 
            className={tab === 'Admin' ? 'active' : ''} 
            onClick={() => setTab('Admin')}
          >
            Admin
          </button>
        )}
      </div>
      
      {tab === 'Receptionist' && <ReceptionistTab />}
      {tab === 'Manager' && <ManagerTab />}
      {tab === 'Accountant' && <AccountantTab />}
      {tab === 'Admin' && <AdminTab />}
    </div>
  )
}

function ReceptionistTab() {
  const toast = useToast()
  const [arrivals, setArrivals] = React.useState([])
  const [departures, setDepartures] = React.useState([])
  const today = new Date().toISOString().slice(0, 10)
  
  React.useEffect(() => {
    API.Bookings.search({ page: 1, limit: 200 })
      .then(r => {
        const list = r.bookings || []
        const a = list.filter(b => 
          b.status === 'Booked' && 
          String(b.check_in_date || '').slice(0, 10) === today
        )
        const d = list.filter(b => 
          b.status === 'Checked-In' && 
          String(b.check_out_date || '').slice(0, 10) === today
        )
        setArrivals(a)
        setDepartures(d)
      })
      .catch(() => {})
  }, [])
  
  const updateStatus = async (id, status) => {
    try {
      await API.Bookings.updateStatus(id, status)
      toast.push(`Status updated to ${status}`, {type: 'success'})
      // Refresh
      window.location.reload()
    } catch (e) {
      toast.push(e.message || 'Failed', {type: 'error'})
    }
  }
  
  return (
    <div className="grid cols-2">
      <section className="card">
        <h3 style={{marginTop: 0}}>Today's Arrivals</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Check-In</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {arrivals.map(b => (
                <tr key={b.booking_id}>
                  <td>{b.booking_id}</td>
                  <td>{b.guest_id}</td>
                  <td>{b.room_id}</td>
                  <td>{b.check_in_date}</td>
                  <td>
                    <button onClick={() => updateStatus(b.booking_id, 'Checked-In')}>
                      Check-In
                    </button>
                  </td>
                </tr>
              ))}
              {arrivals.length === 0 && (
                <tr><td colSpan="5" className="empty">No arrivals today</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      
      <section className="card">
        <h3 style={{marginTop: 0}}>Today's Departures</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Check-Out</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {departures.map(b => (
                <tr key={b.booking_id}>
                  <td>{b.booking_id}</td>
                  <td>{b.guest_id}</td>
                  <td>{b.room_id}</td>
                  <td>{b.check_out_date}</td>
                  <td>
                    <button onClick={() => updateStatus(b.booking_id, 'Checked-Out')}>
                      Check-Out
                    </button>
                  </td>
                </tr>
              ))}
              {departures.length === 0 && (
                <tr><td colSpan="5" className="empty">No departures today</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function ManagerTab() {
  const [occ, setOcc] = React.useState([])
  const [bill, setBill] = React.useState([])
  const [top, setTop] = React.useState([])
  
  React.useEffect(() => {
    API.Reports.occupancyByDay().then(setOcc).catch(() => {})
    API.Reports.billingSummary().then(setBill).catch(() => {})
    API.Reports.serviceUsageDetail({}).then(rows => {
      const m = new Map()
      rows.forEach(r => {
        const k = r.service_id || r.name
        const amt = Number(r.qty || r.quantity || 0) * Number(r.unit_price_at_use || r.unit_price || 0)
        const o = m.get(k) || {name: (r.name || k), qty: 0, revenue: 0}
        o.qty += Number(r.qty || r.quantity || 0)
        o.revenue += amt
        m.set(k, o)
      })
      setTop(Array.from(m.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10))
    }).catch(() => {})
  }, [])
  
  const money = (n) => (Number(n || 0)).toFixed(2)
  
  return (
    <div className="grid cols-2">
      <section className="card">
        <h3 style={{marginTop: 0}}>Occupancy Overview</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Occupied</th>
                <th>Available</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {occ.slice(0, 14).map((r, i) => (
                <tr key={i}>
                  <td>{r.day || r.date}</td>
                  <td>{r.rooms_occupied || r.occupied}</td>
                  <td>{r.rooms_available || r.available}</td>
                  <td>{r.occupancy_rate ? `${(r.occupancy_rate * 100).toFixed(1)}%` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      
      <section className="card">
        <h3 style={{marginTop: 0}}>Revenue Summary</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Room Revenue</th>
                <th>Service Revenue</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.slice(0, 14).map((r, i) => (
                <tr key={i}>
                  <td>{r.day || r.date}</td>
                  <td>${money(r.room_revenue)}</td>
                  <td>${money(r.service_revenue)}</td>
                  <td>${money(r.gross_total || r.total_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      
      <section className="card" style={{gridColumn: '1 / -1'}}>
        <h3 style={{marginTop: 0}}>Top Services</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Quantity Sold</th>
                <th>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {top.map((r, i) => (
                <tr key={i}>
                  <td>{r.name}</td>
                  <td>{r.qty}</td>
                  <td>${money(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function AccountantTab() {
  const [balances, setBalances] = React.useState([])
  const [ledger, setLedger] = React.useState([])
  const [adjs, setAdjs] = React.useState([])
  
  React.useEffect(() => {
    API.Reports.billingSummary()
      .then(data => {
        const due = data.filter(r => Number(r.balance || r.balance_due || 0) > 0)
        setBalances(due)
      })
      .catch(() => {})
    
    API.Reports.paymentsLedger(30).then(setLedger).catch(() => {})
    API.Reports.adjustments(30).then(setAdjs).catch(() => {})
  }, [])
  
  const money = (n) => (Number(n || 0)).toFixed(2)
  
  return (
    <div className="grid cols-2">
      <section className="card">
        <h3 style={{marginTop: 0}}>Outstanding Balances</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Guest ID</th>
                <th>Balance Due</th>
              </tr>
            </thead>
            <tbody>
              {balances.slice(0, 20).map((r, i) => (
                <tr key={i}>
                  <td>{r.booking_id}</td>
                  <td>{r.guest_id}</td>
                  <td>${money(r.balance || r.balance_due)}</td>
                </tr>
              ))}
              {balances.length === 0 && (
                <tr><td colSpan="3" className="empty">No outstanding balances</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      
      <section className="card">
        <h3 style={{marginTop: 0}}>Payment Ledger (Last 30 Days)</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Booking</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {ledger.slice(0, 20).map(p => (
                <tr key={p.payment_id}>
                  <td>{p.payment_id}</td>
                  <td>{p.booking_id}</td>
                  <td>${money(p.amount)}</td>
                  <td>{p.method}</td>
                  <td>{p.paid_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      
      <section className="card" style={{gridColumn: '1 / -1'}}>
        <h3 style={{marginTop: 0}}>Adjustments (Last 30 Days)</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Booking</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {adjs.slice(0, 20).map(a => (
                <tr key={a.adjustment_id}>
                  <td>{a.adjustment_id}</td>
                  <td>{a.booking_id}</td>
                  <td>${money(a.amount)}</td>
                  <td>{a.type}</td>
                  <td>{a.reason}</td>
                  <td>{a.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function AdminTab() {
  const toast = useToast()
  const [users, setUsers] = React.useState([])
  const [services, setServices] = React.useState([])
  const [editingUser, setEditingUser] = React.useState(null)
  const [editingService, setEditingService] = React.useState(null)
  
  const loadData = async () => {
    try {
      const [u, s] = await Promise.all([
        API.Admin.listUsers(),
        API.Admin.adminListServices ? API.Admin.adminListServices() : API.Services.catalog()
      ])
      setUsers(u.users || [])
      setServices(s.services || [])
    } catch (e) {
      toast.push(e.message || 'Load failed', {type: 'error'})
    }
  }
  
  React.useEffect(() => {
    loadData()
  }, [])
  
  const onCreateUser = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    try {
      await API.Admin.createUser(payload)
      toast.push('User created', {type: 'success'})
      e.currentTarget.reset()
      loadData()
    } catch (err) {
      toast.push(err.message || 'Failed', {type: 'error'})
    }
  }
  
  const onUpdateUserRole = async (id, role) => {
    try {
      await API.Admin.updateUserRole(id, role)
      toast.push('Role updated', {type: 'success'})
      loadData()
    } catch (e) {
      toast.push(e.message || 'Failed', {type: 'error'})
    }
  }
  
  const onDeleteUser = async (id) => {
    if (!confirm('Delete this user?')) return
    try {
      await API.Admin.deleteUser(id)
      toast.push('User deleted', {type: 'success'})
      loadData()
    } catch (e) {
      toast.push(e.message || 'Failed', {type: 'error'})
    }
  }
  
  const onCreateService = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    payload.active = fd.get('active') === 'on'
    try {
      await API.Admin.createService(payload)
      toast.push('Service created', {type: 'success'})
      e.currentTarget.reset()
      loadData()
    } catch (err) {
      toast.push(err.message || 'Failed', {type: 'error'})
    }
  }
  
  const onSaveService = async () => {
    const s = editingService
    if (!s) return
    const payload = {
      code: s.code,
      name: s.name,
      category: s.category,
      unit_price: s.unit_price,
      tax_rate_percent: s.tax_rate_percent,
      active: !!s.active
    }
    try {
      await API.Admin.updateService(s.service_id, payload)
      toast.push('Service updated', {type: 'success'})
      setEditingService(null)
      loadData()
    } catch (e) {
      toast.push(e.message || 'Failed', {type: 'error'})
    }
  }
  
  const onDeleteService = async (id) => {
    if (!confirm('Delete this service?')) return
    try {
      await API.Admin.deleteService(id)
      toast.push('Service deleted', {type: 'success'})
      loadData()
    } catch (e) {
      toast.push(e.message || 'Failed', {type: 'error'})
    }
  }
  
  const money = (n) => (Number(n || 0)).toFixed(2)
  
  return (
    <div className="grid cols-2">
      <section className="card">
        <h3 style={{marginTop: 0}}>User Management</h3>
        <form onSubmit={onCreateUser} style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12}}>
          <input name="username" placeholder="Username" required />
          <input name="password" type="password" placeholder="Password" required />
          <select name="role" defaultValue="Customer">
            <option>Customer</option>
            <option>Receptionist</option>
            <option>Manager</option>
            <option>Accountant</option>
            <option>Admin</option>
          </select>
          <button style={{gridColumn: '1 / -1'}}>Create User</button>
        </form>
        
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.user_id}>
                  <td>{u.user_id}</td>
                  <td>{u.username}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={e => onUpdateUserRole(u.user_id, e.target.value)}
                    >
                      <option>Customer</option>
                      <option>Receptionist</option>
                      <option>Manager</option>
                      <option>Accountant</option>
                      <option>Admin</option>
                    </select>
                  </td>
                  <td>
                    <button className="danger" onClick={() => onDeleteUser(u.user_id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      
      <section className="card">
        <h3 style={{marginTop: 0}}>Service Catalog</h3>
        <form onSubmit={onCreateService} style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12}}>
          <input name="code" placeholder="CODE" required />
          <input name="name" placeholder="Name" required />
          <input name="category" placeholder="Category" />
          <input name="unit_price" type="number" step="0.01" placeholder="Price" />
          <input name="tax_rate_percent" type="number" step="0.01" placeholder="Tax %" />
          <label style={{alignSelf: 'end'}}>
            <input name="active" type="checkbox" defaultChecked /> Active
          </label>
          <button style={{gridColumn: '1 / -1'}}>Create Service</button>
        </form>
        
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Code</th>
                <th>Name</th>
                <th>Price</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.service_id}>
                  <td>{s.service_id}</td>
                  <td>{s.code}</td>
                  <td>{s.name}</td>
                  <td>${money(s.unit_price)}</td>
                  <td>{String(s.active)}</td>
                  <td style={{display: 'flex', gap: 4}}>
                    <button onClick={() => setEditingService({...s})}>Edit</button>
                    <button className="danger" onClick={() => onDeleteService(s.service_id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {editingService && (
          <div className="modal-backdrop" onClick={() => setEditingService(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Edit Service #{editingService.service_id}</h3>
              <div className="grid cols-2">
                <div>
                  <label>Code</label>
                  <input
                    value={editingService.code || ''}
                    onChange={e => setEditingService({...editingService, code: e.target.value})}
                  />
                </div>
                <div>
                  <label>Name</label>
                  <input
                    value={editingService.name || ''}
                    onChange={e => setEditingService({...editingService, name: e.target.value})}
                  />
                </div>
                <div>
                  <label>Category</label>
                  <input
                    value={editingService.category || ''}
                    onChange={e => setEditingService({...editingService, category: e.target.value})}
                  />
                </div>
                <div>
                  <label>Unit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingService.unit_price || 0}
                    onChange={e => setEditingService({...editingService, unit_price: e.target.value})}
                  />
                </div>
                <div>
                  <label>Tax %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingService.tax_rate_percent || 0}
                    onChange={e => setEditingService({...editingService, tax_rate_percent: e.target.value})}
                  />
                </div>
                <label style={{alignSelf: 'end'}}>
                  <input
                    type="checkbox"
                    checked={!!editingService.active}
                    onChange={e => setEditingService({...editingService, active: e.target.checked})}
                  /> Active
                </label>
              </div>
              <div style={{display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12}}>
                <button onClick={() => setEditingService(null)}>Cancel</button>
                <button className="primary" onClick={onSaveService}>Save</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

// Placeholder pages (you can implement these fully later)
function BookingsPage() { return <div className="card"><h2>Bookings Management</h2><p>Coming soon...</p></div> }
function ServicesPage() { return <div className="card"><h2>Services Management</h2><p>Coming soon...</p></div> }
function PaymentsPage() { return <div className="card"><h2>Payments Management</h2><p>Coming soon...</p></div> }
function ReportsPage() { return <div className="card"><h2>Reports</h2><p>Coming soon...</p></div> }
function AdminPage() { return <div className="card"><h2>Administration</h2><p>Use the Staff Dashboard → Admin tab</p></div> }

// ============================================================================
// ROOT
// ============================================================================
const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
)

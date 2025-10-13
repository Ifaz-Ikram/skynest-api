import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'

function useAuth() {
  const [token, setToken] = React.useState(() => localStorage.getItem('token'))
  const [user, setUser] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })
  const login = async (username, password) => {
    const res = await fetch('/auth/login', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ username, password }) })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Login failed')
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setToken(data.token); setUser(data.user)
  }
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setToken(null); setUser(null) }
  return { token, user, login, logout }
}

function App() {
  const auth = useAuth()
  const authed = !!auth.token
  return (
    <BrowserRouter>
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
          <Route path="/bookings" element={authed ? <div>Bookings (scaffold)</div> : <Navigate to="/login" replace />} />
          <Route path="/services" element={authed ? <div>Services (scaffold)</div> : <Navigate to="/login" replace />} />
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

createRoot(document.getElementById('root')).render(<App />)


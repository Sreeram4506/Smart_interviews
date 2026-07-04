import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, UtensilsCrossed, BarChart3, Bell, ShieldCheck, MessageCircleHeart, Users, LogOut, ChefHat, GraduationCap } from 'lucide-react'
import { useSocketLive } from './hooks/useSocketLive'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import socket from './lib/socket'
import api from './lib/api'
import './App.css'

/* ─── Role-based nav configs ─── */
const studentNav = [
  { to: '/student/feedback', label: 'Feedback', icon: MessageCircleHeart },
]

const ownerNav = [
  { to: '/owner/overview', label: 'Overview', icon: BarChart3 },
  { to: '/owner/menu', label: 'Menu Manager', icon: UtensilsCrossed },
  { to: '/owner/staff', label: 'Staff View', icon: ShieldCheck },
  { to: '/owner/live', label: 'Live Feed', icon: MessageCircleHeart },
]

/* ─── App Shell with role-aware sidebar ─── */
function AppShell({ children }) {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const navItems = role === 'student' ? studentNav : ownerNav
  const RoleIcon = role === 'student' ? GraduationCap : ChefHat

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-mark"><Sparkles size={18} /></div>
            <div>
              <p className="brand-title">MessPulse AI</p>
              <p className="brand-subtitle">Smart hostel feedback</p>
            </div>
          </div>

          <div className="role-badge-sidebar">
            <RoleIcon size={15} />
            <span>{user?.name || 'User'}</span>
            <span className={`role-tag ${role}`}>{role === 'student' ? 'Student' : 'Owner'}</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={20} className="nav-icon" />
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-card">
            <Bell size={16} />
            <p>Live alerts synced globally.</p>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-titles">
            <p className="eyebrow">Production-ready demo</p>
            <h1>MessPulse AI</h1>
          </div>
          <div className="topbar-actions">
            <div className="pill hide-mobile">Socket.IO updates</div>
            <div className={`pill role-pill ${role}`}>
              <RoleIcon size={14} />
              <span className="hide-mobile">{role === 'student' ? 'Student' : 'Mess Owner'}</span>
            </div>
            <button className="logout-btn-mobile" onClick={handleLogout}>
              <LogOut size={18} />
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}

/* ─── Overview Page (Mess Owner) ─── */
function OverviewPage() {
  const { events, status } = useSocketLive()

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="content-grid">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Live analytics</p>
          <h2>Turn every meal into real-time insight.</h2>
          <p className="muted">Students rate meals instantly, staff manage menus live, and admins see sentiment, queue health, and alerts in one premium workspace.</p>
        </div>
        <div className="hero-tiles">
          <div className="stat-card accent">
            <span>Active students</span>
            <strong>128</strong>
          </div>
          <div className="stat-card">
            <span>Avg. rating</span>
            <strong>4.4/5</strong>
          </div>
          <div className="stat-card">
            <span>Complaints</span>
            <strong>12</strong>
          </div>
        </div>
      </section>

      <section className="card-grid">
        <div className="panel-card">
          <div className="panel-title-row"><Users size={18} /><h3>Live session</h3></div>
          <p className="muted">Lunch service • 11:30 AM</p>
          <ul className="metric-list">
            <li><span>Socket status</span><strong>{status}</strong></li>
            <li><span>Positive %</span><strong>82%</strong></li>
            <li><span>Queue</span><strong>24 waiting</strong></li>
          </ul>
        </div>
        <div className="panel-card">
          <div className="panel-title-row"><BarChart3 size={18} /><h3>Live event feed</h3></div>
          <div className="feed-list">
            {events.length === 0 ? <p className="muted">Waiting for live updates…</p> : events.map((event, index) => <div key={`${event.message || event.type}-${index}`} className="feed-item">{event.message || event.type}</div>)}
          </div>
        </div>
      </section>
    </motion.div>
  )
}

/* ─── Student Feedback Page (Student only) ─── */
function StudentFeedbackPage() {
  const { events } = useSocketLive()
  const [menus, setMenus] = useState([])
  const [loadingMenus, setLoadingMenus] = useState(true)
  const [ratings, setRatings] = useState({})

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await api.get('/auth/menu')
        if (mounted) {
          setMenus(data.menus || [])
        }
      } catch {
        // keep UI usable
      } finally {
        if (mounted) setLoadingMenus(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    // When owner publishes, backend broadcasts { menu }
    const lastMenuEvent = events
      .slice()
      .reverse()
      .find((e) => e?.type === 'menu' && e?.menu)

    if (lastMenuEvent?.menu) {
      setMenus((prev) => {
        const exists = prev.some((m) => String(m._id) === String(lastMenuEvent.menu._id || lastMenuEvent.menu.id))
        if (exists) return prev
        return [lastMenuEvent.menu, ...prev].slice(0, 10)
      })
    }
  }, [events])

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="content-grid">
      <section className="hero-card compact">
        <div>
          <p className="eyebrow">Your feedback matters</p>
          <h2>Rate today's meals and help us improve.</h2>
          <p className="muted">Share your experience with each dish. Your ratings and comments are visible to mess staff in real-time.</p>
        </div>
      </section>

      {loadingMenus && (
        <p className="muted" style={{ marginTop: 12 }}>
          Loading menus…
        </p>
      )}

      {menus.map((item) => (
        <div key={item._id || item.name} className="menu-card">
          <img src={item.imageDataUrl || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80'} alt={item.name} />
          <div className="menu-card-body">
            <div className="menu-card-top">
              <div>
                <p className="eyebrow">{item.category || 'Today\'s Special'}</p>
                <h3>{item.name}</h3>
              </div>
              <span className={`badge ${Number(item.quantity || 0) > 0 ? 'live' : 'limited'}`}>
                {Number(item.quantity || 0) > 0 ? 'Live' : 'Limited'}
              </span>
            </div>

            <p className="muted">{item.description || 'Creamy and delicious today’s special.'}</p>

            <div className="meta-row">
              <span>Qty {item.quantity}</span>
              <span>{'Live ★'} </span>
            </div>

            <div className="rating-row" style={{ marginTop: 10, marginBottom: 10 }}>
              {'★★★★★'.split('').map((star, index) => {
                const value = index + 1
                const active = value <= Number(ratings[item._id] || 0)
                return (
                  <button
                    key={`${item._id || item.name}-star-${value}`}
                    type="button"
                    onClick={() => setRatings((prev) => ({ ...prev, [item._id]: value }))}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      color: active ? '#FFD166' : 'rgba(255,255,255,0.35)',
                      fontSize: 18,
                      lineHeight: '18px',
                    }}
                    aria-label={`Rate ${item.name}: ${value} star${value === 1 ? '' : 's'}`}
                  >
                    {star}
                  </button>
                )
              })}
              <span style={{ marginLeft: 10, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                {Number(ratings[item._id] || 0)}/5
              </span>
            </div>

            <div className="comment-box">
              <textarea placeholder="Share feedback or suggestions..." />
              <button
                onClick={() => {
                  const ratingValue = Number(ratings[item._id] || 0)
                  socket.emit('feedback-update', {
                    type: 'feedback',
                    message: `${item.name} feedback received live (${ratingValue}/5)`,
                  })
                }}
              >
                Submit Feedback
              </button>
            </div>

            <div className="feed-list">
              {events.slice(0, 2).map((event, index) => (
                <div key={`${event.message}-${index}`} className="feed-item">
                  <strong>Live</strong> <span>{event.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  )
}

/* ─── Menu Manager Page (Mess Owner) ─── */
function MenuManagerPage() {
  const { events } = useSocketLive()
  const [foodName, setFoodName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [quantity, setQuantity] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const [publishing, setPublishing] = useState(false)

  async function handlePublish() {
    setPublishing(true)
    try {
      await api.post('/auth/menu', {
        foodName,
        description,
        category,
        quantity,
        imageDataUrl: imagePreview, // may be null
      })
      // backend will broadcast menu-update so everyone sees it live
      setFoodName('')
      setDescription('')
      setCategory('')
      setQuantity('')
      setImagePreview(null)
    } catch (e) {
      // errors are handled silently for now; keep owner unblocked
      // console.error(e)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="content-grid">
      <section className="hero-card compact">
        <div>
          <p className="eyebrow">Menu management</p>
          <h2>Publish menus and react to live demand instantly.</h2>
          <p className="muted">Create entries, update stock, broadcast announcements, and manage the meal session from one place.</p>
        </div>
      </section>
      <section className="card-grid two-up">
        <div className="panel-card">
          <h3>Menu publisher</h3>
          <div className="form-stack">
            <input placeholder="Food name" value={foodName} onChange={(e) => setFoodName(e.target.value)} />
            <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
            <input placeholder="Available quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />

            <div style={{ display: 'grid', gap: 10 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Attach image (optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) {
                      setImagePreview(null)
                      return
                    }
                    const reader = new FileReader()
                    reader.onload = () => setImagePreview(String(reader.result))
                    reader.readAsDataURL(file)
                  }}
                />
              </label>

              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Menu attachment preview"
                  style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10 }}
                />
              )}
            </div>

            <button onClick={handlePublish} disabled={publishing}>
              {publishing ? 'Publishing…' : 'Publish live'}
            </button>
          </div>
        </div>
        <div className="panel-card">
          <h3>Live alerts</h3>
          <div className="alert-list">
            <div className="alert green">Average rating held above 4.2</div>
            <div className="alert yellow">Soup stock is running low</div>
            <div className="alert red">20 complaints in the last 10 minutes</div>
          </div>
          <div className="feed-list" style={{ marginTop: 14 }}>
            {events.slice(0, 3).map((event, index) => <div key={`${event.message}-${index}`} className="feed-item"><strong>Live</strong> <span>{event.message}</span></div>)}
          </div>
        </div>
      </section>
    </motion.div>
  )
}

/* ─── Staff View Page (Mess Owner) ─── */
function StaffPage() {
  const { events } = useSocketLive()

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="content-grid">
      <section className="hero-card compact">
        <div>
          <p className="eyebrow">Staff control center</p>
          <h2>Monitor operations, alerts, and staff performance.</h2>
          <p className="muted">Track live complaints, supply levels, and staff responsiveness across active sessions.</p>
        </div>
      </section>
      <section className="card-grid two-up">
        <div className="panel-card">
          <div className="panel-title-row"><Users size={18} /><h3>Staff on duty</h3></div>
          <ul className="metric-list">
            <li><span>Kitchen staff</span><strong>8 active</strong></li>
            <li><span>Serving staff</span><strong>4 active</strong></li>
            <li><span>Supervisors</span><strong>2 on-site</strong></li>
          </ul>
        </div>
        <div className="panel-card">
          <div className="panel-title-row"><ShieldCheck size={18} /><h3>Alerts & flags</h3></div>
          <div className="alert-list">
            <div className="alert green">All hygiene checks passed ✓</div>
            <div className="alert yellow">Break room capacity at 90%</div>
            <div className="alert red">Staff member delayed for shift</div>
          </div>
        </div>
        <div className="panel-card" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-title-row"><MessageCircleHeart size={18} /><h3>Recent feedback stream</h3></div>
          <div className="feed-list">
            <div className="feed-item"><strong>Riya</strong> <span>Rice is a little hard today. 😕</span></div>
            <div className="feed-item"><strong>Arjun</strong> <span>The paneer is amazing. 🍽️</span></div>
            {events.slice(0, 4).map((event, index) => <div key={`${event.message}-${index}`} className="feed-item"><strong>Live</strong> <span>{event.message}</span></div>)}
          </div>
        </div>
      </section>
    </motion.div>
  )
}

/* ─── Live Feed Page (Mess Owner) ─── */
function LiveFeedPage() {
  const { events } = useSocketLive()

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="content-grid">
      <section className="panel-card wide">
        <div className="panel-title-row"><MessageCircleHeart size={18} /><h3>Live discussion stream</h3></div>
        <div className="feed-list large">
          <div className="feed-item"><strong>Riya</strong> <span>Rice is a little hard today. 😕</span></div>
          <div className="feed-item"><strong>Staff</strong> <span>We have prepared a fresh batch and will replenish shortly.</span></div>
          <div className="feed-item"><strong>Arjun</strong> <span>The paneer is amazing. 🍽️</span></div>
          {events.map((event, index) => <div key={`${event.message}-${index}`} className="feed-item"><strong>Live</strong> <span>{event.message}</span></div>)}
        </div>
      </section>
    </motion.div>
  )
}

/* ─── App with role-based routing ─── */
function App() {
  const { isAuthenticated, role } = useAuth()

  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={
        isAuthenticated
          ? <Navigate to={role === 'student' ? '/student/feedback' : '/owner/overview'} replace />
          : <LoginPage />
      } />

      {/* Student routes */}
      <Route path="/student/feedback" element={
        <ProtectedRoute allowedRoles={['student']}>
          <AppShell><StudentFeedbackPage /></AppShell>
        </ProtectedRoute>
      } />

      {/* Mess Owner routes */}
      <Route path="/owner/overview" element={
        <ProtectedRoute allowedRoles={['mess_owner']}>
          <AppShell><OverviewPage /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/owner/menu" element={
        <ProtectedRoute allowedRoles={['mess_owner']}>
          <AppShell><MenuManagerPage /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/owner/staff" element={
        <ProtectedRoute allowedRoles={['mess_owner']}>
          <AppShell><StaffPage /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/owner/live" element={
        <ProtectedRoute allowedRoles={['mess_owner']}>
          <AppShell><LiveFeedPage /></AppShell>
        </ProtectedRoute>
      } />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App

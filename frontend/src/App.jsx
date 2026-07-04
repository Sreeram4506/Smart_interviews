import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, UtensilsCrossed, BarChart3, Bell, ShieldCheck, MessageCircleHeart, Users, LogOut, ChefHat, GraduationCap, ChevronDown, ChevronUp, CalendarDays } from 'lucide-react'
import { useSocketLive } from './hooks/useSocketLive'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import socket from './lib/socket'
import api from './lib/api'
import './App.css'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts'

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
  const [feedback, setFeedback] = useState([])
  const [loadingFeedback, setLoadingFeedback] = useState(true)
  const [openFeedbackId, setOpenFeedbackId] = useState(null)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const { data } = await api.get('/feedback')
        if (mounted) setFeedback(data.feedback || [])
      } catch {
        if (mounted) setFeedback([])
      } finally {
        if (mounted) setLoadingFeedback(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const feedbackStats = useMemo(() => {
    const total = feedback.length
    const average = total
      ? (feedback.reduce((sum, item) => sum + Number(item.rating || 0), 0) / total).toFixed(1)
      : '0.0'

    return { total, average }
  }, [feedback])

  const sortedFeedback = useMemo(() => {
    return [...feedback].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [feedback])

  const ratingChartData = useMemo(() => {
    return [5, 4, 3, 2, 1].map((rating) => ({
      rating: `${rating}★`,
      count: feedback.filter((item) => Number(item.rating) === rating).length,
    }))
  }, [feedback])

  const reviewDayData = useMemo(() => {
    const buckets = new Map()
    const labels = []

    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const label = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      buckets.set(label, 0)
      labels.push(label)
    }

    feedback.forEach((item) => {
      const label = new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      if (buckets.has(label)) buckets.set(label, buckets.get(label) + 1)
    })

    return labels.map((label) => ({ label, count: buckets.get(label) || 0 }))
  }, [feedback])

  const latestFeedbackRows = useMemo(() => sortedFeedback.slice(0, 5), [sortedFeedback])

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
            <span>Reviews logged</span>
            <strong>{feedbackStats.total}</strong>
          </div>
          <div className="stat-card">
            <span>Avg. rating</span>
            <strong>{feedbackStats.average}/5</strong>
          </div>
          <div className="stat-card">
            <span>Open reviews</span>
            <strong>{feedbackStats.total}</strong>
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
          <div className="panel-title-row"><MessageCircleHeart size={18} /><h3>Student reviews by date</h3></div>
          <div className="feedback-list">
            {loadingFeedback ? (
              <p className="muted">Loading student reviews...</p>
            ) : sortedFeedback.length === 0 ? (
              <p className="muted">No student feedback has been submitted yet.</p>
            ) : (
              sortedFeedback.map((item) => {
                const isOpen = openFeedbackId === String(item._id)

                return (
                  <button
                    key={item._id}
                    type="button"
                    className={`feedback-item ${isOpen ? 'open' : ''}`}
                    onClick={() => setOpenFeedbackId(isOpen ? null : String(item._id))}
                  >
                    <div className="feedback-item-head">
                      <div>
                        <p className="feedback-meta">{item.studentName || item.studentUsername}</p>
                        <h4>{item.menuItemName}</h4>
                      </div>
                      <div className="feedback-item-right">
                        <span className="feedback-date">
                          {new Date(item.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                    <div className="star-row" aria-label={`Rating ${item.rating} out of 5`}>
                      {'★★★★★'.split('').map((star, index) => (
                        <span key={`${item._id}-star-${index}`} className={index < Number(item.rating) ? 'star active' : 'star'}>
                          {star}
                        </span>
                      ))}
                    </div>
                    {isOpen && (
                      <div className="feedback-body">
                        <p className="feedback-desc">{item.description || 'No written description was added.'}</p>
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </section>

      <section className="card-grid analytics-grid">
        <div className="panel-card wide">
          <div className="panel-title-row"><BarChart3 size={18} /><h3>Reviews by rating</h3></div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ratingChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="rating" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-title-row"><ShieldCheck size={18} /><h3>Rating split</h3></div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={ratingChartData} dataKey="count" nameKey="rating" innerRadius={72} outerRadius={100} paddingAngle={3}>
                  {ratingChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.rating}`}
                      fill={['#10b981', '#14b8a6', '#f59e0b', '#d97706', '#84cc16'][index]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-title-row"><CalendarDays size={18} /><h3>Reviews last 7 days</h3></div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={reviewDayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#14b8a6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-title-row"><Users size={18} /><h3>Latest reviews table</h3></div>
        <div className="table-wrap">
          <table className="reviews-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Meal</th>
                <th>Stars</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {latestFeedbackRows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="table-empty">No reviews yet.</td>
                </tr>
              ) : (
                latestFeedbackRows.map((item) => (
                  <tr key={item._id}>
                    <td>{new Date(item.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>{item.studentName || item.studentUsername}</td>
                    <td>{item.menuItemName}</td>
                    <td>{'★'.repeat(Number(item.rating || 0))}</td>
                    <td>{item.description || 'No description'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
  const [comments, setComments] = useState({})
  const [submitStatus, setSubmitStatus] = useState({})

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
                      color: active ? '#f59e0b' : '#cbd5e1',
                      fontSize: 18,
                      lineHeight: '18px',
                    }}
                    aria-label={`Rate ${item.name}: ${value} star${value === 1 ? '' : 's'}`}
                  >
                    {star}
                  </button>
                )
              })}
              <span style={{ marginLeft: 10, fontSize: 13, color: '#64748b' }}>
                {Number(ratings[item._id] || 0)}/5
              </span>
            </div>

            <div className="comment-box">
              <textarea
                placeholder="Share feedback or suggestions..."
                value={comments[item._id] || ''}
                onChange={(e) => setComments((prev) => ({ ...prev, [item._id]: e.target.value }))}
              />
              <button
                disabled={!Number(ratings[item._id] || 0)}
                onClick={async () => {
                  const ratingValue = Number(ratings[item._id] || 0)
                  const description = comments[item._id] || ''
                  try {
                    await api.post('/feedback', {
                      menuItemId: item._id,
                      menuItemName: item.name,
                      rating: ratingValue,
                      description,
                    })
                    setComments((prev) => ({ ...prev, [item._id]: '' }))
                    setSubmitStatus((prev) => ({ ...prev, [item._id]: 'Feedback submitted successfully.' }))
                  } catch {
                    // keep the UI usable even if the network is temporarily unavailable
                    setSubmitStatus((prev) => ({ ...prev, [item._id]: 'Unable to submit right now. Please try again.' }))
                  }
                }}
              >
                Submit Feedback
              </button>
            </div>

            {submitStatus[item._id] && <p className="submit-status">{submitStatus[item._id]}</p>}
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
  const [menus, setMenus] = useState([])
  const [loadingMenus, setLoadingMenus] = useState(true)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const { data } = await api.get('/auth/menu')
        if (mounted) setMenus(data.menus || [])
      } catch {
        if (mounted) setMenus([])
      } finally {
        if (mounted) setLoadingMenus(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const lastMenuEvent = events
      .slice()
      .reverse()
      .find((e) => e?.type === 'menu' && e?.menu)

    if (lastMenuEvent?.menu) {
      setMenus((prev) => {
        const nextMenu = lastMenuEvent.menu
        const exists = prev.some((menu) => String(menu._id) === String(nextMenu._id || nextMenu.id))
        if (exists) {
          return prev.map((menu) => (String(menu._id) === String(nextMenu._id || nextMenu.id) ? nextMenu : menu))
        }
        return [nextMenu, ...prev]
      })
    }
  }, [events])

  async function handlePublish() {
    setPublishing(true)
    try {
      const { data } = await api.post('/auth/menu', {
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
      if (data?.menu) {
        setMenus((prev) => {
          const exists = prev.some((menu) => String(menu._id) === String(data.menu._id))
          if (exists) return prev.map((menu) => (String(menu._id) === String(data.menu._id) ? data.menu : menu))
          return [data.menu, ...prev]
        })
      }
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
                <span style={{ fontSize: 13, color: '#64748b' }}>Attach image (optional)</span>
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
        <div className="panel-card wide">
          <div className="panel-title-row">
            <UtensilsCrossed size={18} />
            <h3>All menu items</h3>
          </div>
          {loadingMenus ? (
            <p className="muted">Loading menu items...</p>
          ) : menus.length === 0 ? (
            <p className="muted">No menu items have been published yet.</p>
          ) : (
            <div className="menu-card-grid">
              {menus.map((item) => (
                <article key={item._id} className="menu-summary-card">
                  <div className="menu-summary-top">
                    <div>
                      <p className="feedback-meta">{new Date(item.createdAt).toLocaleDateString('en-IN')}</p>
                      <h4>{item.name}</h4>
                    </div>
                    <span className={`badge ${Number(item.quantity || 0) > 0 ? 'live' : 'limited'}`}>
                      {Number(item.quantity || 0) > 0 ? 'Live' : 'Limited'}
                    </span>
                  </div>
                  <div className="menu-summary-meta">
                    <span>{item.category || 'Uncategorized'}</span>
                    <span>Qty {item.quantity || '0'}</span>
                  </div>
                  <p className="feedback-desc">{item.description || 'No description'}</p>
                </article>
              ))}
            </div>
          )}
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

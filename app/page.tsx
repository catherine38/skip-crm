'use client'

import { useEffect, useMemo, useState } from 'react'

type Lead = {
  id?: string
  status: 'Lead' | 'Quote' | 'Follow-up' | 'Won' | 'Lost'
  created_at?: string
  dateWon?: string | null
  nextActionDate?: string | null
  name: string
  company: string
  phone: string
  email: string
  skip_size: string
  eircode: string
  quoteValue: number | null
  source: string
  lossReason: string
  notes: string
  updated_at?: string
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const statuses = ['Lead', 'Quote', 'Follow-up', 'Won', 'Lost'] as const
const skipSizes = ['Mini', 'Midi', '4', '7', '12', '14', '20', '30', '40']
const leadSources = [   'Phone',   'Email',   'Website',   'Facebook',   'Instagram',   'Google',   'Referral',   'Returning Customer', ]
const lossReasons = ['Price too high', 'Went with competitor', 'No longer needed', 'No access / permit issue', 'Outside delivery area', 'Other']

const today = new Date().toISOString().slice(0, 10)

function addDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function nextAction(status: Lead['status']) {
  if (status === 'Lead') return addDays(1)
  if (status === 'Quote') return addDays(2)
  if (status === 'Follow-up') return addDays(3)
  return null
}

function emptyLead(): Lead {
  return {
    status: 'Lead',
    dateWon: null,
    nextActionDate: nextAction('Lead'),
    name: '',
    company: '',
    phone: '',
    email: '',
    skip_size: '',
    eircode: '',
    quoteValue: null,
    source: 'Phone',
    lossReason: '',
    notes: '',
    updated_at: new Date().toISOString(),
  }
}

function money(v: number | null | undefined) {
  return `€${Number(v || 0).toLocaleString('en-IE')}`
}

export default function Page() {
  const [session, setSession] = useState<any>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [leads, setLeads] = useState<Lead[]>([])
  const [form, setForm] = useState<Lead>(emptyLead())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
const [search, setSearch] = useState('')
  const headers = useMemo(() => ({
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${session?.access_token || SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }), [session])

  async function login() {
    setLoginError('')
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    })

    const data = await res.json()
    if (!res.ok) {
      setLoginError(data.error_description || data.msg || 'Login failed')
      return
    }

    setSession(data)
  }

  async function loadLeads() {
    setLoading(true)
    setMessage('Loading leads...')

    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=*&order=created_at.desc`, {
      headers,
    })

    const data = await res.json()

    if (!res.ok) {
      setMessage(`Load failed: ${data.message || res.status}`)
      setLoading(false)
      return
    }

    setLeads(data)
    setMessage('Leads loaded')
    setLoading(false)
  }

  async function addLead() {
    if (!form.name.trim()) {
      setMessage('Customer name is required')
      return
    }

    const payload = {
      ...form,
      updated_at: new Date().toISOString(),
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      setMessage(`Save failed: ${data.message || res.status}`)
      return
    }

    setForm(emptyLead())
    setMessage('Lead saved')
    await loadLeads()
  }

  async function updateLead(lead: Lead, field: keyof Lead, value: any) {
    if (!lead.id) return

    const updated: Lead = {
      ...lead,
      [field]: value,
      updated_at: new Date().toISOString(),
    }

    if (field === 'status') {
      updated.nextActionDate = nextAction(value)
      updated.dateWon = value === 'Won' ? today : null
      if (value !== 'Lost') updated.lossReason = ''
    }

    setLeads(leads.map((l) => (l.id === lead.id ? updated : l)))

    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${lead.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updated),
    })

    if (!res.ok) {
      const data = await res.json()
      setMessage(`Update failed: ${data.message || res.status}`)
      return
    }

    setMessage('Updated')
  }

  useEffect(() => {
    if (session) loadLeads()
  }, [session])

  const filteredLeads = useMemo(() => {
  const q = search.toLowerCase().trim()

  if (!q) return leads

  return leads.filter((lead) =>
    [
      lead.name,
      lead.company,
      lead.phone,
      lead.email,
      lead.eircode,
      lead.skip_size,
      lead.source,
      lead.status,
    ]
      .join(' ')
      .toLowerCase()
      .includes(q)
  )
}, [leads, search])

const stats = useMemo(() => {
  const total = leads.length
  const won = leads.filter((l) => l.status === 'Won').length
  const lost = leads.filter((l) => l.status === 'Lost').length
  const quoted = leads.filter((l) =>
    ['Quote', 'Follow-up', 'Won', 'Lost'].includes(l.status)
  ).length

  const quoteToWon = quoted
    ? Math.round((won / quoted) * 100)
    : 0

  return { total, won, lost, quoted, quoteToWon }
}, [leads])

  if (!session) {
    return (
      <main style={styles.loginPage}>
        <section style={styles.loginCard}>
          <h1>O&apos;Toole Skip CRM</h1>
          <p>Login with the Supabase user email and password.</p>

          <input style={styles.input} placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          <input style={styles.input} type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />

          {loginError && <p style={{ color: 'red' }}>{loginError}</p>}

          <button style={styles.button} onClick={login}>Login</button>
        </section>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <h1 style={styles.title}>O&apos;Toole Skip CRM</h1>
          <p style={styles.subtitle}>Marketing enquiry tracker and follow-up tool</p>
        </div>
        <button style={styles.lightButton} onClick={() => setSession(null)}>Logout</button>
      </section>

      <section style={styles.statsGrid}>
        <Stat label="Total Leads" value={stats.total} />
        <Stat label="Quoted" value={stats.quoted} />
        <Stat label="Won" value={stats.won} />
        <Stat label="Lost" value={stats.lost} />
        <Stat label="Quote → Won" value={`${stats.quoteToWon}%`} />
      </section>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Add New Lead</h2>

        <div style={styles.formGrid}>
          <input style={styles.input} placeholder="Customer Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input style={styles.input} placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <input style={styles.input} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input style={styles.input} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input style={styles.input} placeholder="Eircode" value={form.eircode} onChange={(e) => setForm({ ...form, eircode: e.target.value })} />
          <input style={styles.input} type="number" placeholder="Quote Value" value={form.quoteValue ?? ''} onChange={(e) => setForm({ ...form, quoteValue: e.target.value ? Number(e.target.value) : null })} />

          <select style={styles.input} value={form.skip_size} onChange={(e) => setForm({ ...form, skip_size: e.target.value })}>
            <option value="">Skip Size</option>
            {skipSizes.map((s) => <option key={s}>{s}</option>)}
          </select>

          <select style={styles.input} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
            {leadSources.map((s) => <option key={s}>{s}</option>)}
          </select>

          <button style={styles.button} onClick={addLead}>Add Lead</button>
        </div>

        <p>{message}</p>
      </section>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Live Leads</h2>
<input
  style={{ ...styles.input, marginBottom: 12, width: '100%' }}
  placeholder="Search customer, phone, email, Eircode, company..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Skip</th>
                <th style={styles.th}>Source</th>
                <th style={styles.th}>Quote</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Loss Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td style={styles.td}>   <input     style={styles.cellInput}     value={lead.name}     onChange={(e) => updateLead(lead, 'name', e.target.value)}   /> </td>
                  <td style={styles.td}>   <input     style={styles.cellInput}     value={lead.phone}     onChange={(e) => updateLead(lead, 'phone', e.target.value)}   /> </td>
                  <td style={styles.td}>   <input     style={styles.cellInput}     value={lead.email}     onChange={(e) => updateLead(lead, 'email', e.target.value)}   /> </td>
                  <td style={styles.td}>{lead.skip_size}</td>
                  <td style={styles.td}>{lead.source}</td>
                  <td style={styles.td}>   <input     style={styles.cellInput}     type="number"     value={lead.quoteValue ?? ''}     onChange={(e) =>       updateLead(         lead,         'quoteValue',         e.target.value ? Number(e.target.value) : null       )     }   /> </td>
                  <td style={styles.td}>
                    <select   style={{     ...styles.statusSelect,     background:       lead.status === 'Won' ? '#dcfce7' :       lead.status === 'Lost' ? '#fee2e2' :       lead.status === 'Follow-up' ? '#fef9c3' :       lead.status === 'Quote' ? '#dbeafe' :       '#f1f5f9',   }}   value={lead.status}   onChange={(e) => updateLead(lead, 'status', e.target.value)} >
                      {statuses.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={styles.td}>
                    {lead.status === 'Lost' ? (
                      <select value={lead.lossReason || ''} onChange={(e) => updateLead(lead, 'lossReason', e.target.value)}>
                        <option value="">Select</option>
                        {lossReasons.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    ) : ''}
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ ...styles.td, ...styles.empty }}>{loading ? 'Loading...' : 'No leads added yet.'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statLabel}>{label}</p>
      <p style={styles.statValue}>{value}</p>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  loginPage: { minHeight: '100vh', background: '#05224a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' },
  loginCard: { width: 380, background: 'white', padding: 24, borderRadius: 18, display: 'grid', gap: 12 },
  page: { minHeight: '100vh', background: '#f1f5f9', padding: 24, fontFamily: 'Arial, sans-serif' },
  header: { background: '#05224a', color: 'white', padding: 24, borderRadius: 18, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { margin: 0, fontSize: 32 },
  subtitle: { margin: '8px 0 0', color: '#cbd5e1' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 16, marginBottom: 20 },
  statCard: { background: 'white', padding: 18, borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  statLabel: { margin: 0, color: '#64748b', fontSize: 14 },
  statValue: { margin: '8px 0 0', fontSize: 34, fontWeight: 800, color: '#05224a' },
  card: { background: 'white', padding: 20, borderRadius: 16, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle: { marginTop: 0, color: '#05224a' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 },
  input: { padding: 10, borderRadius: 10, border: '1px solid #cbd5e1' },
  button: { padding: 10, borderRadius: 10, border: 'none', background: '#05224a', color: 'white', fontWeight: 700, cursor: 'pointer' },
  lightButton: { padding: '8px 14px', borderRadius: 10, border: '1px solid white', background: 'transparent', color: 'white', fontWeight: 700, cursor: 'pointer' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
  th: { textAlign: 'left', padding: 10, borderBottom: '2px solid #e2e8f0', color: '#05224a', fontSize: 14 },
  td: { padding: 10, borderBottom: '1px solid #e2e8f0', fontSize: 14, verticalAlign: 'top' },
  empty: { textAlign: 'center', padding: 20, color: '#64748b' },
  cellInput: {   width: '100%',   padding: 6,   borderRadius: 8,   border: '1px solid #cbd5e1', },
}

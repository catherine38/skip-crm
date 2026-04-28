'use client'

import { useMemo, useState } from 'react'

type Lead = {
  name: string
  phone: string
  email: string
  skipSize: string
  source: string
  status: 'Lead' | 'Quote' | 'Follow-up' | 'Won' | 'Lost'
}

const skipSizes = ['Mini', 'Midi', '4', '7', '12', '14', '20', '30', '40']
const leadSources = ['Phone', 'Website', 'Facebook', 'Walk-in']

export default function Page() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [form, setForm] = useState<Lead>({
    name: '',
    phone: '',
    email: '',
    skipSize: '',
    source: 'Phone',
    status: 'Lead',
  })

  const stats = useMemo(() => {
    const total = leads.length
    const won = leads.filter((l) => l.status === 'Won').length
    const lost = leads.filter((l) => l.status === 'Lost').length
    const followUps = leads.filter((l) => l.status === 'Follow-up').length
    return { total, won, lost, followUps }
  }, [leads])

  function addLead() {
    if (!form.name.trim()) return
    setLeads([form, ...leads])
    setForm({
      name: '',
      phone: '',
      email: '',
      skipSize: '',
      source: 'Phone',
      status: 'Lead',
    })
  }

  function updateStatus(index: number, status: Lead['status']) {
    const updated = [...leads]
    updated[index] = { ...updated[index], status }
    setLeads(updated)
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <h1 style={styles.title}>O&apos;Toole Skip CRM</h1>
          <p style={styles.subtitle}>Marketing enquiry tracker and follow-up tool</p>
        </div>
      </section>

      <section style={styles.statsGrid}>
        <Stat label="Total Leads" value={stats.total} />
        <Stat label="Won" value={stats.won} />
        <Stat label="Lost" value={stats.lost} />
        <Stat label="Follow-ups" value={stats.followUps} />
      </section>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Add New Lead</h2>

        <div style={styles.formGrid}>
          <input style={styles.input} placeholder="Customer Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input style={styles.input} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input style={styles.input} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

          <select style={styles.input} value={form.skipSize} onChange={(e) => setForm({ ...form, skipSize: e.target.value })}>
            <option value="">Skip Size</option>
            {skipSizes.map((size) => <option key={size}>{size}</option>)}
          </select>

          <select style={styles.input} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
            {leadSources.map((source) => <option key={source}>{source}</option>)}
          </select>

          <button style={styles.button} onClick={addLead}>Add Lead</button>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Live Leads</h2>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Skip</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, index) => (
                <tr key={`${lead.name}-${index}`}>
                  <td>{lead.name}</td>
                  <td>{lead.phone}</td>
                  <td>{lead.email}</td>
                  <td>{lead.skipSize}</td>
                  <td>{lead.source}</td>
                  <td>
                    <select value={lead.status} onChange={(e) => updateStatus(index, e.target.value as Lead['status'])}>
                      <option>Lead</option>
                      <option>Quote</option>
                      <option>Follow-up</option>
                      <option>Won</option>
                      <option>Lost</option>
                    </select>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={6} style={styles.empty}>No leads added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statLabel}>{label}</p>
      <p style={styles.statValue}>{value}</p>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f1f5f9', padding: 24, fontFamily: 'Arial, sans-serif' },
  header: { background: '#05224a', color: 'white', padding: 24, borderRadius: 18, marginBottom: 20 },
  title: { margin: 0, fontSize: 32 },
  subtitle: { margin: '8px 0 0', color: '#cbd5e1' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 20 },
  statCard: { background: 'white', padding: 18, borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  statLabel: { margin: 0, color: '#64748b', fontSize: 14 },
  statValue: { margin: '8px 0 0', fontSize: 34, fontWeight: 800, color: '#05224a' },
  card: { background: 'white', padding: 20, borderRadius: 16, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle: { marginTop: 0, color: '#05224a' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 },
  input: { padding: 10, borderRadius: 10, border: '1px solid #cbd5e1' },
  button: { padding: 10, borderRadius: 10, border: 'none', background: '#05224a', color: 'white', fontWeight: 700, cursor: 'pointer' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  empty: { textAlign: 'center', padding: 20, color: '#64748b' },
}

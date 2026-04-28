'use client'
import { useState } from 'react'

export default function Page() {
  const [leads, setLeads] = useState<any[]>([])
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    skipSize: '',
    status: 'Quoted'
  })

  const addLead = () => {
    if (!form.name) return
    setLeads([...leads, form])
    setForm({ name: '', phone: '', email: '', skipSize: '', status: 'Quoted' })
  }

  const updateStatus = (index: number, status: string) => {
    const updated = [...leads]
    updated[index].status = status
    setLeads(updated)
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>Skip CRM</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Customer Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <select
          value={form.skipSize}
          onChange={(e) => setForm({ ...form, skipSize: e.target.value })}
        >
          <option value="">Skip Size</option>
          <option>4 Yard</option>
          <option>6 Yard</option>
          <option>8 Yard</option>
          <option>20 Yard</option>
        </select>

        <button onClick={addLead}>Add Lead</button>
      </div>

      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Skip</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, i) => (
            <tr key={i}>
              <td>{lead.name}</td>
              <td>{lead.phone}</td>
              <td>{lead.email}</td>
              <td>{lead.skipSize}</td>
              <td>
                <select
                  value={lead.status}
                  onChange={(e) => updateStatus(i, e.target.value)}
                >
                  <option>Quoted</option>
                  <option>Won</option>
                  <option>Lost</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

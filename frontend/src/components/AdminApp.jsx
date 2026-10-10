import { useEffect, useMemo, useState } from 'react'
import motoXLogo from '../assets/motox-group.png'
import api from '../services/api.js'

const resources = {
  brands: {
    title: 'Brands',
    endpoint: '/api/brands',
    createLabel: 'Add brand',
    statuses: ['active', 'inactive'],
  },
  motorcycles: {
    title: 'Motorcycles',
    endpoint: '/api/motorcycles',
    createLabel: 'Add motorcycle',
    statuses: ['active', 'inactive'],
  },
  services: {
    title: 'Services',
    endpoint: '/api/services',
    createLabel: 'Add service',
    statuses: ['active', 'inactive'],
  },
  showrooms: {
    title: 'Showrooms',
    endpoint: '/api/showrooms',
    createLabel: 'Add showroom',
    statuses: ['active', 'inactive'],
  },
  enquiries: {
    title: 'Enquiries',
    endpoint: '/api/enquiries',
    statuses: ['pending', 'in_progress', 'resolved', 'closed'],
  },
  'test-rides': {
    title: 'Test rides',
    endpoint: '/api/test-rides',
    statuses: ['pending', 'confirmed', 'completed', 'cancelled'],
  },
  team: {
    title: 'Data Entry Users',
    endpoint: '/api/users',
    createLabel: 'Add Data Entry',
    statuses: [],
  },
}

const menuFor = (role) => {
  if (!['admin', 'data_entry'].includes(role)) return []
  return Object.keys(resources).filter((resource) => (
    (resource !== 'showrooms' || role === 'admin')
    && (resource !== 'team' || role === 'admin')
  ))
}

function responseMessage(error, fallback) {
  const errors = error.response?.data?.errors
  if (errors) return Object.values(errors).flat().join(' ')
  return error.response?.data?.message || fallback
}

function resourceFromPath(pathname) {
  const [, root, resource, id, mode] = pathname.split('/')
  if (root !== 'admin' || !resources[resource]) {
    return { resource: '', mode: 'dashboard', id: '' }
  }
  if (id === 'new') return { resource, mode: 'create', id: '' }
  if (id && mode === 'edit') return { resource, mode: 'edit', id }
  return { resource, mode: 'list', id: '' }
}

async function getAllPages(endpoint) {
  const first = await api.get(`${endpoint}?page=1`)
  const pages = Math.max(1, Number(first.data?.last_page) || 1)
  const remaining = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      api.get(`${endpoint}?page=${index + 2}`),
    ),
  )
  return [first, ...remaining].flatMap((response) =>
    Array.isArray(response.data) ? response.data : response.data?.data || [],
  )
}

function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true
    api.get('/api/user')
      .then(() => {
        if (current) window.location.replace('/admin')
      })
      .catch((requestError) => {
        if (current && requestError.response?.status !== 401) {
          setError(responseMessage(requestError, 'Unable to check the current session.'))
        }
      })
    return () => {
      current = false
    }
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return

    setSubmitting(true)
    setError('')
    try {
      await api.get('/sanctum/csrf-cookie')
      await api.post('/api/login', form)
      window.location.assign('/admin')
    } catch (requestError) {
      setError(responseMessage(requestError, 'Sign in failed. Check your details and try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-login-page">
      <a className="admin-logo" href="/">
        <img src={motoXLogo} alt="MotoX Group" width="1920" height="682" />
      </a>
      <form className="admin-panel admin-login-panel" onSubmit={submit}>
        <p className="eyebrow eyebrow-dark">Secure access</p>
        <h1>Sign in</h1>
        <label>
          Email address
          <input
            type="email"
            name="email"
            autoComplete="username"
            value={form.email}
            onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))}
            required
          />
        </label>
        {error && <p className="admin-notice error" role="alert">{error}</p>}
        <button className="button button-copper" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        <a className="admin-return" href="/">Return to MotoX Group</a>
      </form>
    </main>
  )
}

function AdminLayout({ user, children }) {
  const [loggingOut, setLoggingOut] = useState(false)
  const logout = async () => {
    setLoggingOut(true)
    try {
      await api.post('/api/logout')
      window.location.assign('/admin/login')
    } catch (error) {
      setLoggingOut(false)
      window.alert(responseMessage(error, 'Could not sign out. Please try again.'))
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <a className="admin-logo" href="/">
          <img src={motoXLogo} alt="MotoX Group" width="1920" height="682" />
        </a>
        <div className="admin-account">
          <span>{user.name} <small>{user.role === 'admin' ? 'Administrator' : 'Data Entry'}</small></span>
          <button type="button" onClick={logout} disabled={loggingOut}>
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </header>
      <div className="admin-frame">
        <nav className="admin-sidebar" aria-label="Administration">
          <p className="eyebrow">Workspace</p>
          {menuFor(user.role).map((resource) => (
            <a href={`/admin/${resource}`} key={resource}>
              {resources[resource].title}
            </a>
          ))}
          <a href="/">View public site ↗</a>
        </nav>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  )
}

function ResourceDashboard({ user }) {
  const resourcesForUser = useMemo(() => menuFor(user.role), [user.role])
  const [counts, setCounts] = useState({})

  useEffect(() => {
    let current = true
    const loadCounts = async () => {
      const entries = await Promise.all(resourcesForUser.map(async (resource) => {
        try {
          const response = await api.get(`${resources[resource].endpoint}?page=1`)
          const payload = response.data
          return [resource, {
            total: Number.isFinite(Number(payload?.total))
              ? Number(payload.total)
              : Array.isArray(payload)
                ? payload.length
                : Array.isArray(payload?.data)
                  ? payload.data.length
                  : null,
            error: '',
          }]
        } catch (error) {
          return [resource, {
            total: null,
            error: responseMessage(error, 'Count unavailable.'),
          }]
        }
      }))

      if (current) setCounts(Object.fromEntries(entries))
    }

    void loadCounts()
    return () => {
      current = false
    }
  }, [resourcesForUser])

  const [publicMotorcycleCount, setPublicMotorcycleCount] = useState({
    loading: true,
    total: null,
    error: '',
  })

  useEffect(() => {
    if (user.role !== 'admin') return undefined
    let current = true
    api.get('/api/public/motorcycles?page=1')
      .then(({ data }) => {
        if (current) {
          setPublicMotorcycleCount({
            loading: false,
            total: Number.isFinite(Number(data?.total))
              ? Number(data.total)
              : Array.isArray(data?.data)
                ? data.data.length
                : null,
            error: '',
          })
        }
      })
      .catch((error) => {
        if (current) {
          setPublicMotorcycleCount({
            loading: false,
            total: null,
            error: responseMessage(error, 'Public catalog count unavailable.'),
          })
        }
      })
    return () => {
      current = false
    }
  }, [user.role])

  return (
    <section className="admin-dashboard">
      <p className="eyebrow eyebrow-dark">MotoX Group</p>
      <h1>Content workspace</h1>
      <p>Manage the MotoX catalog and review customer requests.</p>
      <div className="admin-dashboard-grid">
        {resourcesForUser.map((resource) => (
          <a className="admin-dashboard-card" href={`/admin/${resource}`} key={resource}>
            <span className="dashboard-card-title">{resources[resource].title}</span>
            <span className="dashboard-card-count" aria-live="polite">
              {counts[resource]?.total == null
                ? counts[resource]?.error ? 'Unavailable' : 'Loading…'
                : `${counts[resource].total} total`}
              {counts[resource]?.error && (
                <small role="status">{counts[resource].error}</small>
              )}
              {resource === 'motorcycles' && user.role === 'admin' && (
                <small>
                  {publicMotorcycleCount.total == null
                    ? publicMotorcycleCount.loading
                      ? 'Public: loading…'
                      : `Public: unavailable. ${publicMotorcycleCount.error}`
                    : `Public: ${publicMotorcycleCount.total}`}
                </small>
              )}
            </span>
            <span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </section>
  )
}

function TeamManagement() {
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(() => {
    const storedNotice = sessionStorage.getItem('team-management-notice')
    if (storedNotice) sessionStorage.removeItem('team-management-notice')
    return storedNotice || ''
  })
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let current = true
    getAllPages('/api/users')
      .then((data) => {
        if (current) {
          setUsers(data)
          setLoading(false)
        }
      })
      .catch((requestError) => {
        if (current) {
          setError(responseMessage(requestError, 'Data Entry accounts could not be loaded.'))
          setLoading(false)
        }
      })
    return () => {
      current = false
    }
  }, [refresh])

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    if (!term) return users
    return users.filter((user) =>
      `${user.name} ${user.email}`.toLocaleLowerCase().includes(term),
    )
  }, [query, users])

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete Data Entry account ${user.name} (${user.email})? This cannot be undone.`)) {
      return
    }
    setError('')
    setNotice('')
    try {
      await api.delete(`/api/users/${user.id}`)
      setNotice(`${user.name} was deleted.`)
      setRefresh((value) => value + 1)
    } catch (requestError) {
      setError(responseMessage(requestError, 'This account could not be deleted.'))
    }
  }

  return (
    <section className="admin-list-page">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow eyebrow-dark">Administration</p>
          <h1>Team management</h1>
        </div>
        <a className="button button-copper" href="/admin/team/new">
          Add Data Entry <span aria-hidden="true">+</span>
        </a>
      </div>
      <label className="team-search">
        <span className="visually-hidden">Search team by name or email</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name or email"
        />
      </label>
      {notice && <p className="admin-notice success" role="status">{notice}</p>}
      {error && <p className="admin-notice error" role="alert">{error}</p>}
      {loading && <p className="admin-notice" role="status">Loading Data Entry accounts…</p>}
      {!loading && !error && filteredUsers.length === 0 && (
        <p className="admin-empty">
          {query ? 'No team members match that search.' : 'No Data Entry accounts yet. Add a team member to get started.'}
        </p>
      )}
      {!loading && filteredUsers.length > 0 && (
        <div className="team-table-wrap">
          <table className="team-table">
            <thead>
              <tr>
                <th scope="col">Team member</th>
                <th scope="col">Assigned brands</th>
                <th scope="col">Added</th>
                <th scope="col"><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((member) => (
                <tr key={member.id}>
                  <td data-label="Team member">
                    <strong>{member.name}</strong>
                    <span>{member.email}</span>
                  </td>
                  <td data-label="Assigned brands">
                    <div className="team-brand-list">
                      {member.brands?.length
                        ? member.brands.map((brand) => <span key={brand.id}>{brand.name}</span>)
                        : <span className="team-unassigned">No brands assigned</span>}
                    </div>
                  </td>
                  <td data-label="Added">
                    {member.created_at ? new Date(member.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="team-actions" data-label="Actions">
                    <a href={`/admin/team/${member.id}/edit`}>Edit</a>
                    <button type="button" onClick={() => deleteUser(member)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function TeamEditor({ userId }) {
  const editing = Boolean(userId)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    brand_ids: [],
  })
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true
    const requests = [
      getAllPages('/api/brands').then((data) => {
        if (current) setBrands(data)
      }),
    ]
    if (editing) {
      requests.push(
        api.get(`/api/users/${userId}`).then(({ data }) => {
          if (current) {
            setForm({
              name: data.name,
              email: data.email,
              password: '',
              password_confirmation: '',
              brand_ids: data.brands.map((brand) => Number(brand.id)),
            })
          }
        }),
      )
    }
    Promise.all(requests)
      .catch((requestError) => {
        if (current) setError(responseMessage(requestError, 'The team form could not be loaded.'))
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [editing, userId])

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const toggleBrand = (brandId) => {
    const id = Number(brandId)
    setForm((current) => ({
      ...current,
      brand_ids: current.brand_ids.includes(id)
        ? current.brand_ids.filter((assignedId) => assignedId !== id)
        : [...current.brand_ids, id],
    }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return
    if (!form.brand_ids.length) {
      setError('Select at least one brand for this Data Entry account.')
      return
    }
    if (!editing && form.password !== form.password_confirmation) {
      setError('The password confirmation does not match.')
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      brand_ids: form.brand_ids,
    }
    if (!editing) {
      payload.password = form.password
      payload.password_confirmation = form.password_confirmation
    }
    try {
      if (editing) await api.put(`/api/users/${userId}`, payload)
      else await api.post('/api/users', payload)
    } catch (requestError) {
      setError(responseMessage(requestError, 'The team account could not be saved.'))
      setSaving(false)
      return
    }
    try {
      sessionStorage.setItem(
        'team-management-notice',
        editing ? 'Data Entry account updated successfully.' : 'Data Entry account created successfully.',
      )
    } catch {
      window.location.assign('/admin/team')
      return
    }
    window.location.assign('/admin/team')
  }

  if (loading) return <p className="admin-notice" role="status">Loading team form…</p>

  return (
    <section className="admin-editor-page">
      <a className="admin-back" href="/admin/team">← Back to team</a>
      <p className="eyebrow eyebrow-dark">Administration</p>
      <h1>{editing ? 'Edit Data Entry' : 'Add Data Entry'}</h1>
      <form className="admin-form team-editor-form" onSubmit={submit}>
        <label>
          Full name
          <input
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            maxLength="255"
            required
          />
        </label>
        <label>
          Email address
          <input
            type="email"
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            maxLength="255"
            required
          />
        </label>
        {!editing && (
          <>
            <label>
              Temporary password
              <input
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
                minLength="8"
                required
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                value={form.password_confirmation}
                onChange={(event) => update('password_confirmation', event.target.value)}
                minLength="8"
                required
              />
            </label>
          </>
        )}
        <fieldset className="admin-brand-associations admin-field-wide">
          <legend>Assigned brands <span aria-hidden="true">*</span></legend>
          {!brands.length && <p className="admin-notice">Create a brand before assigning a Data Entry account.</p>}
          {brands.map((brand) => (
            <label key={brand.id}>
              <input
                type="checkbox"
                checked={form.brand_ids.includes(Number(brand.id))}
                onChange={() => toggleBrand(brand.id)}
              />
              {brand.name}
            </label>
          ))}
        </fieldset>
        {error && <p className="admin-notice error admin-field-wide" role="alert">{error}</p>}
        <div className="admin-form-actions admin-field-wide">
          <button className="button button-copper" type="submit" disabled={saving || !brands.length}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create Data Entry'}
          </button>
          <a className="admin-cancel" href="/admin/team">Cancel</a>
        </div>
      </form>
    </section>
  )
}

function AdminList({ resource, user }) {
  const config = resources[resource]
  const [page, setPage] = useState(1)
  const [listState, setListState] = useState({ key: '', response: null, error: '' })
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const isAdmin = user.role === 'admin'
  const canCreate = ['brands', 'motorcycles', 'services', 'showrooms'].includes(resource)
    && (isAdmin || resource !== 'brands')
  const requestKey = `${resource}:${page}:${refresh}`
  const loading = listState.key !== requestKey
  const response = loading ? null : listState.response
  const error = loading ? '' : listState.error

  useEffect(() => {
    let current = true
    api.get(`${config.endpoint}?page=${page}`)
      .then((result) => {
        if (current) {
          setListState({ key: requestKey, response: result.data, error: '' })
        }
      })
      .catch((requestError) => {
        if (current) {
          setListState({
            key: requestKey,
            response: null,
            error: responseMessage(requestError, 'This list could not be loaded.'),
          })
        }
      })
    return () => {
      current = false
    }
  }, [config.endpoint, page, refresh, requestKey])

  const records = Array.isArray(response) ? response : response?.data || []
  const currentPage = Number(response?.current_page) || page
  const lastPage = Number(response?.last_page) || 1

  const removeRecord = async (record) => {
    if (!window.confirm(`Delete this ${config.title.toLowerCase().replace(/s$/, '')}? This action cannot be undone.`)) {
      return
    }
    setActionError('')
    setNotice('')
    try {
      await api.delete(`${config.endpoint}/${record.id}`)
      setNotice('The record was deleted.')
      setRefresh((value) => value + 1)
    } catch (requestError) {
      setActionError(responseMessage(requestError, 'The record could not be deleted.'))
    }
  }

  return (
    <section className="admin-list-page">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow eyebrow-dark">Content management</p>
          <h1>{config.title}</h1>
        </div>
        {canCreate && (
          <a className="button button-copper" href={`/admin/${resource}/new`}>
            {config.createLabel} <span aria-hidden="true">+</span>
          </a>
        )}
      </div>
      {notice && <p className="admin-notice success" role="status">{notice}</p>}
      {(error || actionError) && (
        <p className="admin-notice error" role="alert">{error || actionError}</p>
      )}
      {loading && <p className="admin-notice" role="status">Loading {config.title.toLowerCase()}…</p>}
      {!loading && !error && records.length === 0 && (
        <p className="admin-empty">No records are available.</p>
      )}
      {!loading && records.length > 0 && (
        <>
          <div className="admin-record-list">
            {records.map((record) => (
              <AdminRecord
                key={record.id}
                record={record}
                resource={resource}
                canEdit={['brands', 'motorcycles', 'services', 'showrooms'].includes(resource)}
                canDelete={isAdmin && ['brands', 'motorcycles', 'services', 'showrooms', 'enquiries', 'test-rides'].includes(resource)}
                onDelete={() => removeRecord(record)}
                onChange={() => {
                  setActionError('')
                  setNotice('')
                  setRefresh((value) => value + 1)
                }}
                onError={setActionError}
              />
            ))}
          </div>
          {lastPage > 1 && (
            <div className="admin-pagination">
              <button type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => value - 1)}>
                Previous
              </button>
              <span>Page {currentPage} of {lastPage}</span>
              <button type="button" disabled={currentPage >= lastPage} onClick={() => setPage((value) => value + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function recordSummary(record, resource) {
  if (resource === 'brands') {
    return [record.slug, record.description].filter(Boolean).join(' · ')
  }
  if (resource === 'motorcycles') {
    return [
      record.brand?.name,
      record.category,
      record.price != null
        ? new Intl.NumberFormat('en-QA', {
          style: 'currency',
          currency: 'QAR',
        }).format(Number(record.price))
        : 'Contact for price',
    ].filter(Boolean).join(' · ')
  }
  if (resource === 'services') {
    return [record.brand?.name || 'Group-wide', record.description].filter(Boolean).join(' · ')
  }
  if (resource === 'showrooms') {
    return [record.type, record.address, record.phone].filter(Boolean).join(' · ')
  }
  if (resource === 'enquiries') {
    return [
      record.customer_email,
      record.customer_phone,
      record.motorcycle?.name,
      record.type,
      record.message,
    ].filter(Boolean).join(' · ')
  }
  return [
    record.customer_email,
    record.customer_phone,
    record.motorcycle?.name,
    record.showroom?.city,
    record.ride_date,
    record.ride_time,
    record.notes,
  ].filter(Boolean).join(' · ')
}

function AdminRecord({
  record,
  resource,
  canEdit,
  canDelete,
  onDelete,
  onChange,
  onError,
}) {
  const config = resources[resource]
  const [status, setStatus] = useState(record.status || config.statuses[0])
  const [notes, setNotes] = useState(record.notes || '')
  const [saving, setSaving] = useState(false)
  const title = resource === 'showrooms'
    ? record.city
    : resource === 'enquiries'
      ? record.customer_name
      : resource === 'test-rides'
        ? record.customer_name
        : record.name

  const saveStatus = async (event) => {
    event.preventDefault()
    setSaving(true)
    onError('')
    try {
      const payload = resource === 'test-rides'
        ? { status, notes }
        : { status }
      await api.patch(`${config.endpoint}/${record.id}`, payload)
      onChange()
    } catch (requestError) {
      onError(responseMessage(requestError, 'The status could not be updated.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="admin-record">
      <div className="admin-record-copy">
        <h2>{title || `Record ${record.id}`}</h2>
        <p>{recordSummary(record, resource) || 'No additional details.'}</p>
      </div>
      <span className={`status-tag status-${record.status || 'unknown'}`}>
        {(record.status || 'unknown').replace('_', ' ')}
      </span>
      <div className="admin-record-actions">
        {canEdit && (
          <a className="admin-inline-link" href={`/admin/${resource}/${record.id}/edit`}>Edit</a>
        )}
        {config.statuses.length > 0 && (
          <form className="admin-status-form" onSubmit={saveStatus}>
            <label>
              <span className="visually-hidden">Update status for {title || 'record'}</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                {config.statuses.map((item) => (
                  <option key={item} value={item}>{item.replace('_', ' ')}</option>
                ))}
              </select>
            </label>
            {resource === 'test-rides' && (
              <label>
                <span className="visually-hidden">Test ride notes</span>
                <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes" />
              </label>
            )}
            <button type="submit" disabled={saving || (status === record.status && notes === (record.notes || ''))}>
              {saving ? 'Saving…' : 'Save status'}
            </button>
          </form>
        )}
        {canDelete && (
          <button className="admin-delete" type="button" onClick={onDelete}>Delete</button>
        )}
      </div>
    </article>
  )
}

function TextField({ label, name, value, onChange, required, maxLength, type = 'text', min, step, placeholder }) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        maxLength={maxLength}
        min={min}
        step={step}
        placeholder={placeholder}
      />
    </label>
  )
}

function TextAreaField({ label, name, value, onChange }) {
  return (
    <label className="admin-field-wide">
      {label}
      <textarea name={name} rows="4" value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function AdminEditor({ resource, recordId, user }) {
  const config = resources[resource]
  const isEdit = Boolean(recordId)
  const isAdmin = user.role === 'admin'
  const needsBrandChoices = ['motorcycles', 'services', 'showrooms'].includes(resource)
  const [record, setRecord] = useState(() => isEdit ? null : {
    name: '',
    slug: '',
    city: '',
    address: '',
    type: resource === 'showrooms' ? 'showroom' : '',
    category: '',
    brand_id: '',
    brand_ids: [],
    status: 'active',
    price: '',
    description: '',
    image: '',
    phone: '',
    opening_hours: '',
  })
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(isEdit || needsBrandChoices)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true
    const tasks = []
    if (isEdit) {
      tasks.push(api.get(`${config.endpoint}/${recordId}`).then(({ data }) => {
        if (current) {
          setRecord({
            ...data,
            price: data.price ?? '',
            brand_id: data.brand_id ?? data.brand?.id ?? '',
            brand_ids: data.brand_ids || data.brands?.map((brand) => brand.id) || [],
          })
        }
      }))
    }

    if (needsBrandChoices) {
      tasks.push(getAllPages('/api/brands').then((data) => {
        if (current) setBrands(data)
      }))
    }

    Promise.all(tasks)
      .catch((requestError) => {
        if (current) setError(responseMessage(requestError, 'The form data could not be loaded.'))
      })
      .finally(() => {
        if (current) setLoading(false)
      })

    return () => {
      current = false
    }
  }, [config.endpoint, isEdit, needsBrandChoices, recordId, resource])

  const update = (name, value) => {
    setRecord((current) => {
      const next = { ...current, [name]: value }
      if (name === 'name' && resource === 'brands' && !current.slug) {
        next.slug = value.toLocaleLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      }
      return next
    })
  }

  const toggleBrand = (id) => {
    setRecord((current) => ({
      ...current,
      brand_ids: current.brand_ids.includes(Number(id))
        ? current.brand_ids.filter((item) => item !== Number(id))
        : [...current.brand_ids, Number(id)],
    }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return
    if (resource === 'showrooms' && record.brand_ids.length === 0) {
      setError('Associate this location with at least one brand.')
      return
    }
    setSaving(true)
    setError('')
    const payload = { status: record.status }

    if (resource === 'brands') {
      Object.assign(payload, {
        name: record.name.trim(),
        slug: record.slug.trim(),
        description: record.description || null,
        image: record.image || null,
      })
    } else if (resource === 'motorcycles') {
      Object.assign(payload, {
        brand_id: Number(record.brand_id),
        name: record.name.trim(),
        category: record.category.trim(),
        description: record.description || null,
        price: record.price === '' ? null : Number(record.price),
        image: record.image || null,
      })
    } else if (resource === 'services') {
      Object.assign(payload, {
        name: record.name.trim(),
        brand_id: record.brand_id === '' ? null : Number(record.brand_id),
        description: record.description || null,
        image: record.image || null,
      })
    } else if (resource === 'showrooms') {
      Object.assign(payload, {
        city: record.city.trim(),
        address: record.address.trim(),
        phone: record.phone || null,
        type: record.type,
        opening_hours: record.opening_hours || null,
        image: record.image || null,
        brand_ids: record.brand_ids,
      })
    }

    try {
      if (isEdit) await api.put(`${config.endpoint}/${recordId}`, payload)
      else await api.post(config.endpoint, payload)
      window.location.assign(`/admin/${resource}`)
    } catch (requestError) {
      setError(responseMessage(requestError, 'The changes could not be saved.'))
    } finally {
      setSaving(false)
    }
  }

  const title = `${isEdit ? 'Edit' : 'Add'} ${config.title.replace(/s$/, '')}`
  if (loading) return <p className="admin-notice" role="status">Loading form…</p>
  if (!record) {
    return (
      <div>
        {error && <p className="admin-notice error" role="alert">{error}</p>}
        <a href={`/admin/${resource}`}>Back to {config.title}</a>
      </div>
    )
  }

  return (
    <section className="admin-editor-page">
      <a className="admin-back" href={`/admin/${resource}`}>← Back to {config.title}</a>
      <p className="eyebrow eyebrow-dark">Content management</p>
      <h1>{title}</h1>
      <form className="admin-form" onSubmit={submit}>
        {resource === 'brands' && (
          <>
            <TextField label="Brand name" name="name" value={record.name} onChange={(value) => update('name', value)} required maxLength="255" />
            <TextField label="Slug" name="slug" value={record.slug} onChange={(value) => update('slug', value)} required maxLength="255" />
            <TextAreaField label="Description" name="description" value={record.description} onChange={(value) => update('description', value)} />
            <TextField label="Image URL or path" name="image" value={record.image} onChange={(value) => update('image', value)} maxLength="255" />
          </>
        )}
        {resource === 'motorcycles' && (
          <>
            <label>
              Brand
              <select value={record.brand_id} onChange={(event) => update('brand_id', event.target.value)} required>
                <option value="" disabled>Select a brand</option>
                {brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}
              </select>
            </label>
            <TextField label="Motorcycle name" name="name" value={record.name} onChange={(value) => update('name', value)} required maxLength="255" />
            <TextField label="Category" name="category" value={record.category} onChange={(value) => update('category', value)} required maxLength="100" />
            <TextField label="Price" name="price" value={record.price} onChange={(value) => update('price', value)} type="number" min="0" step="0.01" />
            <TextAreaField label="Description" name="description" value={record.description} onChange={(value) => update('description', value)} />
            <TextField label="Image URL or path" name="image" value={record.image} onChange={(value) => update('image', value)} maxLength="255" />
          </>
        )}
        {resource === 'services' && (
          <>
            <TextField label="Service name" name="name" value={record.name} onChange={(value) => update('name', value)} required maxLength="255" />
            <label>
              Brand
              <select
                value={record.brand_id}
                onChange={(event) => update('brand_id', event.target.value)}
                required={!isAdmin}
              >
                {isAdmin && <option value="">Group-wide service</option>}
                <option value="" disabled={!isAdmin}>Select a brand</option>
                {brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}
              </select>
            </label>
            <TextAreaField label="Description" name="description" value={record.description} onChange={(value) => update('description', value)} />
            <TextField label="Image URL or path" name="image" value={record.image} onChange={(value) => update('image', value)} maxLength="255" />
          </>
        )}
        {resource === 'showrooms' && (
          <>
            <TextField label="City" name="city" value={record.city} onChange={(value) => update('city', value)} required maxLength="100" />
            <TextField label="Address" name="address" value={record.address} onChange={(value) => update('address', value)} required maxLength="255" />
            <TextField label="Phone" name="phone" value={record.phone} onChange={(value) => update('phone', value)} maxLength="50" />
            <label>
              Location type
              <select value={record.type} onChange={(event) => update('type', event.target.value)} required>
                <option value="showroom">Showroom</option>
                <option value="service_center">Service center</option>
              </select>
            </label>
            <TextField label="Opening hours" name="opening_hours" value={record.opening_hours} onChange={(value) => update('opening_hours', value)} maxLength="255" />
            <TextField label="Image URL or path" name="image" value={record.image} onChange={(value) => update('image', value)} maxLength="255" />
            <fieldset className="admin-brand-associations admin-field-wide">
              <legend>Associated brands</legend>
              {brands.map((brand) => (
                <label key={brand.id}>
                  <input
                    type="checkbox"
                    checked={record.brand_ids.includes(Number(brand.id))}
                    onChange={() => toggleBrand(brand.id)}
                  />
                  {brand.name}
                </label>
              ))}
            </fieldset>
          </>
        )}
        <label>
          Status
          <select value={record.status} onChange={(event) => update('status', event.target.value)} required>
            {config.statuses.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
        {error && <p className="admin-notice error admin-field-wide" role="alert">{error}</p>}
        <div className="admin-form-actions admin-field-wide">
          <button className="button button-copper" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <a className="admin-cancel" href={`/admin/${resource}`}>Cancel</a>
        </div>
      </form>
    </section>
  )
}

export default function AdminApp() {
  const pathname = window.location.pathname
  const isLogin = pathname === '/admin/login' || pathname === '/admin/login/'
  const route = useMemo(() => resourceFromPath(pathname), [pathname])
  const [auth, setAuth] = useState({ loading: !isLogin, user: null, error: '' })

  useEffect(() => {
    if (isLogin) return undefined
    let current = true
    api.get('/api/user')
      .then(({ data }) => {
        if (current) setAuth({ loading: false, user: data, error: '' })
      })
      .catch((error) => {
        if (!current) return
        if (error.response?.status === 401) {
          window.location.replace('/admin/login')
          return
        }
        setAuth({
          loading: false,
          user: null,
          error: responseMessage(error, 'Could not verify your administration access.'),
        })
      })
    return () => {
      current = false
    }
  }, [isLogin])

  if (isLogin) return <AdminLogin />
  if (auth.loading) return <main className="admin-loading" role="status">Checking administration access…</main>
  if (auth.error) {
    return (
      <main className="admin-login-page">
        <p className="admin-notice error" role="alert">{auth.error}</p>
        <a href="/admin/login">Return to sign in</a>
      </main>
    )
  }
  if (!auth.user) return null
  if (!['admin', 'data_entry'].includes(auth.user.role)) {
    return (
      <main className="admin-login-page">
        <p className="admin-notice error" role="alert">Administration access is limited to authorized staff.</p>
        <a href="/">Return to MotoX Group</a>
      </main>
    )
  }

  const permitted = menuFor(auth.user.role)
  if (route.resource && !permitted.includes(route.resource)) {
    return (
      <AdminLayout user={auth.user}>
        <p className="admin-notice error" role="alert">
          You don’t have permission to manage this content.
        </p>
        <a href={`/admin/${permitted[0]}`}>Go to your workspace</a>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout user={auth.user}>
      {route.mode === 'dashboard' && <ResourceDashboard user={auth.user} />}
      {route.resource === 'team' ? (
        route.mode === 'list'
          ? <TeamManagement />
          : <TeamEditor userId={route.id} />
      ) : (
        <>
          {route.mode === 'list' && <AdminList resource={route.resource} user={auth.user} />}
          {(route.mode === 'create' || route.mode === 'edit') && (
            <AdminEditor
              resource={route.resource}
              recordId={route.id}
              user={auth.user}
            />
          )}
        </>
      )}
    </AdminLayout>
  )
}

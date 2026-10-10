import { useState } from 'react'
import { useAuth } from '../context/useAuth.js'

function authError(error, fallback) {
  const validationErrors = error.response?.data?.errors
  if (validationErrors) return Object.values(validationErrors).flat().join(' ')
  return error.response?.data?.message || fallback
}

function PasswordField({ label, name, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="auth-password-field">
      {label}
      <span className="auth-password-control">
        <input
          type={visible ? 'text' : 'password'}
          name={name}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          required
        />
        <button
          type="button"
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLocaleLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </span>
    </label>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return
    setSubmitting(true)
    setError('')
    try {
      const user = await login({ email: email.trim(), password })
      window.location.assign(['admin', 'data_entry'].includes(user.role) ? '/admin' : '/')
    } catch (requestError) {
      setError(authError(requestError, 'We couldn’t sign you in. Check your details and try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <p className="eyebrow">Welcome back</p>
        <h1 id="login-title">Sign in to<br /><em>your MotoX.</em></h1>
        <p className="auth-intro">Your next ride is only a few steps away.</p>
        <form className="auth-form" onSubmit={submit}>
          <label>
            Email address
            <input
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="auth-feedback error" role="alert">{error}</p>}
          <button className="button button-copper" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
            {!submitting && <span aria-hidden="true">↗</span>}
          </button>
        </form>
        <p className="auth-switch">
          New to MotoX? <a href="/register">Create an account</a>
        </p>
        <a className="auth-back" href="/">Return to MotoX Group</a>
      </section>
    </main>
  )
}

export function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return
    if (form.password !== form.password_confirmation) {
      setError('The password confirmation does not match.')
      return
    }
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
      })
      setSuccess('Your MotoX customer account is ready.')
      window.location.assign(['admin', 'data_entry'].includes(user.role) ? '/admin' : '/')
    } catch (requestError) {
      setError(authError(requestError, 'We couldn’t create your account. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-register" aria-labelledby="register-title">
        <p className="eyebrow">Join the ride</p>
        <h1 id="register-title">Create your<br /><em>MotoX account.</em></h1>
        <p className="auth-intro">Get closer to the motorcycles and experiences that move you.</p>
        <form className="auth-form" onSubmit={submit}>
          <label>
            Full name
            <input
              name="name"
              autoComplete="name"
              maxLength="255"
              value={form.name}
              onChange={update('name')}
              required
            />
          </label>
          <label>
            Email address
            <input
              type="email"
              name="email"
              autoComplete="email"
              maxLength="255"
              value={form.email}
              onChange={update('email')}
              required
            />
          </label>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
          />
          <PasswordField
            label="Confirm password"
            name="password_confirmation"
            autoComplete="new-password"
            value={form.password_confirmation}
            onChange={update('password_confirmation')}
          />
          {error && <p className="auth-feedback error" role="alert">{error}</p>}
          {success && <p className="auth-feedback success" role="status">{success}</p>}
          <button className="button button-copper" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
            {!submitting && <span aria-hidden="true">↗</span>}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </section>
    </main>
  )
}

import { useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { scrollToHomepageSection } from '../hooks/useAppLocation.js'
import motoXLogo from '../assets/motox-group.png'
import { Footer } from './HomeSections.jsx'

const links = [
  ['Home', '/#home'],
  ['Motorcycles', '/shop'],
  ['Brands', '/#marques'],
  ['Services', '/#services'],
  ['About', '/#about'],
  ['Contact', '/#contact'],
]

function Header() {
  const { user, loading, error, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLogoutError('')
    setLoggingOut(true)
    try {
      await logout()
      setMenuOpen(false)
    } catch (error) {
      setLogoutError(error.response?.data?.message || 'Could not sign out. Please try again.')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <>
      <header className={`site-header${window.location.pathname === '/' ? ' site-header-home' : ' site-header-solid'}`}>
        <a className="brand-mark" href="/#home" aria-label="MotoX Group home">
          <img src={motoXLogo} alt="MotoX Group" width="1920" height="682" />
        </a>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
        <nav
          id="site-navigation"
          className={`site-navigation${menuOpen ? ' is-open' : ''}`}
          aria-label="Main navigation"
        >
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              onClick={(event) => {
                setMenuOpen(false)
                scrollToHomepageSection(event, href)
              }}
            >
              {label}
            </a>
          ))}
          {loading ? (
            <span className="auth-nav-placeholder" aria-hidden="true" />
          ) : user ? (
            <>
              {['admin', 'data_entry'].includes(user.role) && (
                <a href="/admin" onClick={() => setMenuOpen(false)}>Admin</a>
              )}
              <span className="auth-nav-name">{user.name}</span>
              <button
                className="auth-nav-action"
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </>
          ) : (
            <>
              <a href="/login" onClick={() => setMenuOpen(false)}>Login</a>
              <a href="/register" onClick={() => setMenuOpen(false)}>Register</a>
            </>
          )}
          <a
            className="button button-copper nav-cta"
            href="/#test-ride"
            onClick={() => setMenuOpen(false)}
          >
            Book a test ride <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>
      {(logoutError || error) && (
        <p className="header-feedback" role="alert">{logoutError || error}</p>
      )}
    </>
  )
}

export default function PublicLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer logo={motoXLogo} />
    </>
  )
}

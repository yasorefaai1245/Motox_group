import { useEffect, useState } from 'react'

function readLocation() {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
  }
}

export function useAppLocation() {
  const [location, setLocation] = useState(readLocation)

  useEffect(() => {
    const updateLocation = () => setLocation(readLocation())
    window.addEventListener('popstate', updateLocation)
    return () => window.removeEventListener('popstate', updateLocation)
  }, [])

  return location
}

export function navigateTo(path, { replace = false } = {}) {
  const destination = new URL(path, window.location.href)
  if (destination.origin !== window.location.origin) {
    window.location.assign(destination.href)
    return
  }

  const relativeUrl = `${destination.pathname}${destination.search}${destination.hash}`
  if (replace) {
    window.history.replaceState(window.history.state, '', relativeUrl)
  } else {
    window.history.pushState({}, '', relativeUrl)
  }
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }))
}

export function scrollToHomepageSection(event, href) {
  const match = href.match(/^\/#(.+)$/)
  if (!match || window.location.pathname !== '/') return

  const target = document.getElementById(match[1])
  if (!target) return

  event.preventDefault()
  window.history.pushState({}, '', href)
  target.scrollIntoView({ behavior: 'instant', block: 'start' })
}

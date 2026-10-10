import { useLayoutEffect, useState } from 'react'
import { usePublicCatalog } from './hooks/usePublicCatalog.js'
import {
  AboutSection,
  BrandCollection,
  ExperienceSection,
  FeaturedMotorcycles,
  HeroSection,
  ServicesSection,
  ShowroomsSection,
  TestRideSection,
} from './components/HomeSections.jsx'
import AdminApp from './components/AdminApp.jsx'
import { MotorcycleDetailsPage, ShopPage } from './components/ShopPage.jsx'
import { LoginPage, RegisterPage } from './components/AuthPages.jsx'
import PublicLayout from './components/PublicLayout.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { useAppLocation } from './hooks/useAppLocation.js'
import './App.css'
import './ShopAdmin.css'

function Homepage() {
  const catalog = usePublicCatalog()
  const [selectedMotorcycle, setSelectedMotorcycle] = useState('')

  useLayoutEffect(() => {
    const target = document.getElementById(window.location.hash.slice(1))
    target?.scrollIntoView({ behavior: 'instant', block: 'start' })
  }, [])

  const selectMotorcycle = (motorcycleId) => {
    setSelectedMotorcycle(String(motorcycleId))
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth'
    document.getElementById('test-ride')?.scrollIntoView({ behavior })
  }

  return (
    <div className="homepage">
      <main>
        <HeroSection />
        <BrandCollection brands={catalog.brands} />
        <FeaturedMotorcycles
          motorcycles={catalog.motorcycles}
          onSelect={selectMotorcycle}
        />
        <ExperienceSection />
        <ServicesSection services={catalog.services} />
        <TestRideSection
          motorcycles={catalog.motorcycles}
          showrooms={catalog.showrooms}
          selectedMotorcycle={selectedMotorcycle}
          onMotorcycleChange={setSelectedMotorcycle}
        />
        <ShowroomsSection showrooms={catalog.showrooms} />
        <AboutSection />
      </main>
    </div>
  )
}

function App() {
  const { pathname } = useAppLocation()

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return <AdminApp />
  }

  let page = <Homepage />
  if (pathname === '/login' || pathname === '/login/') page = <LoginPage />
  else if (pathname === '/register' || pathname === '/register/') page = <RegisterPage />
  else if (pathname === '/shop' || pathname === '/motorcycles') page = <ShopPage />
  else {
    const motorcycleMatch = pathname.match(/^\/motorcycles\/([^/]+)\/?$/)
    if (motorcycleMatch) {
      page = <MotorcycleDetailsPage motorcycleId={decodeURIComponent(motorcycleMatch[1])} />
    }
  }

  return (
    <AuthProvider>
      <PublicLayout>{page}</PublicLayout>
    </AuthProvider>
  )
}

export default App

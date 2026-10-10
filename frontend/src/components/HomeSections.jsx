import { useMemo, useRef, useState } from 'react'
import api from '../services/api.js'
import { scrollToHomepageSection } from '../hooks/useAppLocation.js'
import heroImage from '../assets/motox-alpine-hero.jpg'
import urbanMobilityImage from '../assets/category-urban-mobility.jpg'
import adventureTouringImage from '../assets/category-adventure-touring.jpg'
import performanceImage from '../assets/category-performance.jpg'
import premiumMotorcycleImage from '../assets/category-premium-motorcycles.jpg'
import dohaShowroomImage from '../assets/showroom-doha.jpg'
import dubaiShowroomImage from '../assets/showroom-dubai.jpg'
import riyadhShowroomImage from '../assets/showroom-riyadh.jpg'
import cairoShowroomImage from '../assets/showroom-cairo.jpg'
import InternalLink from './InternalLink.jsx'

const showroomImageCredits = {
  '/images/showrooms/doha-demo.jpg': {
    href: 'https://commons.wikimedia.org/wiki/File:Showroom_BMW_Motorrad_Etoile.jpg',
    artist: 'Pierre Chapron',
    license: 'CC BY 3.0',
  },
  '/images/showrooms/dubai-demo.jpg': {
    href: 'https://commons.wikimedia.org/wiki/File:Suzuki_Motorcycle_dealership_at_SM_City_Cebu_(2024-05-25).jpg',
    artist: 'Wide Awake!',
    license: 'CC BY 4.0',
  },
  '/images/showrooms/riyadh-demo.jpg': {
    href: 'https://commons.wikimedia.org/wiki/File:TVS_Showroom_in_Swargate,_Pune,_India_.jpg',
    artist: 'Albert Deccan',
    license: 'CC BY-SA 3.0',
  },
  '/images/showrooms/cairo-demo.jpg': {
    href: 'https://commons.wikimedia.org/wiki/File:Hochgurgl-Top_Mountain_Motorcycle_Museum-showroom-06ESD.jpg',
    artist: 'Rikki Mitterer',
    license: 'CC BY-SA 4.0',
  },
}

function ShowroomPhotoCredit({ image }) {
  const credit = showroomImageCredits[image]
  if (!credit) return null

  return (
    <a
      className="showroom-image-credit"
      href={credit.href}
      target="_blank"
      rel="noreferrer"
    >
      Photo: {credit.artist} · Wikimedia Commons ({credit.license})
    </a>
  )
}

const editorialCategories = [
  {
    number: '01',
    title: 'Urban mobility',
    text: 'Made for the rhythm of the city and the freedom between destinations.',
    image: urbanMobilityImage,
    imageAlt: 'Motorcycle for urban mobility',
    filterCategory: 'Roadster',
    className: 'category-urban',
  },
  {
    number: '02',
    title: 'Adventure & touring',
    text: 'Take the long way. Find a new horizon beyond the familiar road.',
    image: adventureTouringImage,
    imageAlt: 'Adventure touring motorcycle',
    filterCategory: 'Adventure',
    className: 'category-adventure',
  },
  {
    number: '03',
    title: 'Performance',
    text: 'Precision, response and a direct connection to every curve.',
    image: performanceImage,
    imageAlt: 'High-performance motorcycle',
    filterCategory: 'Adventure',
    className: 'category-performance',
  },
  {
    number: '04',
    title: 'Premium motorcycles',
    text: 'Distinctive design and considered details, chosen to move you.',
    image: premiumMotorcycleImage,
    imageAlt: 'Premium motorcycle',
    filterCategory: 'Cruiser',
    className: 'category-premium',
  },
]

const demoShowroomPhotos = [
  { city: 'doha', image: dohaShowroomImage },
  { city: 'dubai', image: dubaiShowroomImage },
  { city: 'riyadh', image: riyadhShowroomImage },
  { city: 'cairo', image: cairoShowroomImage },
]

function showroomPhotoFor(showroom) {
  const city = String(showroom.city || '').toLowerCase()
  return demoShowroomPhotos.find(({ city: demoCity }) => city.includes(demoCity))?.image
}

function showroomOrderFor(showroom) {
  const city = String(showroom.city || '').toLowerCase()
  const order = demoShowroomPhotos.findIndex(({ city: demoCity }) => city.includes(demoCity))
  return order === -1 ? demoShowroomPhotos.length : order
}

function ResourceMessage({ resource, noun }) {
  if (resource.loading) {
    return <p className="resource-message" role="status">Loading {noun}…</p>
  }
  if (resource.error) {
    return (
      <p className="resource-message resource-error" role="status">
        We couldn’t load {noun}. {resource.error}
      </p>
    )
  }
  return null
}

function CatalogImage({ src, alt, className = '', useApiBase = true }) {
  const [failed, setFailed] = useState(false)
  const imageUrl = src
    ? (useApiBase ? api.getUri({ url: src }) : src)
    : ''

  return (
    <div className={`image-frame ${className}${failed || !src ? ' image-fallback' : ''}`}>
      {src && !failed ? (
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="image-placeholder" aria-hidden="true">MotoX</span>
      )}
    </div>
  )
}

export function HeroSection() {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      {!imageFailed && (
        <img
          className="hero-image"
          src={heroImage}
          alt=""
          fetchPriority="high"
          onError={() => setImageFailed(true)}
        />
      )}
      <div className="hero-shade" />
      <div className="hero-content">
        <p className="eyebrow">MotoX Group <span /> Move your way</p>
        <h1 id="hero-title">Ride beyond<br />the ordinary.</h1>
        <p className="hero-description">
          Discover exceptional motorcycles, distinctive brands, and the freedom
          to find your own road.
        </p>
        <div className="hero-actions">
          <a className="button button-copper" href="#motorcycles">
            Explore motorcycles <span aria-hidden="true">↗</span>
          </a>
          <a className="text-link light-link" href="#test-ride">
            Book a test ride <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
      <div className="hero-caption"><span>01 / 04</span> Made for the moments ahead</div>
      <a className="scroll-cue" href="#brands" aria-label="Scroll to discover">
        <span /> Scroll to discover
      </a>
    </section>
  )
}

export function BrandCollection({ brands }) {
  return (
    <section className="section section-light categories-section" id="brands">
      <div className="section-heading">
        <div>
          <p className="eyebrow eyebrow-dark">Find your kind of ride</p>
          <h2>Made for every<br /><em>way forward.</em></h2>
        </div>
        <p className="section-intro">
          From the everyday commute to open-road escapes, explore a collection
          shaped around the way you want to ride.
        </p>
      </div>
      <div className="category-grid">
        {editorialCategories.map((category) => (
          <InternalLink
            className={`category-card ${category.className}`}
            href={`/shop?category=${encodeURIComponent(category.filterCategory)}`}
            key={category.number}
          >
            <CatalogImage
              src={category.image}
              alt={category.imageAlt}
              useApiBase={false}
            />
            <div className="category-copy">
              <span className="category-number">{category.number}</span>
              <h3>{category.title}</h3>
              <p>{category.text}</p>
              <span className="category-link">Explore the collection <span aria-hidden="true">↗</span></span>
            </div>
          </InternalLink>
        ))}
      </div>
      <div className="marques" id="marques">
        <p className="eyebrow eyebrow-dark">Our marques</p>
        <ResourceMessage resource={brands} noun="brands" />
        {!brands.loading && !brands.error && (
          brands.data.length ? (
            <ul className="marque-list">
              {brands.data.map((brand) => (
                <li key={brand.id}>
                  {brand.image && <CatalogImage src={brand.image} alt="" className="marque-image" />}
                  <span>{brand.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="resource-message">No active brands are available right now.</p>
          )
        )}
      </div>
    </section>
  )
}

export function FeaturedMotorcycles({ motorcycles, onSelect }) {
  const trackRef = useRef(null)

  const scrollCarousel = (direction) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' })
  }

  return (
    <section className="section section-dark featured-motorcycles" id="motorcycles">
      <div className="section-heading">
        <div>
          <p className="eyebrow">The MotoX selection</p>
          <h2>Extraordinary machines.<br /><em>Ready for your next chapter.</em></h2>
        </div>
        <a className="text-link light-link featured-book-cta" href="#test-ride">
          Book a test ride <span aria-hidden="true">↗</span>
        </a>
      </div>
      <ResourceMessage resource={motorcycles} noun="motorcycles" />
      {!motorcycles.loading && !motorcycles.error && (
        motorcycles.data.length ? (
          <div className="motorcycle-carousel">
            <button className="carousel-arrow carousel-arrow-prev" type="button" aria-label="Previous motorcycles" onClick={() => scrollCarousel(-1)}>
              ‹
            </button>
            <div className="motorcycle-track" ref={trackRef}>
            {motorcycles.data.map((motorcycle) => (
              <article className="motorcycle-card" key={motorcycle.id}>
                <InternalLink
                  className="motorcycle-product-link"
                  href={`/motorcycles/${encodeURIComponent(motorcycle.id)}`}
                  aria-label={`Explore ${motorcycle.name || 'motorcycle'}`}
                >
                  <CatalogImage
                    src={motorcycle.image}
                    alt={motorcycle.name ? `${motorcycle.name} motorcycle` : 'Motorcycle'}
                    className="motorcycle-image"
                  />
                  <div className="motorcycle-details">
                    <div>
                      <p className="card-kicker">{motorcycle.category || motorcycle.brand?.name || 'MotoX collection'}</p>
                      <h3>{motorcycle.name}</h3>
                    </div>
                    <p className="motorcycle-price">
                      {motorcycle.price == null || motorcycle.price === ''
                        ? 'Contact for price'
                        : new Intl.NumberFormat(undefined, {
                          maximumFractionDigits: 2,
                        }).format(Number(motorcycle.price))}
                    </p>
                  </div>
                </InternalLink>
                <div className="motorcycle-actions">
                  <InternalLink
                    className="motorcycle-explore-action"
                    href={`/motorcycles/${encodeURIComponent(motorcycle.id)}`}
                  >
                    Explore <span aria-hidden="true">↗</span>
                  </InternalLink>
                  <button
                    className="button button-copper motorcycle-book-action"
                    type="button"
                    onClick={() => onSelect(motorcycle.id)}
                  >
                    Request a test ride
                  </button>
                </div>
              </article>
            ))}
          </div>
          <button className="carousel-arrow carousel-arrow-next" type="button" aria-label="Next motorcycles" onClick={() => scrollCarousel(1)}>
            ›
          </button>
          </div>
        ) : (
          <p className="resource-message">No active motorcycles are available right now.</p>
        )
      )}
    </section>
  )
}

export function ExperienceSection() {
  const [imageFailed, setImageFailed] = useState(false)
  return (
    <section className="experience-section" id="experience">
      <div className="experience-photo">
        {!imageFailed && (
          <img
            src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1400&q=85"
            alt="Motorcycle ready for a journey beyond the city"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}
        <span className="photo-index">THE OPEN ROAD / 001</span>
      </div>
      <div className="experience-copy">
        <p className="eyebrow eyebrow-dark">The MotoX experience</p>
        <h2>Built for the<br /><em>way you ride.</em></h2>
        <p>
          Some rides are about getting there. The best ones are about everything
          you discover along the way. Choose a motorcycle that feels like yours,
          and make every mile your own.
        </p>
        <a className="text-link" href="#showrooms">
          Find your MotoX showroom <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  )
}

export function ServicesSection({ services }) {
  return (
    <section className="section section-light services-section" id="services">
      <div className="section-heading">
        <div>
          <p className="eyebrow eyebrow-dark">Support for every mile</p>
          <h2>Here for the<br /><em>whole journey.</em></h2>
        </div>
        <p className="section-intro">
          Explore the services currently offered by our participating brands.
          Availability may vary by location.
        </p>
      </div>
      <div className="services-actions">
        <a className="button button-copper" href="/#test-ride">
          Book a test ride <span aria-hidden="true">↗</span>
        </a>
        <a className="text-link" href="/shop">
          Explore motorcycles & enquire <span aria-hidden="true">↗</span>
        </a>
      </div>
      <ResourceMessage resource={services} noun="services" />
      {!services.loading && !services.error && (
        services.data.length ? (
          <div className="services-grid">
            {services.data.map((service, index) => (
              <article className="service-item" key={service.id}>
                {service.image
                  ? <CatalogImage src={service.image} alt="" className="service-image" />
                  : <span className="service-number">0{index + 1}</span>}
                <div>
                  {service.brand?.name && <p className="card-kicker">{service.brand.name}</p>}
                  <h3>{service.name}</h3>
                  {service.description && <p>{service.description}</p>}
                </div>
                <a className="text-link" href="#showrooms" aria-label={`Find locations for ${service.name}`}>
                  Find a location <span aria-hidden="true">↗</span>
                </a>
              </article>
            ))}
          </div>
        ) : (
          <p className="resource-message">There are no active services listed at the moment. Please contact a showroom for assistance.</p>
        )
      )}
    </section>
  )
}

function localDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function TestRideSection({
  motorcycles,
  showrooms,
  selectedMotorcycle,
  onMotorcycleChange,
}) {
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showroomId, setShowroomId] = useState('')

  const selected = motorcycles.data.find(
    (motorcycle) => String(motorcycle.id) === selectedMotorcycle,
  )
  const availableShowrooms = useMemo(() => {
    if (!selected) return []
    return showrooms.data.filter((showroom) =>
      showroom.brands?.some(
        (brand) => String(brand.id) === String(selected.brand?.id ?? selected.brand_id),
      ),
    )
  }, [selected, showrooms.data])

  const bookingUnavailable = !motorcycles.data.length || !showrooms.data.length

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return

    setIsSubmitting(true)
    setStatus({ type: '', message: '' })
    const formData = new FormData(form)
    const payload = {
      motorcycle_id: Number(formData.get('motorcycle_id')),
      showroom_id: Number(formData.get('showroom_id')),
      customer_name: formData.get('customer_name').trim(),
      customer_email: formData.get('customer_email').trim(),
      customer_phone: formData.get('customer_phone').trim(),
      ride_date: formData.get('ride_date'),
      ride_time: formData.get('ride_time'),
      notes: formData.get('notes').trim(),
    }

    try {
      await api.post('/api/test-rides', payload)
      setStatus({
        type: 'success',
        message: 'Your test ride request was sent. The showroom will contact you to confirm.',
      })
      form.reset()
      onMotorcycleChange('')
      setShowroomId('')
    } catch (error) {
      const validationErrors = error.response?.data?.errors
      const validationMessage = validationErrors
        ? Object.values(validationErrors).flat().join(' ')
        : ''
      setStatus({
        type: 'error',
        message: validationMessage
          || error.response?.data?.message
          || 'Your request could not be sent. Please review the details and try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="test-ride-section" id="test-ride">
      <div className="test-ride-intro">
        <p className="eyebrow">Make it yours</p>
        <h2>Your next ride<br /><em>starts here.</em></h2>
        <p>Find your preferred motorcycle and request a test ride at an available showroom.</p>
        <span className="test-ride-note">A request is not a confirmed booking. The showroom will be in touch.</span>
      </div>
      <div className="booking-panel">
        <p className="eyebrow eyebrow-dark">Request a test ride</p>
        {motorcycles.loading || showrooms.loading ? (
          <p role="status" className="resource-message">Loading motorcycles and showrooms…</p>
        ) : motorcycles.error || showrooms.error ? (
          <p role="status" className="resource-message resource-error">
            Booking options couldn’t be loaded. {motorcycles.error || showrooms.error}
          </p>
        ) : bookingUnavailable ? (
          <p className="resource-message">
            {!motorcycles.data.length
              ? 'Test rides are unavailable because no active motorcycles are listed.'
              : 'Test rides are unavailable because no active showrooms are configured.'}
          </p>
        ) : (
          <form className="booking-form" onSubmit={handleSubmit}>
            <label>
              Motorcycle
              <select
                name="motorcycle_id"
                value={selectedMotorcycle}
                onChange={(event) => {
                  onMotorcycleChange(event.target.value)
                  setShowroomId('')
                  setStatus({ type: '', message: '' })
                }}
                required
              >
                <option value="" disabled>Select a motorcycle</option>
                {motorcycles.data.map((motorcycle) => (
                  <option value={motorcycle.id} key={motorcycle.id}>{motorcycle.name}</option>
                ))}
              </select>
            </label>
            <label>
              Showroom
              <select
                name="showroom_id"
                value={showroomId}
                onChange={(event) => setShowroomId(event.target.value)}
                required
                disabled={!selected || !availableShowrooms.length}
              >
                <option value="" disabled>
                  {selected ? 'Select a showroom' : 'Choose a motorcycle first'}
                </option>
                {availableShowrooms.map((showroom) => (
                  <option value={showroom.id} key={showroom.id}>
                    {[showroom.city, showroom.type].filter(Boolean).join(' — ')
                      || `MotoX location ${showroom.id}`}
                  </option>
                ))}
              </select>
            </label>
            {selected && !availableShowrooms.length && (
              <p className="resource-message form-full" role="status">
                No active showroom is configured for this motorcycle’s brand.
              </p>
            )}
            <label>
              Your name
              <input name="customer_name" type="text" autoComplete="name" maxLength="255" required />
            </label>
            <label>
              Email address
              <input name="customer_email" type="email" autoComplete="email" maxLength="255" required />
            </label>
            <label>
              Phone number
              <input name="customer_phone" type="tel" autoComplete="tel" maxLength="50" required />
            </label>
            <div className="form-pair">
              <label>
                Preferred date
                <input name="ride_date" type="date" min={localDateString(new Date())} required />
              </label>
              <label>
                Preferred time
                <input name="ride_time" type="time" required />
              </label>
            </div>
            <label className="form-full">
              Notes <span className="optional-label">(optional)</span>
              <textarea name="notes" rows="3" />
            </label>
            <button
              className="button button-copper form-full"
              type="submit"
              disabled={isSubmitting || !selected || !availableShowrooms.length || !showroomId}
            >
              {isSubmitting ? 'Sending request…' : 'Request a test ride'}
              {!isSubmitting && <span aria-hidden="true">↗</span>}
            </button>
            {status.message && (
              <p
                className={`form-feedback form-full ${status.type}`}
                role={status.type === 'error' ? 'alert' : 'status'}
              >
                {status.message}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}

export function ShowroomsSection({ showrooms }) {
  const orderedShowrooms = [...showrooms.data].sort(
    (first, second) => showroomOrderFor(first) - showroomOrderFor(second),
  )

  return (
    <section className="section section-light showroom-section" id="showrooms">
      <div className="section-heading">
        <div id="contact">
          <p className="eyebrow eyebrow-dark">Come see us</p>
          <h2>Meet us<br /><em>where you are.</em></h2>
        </div>
        <p className="section-intro showroom-intro">
          <svg
            className="showroom-intro-icon"
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.7" />
          </svg>
          <span>Visit a MotoX showroom or service center.</span>
        </p>
      </div>
      <ResourceMessage resource={showrooms} noun="showrooms" />
      {!showrooms.loading && !showrooms.error && (
        showrooms.data.length ? (
          <div className="showroom-grid">
            {orderedShowrooms.map((showroom) => {
              const localPhoto = showroomPhotoFor(showroom)
              const image = localPhoto || showroom.image

              return (
                <article className="showroom-card" key={showroom.id}>
                  {image && (
                    <CatalogImage
                      src={image}
                      alt={`Illustrative motorcycle showroom photograph for the fictional ${showroom.city} demo location; not actual MotoX premises.`}
                      className="showroom-image"
                      useApiBase={!localPhoto}
                    />
                  )}
                  {showroom.address?.includes('FICTIONAL DEMO DATA') && (
                    <p className="showroom-demo-note">Fictional demo location · illustrative photo only</p>
                  )}
                  <p className="card-kicker">{showroom.type || 'MotoX location'}</p>
                  <h3>{showroom.city || 'MotoX Group'}</h3>
                  {showroom.address && !showroom.address.includes('FICTIONAL DEMO DATA') && (
                    <p>{showroom.address}</p>
                  )}
                  {showroom.opening_hours && <p className="showroom-detail">Hours: {showroom.opening_hours}</p>}
                  {showroom.phone && <a className="text-link" href={`tel:${showroom.phone}`}>{showroom.phone}</a>}
                  {!localPhoto && <ShowroomPhotoCredit image={showroom.image} />}
                </article>
              )
            })}
          </div>
        ) : (
          <p className="resource-message">No active showrooms or service centers are listed right now.</p>
        )
      )}
    </section>
  )
}

export function AboutSection() {
  return (
    <section className="about-section" id="about">
      <div className="about-copy">
        <p className="eyebrow about-eyebrow">About MotoX Group</p>
        <h2>More than a motorcycle.<br /><em>A world of ways to ride.</em></h2>
        <p>
          MotoX Group brings together distinctive motorcycle brands, thoughtfully
          selected models and the support to help you make the most of every ride.
          Your next chapter starts with what moves you.
        </p>
        <a className="text-link light-link" href="/shop">Explore MotoX <span aria-hidden="true">↗</span></a>
      </div>
    </section>
  )
}

export function Footer({ logo }) {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand-block">
          <a className="footer-brand" href="/#home" aria-label="MotoX Group home">
            <img src={logo} alt="MotoX Group" width="1920" height="682" loading="lazy" />
          </a>
          <p>Find your road. Ride your way.</p>
        </div>
        <nav className="footer-navigation" aria-label="Footer navigation">
          <a href="/#home" onClick={(event) => scrollToHomepageSection(event, '/#home')}>Home</a>
          <a href="/#marques" onClick={(event) => scrollToHomepageSection(event, '/#marques')}>Brands</a>
          <a href="/shop">Motorcycles</a>
          <a href="/#experience" onClick={(event) => scrollToHomepageSection(event, '/#experience')}>Experience</a>
          <a href="/#services" onClick={(event) => scrollToHomepageSection(event, '/#services')}>Services</a>
          <a href="/#showrooms" onClick={(event) => scrollToHomepageSection(event, '/#showrooms')}>Showrooms</a>
          <a href="/#contact" onClick={(event) => scrollToHomepageSection(event, '/#contact')}>Contact</a>
          <a href="/#about" onClick={(event) => scrollToHomepageSection(event, '/#about')}>About</a>
        </nav>
        <div className="footer-connect">
          <a className="footer-booking" href="/#test-ride">
            Book a test ride <span aria-hidden="true">↗</span>
          </a>
          <nav className="footer-socials" aria-label="Social media">
            <a href="#" aria-label="Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle className="footer-social-dot" cx="17.5" cy="6.7" r="0.8" />
              </svg>
            </a>
            <a href="#" aria-label="Facebook">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14.2 20v-7.1h2.4l.4-2.8h-2.8V8.3c0-.8.3-1.4 1.4-1.4h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8.8V13h2.4v7" />
              </svg>
            </a>
            <a href="#" aria-label="YouTube">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 8.2a2.6 2.6 0 0 0-1.8-1.8C17.6 6 12 6 12 6s-5.6 0-7.2.4A2.6 2.6 0 0 0 3 8.2 27 27 0 0 0 2.6 12a27 27 0 0 0 .4 3.8 2.6 2.6 0 0 0 1.8 1.8C6.4 18 12 18 12 18s5.6 0 7.2-.4a2.6 2.6 0 0 0 1.8-1.8 27 27 0 0 0 .4-3.8 27 27 0 0 0-.4-3.8Z" />
                <path d="m10 9 5 3-5 3z" />
              </svg>
            </a>
            <a href="#" aria-label="TikTok">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 4v10.1a3.7 3.7 0 1 1-3.2-3.7v3a.9.9 0 1 0 .2.6V4h3c.2 2 1.3 3.3 3.5 3.8v3.1A8 8 0 0 1 14 9.4" />
              </svg>
            </a>
          </nav>
        </div>
      </div>
      <div className="footer-legal">
        <span>© {new Date().getFullYear()} MotoX Group</span>
        <span>All rights reserved.</span>
      </div>
    </footer>
  )
}

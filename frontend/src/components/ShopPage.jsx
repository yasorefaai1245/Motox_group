import { useEffect, useMemo, useState } from 'react'
import { MotorcycleEnquiryDialog, TestRideDialog } from './CustomerForms.jsx'
import { useShopCatalog } from '../hooks/useShopCatalog.js'
import { filterMotorcycles } from '../utils/shopFilters.js'
import api from '../services/api.js'
import InternalLink from './InternalLink.jsx'
import { navigateTo, useAppLocation } from '../hooks/useAppLocation.js'

function replaceCategoryQuery(category) {
  const url = new URL(window.location.href)
  if (category) url.searchParams.set('category', category)
  else url.searchParams.delete('category')
  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  )
}

const emptyFilters = {
  query: '',
  brands: [],
  category: '',
  minimum: '',
  maximum: '',
  sort: 'name',
}

function brandNameOf(motorcycle) {
  return motorcycle.brand?.name || ''
}

function priceText(price) {
  if (price === null || price === undefined || price === '' || !Number.isFinite(Number(price))) {
    return 'Contact for price'
  }
  return new Intl.NumberFormat('en-QA', {
    style: 'currency',
    currency: 'QAR',
  }).format(Number(price))
}

function MotorcycleImage({ image, name }) {
  const [failed, setFailed] = useState(false)
  const src = image
    ? (image.startsWith('data:') ? image : api.getUri({ url: image }))
    : ''

  if (!src || failed) {
    return (
      <div
        className="shop-card-image shop-image-fallback"
        role="img"
        aria-label={`${name || 'Motorcycle'} image unavailable`}
      >
        <span>MotoX</span>
      </div>
    )
  }

  return (
    <div className="shop-card-image">
      <img
        src={src}
        alt={name ? `${name} motorcycle` : 'Motorcycle'}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

function FilterControls({
  brands,
  brandsLoading,
  brandsError,
  categories,
  filters,
  setFilters,
  onCategoryChange,
  clearFilters,
  mobileOpen,
  setMobileOpen,
}) {
  const toggleBrand = (brandId) => {
    setFilters((current) => ({
      ...current,
      brands: current.brands.includes(String(brandId))
        ? current.brands.filter((id) => id !== String(brandId))
        : [...current.brands, String(brandId)],
    }))
  }

  return (
    <>
      <button
        className="shop-filter-toggle"
        type="button"
        aria-expanded={mobileOpen}
        aria-controls="shop-filters"
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? 'Hide filters' : 'Filters'}
        <span aria-hidden="true">{mobileOpen ? '−' : '+'}</span>
      </button>
      <aside
        className={`shop-filters${mobileOpen ? ' filters-open' : ''}`}
        id="shop-filters"
        aria-label="Motorcycle filters"
      >
        <div className="filter-panel-heading">
          <h2>Refine your search</h2>
          <button type="button" className="filter-clear" onClick={clearFilters}>
            Clear all
          </button>
        </div>
        <fieldset className="filter-group">
          <legend>Brand</legend>
          {brands.length ? (
            brands.map((brand) => (
              <label className="filter-option" key={brand.id}>
                <input
                  type="checkbox"
                  checked={filters.brands.includes(String(brand.id))}
                  onChange={() => toggleBrand(brand.id)}
                />
                <span>{brand.name}</span>
              </label>
            ))
          ) : (
            <p className="shop-filter-note">
              {brandsLoading
                ? 'Loading brands…'
                : brandsError
                  ? `Brand filters couldn’t be loaded. ${brandsError}`
                  : 'No active brands available.'}
            </p>
          )}
        </fieldset>
        <label className="filter-group">
          <span className="filter-label">Category</span>
          <select
            value={filters.category}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option value={category} key={category}>{category}</option>
            ))}
          </select>
        </label>
        <fieldset className="filter-group">
          <legend>Price range</legend>
          <div className="price-inputs">
            <label>
              <span className="visually-hidden">Minimum price</span>
              <input
                type="number"
                min="0"
                inputMode="decimal"
                placeholder="Min"
                value={filters.minimum}
                onChange={(event) => setFilters((current) => ({
                  ...current,
                  minimum: event.target.value,
                }))}
              />
            </label>
            <span aria-hidden="true">—</span>
            <label>
              <span className="visually-hidden">Maximum price</span>
              <input
                type="number"
                min="0"
                inputMode="decimal"
                placeholder="Max"
                value={filters.maximum}
                onChange={(event) => setFilters((current) => ({
                  ...current,
                  maximum: event.target.value,
                }))}
              />
            </label>
          </div>
        </fieldset>
        <button className="filter-clear filter-clear-bottom" type="button" onClick={clearFilters}>
          Clear all filters
        </button>
      </aside>
    </>
  )
}

function ProductCard({ motorcycle, onEnquire, onBook, returnTo }) {
  const id = motorcycle.id
  const brandName = brandNameOf(motorcycle)
  const amount = priceText(motorcycle.price)
  const detailsHref = `/motorcycles/${encodeURIComponent(id)}?returnTo=${encodeURIComponent(returnTo)}`

  return (
    <article className="shop-product-card">
      <InternalLink
        className="shop-product-link"
        href={detailsHref}
        aria-label={`Explore ${motorcycle.name || 'motorcycle'}`}
      >
        <MotorcycleImage image={motorcycle.image} name={motorcycle.name} />
        <div className="shop-product-meta">
          {brandName && <span className="shop-brand">{brandName}</span>}
          <h2>{motorcycle.name || 'Motorcycle'}</h2>
          {motorcycle.category && <span className="shop-category">{motorcycle.category}</span>}
          <span className="shop-price">{amount}</span>
        </div>
      </InternalLink>
      <div className="shop-card-actions">
        <button className="shop-test-ride-action" type="button" onClick={() => onBook(id)}>
          Request a test ride
        </button>
        <button className="shop-enquire-action" type="button" onClick={() => onEnquire(id)}>
          Enquire
        </button>
      </div>
    </article>
  )
}

export function ShopPage() {
  const { search } = useAppLocation()
  const catalog = useShopCatalog()
  const {
    brands,
    motorcycles,
    showrooms,
    brandsLoading,
    motorcyclesLoading: loading,
    showroomsLoading,
    motorcyclesError: error,
    brandsError,
    showroomsError,
  } = catalog
  const [filters, setFilters] = useState(emptyFilters)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [enquiryId, setEnquiryId] = useState(null)
  const [testRideId, setTestRideId] = useState(null)

  const categories = useMemo(
    () => [...new Set(motorcycles.map((motorcycle) => motorcycle.category).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
    [motorcycles],
  )
  const requestedCategory = new URLSearchParams(search).get('category') || ''
  const requestedBrand = new URLSearchParams(search).get('brand') || ''

  useEffect(() => {
    if (!requestedBrand) return
    setFilters((current) => ({ ...current, brands: [String(requestedBrand)] }))
  }, [requestedBrand])
  const selectedCategory = loading || error || categories.includes(requestedCategory)
    ? requestedCategory
    : ''

  const updateCategory = (category) => {
    const url = new URL(window.location.href)
    if (category) url.searchParams.set('category', category)
    else url.searchParams.delete('category')
    navigateTo(`${url.pathname}${url.search}${url.hash}`, { replace: true })
  }

  useEffect(() => {
    if (!loading && !error && requestedCategory && !categories.includes(requestedCategory)) {
      replaceCategoryQuery('')
    }
  }, [categories, error, loading, requestedCategory])

  const invalidRange = filters.minimum !== ''
    && filters.maximum !== ''
    && Number(filters.minimum) > Number(filters.maximum)

  const results = useMemo(() => {
    return filterMotorcycles(motorcycles, { ...filters, category: selectedCategory })
  }, [filters, motorcycles, selectedCategory])

  const activeFilters = [
    ...filters.brands.map((id) => ({
      key: `brand-${id}`,
      label: brands.find((brand) => String(brand.id) === id)?.name || '',
      remove: () => setFilters((current) => ({
        ...current,
        brands: current.brands.filter((brandId) => brandId !== id),
      })),
      })),
      ...(filters.query.trim() ? [{
        key: 'query',
        label: `Search: ${filters.query.trim()}`,
        remove: () => setFilters((current) => ({ ...current, query: '' })),
      }] : []),
    ...(selectedCategory ? [{
      key: 'category',
      label: selectedCategory,
      remove: () => updateCategory(''),
    }] : []),
    ...(filters.minimum !== '' ? [{
      key: 'minimum',
      label: `From ${filters.minimum}`,
      remove: () => setFilters((current) => ({ ...current, minimum: '' })),
    }] : []),
    ...(filters.maximum !== '' ? [{
      key: 'maximum',
      label: `Up to ${filters.maximum}`,
      remove: () => setFilters((current) => ({ ...current, maximum: '' })),
    }] : []),
  ].filter((item) => item.label)

  const clearFilters = () => {
    setFilters(emptyFilters)
    updateCategory('')
    setMobileFiltersOpen(false)
  }

  return (
    <div className="shop-page">
      <main>
        <section className="shop-hero">
          <p className="eyebrow">The MotoX collection</p>
          <h1>Explore our<br /><em>motorcycles.</em></h1>
          <p>Discover a motorcycle that fits your style, your plans, and the way you want to ride.</p>
        </section>

        <section className="shop-catalog" aria-label="Motorcycle catalog">
          <div className="shop-search-row">
            <label className="shop-search">
              <span className="visually-hidden">Search motorcycles and brands</span>
              <span aria-hidden="true" className="search-icon">⌕</span>
              <input
                type="search"
                value={filters.query}
                onChange={(event) => setFilters((current) => ({
                  ...current,
                  query: event.target.value,
                }))}
                placeholder="Search motorcycles or brands"
              />
            </label>
            <label className="shop-sort">
              <span>Sort by</span>
              <select
                value={filters.sort}
                onChange={(event) => setFilters((current) => ({
                  ...current,
                  sort: event.target.value,
                }))}
              >
                <option value="name">Name</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </label>
          </div>

          <div className="shop-layout">
            <FilterControls
              brands={brands}
              brandsLoading={brandsLoading}
              brandsError={brandsError}
              categories={categories}
              filters={{ ...filters, category: selectedCategory }}
              setFilters={setFilters}
              onCategoryChange={updateCategory}
              clearFilters={clearFilters}
              mobileOpen={mobileFiltersOpen}
              setMobileOpen={setMobileFiltersOpen}
            />
            <div className="shop-results">
              <div className="results-heading">
                <p aria-live="polite">
                  {loading
                    ? 'Loading motorcycles…'
                    : `${results.length} ${results.length === 1 ? 'motorcycle' : 'motorcycles'}`}
                </p>
              </div>

              {activeFilters.length > 0 && (
                <div className="active-filters" aria-label="Active filters">
                  {activeFilters.map((filter) => (
                    <button type="button" key={filter.key} onClick={filter.remove}>
                      {filter.label} <span aria-hidden="true">×</span>
                    </button>
                  ))}
                  <button type="button" className="active-clear" onClick={clearFilters}>Clear all</button>
                </div>
              )}

              {invalidRange && (
                <p className="shop-state shop-state-error" role="alert">
                  Minimum price must be less than or equal to maximum price.
                </p>
              )}
              {loading && <p className="shop-state" role="status">Loading the full motorcycle catalog…</p>}
              {!loading && error && (
                <div className="shop-state shop-state-error" role="alert">
                  <p>We couldn’t load the motorcycle catalog. {error}</p>
                  <button type="button" onClick={() => navigateTo(window.location.href)}>Try again</button>
                </div>
              )}
              {!loading && !error && motorcycles.length === 0 && (
                <p className="shop-state">
                  No active motorcycles are listed right now. Please check back soon.
                </p>
              )}
              {!loading && !error && !invalidRange && motorcycles.length > 0 && results.length === 0 && (
                <div className="shop-state">
                  <p>No motorcycles match these filters.</p>
                  <button type="button" onClick={clearFilters}>Clear filters</button>
                </div>
              )}
              {!loading && !error && !invalidRange && results.length > 0 && (
                <div className="shop-product-grid">
                  {results.map((motorcycle) => (
                    <ProductCard
                      key={motorcycle.id}
                      motorcycle={motorcycle}
                      returnTo={`${window.location.pathname}${window.location.search}`}
                      onEnquire={setEnquiryId}
                      onBook={setTestRideId}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
        <section className="shop-contact">
          <p className="eyebrow">A little more personal</p>
          <h2>Need help finding<br /><em>your ride?</em></h2>
          <p>Talk with our team about a motorcycle, service, or test ride.</p>
          <button className="button button-copper" type="button" onClick={() => setEnquiryId('')}>
            Make an enquiry <span aria-hidden="true">↗</span>
          </button>
        </section>
      </main>
      {enquiryId !== null && (
        <MotorcycleEnquiryDialog
          motorcycles={motorcycles}
          selectedMotorcycle={enquiryId}
          onClose={() => setEnquiryId(null)}
        />
      )}
      {testRideId !== null && (
        <TestRideDialog
          motorcycles={motorcycles}
          showrooms={showrooms}
          selectedMotorcycle={testRideId}
          onClose={() => setTestRideId(null)}
          loading={loading || showroomsLoading}
          error={showroomsError || error}
        />
      )}
    </div>
  )
}

export function MotorcycleDetailsPage({ motorcycleId }) {
  const [state, setState] = useState({ motorcycle: null, loading: true, error: '' })
  const [dialog, setDialog] = useState('')
  const {
    motorcycles,
    showrooms,
    motorcyclesLoading: loading,
    showroomsLoading,
    motorcyclesError: error,
    showroomsError,
  } = useShopCatalog()

  useEffect(() => {
    let isCurrent = true
    api.get(`/api/public/motorcycles/${encodeURIComponent(motorcycleId)}`)
      .then((response) => {
        if (isCurrent) setState({ motorcycle: response.data, loading: false, error: '' })
      })
      .catch((error) => {
        if (isCurrent) {
          setState({
            motorcycle: null,
            loading: false,
            notFound: error.response?.status === 404,
            error: error.response?.data?.message || 'This motorcycle could not be found.',
          })
        }
      })
    return () => {
      isCurrent = false
    }
  }, [motorcycleId])

  const motorcycle = state.motorcycle
  const requestedReturnPath = new URLSearchParams(window.location.search).get('returnTo')
  const returnTo = requestedReturnPath && /^\/shop(?:\?.*)?$/.test(requestedReturnPath)
    ? requestedReturnPath
    : '/shop'
  return (
    <div className="shop-page">
      <main className="motorcycle-detail-page">
        <InternalLink className="detail-back" href={returnTo}>← Back to Shop</InternalLink>
        {state.loading && <p className="shop-state" role="status">Loading motorcycle details…</p>}
        {!state.loading && state.error && (
          <div className="shop-state shop-state-error" role="alert">
            {state.notFound && <h1>Motorcycle not found</h1>}
            <p>{state.error}</p>
            <InternalLink className="detail-back" href={returnTo}>Back to Shop</InternalLink>
          </div>
        )}
        {motorcycle && (
          <div className="motorcycle-detail-layout">
            <MotorcycleImage image={motorcycle.image} name={motorcycle.name} />
            <div className="motorcycle-detail-copy">
              {motorcycle.brand?.name && <p className="eyebrow eyebrow-dark">{motorcycle.brand.name}</p>}
              <h1>{motorcycle.name || 'Motorcycle'}</h1>
              {motorcycle.category && <p className="detail-category">{motorcycle.category}</p>}
              <p className="detail-price">{priceText(motorcycle.price)}</p>
              {motorcycle.description && <p className="detail-description">{motorcycle.description}</p>}
              <div className="detail-actions">
                <button type="button" className="button button-copper" onClick={() => setDialog('test-ride')}>
                  Request a test ride <span aria-hidden="true">↗</span>
                </button>
                <button type="button" className="text-link" onClick={() => setDialog('enquiry')}>
                  Enquire about this model <span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      {dialog === 'enquiry' && (
        <MotorcycleEnquiryDialog
          motorcycles={motorcycles}
          selectedMotorcycle={motorcycleId}
          onClose={() => setDialog('')}
        />
      )}
      {dialog === 'test-ride' && (
        <TestRideDialog
          motorcycles={motorcycles}
          showrooms={showrooms}
          selectedMotorcycle={motorcycleId}
          onClose={() => setDialog('')}
          loading={loading || showroomsLoading}
          error={showroomsError || error}
        />
      )}
    </div>
  )
}

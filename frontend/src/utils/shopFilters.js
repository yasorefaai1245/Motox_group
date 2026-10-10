function brandIdOf(motorcycle) {
  return motorcycle.brand?.id ?? motorcycle.brand_id
}

function brandNameOf(motorcycle) {
  return motorcycle.brand?.name || ''
}

function hasValidPrice(motorcycle) {
  return motorcycle.price !== null
    && motorcycle.price !== undefined
    && motorcycle.price !== ''
    && Number.isFinite(Number(motorcycle.price))
}

export function filterMotorcycles(motorcycles, filters) {
  const query = filters.query.trim().toLocaleLowerCase()
  const minimum = filters.minimum === '' ? null : Number(filters.minimum)
  const maximum = filters.maximum === '' ? null : Number(filters.maximum)

  return motorcycles.filter((motorcycle) => {
    const brandId = String(brandIdOf(motorcycle) ?? '')
    const name = motorcycle.name?.toLocaleLowerCase() || ''
    const brand = brandNameOf(motorcycle).toLocaleLowerCase()
    if (filters.brands.length && !filters.brands.includes(brandId)) return false
    if (filters.category && motorcycle.category !== filters.category) return false
    if (query && !name.includes(query) && !brand.includes(query)) return false

    const price = Number(motorcycle.price)
    if (minimum !== null || maximum !== null) {
      if (!hasValidPrice(motorcycle)) return false
      if (minimum !== null && price < minimum) return false
      if (maximum !== null && price > maximum) return false
    }
    return true
  }).sort((first, second) => {
    if (filters.sort === 'price-asc' || filters.sort === 'price-desc') {
      const firstHasPrice = hasValidPrice(first)
      const secondHasPrice = hasValidPrice(second)
      if (firstHasPrice !== secondHasPrice) return firstHasPrice ? -1 : 1
      if (firstHasPrice && secondHasPrice) {
        return filters.sort === 'price-asc'
          ? Number(first.price) - Number(second.price)
          : Number(second.price) - Number(first.price)
      }
    }
    return String(first.name || '').localeCompare(String(second.name || ''))
  })
}

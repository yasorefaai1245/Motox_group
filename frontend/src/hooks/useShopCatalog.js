import { useEffect, useState } from 'react'
import api from '../services/api.js'
import { fetchPaginatedCollection } from '../utils/paginatedCollection.js'

const requestCache = new Map()

function getCachedRequest(path) {
  if (!requestCache.has(path)) {
    requestCache.set(
      path,
      api.get(path).finally(() => requestCache.delete(path)),
    )
  }
  return requestCache.get(path)
}

function getList(payload, label) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  throw new Error(`The ${label} response was not in the expected format.`)
}

async function getAllMotorcycles() {
  return fetchPaginatedCollection(
    async (path) => (await getCachedRequest(path)).data,
    '/api/public/motorcycles',
    'motorcycle catalog',
  )
}

function messageFromError(error) {
  return error.response?.data?.message || error.message || 'Please try again later.'
}

export function useShopCatalog() {
  const [state, setState] = useState({
    brands: [],
    motorcycles: [],
    showrooms: [],
    brandsLoading: true,
    motorcyclesLoading: true,
    showroomsLoading: true,
    motorcyclesError: '',
    brandsError: '',
    showroomsError: '',
  })

  useEffect(() => {
    let isCurrent = true

    const load = (promise, resource, errorKey) => {
      promise.then((data) => {
        if (isCurrent) {
          setState((current) => ({ ...current, [resource]: data, [`${resource}Loading`]: false }))
        }
      }).catch((error) => {
        if (isCurrent) {
          setState((current) => ({
            ...current,
            [`${resource}Loading`]: false,
            [errorKey]: messageFromError(error),
          }))
        }
      })
    }

    load(
      getCachedRequest('/api/public/brands').then((response) =>
        getList(response.data, 'brand catalog'),
      ),
      'brands',
      'brandsError',
    )
    load(getAllMotorcycles(), 'motorcycles', 'motorcyclesError')
    load(
      getCachedRequest('/api/public/showrooms').then((response) =>
        getList(response.data, 'showroom catalog'),
      ),
      'showrooms',
      'showroomsError',
    )

    return () => {
      isCurrent = false
    }
  }, [])

  return state
}

import { useEffect, useState } from 'react'
import api from '../services/api.js'
import { fetchPaginatedCollection } from '../utils/paginatedCollection.js'

const initialResource = { data: [], loading: true, error: '' }
const pendingRequests = new Map()

function extractList(response) {
  const payload = response.data
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.data)) return payload.data
  throw new Error('The catalog response was not in the expected format.')
}

function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Please try again later.'
}

function getPublicResource(path) {
  if (!pendingRequests.has(path)) {
    const request = api.get(path).finally(() => pendingRequests.delete(path))
    pendingRequests.set(path, request)
  }
  return pendingRequests.get(path)
}

export function usePublicCatalog() {
  const [brands, setBrands] = useState(initialResource)
  const [motorcycles, setMotorcycles] = useState(initialResource)
  const [services, setServices] = useState(initialResource)
  const [showrooms, setShowrooms] = useState(initialResource)

  useEffect(() => {
    let isCurrent = true

    const loadResource = async (path, setResource) => {
      let data = []
      let errorMessage = ''
      try {
        const response = await getPublicResource(path)
        data = extractList(response)
      } catch (error) {
        errorMessage = getErrorMessage(error)
      } finally {
        if (isCurrent) setResource({ data, loading: false, error: errorMessage })
      }
    }

    const loadMotorcycles = async () => {
      try {
        const data = await fetchPaginatedCollection(
          async (path) => (await getPublicResource(path)).data,
          '/api/public/motorcycles',
          'motorcycle catalog',
        )
        if (isCurrent) setMotorcycles({ data, loading: false, error: '' })
      } catch (error) {
        if (isCurrent) {
          setMotorcycles({ data: [], loading: false, error: getErrorMessage(error) })
        }
      }
    }

    void Promise.all([
      loadResource('/api/public/brands', setBrands),
      loadMotorcycles(),
      loadResource('/api/public/services', setServices),
      loadResource('/api/public/showrooms', setShowrooms),
    ])

    return () => {
      isCurrent = false
    }
  }, [])

  return { brands, motorcycles, services, showrooms }
}

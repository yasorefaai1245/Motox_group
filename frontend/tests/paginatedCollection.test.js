import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchPaginatedCollection } from '../src/utils/paginatedCollection.js'
import { filterMotorcycles } from '../src/utils/shopFilters.js'

test('loads every page of a paginated catalog once, in API order', async () => {
  const requested = []
  const pages = {
    '/api/public/motorcycles': {
      current_page: 1,
      last_page: 2,
      data: [
        { id: 1, name: 'Model 1', category: 'Road', price: null, brand: { name: 'Honda' } },
        { id: 2, name: 'Model 2', category: 'Road', price: null, brand: { name: 'Honda' } },
      ],
    },
    '/api/public/motorcycles?page=2': {
      current_page: 2,
      last_page: 2,
      data: [
        { id: 3, name: 'Model 3', category: 'Adventure', price: null, brand: { name: 'Honda' } },
      ],
    },
  }

  const items = await fetchPaginatedCollection(async (path) => {
    requested.push(path)
    return pages[path]
  }, '/api/public/motorcycles', 'motorcycle catalog')

  assert.deepEqual(requested, [
    '/api/public/motorcycles',
    '/api/public/motorcycles?page=2',
  ])
  assert.deepEqual(items.map((item) => item.id), [1, 2, 3])
  assert.deepEqual(
    filterMotorcycles(items, {
      query: 'model 3',
      brands: [],
      category: '',
      minimum: '',
      maximum: '',
      sort: 'name',
    }).map((item) => item.id),
    [3],
  )
})

test('accepts unpaginated array responses', async () => {
  const items = await fetchPaginatedCollection(
    async () => [{ id: 1 }, { id: 2 }],
    '/api/public/brands',
    'brand catalog',
  )

  assert.equal(items.length, 2)
})

test('rejects malformed response shapes instead of silently showing an empty catalog', async () => {
  await assert.rejects(
    fetchPaginatedCollection(
      async () => ({ unexpected: [] }),
      '/api/public/motorcycles',
      'motorcycle catalog',
    ),
    /response was not in the expected format/,
  )
})

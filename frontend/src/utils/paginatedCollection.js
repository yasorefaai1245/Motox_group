function readItems(payload, label) {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.data)) return payload.data
  throw new Error(`The ${label} response was not in the expected format.`)
}

export async function fetchPaginatedCollection(fetchPage, path, label) {
  const firstPayload = await fetchPage(path)
  const pages = Math.max(1, Number(firstPayload?.last_page) || 1)
  const firstItems = readItems(firstPayload, label)
  if (pages === 1) return firstItems

  const remainingPages = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      fetchPage(`${path}${path.includes('?') ? '&' : '?'}page=${index + 2}`),
    ),
  )

  return [
    ...firstItems,
    ...remainingPages.flatMap((payload) => readItems(payload, label)),
  ]
}

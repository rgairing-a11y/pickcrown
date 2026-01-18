export async function adminFetch(url) {
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  const json = await res.json()

  if (!json.success) {
    throw new Error(json.error || 'Admin request failed')
  }

  return json
}

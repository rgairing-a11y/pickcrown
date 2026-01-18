export async function adminFetch(path, options = {}) {
  try {
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    })

    const json = await res.json()

    if (!res.ok || json.success === false) {
      return {
        data: null,
        error: json.error || 'Request failed',
        hint: json.hint
      }
    }

    return { data: json.data, error: null }
  } catch (err) {
    console.error('[ADMIN FETCH ERROR]', err)

    return {
      data: null,
      error: 'Network error',
      hint: 'Please check your connection and try again'
    }
  }
}

/** Collect defined URLPattern pathname groups into a plain params record. */
export function normalizeParams(
  groups: Record<string, string | undefined>,
): Record<string, string> {
  const params: Record<string, string> = {}
  for (const [key, value] of Object.entries(groups)) {
    if (value !== undefined) {
      params[key] = value
    }
  }
  return params
}

/** Parse a location string into pathname + query record. */
export function parseLocation(path: string): {
  pathname: string
  query: Record<string, string>
  url: URL
} {
  const url = new URL(path, 'http://local.invalid')
  return {
    pathname: url.pathname,
    query: Object.fromEntries(url.searchParams),
    url,
  }
}

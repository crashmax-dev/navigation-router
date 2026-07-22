/**
 * History / location backend used by {@link Router}.
 */
export interface RouterAdapter {
  /** Current location path including search and hash (e.g. `/posts?page=1`). */
  getLocation(): string
  /** Subscribe to location changes. Returns an unsubscribe function. */
  listen(callback: (path: string) => void): () => void
  /** Navigate to `path`. When `replace` is true, replace the current history entry. */
  navigate(path: string, replace?: boolean): void
  /** Move through history by `delta` entries. */
  go(delta: number): void
  /** Build an href suitable for `<a href>` for the given path. */
  createHref(path: string): string
}

export interface RouterAdapter {
  getLocation(): string
  listen(callback: (path: string) => void): () => void
  navigate(path: string, replace?: boolean): void
  go(delta: number): void
  createHref(path: string): string
}

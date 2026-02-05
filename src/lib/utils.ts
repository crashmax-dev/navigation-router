export function convertPathToURLPattern(path: string): string {
  return path.replace(/:([^/]+)/g, ':$1')
}

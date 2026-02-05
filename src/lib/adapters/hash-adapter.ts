import type { RouterAdapter } from './router-adapter'

export class HashAdapter implements RouterAdapter {
  getLocation() {
    const hash = window.location.hash.slice(1)
    return hash.startsWith('/') ? hash : `/${hash}`
  }

  listen(callback: (path: string) => void) {
    const handler = () => {
      callback(this.getLocation())
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }

  navigate(path: string, replace?: boolean) {
    const url = this.createHref(path)
    if (replace) {
      const current = window.location.href.split('#')[0]
      window.location.replace(current + url)
    } else {
      window.location.hash = path
    }
  }

  go(delta: number) {
    window.history.go(delta)
  }

  createHref(path: string) {
    return `#${path}`
  }
}

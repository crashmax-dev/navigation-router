import type { RouterAdapter } from './router-adapter'

export class NavigationAdapter implements RouterAdapter {
  private base: string

  constructor(base = '') {
    this.base = base.endsWith('/') && base !== '/'
      ? base.slice(0, -1)
      : base
  }

  getLocation() {
    const { pathname, search, hash } = window.location
    const path = pathname.startsWith(this.base)
      ? pathname.slice(this.base.length)
      : pathname
    return (path || '/') + search + hash
  }

  listen(callback: (path: string) => void) {
    const navigation = window.navigation
    if (navigation) {
      const handler = (event: NavigateEvent) => {
        if (!event.canIntercept || event.hashChange || event.downloadRequest) {
          return
        }

        event.intercept({
          handler: async () => {
            const url = new URL(event.destination.url)
            const path = url.pathname.startsWith(this.base)
              ? url.pathname.slice(this.base.length)
              : url.pathname

            callback((path || '/') + url.search + url.hash)
          },
        })
      }

      navigation.addEventListener('navigate', handler)
      return () => navigation.removeEventListener('navigate', handler)
    }

    // fallback for older browsers
    const popstateHandler = () => callback(this.getLocation())
    window.addEventListener('popstate', popstateHandler)
    return () => window.removeEventListener('popstate', popstateHandler)
  }

  navigate(path: string, replace?: boolean) {
    const url = this.createHref(path)
    if (window.navigation) {
      window.navigation.navigate(url, {
        history: replace ? 'replace' : 'push',
      })
    } else {
      if (replace) {
        window.history.replaceState(null, '', url)
      } else {
        window.history.pushState(null, '', url)
      }
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  go(delta: number) {
    if (window.navigation) {
      if (delta > 0) window.navigation.forward()
      else window.navigation.back()
    } else {
      window.history.go(delta)
    }
  }

  createHref(path: string) {
    return this.base + path
  }
}

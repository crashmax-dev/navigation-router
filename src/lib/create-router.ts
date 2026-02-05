import { convertPathToURLPattern } from './utils'
import type {
  RouteComponent,
  RouteConstructor,
  RouteCtx,
} from './route-component'

export interface RouterConfig {
  routes: RouteConstructor[]
  renderRoot: () => HTMLElement | null
  navigationRoot: () => HTMLElement | null
  navigationRenderLink: (route: RouteComponent) => HTMLElement
}

export class Router {
  private routes: Map<string, RouteComponent> = new Map()
  private routesByName: Map<string, RouteComponent> = new Map()
  private urlPatterns: Map<URLPattern, RouteComponent> = new Map()
  private currentRoute: RouteComponent | null = null
  private currentElement: HTMLElement | null = null
  private config: RouterConfig
  private navigation: Navigation

  constructor(config: RouterConfig) {
    this.config = config

    if (typeof window.navigation === 'undefined') {
      throw new TypeError('Navigation API is not available')
    }

    this.navigation = window.navigation
  }

  init() {
    this.config.routes.forEach((RouteClass) => {
      const route = new RouteClass()
      this.routes.set(route.props.path, route)

      if (route.props.name) {
        this.routesByName.set(route.props.name, route)
      }

      const patternPath = convertPathToURLPattern(route.props.path)
      const pattern = new URLPattern({ pathname: patternPath })
      this.urlPatterns.set(pattern, route)
    })

    this.renderNavigation()

    this.navigation.addEventListener('navigate', (event: NavigateEvent) => {
      if (!event.canIntercept || event.hashChange || event.downloadRequest) {
        return
      }

      event.intercept({
        handler: async () => {
          await this.handleNavigation(event.destination.url)
        },
      })
    })

    this.handleNavigation(window.location.href)
  }

  private renderNavigation() {
    const navigationRoot = this.config.navigationRoot()
    if (!navigationRoot) {
      console.warn('Navigation container not found')
      return
    }

    navigationRoot.innerHTML = ''

    for (const route of this.routes.values()) {
      // skip dynamic routes
      if (route.props.path.includes(':')) continue

      const linkElement = this.config.navigationRenderLink(route)
      const anchor = linkElement.querySelector('a')

      if (anchor) {
        anchor.textContent = route.props.label || route.props.name || route.props.path
        // anchor.addEventListener('mouseenter', () => {
        //   this.prefetch(route.props.path);
        // });
      }

      navigationRoot.appendChild(linkElement)
    }
  }

  private async handleNavigation(url: string) {
    const renderRoot = this.config.renderRoot()
    if (!renderRoot) {
      console.warn('Root container not found')
      return
    }

    const parsedUrl = new URL(url)
    const matchResult = this.findRoute(parsedUrl)
    if (!matchResult) {
      console.warn(`Route not found: ${parsedUrl.pathname}`)
      return
    }

    if (this.currentRoute?.unmount) {
      this.currentRoute.unmount()
    }

    const query: Record<string, string> = {}
    parsedUrl.searchParams.forEach((value, key) => {
      query[key] = value
    })

    const ctx: RouteCtx = {
      query,
      params: matchResult.params,
      router: this,
    }

    const element = matchResult.route.render(ctx)

    if (this.currentElement) {
      renderRoot.removeChild(this.currentElement)
    }

    renderRoot.appendChild(element)

    this.currentRoute = matchResult.route
    this.currentElement = element
  }

  private findRoute(url: URL): { route: RouteComponent, params: Record<string, string> } | undefined {
    for (const [pattern, route] of this.urlPatterns.entries()) {
      const result = pattern.exec(url.href)

      if (result) {
        const params: Record<string, string> = {}

        if (result.pathname.groups) {
          Object.entries(result.pathname.groups).forEach(([key, value]) => {
            if (value) {
              params[key] = value
            }
          })
        }

        return { route, params }
      }
    }
  }

  // private prefetch(path: string) {
  //   console.log(`Prefetching: ${path}`);
  // }

  push(path: string) {
    this.navigation.navigate(path)
  }

  replace(path: string) {
    this.navigation.navigate(path, { history: 'replace' })
  }

  back() {
    this.navigation.back()
  }

  forward() {
    this.navigation.forward()
  }

  getUnsafe<T extends RouteConstructor>(filter: { name: string } | { path: string }): InstanceType<T> {
    let route: RouteComponent | undefined

    if ('name' in filter) {
      route = this.routesByName.get(filter.name)
    } else {
      route = this.routes.get(filter.path)
    }

    if (!route) {
      throw new Error(`Route not found: ${JSON.stringify(filter)}`)
    }

    return route as InstanceType<T>
  }
}

export function createRouter(config: RouterConfig): Router {
  return new Router(config)
}

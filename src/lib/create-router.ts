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
  private currentRoute: RouteComponent
  private currentElement: HTMLElement
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
      console.warn('[renderNavigation] Navigation container not found')
      return
    }

    navigationRoot.innerHTML = ''

    for (const route of this.routes.values()) {
      // skip dynamic routes
      if (route.props.path.includes(':')) continue

      const linkElement = this.config.navigationRenderLink(route)
      const anchor = linkElement instanceof HTMLAnchorElement
        ? linkElement
        : linkElement.querySelector('a')

      if (anchor) {
        anchor.textContent = route.props.label || route.props.name || route.props.path
        // TODO: implement prefetch
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
      console.warn('[handleNavigation] Root container not found')
      return
    }

    const parsedUrl = new URL(url)
    const matchResult = this.findRoute(parsedUrl)
    if (!matchResult) {
      console.warn('[handleNavigation] Route not found:', parsedUrl)
      return
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

    if (this.currentRoute?.unmount) {
      this.currentRoute.unmount()
    }

    const element = matchResult.route.mount(ctx) ?? matchResult.route.el
    if (!element) {
      console.warn('[handleNavigation] Route element is not defined:', matchResult.route.props)
      return
    }

    if (this.currentElement) {
      this.currentRoute.el = undefined
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

  // TODO: implement prefetch
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

  getUnsafe<T extends RouteConstructor>(filter: { name: string } | { path: string }): InstanceType<T> | undefined {
    let route: RouteComponent | undefined

    if ('name' in filter) {
      route = this.routesByName.get(filter.name)
    } else {
      route = this.routes.get(filter.path)
    }

    if (!route) {
      console.warn('[getUnsafe] Route not found:', filter)
      return
    }

    return route as InstanceType<T>
  }
}

export function createRouter(config: RouterConfig): Router {
  return new Router(config)
}

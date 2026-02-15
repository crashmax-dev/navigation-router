import { effect } from 'alien-signals'
import { convertPathToURLPattern } from './utils'
import type { RouterAdapter } from './adapters/router-adapter'
import type {
  RouteComponent,
  RouteConstructor,
  RouteCtx,
} from './route-component'

export interface RouterConfig {
  adapter: RouterAdapter
  routes: RouteConstructor[]
  renderRoot: () => HTMLElement | null
  navigationRoot: () => HTMLElement | null
  navigationRenderLink: (route: RouteComponent) => HTMLElement
}

export class Router {
  private config: RouterConfig
  private adapter: RouterAdapter

  private routes: Map<string, RouteComponent> = new Map()
  private urlPatterns: Map<URLPattern, RouteComponent> = new Map()

  private currentRoute: RouteComponent | null = null
  private currentRouteDisposers: (() => void)[] = []

  private navigationLinks: Map<string, HTMLElement> = new Map()

  constructor(config: RouterConfig) {
    this.config = config
    this.adapter = config.adapter
    this.init()
  }

  private init() {
    for (const RouteClass of this.config.routes) {
      const routeInstance = new RouteClass()
      this.routes.set(routeInstance.props.path, routeInstance)
      const patternPath = convertPathToURLPattern(routeInstance.props.path)
      const pattern = new URLPattern({ pathname: patternPath })
      this.urlPatterns.set(pattern, routeInstance)
    }

    this.renderNavigation()

    this.adapter.listen((path) => {
      this.handleNavigation(path)
    })

    this.handleNavigation(this.adapter.getLocation())
  }

  private renderNavigation() {
    const navigationRoot = this.config.navigationRoot()
    if (!navigationRoot) {
      console.warn('[renderNavigation] Navigation container not found')
      return
    }

    navigationRoot.innerHTML = ''

    this.navigationLinks.clear()
    for (const route of this.routes.values()) {
      // skip dynamic routes
      if (route.props.path.includes(':')) continue

      const linkElement = this.config.navigationRenderLink(route)
      const anchor = linkElement instanceof HTMLAnchorElement
        ? linkElement
        : linkElement.querySelector('a')

      if (anchor) {
        anchor.href = this.adapter.createHref(route.props.path)
        anchor.textContent = route.props.label || route.props.path

        anchor.addEventListener('click', (event) => {
          if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
            return
          }

          event.preventDefault()
          this.push(route.props.path)
        })

        if (route.onLinkMouseEnter) {
          anchor.addEventListener('mouseenter', (event) => {
            route.onLinkMouseEnter!(event)
          })
        }

        if (route.onLinkMouseLeave) {
          anchor.addEventListener('mouseleave', (event) => {
            route.onLinkMouseLeave!(event)
          })
        }
      }

      this.navigationLinks.set(route.props.path, anchor || linkElement)
      navigationRoot.appendChild(linkElement)
    }
  }

  private async handleNavigation(path: string) {
    const renderRoot = this.config.renderRoot()
    if (!renderRoot) {
      console.warn('[handleNavigation] Root container not found')
      return
    }

    const url = new URL(path, location.origin)
    const matchResult = this.findRoute(url)
    if (!matchResult) {
      console.warn('[handleNavigation] Route not found:', url)
      return
    }

    const ctx: RouteCtx = {
      query: Object.fromEntries(url.searchParams),
      params: matchResult.params,
      router: this,
    }

    if (this.currentRoute?.unmount) {
      this.currentRoute.unmount()
    }

    this.currentRouteDisposers.forEach((dispose) => dispose())
    this.currentRouteDisposers = []

    if (matchResult.route.setup) {
      await matchResult.route.setup(ctx)
    }

    this.currentRouteDisposers.push(
      effect(async () => {
        const content = matchResult.route.render(ctx) ?? matchResult.route.el
        if (!content) return
        renderRoot.replaceChildren(content)
      }),
    )

    this.currentRoute = matchResult.route
    this.updateActiveLink()
  }

  private updateActiveLink() {
    for (const [path, element] of this.navigationLinks.entries()) {
      if (path === this.currentRoute?.props.path) {
        element.classList.add('active')
      } else {
        element.classList.remove('active')
      }
    }
  }

  private findRoute(url: URL) {
    for (const [pattern, route] of this.urlPatterns.entries()) {
      const result = pattern.exec({ pathname: url.pathname })
      if (!result) continue

      return {
        route,
        params: result.pathname.groups,
      }
    }
  }

  push(path: string) {
    this.adapter.navigate(path)
  }

  replace(path: string) {
    this.adapter.navigate(path, true)
  }

  back() {
    this.adapter.go(-1)
  }

  forward() {
    this.adapter.go(1)
  }

  getUnsafe<T extends RouteConstructor>(
    filter: { path: string },
  ): InstanceType<T> | undefined {
    const route = this.routes.get(filter.path)

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

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
  private routesByName: Map<string, RouteComponent> = new Map()
  private urlPatterns: Map<URLPattern, RouteComponent> = new Map()

  private currentRoute: RouteComponent
  private currentElement: HTMLElement

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

      if (routeInstance.props.name) {
        this.routesByName.set(routeInstance.props.name, routeInstance)
      }

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
        anchor.textContent = route.props.label || route.props.name || route.props.path

        anchor.addEventListener('click', (event) => {
          if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
            return
          }

          event.preventDefault()
          this.push(route.props.path)
        })

        // TODO: implement prefetch
        // anchor.addEventListener('mouseenter', () => {
        //   this.prefetch(route.props.path);
        // });
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

    const element = matchResult.route.mount(ctx) ?? matchResult.route.el
    if (!element) {
      console.warn('[handleNavigation] Route element is not defined:', matchResult.route.props)
      return
    }

    if (this.currentElement) {
      renderRoot.removeChild(this.currentElement)
    }

    if (this.currentRoute) {
      this.currentRoute.el = undefined
    }

    renderRoot.appendChild(element)

    this.currentRoute = matchResult.route
    this.currentElement = element
    this.updateActiveLink()
  }

  private updateActiveLink() {
    this.navigationLinks.forEach((element, path) => {
      if (path === this.currentRoute?.props.path) {
        element.classList.add('active')
      } else {
        element.classList.remove('active')
      }
    })
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

  // TODO: implement prefetch
  // private prefetch(path: string) {
  //   console.log(`Prefetching: ${path}`);
  // }

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
    filter: { name: string } | { path: string },
  ): InstanceType<T> | undefined {
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

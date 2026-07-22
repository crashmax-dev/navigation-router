import { createLink } from './create-link'
import { normalizeParams, parseLocation } from './utils'
import type { RouterAdapter } from './adapters/router-adapter'
import type {
  RouteComponent,
  RouteConstructor,
  RouteCtx,
} from './route-component'

/** Optional built-in navigation menu configuration. */
export interface RouterNavigationConfig {
  root: () => HTMLElement | null
  renderLink: (route: RouteComponent) => HTMLElement
  /** Class toggled on the active link. Defaults to `active`. */
  activeClass?: string
}

/**
 * Router configuration.
 *
 * Core fields (`adapter`, `routes`, `renderRoot`) are required.
 * Built-in navigation is optional — use {@link createLink} + {@link Router.getRoutes}
 * for a fully custom menu.
 */
export interface RouterConfig {
  adapter: RouterAdapter
  routes: RouteConstructor[]
  renderRoot: () => HTMLElement | null
  navigation?: RouterNavigationConfig
  onNotFound?: (info: {
    path: string
    url: URL
    router: Router
  }) => HTMLElement | void
}

/** Result of {@link Router.match}. */
export interface RouteMatch {
  route: RouteComponent
  params: Record<string, string>
  query: Record<string, string>
}

/**
 * Client-side router powered by URLPattern matching and pluggable adapters.
 */
export class Router {
  private config: RouterConfig
  private adapter: RouterAdapter

  private routes: Map<string, RouteComponent> = new Map()
  private urlPatterns: Map<URLPattern, RouteComponent> = new Map()

  private currentRoute: RouteComponent | null = null
  private currentCtx: RouteCtx | null = null
  private navigationLinks: Map<string, HTMLElement> = new Map()

  private unlisten: (() => void) | null = null
  private navigationId = 0
  private destroyed = false

  constructor(config: RouterConfig) {
    this.config = config
    this.adapter = config.adapter
    this.init()
  }

  private init() {
    for (const RouteClass of this.config.routes) {
      const routeInstance = new RouteClass()
      this.routes.set(routeInstance.props.path, routeInstance)
      const pattern = new URLPattern({ pathname: routeInstance.props.path })
      this.urlPatterns.set(pattern, routeInstance)
    }

    if (this.config.navigation) {
      this.renderNavigation()
    }

    this.unlisten = this.adapter.listen((path) => {
      void this.handleNavigation(path)
    })

    void this.handleNavigation(this.adapter.getLocation())
  }

  private renderNavigation() {
    const navigation = this.config.navigation
    if (!navigation) return

    const navigationRoot = navigation.root()
    if (!navigationRoot) {
      console.warn('[renderNavigation] Navigation container not found')
      return
    }

    const activeClass = navigation.activeClass ?? 'active'
    navigationRoot.replaceChildren()
    this.navigationLinks.clear()

    for (const route of this.routes.values()) {
      if (route.props.path.includes(':')) continue

      const linkElement = navigation.renderLink(route)
      const anchor = linkElement instanceof HTMLAnchorElement
        ? linkElement
        : linkElement.querySelector('a')

      if (anchor) {
        createLink(this, route.props.path, {
          element: anchor,
          text: route.props.label || route.props.path,
        })
      }

      const tracked = anchor || linkElement
      tracked.classList.remove(activeClass)
      this.navigationLinks.set(route.props.path, tracked)
      navigationRoot.appendChild(linkElement)
    }
  }

  private mountCurrent(renderRoot: HTMLElement) {
    if (!this.currentRoute || !this.currentCtx) return
    const content = this.currentRoute.render(this.currentCtx) ?? this.currentRoute.el
    if (!content) return
    renderRoot.replaceChildren(content)
  }

  private async handleNavigation(path: string) {
    if (this.destroyed) return

    const renderRoot = this.config.renderRoot()
    if (!renderRoot) {
      console.warn('[handleNavigation] Root container not found')
      return
    }

    const navigationId = ++this.navigationId
    const { pathname, query, url } = parseLocation(path)
    const matchResult = this.findRoute(pathname)

    if (!matchResult) {
      if (this.currentRoute?.unmount) {
        this.currentRoute.unmount()
      }
      this.currentRoute = null
      this.currentCtx = null
      this.updateActiveLink()

      const fallback = this.config.onNotFound?.({
        path,
        url,
        router: this,
      })

      if (fallback) {
        renderRoot.replaceChildren(fallback)
      } else {
        renderRoot.replaceChildren()
      }
      return
    }

    const ctx: RouteCtx = {
      query,
      params: matchResult.params,
      router: this,
    }

    if (this.currentRoute?.unmount) {
      this.currentRoute.unmount()
    }

    this.currentRoute = null
    this.currentCtx = null

    if (matchResult.route.setup) {
      await matchResult.route.setup(ctx)
    }

    if (this.destroyed || navigationId !== this.navigationId) {
      return
    }

    this.currentRoute = matchResult.route
    this.currentCtx = ctx
    this.mountCurrent(renderRoot)
    this.updateActiveLink()
  }

  private updateActiveLink() {
    const activeClass = this.config.navigation?.activeClass ?? 'active'
    for (const [path, element] of this.navigationLinks.entries()) {
      if (path === this.currentRoute?.props.path) {
        element.classList.add(activeClass)
      } else {
        element.classList.remove(activeClass)
      }
    }
  }

  private findRoute(pathname: string): {
    route: RouteComponent
    params: Record<string, string>
  } | undefined {
    for (const [pattern, route] of this.urlPatterns.entries()) {
      const result = pattern.exec({ pathname })
      if (!result) continue

      return {
        route,
        params: normalizeParams(result.pathname.groups),
      }
    }
  }

  /** Navigate to `path` (push a history entry). */
  push(path: string) {
    this.adapter.navigate(path)
  }

  /** Navigate to `path`, replacing the current history entry. */
  replace(path: string) {
    this.adapter.navigate(path, true)
  }

  /** Go back one history entry. */
  back() {
    this.adapter.go(-1)
  }

  /** Go forward one history entry. */
  forward() {
    this.adapter.go(1)
  }

  /** Build an href for `path` via the configured adapter. */
  createHref(path: string) {
    return this.adapter.createHref(path)
  }

  /** Current location from the configured adapter. */
  getLocation() {
    return this.adapter.getLocation()
  }

  /**
   * Re-run `render` for the current route into `renderRoot`.
   * Use after mutating local route state (no reactive runtime required).
   */
  refresh() {
    if (this.destroyed || !this.currentRoute || !this.currentCtx) return
    const renderRoot = this.config.renderRoot()
    if (!renderRoot) return
    this.mountCurrent(renderRoot)
  }

  /** Look up a registered route instance by its path pattern. */
  getRoute(path: string): RouteComponent | undefined {
    return this.routes.get(path)
  }

  /** All registered route instances (registration order). */
  getRoutes(): RouteComponent[] {
    return [...this.routes.values()]
  }

  /** Currently matched route, or `null` when nothing matched. */
  getCurrentRoute(): RouteComponent | null {
    return this.currentRoute
  }

  /**
   * Match `path` against registered routes without navigating.
   * Returns `null` when no route matches.
   */
  match(path: string): RouteMatch | null {
    const { pathname, query } = parseLocation(path)
    const found = this.findRoute(pathname)
    if (!found) return null
    return {
      route: found.route,
      params: found.params,
      query,
    }
  }

  /**
   * Tear down the router: unsubscribe from the adapter and unmount the
   * current route.
   */
  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.navigationId++

    this.unlisten?.()
    this.unlisten = null

    if (this.currentRoute?.unmount) {
      this.currentRoute.unmount()
    }
    this.currentRoute = null
    this.currentCtx = null
    this.navigationLinks.clear()
  }
}

/** Create and initialize a {@link Router}. */
export function createRouter(config: RouterConfig): Router {
  return new Router(config)
}

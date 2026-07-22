import type { RouteComponent } from './route-component'

/** Minimal router surface required by {@link createLink}. */
export interface LinkRouter {
  createHref(path: string): string
  push(path: string): void
  getRoute(path: string): RouteComponent | undefined
}

export interface CreateLinkOptions {
  /** Existing anchor to enhance; otherwise a new `<a>` is created. */
  element?: HTMLAnchorElement
  /** Text content when creating a new element. */
  text?: string
  /** CSS class name(s) applied to the anchor. */
  className?: string
  /**
   * When true (default), attach the matched route's `onLinkMouseEnter` /
   * `onLinkMouseLeave` if present.
   */
  attachRouteHooks?: boolean
}

/**
 * Create (or enhance) an `<a>` that navigates via the router on click,
 * while preserving modifier-key / middle-click browser behavior.
 */
export function createLink(
  router: LinkRouter,
  path: string,
  options: CreateLinkOptions = {},
): HTMLAnchorElement {
  const {
    element = document.createElement('a'),
    text,
    className,
    attachRouteHooks = true,
  } = options

  element.href = router.createHref(path)

  if (text !== undefined) {
    element.textContent = text
  }

  if (className !== undefined) {
    element.className = className
  }

  element.addEventListener('click', (event) => {
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.altKey
      || event.ctrlKey
      || event.shiftKey
    ) {
      return
    }

    event.preventDefault()
    router.push(path)
  })

  if (attachRouteHooks) {
    const route = router.getRoute(path)
    if (route?.onLinkMouseEnter) {
      element.addEventListener('mouseenter', (event) => {
        route.onLinkMouseEnter!(event)
      })
    }
    if (route?.onLinkMouseLeave) {
      element.addEventListener('mouseleave', (event) => {
        route.onLinkMouseLeave!(event)
      })
    }
  }

  return element
}

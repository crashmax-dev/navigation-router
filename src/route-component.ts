import type { Router } from './create-router'

/** Static metadata declared by a route. */
export interface RouteComponentProps {
  /** Path pattern, e.g. `/`, `/about`, `/blog/:id`. */
  path: string
  /** Optional label used by built-in navigation links. */
  label?: string
}

/**
 * Context passed to `setup` / `render`.
 *
 * Type parameter shape:
 * ```ts
 * RouteCtx<{ Params: { id: string }; Query: { page: string } }>
 * ```
 */
export interface RouteCtx<T = unknown> {
  query: T extends { Query: infer Q } ? Q : Record<string, string | undefined>
  params: T extends { Params: infer P } ? P : Record<string, string | undefined>
  router: Router
}

/**
 * Base class for route views.
 *
 * Extend and implement {@link RouteComponent.render}. Optionally override
 * `setup`, `unmount`, and link hover hooks.
 */
export abstract class RouteComponent<T = unknown> {
  el?: HTMLElement
  props: RouteComponentProps

  constructor(props: RouteComponentProps) {
    this.props = props
  }

  /** Called once before the first render for a matched navigation. */
  setup?(ctx: RouteCtx<T>): Promise<void> | void

  /** Produce DOM for the current match. May return void and use `this.el`. */
  abstract render(ctx: RouteCtx<T>): HTMLElement | void

  /** Cleanup when leaving the route. */
  unmount?(): void

  /** Invoked when a link to this route is hovered (built-in nav / createLink). */
  onLinkMouseEnter?(event: MouseEvent): void

  /** Invoked when the pointer leaves a link to this route. */
  onLinkMouseLeave?(event: MouseEvent): void
}

/** Constructor type accepted by {@link RouterConfig.routes}. */
export type RouteConstructor<T = unknown> = new () => RouteComponent<T>

import type { Router } from './create-router'

export interface RouteComponentProps {
  path: string
  label?: string
  name?: string
}

export interface RouteCtx<T = unknown> {
  query: T extends { Query: infer Q } ? Q : Record<string, string>
  params: T extends { Params: infer P } ? P : Record<string, string>
  router: Router
}

export abstract class RouteComponent<T = unknown> {
  props: RouteComponentProps

  constructor(props: RouteComponentProps) {
    this.props = props
  }

  abstract render(ctx: RouteCtx<T>): HTMLElement

  unmount?(): void
}

export type RouteConstructor<T = unknown> = new () => RouteComponent<T>

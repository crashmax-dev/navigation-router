/// <reference path="./url-pattern.d.ts" />

export { HashAdapter } from './adapters/hash-adapter'
export { MemoryAdapter } from './adapters/memory-adapter'
export { NavigationAdapter } from './adapters/navigation-adapter'
export type { RouterAdapter } from './adapters/router-adapter'
export {
  createLink,
  type CreateLinkOptions,
  type LinkRouter,
} from './create-link'
export {
  createRouter,
  type RouteMatch,
  Router,
  type RouterConfig,
  type RouterNavigationConfig,
} from './create-router'
export {
  RouteComponent,
  type RouteComponentProps,
  type RouteConstructor,
  type RouteCtx,
} from './route-component'

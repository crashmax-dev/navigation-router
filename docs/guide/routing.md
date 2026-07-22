# Routing

Routes are classes extending `RouteComponent`.

## Declaring a route

```ts
import { RouteComponent, type RouteCtx } from 'navigation-router'

export class BlogRoute extends RouteComponent {
  constructor() {
    super({
      path: '/blog/:id',
      // label is used by built-in navigation when present
    })
  }

  render(ctx: RouteCtx<{ Params: { id: string } }>) {
    const el = document.createElement('section')
    el.textContent = `Post ${ctx.params.id}`
    return el
  }
}
```

Path patterns use URLPattern pathname syntax (`:param` named groups).

## Lifecycle

| Hook | When |
| --- | --- |
| `setup(ctx)` | After a match, before the first `render`. May be `async`. |
| `render(ctx)` | Produces DOM for the current match. Called once after `setup`, and again on `router.refresh()`. |
| `unmount()` | When leaving the route (or on `destroy()`). |

There is no reactive runtime. Mutate local state, then call `ctx.router.refresh()` to re-render.

```ts
class PostsRoute extends RouteComponent {
  async setup() {
    // fetch, subscribe, etc.
  }

  render() {
    // return HTMLElement or set this.el
  }

  unmount() {
    // abort fetches, remove listeners
  }
}
```

If a newer navigation starts while `setup` is still awaiting, the router ignores the stale completion (race guard).

## Typed context

```ts
RouteCtx<{
  Params: { id: string }
  Query: { tab?: string }
}>
```

Without a type argument, `params` and `query` are `Record<string, string | undefined>`.

## Looking up routes

```ts
router.getRoute('/posts')
router.getRoutes()
router.getCurrentRoute()
router.match('/blog/3?tab=meta')
// → { route, params: { id: '3' }, query: { tab: 'meta' } } | null
```

## 404 handling

```ts
createRouter({
  // ...
  onNotFound: ({ path, router }) => {
    const el = document.createElement('section')
    el.textContent = `Not found: ${path}`
    return el
  },
})
```

If `onNotFound` returns an element it is mounted into `renderRoot`. Otherwise the outlet is cleared.

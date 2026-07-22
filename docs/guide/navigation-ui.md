# Navigation UI

Navigation chrome is **optional**. The router core only requires `adapter`, `routes`, and `renderRoot`.

## Built-in navigation

```ts
createRouter({
  adapter,
  routes,
  renderRoot: () => document.querySelector('#app'),
  navigation: {
    root: () => document.querySelector('#navigation'),
    renderLink: (route) => {
      const a = document.createElement('a')
      a.className = 'link'
      return a
    },
    activeClass: 'active', // default
  },
})
```

Behavior:

- Skips dynamic paths that contain `:`
- Sets `href` / click handling via `createLink`
- Toggles `activeClass` on the current static route
- Forwards `onLinkMouseEnter` / `onLinkMouseLeave` from the route

## Custom menu with createLink

```ts
import { createLink, createRouter } from 'navigation-router'

const router = createRouter({
  adapter,
  routes,
  renderRoot: () => document.querySelector('#app'),
  // no navigation config
})

const nav = document.querySelector('#navigation')!

for (const route of router.getRoutes()) {
  if (route.props.path.includes(':')) continue
  nav.appendChild(
    createLink(router, route.props.path, {
      className: 'link',
      text: route.props.label ?? route.props.path,
    }),
  )
}
```

`createLink`:

- Sets `href` through `router.createHref`
- Intercepts primary clicks (ignores modifier keys / non-left button)
- Optionally wires route hover hooks (`attachRouteHooks`, default `true`)

## Prefetch on hover

```ts
class PostsRoute extends RouteComponent {
  onLinkMouseEnter() {
    // warm cache / start fetch
  }
}
```

Works with both built-in navigation and `createLink`.

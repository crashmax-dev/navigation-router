# Getting started

## Install

```bash
pnpm add navigation-router
```

Optional types for the Navigation API:

```bash
pnpm add -D navigation-api-types
```

## HTML shell

```html
<header id="navigation"></header>
<main id="app"></main>
```

## Minimal example

```ts
import {
  createRouter,
  NavigationAdapter,
  RouteComponent,
  type RouteCtx,
} from 'navigation-router'

class HomeRoute extends RouteComponent {
  constructor() {
    super({ path: '/', label: 'Home' })
  }

  render(_ctx: RouteCtx) {
    const section = document.createElement('section')
    section.textContent = 'Home'
    return section
  }
}

class AboutRoute extends RouteComponent {
  constructor() {
    super({ path: '/about', label: 'About' })
  }

  render(_ctx: RouteCtx) {
    const section = document.createElement('section')
    section.textContent = 'About'
    return section
  }
}

const router = createRouter({
  adapter: new NavigationAdapter(),
  routes: [HomeRoute, AboutRoute],
  renderRoot: () => document.querySelector('#app'),
  navigation: {
    root: () => document.querySelector('#navigation'),
    renderLink: () => {
      const link = document.createElement('a')
      link.className = 'link'
      return link
    },
  },
})

// later
router.push('/about')
router.destroy()
```

`renderRoot` and `navigation.root` must resolve to live elements when navigation happens. Returning `null` logs a warning and skips rendering.

## Run the playground

```bash
pnpm install
pnpm dev
```

Open the local Vite URL. Use the adapter select in the top bar to switch between `NavigationAdapter`, `HashAdapter`, and `MemoryAdapter`.

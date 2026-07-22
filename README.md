# navigation-router

Client-side router for vanilla TypeScript apps, built on the [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API) and [URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API).

## Install

```bash
pnpm add navigation-router
```

Optional types for the Navigation API:

```bash
pnpm add -D navigation-api-types
```

## Features

- Class-based routes with `setup` / `render` / `unmount`
- Typed `params` and `query` via `RouteCtx`
- Pluggable adapters: Navigation, Hash, Memory
- Optional built-in nav UI, or `createLink` + `getRoutes`
- Race-safe async `setup`, `onNotFound`, `refresh()`, `destroy()`
- Zero runtime dependencies

## Quick start

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
    const el = document.createElement('section')
    el.textContent = 'Home'
    return el
  }
}

const router = createRouter({
  adapter: new NavigationAdapter(),
  routes: [HomeRoute],
  renderRoot: () => document.querySelector('#app'),
})
```

## Development

```bash
pnpm install
pnpm dev          # playground
pnpm docs:dev     # VitePress docs
pnpm test         # Vitest
pnpm build:lib    # emit dist/ for publish
```

## Publish

1. Bump `version` in `package.json`
2. Commit and push to `master`
3. Create a GitHub Release with tag `vX.Y.Z` matching that version

CI runs [`.github/workflows/publish.yaml`](.github/workflows/publish.yaml) on release and publishes to npm with provenance.

Requires repository secret `NPM_TOKEN` (Automation or Publish token from npmjs.com).

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Playground (Vite) |
| `pnpm build:lib` | Build publishable `dist/` |
| `pnpm build:playground` | Build playground |
| `pnpm build:site` | Docs + playground → `site/` (GitHub Pages) |
| `pnpm build` | Typecheck + lib + playground |
| `pnpm test` | Unit tests |
| `pnpm docs:dev` | Documentation site |
| `pnpm lint` | ESLint |

## Project layout

```
src/           library source
dist/          published build output
playground/    interactive demo
docs/          VitePress documentation
tests/         Vitest suite
```

## Documentation

- Local: `pnpm docs:dev`
- Guide: [docs/guide/getting-started.md](docs/guide/getting-started.md)

## License

MIT

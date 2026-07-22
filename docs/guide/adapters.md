# Adapters

Every router needs a `RouterAdapter` — the history / location backend.

```ts
interface RouterAdapter {
  getLocation(): string
  listen(callback: (path: string) => void): () => void
  navigate(path: string, replace?: boolean): void
  go(delta: number): void
  createHref(path: string): string
}
```

## NavigationAdapter

Best default for modern SPAs.

```ts
new NavigationAdapter()
new NavigationAdapter('/my-app') // base path
```

Uses the Navigation API when available, otherwise `history.pushState` / `replaceState` + `popstate`.

## HashAdapter

Stores the route in `location.hash` (`#/about`). Useful for static hosting without rewrite rules.

```ts
new HashAdapter()
```

## MemoryAdapter

In-memory stack. No DOM side effects — prefer this in unit tests.

```ts
new MemoryAdapter('/start')
```

## Choosing one

| Environment | Adapter |
| --- | --- |
| App with server fallback / Navigation API | `NavigationAdapter` |
| GitHub Pages / static CDN | `HashAdapter` |
| Vitest / Storybook / Node | `MemoryAdapter` |

You can implement a custom adapter for unusual hosts as long as it satisfies `RouterAdapter`.

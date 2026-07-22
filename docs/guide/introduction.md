# Introduction

`navigation-router` is a small client-side router for vanilla TypeScript / DOM apps.

It leans on two web platform APIs:

- [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API) — intercept in-app navigations when available
- [URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API) — match pathnames and extract named groups

## What you get

- Class-based routes (`RouteComponent`)
- Typed `params` / `query` via `RouteCtx`
- History backends through `RouterAdapter`
- Optional built-in navigation menu, or roll your own with `createLink` + `getRoutes`
- `destroy()` for clean teardown (tests / HMR)

## Browser support

| Feature | Notes |
| --- | --- |
| `URLPattern` | Required. Available in Chromium / Safari / recent Firefox; polyfill in tests via `urlpattern-polyfill`. |
| Navigation API | Used by `NavigationAdapter` when present; falls back to `history` + `popstate`. |
| Hash routing | Use `HashAdapter` on hosts without SPA path rewrites (e.g. GitHub Pages). |

## Mental model

```
adapter.listen(path)
  → match URLPattern
  → unmount previous
  → await setup(ctx)
  → render(ctx) → renderRoot
  → refresh() re-runs render when local state changes
```

Adapters own the address bar (or memory). The router owns matching and the route lifecycle.

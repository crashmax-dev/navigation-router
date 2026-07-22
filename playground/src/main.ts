import { el } from '@zero-dependency/dom'
import {
  createLink,
  createRouter,
  HashAdapter,
  MemoryAdapter,
  NavigationAdapter,
} from 'navigation-router'
import { AboutRoute } from './routes/about'
import { BlogRoute } from './routes/blog'
import { HomeRoute } from './routes/home'
import { PostsRoute } from './routes/posts'
import type { Router, RouterAdapter } from 'navigation-router'

import './style.css'

type AdapterKind = 'navigation' | 'hash' | 'memory'

const ADAPTER_STORAGE_KEY = 'navigation-router:adapter'

function resolveInitialAdapter(): AdapterKind {
  const stored = localStorage.getItem(ADAPTER_STORAGE_KEY) as AdapterKind | null
  if (stored === 'navigation' || stored === 'hash' || stored === 'memory') {
    return stored
  }
  return import.meta.env.DEV ? 'navigation' : 'hash'
}

function createAdapter(kind: AdapterKind): RouterAdapter {
  switch (kind) {
    case 'hash':
      return new HashAdapter()
    case 'memory':
      return new MemoryAdapter('/')
    case 'navigation':
    default:
      return new NavigationAdapter(import.meta.env.BASE_URL)
  }
}

function renderNotFound(path: string, router: Router) {
  return el('section', { className: 'not-found' }, [
    el('h1', '404'),
    el('p', `No route matched: ${path}`),
    el('button', {
      onclick: () => router.push('/'),
    }, 'Back home'),
  ])
}

function renderCustomNav(router: Router, container: HTMLElement) {
  container.replaceChildren()

  for (const route of router.getRoutes()) {
    if (route.props.path.includes(':')) continue

    container.appendChild(
      createLink(router, route.props.path, {
        className: 'link',
        text: route.props.label || route.props.path,
      }),
    )
  }

  container.appendChild(
    createLink(router, '/blog/1', {
      className: 'link',
      text: 'Blog',
      attachRouteHooks: false,
    }),
  )
}

function syncActiveLinks(router: Router, container: HTMLElement) {
  const current = router.getCurrentRoute()
  const location = router.getLocation()
  const matched = router.match(location)

  for (const link of container.querySelectorAll<HTMLAnchorElement>('a.link')) {
    const hrefPath = link.getAttribute('data-route-path')
    const isActive = Boolean(
      current
      && hrefPath
      && (
        hrefPath === current.props.path
        || (matched && matched.route.props.path === hrefPath)
      ),
    )
    link.classList.toggle('active', isActive)
  }
}

function boot() {
  const kind = resolveInitialAdapter()
  const navigationRoot = document.querySelector<HTMLElement>('#navigation')!
  const debugRoot = document.querySelector<HTMLElement>('#debug')!
  const appRoot = document.querySelector<HTMLElement>('#app')!

  const adapterSelect = el('select', {
    id: 'adapter-select',
    onchange: (event: Event) => {
      const next = (event.target as HTMLSelectElement).value as AdapterKind
      localStorage.setItem(ADAPTER_STORAGE_KEY, next)
      location.reload()
    },
  }, [
    el('option', { value: 'navigation' }, 'NavigationAdapter'),
    el('option', { value: 'hash' }, 'HashAdapter'),
    el('option', { value: 'memory' }, 'MemoryAdapter'),
  ])
  adapterSelect.value = kind

  debugRoot.append(el('label', ['Adapter ', adapterSelect]))

  const router = createRouter({
    adapter: createAdapter(kind),
    routes: [
      HomeRoute,
      AboutRoute,
      BlogRoute,
      PostsRoute,
    ],
    renderRoot: () => appRoot,
    onNotFound: ({ path, router: r }) => renderNotFound(path, r),
  })

  renderCustomNav(router, navigationRoot)

  // Tag links with route paths for active-state sync
  for (const link of navigationRoot.querySelectorAll<HTMLAnchorElement>('a.link')) {
    const text = link.textContent || ''
    const route = router.getRoutes().find(r => r.props.label === text || r.props.path === text)
    if (route) {
      link.dataset.routePath = route.props.path
    } else if (text === 'Blog') {
      link.dataset.routePath = '/blog/:id'
    }
  }

  const refreshDebug = () => {
    syncActiveLinks(router, navigationRoot)
  }

  const patch = <T extends (...args: never[]) => void>(fn: T): T => {
    return ((...args: never[]) => {
      fn(...args)
      queueMicrotask(refreshDebug)
    }) as T
  }

  router.push = patch(router.push.bind(router))
  router.replace = patch(router.replace.bind(router))
  router.back = patch(router.back.bind(router))
  router.forward = patch(router.forward.bind(router))

  window.addEventListener('hashchange', refreshDebug)
  window.addEventListener('popstate', refreshDebug)

  refreshDebug()

  // @ts-expect-error debug handle
  window.$router = router

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      router.destroy()
    })
  }
}

boot()

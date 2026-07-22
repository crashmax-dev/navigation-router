import {
  createLink,
  createRouter,
  MemoryAdapter,
  RouteComponent,
} from 'navigation-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, LifecycleRoute, StaticRoute } from './helpers'

describe('router', () => {
  let root: HTMLElement

  beforeEach(() => {
    document.body.innerHTML = ''
    root = createRoot()
    LifecycleRoute.reset()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('matches path, params and query', async () => {
    class BlogRoute extends StaticRoute {
      constructor() {
        super('/blog/:id')
      }
    }

    const router = createRouter({
      adapter: new MemoryAdapter('/blog/42?tab=comments'),
      routes: [BlogRoute],
      renderRoot: () => root,
    })

    await vi.waitFor(() => {
      expect(root.textContent).toContain('/blog/:id')
    })

    const match = router.match('/blog/7?sort=asc')
    expect(match).not.toBeNull()
    expect(match!.params).toEqual({ id: '7' })
    expect(match!.query).toEqual({ sort: 'asc' })
    expect(match!.route.props.path).toBe('/blog/:id')

    router.destroy()
  })

  it('supports push, replace, back and forward', async () => {
    class Home extends StaticRoute {
      constructor() {
        super('/')
      }
    }
    class About extends StaticRoute {
      constructor() {
        super('/about')
      }
    }

    const router = createRouter({
      adapter: new MemoryAdapter('/'),
      routes: [Home, About],
      renderRoot: () => root,
    })

    await vi.waitFor(() => expect(root.textContent).toContain('/'))

    router.push('/about')
    await vi.waitFor(() => expect(root.textContent).toContain('/about'))
    expect(router.getLocation()).toBe('/about')

    router.replace('/about?x=1')
    await vi.waitFor(() => expect(root.textContent).toContain('"x":"1"'))

    router.back()
    await vi.waitFor(() => expect(router.getLocation()).toBe('/'))

    router.forward()
    await vi.waitFor(() => expect(router.getLocation()).toContain('/about'))

    router.destroy()
  })

  it('runs setup, render and unmount lifecycle', async () => {
    class Home extends LifecycleRoute {
      constructor() {
        super('/')
      }
    }
    class About extends LifecycleRoute {
      constructor() {
        super('/about')
      }
    }

    const router = createRouter({
      adapter: new MemoryAdapter('/'),
      routes: [Home, About],
      renderRoot: () => root,
    })

    await vi.waitFor(() => expect(LifecycleRoute.renderCount).toBeGreaterThan(0))
    expect(LifecycleRoute.setupCount).toBe(1)

    router.push('/about')
    await vi.waitFor(() => expect(LifecycleRoute.unmountCount).toBe(1))
    expect(LifecycleRoute.setupCount).toBe(2)

    router.destroy()
  })

  it('calls onNotFound and clears the outlet when no route matches', async () => {
    class Home extends StaticRoute {
      constructor() {
        super('/')
      }
    }

    const onNotFound = vi.fn(({ path }) => {
      const el = document.createElement('section')
      el.textContent = `missing:${path}`
      return el
    })

    const router = createRouter({
      adapter: new MemoryAdapter('/'),
      routes: [Home],
      renderRoot: () => root,
      onNotFound,
    })

    await vi.waitFor(() => expect(root.textContent).toContain('/'))

    router.push('/nope')
    await vi.waitFor(() => {
      expect(onNotFound).toHaveBeenCalled()
      expect(root.textContent).toBe('missing:/nope')
    })
    expect(router.getCurrentRoute()).toBeNull()

    router.destroy()
  })

  it('renders optional navigation and toggles active class', async () => {
    class Home extends StaticRoute {
      constructor() {
        super('/', 'Home')
      }
    }
    class About extends StaticRoute {
      constructor() {
        super('/about', 'About')
      }
    }
    class Blog extends StaticRoute {
      constructor() {
        super('/blog/:id', 'Blog')
      }
    }

    const nav = document.createElement('nav')
    document.body.appendChild(nav)

    const router = createRouter({
      adapter: new MemoryAdapter('/'),
      routes: [Home, About, Blog],
      renderRoot: () => root,
      navigation: {
        root: () => nav,
        renderLink: () => {
          const a = document.createElement('a')
          a.className = 'link'
          return a
        },
        activeClass: 'is-active',
      },
    })

    await vi.waitFor(() => expect(nav.querySelectorAll('a').length).toBe(2))
    expect(nav.textContent).not.toContain('Blog')

    const homeLink = [...nav.querySelectorAll('a')].find(a => a.textContent === 'Home')
    expect(homeLink?.classList.contains('is-active')).toBe(true)

    router.push('/about')
    await vi.waitFor(() => {
      const aboutLink = [...nav.querySelectorAll('a')].find(a => a.textContent === 'About')
      expect(aboutLink?.classList.contains('is-active')).toBe(true)
      expect(homeLink?.classList.contains('is-active')).toBe(false)
    })

    router.destroy()
  })

  it('destroy unsubscribes and stops rendering', async () => {
    class Home extends StaticRoute {
      constructor() {
        super('/')
      }
    }
    class About extends StaticRoute {
      constructor() {
        super('/about')
      }
    }

    const adapter = new MemoryAdapter('/')
    const router = createRouter({
      adapter,
      routes: [Home, About],
      renderRoot: () => root,
    })

    await vi.waitFor(() => expect(root.textContent).toContain('/'))
    router.destroy()
    root.textContent = 'stale'

    adapter.navigate('/about')
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(root.textContent).toBe('stale')
  })

  it('ignores stale setup after a newer navigation', async () => {
    class Slow extends LifecycleRoute {
      constructor() {
        super('/slow', 40)
      }
    }
    class Fast extends LifecycleRoute {
      constructor() {
        super('/fast', 0)
      }
    }

    const adapter = new MemoryAdapter('/slow')
    const router = createRouter({
      adapter,
      routes: [Slow, Fast],
      renderRoot: () => root,
    })

    // Immediately navigate away before slow setup finishes
    router.push('/fast')

    await vi.waitFor(() => {
      expect(root.textContent).toBe('/fast')
    })

    // Allow the slow setup to finish; UI should stay on /fast
    await new Promise(resolve => setTimeout(resolve, 60))
    expect(root.textContent).toBe('/fast')
    expect(router.getCurrentRoute()?.props.path).toBe('/fast')

    router.destroy()
  })

  it('exposes getRoute, getRoutes and createHref', () => {
    class Home extends StaticRoute {
      constructor() {
        super('/', 'Home')
      }
    }

    const router = createRouter({
      adapter: new MemoryAdapter('/'),
      routes: [Home],
      renderRoot: () => root,
    })

    expect(router.getRoute('/')?.props.label).toBe('Home')
    expect(router.getRoutes()).toHaveLength(1)
    expect(router.createHref('/about')).toBe('/about')

    router.destroy()
  })

  it('createLink navigates on click without modifiers', async () => {
    class Home extends StaticRoute {
      constructor() {
        super('/')
      }
    }
    class About extends StaticRoute {
      constructor() {
        super('/about')
      }
    }

    const router = createRouter({
      adapter: new MemoryAdapter('/'),
      routes: [Home, About],
      renderRoot: () => root,
    })

    await vi.waitFor(() => expect(root.textContent).toContain('/'))

    const link = createLink(router, '/about', { text: 'About', className: 'link' })
    document.body.appendChild(link)
    link.click()

    await vi.waitFor(() => expect(router.getLocation()).toBe('/about'))

    router.destroy()
  })

  it('refresh re-runs render for the current route', async () => {
    let ticks = 0

    class CounterRoute extends RouteComponent {
      constructor() {
        super({ path: '/' })
      }

      render() {
        ticks += 1
        const el = document.createElement('section')
        el.textContent = `ticks:${ticks}`
        return el
      }
    }

    const router = createRouter({
      adapter: new MemoryAdapter('/'),
      routes: [CounterRoute],
      renderRoot: () => root,
    })

    await vi.waitFor(() => expect(root.textContent).toBe('ticks:1'))
    router.refresh()
    expect(root.textContent).toBe('ticks:2')

    router.destroy()
  })

  it('getCurrentRoute reflects the matched route', async () => {
    class Home extends StaticRoute {
      constructor() {
        super('/')
      }
    }

    const router = createRouter({
      adapter: new MemoryAdapter('/'),
      routes: [Home],
      renderRoot: () => root,
    })

    await vi.waitFor(() => {
      expect(router.getCurrentRoute()?.props.path).toBe('/')
    })

    router.destroy()
  })
})

describe('route component hooks via createLink', () => {
  it('attaches mouse enter/leave hooks', () => {
    const enter = vi.fn()
    const leave = vi.fn()

    class Home extends RouteComponent {
      constructor() {
        super({ path: '/' })
      }

      render() {
        return document.createElement('section')
      }

      onLinkMouseEnter = enter
      onLinkMouseLeave = leave
    }

    const root = createRoot()
    const router = createRouter({
      adapter: new MemoryAdapter('/'),
      routes: [Home],
      renderRoot: () => root,
    })

    const link = createLink(router, '/', { text: 'Home' })
    link.dispatchEvent(new Event('mouseenter'))
    link.dispatchEvent(new Event('mouseleave'))

    expect(enter).toHaveBeenCalledTimes(1)
    expect(leave).toHaveBeenCalledTimes(1)

    router.destroy()
  })
})

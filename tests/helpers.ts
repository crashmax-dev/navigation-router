import { RouteComponent } from 'navigation-router'
import type { RouteCtx } from 'navigation-router'

export class StaticRoute extends RouteComponent {
  constructor(path: string, label?: string) {
    super({ path, label })
  }

  render(ctx: RouteCtx) {
    const el = document.createElement('section')
    el.dataset.path = this.props.path
    el.textContent = `${this.props.path} params=${JSON.stringify(ctx.params)} query=${JSON.stringify(ctx.query)}`
    return el
  }
}

export class LifecycleRoute extends RouteComponent {
  static setupCount = 0
  static unmountCount = 0
  static renderCount = 0
  static lastSetupOrder: number[] = []

  private order: number
  private delayMs: number

  constructor(path: string, delayMs = 0) {
    super({ path })
    this.order = 0
    this.delayMs = delayMs
  }

  static reset() {
    LifecycleRoute.setupCount = 0
    LifecycleRoute.unmountCount = 0
    LifecycleRoute.renderCount = 0
    LifecycleRoute.lastSetupOrder = []
  }

  async setup() {
    const order = ++LifecycleRoute.setupCount
    this.order = order
    LifecycleRoute.lastSetupOrder.push(order)
    if (this.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delayMs))
    }
  }

  render() {
    LifecycleRoute.renderCount++
    const el = document.createElement('section')
    el.dataset.order = String(this.order)
    el.textContent = this.props.path
    return el
  }

  unmount() {
    LifecycleRoute.unmountCount++
  }
}

export function createRoot() {
  const root = document.createElement('div')
  document.body.appendChild(root)
  return root
}

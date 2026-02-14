import { el } from '@zero-dependency/dom'
import { RouteComponent } from 'navigation-router'
import type { RouteCtx } from 'navigation-router'

export class AboutRoute extends RouteComponent {
  constructor() {
    super({
      path: '/about',
      label: 'About',
    })
  }

  render(ctx: RouteCtx<{ Query: { timestamp: string } }>) {
    return el('div', [
      el('h1', 'About Page'),
      el('p', 'This is the about page.'),
      ctx.query.timestamp
        ? el('p', `Timestamp: ${ctx.query.timestamp}`)
        : '',
      el('button', {
        onclick() {
          ctx.router.back()
        },
      }, 'Go back'),
    ])
  }
}

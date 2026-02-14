import { el } from '@zero-dependency/dom'
import { RouteComponent } from 'navigation-router'
import type { RouteCtx } from 'navigation-router'

export class BlogRoute extends RouteComponent {
  constructor() {
    super({
      path: '/blog/:id',
    })
  }

  render(ctx: RouteCtx<{ Params: { id: string } }>) {
    const blogId = ctx.params.id

    return el('div', [
      el('h1', 'Blog Page'),
      el('p', `Blog ID: ${blogId}`),
      el(
        'div',
        { className: 'buttons' },
        el('button', {
          onclick() {
            ctx.router.back()
          },
        }, 'Go back'),
        el('button', {
          onclick() {
            ctx.router.push(`/blog/${Number(blogId) + 1}`)
          },
        }, 'Go to next blog'),
      ),
    ])
  }
}

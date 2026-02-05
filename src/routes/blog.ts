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
    const div = document.createElement('div')
    div.innerHTML = `<h1>Blog page: ${blogId}</h1>`

    const button = document.createElement('button')
    button.textContent = 'Go to next Blog'
    button.addEventListener('click', () => {
      ctx.router.push(`/blog/${Number(blogId) + 1}`)
    })

    const backButton = document.createElement('button')
    backButton.textContent = 'Back'
    backButton.addEventListener('click', () => {
      ctx.router.back()
    })

    div.appendChild(button)
    div.appendChild(backButton)
    return div
  }
}

import { RouteComponent } from 'navigation-router'
import type { RouteCtx } from 'navigation-router'

export class AboutRoute extends RouteComponent {
  constructor() {
    super({
      path: '/about',
      label: 'About',
    })
  }

  render(ctx: RouteCtx) {
    const div = document.createElement('div')
    div.innerHTML = '<h1>About page</h1>'

    const button = document.createElement('button')
    button.textContent = 'Go to Blog'
    button.addEventListener('click', () => {
      ctx.router.push('/blog/1')
    })

    div.appendChild(button)
    return div
  }
}

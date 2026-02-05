import { RouteComponent } from 'navigation-router'
import type { RouteCtx } from 'navigation-router'

export class HomeRoute extends RouteComponent {
  private div: HTMLDivElement | null = null

  constructor() {
    super({
      path: '/',
      label: 'Home',
    })

    this.handleClick = this.handleClick.bind(this)
  }

  render(ctx: RouteCtx<{ Query: { id: string } }>) {
    const div = document.createElement('div')
    div.innerHTML = `
      <h1>Home Page</h1>
      <p>Welcome!</p>
    `
    div.addEventListener('click', this.handleClick)

    const button = document.createElement('button')
    button.textContent = 'Go to About'
    button.addEventListener('click', () => {
      ctx.router.push('/about')
    })

    div.appendChild(button)
    this.div = div
    return div
  }

  handleClick() {
    console.log('Home clicked')
  }

  unmount() {
    if (!this.div) return
    this.div.removeEventListener('click', this.handleClick)
  }
}

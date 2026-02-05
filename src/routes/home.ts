import { el } from '@zero-dependency/dom'
import { RouteComponent } from 'navigation-router'
import type { RouteCtx } from 'navigation-router'

export class HomeRoute extends RouteComponent {
  cursorPointer: HTMLElement

  constructor() {
    super({
      path: '/',
      label: 'Home',
    })

    this.handleClick = this.handleClick.bind(this)
    this.handleMove = this.handleMove.bind(this)
  }

  handleClick() {
    console.info('Home clicked!')
  }

  handleMove(event: MouseEvent) {
    this.cursorPointer.textContent = `x: ${event.clientX} y: ${event.clientY}`
    console.log('Mouse moved! 🎉')
  }

  mount(ctx: RouteCtx) {
    this.cursorPointer = el('pre', 'x: 0 y: 0')
    this.el = el('div', [
      el('h1', 'Home Page'),
      el('p', 'Welcome back!'),
      this.cursorPointer,
      el('div', [
        el('button', {
          onclick: this.handleClick,
        }, 'Click me!'),
        el('button', {
          onclick() {
            ctx.router.push(`/about?timestamp=${Date.now()}`)
          },
        }, 'Go to About'),
        el('button', {
          onclick() {
            ctx.router.push('/blog/1')
          },
        }, 'Go to Blog'),
      ]),
    ])

    document.body.addEventListener('mousemove', this.handleMove)
  }

  unmount() {
    document.body.removeEventListener('mousemove', this.handleMove)
  }
}

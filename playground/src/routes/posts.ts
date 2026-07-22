import { el } from '@zero-dependency/dom'
import { RouteComponent } from 'navigation-router'
import type { RouteCtx } from 'navigation-router'

interface Post {
  userId: number
  id: number
  title: string
  body: string
}

type PostsCtx = RouteCtx<{ Query: { page?: string } }>

function parsePage(value: string | undefined): number {
  const page = Number(value)
  if (!Number.isInteger(page) || page < 1) return 1
  return Math.min(page, 10)
}

export class PostsRoute extends RouteComponent {
  private posts: Post[] = []
  private loading = false
  private page = 1
  private abortController?: AbortController
  private ctx?: PostsCtx

  constructor() {
    super({
      path: '/posts',
      label: 'Posts',
    })
  }

  setup(ctx: PostsCtx) {
    this.ctx = ctx
    this.posts = []
    this.loading = false
    this.page = parsePage(ctx.query.page)
    this.fetchPosts()
  }

  render() {
    const rows = this.posts.map(post => el('tr', [
      el('td', String(post.id)),
      el('td', String(post.userId)),
      el('td', post.title),
      el('td', post.body),
    ]))

    return el('section', [
      el('h1', 'Posts'),
      el('div', { className: 'buttons' }, [
        el('button', {
          disabled: this.page === 1 || this.loading,
          onclick: () => this.goToPage(this.page - 1),
        }, 'Previous Page'),
        el('span', `Page: ${this.page}`),
        el('button', {
          disabled: this.page === 10 || this.loading,
          onclick: () => this.goToPage(this.page + 1),
        }, 'Next Page'),
        this.loading ? el('span', 'Loading...') : '',
        el('button', {
          style: {
            marginLeft: 'auto',
          },
          onclick: () => {
            this.posts = [
              {
                id: Math.floor(Math.random() * 100),
                userId: 1,
                title: 'qui est esse',
                body: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas, quia.',
              },
              ...this.posts,
            ]
            this.ctx?.router.refresh()
          },
        }, 'Add Post'),
      ]),
      el('table', { className: 'posts-table' }, [
        el('thead', [
          el('tr', [
            el('th', 'ID'),
            el('th', 'User ID'),
            el('th', 'Title'),
            el('th', 'Body'),
          ]),
        ]),
        el('tbody', rows),
      ]),
    ])
  }

  unmount() {
    this.abortRequestPosts()
    this.ctx = undefined
  }

  private goToPage(page: number) {
    const next = Math.min(Math.max(page, 1), 10)
    const path = next <= 1 ? '/posts' : `/posts?page=${next}`
    this.ctx?.router.push(path)
  }

  abortRequestPosts() {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = undefined
    }
  }

  async fetchPosts() {
    this.abortRequestPosts()
    this.abortController = new AbortController()
    this.loading = true
    this.ctx?.router.refresh()

    try {
      const req = await fetch(`https://jsonplaceholder.typicode.com/posts?_page=${this.page}`, {
        signal: this.abortController.signal,
      })

      if (req.ok) {
        this.posts = await req.json()
        this.abortController = undefined
      }

      this.loading = false
      this.ctx?.router.refresh()
    } catch {
      // aborted or network error
    }
  }

  onLinkMouseEnter() {
    console.log('Posts link mouseenter — prefetch hook')
  }

  onLinkMouseLeave() {
    console.log('Posts link mouseleave')
  }
}

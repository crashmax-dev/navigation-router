import { el } from '@zero-dependency/dom'
import { signal } from 'alien-signals'
import { RouteComponent } from 'navigation-router'

interface Post {
  userId: number
  id: number
  title: string
  body: string
}

export class PostsRoute extends RouteComponent {
  private posts = signal<Post[]>([])
  private loading = signal(false)
  private page = signal(1)
  private abortController?: AbortController

  constructor() {
    super({
      path: '/posts',
      label: 'Posts',
    })
  }

  setup() {
    this.fetchPosts()
  }

  render() {
    const posts = this.posts()
    const page = this.page()
    const loading = this.loading()

    const rows = posts.map((post) => el('tr', [
      el('td', String(post.id)),
      el('td', String(post.userId)),
      el('td', post.title),
      el('td', post.body),
    ]))

    return el('div', [
      el('h1', 'Posts'),
      el('div', { className: 'buttons' }, [
        el('button', {
          disabled: page === 1,
          onclick: () => {
            this.page(page - 1)
            this.fetchPosts()
          },
        }, 'Previous Page'),
        el('span', `Page: ${page}`),
        el('button', {
          disabled: page === 10,
          onclick: () => {
            this.page(page + 1)
            this.fetchPosts()
          },
        }, 'Next Page'),
        loading ? el('span', 'Loading...') : '',
        el('button', {
          style: {
            marginLeft: 'auto',
          },
          onclick: () => {
            this.posts([
              {
                id: Math.floor(Math.random() * 100),
                userId: 1,
                title: 'qui est esse',
                body: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas, quia.',
              },
              ...posts,
            ])
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

  async fetchPosts() {
    if (this.loading()) return

    this.abortController = new AbortController()
    this.loading(true)

    try {
      const req = await fetch(`https://jsonplaceholder.typicode.com/posts?_page=${this.page()}`, {
        signal: this.abortController.signal,
      })

      if (req.ok) {
        this.posts(await req.json())
        this.abortController = undefined
      }
    } finally {
      this.loading(false)
    }
  }

  onLinkMouseEnter() {
    this.fetchPosts()
  }

  unmount() {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = undefined
    }
  }
}

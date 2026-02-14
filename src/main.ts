import { el } from '@zero-dependency/dom'
import {
  createRouter,
  HashAdapter,
  NavigationAdapter,
} from 'navigation-router'
import { AboutRoute } from './routes/about'
import { BlogRoute } from './routes/blog'
import { HomeRoute } from './routes/home'
import { PostsRoute } from './routes/posts'
import './style.css'

const router = createRouter({
  adapter: import.meta.env.DEV
    ? new NavigationAdapter(import.meta.env.BASE_URL)
    : new HashAdapter(),
  routes: [
    HomeRoute,
    AboutRoute,
    BlogRoute,
    PostsRoute,
  ],
  renderRoot: () => document.querySelector('#app'),
  navigationRoot: () => document.querySelector('#navigation'),
  navigationRenderLink: () => {
    const link = el('a', { className: 'link' })
    return link
  },
})

console.log(router)

// @ts-ignore debug
window.$router = router

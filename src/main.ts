import { el } from '@zero-dependency/dom'
import { createRouter, NavigationAdapter } from 'navigation-router'
import { AboutRoute } from './routes/about'
import { BlogRoute } from './routes/blog'
import { HomeRoute } from './routes/home'
import './style.css'

const router = createRouter({
  adapter: new NavigationAdapter(import.meta.env.BASE_URL),
  routes: [
    HomeRoute,
    AboutRoute,
    BlogRoute,
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

import { el } from '@zero-dependency/dom'
import { createRouter } from 'navigation-router'
import { AboutRoute } from './routes/about'
import { BlogRoute } from './routes/blog'
import { HomeRoute } from './routes/home'
import './style.css'

const router = createRouter({
  routes: [
    HomeRoute,
    AboutRoute,
    BlogRoute,
  ],
  renderRoot: () => document.querySelector('#app'),
  navigationRoot: () => document.querySelector('#navigation'),
  navigationRenderLink: (route) => {
    const link = el('a', {
      href: route.props.path,
      className: 'link',
    })
    return link
  },
})

console.log(router)

// @ts-ignore debug
window.$router = router

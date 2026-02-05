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
  navigationRenderLink: (route): HTMLElement => {
    const div = document.createElement('div')
    const a = document.createElement('a')
    a.href = route.props.path
    a.classList.add('link')
    div.append(a)
    return div
  },
})

router.init()

// @ts-ignore
window.$router = router

// .vitepress/theme/index.js

import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
// import PostTitle from './PostTitle.vue'
import PostFooter from './PostFooter.vue'

import { useData } from 'vitepress'
import './custom.css'

// export default DefaultTheme
export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      //'doc-before': () => {
      //  const { page } = useData()
      //  if (page.value.relativePath.match(/^posts\/(?!index.md)/)) {
      //    return h(PostTitle)
      //  }
      //},
      'doc-after': () => {
        const { page } = useData()
        if (page.value.relativePath.match(/^posts\/(?!index.md)/)) {
          return h(PostFooter)
        }
      }
    })
  }
}

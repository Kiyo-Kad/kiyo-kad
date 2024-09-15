import { computed } from 'vue'
import { data as posts } from './posts.data.js'
import { useData } from 'vitepress'

export function usePrevNext() {

  const { page } = useData()

  return computed(() => {

    // 2024/02/25 EX const { page } = useData()

    var prev = null
    var next = null

    for (let i = 0; i < posts.length; ++i) {
      if (posts[i].relativePath == page.value.relativePath) {
        if (i >= 1) {
          next = posts[i - 1];
        }
        if (i <= posts.length - 2) {
          prev = posts[i + 1];
        }
        break;
      }
    }

    return {
      prev: {
        text: prev?.frontmatter.title,
        link: prev?.url
      },
      next: {
        text: next?.frontmatter.title,
        link: next?.url
      }
    }
  })
}

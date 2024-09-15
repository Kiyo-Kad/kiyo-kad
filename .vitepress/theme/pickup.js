import { computed } from 'vue'
import { data as posts } from './posts.data.js'
import { useData } from 'vitepress'

export function usePickup() {

    const { page } = useData()

  return computed(() => {

    // const { page } = useData()

    return posts
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
      .filter(post => post.relativePath != page.value.relativePath)
      .slice(0, 5);
  })
}

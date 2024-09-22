---
title: 
date: 2023-03-10T21:57:03+09:00
next: false
prev: false
editLink: false
---

<script setup>
// import { useData } from 'vitepress'
import {withBase, useData } from 'vitepress';
import { data as posts } from '../../../.vitepress/theme/posts.data.js'

const { params } = useData()
const current_tag = params.value.tag

var pages = []
posts.forEach(post => {
    if (post.frontmatter.tags){
        var tags = post.frontmatter.tags.map(tag => { return tag.replaceAll(" ", "") })
        if (tags.includes(current_tag)) {
            pages.push(post)
        }
    }
})

</script>

<!-- @content -->

<ul>
  <li v-for="page of pages">
    <a :href="withBase(page.url)">{{ page.frontmatter.title }}</a>
  </li>
</ul>

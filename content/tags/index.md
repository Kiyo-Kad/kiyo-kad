---
title: "Tags"
date: 2023-03-10T21:57:03+09:00
next: false
prev: false
editLink: false
---

<script setup>
import { data as posts } from '../../.vitepress/theme/posts.data.js'
import {withBase} from 'vitepress';

var tags = {}
posts.forEach(post => {
    if (post.frontmatter.tags) {
        post.frontmatter.tags.forEach(tag => {
            if (tags[tag] === undefined) {
                tags[tag] = 1
            } else {
                tags[tag] += 1
            }
        })
    }
})

var tag_list = Object.keys(tags)
</script>

<h1>Tags</h1>
<ul>
  <li v-for="tag of tag_list">
    <a :href="withBase('/tags/' + encodeURIComponent(tag.replaceAll(' ', '')) + '/')">{{ tag }} ({{ tags[tag] }})</a>
  </li>
</ul>

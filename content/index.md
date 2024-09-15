---
theme: page
title: Kiyo-Kad
next: false
prev: false
editLink: false
---

<script setup>
import { data as posts } from '../.vitepress/theme/posts.data.js'
import { withBase } from 'vitepress';

</script>

# ソフトウェア・エンジニアの Notebook Pages

ソフトウェア・エンジニア Kiyo-Kad のメモ & 備忘録


<article v-for="post of posts" class="home-posts-article">
  <p>
    <a :href="withBase(post.url)" class="home-posts-article-title">{{ post.frontmatter.title }}</a>
  </p>
  <p>{{ post.frontmatter.description }}</p>
  <p>
    <a :href="withBase(post.url)">続きを読む</a>
  </p>
</article>

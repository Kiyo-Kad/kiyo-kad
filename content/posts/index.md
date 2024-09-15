---
theme: page
title: Posts
next: false
prev: false
editLink: false
---

<script setup>
import { data as posts } from '../../.vitepress/theme/posts.data.js'
import { withBase } from 'vitepress';


let arrs = [];
let tmpstr = '';
let pickyear = '';

// cal. years count (years sorted.)
// 2024/09/03 (Step1) pickup year group & make base array
for (var i = 0; i < Object.keys(posts).length; i++) {
    pickyear = posts[i].frontmatter.date.replace(/-[0-9]+-[0-9]+T[0-9:]+\.[0-9]+Z/g, '')
    if (pickyear !== tmpstr) {
        // articleYears.push(pickyear);
        arrs.push({group: pickyear, data: [] });
        tmpstr = pickyear;
    }
}

// 2024/09/03 (Step2) for setting base array (year group) to posts data
for (var i = 0; i < Object.keys(arrs).length; i++) {
    for (var j = 0; j < Object.keys(posts).length; j++) {
        pickyear = posts[j].frontmatter.date.replace(/-[0-9]+-[0-9]+T[0-9:]+\.[0-9]+Z/g, '')
        if (pickyear === arrs[i].group) {
            arrs[i].data.push({url: posts[j].url, title: posts[j].frontmatter.title})
        }
    }
}

// console.log(arrs)



// 2024/08/26 年単位のカテゴリー分け追加
// 2024/09/03 グループ処理変更 (グループ単位に配列作成とした)
// ## YEAR -> h2 :id...

</script>


# Posts

<template v-for="(arr, key) in arrs" :key="arr.group">
  <h2 :id="'_' + arr.group" tabindex="-1">{{arr.group}} <a class="header-anchor" :href="'#_' + arr.group" aria-label="Permalink to &quot;{{arr.group}}&quot;"> </a></h2>

  <ul>
    <li v-for="post of arr.data">
      <a :href="withBase(post.url)">{{ post.title }}</a>
    </li>
  </ul>
</template>


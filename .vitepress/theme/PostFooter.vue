<script setup lang="ts">
// 2024/02/20 EX <- _script setup_

import { usePrevNext } from './prev-next.js'
// import { usePickup } from './pickup.js'
import { withBase } from 'vitepress';

// (test notuse) import { computed } from 'vue'
//[1] import { data as postsX } from './posts.data.js'



// const pickup = usePickup()
const control = usePrevNext()


//const { page } = useData();

//[1] console.log(postsX[0].relativePath);


</script>

<template>
<div class="post-footer-container">
<!--
  <div class="edit-info">
    <div class="edit-link">
      <a class="edit-link-button" :href="withBase('/')">
        &lt; Back to Home
      </a>
    </div>
  </div>
-->

  <div class="prev-next">
   <ClientOnly>
    <div class="pager">
      <a v-if="control.prev?.link" class="pager-link prev" :href="withBase(control.prev?.link)">
        <span class="desc">Previous page</span>
        <span class="title" v-html="control.prev?.text"></span>
      </a>
    </div>

    <div class="pager" :class="{ 'has-prev' : control.prev }">
      <a v-if="control.next?.link" class="pager-link next" :href="withBase(control.next?.link)">
        <span class="desc">Next page</span>
        <span class="title" v-html="control.next?.text"></span>
      </a>
    </div>
   </ClientOnly>
  </div>

<!--
  <div class="post-footer-article-container">
   <ClientOnly>
    <h2>おすすめ記事</h2>
    <ul>
        <li v-for="post of pickup">
            <a :href="withBase(post.url)">{{ post.frontmatter.title }}</a>
        </li>
    </ul>
   </ClientOnly>
  </div>
-->
</div>
</template>

<style scoped>
.post-footer-article-container {
    margin-top: 150px;
}

.post-footer-article-container h2 {
    margin: 48px 0 16px;
    border-bottom: 1px solid var(--vp-c-divider);
    padding-bottom: 24px;
    letter-spacing: -0.02em;
    line-height: 32px;
    font-size: 24px;
    position: relative;
    font-weight: 600;
    outline: none;
}

.post-footer-article-container ul {
    list-style: disc;
}
.post-footer-article-container ul, .post-footer-article-container ol {
    padding-left: 1.25rem;
    margin: 16px 0;
}
.post-footer-article-container li + li {
    margin-top: 8px;
}
.post-footer-container {
  margin-top: 64px;
}
.post-footer-container .edit-info {
  padding-bottom: 18px;
}
@media (min-width: 640px) {
  .post-footer-container .edit-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 14px;
  }
}
.post-footer-container .edit-link-button {
  display: flex;
  align-items: center;
  border: 0;
  line-height: 32px;
  font-size: 14px;
  font-weight: 500;
  /* 2024/02/27 color: var(--vp-c-brand); */
  color: var(--vp-c-brand-1);
  transition: color 0.25s;
}
.post-footer-container .edit-link-button:hover {
  /* 2024/02/27 color: var(--vp-c-brand-dark); */
  color: var(--vp-c-brand-2);
}
.post-footer-container .edit-link-icon {
  margin-right: 8px;
  width: 14px;
  height: 14px;
  fill: currentColor;
}
.post-footer-container .prev-next {
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 24px;
}
@media (min-width: 640px) {
  .post-footer-container .prev-next {
    display: flex;
  }
}
.post-footer-container .pager.has-prev {
  padding-top: 8px;
}
@media (min-width: 640px) {
  .post-footer-container .pager {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: 50%;
  }
  .post-footer-container .pager.has-prev {
    padding-top: 0;
    padding-left: 16px;
  }
}
.post-footer-container .pager-link {
  display: block;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 11px 16px 13px;
  width: 100%;
  height: 100%;
  transition: border-color 0.25s;
}
.post-footer-container .pager-link:hover {
  /* 2024/02/27 EX border-color: var(--vp-c-brand); */
  border-color: var(--vp-c-brand-1);
}
.post-footer-container .pager-link.next {
  margin-left: auto;
  text-align: right;    /* 2024/02/27 EX */
}
.post-footer-container .desc {
  display: block;
  line-height: 20px;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}
.post-footer-container .title {
  display: block;
  line-height: 20px;
  font-size: 14px;
  font-weight: 500;
  /* 2024/02/27 color: var(--vp-c-brand); */
  color: var(--vp-c-brand-1);
  transition: color 0.25s;
}
</style>

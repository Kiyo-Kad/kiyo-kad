<script setup lang="ts">

import { useData, withBase } from 'vitepress'
import { ref, computed, watchEffect, onMounted } from 'vue';

const { theme, page, frontmatter, lang } = useData();

const date = computed(
  () => new Date(frontmatter.value.date ?? Date.now() )
)
const isoDatetime = computed(() => date.value.toISOString())
const datetime = ref('')

onMounted(() => {
  watchEffect(() => {
    datetime.value = new Intl.DateTimeFormat(
      theme.value.lastUpdated?.formatOptions?.forceLocale ? lang.value : undefined,
      theme.value.lastUpdated?.formatOptions ?? {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    ).format(date.value)
  })
})

</script>

<template>
<div class="vp-doc">
  <ClientOnly>
    <p>
    <span class="bx--calendar"></span><time :datetime="isoDatetime">{{ datetime }}</time>
    </p>
      <h1 v-if="frontmatter.title">{{ frontmatter.title }}</h1>
    <p>
        <a v-for="tag in frontmatter.tags" :href="withBase('/tags/' + encodeURIComponent(tag.replaceAll(' ', '')) + '/')"> #{{ tag }} </a>
    </p>
  </ClientOnly>
</div>
</template>

import { defineConfig } from 'vitepress'
import { withMermaid } from "vitepress-plugin-mermaid";

import { createWriteStream } from 'node:fs'
import { resolve } from 'node:path'
import { SitemapStream } from 'sitemap'

const links = []

// https://vitepress.dev/reference/site-config
// export default defineConfig({
export default withMermaid({

  title: "Kiyo-Kad",
  description: "A Kiyo-Kad's Site",

  base: '/kiyo-kad/',

  lang: "ja",
  cleanUrls: true,
  srcDir: './content/',

  rewrites: {
    'posts/(.*)/(.*)/:name/(.*)': 'posts/:name/index.md'
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      // { text: 'Examples', link: '/markdown-examples' }
      { text: 'About', link: '/about/' }
    ],

    sidebar: [
      {
        // text: 'Dev',
        items: [
          { text: 'Home', link: '/' },
          { text: 'About', link: '/about/' },
          { text: 'Posts', link: '/posts/' },
          { text: 'Tags', link: '/tags/' }
        ]
      },

    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Kiyo-Kad/kiyo-kad' }
    ],

    editLink: {
      pattern: 'https://github.com/Kiyo-Kad/kiyo-kad/edit/main/:path',
      text: 'Edit this page on GitHub'
    },

    externalLinkIcon: true,

  },

  lastUpdated: true,

  // your existing vitepress config...
  // optionally, you can pass MermaidConfig
  mermaid: {
    // refer https://mermaid.js.org/config/setup/modules/mermaidAPI.html#mermaidapi-configuration-defaults for options
  },
  // optionally set additional config for plugin itself with MermaidPluginConfig
  mermaidPlugin: {
    class: "mermaid my-class", // set additional css classes for parent container 
  },

  transformHtml: (_, id, { pageData }) => {
    // for sitemap
    if (!/[\\/]404\.html$/.test(id)) {
      links.push({
        // 2024/10/19 EX  url: pageData.relativePath.replace(/((^|\/)index)?\.md$/, '$2'),
        url: pageData.relativePath.replace(/((^|\/)index)?\.md$/, '$2'+ '.html'),
        lastmod: pageData.frontmatter.date
      })
    }
  },
  buildEnd: ({ outDir }) => {
    // sitemap
    const sitemap = new SitemapStream({ hostname: 'https://kiyo-kad.github.io/kiyo-kad/' })
    const sitemapStream = createWriteStream(resolve(outDir, 'sitemap.xml'))
    sitemap.pipe(sitemapStream)
    links.forEach((link) => sitemap.write(link))
    sitemap.end()
  },

})

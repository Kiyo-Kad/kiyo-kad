import { defineConfig } from 'vitepress'
import { withMermaid } from "vitepress-plugin-mermaid";

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
          // { text: 'Tags', link: '/tags/' }
        ]
      },

/* *****
    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
***** */
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Kiyo-Kad/kiyo-kad' }
    ],

    editLink: {
      pattern: 'https://github.com/Kiyo-Kad/kiyo-kad/edit/main/:path',
      text: 'Edit this page on GitHub'
    },

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

})

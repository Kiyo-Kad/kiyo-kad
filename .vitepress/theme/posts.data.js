import { createContentLoader } from 'vitepress'

// 2024/03/27 EX  export default createContentLoader('content/posts/**/*.md', {
// differ org (https://nshmura.com/)
export default createContentLoader('posts/**/*.md', {
    includeSrc: false,
    transform(rawData) {
        return rawData
            // .filter(page => page.url != "/content/posts/index")
            .filter(page => page.url != "/posts/")
            .sort((a, b) => {
                // date DESC
                return +new Date(b.frontmatter.date) - +new Date(a.frontmatter.date)
            })
            .map(page => {
                // page.relativePath = page.url.replace(/^\/content\/posts\/[0-9]+\/[0-9]+\//g, 'posts/') + ".md";
                // page.url = page.url.replace(/^\/content\/posts\/[0-9]+\/[0-9]+\//g, '/posts/').replace(/index$/g, '');
                // 2024/03/26 page.relativePath = page.url.replace(/^\/posts\/[0-9]+\/[0-9]+\//g, 'posts/') + ".md";
                page.relativePath = page.url.replace(/^\/posts\/[0-9]+\/[0-9]+\//g, 'posts/') + "index.md";
                // 2024/08/29 [postYear] is not set, because vitepress DEV (hot update) error !
                // (not use, map func. systax error !) page.postYear = page.url.match(/^\/posts\/[0-9]+\//g)[0].match(/[0-9]+/g)[0];
                page.url = page.url.replace(/^\/posts\/[0-9]+\/[0-9]+\//g, '/posts/').replace(/index$/g, '');
                return page;
            })
      }
})

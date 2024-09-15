---
theme: page
title: このサイトについて
date: 2024-09-08T19:18:30+09:00
next: false
prev: false
---

<script setup>
// import { data as posts } from '../.vitepress/theme/posts.data.js'
import { withBase } from 'vitepress';


</script>

# ソフトウェア・エンジニアの Notebook Pages


## ソフトウェア・エンジニア kiyo-kad の備忘録 (Notebook)

### 初めに

当サイトは、**SSG (Static Site Generator)** にて、ソフトウェアや各種設定情報などを保管・公開する目的で開設しました。  

技術情報の公開用のツールとして、Blog 系のデファクトスタンダードも使ってみました。  
ですが、Markdown ファイルを使うには、皆さんいろいろと工夫をされてるようでした。  

<mark>:thinking: これが"面倒"と感じたのです。</mark>  

入力も慣れていないので、たいそう手間に感じました。（昔入力したのと特に変わった感がない）まともに運用しようとすると、
これもそれなりのプラグインやカスタマイズが必要です。
加えて実用に耐えるには、たくさんのプラグインの追加とかなりの頻度で更新される Blog システム本体の更新も面倒に感じました。  

他に適当は候補がないか・・と探した結果この **VitePress (Static Site Generator)** にたどり着きました。
使てみると、コンパイルは必要なものの、お気に入りの Vue3 を使っているので、カスタマイズも容易だと思いました。
実際は、 Composition API と従来の記述方法 Options API との記述差異があり、だいぶ苦戦はしています（笑）。
ですが、少ないなりにも、公式ドキュメントや、先達の皆さんのおかげで、それらしくカスタマイズできました。

特に参考にさせて頂いたサイトは、[こちら→](https://nshmura.com/posts/migration-to-vitepress/){target="_blank"}になります。  
ありがとうございます。

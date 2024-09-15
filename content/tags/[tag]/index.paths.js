import fs from 'fs'
import { globSync } from 'glob'

var tags = {}

var files = globSync('content/posts/**/*.md');

files.forEach(file => {
  var data = fs.readFileSync(file, 'utf8');
  var found = data.match(/^tags:\s*\[(.+)\]\s*$/m)
  if (found) {
    found[1].split(",")
      .map(tag => { return tag.replaceAll('"', '') })
      .forEach(tag => {
      tags[tag.replaceAll(' ', '')] = tag
    })
  }
});

export default {
  paths: () => {
      return Object.keys(tags).map((key) => {
        return { params: { tag: key }, content: `# ${tags[key]}`}
      })
  }
}

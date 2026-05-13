const hljs = require('highlight.js/lib/core');
const javascript = require('highlight.js/lib/languages/javascript');
hljs.registerLanguage('javascript', javascript);

const jsDom = require('jsdom');
const { JSDOM } = jsDom;
const dom = new JSDOM(`<pre><code class="language-javascript">const a = 1;</code></pre>`);
const block = dom.window.document.querySelector('code');

hljs.highlightElement(block);
console.log(block.outerHTML);

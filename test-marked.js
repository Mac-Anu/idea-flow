const { marked } = require('marked');
console.log(marked.parse('| a | b |\n|---|---|\n| 1 | 2 |'));

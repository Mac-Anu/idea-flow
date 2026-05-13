import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

const json = {
  type: 'doc',
  content: [
    {
      type: 'codeBlock',
      attrs: { language: 'javascript' },
      content: [{ type: 'text', text: 'const a = 1;' }]
    }
  ]
};

const html = generateHTML(json, [
  StarterKit.configure({ codeBlock: false }),
  CodeBlockLowlight.configure({ lowlight })
]);

console.log(html);

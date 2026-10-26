import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import { parseFragment } from 'parse5';

const markdown = remark().use(remarkGfm).data('settings', { bullet: '-', fences: true, listItemIndent: 'one' });
const escape = value => value.replace(/[\\`*_[\]<>]/g, '\\$&');

function sourceHtmlToMarkdown(source) {
  function render(node) {
    if (node.nodeName === '#text') return escape(node.value.replace(/\s+/g, ' '));
    const attrs = Object.fromEntries((node.attrs ?? []).map(attr => [attr.name, attr.value]));
    if (['script', 'style', 'button', 'input', 'select', 'svg', 'template', 'iframe'].includes(node.tagName)
      || 'hidden' in attrs || attrs['aria-hidden'] === 'true'
      || /display\s*:\s*none|visibility\s*:\s*hidden/i.test(attrs.style ?? '')
      || /support-(?:qr-overlay|toast|card-icon)/.test(attrs.class ?? '')) return '';
    const content = (node.childNodes ?? []).map(render).join('');
    if (/^h[1-6]$/.test(node.tagName ?? '')) return `\n\n${'#'.repeat(Number(node.tagName[1]))} ${content.trim()}\n\n`;
    if (node.tagName === 'a') return attrs.href ? `[${content.trim() || escape(attrs.href)}](<${attrs.href}>)` : content;
    if (node.tagName === 'img') return attrs.src ? `![${escape(attrs.alt ?? '')}](<${attrs.src}>)` : '';
    if (['strong', 'b'].includes(node.tagName)) return `**${content}**`;
    if (['em', 'i'].includes(node.tagName)) return `*${content}*`;
    if (node.tagName === 'br') return '\n';
    if (node.tagName === 'li') return `\n- ${content.trim()}\n`;
    if (['p', 'div', 'section', 'article', 'header', 'footer', 'ul', 'ol'].includes(node.tagName)) return `\n\n${content.trim()}\n\n`;
    return content;
  }
  return render(parseFragment(source));
}

function expandShortcodes(source, options) {
  const code = [];
  const rawBlocks = [...source.matchAll(/\{\{[<%]\s*rawhtml\s*[>%]\}\}[\s\S]*?\{\{[<%]\s*\/rawhtml\s*[>%]\}\}/g)]
    .map(match => ({ start: match.index, end: match.index + match[0].length }));
  let marker = 'AILITERALPROTECTX';
  while (source.includes(marker)) marker += 'X';
  function protect(node) {
    if (node.type === 'code' || node.type === 'inlineCode') {
      if (!rawBlocks.some(block => node.position.start.offset >= block.start && node.position.end.offset <= block.end)) code.push(node.position);
    } else node.children?.forEach(protect);
  }
  protect(markdown.parse(source));
  const literals = code.map(position => source.slice(position.start.offset, position.end.offset));
  for (let index = code.length - 1; index >= 0; index--) {
    source = source.slice(0, code[index].start.offset) + `${marker}${index}END` + source.slice(code[index].end.offset);
  }
  source = source.replace(/\{\{[<%]\s*rawhtml\s*[>%]\}\}([\s\S]*?)\{\{[<%]\s*\/rawhtml\s*[>%]\}\}/g,
    (_, html) => sourceHtmlToMarkdown(html));
  source = source.replace(/\{\{[<%]\s*(?:relref|ref)\s+["']([^"']+)["']\s*[>%]\}\}/g, (_, reference) => {
    const [file, fragment] = reference.split('#');
    const resolved = options.references?.[file.replace(/^\//, '')];
    if (!resolved) throw new Error(`Unresolved relref: ${reference} on ${options.canonical}`);
    return resolved + (fragment ? `#${fragment}` : '');
  });
  source = source.replace(/\{\{[<%]\s*replit\s+src=["']([^"']+)["']\s*[>%]\}\}/g, (_, url) => `[Open the embedded code example](<${url}>)`);
  source = source.replace(/\{\{[<%]\s*highlight\s+([\w-]+)[^>]*[>%]\}\}([\s\S]*?)\{\{[<%]\s*\/highlight\s*[>%]\}\}/g,
    (_, language, body) => `\n\n\`\`\`\`${language}\n${body.trim()}\n\`\`\`\`\n\n`);
  if (/\{\{[<%]/.test(source)) throw new Error(`Unsupported shortcode on ${options.canonical}`);
  return source.replace(new RegExp(`${marker}(\\d+)END`, 'g'), (_, index) => literals[Number(index)]);
}

export function formatMarkdown(source, options) {
  const tree = markdown.parse(expandShortcodes(source, options));
  function visit(node) {
    if (['link', 'image', 'definition'].includes(node.type)) {
      const absolute = new URL(node.url, options.canonical);
      node.url = options.htmlByMarkdown?.[absolute.href] ?? absolute.href;
    }
    if (node.children) {
      // Hugo's default Goldmark configuration omits raw HTML outside explicit rawhtml shortcodes.
      node.children = node.children.filter(child => child.type !== 'html');
      node.children.forEach(visit);
    }
  }
  visit(tree);
  return markdown.stringify(tree);
}

export function markdownTitle(source) {
  const tree = markdown.parse(source);
  const heading = tree.children.find(node => node.type === 'heading');
  const plain = node => node.value ?? node.children?.map(plain).join('') ?? '';
  return heading ? plain(heading) : '';
}

// Rehype plugin: rewrite `<a href="*.md">` cross-links to dashboard routes,
// using a prebuilt filename->route map. Applies to every body rendered through
// the Astro markdown pipeline (render()/<Content/>): plan detail, questions,
// and the now-view in-flight cards. Log bodies bypass this pipeline (they use
// renderInline), so they call rewriteMdHref directly.
//
// Hand-walks the hast tree to avoid a unist-util-visit dependency.

import { rewriteMdHref } from './md-links.mjs';

export default function rehypeMdLinks(options = {}) {
  const map = options.map;

  function visit(node) {
    if (
      node.type === 'element' &&
      node.tagName === 'a' &&
      node.properties &&
      typeof node.properties.href === 'string'
    ) {
      node.properties.href = rewriteMdHref(node.properties.href, map);
    }
    if (node.children) {
      for (const child of node.children) visit(child);
    }
  }

  return (tree) => visit(tree);
}

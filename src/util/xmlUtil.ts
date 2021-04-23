import { Node, Element } from 'libxmljs2';
import * as _ from 'lodash';

export function isElement(node: Node): node is Element {
  return node.type() === 'element';
}

export function assertElement(node: Node): Element {
  if (node instanceof Element) {
    return node;
  } else {
    throw new Error('Expected element but got node.');
  }
}

export function defineNamespaceSafe(el: Element, prefix: string, href: string) {
  const hasNamespace = _.some(el.namespaces(), ns => ns.prefix() === prefix);
  if (!hasNamespace) {
    el.defineNamespace(prefix, href);
  }
}

export function defineNamespaceOnRoot(el: Element, prefix: string, href: string) {
  const root = el.doc().root()!;
  const hasNamespace = _.some(root.namespaces(), ns => ns.prefix() === prefix);
  if (!hasNamespace) {
    root.defineNamespace(prefix, href);
  }
}

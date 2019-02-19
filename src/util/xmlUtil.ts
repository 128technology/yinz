import { Node, Element } from 'libxmljs';

export function isElement(node: Node): node is Element {
  return node.type() === 'element';
}

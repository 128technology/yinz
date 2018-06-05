export enum Visibility {
  visible = 'visible',
  hidden = 'hidden',
  advanced = 'advanced',
  prototype = 'prototype'
}

export function isVisible(visibility: Visibility) {
  return visibility === Visibility.visible || visibility === Visibility.advanced;
}

export default Visibility;

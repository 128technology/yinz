export enum Visibility {
  visible = 'visible',
  hidden = 'hidden',
  advanced = 'advanced'
}

export function isVisible(visibility: Visibility) {
  return visibility === Visibility.visible || visibility === Visibility.advanced;
}

export default Visibility;

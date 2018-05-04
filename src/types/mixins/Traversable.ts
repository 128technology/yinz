import { Type } from '../';

function hasChildTypes(type: any): type is Traversable {
  return (type as Traversable).childTypes !== undefined;
}

export default class Traversable {
  public childTypes: () => Type[];

  /**
   * Executes the given strategy on each node of this type's type tree
   *
   * @param action - Strategy to apply to each type
   */
  public traverse(action: (type: Type) => void) {
    const stack: Type[] = [this as any];
    while (stack.length > 0) {
      const popped = stack.pop();
      action(popped);
      if (hasChildTypes(popped)) {
        stack.push(...popped.childTypes());
      }
    }
  }
}

// See: https://github.com/128technology/yinsolidated/blob/master/docs/Format.md

export function enumValueOf(value: string): ContextNode | null {
  if (Object.keys(ContextNode).indexOf(value) !== -1) {
    return ContextNode[value as keyof typeof ContextNode];
  } else {
    return null;
  }
}

export enum ContextNode {
  parent
}

export default ContextNode;
